package db

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/uptrace/opentelemetry-go-extra/otelgorm"
	"gorm.io/gorm"
)

// Data .
type Data struct {
	DB *gorm.DB

	AFConfiguration *gorm.DB
	AFMain          *gorm.DB
}

func NewGormDB(d *Data) *gorm.DB {
	return d.DB
}

// NewData .
func NewData(config *settings.Config) (*Data, func(), error) {
	client, err := config.Database.NewClient()
	if err != nil {
		log.Errorf("open mysql failed, err: %v", err)
		return nil, nil, err
	}
	// 数据库添加otelgorm插件
	if err = client.Use(otelgorm.NewPlugin()); err != nil {
		log.Errorf("init db otelgorm, err: %v", err.Error())
		return nil, nil, err
	}

	globalDB := &Data{
		DB: client,
	}

	// af_configuration
	{
		opts := config.Database
		opts.Database = "af_configuration"
		db, err := opts.NewClient()
		if err != nil {
			return nil, func() {}, err
		}
		globalDB.AFConfiguration = db
	}

	// af_main
	{
		opts := config.Database
		opts.Database = "af_main"
		db, err := opts.NewClient()
		if err != nil {
			return nil, func() {}, err
		}
		globalDB.AFMain = db
	}

	return globalDB, func() {
		log.Info("closing the data resources")
	}, nil
}
