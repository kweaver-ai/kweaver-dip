package gorm

import (
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
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

func newPublicDatabaseError(tx *gorm.DB) error {
	if tx.Error == nil {
		return nil
	}
	return errorcode.Detail(errorcode.PublicDatabaseError, map[string]any{"sql": tx.Statement.SQL, "err": tx.Error.Error()})
}
