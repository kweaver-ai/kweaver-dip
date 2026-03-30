package settings

import (
	"strconv"
	"sync"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"

	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
)

var (
	lock   = new(sync.RWMutex)
	once   = new(sync.Once)
	config *Config
)
var (
	RetryCount               int //default:3
	RetryWaitTime            int //ms default:100ms
	MDLUniQueryClientTimeOut int //s default:60s
)

func Init() {
	//初始化配置文件
	if config.ServerConf.SwagConf.Host == "" {
		config.ServerConf.SwagConf.Host = "0.0.0.0:8281"
	}
	RetryCount, _ = strconv.Atoi(GetConfig().ExplorationConf.RetryCount)
	if RetryCount <= 0 {
		RetryCount = 3
	}
	RetryWaitTime, _ = strconv.Atoi(GetConfig().ExplorationConf.RetryWaitTime)
	if RetryWaitTime <= 0 {
		RetryWaitTime = 100
	}
	MDLUniQueryClientTimeOut, _ = strconv.Atoi(GetConfig().ExplorationConf.MDLUniQueryClientTimeOut)
	if MDLUniQueryClientTimeOut <= 0 {
		MDLUniQueryClientTimeOut = 120
	}
}

func initAI() {
	if config.DepServicesConf.VirtualizationEngineUrl == "" {
		config.DepServicesConf.VirtualizationEngineUrl = "http://10.4.133.13:8099"
	}

}
func init() {
	once.Do(func() {
		config = new(Config)
	})
	initAI()
}

type Config struct {
	log.LogConfigs
	DBOptions       options.DBOptions `json:"database"`
	ServerConf      ServerConf        `json:"server"`
	SysConf         SysConf           `json:"sys"`
	DepServicesConf DepServicesConf   `json:"depServices"`
	OAuth           OAuth             `json:"oauth"`
	Redis           RedisConf         `json:"redis"`
	Kafka           KafkaConf         `json:"kafka"`
	ExplorationConf ExplorationConf   `json:"exploration"`
	Telemetry       telemetry.Config  `json:"telemetry"`
}

type SysConfMode string

const (
	SysConfModeDebug   SysConfMode = "debug"
	SysConfModeRelease SysConfMode = "release"
)

type ExplorationConf struct {
	CacheExpireTime          int32  `json:"cacheExpireTime,string"`        // 探查请求缓存过期时间
	GroupLimit               int    `json:"groupLimit,string"`             // 探查请求分组查询最大分组数
	ReportDefaultOvertime    int    `json:"reportDefaultOvertime,string"`  // 探查报告默认超时时间，单位秒
	VirtualEngineTimeout     string `json:"virtualEngineTimeout"`          // 虚拟化引擎超时时间
	ConcurrencyEnable        string `json:"concurrency_enable"`            // 探查是否开启并发 true false
	ConcurrencyLimit         string `json:"concurrency_limit"`             // 探查本服务并发数限制
	ConcurrencyTaskLimit     string `json:"concurrency_task_limit"`        // 探查任务并发数限制
	RetryCount               string `json:"retry_count"`                   // 探查任务执行sql重试次数
	RetryWaitTime            string `json:"retry_wait_time"`               // 探查任务执行sql重试等待时间
	RetryTimeOut             string `json:"retry_time_out"`                // 探查任务执行sql重试超时时间
	MDLUniQueryClientTimeOut string `json:"mdl_uni_query_client_time_out"` // 探查任务执行sql MDLUniQuery服务超时时间
}

type SysConf struct {
	Mode   SysConfMode `json:"mode"`   // debug、release
	SelfIP string      `json:"selfIP"` // 自身ip，读取POD_IP
}

type HttpConf struct {
	Addr string `json:"addr"`
}

type ServerConf struct {
	HttpConf `json:"http"`
	SwagConf `json:"doc"`
}

type SwagConf struct {
	Host    string `json:"host"`
	Version string `json:"version"`
}

type KafkaConf struct {
	Addr      string `json:"addr"`
	Mechanism string `json:"mechanism"`
	Password  string `json:"password"`
	UserName  string `json:"username"`
	GroupId   string `json:"groupId"`
}

type DepServicesConf struct {
	VirtualizationEngineUrl string `json:"virtualizationEngineUrl"`
	ConfigCenterHost        string `json:"configCenterHost"`
	UserMgmPrivateHost      string `json:"userMgmPrivateHost"`
	AnyDataRecUrl           string `json:"anyDataRecUrl"`
	StandardizationHost     string `json:"standardizationHost"`
}

func GetConfig() *Config {
	initAI()
	lock.RLock()
	defer lock.RUnlock()
	return config
}

func ResetConfig(conf *Config) {
	lock.Lock()
	defer lock.Unlock()
	config = conf
}

type OAuth struct {
	HydraAdmin   string `json:"hydraAdmin"`
	HydraPublic  string `json:"hydraPublic"`
	ClientId     string `json:"clientId"`
	ClientSecret string `json:"clientSecret"`
}

type RedisConf struct {
	Addr             string `json:"addr,omitempty"`
	ClientName       string `json:"clientName,omitempty"`
	DB               int    `json:"DB,omitempty,string"`
	Password         string `json:"password,omitempty"`
	SentinelPassword string `json:"sentinelPassword,omitempty"`
	MaxRetries       int    `json:"maxRetries,omitempty"`
	MinRetryBackoff  int    `json:"minRetryBackoff,omitempty"` // 单位毫秒
	MaxRetryBackoff  int    `json:"maxRetryBackoff,omitempty"` // 单位毫秒
	DialTimeout      int    `json:"dialTimeout,omitempty"`     // 单位毫秒
	ReadTimeout      int    `json:"readTimeout,omitempty"`     // 单位毫秒
	WriteTimeout     int    `json:"writeTimeout,omitempty"`    // 单位毫秒
	PoolSize         int    `json:"poolSize,omitempty"`
	PoolTimeout      int    `json:"poolTimeout,omitempty"` // 单位毫秒
	MinIdleConns     int    `json:"minIdleConns,omitempty"`
	MaxIdleConns     int    `json:"maxIdleConns,omitempty"`
	ConnMaxIdleTime  int    `json:"connMaxIdleTime,omitempty"` // 单位分钟
	ConnMaxLifetime  int    `json:"connMaxLifetime,omitempty"` // 单位分钟
	MasterName       string `json:"masterName,omitempty"`
}
