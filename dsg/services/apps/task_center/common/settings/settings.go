package settings

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
)

var ConfigInstance ConfigContains

type ConfigContains struct {
	Database    db.Database      `json:"database"`
	Oauth       OauthInfo        `json:"oauth"`
	DepServices DepServices      `json:"depServices"`
	Telemetry   telemetry.Config `json:"telemetry"`
	Doc         SwagInfo         `yaml:"doc"`
	KafkaConf   KafkaConf        `json:"kafkaConf"`
	Logs        []zapx.Options   `json:"logs"`
	// 回调配置
	Callback Callback `json:"callback,omitempty"`
	// 租户 ID
	TenantID string `json:"tenantID,omitempty"`
}

type OauthInfo struct {
	OAuthAdminHost string `json:"oauthAdminHost"`
	OAuthAdminPort int    `json:"oauthAdminPort"`
	ClientId       string `json:"clientId"`
	ClientSecret   string `json:"clientSecret"`
}

type DepServices struct {
	UserMgmPrivate              string `json:"userMgmPrivate"`
	HydraAdmin                  string `json:"hydraAdmin"`
	CCHost                      string `json:"config-center-host"`
	BGHost                      string `json:"business-grooming-host"`
	CSHost                      string `json:"catalog-service-host"`
	DVHost                      string `json:"data-view-host"`
	DEHost                      string `json:"data-exploration-host"`
	WorkflowRestHost            string `json:"workflowRestHost"`
	DocAuditRestHost            string `json:"docAuditRestHost"`
	TenantApplicationCodeRuleID string `json:"tenantApplicationCodeRuleID"`
	MQ                          *MQ    `json:"mq"`
}

type MQ struct {
	Auth          Auth   `json:"auth"`
	ConnectorType string `json:"connectorType"`
	MqHost        string `json:"mqHost"`
	MqLookupdHost string `json:"mqLookupdHost"`
	MqLookupdPort string `json:"mqLookupdPort"`
	MqPort        string `json:"mqPort"`
	NsqdPortTCP   string `json:"nsqdPortTCP"`
}

type Auth struct {
	Mechanism string `json:"mechanism"`
	Password  string `json:"password"`
	Username  string `json:"username"`
}

type SwagInfo struct {
	Host    string `yaml:"host"`
	Version string `yaml:"version"`
}

type KafkaConf struct {
	Version   string `json:"version"`
	URI       string `json:"uri,omitempty"`
	ClientId  string `json:"clientId,omitempty"`
	Username  string `json:"username,omitempty"`
	Password  string `json:"password,omitempty"`
	GroupId   string `json:"groupId,omitempty"`
	Mechanism string `json:"mechanism,omitempty"`
}

// 回调配置
type Callback struct {
	// 是否启用回调
	Enabled bool `json:"enabled,omitempty,string"`
	// 通过这个地址调用回调接口
	Address string `json:"address,omitempty"`
}
