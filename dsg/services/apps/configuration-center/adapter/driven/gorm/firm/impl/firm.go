package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/firm"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

const (
	historyInsetSql = `INSERT INTO t_firm_history (
		id, name, uniform_code, 
		legal_represent, contact_phone, 
		created_at, created_by, 
		updated_at, updated_by, 
		deleted_at, deleted_by) 
	  SELECT 
		id, name, uniform_code, 
		legal_represent, contact_phone, 
		created_at, created_by, 
		updated_at, updated_by, 
		?, ?    
	  FROM t_firm 
	  WHERE id in ?;`
)

func NewRepo(db *gorm.DB) firm.Repo {
	return &repo{db: db}
}

type repo struct {
	db *gorm.DB
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.db.WithContext(ctx)
	}
	return tx
}

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.TFirm) error {
	return r.do(tx, ctx).Model(&model.TFirm{}).Create(m).Error
}

func (r *repo) BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.TFirm) error {
	return r.do(tx, ctx).Model(&model.TFirm{}).CreateInBatches(m, len(m)).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.TFirm) error {
	return r.do(tx, ctx).Model(&model.TFirm{}).Where("id = ?", m.ID).Save(m).Error
}

func (r *repo) Delete(tx *gorm.DB, ctx context.Context, uid string, ids []uint64) error {
	d := r.do(tx, ctx).Exec(historyInsetSql, time.Now(), uid, ids)
	if d.Error == nil && d.RowsAffected > 0 {
		f := &model.TFirm{}
		d = d.Model(f).Delete(f, "id in ?", ids)
	}
	return d.Error
}

func (r *repo) GetList(tx *gorm.DB, ctx context.Context, params map[string]any) (int64, []*model.TFirm, error) {
	var (
		totalCount int64
		datas      []*model.TFirm
	)

	d := r.do(tx, ctx).Model(&model.TFirm{})
	if params["ids"] != nil {
		d = d.Where("id in ?", params["ids"])
	}

	if params["keyword"] != nil {
		kw := "%" + util.KeywordEscape(params["keyword"].(string)) + "%"
		d = d.Where("(name LIKE ? OR uniform_code LIKE ? OR legal_represent LIKE ?)", kw, kw, kw)
	}

	err := d.Count(&totalCount).Error
	if err == nil {
		if params["sort"] != nil && params["direction"] != nil {
			d = d.Order(params["sort"].(string) + " " + params["direction"].(string))
		}
		d = d.Order("updated_at desc")
		if params["offset"] != nil && params["limit"] != nil {
			d = d.Offset((params["offset"].(int) - 1) * params["limit"].(int)).
				Limit(params["limit"].(int))
		}
		d = d.Scan(&datas)
		err = d.Error
	}
	return totalCount, datas, err
}

func (r *repo) CheckExistedByFieldVal(tx *gorm.DB, ctx context.Context, field firm.CheckFieldType, value string) (bool, error) {
	var count int
	d := r.do(tx, ctx).
		Model(&model.TFirm{}).
		Select("count(1)")
	switch field {
	case firm.FIRM_NAME:
		d = d.Where("name = ?", value)
	case firm.FIRM_UNIFORM_CODE:
		d = d.Where("uniform_code = ?", value)
	}
	if err := d.Take(&count).
		Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
