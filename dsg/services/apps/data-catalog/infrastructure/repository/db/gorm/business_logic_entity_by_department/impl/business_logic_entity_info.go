package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/business_logic_entity_by_department"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) business_logic_entity_by_department.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(ctx context.Context) *gorm.DB {
	return r.data.DB.WithContext(ctx)
}

func (r *repo) Update(ctx context.Context, infos []*model.TBusinessLogicEntityByDepartment) error {
	var model *model.TBusinessLogicEntityByDepartment
	tx := r.data.DB.WithContext(ctx).Begin()
	err := tx.Where("id > 0").Delete(&model).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	if len(infos) > 0 {
		err = tx.Create(infos).Error
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit().Error
}

func (r *repo) Get(ctx context.Context) (model []*model.TBusinessLogicEntityByDepartment, err error) {
	db := r.data.DB.WithContext(ctx).Table("t_business_logic_entity_by_department").Order("business_logic_entity_count desc").Scan(&model)
	if errors.Is(db.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return model, db.Error
}
