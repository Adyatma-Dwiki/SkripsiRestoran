package main

import (
	"fmt"
	"myapp/config"
	"myapp/controllers"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	files := []string{"./images/ayamBakarTaliwang.jpg", "./images/ayam-bakar-madu.jpeg"}
	for _, file := range files {
		if _, err := os.Stat(file); os.IsNotExist(err) {
			fmt.Printf("File not found: %s\n", file)
		} else {
			fmt.Printf("File exists: %s\n", file)
		}
	}
	// Inisialisasi koneksi ke database
	config.ConnectDB()

	// Setup Gin Router
	r := gin.Default()
	r.Static("/images", "./images")

	// Tambahkan middleware CORS
	r.Use(cors.Default())

	// Endpoint API untuk mengambil data dari database
	controllers.GetMenuMakananController(r)

	// Jalankan server di port 8080
	r.Run(":8080")
}
