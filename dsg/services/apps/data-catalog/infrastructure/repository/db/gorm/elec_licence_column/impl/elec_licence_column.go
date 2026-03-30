package impl

import (
	"context"
	"fmt"
	"strings"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence_column"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

type ElecLicenceColumnRepo struct {
	db *gorm.DB
}

func NewElecLicenceColumnRepo(db *gorm.DB) elec_licence_column.ElecLicenceColumnRepo {
	return &ElecLicenceColumnRepo{db: db}
}

func (e *ElecLicenceColumnRepo) Create(ctx context.Context, column *model.ElecLicenceColumn) error {
	return e.db.WithContext(ctx).Create(column).Error
}

func (e *ElecLicenceColumnRepo) CreateInBatches(ctx context.Context, columns []*model.ElecLicenceColumn) error {
	batch_size := 500
	for i := 0; i < len(columns); i = i + batch_size {
		var batch []*model.ElecLicenceColumn
		if i+batch_size > len(columns)-1 {
			batch = columns[i : len(columns)-1]

		} else {
			batch = columns[i : i+batch_size]
		}
		err := e.db.WithContext(ctx).CreateInBatches(batch, len(batch)).Error
		if err != nil {
			return err
		}
	}
	return nil
}

func (e *ElecLicenceColumnRepo) Update(ctx context.Context, column *model.ElecLicenceColumn) error {
	return e.db.WithContext(ctx).Where("id=?", column.ID).Updates(column).Error
}

func (e *ElecLicenceColumnRepo) Delete(ctx context.Context, column *model.ElecLicenceColumn) error {
	return e.db.WithContext(ctx).Delete(column).Error
}

func (e *ElecLicenceColumnRepo) GetByID(ctx context.Context, id string) (*model.ElecLicenceColumn, error) {
	var column model.ElecLicenceColumn
	err := e.db.WithContext(ctx).Where("elec_licence_column_id=?", id).First(&column).Error
	if err != nil {
		log.WithContext(ctx).Errorf("Failed to get elec_licence_column by ID: %v", err)
		return nil, err
	}
	return &column, nil
}

func (e *ElecLicenceColumnRepo) GetByElecLicenceID(ctx context.Context, elec_licence_id string) (columns []*model.ElecLicenceColumn, err error) {
	err = e.db.WithContext(ctx).Table(model.TableNameElecLicenceColumn).Where("elec_licence_id=?", elec_licence_id).Find(&columns).Error
	return
}
func (e *ElecLicenceColumnRepo) GetByElecLicenceIDPage(ctx context.Context, req domain.GetElecLicenceColumnListReq) (totalCount int64, columns []*model.ElecLicenceColumn, err error) {
	db := e.db.WithContext(ctx).Table(model.TableNameElecLicenceColumn).Where("elec_licence_id=?", req.ElecLicenceID)
	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("technical_name like ? or business_name like ? ", keyword, keyword)
	}
	err = db.Count(&totalCount).Error
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" title %s", req.Direction))
	} else {
		switch req.Sort {
		case "created_at":
			db = db.Order(fmt.Sprintf("%s %s", "create_time", req.Direction))
		case "updated_at":
			db = db.Order(fmt.Sprintf("%s %s", "update_time", req.Direction))

		}
	}
	err = db.Find(&columns).Error
	return
}

func (e *ElecLicenceColumnRepo) GetByElecLicenceIDs(ctx context.Context, elec_licence_ids []string) ([]*model.ElecLicenceColumn, error) {
	var columns []*model.ElecLicenceColumn
	err := e.db.WithContext(ctx).Where("elec_licence_id in ?", elec_licence_ids).Find(&columns).Error
	return columns, err
}
func (e *ElecLicenceColumnRepo) Truncate(ctx context.Context) error {
	return e.db.WithContext(ctx).Exec("TRUNCATE elec_licence_column").Error
}
