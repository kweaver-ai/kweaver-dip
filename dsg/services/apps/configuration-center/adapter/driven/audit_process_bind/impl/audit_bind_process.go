package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type auditProcessBindRepo struct {
	db *gorm.DB
}

func NewAuditProcessBindRepo(db *gorm.DB) audit_process_bind.AuditProcessBindRepo {
	return &auditProcessBindRepo{db: db}
}

func (r *auditProcessBindRepo) Create(ctx context.Context, process *model.AuditProcessBind) (err error) {
	exist, err := r.IsAuditProcessExist(ctx, process.AuditType, 0)
	if err != nil {
		log.WithContext(ctx).Error("Create", zap.Error(err))
		return err
	}

	if exist {
		log.WithContext(ctx).Error("Create", zap.Error(errorcode.Desc(errorcode.AuditProcessBindExist)))
		return errorcode.Desc(errorcode.AuditProcessBindExist)
	}

	tx := r.db.WithContext(ctx).Create(process)
	if tx.Error != nil {
		log.WithContext(ctx).Error("Create", zap.Error(tx.Error))
	}
	return tx.Error
}

func (r *auditProcessBindRepo) List(ctx context.Context, req *domain.ListReqQuery) (processes []*model.AuditProcessBind, count int64, err error) {
	tx := r.db.WithContext(ctx).Model(&model.AuditProcessBind{})

	if req.AuditType != "" {
		tx = tx.Where("audit_type = ?", req.AuditType)
	}

	if req.Sort == "created_at" {
		// 默认为update_time
		req.Sort = "create_time"
	}
	if req.Sort == "updated_at" {
		req.Sort = "update_time"
	}
	if req.Sort != "" {
		tx = tx.Order(req.Sort + " " + req.Direction)
	}

	if req.ServiceType != "" {
		tx = tx.Where("service_type = ?", req.ServiceType)
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}
	limit := req.PageInfo.Limit
	offset := limit * (req.PageInfo.Offset - 1)
	if limit > 0 {
		tx = tx.Limit(limit).Offset(offset)
	}

	tx = tx.Find(&processes)
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	return
}

func (r *auditProcessBindRepo) Get(ctx context.Context, bindId uint64) (process *model.AuditProcessBind, err error) {
	exist, err := r.IsBindIdExist(ctx, bindId)
	if err != nil {
		log.WithContext(ctx).Error("Get", zap.Error(err))
		return nil, err
	}

	if !exist {
		log.WithContext(ctx).Error("Get", zap.Error(errorcode.Desc(errorcode.AuditProcessIdNotExist)))
		return nil, errorcode.Desc(errorcode.AuditProcessIdNotExist)
	}

	tx := r.db.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{ID: bindId}).
		First(&process)

	if tx.Error != nil {
		log.WithContext(ctx).Error("Get", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return process, nil
}

func (r *auditProcessBindRepo) GetByAuditType(ctx context.Context, auditType string) (process *model.AuditProcessBind, err error) {
	tx := r.db.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{AuditType: auditType}).
		First(&process)

	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		return &model.AuditProcessBind{}, nil
	}

	if tx.Error != nil {
		log.WithContext(ctx).Error("GetByAuditType", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return process, nil
}

func (r *auditProcessBindRepo) Update(ctx context.Context, bindId uint64, process *model.AuditProcessBind) (err error) {
	exist, err := r.IsBindIdExist(ctx, bindId)
	if err != nil {
		log.WithContext(ctx).Error("Update", zap.Error(err))
		return err
	}

	if !exist {
		log.WithContext(ctx).Error("Update", zap.Error(errorcode.Desc(errorcode.AuditProcessIdNotExist)))
		return errorcode.Desc(errorcode.AuditProcessIdNotExist)
	}

	exist, err = r.IsAuditProcessExist(ctx, process.AuditType, bindId)
	if err != nil {
		log.WithContext(ctx).Error("Update", zap.Error(err))
		return err
	}

	if exist {
		log.WithContext(ctx).Error("Update", zap.Error(errorcode.Desc(errorcode.AuditProcessBindExist)))
		return errorcode.Desc(errorcode.AuditProcessBindExist)
	}

	tx := r.db.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{ID: bindId}).
		Updates(&process)
	if tx.Error != nil {
		log.WithContext(ctx).Error("Update", zap.Error(err))
		return tx.Error
	}

	return nil
}

func (r *auditProcessBindRepo) Delete(ctx context.Context, bindID uint64) (err error) {
	exist, err := r.IsBindIdExist(ctx, bindID)
	if err != nil {
		log.WithContext(ctx).Error("Delete", zap.Error(err))
		return err
	}

	if !exist {
		log.WithContext(ctx).Error("Delete", zap.Error(errorcode.Desc(errorcode.AuditProcessIdNotExist)))
		return errorcode.Desc(errorcode.AuditProcessIdNotExist)
	}

	tx := r.db.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{ID: bindID}).
		Delete(&model.AuditProcessBind{})
	if tx.Error != nil {
		log.WithContext(ctx).Error("Delete", zap.Error(err))
		return tx.Error
	}

	return tx.Error
}

func (r *auditProcessBindRepo) IsBindIdExist(ctx context.Context, bindID uint64) (exist bool, err error) {
	var count int64
	tx := r.db.WithContext(ctx).Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{ID: bindID})

	tx.Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("IsBindIdExist", zap.Error(tx.Error))
		return false, tx.Error
	}
	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *auditProcessBindRepo) IsAuditProcessExist(ctx context.Context, auditType string, bindID uint64) (exist bool, err error) {
	var count int64
	tx := r.db.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{
			AuditType: auditType,
		})

	if bindID != 0 {
		tx = tx.Where("id != ?", bindID)
	}

	tx.Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("IsAuditProcessExist", zap.Error(tx.Error))
		return false, tx.Error
	}
	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *auditProcessBindRepo) DeleteByAuditType(ctx context.Context, auditType string) (err error) {
	process, err := r.GetByAuditType(ctx, auditType)
	if err != nil {
		log.WithContext(ctx).Error("GetAuditProcess", zap.Error(err))
		return err
	}
	if process.ProcDefKey == "" {
		return errorcode.Desc(errorcode.ProcDefKeyNotExist)
	}
	tx := r.db.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{AuditType: auditType}).
		Delete(&model.AuditProcessBind{})
	if tx.Error != nil {
		log.WithContext(ctx).Error("Delete", zap.Error(err))
		return tx.Error
	}
	return nil

}
