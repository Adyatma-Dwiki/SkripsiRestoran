package model

type DapurOrder struct {
	ID         uint        `json:"id" gorm:"primaryKey"`
	OrderID    uint        `json:"order_id"` // <--- Tambahkan ini
	TableID    int         `json:"table_id"`
	TotalPrice float64     `json:"total_price"`
	OrderItems []OrderItem `json:"order_items" gorm:"foreignKey:OrderID"` // tetap pakai OrderID
	Status     string      `json:"status"`
	Action     bool        `json:"action" gorm:"default:false"`
	ConfirmBy  string      `json:"device_id" gorm:"default:''"`
}

func (DapurOrder) TableName() string {
	return "skripsiresto.dapurs"
}
