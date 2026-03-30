package constant

var ConfigurationCenterUrl string

type ObjectType string

const (
	LOCAL_TIME_FORMAT  = "2006-01-02 15:04:05"
	COMMON_CODE_FORMAT = "20060102150405"
)
const (
	DataView     = "data_view"
	InterfaceSvc = "interface_svc"
	Indicator    = "indicator"
)
const (
	ServiceName = "DataCatalog"
)

const (
	SortByCreatedAt = "created_at"
	SortByUpdatedAt = "updated_at"
	SortByScore     = "score"
)

const (
	TraceIdContextKey = "traceID"
	// UserInfoContextKey = "UserInfoContextKey"
	// UserTokenKey = "token"
)
const (
	ObjectTypeStringMainBusiness ObjectType = "main_business" // 主干业务
)

const UnallocatedId = "00000000-0000-0000-0000-000000000000"

const OtherSubject = "00000000-0000-0000-0000-000000000001"
const OtherName = "其他"

const (
	NoComprehensionReport  = 1 //没有数据理解报告
	HasComprehensionReport = 2 //已经有数据理解报告
)

const (
	TargetTableExistTrue = 1
)

const PDFHasSuffix = ".pdf"

const Scope = "scope"
const CurrentDepartment = "CurrentDepartment"
