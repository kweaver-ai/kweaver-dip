package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/alarm_rule"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/alarm_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(db *gorm.DB) alarm_rule.Repo {
	return &repo{db: db}
}

type repo struct {
	db *gorm.DB
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.db.WithContext(ctx)
	}
	return tx
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.TAlarmRule) (bool, error) {
	d := r.do(tx, ctx).Model(&model.TAlarmRule{}).Where("id = ?", m.ID).
		Updates(map[string]interface{}{
			"deadline_time":       m.DeadlineTime,
			"deadline_reminder":   m.DeadlineReminder,
			"beforehand_time":     m.BeforehandTime,
			"beforehand_reminder": m.BeforehandReminder,
			"updated_at":          m.UpdatedAt,
			"updated_by":          m.UpdatedBy,
		})
	return d.RowsAffected > 0, d.Error
}

func (r *repo) GetList(tx *gorm.DB, ctx context.Context, req *domain.ListReq) (data []*model.TAlarmRule, err error) {

	d := r.do(tx, ctx).Model(&model.TAlarmRule{})

	if len(req.Types) > 0 {
		d = d.Where("type in ?", req.Types)
	}

	err = d.Find(&data).Error
	return
}
