package model

type Makanan struct {
	ID        int    `json:"id" gorm:"column:id"`
	Nama      string `json:"Nama" gorm:"column:Nama"`
	Deskripsi string `json:"Deskripsi" gorm:"column:Deskripsi"`
	Harga     int    `json:"Harga" gorm:"column:Harga"`
	Image     string `json:"image" gorm:"column:image"`
}

// TableName mengatur nama tabel yang digunakan GORM
func (Makanan) TableName() string {
	return "skripsiresto.makanans"
}
