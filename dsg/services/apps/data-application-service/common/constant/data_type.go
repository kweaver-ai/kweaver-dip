package constant

// region 虚拟化引擎类型(非全部只定义了需要使用的)
const (
	//整数型
	NUMBER   = "number"
	TINYINT  = "tinyint"
	SMALLINT = "smallint"
	INTEGER  = "integer"
	INT      = "int" //INTEGER 别名
	BIGINT   = "bigint"
	//小数型
	REAL            = "real"
	FLOAT           = "float" //REAL 别名
	DOUBLE          = "double"
	DOUBLEPRECISION = "double precision" //DOUBLE 别名
	//高精度型
	DECIMAL = "decimal"
	NUMERIC = "numeric" //DECIMAL 别名
	DEC     = "dec"     //DECIMAL 别名
	//布尔型
	BOOLEAN = "boolean"
	//日期型
	DATE = "date"
	//日期时间型
	TIME                     = "time"
	TIME_WITH_TIME_ZONE      = "time with time zone"
	DATETIME                 = "datetime"
	TIMESTAMP                = "timestamp"
	TIMESTAMP_WITH_TIME_ZONE = "timestamp with time zone"
	//INTERVAL_YEAR_TO_MONTH   = "interval year to month"
	//INTERVAL_DAY_TO_SECOND   = "interval day to second" //天数、小时、分钟、秒和毫秒的跨度。 例如: INTERVAL '2' DAY

	//字符型
	CHAR    = "char"
	VARCHAR = "varchar"
	STRING  = "string"
)

//endregion

//region 业务大类型

const SimpleChar = "char"
const SimpleInt = "int"
const SimpleFloat = "float"
const SimpleDecimal = "decimal"
const SimpleBool = "bool"
const SimpleDate = "date"
const SimpleDatetime = "datetime"
const SimpleTime = "time"
const SimpleBinary = "binary"
const SimpleOther = "other"

//endregion

//region 业务大类型 字符枚举值

var SimpleTypeChMapping = map[string]string{
	SimpleChar:     "字符型",
	SimpleInt:      "整数型",
	SimpleFloat:    "小数型",
	SimpleDecimal:  "高精度型",
	SimpleBool:     "布尔型",
	SimpleDate:     "日期型",
	SimpleDatetime: "日期时间型",
	SimpleTime:     "时间型",
	SimpleBinary:   "二进制型",
	SimpleOther:    "未定义型",
}

//endregion

//region 业务大类型 与 虚拟化引擎类型 映射

var SimpleTypeMapping = map[string]string{
	//region 字符型
	STRING:             SimpleChar,
	CHAR:               SimpleChar,
	VARCHAR:            SimpleChar,
	"json":             SimpleChar,
	"text":             SimpleChar,
	"tinytext":         SimpleChar,
	"mediumtext":       SimpleChar,
	"longtext":         SimpleChar,
	"uuid":             SimpleChar,
	"name":             SimpleChar,
	"jsonb":            SimpleChar,
	"bpchar":           SimpleChar,
	"uniqueidentifier": SimpleChar,
	"xml":              SimpleChar,
	"sysname":          SimpleChar,
	"nvarchar":         SimpleChar,
	"enum":             SimpleChar,
	"set":              SimpleChar,
	"ntext":            SimpleChar,
	"nchar":            SimpleChar,
	"rowid":            SimpleChar,
	"urowid":           SimpleChar,
	"varchar2":         SimpleChar,
	"nvarchar2":        SimpleChar,
	"fixedstring":      SimpleChar,
	"nclob":            SimpleChar,
	"ipaddress":        SimpleChar,
	//endregion

	//region 整数型
	NUMBER:               SimpleInt,
	TINYINT:              SimpleInt,
	SMALLINT:             SimpleInt,
	INTEGER:              SimpleInt,
	BIGINT:               SimpleInt,
	INT:                  SimpleInt,
	"mediumint":          SimpleInt,
	"int unsigned":       SimpleInt,
	"tinyint unsigned":   SimpleInt,
	"smallint unsigned":  SimpleInt,
	"mediumint unsigned": SimpleInt,
	"bigint unsigned":    SimpleInt,
	"int8":               SimpleInt,
	"int4":               SimpleInt,
	"int2":               SimpleInt,
	"int16":              SimpleInt,
	"int32":              SimpleInt,
	"int64":              SimpleInt,
	"int128":             SimpleInt,
	"int256":             SimpleInt,
	"long":               SimpleInt,

	REAL:            SimpleFloat,
	DOUBLE:          SimpleFloat,
	FLOAT:           SimpleFloat,
	DOUBLEPRECISION: SimpleFloat,
	"float4":        SimpleFloat,
	"float8":        SimpleFloat,
	"float16":       SimpleFloat,
	"float32":       SimpleFloat,
	"float64":       SimpleFloat,
	"binary_double": SimpleFloat,
	"binary_float":  SimpleFloat,

	DECIMAL: SimpleDecimal, NUMERIC: SimpleDecimal, DEC: SimpleDecimal,

	BOOLEAN: SimpleBool, "bit": SimpleBool, "bool": SimpleBool,

	DATE: SimpleDate, "year": SimpleDate,

	DATETIME:                 SimpleDatetime,
	"datetime2":              SimpleDatetime,
	"smalldatetime":          SimpleDatetime,
	TIMESTAMP:                SimpleDatetime,
	"timestamptz":            SimpleDatetime,
	TIMESTAMP_WITH_TIME_ZONE: SimpleDatetime,
	"interval":               SimpleDatetime, // 跨度
	"interval year to month": SimpleDatetime, // 年和月的跨度
	"interval day to second": SimpleDatetime, // 天数、小时、分钟、秒和毫秒的跨度

	TIME: SimpleTime, "timetz": SimpleTime, TIME_WITH_TIME_ZONE: SimpleTime,

	"binary":      SimpleBinary,
	"blob":        SimpleBinary,
	"tinyblob":    SimpleBinary,
	"mediumblob":  SimpleBinary,
	"longblob":    SimpleBinary,
	"bytea":       SimpleBinary,
	"image":       SimpleBinary,
	"hierarchyid": SimpleBinary,
	"geography":   SimpleBinary,
	"geometry":    SimpleBinary,
	"varbinary":   SimpleBinary,
	"raw":         SimpleBinary,
	"map":         SimpleBinary,
	"array":       SimpleBinary,
	"struct":      SimpleBinary,

	"money":       SimpleOther,
	"smallmoney":  SimpleOther,
	"oid":         SimpleOther,
	"smallserial": SimpleOther,
	"serial4":     SimpleOther,
	"bigserial":   SimpleOther,
	"serial":      SimpleOther,
	"row":         SimpleOther,
	"hyperloglog": SimpleOther,
}

//endregion
