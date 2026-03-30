package gorm

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type DeveloperRepo interface {
	DeveloperCreate(ctx context.Context, developer *model.Developer) (err error)
	DeveloperList(ctx context.Context, req *dto.DeveloperListReq) (developers []*model.Developer, count int64, err error)
	DeveloperGet(ctx context.Context, developerId string) (developer *model.Developer, err error)
	DeveloperUpdate(ctx context.Context, developerId string, developer *model.Developer) (err error)
	DeveloperDelete(ctx context.Context, developerId string) (err error)
	IsDeveloperIdExist(ctx context.Context, developerId string) (exist bool, err error)
}

type developerRepo struct {
	data *db.Data
}

func NewDeveloperRepo(data *db.Data) DeveloperRepo {
	return &developerRepo{data: data}
}

func (r *developerRepo) DeveloperCreate(ctx context.Context, developer *model.Developer) error {
	exist, err := r.IsDeveloperNameExist(ctx, developer.DeveloperName, "")
	if err != nil {
		log.WithContext(ctx).Error("DeveloperCreate", zap.Error(err))
		return err
	}

	if exist {
		log.WithContext(ctx).Error("DeveloperCreate", zap.Error(errorcode.Desc(errorcode.DeveloperNameExist)))
		return errorcode.Desc(errorcode.DeveloperNameExist)
	}

	tx := r.data.DB.WithContext(ctx).Create(developer)
	if tx.Error != nil {
		log.WithContext(ctx).Error("DeveloperCreate", zap.Error(tx.Error))
	}
	return tx.Error
}

func (r *developerRepo) DeveloperList(ctx context.Context, req *dto.DeveloperListReq) (developers []*model.Developer, count int64, err error) {
	tx := r.data.DB.WithContext(ctx).Model(&model.Developer{}).Scopes(Undeleted())

	if req.Name != "" {
		tx = tx.Where("developer_name like ?", EscapeLike("%", req.Name, "%"))
	}

	if req.Sort != "" {
		tx = tx.Order(req.Sort + " " + req.Direction)
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("DeveloperList", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	tx = tx.Scopes(Paginate(req.Offset, req.Limit)).Find(&developers)
	if tx.Error != nil {
		log.WithContext(ctx).Error("DeveloperList", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	return
}

func (r *developerRepo) DeveloperGet(ctx context.Context, developerId string) (developer *model.Developer, err error) {
	exist, err := r.IsDeveloperIdExist(ctx, developerId)
	if err != nil {
		log.WithContext(ctx).Error("DeveloperGet", zap.Error(err))
		return nil, err
	}

	if !exist {
		log.WithContext(ctx).Error("DeveloperGet", zap.Error(errorcode.Desc(errorcode.DeveloperIdNotExist)))
		return nil, errorcode.Desc(errorcode.DeveloperIdNotExist)
	}

	tx := r.data.DB.WithContext(ctx).
		Model(&model.Developer{}).
		Scopes(Undeleted()).
		Where(&model.Developer{DeveloperID: developerId}).
		First(&developer)

	if tx.Error != nil {
		log.WithContext(ctx).Error("DeveloperGet", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return developer, nil
}

func (r *developerRepo) DeveloperUpdate(ctx context.Context, developerId string, developer *model.Developer) (err error) {
	exist, err := r.IsDeveloperIdExist(ctx, developerId)
	if err != nil {
		log.WithContext(ctx).Error("DeveloperUpdate", zap.Error(err))
		return err
	}

	if !exist {
		log.WithContext(ctx).Error("DeveloperUpdate", zap.Error(errorcode.Desc(errorcode.DeveloperIdNotExist)))
		return errorcode.Desc(errorcode.DeveloperIdNotExist)
	}

	exist, err = r.IsDeveloperNameExist(ctx, developer.DeveloperName, developerId)
	if err != nil {
		log.WithContext(ctx).Error("DeveloperUpdate", zap.Error(err))
		return err
	}

	if exist {
		log.WithContext(ctx).Error("DeveloperUpdate", zap.Error(errorcode.Desc(errorcode.DeveloperNameExist)))
		return errorcode.Desc(errorcode.DeveloperNameExist)
	}

	tx := r.data.DB.WithContext(ctx).
		Model(&model.Developer{}).
		Scopes(Undeleted()).
		Where(&model.Developer{DeveloperID: developerId}).
		Updates(&developer)
	if tx.Error != nil {
		log.WithContext(ctx).Error("DeveloperUpdate", zap.Error(err))
		return tx.Error
	}

	return nil
}

func (r *developerRepo) DeveloperDelete(ctx context.Context, developerId string) (err error) {
	exist, err := r.IsDeveloperIdExist(ctx, developerId)
	if err != nil {
		log.WithContext(ctx).Error("DeveloperDelete", zap.Error(err))
		return err
	}

	if !exist {
		log.WithContext(ctx).Error("DeveloperDelete", zap.Error(errorcode.Desc(errorcode.DeveloperIdNotExist)))
		return errorcode.Desc(errorcode.DeveloperIdNotExist)
	}

	tx := r.data.DB.WithContext(ctx).
		Model(&model.Developer{}).
		Where(&model.Developer{DeveloperID: developerId}).
		Update("delete_time", time.Now().UnixMilli())
	if tx.Error != nil {
		log.WithContext(ctx).Error("DeveloperDelete", zap.Error(err))
		return tx.Error
	}

	return tx.Error
}

func (r *developerRepo) IsDeveloperNameExist(ctx context.Context, name string, developerId string) (bool, error) {
	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.Developer{}).Where(&model.Developer{DeveloperName: name}).Scopes(Undeleted())

	if developerId != "" {
		tx = tx.Where("developer_id != ?", developerId)
	}

	tx.Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("IsDeveloperNameExist", zap.Error(tx.Error))
		return false, tx.Error
	}
	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *developerRepo) IsDeveloperIdExist(ctx context.Context, developerId string) (exist bool, err error) {
	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.Developer{}).Where(&model.Developer{DeveloperID: developerId}).Scopes(Undeleted()).Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsDeveloperIdExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}
