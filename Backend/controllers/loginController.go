package controllers

import (
	"myapp/config"
	"myapp/model"
	"net/http"
	"strings" // Tambahkan package untuk string manipulation

	"github.com/gin-gonic/gin"
)

// Login handler
func Login(c *gin.Context) {
	var userInput model.User
	if err := c.ShouldBindJSON(&userInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cari user berdasarkan username yang diberikan
	var user model.User
	if err := config.DB.Where("username = ?", userInput.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid username"})
		return
	}

	// Verifikasi password (hilangkan spasi sebelum perbandingan)
	if strings.TrimSpace(*user.Password) != strings.TrimSpace(*userInput.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid password"})
		return
	}

	// Jika validasi berhasil, kembalikan pesan sukses
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Login successful"})
}

func LoginSetup(r *gin.Engine) {
	r.POST("/login", Login) // Menambahkan route login
}
