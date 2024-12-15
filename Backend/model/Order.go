package model

type Order struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	TableID    int     `json:"TableID"`
	TotalPrice float64 `json:"total_price"`

	OrderItems []OrderItem `json:"order_items"` // Relasi dengan OrderItem
}

// TableName mengatur nama tabel yang digunakan GORM
func (Order) TableName() string {
	return "skripsiresto.Orders"
}

type OrderItem struct {
	ID          uint    `json:"id" gorm:"primaryKey"`
	OrderID     uint    `json:"order_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
}

func (OrderItem) TableName() string {
	return "skripsiresto.OrderItems"
}
