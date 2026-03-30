package callbacks

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
)

type Transports struct {
	db                    *db.Data
	EntityChangeTransport *EntityChangeTransport
}

func NewTransport(
	db *db.Data,
	EntityChangeTransport *EntityChangeTransport,
) *Transports {
	return &Transports{
		db:                    db,
		EntityChangeTransport: EntityChangeTransport,
	}
}

// Register 注册
func (t *Transports) Register() {
	callback.Init(t.db.DB)
	//认知搜索数据资源图谱注册
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.Report))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.ReportItem))

	//认知搜索数据目录图谱注册
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.Report))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.ReportItem))
}
