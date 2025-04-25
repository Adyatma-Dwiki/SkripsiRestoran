package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"myapp/config"
	"myapp/controllers"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jinzhu/gorm"
)

var (
	connectedDevices = make(map[string]bool)
	mu               sync.Mutex
	clientsMutex     sync.Mutex
	clients          = make(map[*websocket.Conn]bool) // Map untuk menyimpan WebSocket clients
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Izinkan semua koneksi
	},
}

// Fungsi untuk menangani WebSocket connections
// Fungsi untuk menangani WebSocket connections pada /dapur/ws
func handleWebSocket(r *gin.Engine) {
	r.GET("/dapur/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Println("WebSocket upgrade error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade to WebSocket"})
			return
		}
		defer conn.Close()

		clientsMutex.Lock()
		clients[conn] = true
		clientsMutex.Unlock()

		fmt.Println("🔗 New WebSocket client connected to /dapur/ws")

		// Listen for WebSocket messages or close
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Println("Error reading message from client:", err)
				break
			}

			// Process the message (e.g., broadcast)
			broadcastWebSocket(string(message))
		}

		// On disconnect, remove client
		clientsMutex.Lock()
		delete(clients, conn)
		clientsMutex.Unlock()
	})
}

// Fungsi untuk broadcast pesan ke semua client yang terhubung
func broadcastWebSocket(message string) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()

	for client := range clients {
		err := client.WriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			log.Println("WebSocket write error:", err)
			client.Close()
			delete(clients, client)
		}
	}
}

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
func setupMQTT(db *gorm.DB, broadcastFunc func(string)) mqtt.Client {
	opts := mqtt.NewClientOptions()
	opts.AddBroker("tcp://192.168.0.101:1884")
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

	// Gunakan parsingMessageFromMQTT sebagai handler untuk "dapur/response"
	handler := controllers.ParsingMessageFromMQTT(db, broadcastFunc)

	subToken := client.Subscribe("dapur/response", 1, handler)
	subToken.Wait()
	if subToken.Error() != nil {
		log.Fatalf("Gagal subscribe ke dapur/response: %v", subToken.Error())
	}

	fmt.Println("Berhasil subscribe ke topik dapur/response")
	return client
}

func main() {
	// Inisialisasi koneksi ke database
	config.ConnectDB()
	mqttClient := setupMQTT(config.DB, broadcastWebSocket)

	// Setup Gin Router
	r := gin.Default()
	r.Static("/images", "./images")

	// Tambahkan middleware CORS
	r.Use(dynamicCORS())

	// Tambahkan middleware untuk melacak perangkat
	r.Use(trackUserAgent)

	// WebSocket handler
	handleWebSocket(r)

	// Endpoint API untuk mengambil data dari database
	controllers.GetMenuMakananController(r)
	controllers.GetMenuMinuman(r)
	controllers.GetMenuSnacks(r)
	controllers.PostOrder(r, config.DB, broadcastWebSocket)
	controllers.GetOrder(r, config.DB)
	controllers.GetOrderByID(r, config.DB)
	controllers.DapurOrder(r, config.DB, mqttClient, broadcastWebSocket)
	controllers.LoginSetup(r)
	controllers.AddNewMenu(r, config.DB)
	controllers.DeleteMenu(r, config.DB)
	controllers.EditMenu(r, config.DB)

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
