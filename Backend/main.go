package main

import (
	"fmt"
	"log"
	"myapp/config"
	"myapp/controllers"
	"net/http"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"
)

var (
	connectedDevices = make(map[string]bool)
	mu               sync.Mutex
)

// Middleware untuk melacak perangkat berdasarkan IP dan User-Agent
func trackUserAgent(c *gin.Context) {
	userAgent := c.GetHeader("User-Agent")
	clientIP := c.ClientIP()
	uniqueDevice := clientIP + ":" + userAgent

	mu.Lock()
	connectedDevices[uniqueDevice] = true
	mu.Unlock()

	c.Next()
}

func dynamicCORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		// Handle Preflight Request (OPTIONS)
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// Setup MQTT client
func setupMQTT() mqtt.Client {
	opts := mqtt.NewClientOptions()
	opts.AddBroker("tcp://192.168.0.100:1884") // Sesuaikan dengan broker MQTT kamu
	opts.SetClientID("resto-backend")
	opts.SetKeepAlive(2 * time.Second)
	opts.SetPingTimeout(1 * time.Second)
	client := mqtt.NewClient(opts)
	token := client.Connect()
	token.Wait()

	if token.Error() != nil {
		log.Fatalf("Gagal terhubung ke MQTT: %v", token.Error())
	}

	fmt.Println("Terhubung ke MQTT broker")
	return client
}

func main() {
	// Inisialisasi koneksi ke database
	config.ConnectDB()
	mqttClient := setupMQTT()
	// Setup Gin Router
	r := gin.Default()
	r.Static("/images", "./images")

	// Ambil IP lokal dari package config
	// localIP := config.GetLocalIP()
	// fmt.Println("Local IP:", localIP)

	// Tambahkan middleware CORS
	r.Use(dynamicCORS())

	// Tambahkan middleware untuk melacak perangkat
	r.Use(trackUserAgent)

	// Endpoint API untuk mengambil data dari database
	controllers.GetMenuMakananController(r)
	controllers.GetMenuMinuman(r)
	controllers.GetMenuSnacks(r)
	controllers.PostOrder(r, config.DB)
	controllers.GetOrder(r, config.DB)
	controllers.GetOrderByID(r, config.DB)
	controllers.DapurOrder(r, config.DB, mqttClient)
	controllers.LoginSetup(r)
	controllers.AddNewMenu(r, config.DB)
	controllers.DeleteMenu(r, config.DB)

	// Endpoint untuk melihat jumlah perangkat unik yang terhubung
	r.GET("/connectedDevices", func(c *gin.Context) {
		mu.Lock()
		count := len(connectedDevices)
		mu.Unlock()

		c.JSON(200, gin.H{
			"connected_devices": count,
		})
	})

	// Jalankan server di port 8080 dan mendengarkan di semua interface
	r.Run("0.0.0.0:8080") // Jalankan server dengan IP lokal
}
