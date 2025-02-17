package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"myapp/model"
	"net/http"
	"strconv"

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

// Fungsi untuk menyalin Order ke DapurOrders dengan status default

func UpdateDapurOrder(c *gin.Context, db *gorm.DB, mqttClient mqtt.Client) {
	orderID := c.Param("id")
	orderIDInt, err := strconv.Atoi(orderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var dapurOrder model.DapurOrder

	// Cari pesanan langsung berdasarkan ID, bukan table_id
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

	// Kirim pesan ke MQTT dengan hanya nama makanan
	payload := model.MqttPayload{
		TableID:   dapurOrder.TableID,
		Status:    dapurOrder.Status,
		FoodNames: foodNames,
	}
	publishToMQTT(mqttClient, "dapur/order", payload)

	c.JSON(http.StatusOK, gin.H{"message": "Order updated", "data": dapurOrder})
}

func DapurOrder(r *gin.Engine, db *gorm.DB, mqttClient mqtt.Client) {
	// Endpoint untuk mendapatkan semua pesanan dapur
	r.GET("/dapur", func(c *gin.Context) {
		var dapurOrders []model.DapurOrder

		// Query database untuk mengambil semua data dari dapurs
		if err := db.Preload("OrderItems").Find(&dapurOrders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dapur orders"})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Dapur orders fetched successfully",
			"data":    dapurOrders,
		})
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
		UpdateDapurOrder(c, db, mqttClient)
	})
}
