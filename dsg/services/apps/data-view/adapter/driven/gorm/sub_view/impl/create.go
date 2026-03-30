package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

// Create implements sub_view.SubViewRepo.
func (s *subViewRepo) Create(ctx context.Context, subView *model.SubView) (*model.SubView, error) {
	tx := s.db.WithContext(ctx).Debug()

	if err := tx.Create(subView).Error; err != nil {
		return nil, newErrSubViewDatabaseError(err)
	}

	return subView, nil
}

// CheckRepeat implements sub_view.SubViewRepo.
// 同一个视图下的授权规则不能一样
func (s *subViewRepo) CheckRepeat(ctx context.Context, subView *model.SubView) (bool, error) {
	tx := s.db.WithContext(ctx).Debug()
	err := tx.Where("logic_view_id=? and name=? and id !=?  and deleted_at=0 ",
		subView.LogicViewID, subView.Name, subView.ID).Take(&model.SubView{}).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return true, err
	}
	return true, nil
}

// IsRepeat implements sub_view.SubViewRepo.
func (s *subViewRepo) IsRepeat(ctx context.Context, subView *model.SubView) error {
	isRepeat, err := s.CheckRepeat(ctx, subView)
	if err != nil {
		return errorcode.PublicDatabaseErr.Err()
	}
	if isRepeat {
		return errorcode.SubViewNameRepeatError.Err()
	}
	return nil
}
