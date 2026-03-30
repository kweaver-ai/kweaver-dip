package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

// DataSourceType 仅用于类型字符串校验
type DataSourceType enum.Object

var (
	MYSQL      = enum.New[DataSourceType](1, "mysql", "mysql://")
	MariaDB    = enum.New[DataSourceType](2, "maria", "mariadb://")
	PostgreSQL = enum.New[DataSourceType](3, "postgresql", "postgresql://")
	SQLServer  = enum.New[DataSourceType](4, "sqlserver", "sqlserver://")
	Oracle     = enum.New[DataSourceType](5, "oracle", "oracle:thin:@")
	Hive       = enum.New[DataSourceType](6, "hive-hadoop2", "hive2://")
)

const (
	DataSourceAvailable = iota + 1
	DataSourceScanning
)

type SourceType enum.Object

var (
	Records    = enum.New[SourceType](1, "records")
	Analytical = enum.New[SourceType](2, "analytical")
	Sandbox    = enum.New[SourceType](3, "sandbox")
)
