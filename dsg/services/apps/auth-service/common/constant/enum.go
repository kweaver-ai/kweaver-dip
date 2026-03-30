package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

// DataType  数据种类
type DataType enum.Object

var (
	DataTypeNumber    = enum.New[DataType](0, "number", "数字型")
	DataTypeChar      = enum.New[DataType](1, "char", "字符型")
	DataTypeDate      = enum.New[DataType](2, "date", "日期型")
	DataTypeDateTime  = enum.New[DataType](3, "datetime", "日期时间型")
	DataTypeTimestamp = enum.New[DataType](4, "timestamp", "时间戳型")
	DataTypeBool      = enum.New[DataType](5, "bool", "布尔型")
	DataTypeBinary    = enum.New[DataType](6, "binary", "二进制")
)
