package model

// Konstanta untuk Role
const (
	RoleUser  = 0 // User hanya bisa mengakses halaman pemesanan
	RoleAdmin = 1 // Admin bisa mengakses halaman /kitchen
)

// Struct User
type User struct {
	Username string
	Role     int // Role menggunakan angka (0 untuk User, 1 untuk Admin)
	Password *string
}

// TableName mengatur nama tabel yang digunakan GORM
func (User) TableName() string {
	return "skripsiresto.users"
}
