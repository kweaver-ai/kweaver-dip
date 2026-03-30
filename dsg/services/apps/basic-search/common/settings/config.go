package settings

import (
	"sync"

	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models/request"
)

var (
	lock   = new(sync.RWMutex)
	once   = new(sync.Once)
	config *Config
)

func init() {
	once.Do(func() {
		config = new(Config)
	})
}

type Config struct {
	log.LogConfigs
	ServerConf           `json:"server"`
	RedisConf            `json:"redis"`
	OauthConf            `json:"oauth"`
	DepServicesConf      `json:"depServices"`
	request.DepInfo      `json:"user-org-info"`
	OpenSearchConf       `json:"opensearch"`
	KafkaConf            `json:"kafka"`
	common.TelemetryConf `json:"telemetry"`
}

type HttpConf struct {
	Host string `json:"host"`
}

type ServerConf struct {
	HttpConf `json:"http"`
	SwagConf `json:"doc"`
}

type SwagConf struct {
	Host    string `json:"host"`
	Version string `json:"version"`
}

type RedisConf struct {
	Host         string `json:"host"`
	Password     string `json:"password"`
	DB           int    `json:"database,string"`
	MinIdleConns int    `json:"minIdleConns,string"`
}

type DBMigrate struct {
	Source string `json:"source"`
}

type OauthConf struct {
	HydraAdmin string `json:"hydraAdmin"`
}
type DepServicesConf struct {
	UserMgmPrivateHost string `json:"userMgmPrivateHost"`
	ConfigCenterHost   string `json:"configCenterHost"`
	DataCatalogHost    string `json:"dataCatalogHost"`
	AnyRobotTraceUrl   string `json:"anyRobotTraceUrl"`
}

func GetConfig() *Config {
	lock.RLock()
	defer lock.RUnlock()
	return config
}

func ResetConfig(conf *Config) {
	lock.Lock()
	defer lock.Unlock()
	config = conf
}

type OpenSearchConf struct {
	ReadUri     string `json:"readUri,omitempty"`
	WriteUri    string `json:"writeUri,omitempty"`
	Username    string `json:"username,omitempty"`
	Password    string `json:"password,omitempty"`
	Sniff       bool   `json:"sniff"`
	Healthcheck bool   `json:"healthcheck"`
	Debug       bool   `json:"debug"`
	UseHanLP    bool   `json:"useHanLP,omitempty"` // 是否使用 HanLP 分词插件，默认 false（使用标准 tokenizer）
	Highlight   struct {
		PreTag  string `json:"preTag"`
		PostTag string `json:"postTag"`
	} `json:"highlight"`
}

type KafkaConf struct {
	Version  string `json:"version"`
	URI      string `json:"uri,omitempty"`
	ClientId string `json:"clientId,omitempty"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	GroupId  string `json:"groupId,omitempty"`
}
