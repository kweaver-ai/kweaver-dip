package settings

import (
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
)

var ConfigInstance ConfigContains

type ConfigContains struct {
	HttpPort string   `json:"httpPort"`
	Config   Config   `json:"config"`
	Doc      SwagInfo `json:"doc"`
	//Redis    Redis    `json:"redis"`
}
type Config struct {
	Oauth                     OauthInfo   `json:"oauth"`
	Redis                     RedisInfo   `json:"redis"`
	DepServices               DepServices `json:"depServices"`
	LogPath                   string      `json:"logPath"`
	StaticPath                string      `json:"staticPath"`
	DomainName                string      `json:"DomainName"`
	SessionExpireSecond       string      `json:"sessionExpireSecond"`
	SessionExpireSecondInt    int
	HttpClientExpireSecond    string `json:"httpClientExpireSecond"`
	HttpClientExpireSecondInt int
	Telemetry                 telemetry.Config `json:"telemetry"`
	MQ                        MQ               `yaml:"mq"`
}
type SwagInfo struct {
	Host    string `yaml:"host"`
	Version string `yaml:"version"`
}

/*type Redis struct {
	ConnectType string           `json:"connectType"`
	ConnectInfo RedisConnectInfo `json:"connectInfo"`
	EnableSSL   string           `json:"enableSSL"`
	CaName      string           `json:"caName"`
	CertName    string           `json:"certName"`
	KeyName     string           `json:"keyName"`
	MaxRetries  string           `json:"maxRetries"`
	DialTimeout string           `json:"dialTimeout"`
}*/

type RedisConnectInfo struct {
	MasterGroupName  string `yaml:"masterGroupName"`
	Password         string `yaml:"password"`
	SentinelHost     string `yaml:"sentinelHost"`
	SentinelPassword string `yaml:"sentinelPassword"`
	SentinelPort     string `yaml:"sentinelPort"`
	SentinelUsername string `yaml:"sentinelUsername"`
	Username         string `yaml:"username"`
}
type DepServices struct {
	UserMgmPrivate      string `json:"userMgmPrivate"`
	DeployMgm           string `json:"deployMgm"`
	HydraPublic         string `json:"hydraPublic"`
	HydraAdmin          string `json:"hydraAdmin"`
	ConfigurationCenter string `json:"configurationCenter"`
}
type RedisInfo struct {
	ConnectInfo RedisConnectInfo `json:"connectInfo" yaml:"connectInfo"`
	ConnectType string           `json:"connectType" yaml:"connectType"`
	Database    string           `json:"database" yaml:"database"`
}
type OauthInfo struct {
	OauthClientID      string `yaml:"oauthClientID"`
	OauthClientSecret  string `yaml:"oauthClientSecret"`
	OauthClientID2     string `yaml:"oauthClientID2"`
	OauthClientSecret2 string `yaml:"oauthClientSecret2"`
}
type Database struct {
	Default  options.DBOptions `json:"default"`
	Default1 options.DBOptions `json:"default1"`
}

type MQ struct {
	Kafka MQConfig  `yaml:"kafka"`
	NSQ   NSQConfig `yaml:"nsq"`
}

type MQConfig struct {
	Type        string `json:"type"`
	Host        string `json:"host"`
	Port        string `json:"port"`
	LookupdHost string `json:"LookupdHost"`
	LookupdPort string `json:"LookupdPort"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	Mechanism   string `json:"mechanism"`
	Version     string `json:"version"`
}

type NSQConfig struct {
	MQConfig
	HttpHost string `json:"HttpHost"`
	HttpPort string `json:"HttpPort"`
}
