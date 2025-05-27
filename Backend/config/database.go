package config

import (
	"fmt"
	"log"
	"myapp/model"
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

var DB *gorm.DB
var err error

// InitDB menginisialisasi koneksi ke database dan menyimpan koneksi pada variabel DB
func ConnectDB() {
	dsn := "root:@tcp(localhost:3306)/skripsiresto"
	DB, err = gorm.Open("mysql", dsn)
	if err != nil {
		fmt.Println("Failed to connect to database!")
		panic(err)
	}
	fmt.Println("Successfully connected to database!")

	// Connection Pooling
	sqlDB := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get DB from GORM: %v", err)
	}
	sqlDB.SetMaxIdleConns(100)
	sqlDB.SetMaxOpenConns(1000)
	sqlDB.SetConnMaxLifetime(60 * time.Second)

	// Auto migration
	models := []interface{}{
		&model.Makanan{},
		&model.Minuman{},
		&model.Snack{},
		&model.Order{},
		&model.OrderItem{},
		&model.User{},
		&model.DapurOrder{},
	}

	for _, model := range models {
		if err := DB.AutoMigrate(model).Error; err != nil {
			log.Fatalf("Failed to migrate model %T: %v", model, err)
		}
		fmt.Printf("Model %T migrated successfully!\n", model)
	}
}

func CloseDB() {
	if DB != nil {
		sqlDB := DB.DB()
		if err == nil {
			sqlDB.Close()
			fmt.Println("Database connection closed.")
		}
	}
}
