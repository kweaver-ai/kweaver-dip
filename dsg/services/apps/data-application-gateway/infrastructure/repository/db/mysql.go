package db

import (
	"sync"

	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/uptrace/opentelemetry-go-extra/otelgorm"
	"gorm.io/gorm"
)

var (
	once   sync.Once
	client *gorm.DB
)

type Data struct {
	DB *gorm.DB
}

func NewData(s *settings.Settings) (data *Data, cancel func(), err error) {
	client, err = s.Database.NewClient()
	if err != nil {
		log.Errorf("open mysql failed, err: %v", err)
		return nil, nil, err
	}
	if err := client.Use(otelgorm.NewPlugin()); err != nil {
		log.Errorf("init db otelgorm, err: %v\n", err.Error())
		return nil, nil, err
	}
	return &Data{
		DB: client,
	}, gormx.ReleaseFunc(client), nil
}
