package impl

import (
	"context"
	"errors"

	errorcode2 "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (r *repo) UpsertCanvas(ctx context.Context, obj *model.TModelCanva) error {
	columns := make([]clause.Column, 0)
	columns = append(columns, clause.Column{
		Name: "id",
	})
	if err := r.DB(ctx).Clauses(clause.OnConflict{
		Columns:   columns,
		DoUpdates: clause.AssignmentColumns([]string{"canvas"}),
	}).Create(obj).Error; err != nil {
		return errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

func (r *repo) GetCanvas(ctx context.Context, id string) (obj *model.TModelCanva, err error) {
	err = r.db.WithContext(ctx).Where("id=?", id).First(&obj).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &model.TModelCanva{
				ID:     id,
				Canvas: "",
			}, nil
		}
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return obj, nil
}
