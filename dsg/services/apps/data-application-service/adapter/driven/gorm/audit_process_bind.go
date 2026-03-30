package gorm

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AuditProcessBindRepo interface {
	Create(ctx context.Context, process *model.AuditProcessBind) (err error)
	List(ctx context.Context, req *dto.AuditProcessBindListReq) (processes []*model.AuditProcessBind, count int64, err error)
	Get(ctx context.Context, bindId string) (process *model.AuditProcessBind, err error)
	GetByAuditType(ctx context.Context, AuditType string) (process *model.AuditProcessBind, err error)
	Update(ctx context.Context, bindId string, process *model.AuditProcessBind) (err error)
	Delete(ctx context.Context, bindId string) (err error)
	IsBindIdExist(ctx context.Context, bindId string) (exist bool, err error)
	IsAuditProcessExist(ctx context.Context, auditType string, bindID string) (exist bool, err error)
	QueryAuditProcessBindInfo(ctx context.Context) (isBindOnline bool, isBindOffline bool, err error)
}

type auditProcessBindRepo struct {
	data *db.Data
}

func NewAuditProcessBindRepo(data *db.Data) AuditProcessBindRepo {
	return &auditProcessBindRepo{data: data}
}

func (r *auditProcessBindRepo) Create(ctx context.Context, process *model.AuditProcessBind) (err error) {
	exist, err := r.IsAuditProcessExist(ctx, process.AuditType, "")
	if err != nil {
		log.WithContext(ctx).Error("Create", zap.Error(err))
		return err
	}

	if exist {
		log.WithContext(ctx).Error("Create", zap.Error(errorcode.Desc(errorcode.AuditProcessBindExist)))
		return errorcode.Desc(errorcode.AuditProcessBindExist)
	}

	tx := r.data.DB.WithContext(ctx).Create(process)
	if tx.Error != nil {
		log.WithContext(ctx).Error("Create", zap.Error(tx.Error))
	}
	return tx.Error
}

func (r *auditProcessBindRepo) List(ctx context.Context, req *dto.AuditProcessBindListReq) (processes []*model.AuditProcessBind, count int64, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.AuditProcessBind{})

	if req.AuditType != "" {
		tx = tx.Where("audit_type = ?", req.AuditType)
	}

	if req.Sort != "" {
		tx = tx.Order(req.Sort + " " + req.Direction)
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	tx = tx.Scopes(Paginate(req.Offset, req.Limit)).Find(&processes)
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	return
}

func (r *auditProcessBindRepo) Get(ctx context.Context, bindId string) (process *model.AuditProcessBind, err error) {
	exist, err := r.IsBindIdExist(ctx, bindId)
	if err != nil {
		log.WithContext(ctx).Error("Get", zap.Error(err))
		return nil, err
	}

	if !exist {
		log.WithContext(ctx).Error("Get", zap.Error(errorcode.Desc(errorcode.AuditProcessIdNotExist)))
		return nil, errorcode.Desc(errorcode.AuditProcessIdNotExist)
	}

	tx := r.data.DB.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{BindID: bindId}).
		First(&process)

	if tx.Error != nil {
		log.WithContext(ctx).Error("Get", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return process, nil
}

func (r *auditProcessBindRepo) GetByAuditType(ctx context.Context, auditType string) (process *model.AuditProcessBind, err error) {
	tx := r.data.DB.WithContext(ctx).
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

func (r *auditProcessBindRepo) Update(ctx context.Context, bindId string, process *model.AuditProcessBind) (err error) {
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
		log.WithContext(ctx).Error("Update", zap.Error(errorcode.Desc(errorcode.AuditProcessIdNotExist)))
		return errorcode.Desc(errorcode.AuditProcessBindExist)
	}

	tx := r.data.DB.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{BindID: bindId}).
		Updates(&process)
	if tx.Error != nil {
		log.WithContext(ctx).Error("Update", zap.Error(err))
		return tx.Error
	}

	return nil
}

func (r *auditProcessBindRepo) Delete(ctx context.Context, bindId string) (err error) {
	exist, err := r.IsBindIdExist(ctx, bindId)
	if err != nil {
		log.WithContext(ctx).Error("Delete", zap.Error(err))
		return err
	}

	if !exist {
		log.WithContext(ctx).Error("Delete", zap.Error(errorcode.Desc(errorcode.AuditProcessIdNotExist)))
		return errorcode.Desc(errorcode.AuditProcessIdNotExist)
	}

	tx := r.data.DB.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{BindID: bindId}).
		Delete(&model.AuditProcessBind{})
	if tx.Error != nil {
		log.WithContext(ctx).Error("Delete", zap.Error(err))
		return tx.Error
	}

	return tx.Error
}

func (r *auditProcessBindRepo) IsBindIdExist(ctx context.Context, bindId string) (exist bool, err error) {
	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{BindID: bindId})

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

func (r *auditProcessBindRepo) IsAuditProcessExist(ctx context.Context, auditType string, bindID string) (exist bool, err error) {
	var count int64
	tx := r.data.DB.WithContext(ctx).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{
			AuditType: auditType,
		})

	if bindID != "" {
		tx = tx.Where("bind_id != ?", bindID)
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

func (r *auditProcessBindRepo) QueryAuditProcessBindInfo(ctx context.Context) (isBindOnline bool, isBindOffline bool, err error) {
	onlineProcess := &model.AuditProcessBind{}
	tx := r.data.DB.WithContext(ctx).First(onlineProcess, "audit_type = ?", enum.AuditTypeOnline)
	if tx.Error == nil {
		isBindOnline = true
	} else {
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) { //未找到就返回false
			isBindOnline = false
		} else {
			log.WithContext(ctx).Error("QueryAuditProcessBindInfo", zap.Error(tx.Error))
			return false, false, tx.Error
		}
	}
	offlineProcess := &model.AuditProcessBind{}
	tx = r.data.DB.WithContext(ctx).First(offlineProcess, "audit_type = ?", enum.AuditTypeOffline)
	if tx.Error == nil {
		isBindOffline = true
	} else {
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			isBindOffline = false
		} else {
			log.WithContext(ctx).Error("QueryAuditProcessBindInfo", zap.Error(tx.Error))
			return false, false, tx.Error
		}
	}
	return
}
