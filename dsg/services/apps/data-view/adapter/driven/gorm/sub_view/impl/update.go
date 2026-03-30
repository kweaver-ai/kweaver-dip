package impl

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Update implements sub_view.SubViewRepo.
func (s *subViewRepo) Update(ctx context.Context, subView *model.SubView) (result *model.SubView, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	tx := s.db.WithContext(ctx).Debug()

	if err := tx.Transaction(func(tx *gorm.DB) error {
		tx = tx.Where(&model.SubView{ID: subView.ID})

		// 检查 SubView 是否已经存在
		var count int64
		if err := tx.Model(&model.SubView{}).Count(&count).Error; err != nil {
			return newErrSubViewDatabaseError(err)
		}
		if count == 0 {
			return newErrSubViewNotFound(subView.ID)
		}

		// 更新记录 name, form_view_id, detail
		if err := tx.Updates(&model.SubView{
			Name:        subView.Name,
			LogicViewID: subView.LogicViewID,
			Detail:      subView.Detail,
		}).Error; err != nil {
			return newErrSubViewDatabaseError(err)
		}
		// 获取更新之后的记录
		result = &model.SubView{}
		if err := tx.Where(&model.SubView{ID: subView.ID}).First(result).Error; err != nil {
			return newErrSubViewDatabaseError(err)
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return
}
