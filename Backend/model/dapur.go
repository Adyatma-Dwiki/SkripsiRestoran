package model

type DapurOrder struct {
	ID         uint        `json:"id" gorm:"primaryKey"`
	TableID    int         `json:"table_id"`
	TotalPrice float64     `json:"total_price"`
	OrderItems []OrderItem `json:"order_items" gorm:"foreignKey:OrderID"`
	Status     string      `json:"status"`
	Action     bool        `json:"action" gorm:"default:false"`
}

func (DapurOrder) TableName() string {
	return "skripsiresto.dapurs"
}
