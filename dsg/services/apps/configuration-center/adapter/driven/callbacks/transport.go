package callbacks

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
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
	query.RegisterCallbacks(common.GetQuery(t.db), callback.RegisterCallback)

	//业务架构图谱
	callback.RegisterByTransport(t.EntityChangeTransport, callback.BusinessRelationGraph, new(model.Object))     //部门
	callback.RegisterByTransport(t.EntityChangeTransport, callback.BusinessRelationGraph, new(model.InfoSystem)) //信息系统
	callback.RegisterByTransport(t.EntityChangeTransport, callback.BusinessRelationGraph, new(model.User))       //数据owner
	//智能推荐
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.Object))     //部门
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.InfoSystem)) //信息系统
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.User))       //数据owner
	//认知搜索数据目录版
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.Datasource)) //数据源
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.Object))     //部门
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.InfoSystem)) //信息系统
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataCatalogGraph, new(model.User))       //数据owner

	//认知搜索数据源版
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.Datasource)) //数据源
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.Object))     //部门
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.User))       //数据owner
}
