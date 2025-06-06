package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"myapp/model"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

// Variabel global (atau bagian struct, tergantung arsitektur)
var ackChans = sync.Map{} // map[int]chan bool
// Publish dengan blast sampai dapat ACK, lalu broadcast ACK status ke semua device
func PublishOrderUntilAck(client mqtt.Client, payload model.MqttPayload, db *gorm.DB) {
	if payload.ID <= 0 {
		log.Println("ID payload tidak valid, tidak akan blast.")
		return
	}

	ackChan := make(chan bool)
	if _, loaded := ackChans.LoadOrStore(payload.ID, ackChan); loaded {
		log.Printf("Order ID %d sudah dalam proses blast (dari LoadOrStore), batal blast ulang.\n", payload.ID)
		return
	}
	defer ackChans.Delete(payload.ID)

	// Cek ulang ke DB apakah order sudah confirm_by atau tidak sebelum mulai blast
	var order model.DapurOrder
	if err := db.First(&order, payload.ID).Error; err != nil {
		log.Printf("Gagal cek order ID %d di DB: %v\n", payload.ID, err)
		return
	}
	if order.ConfirmBy != "" {
		log.Printf("Order ID %d sudah di-ACK di DB, batal blast ulang.\n", payload.ID)
		return
	}

	// Proses blast pesan MQTT
	topic := "dapur/order"
	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Println("Gagal encode JSON untuk MQTT:", err)
		return
	}

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ackChan:
			log.Printf("ACK diterima untuk order ID %d, berhenti blast pesan.\n", payload.ID)
			return
		case <-ticker.C:
			token := client.Publish(topic, 0, false, jsonData)
			token.Wait()
			log.Println("Pesan MQTT terkirim (blast):", string(jsonData))
		}
	}
}

// Fungsi untuk broadcast status "Pegawai mengambil" ke semua device
func BroadcastAckStatus(client mqtt.Client, id int, deviceID string) {
	payload := model.MqttPayload{
		ID:       id,
		Status:   "Pegawai mengambil",
		DeviceID: deviceID,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Println("Gagal encode JSON untuk broadcast ACK:", err)
		return
	}

	token := client.Publish("dapur/order", 0, false, jsonData)
	token.Wait()
	log.Printf("Broadcast status ACK ke semua device untuk order ID %d oleh device %s\n", id, deviceID)
	log.Printf("Payload broadcast: %s\n", string(jsonData))
}

func HandleAckMessage(client mqtt.Client, msg mqtt.Message, db *gorm.DB) {
	log.Println("ACK diterima:", string(msg.Payload()))

	var ackPayload struct {
		ID       int    `json:"id"`
		DeviceID string `json:"device_id"`
	}

	// Parsing payload dari ACK
	if err := json.Unmarshal(msg.Payload(), &ackPayload); err != nil {
		log.Println("Gagal parsing ACK payload:", err)
		return
	}

	var order model.DapurOrder
	if err := db.First(&order, ackPayload.ID).Error; err != nil {
		log.Println("Order tidak ditemukan:", err)
		return
	}

	// Cek apakah sudah dikonfirmasi sebelumnya
	if order.ConfirmBy != "" {
		log.Printf("Order ID %d sudah dikonfirmasi oleh %s, abaikan dari %s\n",
			ackPayload.ID, order.ConfirmBy, ackPayload.DeviceID)
		return
	}

	// Update kolom ConfirmBy
	if err := db.Model(&order).
		Update("confirm_by", ackPayload.DeviceID).Error; err != nil {
		log.Println("Gagal update ConfirmBy di DB:", err)
		return
	}

	log.Printf("ConfirmBy order ID %d diupdate dengan device %s\n", ackPayload.ID, ackPayload.DeviceID)

	// Kirim broadcast ACK ke semua device
	BroadcastAckStatus(client, ackPayload.ID, ackPayload.DeviceID)

	// Hentikan blast jika channel ACK-nya masih ada
	if ch, ok := ackChans.Load(ackPayload.ID); ok {
		if ackChan, ok := ch.(chan bool); ok {
			select {
			case ackChan <- true:
				log.Printf("Blast dihentikan untuk order ID %d\n", ackPayload.ID)
			default:
				log.Printf("Channel ACK untuk order ID %d sudah ditutup atau sibuk\n", ackPayload.ID)
			}
		}
	}
}

