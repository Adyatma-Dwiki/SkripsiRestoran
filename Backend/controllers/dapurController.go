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

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

func publishToMQTT(client mqtt.Client, topic string, payload model.MqttPayload) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Println("Gagal encode JSON untuk MQTT:", err)
		return
	}

	token := client.Publish(topic, 0, false, jsonData)
	token.Wait()
	log.Println("Pesan MQTT terkirim:", string(jsonData))
}

func ParsingMessageFromMQTT(db *gorm.DB, broadcastFunc func(string)) mqtt.MessageHandler {
	return func(client mqtt.Client, msg mqtt.Message) {
		log.Printf("Pesan MQTT diterima dari [%s]: %s\n", msg.Topic(), string(msg.Payload()))

		var payload struct {
			Status  string `json:"status"`
			TableID int    `json:"table_id"`
			ID      int    `json:"id"`
		}

		// Parse payload dari MQTT
		if err := json.Unmarshal(msg.Payload(), &payload); err != nil {
			log.Printf("Gagal parsing JSON dari MQTT: %v\n", err)
			return
		}

		// Cari order berdasarkan ID
		var order model.DapurOrder
		if err := db.First(&order, payload.ID).Error; err != nil {
			log.Printf("Order tidak ditemukan untuk ID %d: %v\n", payload.ID, err)
			return
		}

		// Update status order
		order.Status = payload.Status
		if err := db.Save(&order).Error; err != nil {
			log.Printf("Gagal update status order: %v\n", err)
			return
		}

		log.Printf("Status order dengan ID %d berhasil diperbarui ke '%s'\n", payload.ID, payload.Status)

		// Ambil semua order terbaru setelah update
		var dapurOrders []model.DapurOrder
		if err := db.Preload("OrderItems").Order("id DESC").Find(&dapurOrders).Error; err != nil {
			log.Printf("Gagal ambil data dapur untuk broadcast: %v\n", err)
			return
		}

		// Broadcast ke WebSocket clients
		go func() {
			if jsonData, err := json.Marshal(dapurOrders); err == nil {
				broadcastFunc(string(jsonData))
			}
		}()
	}
}

// Fungsi untuk menyalin Order ke DapurOrders dengan status default
func UpdateDapurOrder(c *gin.Context, db *gorm.DB, mqttClient mqtt.Client, broadcastFunc func(string)) {
	orderID := c.Param("id")
	orderIDInt, err := strconv.Atoi(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var dapurOrder model.DapurOrder

	// Cari pesanan langsung berdasarkan ID
	if err := db.First(&dapurOrder, orderIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Ambil data dari request body
	var input struct {
		Action bool `json:"action"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Ubah status berdasarkan action
	dapurOrder.Action = input.Action
	if input.Action {
		dapurOrder.Status = "Siap Antar"
	} else {
		dapurOrder.Status = "Belum Dibuat"
	}

	// Simpan ke database
	if err := db.Save(&dapurOrder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	// Ambil order_items berdasarkan order ID
	var orderItems []model.OrderItem
	if err := db.Where("order_id = ?", orderIDInt).Find(&orderItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve order items"})
		return
	}

	// Ambil nama makanan dari order_items
	var foodNames []string
	for _, item := range orderItems {
		foodNames = append(foodNames, fmt.Sprintf("%s (%d)", item.ProductName, item.Quantity))
	}

	// Kirim pesan ke MQTT
	payload := model.MqttPayload{
		ID:        int(dapurOrder.ID),
		TableID:   dapurOrder.TableID,
		Status:    dapurOrder.Status,
		FoodNames: foodNames,
	}
	publishToMQTT(mqttClient, "dapur/order", payload)

	// Siapkan data yang akan dibroadcast ke frontend
	dapurOrderWithItems := struct {
		model.DapurOrder
		OrderItems []model.OrderItem `json:"order_items"`
	}{
		DapurOrder: dapurOrder,
		OrderItems: orderItems,
	}

	// Broadcast ke WebSocket clients
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

		// Simpan gambar ke folder uploads/
		uploadDir := "uploads"
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
		imagePath := filepath.ToSlash(strings.Replace(filePath, "uploads", "images", 1))

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
		uploadDir := "uploads"
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
		imagePath := filepath.ToSlash(strings.Replace(filePath, "uploads", "images", 1))

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
		uploadDir := "uploads"
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
		imagePath := filepath.ToSlash(strings.Replace(filePath, "uploads", "images", 1))

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
		file, err := c.FormFile("Image")
		if err == nil {
			// Simpan file gambar
			imagePath := fmt.Sprintf("uploads/%s", file.Filename)
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
		file, err := c.FormFile("Image")
		if err == nil {
			// Simpan file gambar di folder tertentu
			imagePath := fmt.Sprintf("uploads/%s", file.Filename)
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
		file, err := c.FormFile("Image")
		if err == nil {
			// Simpan file gambar di folder tertentu
			imagePath := fmt.Sprintf("uploads/%s", file.Filename)
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
