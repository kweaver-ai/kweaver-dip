package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/standard_info"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/util/iter"
	"gorm.io/gorm"
)

type standardInfoRepo struct {
	db *gorm.DB
}

func NewStandardInfoRepo(db *gorm.DB) standard_info.StandardInfoRepo {
	return &standardInfoRepo{db: db}
}

func (s *standardInfoRepo) Create(ctx context.Context, standard *model.StandardInfo) error {
	return s.db.WithContext(ctx).Table(model.TableNameStandardInfo).Create(&standard).Error
}

func (s *standardInfoRepo) GetStandardById(ctx context.Context, id uint64) (standard *model.StandardInfo, err error) {
	err = s.db.WithContext(ctx).Table(model.TableNameStandardInfo).Where("id = ?", id).First(&standard).Error
	return standard, err
}

func (s *standardInfoRepo) GetStandardByIdSlice(ctx context.Context, idSlice ...uint64) (standardSlice []*model.StandardInfo, err error) {
	err = s.db.WithContext(ctx).Table(model.TableNameStandardInfo).Where("id in (?)", idSlice).Find(&standardSlice).Error
	return standardSlice, err
}

func (s *standardInfoRepo) Upsert(ctx context.Context, standards []*model.StandardInfo) (err error) {
	ids := iter.Gen(standards, func(d *model.StandardInfo) string {
		return fmt.Sprintf("%v", d.ID)
	})
	if len(ids) <= 0 {
		return nil
	}
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		//删除所有已存在的
		if err = tx.Where("id in ?", ids).Delete(&model.StandardInfo{}).Error; err != nil {
			return err
		}
		//插入新的
		return tx.Create(&standards).Error
	})
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}
