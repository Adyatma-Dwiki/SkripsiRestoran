package model

type Minuman struct {
	ID        int    `json:"id" gorm:"column:id"`
	Nama      string `json:"Nama" gorm:"column:Nama"`
	Deskripsi string `json:"Deskripsi" gorm:"column:Deskripsi"`
	Harga     int    `json:"Harga" gorm:"column:Harga"`
	Image     string `json:"images" gorm:"column:images"`
}

// TableName mengatur nama tabel yang digunakan GORM
func (Minuman) TableName() string {
	return "skripsiresto.minumans"
}
