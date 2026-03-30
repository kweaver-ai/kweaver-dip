package virtualization_engine

import (
	"context"
)

//mockgen  -source "adapter/driven/virtualization_engine/interface.go"  -destination="interface/mock/virtualization_engine_mock.go" -package=mock

type DrivenVirtualizationEngine interface {
	GetDataSource(ctx context.Context) (*GetDataSourceRes, error)
	CreateDataSource(ctx context.Context, req *CreateDataSourceReq) (bool, error)
	ModifyDataSource(ctx context.Context, req *ModifyDataSourceReq) (bool, error)
	DeleteDataSource(ctx context.Context, req *DeleteDataSourceReq) (bool, error)
	// 获取所有支持的数据源类型接口
	GetConnectors(ctx context.Context) (*GetConnectorsRes, error)
	// 请求对应类型数据源配置项接口
	GetConnectorConfig(ctx context.Context, name string) (*ConnectorConfig, error)
}
type GetDataSourceRes struct {
	Msg  string   `json:"msg"`
	Code string   `json:"code"`
	Data []string `json:"data"`
}
type CreateDataSourceReq struct {
	CatalogName   string `json:"catalogName"`   // 数据源catalog
	ConnectorName string `json:"connectorName"` // 数据源类型
	//HiveKrb       string `json:"hiveKrb"`       // hive是否开启krb,非必须
	//ManagerHdfsUrl  string     `json:"managerHdfsUrl"`  // 大数据集群管理端下载hdfs配置url
	//ManagerUser     string     `json:"managerUser"`     // 大数据集群管理端用户名
	//ManagerPassword string     `json:"managerPassword"` // 大数据集群管理端密码
	//ManagerHostsUrl string     `json:"managerHostsUrl"` // 大数据集群管理端查询ip和域名映射
	Properties any `json:"properties"` // 数据源连接配置
}
type Properties struct {
	ConnectionUrl      string `json:"connection-url"`      // 数据源连接url
	ConnectionUser     string `json:"connection-user"`     // 数据源用户名
	ConnectionPassword string `json:"connection-password"` // 数据源密码
}
type TokenProperties struct {
	ConnectionUrl string `json:"connection-url"` // 数据源连接url
	GuardianToken string `json:"guardianToken"`  // 数据源连接token
}
type ExcelProperties struct {
	Protocol string `json:"excel.protocol"`
	Host     string `json:"excel.host"`
	Port     string `json:"excel.port"`
	Username string `json:"excel.username"`
	Password string `json:"excel.password"`
	Base     string `json:"excel.base"`
}

type ModifyDataSourceReq struct {
	CatalogName   string `json:"_"`             // 数据源catalog
	ConnectorName string `json:"connectorName"` // 数据源类型
	HiveKrb       string `json:"hiveKrb"`       // hive是否开启krb,非必须
	Properties    any    `json:"properties"`    // 数据源连接配置
}
type DeleteDataSourceReq struct {
	CatalogName string `json:"catalogName"` // 数据源catalog
}

// GetConnectorsRes 代表虚拟化引擎的查询所有支持数据源的返回值结构
type GetConnectorsRes struct {
	ConnectorNames []GetConnectorsResConnector `json:"connectorNames,omitempty"`
}

// GetConnectorsResConnector 代表虚拟化引擎的查询所有支持数据源接口的返回值中的一个数据源
//
// Definition: http://api.kweaver-ai.cn/project/3003/interface/api/93478
type GetConnectorsResConnector struct {
	OLKConnectorName string `json:"olkConnectorName,omitempty"`

	ShowConnectorName string `json:"showConnectorName,omitempty"`
}

// ConnectorConfig 代表虚拟化引擎的请求对应类型数据源配置项接口的返回值结构
//
// Definition: http://api.KweaverAIer-ai.cn/project/3003/interface/api/93480
type ConnectorConfig struct {
	ConnectorName string `json:"connectorName,omitempty"`

	SchemaExist bool `json:"schemaExist,omitempty"`

	URL string `json:"url,omitempty"`

	Type []GetConnectorConfigResType `json:"type,omitempty"`
}

// GetConnectorConfigResType 代表代表虚拟化引擎的请求对应类型数据源配置项接口的返回值结构中类型
//
// Definition: http://api.KweaverAIer-ai.cn/project/3003/interface/api/93480
type GetConnectorConfigResType struct {
	// 原始数据源类型
	SourceType string `json:"sourceType,omitempty"`
	// 虚拟化引擎查询类型
	OLKSearchType string `json:"olkSearchType,omitempty"`
	// 虚拟化引擎写入类型
	OLKWriteType string `json:"olkWriteType,omitempty"`
	// 数据类型标识：0代表无长度无精度，1代表有长度无精度，2代表有长度有精度
	PrecisionFlag PrecisionFlag `json:"precisionFlag,omitempty"`
	// 类型最小长度
	MinTypeLength int `json:"minTypeLength,omitempty"`
	// 类型最大长度
	MaxTypeLength int `json:"maxTypeLength,omitempty"`
}

// PrecisionFlag 代表虚拟化引擎定义的数据源的数据类型标识
type PrecisionFlag int

const (
	// PrecisionFlagWithoutLengthWithoutPrecision 代表无长度无精度
	PrecisionFlagWithoutLengthWithoutPrecision PrecisionFlag = 0
	// PrecisionFlagWithLengthWithoutPrecision 代表有长度无精度
	PrecisionFlagWithLengthWithoutPrecision PrecisionFlag = 1
	// PrecisionFlagWithLengthWithPrecision 代表有长度有精度
	PrecisionFlagWithLengthWithPrecision PrecisionFlag = 2
)
