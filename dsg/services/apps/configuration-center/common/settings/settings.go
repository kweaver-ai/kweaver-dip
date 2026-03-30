package settings

import (
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/anyrobot"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
)

type Config struct {
	LogPath                string      `yaml:"logPath"`
	Oauth                  OauthInfo   `yaml:"oauth"`
	DepServices            DepServices `yaml:"depServices"`
	MQType                 string      `yaml:"mqType"`
	KafkaMQ                KafkaMQ     `yaml:"kafkaMQ"`
	Nsq                    Nsq         `yaml:"nsq"`
	ProductVersion         string      `yaml:"productVersion"`
	BuildDate              string      `yaml:"buildDate"`
	VEClientExpire         string      `yaml:"VEClientExpire"`
	VEClientExpireDuration time.Duration
	Using                  string    `yaml:"using"`
	Redis                  RedisInfo `json:"redis"`
}
type OauthInfo struct {
	OAuthAdminHost    string `yaml:"oauthAdminHost"`
	OAuthAdminPort    int    `yaml:"oauthAdminPort"`
	OauthClientID     string `yaml:"oauthClientID"`
	OauthClientSecret string `yaml:"oauthClientSecret"`
}
type ConfigContains struct {
	Config Config `yaml:"config"`
}

var ConfigInstance ConfigContains

type SwagInfo struct {
	Host    string `yaml:"host"`
	Version string `yaml:"version"`
}

var SwagConfig SwagConf

type SwagConf struct {
	Doc SwagInfo `yaml:"doc"`
}

//var MQConf MQConfig

type MQConfig struct {
	NSQ NSQConfig `yaml:"nsq"`
}

// NSQConfig  configuration info
type NSQConfig struct {
	NSQLookupdHost string `yaml:"nsqlookupdHost"`
	NSQLookupdPort string `yaml:"nsqlookupdPort"`
	NSQDHost       string `yaml:"nsqdHost"`
	NSQDPort       string `yaml:"nsqdPort"`
	NSQDHTTPPort   string `yaml:"nsqdHttpPort"`
}
type DepServices struct {
	UserMgmPublic                string           `json:"userMgmPublic"`
	UserMgmPrivate               string           `json:"userMgmPrivate"`
	HydraAdmin                   string           `json:"hydraAdmin"`
	AnyRobotTraceUrl             string           `json:"anyRobotTraceUrl"`
	BusinessGroomingHost         string           `json:"businessGroomingHost"`
	VirtualizationEngineHost     string           `json:"virtualizationEngineHost"`
	VirtualizationEngineProtocol string           `json:"virtualizationEngineProtocol"`
	DataConnectionHost           string           `json:"dataConnectionHost"`
	DataConnectionProtocol       string           `json:"dataConnectionProtocol"`
	StandardizationHost          string           `json:"standardizationHost"`
	DataSubjectHost              string           `json:"dataSubjectHost"`
	ShareMgnIp                   string           `json:"shareMgnIp"`
	ShareMgnPort                 int              `json:"shareMgnPort"`
	TelemetryConf                telemetry.Config `json:"telemetry"`
	WorkFlowRestHost             string           `json:"workflowRestHost"`
	// AnyRobot 配置
	AnyRobot AnyRobotConf `json:"anyrobot,omitempty"`
	// Proton 提供的消息队列访问配置
	MQ              MQ     `json:"mq"`
	DataAdaptorHost string `json:"dataAdaptorHost"`
}

type KafkaMQ struct {
	Host     string         `json:"host"`
	ClientID string         `json:"clientID"`
	GroupID  string         `json:"groupID"`
	Sasl     MQSaslConf     `json:"sasl"`
	Producer MQProducerConf `json:"producer"`
}
type MQSaslConf struct {
	Enabled  bool   `json:"enabled"`
	User     string `json:"username"`
	Password string `json:"password"`
}
type MQProducerConf struct {
	SendBufSize int `json:"sendBufSize"`
	RecvBufSize int `json:"recvBufSize"`
}
type Nsq struct {
	Host        string `json:"host"`
	HttpHost    string `json:"httpHost"`
	LookupdHost string `json:"lookupdHost"`
}

// AnyRobotConf 定义 AnyRobot 客户端配置及所用到的 AnyRobot 中的资源
type AnyRobotConf struct {
	// 是否对接 AnyRobot
	Enabled bool `json:"enabled,string"`
	// 客户端配置
	anyrobot.Config `json:",inline"`
	// DataView ID，AnyFabric 使用这个 DataView 记录审计日志
	DataViewID string `json:"dataViewID,omitempty"`
}

type RedisConfig struct {
	Redis RedisConf `json:"redis"`
}
type RedisConf struct {
	Host         string `json:"host"`
	Password     string `json:"password"`
	DB           int    `json:"database,string"`
	MinIdleConns int    `json:"minIdleConns,string"`
}

type RedisInfo struct {
	ConnectInfo   RedisConnectInfo `json:"connectInfo" yaml:"connectInfo"`
	ConnectType   string           `json:"connectType" yaml:"connectType"`
	Database      string           `json:"database" yaml:"database"`
	RedisHost     string           `json:"redisHost" yaml:"redisHost"`
	RedisPassword string           `json:"redisPassword" yaml:"redisPasswords"`
}

type RedisConnectInfo struct {
	MasterGroupName  string `yaml:"masterGroupName"`
	Password         string `yaml:"password"`
	SentinelHost     string `yaml:"sentinelHost"`
	SentinelPassword string `yaml:"sentinelPassword"`
	SentinelPort     string `yaml:"sentinelPort"`
	SentinelUsername string `yaml:"sentinelUsername"`
	Username         string `yaml:"username"`
}
