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

	// Lakukan migrasi jika diperlukan (misalnya untuk membuat tabel)
	err = DB.AutoMigrate(&model.Makanan{}).Error
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	fmt.Println("Database migrated successfully!")
}
