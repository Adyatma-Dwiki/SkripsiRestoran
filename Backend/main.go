package main

import (
	"myapp/config"
	"myapp/controllers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	// Inisialisasi koneksi ke database
	config.ConnectDB()

	// Setup Gin Router
	r := gin.Default()
	r.Static("/images", "./images")

	// Tambahkan middleware CORS
	r.Use(cors.Default())

	// Endpoint API untuk mengambil data dari database
	controllers.GetMenuMakananController(r)
	controllers.GetMenuMinuman(r)
	controllers.GetMenuSnacks(r)
	controllers.PostOrder(r, config.DB)
	controllers.GetOrder(r, config.DB)
	controllers.GetOrderByID(r, config.DB)

	// Jalankan server di port 8080
	r.Run(":8080")
}
