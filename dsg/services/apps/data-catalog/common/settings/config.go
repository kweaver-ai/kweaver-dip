package settings

import (
	"sync"

	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
)

var (
	lock   = new(sync.RWMutex)
	once   = new(sync.Once)
	config *Config
)

func initAI() {
	if config.AnyDataConf.URL == "" {
		config.AnyDataConf.URL = "https://10.4.132.124:8444"
	}
	if config.AnyDataConf.AccountType == "" {
		config.AnyDataConf.AccountType = "email"
	}
	if config.AnyDataConf.User == "" {
		config.AnyDataConf.User = "af@KweaverAI.cn"
	}
	if config.AnyDataConf.Password == "" {
		config.AnyDataConf.Password = "***"
	}
	if config.VirtualizationEngineUrl == "" {
		config.VirtualizationEngineUrl = "http://10.4.133.13:8099"
	}
	if config.OpenAIConf.APIKey == "" {
		config.OpenAIConf.APIKey = "***"
	}
	if config.OpenAIConf.APIType == "" {
		config.OpenAIConf.APIType = "azure"
	}
	if config.OpenAIConf.APIVersion == "" {
		config.OpenAIConf.APIVersion = "2023-03-15-preview"
	}
	if config.OpenAIConf.URL == "" {
		config.OpenAIConf.URL = "https://anyshare-demo-chatgpt.openai.azure.com/"
	}
}
func init() {
	once.Do(func() {
		config = new(Config)
	})
	initAI()
}

type Config struct {
	ServerConf `json:"server"`
	LogConf    `json:"log"`
	log.LogConfigs
	telemetry.Config `json:"telemetry"`
	Database         options.DBOptions `json:"database"`
	RedisConf        `json:"redis"`
	DBMigrate        `json:"db-migrate"`
	OauthConf        `json:"oauth"`
	DepServicesConf  `json:"depServices"`
	*MQConf          `json:"mq"`
	OpenAIConf       `json:"openAI"`
	AnyDataConf      `json:"anyDataConf"`
	ADKgConf         `json:"adKgConf"`
	VariablesConf    `json:"variables"`
	CogSearch        `json:"cogSearch"`
	// 回调配置
	Callback Callback `json:"callback,omitempty"`
	Tenant   Tenant   `json:"tenantId,omitempty"`
}

type HttpConf struct {
	Host string `json:"host"`
}

type ServerConf struct {
	HttpConf `json:"http"`
	SwagConf `json:"doc"`
}

type LogConf struct {
	LogPath string `json:"logPath"`
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

type ADKgConf struct {
	KgID               string `json:"lineageKgId"`
	GraphKgId          string `json:"graphKgId"`
	Email              string `json:"email"`
	Password           string `json:"password"`
	CacheExpireMinutes string `json:"cacheExpireMinutes"` // 血缘缓存失效时间
}

type OauthConf struct {
	HydraAdmin  string `json:"hydraAdmin"`
	HydraPublic string `json:"hydraPublic"`
}

type DepServicesConf struct {
	UserMgmPrivateHost      string `json:"userMgmPrivateHost"`
	ConfigCenterHost        string `json:"configCenterHost"`
	DataCatalogHost         string `json:"dataCatalogHost"`
	AnyRobotTraceUrl        string `json:"anyRobotTraceUrl"`
	MetaDataMgmHost         string `json:"metaDataMgmHost"`
	AnyDataAlgServer        string `json:"anyDataAlgServer"`
	TaskCenterHost          string `json:"taskCenterHost"`
	AfSailorServiceHost     string `json:"afSailorServiceHost"`
	VirtualizationEngineUrl string `json:"virtualizationEngineUrl"`
	DataMaskingHost         string `json:"dataMaskingHost"`
	BusinessGroomingHost    string `json:"businessGroomingHost"`
	WorkflowRestHost        string `json:"workflowRestHost"`
	DocAuditRestHost        string `json:"docAuditRestHost"`
	WorkflowTenantID        string `json:"workflowTenantID"`
	WorkflowMQType          string `json:"workflowMQType"`
	BasicSearchHost         string `json:"basicSearchHost"`
	InterfaceSvcHost        string `json:"interfaceSvcHost"`
	DataSubjectHost         string `json:"dataSubjectHost"`
	DataExploreHost         string `json:"dataExploreHost"`
	DataViewHost            string `json:"dataViewHost"`
	AuthServiceHost         string `json:"authServiceHost"`
	DemandManagementHost    string `json:"demandManagementHost"`
	IndicatorManagementHost string `json:"indicatorManagementHost"`
	DepartmentID            string `json:"departmentID"`
}

type MQAuthConf struct {
	Mechanism string `json:"mechanism"`
	User      string `json:"username"`
	Password  string `json:"password"`
	Version   string `json:"version"`
}

type MQConnConf struct {
	MQType      string `json:"mqType"`
	Addr        string `json:"host"`
	HttpHost    string `json:"httpHost"`
	LookupdAddr string `json:"lookupdHost"`
	MQAuthConf  `json:"auth"`
}

type MQConf struct {
	ConnConfs   []*MQConnConf `json:"connConfs"`
	Channel     string        `json:"channel"`
	ClientID    string        `json:"clientId"`
	SendBufSize int           `json:"sendBufSize"`
	RecvBufSize int           `json:"recvBufSize"`
}

func (c MQConf) GetMQConnConfByMQType(mqType string) *MQConnConf {
	for i := range c.ConnConfs {
		if c.ConnConfs[i].MQType == mqType {
			return c.ConnConfs[i]
		}
	}
	return nil
}

// VariablesConf 自定义变量
type VariablesConf struct {
	// 资产目录编码，1为旧的以/斜线分隔的编码，如aaaaaaa/000260；2为形如2023070718000012345001（20230707180000为年月日时分秒，12345为机器码，001为自增的数字序列）
	//CatalogCodeType int `json:"catalogCodeType"`
	//SampleDataConf  `json:"sampleData"`
}

// // SampleDataConf 样例数据配置
// type SampleDataConf struct {
// 	VirtualizationCacheEnable bool `json:"virtualizationCacheEnable,string"`
// 	DataMaskingEnable         bool `json:"dataMaskingEnable,string"`
// 	BigModelSwitch            bool `json:"bigModelSwitch,string"`
// 	BigModelCacheEnable       bool `json:"bigModelCacheEnable,string"`
// 	HaveDataExpireHour        int  `json:"haveDataExpireHour,string"`
// 	EmptyDataExpireMinute     int  `json:"emptyDataExpireMinute,string"`
// }

type OpenAIConf struct {
	APIKey     string `json:"apiKey"`
	URL        string `json:"url"`
	APIVersion string `json:"apiVersion"`
	APIType    string `json:"apiType"`
}

type AnyDataConf struct {
	URL         string `json:"url"`
	AccountType string `json:"accountType"`
	User        string `json:"user"`
	Password    string `json:"password"`
}

type CogSearch struct {
	Highlight struct {
		Prefix string `json:"prefix"`
		Suffix string `json:"suffix"`
	} `json:"highlight"`
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

// 回调配置
type Callback struct {
	// 是否启用回调
	Enabled bool `json:"enabled,omitempty,string"`
	// 通过这个地址调用回调接口
	Address string `json:"address,omitempty"`
}

// 租户配置
type Tenant struct {
	TenantId string `json:"tenantId,omitempty"`
}
