package db

import (
	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/idrm-go-frame/core/options"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
)

func NewMariaDB(s *settings.Settings) (*gorm.DB, error) {
	return s.Database.NewClient()
}

// DatabaseAFDataModel  的别名，应该在 af_data_model 合并入 af_main 之后移除
type DatabaseAFDataModel gorm.DB

func NewDatabaseAFDataModel(s *settings.Settings) (*DatabaseAFDataModel, error) {
	opt := &options.DBOptions{}
	copier.Copy(opt, s.Database)
	opt.Database = "af_data_model"
	db, err := opt.NewClient()
	return (*DatabaseAFDataModel)(db), err
}

type GormDBWithoutDatabase gorm.DB

func NewGormDBWithoutDatabase(s *settings.Settings) (*GormDBWithoutDatabase, error) {
	opt := &options.DBOptions{}
	copier.Copy(opt, s.Database)
	opt.Database = ""
	db, err := opt.NewClient()
	return (*GormDBWithoutDatabase)(db), err
}

type GormDBConfigurationCenter gorm.DB

func (db *GormDBConfigurationCenter) DB() *gorm.DB {
	return (*gorm.DB)(db).Debug()
}

func NewConfigurationCenterDB(s *settings.Settings) (*GormDBConfigurationCenter, error) {
	opt := &options.DBOptions{}
	copier.Copy(opt, s.Database)
	opt.Database = "af_configuration"
	db, err := opt.NewClient()
	return (*GormDBConfigurationCenter)(db), err
}