// Menjalankan reblast order yang belum dapat ACK
func StartPeriodicReblast(db *gorm.DB, mqttClient mqtt.Client) {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for {
			<-ticker.C
			ReblastPendingOrders(db, mqttClient)
		}
	}()
}

func ReblastPendingOrders(db *gorm.DB, mqttClient mqtt.Client) {
	var pendingOrders []model.DapurOrder
	if err := db.Where("status = ? AND confirm_by IS NULL", "Siap Antar").Find(&pendingOrders).Error; err != nil {
		log.Println("Gagal ambil pending orders untuk reblast:", err)
		return
	}

	for _, order := range pendingOrders {
		// Cek apakah sudah ada channel untuk ID ini
		if _, exists := ackChans.Load(order.ID); exists {
			log.Printf("Order ID %d sudah dalam proses blast, skip.\n", order.ID)
			continue
		}

		payload := model.MqttPayload{
			ID:      int(order.ID),
			TableID: order.TableID,
			Status:  order.Status,
		}
		go PublishOrderUntilAck(mqttClient, payload, db)
	}
}

// Parsing pesan status dari ESP (hasil tombol)
func ParsingMessageFromMQTT(db *gorm.DB, broadcastFunc func(string)) mqtt.MessageHandler {
	return func(client mqtt.Client, msg mqtt.Message) {
		log.Printf("Pesan MQTT diterima dari [%s]: %s\n", msg.Topic(), string(msg.Payload()))

		var payload struct {
			Status  string `json:"status"`
			TableID int    `json:"table_id"`
			ID      int    `json:"id"`
		}

		if err := json.Unmarshal(msg.Payload(), &payload); err != nil {
			log.Printf("Gagal parsing JSON dari MQTT: %v\n", err)
			return
		}

		if payload.ID <= 0 {
			log.Printf("ID yang diterima tidak valid: %d\n", payload.ID)
			return
		}

		var order model.DapurOrder
		if err := db.First(&order, payload.ID).Error; err != nil {
			log.Printf("Order tidak ditemukan untuk ID %d: %v\n", payload.ID, err)
			return
		}

		order.Status = payload.Status
		if err := db.Save(&order).Error; err != nil {
			log.Printf("Gagal update status order: %v\n", err)
			return
		}

		log.Printf("Status order dengan ID %d berhasil diperbarui ke '%s'\n", payload.ID, payload.Status)

		var dapurOrders []model.DapurOrder
		if err := db.Preload("OrderItems").Order("id DESC").Find(&dapurOrders).Error; err != nil {
			log.Printf("Gagal ambil data dapur untuk broadcast: %v\n", err)
			return
		}

		go func() {
			if jsonData, err := json.Marshal(dapurOrders); err == nil {
				broadcastFunc(string(jsonData))
			}
		}()
	}
}

func SetupBlastEndpoint(r *gin.Engine, db *gorm.DB, mqttClient mqtt.Client) {
	r.POST("/dapur/ws/blast", func(c *gin.Context) {
		var order model.DapurOrder

		// Bind JSON body ke struct order
		if err := c.BindJSON(&order); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
			return
		}

		// Cek status harus "Siap Antar"
		if order.Status != "Siap Antar" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Order status bukan 'Siap Antar'"})
			return
		}

		// Konversi ke payload untuk MQTT
		payload := model.MqttPayload{
			ID:      int(order.ID),
			TableID: order.TableID,
			Status:  order.Status,
		}

		// Jalankan blast hingga ACK diterima (async)
		go PublishOrderUntilAck(mqttClient, payload, db)

		// Response sukses langsung
		c.JSON(http.StatusOK, gin.H{"message": "Blast dimulai untuk order ID", "id": order.ID})
	})
}

