package constant

import (
	"database/sql/driver"
	"strconv"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

const (
	ServiceName = "DataExploration"

	DefaultHttpRequestTimeout = 60 * time.Second

	CommonTimeFormat = "2006-01-02 15:04:05"
)

const (
	SortByCreatedAt = "created_at"
	SortByUpdatedAt = "updated_at"
)

const (
	TraceIdContextKey  = "traceID"
	UserInfoContextKey = "UserInfoContextKey"
	UserTokenKey       = "token"
	UserId             = "userId"
	InfoName           = "info"
)

const (
	NO = int32(iota)
	YES
)

// 1未执行，2执行中，3执行成功，4已取消，5执行失败
const (
	Explore_Status_Undo = int32(iota) + 1
	Explore_Status_Excuting
	Explore_Status_Success
	Explore_Status_Canceled
	Explore_Status_Fail
)

type FieldType enum.Object

var (
	FieldTypeNum       = enum.New[FieldType](0, "BIGINT")
	FieldTypeString    = enum.New[FieldType](1, "VARCHAR")
	FieldTypeDate      = enum.New[FieldType](2, "DATE")
	FieldTypeDateTime  = enum.New[FieldType](3, "DATETIME")
	FieldTypeTimeStamp = enum.New[FieldType](4, "TIMESTAMP")
	FieldTypeBool      = enum.New[FieldType](5, "BOOL")
	FieldTypeBinary    = enum.New[FieldType](6, "BINARY")
)

// 维度 0准确性，1及时性，2完整性，3唯一性，4一致性，5有效性
const (
	Dimension_ZQX = int32(iota)
	Dimension_JSX
	Dimension_WZX
	Dimension_WYX
	Dimension_YZX
	Dimension_YXX
)

type Dimension enum.Object

var (
	DimensionCompleteness    = enum.New[Dimension](1, "completeness")    // 完整性
	DimensionStandardization = enum.New[Dimension](2, "standardization") // 规范性
	DimensionUniqueness      = enum.New[Dimension](3, "uniqueness")      // 唯一性
	DimensionAccuracy        = enum.New[Dimension](4, "accuracy")        // 准确性
	DimensionConsistency     = enum.New[Dimension](5, "consistency")     // 一致性
	DimensionTimeliness      = enum.New[Dimension](6, "timeliness")      // 及时性
	DimensionDataStatistics  = enum.New[Dimension](7, "data_statistics") // 数据统计
)

type DimensionType enum.Object

var (
	DimensionTypeRowNull   = enum.New[DimensionType](1, "row_null")   // 行数据空值项检查
	DimensionTypeRowRepeat = enum.New[DimensionType](2, "row_repeat") // 行数据重复值检查
	DimensionTypeNull      = enum.New[DimensionType](3, "null")       // 空值项检查
	DimensionTypeDict      = enum.New[DimensionType](4, "dict")       // 码值检查
	DimensionTypeRepeat    = enum.New[DimensionType](5, "repeat")     // 重复值检查
	DimensionTypeFormat    = enum.New[DimensionType](6, "format")     // 格式检查
	DimensionTypeCustom    = enum.New[DimensionType](7, "custom")     // 自定义规则
)

const (
	Level_table = int32(iota)
	Level_field
	Level_crossfield
	Level_crosstable
)

// total_count,null_count,blank_count,max,min,zero,avg,var_pop,stddev_pop,true,false,date_distribute_day,date_distribute_month,date_distribute_year,quantile,unique,dict
const (
	TotalCount = "CountTable"
	NullCount  = "空值项检查"
	Dict       = "码值检查"
	Unique     = "重复值检查"
	Regexp     = "格式检查"
	RowNull    = "行数据空值项检查"
	RowUnique  = "行数据重复值检查"
	Max        = "最大值"
	Min        = "最小值"
	Avg        = "平均值统计"
	VarPop     = "VarPop"
	StddevPop  = "标准差统计"
	TrueCount  = "TRUE值数"
	FalseCount = "FALSE值数"
	Day        = "天分布"
	Month      = "月分布"
	Year       = "年分布"
	Quantile   = "分位数"
	Group      = "枚举值分布"
	Update     = "数据及时性检查"
	NotNULL    = "NotNull"
)

const ExploreData = "explore_data"
const ExploreTimestamp = "explore_timestamp"

type ModelID string

func NewModelID(id uint64) ModelID {
	return ModelID(strconv.FormatUint(id, 10))
}

func (m ModelID) Uint64() uint64 {
	if len(m) == 0 {
		return 0
	}

	uintId, err := strconv.ParseUint(string(m), 10, 64)
	if err != nil {
		coder := agcodes.New(ServiceName+".Public.InvalidParameter", "参数值异常", "", "ID需要修改为可解析为数字的字符串", err, "")
		panic(agerrors.NewCode(coder))
	}

	return uintId
}

// Value 实现数据库驱动所支持的值
// 没有该方法会将ModelID在驱动层转换后string，导致与数据库定义类型不匹配
func (m ModelID) Value() (driver.Value, error) {
	return m.Uint64(), nil
}

// DataType  数据种类
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
	//re := regexp.MustCompile(`\([^)]*\)`)
	//dataType = re.ReplaceAllString(dataType, "")
	var resDataType string
	switch dataType {
	case "number",
		"tinyint",
		"smallint",
		"integer",
		"bigint",
		"int",
		"mediumint",
		"int unsigned",
		"tinyint unsigned",
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
