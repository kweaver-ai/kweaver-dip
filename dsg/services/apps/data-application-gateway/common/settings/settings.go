package settings

import (
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/options"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
)

var Instance Settings

type Settings struct {
	Server          Server            `yaml:"server"`
	Log             Log               `yaml:"log"`
	Doc             Doc               `yaml:"doc"`
	NSQ             NSQ               `yaml:"nsq"`
	Database        options.DBOptions `yaml:"database"`
	Redis           Redis             `yaml:"redis"`
	Services        Services          `yaml:"services"`
	zapx.LogConfigs `yaml:"logs"`
	Telemetry       telemetry.Config `json:"telemetry"`
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

type NSQ struct {
	NSQLookupdHost string `yaml:"nsqlookupdHost"`
	NSQLookupdPort string `yaml:"nsqlookupdPort"`
	NSQDHost       string `yaml:"nsqdHost"`
	NSQDPort       string `yaml:"nsqdPort"`
	NSQDHTTPPort   string `yaml:"nsqdHttpPort"`
}

type Redis struct {
	Host       string `json:"host"`
	Password   string `json:"password"`
	MasterName string `json:"master_name"`
}

type Services struct {
	VirtualEngine          string `json:"virtual_engine"`           //虚拟化引擎
	DataCatalog            string `json:"data_catalog"`             //数据资源目录
	DataView               string `json:"data_view"`                //数据目录
	MetadataManage         string `json:"metadata_manage"`          //元数据服务
	ConfigurationCenter    string `json:"configuration_center"`     //配置中心
	GlossaryService        string `json:"glossary_service"`         //业务术语
	HydraAdmin             string `json:"hydra_admin"`              //授权服务
	UserManagement         string `json:"user_management"`          //用户服务
	WorkflowRest           string `json:"workflow_rest"`            //流程服务
	DataApplicationService string `json:"data_application_service"` //接口服务
	BasicSearch            string `json:"basic_search"`             //搜索服务
	DataSubject            string `json:"data_subject"`             //主题域管理服务
	AuthService            string `json:"auth_service"`             //权限服务
}
