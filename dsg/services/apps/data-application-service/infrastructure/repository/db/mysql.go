package db

import (
	"sync"

	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/uptrace/opentelemetry-go-extra/otelgorm"
	"gorm.io/gorm"
)

var (
	once   sync.Once
	client *gorm.DB
)

type Data struct {
	// TODO wrapped database client
	DB *gorm.DB
}

func NewGormDB(data *Data) *gorm.DB {
	return data.DB
}

func NewData(s *settings.Settings) (data *Data, cancel func(), err error) {
	once.Do(func() {
		client, err = s.Database.NewClient()
	})

	if err := client.Use(otelgorm.NewPlugin()); err != nil {
		log.Errorf("init db otelgorm, err: %v\n", err.Error())
		return nil, nil, err
	}

	if err != nil {
		log.Errorf("open mysql failed, err: %v", err)
		return nil, nil, err
	}

	//if os.Getenv("init_db") == "true" {
	//dsn := dsn(s.Database.Default)
	//if err = initDB(dsn); err != nil {
	//	log.Errorf("init db failed, err: %v\n", err.Error())
	//	return nil, nil, err
	//}
	//os.Exit(0)
	//}
	return &Data{
			DB: client,
		}, func() {
			log.Info("closing the data resources")
		}, nil
}
