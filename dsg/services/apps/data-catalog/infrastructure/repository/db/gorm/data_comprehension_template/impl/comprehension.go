package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension_template"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TDataComprehensionTemplateRepo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) data_comprehension_template.Repo {
	return &TDataComprehensionTemplateRepo{db: db}
}
func (f *TDataComprehensionTemplateRepo) Db() *gorm.DB {
	return f.db
}
func (f *TDataComprehensionTemplateRepo) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return f.db
}
func (r *TDataComprehensionTemplateRepo) GetTDataComprehensionTemplateById(ctx context.Context, id string) (TDataComprehensionTemplate *model.TDataComprehensionTemplate, err error) {
	err = r.db.WithContext(ctx).Where("id =? and deleted_at=0", id).Take(&TDataComprehensionTemplate).Error
	return
}
func (r *TDataComprehensionTemplateRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (TDataComprehensionTemplate *model.TDataComprehensionTemplate, err error) {
	err = r.do(tx).WithContext(ctx).Unscoped().Table(model.TableNameTDataComprehensionTemplate).Where("id =? ", id).Take(&TDataComprehensionTemplate).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.DataComprehensionTemplateNotExist)
		}
		log.WithContext(ctx).Error("TDataComprehensionTemplateRepo GetById DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return
}

func (r *TDataComprehensionTemplateRepo) PageList(ctx context.Context, req *domain.GetTemplateListReq) (total int64, list []*model.TDataComprehensionTemplate, err error) {
	var db *gorm.DB
	db = r.db.WithContext(ctx).Table("t_data_comprehension_template t").Where("t.deleted_at=0") //deleted_at=0   for count without deleted_at

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("t.name like ? ", keyword)
	}
	err = db.Count(&total).Error
	if err != nil {
		return total, list, err
	}
	limit := req.Limit
	offset := limit * (req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" t.name %s", req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
	}
	err = db.Find(&list).Error
	return total, list, err
}

func (r *TDataComprehensionTemplateRepo) Create(ctx context.Context, TDataComprehensionTemplate *model.TDataComprehensionTemplate, tx ...*gorm.DB) error {
	return r.do(tx).WithContext(ctx).Create(TDataComprehensionTemplate).Error
}

func (r *TDataComprehensionTemplateRepo) Update(ctx context.Context, TDataComprehensionTemplate *model.TDataComprehensionTemplate) (err error) {
	err = r.db.WithContext(ctx).
		Select("name", "description",
			"business_object",
			"time_range", "time_field_comprehension",
			"spatial_range", "spatial_field_comprehension",
			"business_special_dimension", "compound_expression", "service_range", "service_areas", "front_support", "negative_support",
			"protect_control", "promote_push").
		Where("id=?", TDataComprehensionTemplate.ID).Save(TDataComprehensionTemplate).Error
	return err
}

func (r *TDataComprehensionTemplateRepo) Delete(ctx context.Context, TDataComprehensionTemplate *model.TDataComprehensionTemplate, tx ...*gorm.DB) error {
	return r.do(tx).WithContext(ctx).Select("deleted_at", "deleted_uid").Where("id=?", TDataComprehensionTemplate.ID).Updates(TDataComprehensionTemplate).Error
}
func (r *TDataComprehensionTemplateRepo) NameExist(ctx context.Context, id, name string) error {
	var comprehensionTemplate *model.TDataComprehensionTemplate
	tx := r.db.WithContext(ctx).Where("name=?  and deleted_at=0", name)
	if id != "" {
		tx.Where("id !=?", id)
	}
	err := tx.Take(&comprehensionTemplate).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	return errorcode.Desc(errorcode.DataComprehensionTemplateNameRepeat)
}
