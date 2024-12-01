package controllers

import (
	"fmt"
	"myapp/config"
	"myapp/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetMenuminumanController untuk membuat route
func GetMenuMinuman(r *gin.Engine) {
	// Endpoint API untuk mengambil data dari database
	r.GET("/menuMinuman", func(c *gin.Context) {
		var minuman []model.Minuman

		// Query database untuk mengambil semua data menu minuman
		if err := config.DB.Find(&minuman).Error; err != nil {
			fmt.Println("Error fetching data:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch data"})
			return
		}

		if len(minuman) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"message": "No data available",
				"data":    []interface{}{}, // Return empty array when no data
			})
			return
		}

		// Kirimkan data sebagai JSON
		c.JSON(http.StatusOK, gin.H{
			"message": "Data from MySQL",
			"data":    minuman,
		})
	})
}
