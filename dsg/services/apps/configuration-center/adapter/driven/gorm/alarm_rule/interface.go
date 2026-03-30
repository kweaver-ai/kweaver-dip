package alarm_rule

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/alarm_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	Update(tx *gorm.DB, ctx context.Context, m *model.TAlarmRule) (bool, error)
	GetList(tx *gorm.DB, ctx context.Context, req *domain.ListReq) ([]*model.TAlarmRule, error)
}
