package constant

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

const (
	CommonTimeFormat          = "2006-01-02 15:04:05"
	DateTimeFormat            = "2006-01-02"
	DefaultHttpRequestTimeout = 60 * time.Second
	COMMON_CODE_FORMAT        = "20060102150405"
)

const EmptyExecutor = "00000000-0000-0000-0000-000000000000"

// 账号类型
type VisitorType string

const (
	RealName VisitorType = "1" //普通用户
	APP      VisitorType = "6" //应用
)

type UserStatus int32

const (
	UserNormal UserStatus = 1
	UserDelete UserStatus = 2
)

// 工单扩展表key
type WorkOrderExtendKey string

const (
	FusionTableName WorkOrderExtendKey = "fusion_table_name"
)

const (
	AUDIT_ICON_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34" +
		"AAAA70lEQVR4nO2UIQ7CMBSG/xkEYAkGFIZhhwYLChQJCzi4APeAC4CAsCAw4IaEU8BFQGDGXzHTNKxrWrcv" +
		"WfMqmm/vvb5602NyATDmZx3Pw14IEsbOKASZKAXbCVApMcjB+wsszwwklILTjAsRB+YB0Gtxo0EYcZH4K4ifQL" +
		"cJ1KrcaKAtGLaBcs4SfVii+MVAQimwiVKw6ptlsHkwkFAK0h6IA6Jcfp0bDbR7kArWdwp8oGNbIEpkMgciYxmlw" +
		"CZKwYB1N8ngpntN0x6IA0HDwaClAmdPxY6PnckcLPhDMkqBTQpBJl4YJVcqRoxdcPgB18l6zJGtm7IAAAAASUVORK5CYII="
)

const (
	ProjectObjValue = iota + 1 //项目成员类型
)

// DataType  数据类型
type DataType enum.Object

var (
	DataTypeInt      = enum.New[DataType](0, "int", "整数型")
	DataTypeChar     = enum.New[DataType](1, "char", "字符型")
	DataTypeDate     = enum.New[DataType](2, "date", "日期型")
	DataTypeDateTime = enum.New[DataType](3, "datetime", "日期时间型")
	DataTypeBool     = enum.New[DataType](5, "bool", "布尔型")
	DataTypeBinary   = enum.New[DataType](6, "binary", "二进制")
	DataTypeDecimal  = enum.New[DataType](7, "decimal", "高精度型")
	DataTypeFloat    = enum.New[DataType](8, "float", "小数型")
	DataTypeTime     = enum.New[DataType](9, "time", "时间型")
)

func DataType2string(dataType string) string {
	var resDataType string
	switch dataType {
	case "number",
		"int",
		"smallint",
		"integer",
		"bigint",
		"tinyint",
		"mediumint",
		"tinyint unsigned",
		"int unsigned",
		"smallint unsigned",
		"mediumint unsigned",
		"bigint unsigned",
		"int8",
		"int4",
		"int2",
		"int16",
		"int32",
		"int64",
		"int128",
		"int256",
		"long":
		resDataType = DataTypeInt.String
	case "real",
		"double",
		"float",
		"double precision",
		"float4",
		"float8",
		"float16",
		"float32",
		"float64",
		"binary_double",
		"binary_float":
		resDataType = DataTypeFloat.String
	case "decimal",
		"numeric",
		"dec":
		resDataType = DataTypeDecimal.String
	case "string",
		"char",
		"varchar",
		"json",
		"text",
		"tinytext",
		"mediumtext",
		"longtext",
		"uuid",
		"name",
		"jsonb",
		"bpchar",
		"uniqueidentifier",
		"xml",
		"sysname",
		"nvarchar",
		"enum",
		"set",
		"ntext",
		"nchar",
		"rowid",
		"urowid",
		"varchar2",
		"nvarchar2",
		"fixedstring",
		"nclob",
		"ipaddress":
		resDataType = DataTypeChar.String
	case "date", "year":
		resDataType = DataTypeDate.String
	case "datetime",
		"datetime2",
		"smalldatetime",
		"timestamp",
		"timestamptz",
		"timestamp with time zone",
		"interval",
		"interval year to month",
		"interval day to second":
		resDataType = DataTypeDateTime.String
	case "time", "timetz", "time with time zone":
		resDataType = DataTypeTime.String
	case "boolean", "bit", "bool":
		resDataType = DataTypeBool.String
	case "binary",
		"blob",
		"tinyblob",
		"mediumblob",
		"longblob",
		"bytea",
		"image",
		"hierarchyid",
		"geography",
		"geometry",
		"varbinary",
		"raw",
		"map",
		"array",
		"struct":
		resDataType = DataTypeBinary.String
	}
	return resDataType
}
