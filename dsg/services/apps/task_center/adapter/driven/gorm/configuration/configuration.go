package configuration

import (
	"context"
	"errors"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"gorm.io/gorm"
)

type Repo interface {
	GetUsingMode(tx *gorm.DB, ctx context.Context) (int, error)
	GetFirmName(tx *gorm.DB, ctx context.Context, firmID uint64) (string, error)
	GetConf(tx *gorm.DB, ctx context.Context, key string) (string, error)
}

func NewRepo(data *db.Data) Repo {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

func (r *repo) GetUsingMode(tx *gorm.DB, ctx context.Context) (mode int, err error) {
	var vals []string
	err = r.do(tx, ctx).Table("af_configuration.configuration").Select("value").Where("`key` = 'using'").Find(&vals).Error
	if err != nil {
		return 0, err
	}
	if len(vals) == 0 {
		return 0, errors.New("using mode config not existed")
	}
	return strconv.Atoi(vals[0])
}

func (r *repo) GetFirmName(tx *gorm.DB, ctx context.Context, firmID uint64) (firmName string, err error) {
	var vals []string
	err = r.do(tx, ctx).Table("af_configuration.t_firm").Select("name").Where("`id` = ?", firmID).Find(&vals).Error
	if err != nil {
		return "", err
	}
	if len(vals) > 0 {
		firmName = vals[0]
	}
	return
}

func (r *repo) GetConf(tx *gorm.DB, ctx context.Context, key string) (val string, err error) {
	var vals []string
	err = r.do(tx, ctx).Table("af_configuration.configuration").Select("value").Where("`key` = ?", key).Find(&vals).Error
	if err != nil {
		return "", err
	}
	if len(vals) > 0 {
		val = vals[0]
	}
	return
}
