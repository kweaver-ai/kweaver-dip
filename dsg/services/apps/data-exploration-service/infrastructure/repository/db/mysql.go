package db

import (
	"sync"
	"time"

	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
)

var (
	once sync.Once
)

// Data .
type Data struct {
	DB       *gorm.DB
	RedisCli redis.UniversalClient
}

// NewData .
func NewData() (*Data, func(), error) {
	var err error
	var client *gorm.DB
	var redisCli redis.UniversalClient
	once.Do(func() {
		client, err = settings.GetConfig().DBOptions.NewClient()
		if err != nil {
			return
		}

		redisConf := settings.GetConfig().Redis
		redisCli = redis.NewUniversalClient(&redis.UniversalOptions{
			Addrs:            []string{redisConf.Addr},
			ClientName:       redisConf.ClientName,
			DB:               redisConf.DB,
			Protocol:         3,
			Password:         redisConf.Password,
			SentinelPassword: redisConf.SentinelPassword,
			MaxRetries:       redisConf.MaxRetries,
			MinRetryBackoff:  time.Duration(redisConf.MinRetryBackoff) * time.Millisecond,
			MaxRetryBackoff:  time.Duration(redisConf.MaxRetryBackoff) * time.Millisecond,
			DialTimeout:      time.Duration(redisConf.DialTimeout) * time.Millisecond,
			ReadTimeout:      time.Duration(redisConf.ReadTimeout) * time.Millisecond,
			WriteTimeout:     time.Duration(redisConf.WriteTimeout) * time.Millisecond,
			PoolSize:         redisConf.PoolSize,
			PoolTimeout:      time.Duration(redisConf.PoolTimeout) * time.Millisecond,
			MinIdleConns:     redisConf.MinIdleConns,
			MaxIdleConns:     redisConf.MaxIdleConns,
			ConnMaxIdleTime:  time.Duration(redisConf.ConnMaxIdleTime) * time.Minute,
			ConnMaxLifetime:  time.Duration(redisConf.ConnMaxLifetime) * time.Minute,
			MasterName:       redisConf.MasterName,
		})
	})
	if err != nil {
		log.Errorf("open mysql failed, err: %v", err)
		return nil, nil, err
	}

	return &Data{
			DB:       client,
			RedisCli: redisCli,
		}, func() {
			log.Info("closing the data resources")
			if err := redisCli.Close(); err != nil {
				log.Warnf("failed to close redis client, err: %v", err)
			}
		}, nil
}
