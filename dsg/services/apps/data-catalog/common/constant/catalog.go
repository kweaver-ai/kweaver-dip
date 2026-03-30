package constant

const (
	CategoryTypeDepartment = iota + 1 // 所属部门
	CategoryTypeInfoSystem            // 信息系统
	CategoryTypeSubject               // 所属主题
	CategoryTypeCustom                // 自定义
)

const (
	DepartmentCateId = "00000000-0000-0000-0000-000000000001"
	InfoSystemCateId = "00000000-0000-0000-0000-000000000002"
	SubjectCateId    = "00000000-0000-0000-0000-000000000003"
)

const (
	MountView      = iota + 1 // 挂载视图
	MountAPI                  // 挂载接口
	MountFile                 // 挂载文件
	MountIndicator            // 挂载指标
)

const (
	ReSourceTypeNormal = iota + 1
	ReSourceTypeDelete // 数据资源删除
)

const SSZDOpenKey = "government_data_share"

const (
	BodyTypeReq = iota + 1
	BodyTypeRes
)

const (
	FeedbackDirInfoError     = "1" // 目录信息错误
	FeedbackDataQualityIssue = "2" // 数据质量问题
	FeedbackResourceMismatch = "3" // 挂接资源和目录不一致
	FeedbackInterfaceIssue   = "4" // 接口问题
	FeedbackOther            = "5" // 其他
)

const DraftFlag = 9527
