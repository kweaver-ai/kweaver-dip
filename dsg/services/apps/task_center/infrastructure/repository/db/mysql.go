package db

import (
	"errors"
	"fmt"
	"log"
	"sync"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/uptrace/opentelemetry-go-extra/otelgorm"
	"gorm.io/gorm"
)

//var RepositoryProviderSet = wire.NewSet(NewData, db.NewGreeterRepo, business_domain.NewBusinessDomainRepo, business_authority.NewBusinessAuthorityRepo)
//var RepositoryProviderSet = wire.NewSet(NewData, db.NewGreeterRepo, business_authority.NewBusinessAuthorityRepo)

// var RepositoryProviderSet = wire.NewSet(NewData, db.NewGreeterRepo, business_domain.NewBusinessDomainRepo)
// var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))
var (
	once sync.Once
)

// Data .
type Data struct {
	// TODO wrapped database client
	DB *gorm.DB
}

// NewData .
func NewData(database *Database) (*Data, func(), error) {
	var err error
	var client *gorm.DB
	once.Do(func() {
		client, err = database.Default.NewClient()
	})
	if err != nil {
		log.Fatal("open mysql failed,err:", err)
		return nil, nil, err
	}
	// 数据库添加otelgorm插件
	if err := client.Use(otelgorm.NewPlugin()); err != nil {
		log.Printf("init db otelgorm, err: %v\n", err.Error())
		return nil, nil, err
	}
	return &Data{
			DB: client,
		}, func() {
			log.Println("closing the data resources")
		}, nil
}

type Database struct {
	Default  options.DBOptions `json:"default"`
	Default1 options.DBOptions `json:"default1"`
}

func initDBApi(database *Database) error {
	fileSource := "file:/usr/local/bin/af/infrastructure/repository/db/gen/migration"
	dns := fmt.Sprintf("mysql://%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", database.Default.Username, database.Default.Password, database.Default.Host, database.Default.Database)

	m, err := migrate.New(
		fileSource,
		dns)
	if err != nil {
		log.Fatalf("migrate.New err: %v\n", err.Error())
		return err
	}
	err = m.Up()
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Println(err.Error())
			return nil
		}
		log.Fatalf(" m.Up() err: %v\n", err.Error())
		return err
	}
	return nil
}
