package common

import (
	"sync"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
)

var (
	q    *query.Query
	once sync.Once
)

//func GetQuery(data *db.Data) *query.Query {
//	once.Do(func() {
//		q = query.Use(data.DB)
//	})
//
//	return q
//}

func GetQuery(DB *gorm.DB) *query.Query {
	once.Do(func() {
		q = query.Use(DB)
		query.RegisterDBCallbacks(q, gormx.RegisterCallback)
	})
	return q
}
