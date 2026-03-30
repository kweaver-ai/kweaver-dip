package impl

import (
	"context"
	"errors"
	"reflect"

	"gorm.io/gorm/logger"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/t_data_download_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

func NewTDataDownloadTaskRepo(db *gorm.DB) t_data_download_task.TDataDownloadTaskRepo {
	return &tDataDownloadTaskRepo{db: db}
}

type tDataDownloadTaskRepo struct {
	db *gorm.DB
}

func (r *tDataDownloadTaskRepo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.db.WithContext(ctx)
	}
	return tx
}

func (r *tDataDownloadTaskRepo) Create(ctx context.Context, tx *gorm.DB, m *model.TDataDownloadTask) error {
	return r.do(tx, ctx).Model(&model.TDataDownloadTask{}).Create(m).Error
}

func (r *tDataDownloadTaskRepo) Update(ctx context.Context, tx *gorm.DB, m *model.TDataDownloadTask) error {
	return r.do(tx, ctx).Model(&model.TDataDownloadTask{}).Where("id = ?", m.ID).Save(m).Error
}

func (r *tDataDownloadTaskRepo) Delete(ctx context.Context, tx *gorm.DB, id uint64) error {
	return r.do(tx, ctx).Model(&model.TDataDownloadTask{}).Where("id = ? and status in (1,3,4)", id).Delete(&model.TDataDownloadTask{}).Error
}

func (r *tDataDownloadTaskRepo) GetList(ctx context.Context, tx *gorm.DB, isTotalCountNeeded bool, params map[string]any) (int64, []*model.TDataDownloadTask, error) {
	var (
		totalCount int64
		datas      []*model.TDataDownloadTask
		err        error
	)
	session := r.do(tx, ctx).Session(&gorm.Session{Logger: logger.Default.LogMode(logger.Silent)})
	d := session.Model(&model.TDataDownloadTask{})
	if params["id"] != nil {
		d = d.Where("id = ?", params["id"])
	}

	if params["status"] != nil {
		switch reflect.TypeOf(params["status"]).Kind() {
		case reflect.Slice:
			d = d.Where("status in ?", params["status"].([]int))
		default:
			d = d.Where("status = ?", params["status"])
		}
	}

	if params["uid"] != nil {
		d = d.Where("created_by = ?", params["uid"])
	}

	if params["keyword"] != nil {
		kw := "%" + params["keyword"].(string) + "%"
		d = d.Where("name LIKE ? or name_en LIKE ?", kw, kw)
	}

	if isTotalCountNeeded {
		if err = d.Count(&totalCount).Error; err != nil {
			return 0, nil, err
		}
	}

	if params["sort"] != nil && params["direction"] != nil {
		if reflect.TypeOf(params["sort"]).Kind() == reflect.TypeOf(params["direction"]).Kind() {
			if reflect.TypeOf(params["sort"]).Kind() == reflect.Slice {
				sorts := params["sort"].([]string)
				directions := params["direction"].([]string)
				if len(sorts) != len(directions) {
					return 0, nil, errors.New("sort param num not equal to direction param num")
				}
				for i := range sorts {
					d = d.Order(sorts[i] + " " + directions[i])
				}
			} else {
				d = d.Order(params["sort"].(string) + " " + params["direction"].(string))
			}
		}
	}
	if params["offset"] != nil && params["limit"] != nil {
		d = d.Offset((params["offset"].(int) - 1) * params["limit"].(int)).
			Limit(params["limit"].(int))
	}
	d = d.Scan(&datas)
	return totalCount, datas, d.Error
}
