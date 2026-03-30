package gorm

import (
	"gorm.io/gorm"
	"strings"
)

func Paginate(offset, limit int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if offset <= 0 {
			offset = 1
		}
		if limit <= 0 {
			limit = 10
		}

		offset := (offset - 1) * limit
		return db.Offset(offset).Limit(limit)
	}
}

func Undeleted() func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("delete_time = 0")
	}
}

func EscapeLike(left, word, right string) string {
	var n int
	for i := range word {
		if c := word[i]; c == '%' || c == '_' || c == '\\' {
			n++
		}
	}
	// No characters to escape.
	if n == 0 {
		return left + word + right
	}
	var b strings.Builder
	b.Grow(len(word) + n)
	for _, c := range word {
		if c == '%' || c == '_' || c == '\\' {
			b.WriteByte('\\')
		}
		b.WriteRune(c)
	}
	return left + b.String() + right
}
