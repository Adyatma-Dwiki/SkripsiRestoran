package controllers

import (
	"myapp/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

// Fungsi untuk menyalin Order ke DapurOrders dengan status default

func UpdateDapurOrder(c *gin.Context, db *gorm.DB) {
	id := c.Param("id")
	orderID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var dapurOrder model.DapurOrder

	// Cek apakah pesanan ada di database
	if err := db.First(&dapurOrder, orderID).Error; err != nil {
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

	// Update status pesanan di dapur
	dapurOrder.Action = input.Action
	if err := db.Save(&dapurOrder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order updated", "data": dapurOrder})
}

func DapurOrder(r *gin.Engine, db *gorm.DB) {
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

	// Endpoint untuk mendapatkan satu pesanan berdasarkan ID
	r.GET("/dapur/:id", func(c *gin.Context) {
		id := c.Param("id")
		var dapurOrder model.DapurOrder

		// Konversi ID dari string ke integer
		orderID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		// Query database untuk mengambil data dari dapurs berdasarkan ID
		if err := db.Preload("OrderItems").First(&dapurOrder, orderID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found in dapur"})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Dapur order data fetched successfully",
			"data":    dapurOrder,
		})
	})

	r.PUT("/dapur/:id", func(c *gin.Context) {
		id := c.Param("id")
		orderID, err := strconv.Atoi(id)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var dapurOrder model.DapurOrder

		// Cek apakah pesanan ada di database
		if err := db.First(&dapurOrder, orderID).Error; err != nil {
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

		// Update status pesanan di dapur
		dapurOrder.Action = input.Action
		if err := db.Save(&dapurOrder).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order updated", "data": dapurOrder})
	})

}
