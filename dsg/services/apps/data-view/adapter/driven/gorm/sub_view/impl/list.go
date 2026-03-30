package impl

import (
	"context"

	"github.com/samber/lo"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

// List implements sub_view.SubViewRepo.
func (s *subViewRepo) List(ctx context.Context, opts sub_view.ListOptions) ([]model.SubView, int, error) {
	tx := s.db.WithContext(ctx).Debug().Order("name")

	// 根据子视图所属的逻辑视图过滤
	if opts.LogicViewID != uuid.Nil {
		tx = tx.Where(&model.SubView{LogicViewID: opts.LogicViewID})
	}
	// 查询记录条数
	var count int64
	tx = tx.Model(&model.SubView{}).Count(&count)
	if tx.Error != nil {
		return nil, 0, newErrSubViewDatabaseError(tx.Error)
	}

	// 分页查询条件
	if opts.Limit != 0 {
		tx = tx.Limit(opts.Limit)
		if opts.Offset != 0 {
			tx = tx.Offset((opts.Offset - 1) * opts.Limit)
		}
	}

	// 查询
	var subViews []model.SubView
	tx = tx.Find(&subViews)
	if tx.Error != nil {
		return nil, 0, newErrSubViewDatabaseError(tx.Error)
	}

	return subViews, int(count), nil
}

// ListID implements sub_view.SubViewRepo.
func (s *subViewRepo) ListID(ctx context.Context, logicViewID uuid.UUID) ([]uuid.UUID, error) {
	tx := s.db.WithContext(ctx)

	tx = tx.Model(&model.SubView{}).Select("id")

	if logicViewID != uuid.Nil {
		tx = tx.Where(&model.SubView{LogicViewID: logicViewID})
	}

	var subViewIDs []uuid.UUID
	tx = tx.Find(&subViewIDs)
	if tx.Error != nil {
		return nil, newErrSubViewDatabaseError(tx.Error)
	}

	return subViewIDs, nil
}

// ListSubViews implements sub_view.SubViewRepo.
func (s *subViewRepo) ListSubViews(ctx context.Context, logicViewID ...string) (map[string][]string, error) {
	tx := s.db.WithContext(ctx)

	tx = tx.Model(&model.SubView{})

	if len(logicViewID) > 0 {
		tx = tx.Where(" logic_view_id in ? ", logicViewID)
	}
	subViews := make([]*model.SubView, 0)
	tx = tx.Find(&subViews)
	if tx.Error != nil {
		return nil, newErrSubViewDatabaseError(tx.Error)
	}

	viewGroup := lo.GroupBy(subViews, func(item *model.SubView) string {
		return item.LogicViewID.String()
	})
	return lo.MapEntries(viewGroup, func(key string, value []*model.SubView) (string, []string) {
		return key, lo.Uniq(lo.Times(len(value), func(index int) string {
			return value[index].ID.String()
		}))
	}), nil
}
