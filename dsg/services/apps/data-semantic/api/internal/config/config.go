// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package config

import (
	"fmt"

	"github.com/jinguoxing/idrm-go-base/telemetry"
	"github.com/zeromicro/go-zero/rest"
)

type Config struct {
	rest.RestConf

	// Telemetry 配置
	Telemetry telemetry.Config

	// JWT 认证配置
	Auth AuthConfig

	// Swagger 配置
	Swagger SwaggerConfig

	// 数据库配置
	DB DBConfig

	// Redis 配置
	Redis RedisConfig

	// AI 服务配置
	AIService AIServiceConfig

	// UserManagement 服务配置
	UserManagement UserManagementConfig

	// AgentRetrieval 服务配置
	AgentRetrieval AgentRetrievalConfig

	// Kafka 配置
	Kafka KafkaConfig
}

// DBConfig 数据库配置
type DBConfig struct {
	Default DatabaseConfig
}

// DatabaseConfig 数据库连接配置
type DatabaseConfig struct {
	Host            string `json:",default=localhost"`
	Port            int    `json:",default=3306"`
	Database        string `json:",optional"`
	Username        string `json:",optional"`
	Password        string `json:",optional"`
	Charset         string `json:",default=utf8mb4"`
	MaxIdleConns    int    `json:",default=10"`
	MaxOpenConns    int    `json:",default=100"`
	ConnMaxLifetime int    `json:",default=3600"`
	ConnMaxIdleTime int    `json:",default=600"`
}

// DataSource 生成数据源连接字符串
func (d DatabaseConfig) DataSource() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=true&loc=Local&timeout=180s&readTimeout=180s&writeTimeout=180s&collation=utf8mb4_unicode_ci",
		d.Username,
		d.Password,
		d.Host,
		d.Port,
		d.Database,
		d.Charset,
	)
}

// AuthConfig JWT 认证配置
type AuthConfig struct {
	AccessSecret     string `json:",optional"`     // JWT 签名密钥
	AccessExpire     int64  `json:",default=7200"` // Token 过期时间(秒)
	HydraAdminURL    string `json:",default=http://localhost:4445"` // Hydra Admin URL
	HydraTimeoutSec  int    `json:",default=10"`   // Hydra 请求超时时间(秒)
}

// SwaggerConfig Swagger 文档配置
type SwaggerConfig struct {
	Enabled bool   `json:",default=true"`
	Path    string `json:",default=api/doc/swagger"`
}

// RedisConfig Redis 配置
type RedisConfig struct {
	Host     string `json:",default=localhost"`
	Port     int    `json:",default=6379"`
	Password string `json:",optional"`
	DB       int    `json:",default=0"`
}

// Addr 返回 Redis 地址
func (r RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

// AIServiceConfig AI 服务配置
type AIServiceConfig struct {
	URL            string `json:",optional"` // AI 服务地址，如 http://ai-service:8080
	TimeoutSeconds int    `json:",default=10"` // HTTP 请求超时时间（秒）
}

// UserManagementConfig 用户管理服务配置
type UserManagementConfig struct {
	URL            string `json:",optional"` // UserManagement 服务地址
	TimeoutSeconds int    `json:",default=10"` // HTTP 请求超时时间（秒）
}

// AgentRetrievalConfig AgentRetrieval 服务配置
type AgentRetrievalConfig struct {
	URL            string `json:",optional"` // AgentRetrieval 服务地址，如 http://agent-retrieval:30779
	TimeoutSeconds int    `json:",default=30"` // HTTP 请求超时时间（秒）
}

// KafkaConfig Kafka 配置
type KafkaConfig struct {
	Brokers  []string `json:",optional"` // Kafka broker 地址列表
	Username string   `json:",optional"` // SASL 用户名
	Password string   `json:",optional"` // SASL 密码
}
