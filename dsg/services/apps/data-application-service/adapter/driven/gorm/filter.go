package gorm

import (
	"github.com/samber/lo"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Filter interface {
	Filter(tx *gorm.DB) *gorm.DB
}

type ServiceIDs []string

// Filter implements Filter.
func (f ServiceIDs) Filter(tx *gorm.DB) *gorm.DB {
	return tx.Where(clause.IN{
		Column: clause.Column{
			Name: "service_id",
		},
		Values: lo.ToAnySlice(f),
	})
}

var _ Filter = &ServiceIDs{}
