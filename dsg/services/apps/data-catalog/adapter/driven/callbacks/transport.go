package callbacks

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"gorm.io/gorm"
)

type Transports struct {
	db                    *gorm.DB
	EntityChangeTransport *EntityChangeTransport
}

func NewTransport(
	db *gorm.DB,
	EntityChangeTransport *EntityChangeTransport,
) *Transports {
	return &Transports{
		db:                    db,
		EntityChangeTransport: EntityChangeTransport,
	}
}

// Register 注册
func (t *Transports) Register() {
	callback.Init(t.db)
	//业务架构图谱
	callback.RegisterByTransport(t.EntityChangeTransport, callback.BusinessRelationGraph, new(model.TDataCatalog)) //数据据目录
	//认知搜索图谱_数据目录版
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.TDataCatalog))     //数据据目录
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.TDataCatalogInfo)) //数据据目录标签
}
