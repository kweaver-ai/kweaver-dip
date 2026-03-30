package settings

import (
	"fmt"
	"net"

	"github.com/IBM/sarama"
	"github.com/kweaver-ai/idrm-go-frame/core/options"

	"github.com/kweaver-ai/idrm-go-frame/core/cdc"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
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
	CdcSource       []*cdc.CronConf   `json:"cdcSource" yaml:"cdcSource"`
	zapx.LogConfigs `yaml:"logs"`
	Telemetry       telemetry.Config `json:"telemetry"`

	// Workflow 配置
	Workflow Workflow
	// 回调配置
	Callback Callback `json:"callback,omitempty" yaml:"callback"`
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
	Kafka MQConfig `yaml:"kafka"`
	NSQ   MQConfig `yaml:"nsq"`
}

type MQConfig struct {
	Type        string `json:"type"`
	Host        string `json:"host"`
	Port        string `json:"port"`
	HttpHost    string `json:"httpHost"`
	HttpPort    string `json:"httpPort"`
	LookupdHost string `json:"lookupdHost"`
	LookupdPort string `json:"lookupdPort"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	Mechanism   string `json:"mechanism"`

	// 版本，使用 Kafka 时有值
	Version string
}

// 返回 Kafka 地址列表和 Kafka 客户端 sarama 的配置
func (c *MQConfig) SaramaConfig() (addresses []string, config *sarama.Config, err error) {
	if c.Type != "kafka" {
		err = fmt.Errorf("cannot generate sarama.Config from type %q", c.Type)
		return
	}

	v, err := sarama.ParseKafkaVersion(c.Version)
	if err != nil {
		return
	}

	// Kafka 地址列表
	addresses = append(addresses, net.JoinHostPort(c.Host, c.Port))
	// Kafka 客户端 sarama 的配置
	config = sarama.NewConfig()
	config.Net.SASL.Enable = c.Username != "" || c.Password != ""
	config.Net.SASL.Mechanism = sarama.SASLMechanism(c.Mechanism)
	config.Net.SASL.User = c.Username
	config.Net.SASL.Password = c.Password
	config.Net.SASL.Handshake = true
	config.Producer.Return.Successes = true
	config.Version = v
	return
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

// 回调配置
type Callback struct {
	// 是否启用回调
	Enabled bool `json:"enabled,omitempty,string" yaml:"enabled"`
	// 通过这个地址调用回调接口
	Address string `json:"address,omitempty" yaml:"address"`
	// 回调接口前缀
	PrePath string `json:"pre_path,omitempty" yaml:"pre_path"`
}
