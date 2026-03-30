package gorm

import (
	"gorm.io/gorm"
)

func Paginate(offset, limit int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		o, l := PaginateCalculate(offset, limit)
		return db.Offset(o).Limit(l)
	}
}

func PaginateCalculate(offset, limit int) (o, l int) {
	if offset <= 0 {
		offset = 1
	}
	if limit <= 0 {
		limit = 10
	}

	offset = (offset - 1) * limit
	return offset, limit
}

func Undeleted() func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("delete_time = 0")
	}
}
