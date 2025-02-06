package model

import (
	"log"

	"github.com/jinzhu/gorm"
)

type Order struct {
	ID         uint        `json:"id" gorm:"primaryKey"`
	TableID    int         `json:"table_id"`
	TotalPrice float64     `json:"total_price"`
	OrderItems []OrderItem `json:"order_items" gorm:"foreignKey:OrderID"` // Relasi dengan OrderItem
}

func (Order) TableName() string {
	return "skripsiresto.orders"
}

type OrderItem struct {
	ID          uint    `json:"id" gorm:"primaryKey"`
	OrderID     uint    `json:"order_id" gorm:"index"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
}

func (OrderItem) TableName() string {
	return "skripsiresto.order_items"
}

func (o *Order) AfterCreate(tx *gorm.DB) (err error) {
	var orderItems []OrderItem
	if err := tx.Where("order_id = ?", o.ID).Find(&orderItems).Error; err != nil {
		log.Println("Gagal mengambil order_items:", err)
		return err
	}

	dapurOrder := DapurOrder{
		TableID:    o.TableID,
		TotalPrice: o.TotalPrice,
		OrderItems: orderItems, // Menggunakan hasil query
		Status:     "Belum Dibuat",
	}

	// Simpan ke tabel dapur
	if err := tx.Create(&dapurOrder).Error; err != nil {
		log.Println("Gagal menyimpan order ke dapur:", err)
		return err
	}

	log.Println("Order berhasil masuk ke dapur:", dapurOrder)
	return nil
}