// Fungsi update order, yang sekarang memulai blast sampai ACK diterima
func UpdateDapurOrder(c *gin.Context, db *gorm.DB, mqttClient mqtt.Client, broadcastFunc func(string)) {
	orderID := c.Param("id")
	orderIDInt, err := strconv.Atoi(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var dapurOrder model.DapurOrder

	if err := db.First(&dapurOrder, orderIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	var input struct {
		Action bool `json:"action"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	dapurOrder.Action = input.Action
	if input.Action {
		dapurOrder.Status = "Siap Antar"
	} else {
		dapurOrder.Status = "Belum Dibuat"
	}

	if err := db.Save(&dapurOrder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	// Kirim pesan MQTT tanpa foodNames
	payload := model.MqttPayload{
		ID:      int(dapurOrder.ID),
		TableID: dapurOrder.TableID,
		Status:  dapurOrder.Status,
	}

	// Blast kirim sampai dapat ACK (jalan di goroutine)
	go PublishOrderUntilAck(mqttClient, payload, db)

	// Ambil order items utk broadcast frontend
	var orderItems []model.OrderItem
	if err := db.Where("order_id = ?", orderIDInt).Find(&orderItems).Error; err != nil {
		log.Println("Gagal ambil order items:", err)
	}

	dapurOrderWithItems := struct {
		model.DapurOrder
		OrderItems []model.OrderItem `json:"order_items"`
	}{
		DapurOrder: dapurOrder,
		OrderItems: orderItems,
	}

	go func() {
		if jsonData, err := json.Marshal(dapurOrderWithItems); err == nil {
			broadcastFunc(string(jsonData))
		} else {
			log.Println("Failed to marshal order for WebSocket:", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Order updated", "data": dapurOrder})
}

func DapurOrder(r *gin.Engine, db *gorm.DB, mqttClient mqtt.Client, broadcastFunc func(string)) {
	r.GET("/dapur", func(c *gin.Context) {
		var dapurOrders []model.DapurOrder

		// Preload OrderItems berdasarkan foreign key OrderID
		if err := db.Preload("OrderItems").
			Order("CASE WHEN status = 'Belum Dibuat' THEN 1 WHEN status = 'Siap Antar' THEN 2 WHEN status = 'Pegawai selesai mengantar' THEN 3 ELSE 4 END").
			Order("id ASC").Find(&dapurOrders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dapur orders"})
			return
		}

		// Kirim response HTTP langsung
		c.JSON(http.StatusOK, gin.H{
			"message": "Dapur orders fetched successfully",
			"data":    dapurOrders,
		})

		// Broadcast ke WebSocket client
		go func() {
			if jsonData, err := json.Marshal(dapurOrders); err == nil {
				broadcastFunc(string(jsonData))
			}
		}()
	})

	// Endpoint untuk mendapatkan satu pesanan berdasarkan Table ID
	r.GET("/dapur/:id", func(c *gin.Context) {
		id := c.Param("id")
		tableID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		var dapurOrder model.DapurOrder
		// Query database untuk mengambil data dari dapurs berdasarkan Table ID
		if err := db.Where("table_id = ?", tableID).Preload("OrderItems").First(&dapurOrder).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found in dapur"})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Dapur order data fetched successfully",
			"data":    dapurOrder,
		})
	})

	// Endpoint untuk update status pesanan dan kirim MQTT
	r.PUT("/dapur/:id", func(c *gin.Context) {
		UpdateDapurOrder(c, db, mqttClient, broadcastFunc)

	})
}

func AddNewMenu(r *gin.Engine, db *gorm.DB) {
	// Handler untuk upload gambar dan tambah menu makanan
	r.POST("/addMenuMakanan", func(c *gin.Context) {
		var menu model.Makanan

		// Ambil file gambar dari form-data
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File upload required"})
			return
		}

		// Simpan gambar ke folder images/
		uploadDir := "images"
		os.MkdirAll(uploadDir, os.ModePerm) // Pastikan folder ada

		// Format ulang nama file untuk menghindari konflik
		filename := strings.ReplaceAll(file.Filename, " ", "_") // Hindari spasi di nama file
		filePath := filepath.Join(uploadDir, filename)

		// Simpan file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Pastikan path yang disimpan di database menggunakan images/
		imagePath := filepath.ToSlash(filePath)
		// Bind form-data ke struct Makanan
		menu.Nama = c.PostForm("Nama")
		menu.Deskripsi = c.PostForm("Deskripsi")

		// Validasi harga
		harga, err := strconv.Atoi(c.PostForm("Harga"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price format"})
			return
		}
		menu.Harga = harga

		// Simpan path gambar di database dengan format images/
		menu.Image = imagePath

		// Simpan data menu ke database
		if err := db.Create(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create menu"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Menu created successfully", "data": menu})
	})
	// Handler untuk upload gambar dan tambah menu minuman
	r.POST("/addMenuMinuman", func(c *gin.Context) {
		var menu model.Minuman

		// Ambil file gambar dari form-data
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File upload required"})
			return
		}

		// Simpan gambar ke folder uploads/
		uploadDir := "images"
		os.MkdirAll(uploadDir, os.ModePerm) // Pastikan folder ada

		// Format ulang nama file untuk menghindari konflik
		filename := strings.ReplaceAll(file.Filename, " ", "_") // Hindari spasi di nama file
		filePath := filepath.Join(uploadDir, filename)

		// Simpan file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Pastikan path yang disimpan di database menggunakan images/
		imagePath := filepath.ToSlash(filePath)

		// Bind form-data ke struct Makanan
		menu.Nama = c.PostForm("Nama")
		menu.Deskripsi = c.PostForm("Deskripsi")

		// Validasi harga
		harga, err := strconv.Atoi(c.PostForm("Harga"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price format"})
			return
		}
		menu.Harga = harga

		// Simpan path gambar di database dengan format images/
		menu.Image = imagePath

		// Simpan data menu ke database
		if err := db.Create(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create menu"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Menu created successfully", "data": menu})
	})

	// Handler untuk upload gambar dan tambah menu snack
	r.POST("/addMenuSnack", func(c *gin.Context) {
		var menu model.Snack

		// Ambil file gambar dari form-data
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File upload required"})
			return
		}

		// Simpan gambar ke folder uploads/
		uploadDir := "images"
		os.MkdirAll(uploadDir, os.ModePerm) // Pastikan folder ada

		// Format ulang nama file untuk menghindari konflik
		filename := strings.ReplaceAll(file.Filename, " ", "_") // Hindari spasi di nama file
		filePath := filepath.Join(uploadDir, filename)

		// Simpan file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Pastikan path yang disimpan di database menggunakan images/
		imagePath := filepath.ToSlash(filePath)

		// Bind form-data ke struct Makanan
		menu.Nama = c.PostForm("Nama")
		menu.Deskripsi = c.PostForm("Deskripsi")

		// Validasi harga
		harga, err := strconv.Atoi(c.PostForm("Harga"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price format"})
			return
		}
		menu.Harga = harga

		// Simpan path gambar di database dengan format images/
		menu.Image = imagePath

		// Simpan data menu ke database
		if err := db.Create(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create menu"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Menu created successfully", "data": menu})
	})
}

func DeleteMenu(r *gin.Engine, db *gorm.DB) {
	r.DELETE("/deleteMenuMakanan/:id", func(c *gin.Context) {
		id := c.Param("id")
		menuID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		var menu model.Makanan
		if err := db.Where("id = ?", menuID).Delete(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete menu"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Menu deleted successfully"})
	})

	r.DELETE("/deleteMenuMinuman/:id", func(c *gin.Context) {
		id := c.Param("id")
		menuID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		var menu model.Minuman
		if err := db.Where("id = ?", menuID).Delete(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete menu"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Menu deleted successfully"})
	})

	r.DELETE("/deleteMenuSnack/:id", func(c *gin.Context) {
		id := c.Param("id")
		menuID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		var menu model.Snack
		if err := db.Where("id = ?", menuID).Delete(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete menu"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Menu deleted successfully"})
	})
}

func EditMenu(r *gin.Engine, db *gorm.DB) {
	r.PUT("/editMenuMakanan/:id", func(c *gin.Context) {
		id := c.Param("id")
		menuID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		var menu model.Makanan
		if err := db.Where("id = ?", menuID).First(&menu).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Menu not found"})
			return
		}

		// Debugging: Cek data yang dikirim
		fmt.Println("Nama:", c.PostForm("Nama"))
		fmt.Println("Deskripsi:", c.PostForm("Deskripsi"))
		fmt.Println("Harga:", c.PostForm("Harga"))

		nama := c.PostForm("Nama")
		deskripsi := c.PostForm("Deskripsi")
		hargaStr := c.PostForm("Harga")

		if hargaStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Harga tidak boleh kosong"})
			return
		}

		harga, err := strconv.Atoi(hargaStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price format"})
			return
		}

		// Handle upload gambar
		file, err := c.FormFile("images")
		if err == nil {
			// Simpan file gambar
			imagePath := fmt.Sprintf("images/%s", file.Filename)
			if err := c.SaveUploadedFile(file, imagePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
				return
			}
			menu.Image = imagePath // Update path gambar
		} else {
			fmt.Println("No image uploaded")
		}

		// Update data menu
		menu.Nama = nama
		menu.Deskripsi = deskripsi
		menu.Harga = harga

		// Simpan ke database
		if err := db.Save(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update menu"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Menu updated", "data": menu})
	})

	r.PUT("/editMenuMinuman/:id", func(c *gin.Context) {
		id := c.Param("id")
		menuID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		var menu model.Minuman
		if err := db.Where("id = ?", menuID).First(&menu).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Menu not found"})
			return
		}

		// Ambil data dari form-data
		nama := c.PostForm("Nama")
		deskripsi := c.PostForm("Deskripsi")
		harga, err := strconv.Atoi(c.PostForm("Harga"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price format"})
			return
		}

		// Handle upload gambar
		file, err := c.FormFile("images")
		if err == nil {
			// Simpan file gambar di folder tertentu
			imagePath := fmt.Sprintf("images/%s", file.Filename)
			if err := c.SaveUploadedFile(file, imagePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
				return
			}
			menu.Image = imagePath // Update path gambar
		}

		// Update data menu
		menu.Nama = nama
		menu.Deskripsi = deskripsi
		menu.Harga = harga

		// Simpan ke database
		if err := db.Save(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update menu"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Menu updated", "data": menu})
	})
	r.PUT("/editMenuSnack/:id", func(c *gin.Context) {
		id := c.Param("id")
		menuID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		var menu model.Snack
		if err := db.Where("id = ?", menuID).First(&menu).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Menu not found"})
			return
		}

		// Ambil data dari form-data
		nama := c.PostForm("Nama")
		deskripsi := c.PostForm("Deskripsi")
		harga, err := strconv.Atoi(c.PostForm("Harga"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price format"})
			return
		}

		// Handle upload gambar
		file, err := c.FormFile("images")
		if err == nil {
			// Simpan file gambar di folder tertentu
			imagePath := fmt.Sprintf("images/%s", file.Filename)
			if err := c.SaveUploadedFile(file, imagePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image"})
				return
			}
			menu.Image = imagePath // Update path gambar
		}

		// Update data menu
		menu.Nama = nama
		menu.Deskripsi = deskripsi
		menu.Harga = harga

		// Simpan ke database
		if err := db.Save(&menu).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update menu"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Menu updated", "data": menu})
	})
}
