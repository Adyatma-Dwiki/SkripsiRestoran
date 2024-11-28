package controllers

import (
	"fmt"
	"myapp/config"
	"myapp/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetMenuMakananController untuk membuat route
func GetMenuMakananController(r *gin.Engine) {
	// Endpoint API untuk mengambil data dari database
	r.GET("/api/data", func(c *gin.Context) {
		var makanan []model.Makanan

		// Query database untuk mengambil semua data menu makanan
		if err := config.DB.Find(&makanan).Error; err != nil {
			fmt.Println("Error fetching data:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch data"})
			return
		}

		if len(makanan) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"message": "No data available",
				"data":    []interface{}{}, // Return empty array when no data
			})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Data from MySQL",
			"data":    makanan,
		})
	})
}
