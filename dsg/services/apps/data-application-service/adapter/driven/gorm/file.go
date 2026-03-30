package gorm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type FileRepo interface {
	FileCreate(ctx context.Context, file *model.File) error
	FileUpdate(ctx context.Context, fileId, newFileName, newFileType string) error
	FileGetByHash(ctx context.Context, hash string) (file *model.File, err error)
	FileGetById(ctx context.Context, fileId string) (file *model.File, err error)
	IsFileExist(ctx context.Context, fileId string) (exist bool, err error)
}

type fileRepo struct {
	data *db.Data
}

func NewFileRepo(data *db.Data) FileRepo {
	return &fileRepo{data: data}
}

func (r *fileRepo) FileCreate(ctx context.Context, file *model.File) error {
	tx := r.data.DB.WithContext(ctx).Create(file)
	if tx.Error != nil {
		log.WithContext(ctx).Error("FileCreate", zap.Error(tx.Error))
	}

	return nil
}

func (r *fileRepo) FileUpdate(ctx context.Context, fileId, newFileName, newFileType string) error {
	tx := r.data.DB.WithContext(ctx).
		Model(&model.File{}).
		Where(&model.File{FileID: fileId}).
		Updates(&model.File{FileName: newFileName, FileType: newFileType})

	if tx.Error != nil {
		log.WithContext(ctx).Error("FileUpdate", zap.Error(tx.Error))
	}

	return nil
}

func (r *fileRepo) FileGetByHash(ctx context.Context, hash string) (file *model.File, err error) {
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.File{}).
		Where(&model.File{FileHash: hash}).
		Find(&file)

	if tx.Error != nil {
		log.WithContext(ctx).Error("FileGetByHash", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return file, nil
}

func (r *fileRepo) FileGetById(ctx context.Context, fileId string) (file *model.File, err error) {
	tx := r.data.DB.WithContext(ctx).Scopes(Undeleted()).
		Model(&model.File{}).
		Where(&model.File{FileID: fileId}).
		Find(&file)

	if tx.Error != nil {
		log.WithContext(ctx).Error("FileGetById", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return file, nil
}

func (r *fileRepo) IsFileExist(ctx context.Context, fileId string) (exist bool, err error) {
	if fileId == "" {
		return false, nil
	}

	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.File{}).Scopes(Undeleted()).Where(&model.File{FileID: fileId}).Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("IsFileExist", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}
