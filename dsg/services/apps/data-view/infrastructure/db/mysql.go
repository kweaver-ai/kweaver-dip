package db

import (
	"context"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/uptrace/opentelemetry-go-extra/otelgorm"
	"gorm.io/gorm"
	"sync"
)

var (
	once sync.Once
)

func NewDB(conf *my_config.Bootstrap) (*gorm.DB, func(), error) {
	var err error
	var db *gorm.DB
	once.Do(func() {
		opts := &options.DBOptions{
			DBType:                conf.Database.Dbtype,
			Host:                  conf.Database.Host,
			Port:                  conf.Database.Port,
			Username:              conf.Database.Username,
			Password:              conf.Database.Password,
			Database:              conf.Database.Database,
			MaxIdleConnections:    int(conf.Database.MaxIdleConnections),
			MaxOpenConnections:    int(conf.Database.MaxOpenConnections),
			MaxConnectionLifeTime: int(conf.Database.MaxConnectionLifeTime),
			MaxConnectionIdleTime: int(conf.Database.MaxConnectionIdleTime),
			LogLevel:              int(conf.Database.Loglevel),
			IsDebug:               conf.Database.Isdebug,
			TablePrefix:           conf.Database.Tableprefix,
		}
		db, err = opts.NewClient()
	})
	ctx := context.Background()
	if err != nil {
		log.WithContext(ctx).Errorf("open mysql failed, err: %v", err)
		return nil, nil, err
	}
	if err = db.Use(otelgorm.NewPlugin()); err != nil {
		log.WithContext(ctx).Errorf("init db otelgorm, err: %v\n", err.Error())
		return nil, nil, err
	}

	return db, func() {
		log.Info("closing the data resources")
	}, nil
}
