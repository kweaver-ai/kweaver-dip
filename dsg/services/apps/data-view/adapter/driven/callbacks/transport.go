package callbacks

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"gorm.io/gorm"
)

type Transports struct {
	db                    *gorm.DB
	EntityChangeTransport *EntityChangeTransport
	dataLineageCallback   *DataLineageTransport
}

func NewTransport(
	db *gorm.DB,
	EntityChangeTransport *EntityChangeTransport,
	dataLineageCallback *DataLineageTransport,
) *Transports {
	return &Transports{
		db:                    db,
		EntityChangeTransport: EntityChangeTransport,
		dataLineageCallback:   dataLineageCallback,
	}
}

// Register 注册
func (t *Transports) Register() {
	callback.Init(t.db)
	//血缘注册
	callback.RegisterByTransport(t.dataLineageCallback, callback.LineageTransportName, new(model.FormView))
	callback.RegisterByTransport(t.dataLineageCallback, callback.LineageTransportName, new(model.FormViewField))

	//认知搜索数据资源图谱注册
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.FormView))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.FormViewField))

	//认知搜索数据目录版图谱注册
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.FormView))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.FormViewField))

	//智能推荐
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.FormView))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.FormViewField))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.TModelLabelRecRel))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.TGraphModel))
}
