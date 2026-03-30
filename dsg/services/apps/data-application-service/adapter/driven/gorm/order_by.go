package gorm

import "gorm.io/gorm"

type OrderBy interface {
	OrderBy(tx *gorm.DB) *gorm.DB
}
