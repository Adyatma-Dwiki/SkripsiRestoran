package controllers

import (
	"fmt"
	"myapp/config"
	"myapp/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetMenuSnakcsController untuk membuat route
func GetMenuSnacks(r *gin.Engine) {
	// Endpoint API untuk mengambil data dari database
	r.GET("/menuSnacks", func(c *gin.Context) {
		var snacks []model.Snack

		// Query database untuk mengambil semua data menu snacks
		if err := config.DB.Find(&snacks).Error; err != nil {
			fmt.Println("Error fetching data:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch data"})
			return
		}

		if len(snacks) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"message": "No data available",
				"data":    []interface{}{}, // Return empty array when no data
			})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Data from MySQL",
			"data":    snacks,
		})
	})
}
