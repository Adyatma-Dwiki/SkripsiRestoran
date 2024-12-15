package controllers

import (
	"myapp/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

// Struct untuk menerima JSON request
type PostOrderRequest struct {
	TableID    string                 `json:"table_id" binding:"required,min=1,max=20"`
	TotalPrice float64                `json:"total_price" binding:"required"`
	OrderItems []PostOrderItemRequest `json:"order_items" binding:"required,dive"`
}

type PostOrderItemRequest struct {
	ProductName string  `json:"product_name" binding:"required"`
	Quantity    int     `json:"quantity" binding:"required,min=1"`
	Price       float64 `json:"price" binding:"required"`
}

// Endpoint untuk menyimpan order ke database
func PostOrder(r *gin.Engine, db *gorm.DB) {
	r.POST("/orders", func(c *gin.Context) {
		var request PostOrderRequest

		// Validasi JSON input
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Konversi TableID dari string ke int
		tableID, err := strconv.Atoi(request.TableID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid table_id"})
			return
		}

		// Buat Order dan OrderItems dari JSON request
		order := model.Order{
			TableID:    tableID,
			TotalPrice: request.TotalPrice,
			OrderItems: []model.OrderItem{},
		}

		for _, item := range request.OrderItems {
			orderItem := model.OrderItem{
				ProductName: item.ProductName,
				Quantity:    item.Quantity,
				Price:       item.Price,
			}
			order.OrderItems = append(order.OrderItems, orderItem)
		}

		// Simpan ke database
		if err := db.Create(&order).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save order", "details": err.Error()})
			return
		}

		// Respon sukses
		c.JSON(http.StatusCreated, gin.H{
			"message": "order created successfully",
			"order":   order,
		})
	})
}

func GetOrder(r *gin.Engine, db *gorm.DB) {
	r.GET("/orders", func(c *gin.Context) {
		var orders []model.Order

		// Query database untuk mengambil semua data order
		if err := db.Preload("OrderItems").Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch data"})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Data from MySQL",
			"data":    orders,
		})
	})
}

func GetOrderByID(r *gin.Engine, db *gorm.DB) {
	r.GET("/orders/:id", func(c *gin.Context) {
		id := c.Param("id") // Mendapatkan ID dari URL
		var order model.Order

		// Mengonversi ID dari string ke tipe yang sesuai (misalnya uint)
		orderID, err := strconv.Atoi(id) // Convert string ke integer
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
			return
		}

		// Query database untuk mengambil order berdasarkan ID
		if err := db.Preload("OrderItems").First(&order, orderID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Order data fetched successfully",
			"data":    order,
		})
	})
}
