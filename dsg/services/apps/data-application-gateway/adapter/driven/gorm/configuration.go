package gorm

import (
	"context"
	"errors"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db"
	"gorm.io/gorm"
)

type ConfigurationRepo interface {
	GetUsingMode(tx *gorm.DB, ctx context.Context) (int, error)
	GetFirmName(tx *gorm.DB, ctx context.Context, firmID uint64) (string, error)
	GetConf(tx *gorm.DB, ctx context.Context, key string) (string, error)
}

func NewConfigurationRepo(data *db.Data) ConfigurationRepo {
	return &configurationRepo{data: data}
}

type configurationRepo struct {
	data *db.Data
}

func (r *configurationRepo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

func (r *configurationRepo) GetUsingMode(tx *gorm.DB, ctx context.Context) (mode int, err error) {
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

func (r *configurationRepo) GetFirmName(tx *gorm.DB, ctx context.Context, firmID uint64) (firmName string, err error) {
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

func (r *configurationRepo) GetConf(tx *gorm.DB, ctx context.Context, key string) (val string, err error) {
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
