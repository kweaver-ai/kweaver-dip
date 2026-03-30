package impl

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_completion"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"errors"
	"gorm.io/gorm/logger"
	"time"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func NewTmpCompletionRepo(db *gorm.DB) tmp_completion.TmpCompletionRepo {
	return &tmpCompletionRepo{db: db}
}

type tmpCompletionRepo struct {
	db *gorm.DB
}

func (r *tmpCompletionRepo) Create(ctx context.Context, m *model.TmpCompletion) error {
	return r.db.WithContext(ctx).Model(&model.TmpCompletion{}).Create(m).Error
}

func (r *tmpCompletionRepo) BatchCreate(ctx context.Context, m []*model.TmpCompletion) error {
	return r.db.WithContext(ctx).Model(&model.TmpCompletion{}).CreateInBatches(m, 1000).Error
}

func (r *tmpCompletionRepo) Get(ctx context.Context, formViewId string) (*model.TmpCompletion, error) {
	var m *model.TmpCompletion
	err := r.db.WithContext(ctx).Model(&model.TmpCompletion{}).Where("form_view_id = ?", formViewId).Take(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.CompletionNotFound)
		}
		log.WithContext(ctx).Error("tmpCompletionRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return m, err
}

func (r *tmpCompletionRepo) GetByCompletionId(ctx context.Context, completionId string) (*model.TmpCompletion, error) {
	var m *model.TmpCompletion
	err := r.db.WithContext(ctx).Model(&model.TmpCompletion{}).Where("completion_id = ?", completionId).Take(&m).Error
	return m, err
}

func (r *tmpCompletionRepo) Update(ctx context.Context, m *model.TmpCompletion) error {
	return r.db.WithContext(ctx).Model(&model.TmpCompletion{}).Where("form_view_id = ?", m.FormViewID).Updates(m).Error
}

func (r *tmpCompletionRepo) Delete(ctx context.Context, formViewId string) error {
	return r.db.WithContext(ctx).Model(&model.TmpCompletion{}).Where("form_view_id = ?", formViewId).Delete(&model.TmpCompletion{}).Error
}

func (r *tmpCompletionRepo) SelectOverTimeCompletion(ctx context.Context, stepTime *time.Time) ([]*model.TmpCompletion, error) {
	var m []*model.TmpCompletion
	session := r.db.Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
	if err := session.WithContext(ctx).Model(&model.TmpCompletion{}).Where("created_at <= ? and status = ?", stepTime, form_view.CompletionStatusRunning.Integer.Int32()).Scan(&m).Error; err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	if len(m) > 0 {
		return m, nil
	}
	return nil, nil
}
