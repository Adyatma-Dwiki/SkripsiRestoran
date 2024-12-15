package config

import (
	"fmt"
	"log"
	"myapp/model"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

var DB *gorm.DB
var err error

// InitDB menginisialisasi koneksi ke database dan menyimpan koneksi pada variabel DB
func ConnectDB() {
	// DSN = Data Source Name
	dsn := "root:@tcp(localhost:3306)/skripsiresto"
	DB, err = gorm.Open("mysql", dsn)
	if err != nil {
		fmt.Println("Failed to connect to database!")
		panic(err)
	}
	fmt.Println("Successfully connected to database!")

	// Daftar model yang akan dimigrasi
	models := []interface{}{
		&model.Makanan{},
		&model.Minuman{},
		&model.Snack{},
		&model.Order{},
		&model.OrderItem{},
		&model.User{},
	}

	// Iterasi untuk migrasi semua model
	for _, model := range models {
		if err := DB.AutoMigrate(model).Error; err != nil {
			log.Fatalf("Failed to migrate model %T: %v", model, err)
		}
		fmt.Printf("Model %T migrated successfully!\n", model)
	}
}
