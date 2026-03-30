// Package config 配置定义
package config

import "github.com/zeromicro/go-zero/core/stores/cache"

// Config 配置结构
type Config struct {
	// Name 服务名称
	Name string
	// Mode 运行模式
	Mode string

	// Log 日志配置
	Log struct {
		ServiceName string
		Mode        string
		Level       string
	}

	// Telemetry 链路追踪配置
	Telemetry struct {
		Name    string
		Endpoint string
		Sampler  float64
		Batcher  string
	}

	// MQ 消息队列配置
	MQ struct {
		// Type 类型：kafka, redis
		Type string
		// Kafka 配置
		Kafka struct {
			Brokers  []string
			Topic    string
			Group    string
			Username string `json:",optional"` // SASL 用户名
			Password string `json:",optional"` // SASL 密码
		}
		// Redis 配置 (当 Type=redis 时使用)
		Redis struct {
			Host     string
			Port     int
			Password string
			Channel  string
		}
	}

	// DB 数据库配置
	DB struct {
		Default struct {
			Host            string
			Port            int
			Database        string
			Username        string
			Password        string
			Charset         string
			MaxIdleConns    int
			MaxOpenConns    int
			ConnMaxLifetime int
			LogLevel        string
			SlowThreshold   int
			// DataSource 自动生成数据源
			DataSource string `json:",optional"`
		}
	}

	// Cache 缓存配置
	Cache cache.CacheConf
}
