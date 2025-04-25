package model

// Struktur JSON untuk payload MQTT (Hanya nama makanan)
type MqttPayload struct {
	ID        int      `json:"id"`
	TableID   int      `json:"table_id"`
	Status    string   `json:"status"`
	FoodNames []string `json:"food_names"`
}
