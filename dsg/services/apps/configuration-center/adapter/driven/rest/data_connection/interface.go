package data_connection

import "context"

type DrivenDataConnection interface {
	// 根据接口协议文档定义的方法
	// 参考: http://api.kweaver-ai.cn/project/3869/interface/api/146482
	GetDataSourceDetail(ctx context.Context, id string) (*GetDataSourceDetailRes, error)
}

type GetDataSourceDetailRes struct {
	ID      string  `json:"id"`       // 数据源id
	Name    string  `json:"name"`     // 数据源名称
	Type    string  `json:"type"`     // 数据源类型，支持：oracle, postgresql, doris, sqlserver, hive, clickhouse, mysql, maria，mongodb，dameng，hologres, gaussdb，excel，opengauss，inceptor-jdbc，kingbase，tingyun，anyshare7，maxcompute，opensearch
	BinData BinData `json:"bin_data"` // 数据源配置
	Comment string  `json:"comment"`  // 描述
}

type BinData struct {
	CatalogName     string `json:"catalog_name"`     // 数据源catalog名称，除excel、tingyun、anyshare7、opensearch外必传
	DatabaseName    string `json:"database_name"`    // 数据库名称，除excel、tingyun、anyshare7、opensearch外必传 maxcompute数据源为project_name
	ConnectProtocol string `json:"connect_protocol"` // 连接方式，当前支持http（excel、tingyun、opensearch）https（excel、tingyun、anyshare7、maxcompute、opensearch）thrift（hive）jdbc（除上述外）
	Schema          string `json:"schema"`           // 数据库模式，主要针对数据源opengauss、gaussdb、postgresql、oracle、sqlserver、hologres、kingbase
	Host            string `json:"host"`             // 连接地址
	Port            int32  `json:"port"`             // 端口
	Account         string `json:"account"`          // 用户名，除inceptor数据源外必传，excel、anyshare7数据源应用账户id，tingyun数据源为用户id，maxcompute数据源为AccessKey ID，其他数据源为用户名
	Password        string `json:"password"`         // 密码，除inceptor数据源外必传，excel、anyshare7数据源为应用账户密码，maxcompute数据源为AccessKey Secret，其他数据源为用户密码
	Token           string `json:"token"`            // token认证，当前仅inceptor数据源使用，和account/passwaord 二选一认证
	StorageProtocol string `json:"storage_protocol"` // 存储介质，当前仅excel数据源使用
	StorageBase     string `json:"storage_base"`     // 存储路径，当前仅excel、anyshare7数据源使用
}
