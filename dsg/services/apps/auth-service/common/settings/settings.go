package settings

import (
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
)

var Instance Settings

type Settings struct {
	Server          Server            `yaml:"server"`
	Doc             Doc               `yaml:"doc"`
	Database        options.DBOptions `yaml:"database"`
	Redis           Redis             `yaml:"redis"`
	Services        Services          `yaml:"services"`
	MQ              MQ                `yaml:"mq"`
	zapx.LogConfigs `yaml:"logs"`
	TelemetryConf   telemetry.Config `json:"telemetry"`
	Kafka           Kafka            `json:"kafka"`
	// Workflow
	Workflow Workflow
	// 审计相关配置
	Audit Audit `yaml:"audit"`
}

type Server struct {
	Http *HTTPServer `yaml:"http"`
	Grpc *GRPCServer `yaml:"grpc"`
}

type HTTPServer struct {
	Addr string `yaml:"addr"`
}

type GRPCServer struct {
	Addr string `yaml:"addr"`
}

type Log struct {
	LogPath string `yaml:"logPath"`
	Mode    string `yaml:"mode"`
}

type Doc struct {
	Host    string `yaml:"host"`
	Version string `yaml:"version"`
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

type Redis struct {
	Host       string `json:"host"`
	Password   string `json:"password"`
	MasterName string `json:"master_name"`
}

type Services struct {
	VirtualEngine          string `json:"virtual_engine"`           //虚拟化引擎
	DataCatalog            string `json:"data_catalog"`             //数据目录
	MetadataManage         string `json:"metadata_manage"`          //元数据服务
	ConfigurationCenter    string `json:"configuration_center"`     //配置中心
	GlossaryService        string `json:"glossary_service"`         //业务术语
	HydraAdmin             string `json:"hydra_admin"`              //授权服务
	UserManagement         string `json:"user_management"`          //用户服务
	WorkflowRest           string `json:"workflow_rest"`            //流程服务
	DataApplicationService string `json:"data_application_service"` //接口服务
	BasicSearch            string `json:"basic_search"`             //搜索服务
	DataSubject            string `json:"data_subject"`             //主题域管理服务
	DataView               string `json:"data_view"`                //逻辑视图
	DocAuditRest           string `json:"doc_audit_rest"`           //审核
}

type Kafka struct {
	Version   string `json:"version"`
	URI       string `json:"uri,omitempty"`
	ClientId  string `json:"clientId,omitempty"`
	Username  string `json:"username,omitempty"`
	Password  string `json:"password,omitempty"`
	GroupId   string `json:"groupId,omitempty"`
	Mechanism string `json:"mechanism,omitempty"`
}

// 审计相关配置
type Audit struct {
	// 是否启用审计
	Enabled bool `json:"enabled,omitempty"`
}
