package callbacks

import (
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
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
	callback.RegisterByTransport(t.EntityChangeTransport, callback.BusinessRelationGraph, new(model.SubjectDomain))
	//认知搜索图谱，数据资源版本
	callback.RegisterByTransport(t.EntityChangeTransport, callback.CognitiveSearchDataResourceGraph, new(model.SubjectDomain))
	//智能推荐图谱
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.SubjectDomain))
	callback.RegisterByTransport(t.EntityChangeTransport, callback.SmartRecommendationGraph, new(model.StandardInfo))
}
