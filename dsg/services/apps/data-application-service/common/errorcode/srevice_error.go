package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(serviceErrorMap)
}

const (
	serviceModelName = "Service"
)

// Demo error
const (
	servicePreCoder = constant.ServiceName + "." + serviceModelName + "."

	ServiceNameExist              = servicePreCoder + "ServiceNameExist"
	ServicePathExist              = servicePreCoder + "ServicePathExist"
	ServiceIDNotExist             = servicePreCoder + "ServiceIDNotExist"
	ServiceNameNotExist           = servicePreCoder + "ServiceNameNotExist"
	ServiceStatusPublish          = servicePreCoder + "ServiceStatusPublish"
	ServiceStatusUnPublish        = servicePreCoder + "ServiceStatusUnPublish"
	ServiceUpdateStatusCheck      = servicePreCoder + "ServiceUpdateStatusCheck"
	ServiceUpdateServiceTypeCheck = servicePreCoder + "ServiceUpdateServiceTypeCheck"
	ServiceDeleteStatusError      = servicePreCoder + "ServiceDeleteStatusError"
	ServiceSQLSyntaxError         = servicePreCoder + "ServiceSQLSyntaxError"
	ServiceSQLSchemaError         = servicePreCoder + "ServiceSQLSchemaError"
	ServiceSQLTableError          = servicePreCoder + "ServiceSQLTableError"
	ServiceSQLWhereError          = servicePreCoder + "ServiceSQLWhereError"
	ServiceOwnerNameError         = servicePreCoder + "ServiceOwnerNameError"
	ServiceUnPublish              = servicePreCoder + "ServiceUnPublish"
	DataCatalogNotExist           = servicePreCoder + "DataCatalogNotExist"
	SubjectDomainIdNotExist       = servicePreCoder + "SubjectDomainIdNotExist"
	SubjectDomainIdNotL3          = servicePreCoder + "SubjectDomainIdNotL3"
	DataViewIdNotExist            = servicePreCoder + "DataViewIdNotExist"
	DataViewIdNotPublish          = servicePreCoder + "DataViewIdNotPublish"
	DatasourceIdNotExist          = servicePreCoder + "DatasourceIdNotExist"
	ServiceCodeGenerationError    = servicePreCoder + "ServiceCodeGenerationError"
	ServiceAuditUndoError         = servicePreCoder + "ServiceAuditUndoError"
	ServiceAbandonChangeError     = servicePreCoder + "ServiceAbandonChangeError"
	ServiceUpStatusError          = servicePreCoder + "ServiceUpStatusError"
	ServiceDownStatusError        = servicePreCoder + "ServiceDownStatusError"
	ServiceChangeStatusError      = servicePreCoder + "ServiceChangeStatusError"
	// 未找到 Service Owner 指定的用户
	ServiceOwnerNotFound = servicePreCoder + "OwnerNotFound"
	// 信息系统ID不存在
	InfoSystemIdNotExist = servicePreCoder + "InfoSystemIdNotExist"
	// 应用ID不存在
	AppsIdNotExist = servicePreCoder + "AppsIdNotExist"
)

var serviceErrorMap = errorCode{
	ServiceNameExist: {
		description: "接口名称已存在",
		cause:       "",
		solution:    "请重新输入接口名称",
	},
	ServicePathExist: {
		description: "接口路径已存在",
		cause:       "",
		solution:    "请重新输入接口路径",
	},
	ServiceIDNotExist: {
		description: "接口ID不存在",
		cause:       "",
		solution:    "请重新输入接口ID",
	},
	ServiceStatusPublish: {
		description: "只有处于【已发布】状态的接口才能进行取消发布操作",
		cause:       "",
		solution:    "请重新选择接口",
	},
	ServiceStatusUnPublish: {
		description: "只有处于【未发布】状态的接口才能进行发布操作",
		cause:       "",
		solution:    "请重新选择接口",
	},
	ServiceUpdateStatusCheck: {
		description: "当前状态不允许进行编辑操作",
		cause:       "",
		solution:    "请重新选择接口",
	},
	ServiceUpdateServiceTypeCheck: {
		description: "接口类型不能修改",
		cause:       "",
		solution:    "请重新选择接口",
	},
	ServiceDeleteStatusError: {
		description: "当前状态不允许进行删除操作",
		cause:       "",
		solution:    "请重新选择接口",
	},
	ServiceSQLSyntaxError: {
		description: "脚本格式错误",
		cause:       "",
		solution:    "请检查脚本格式: 1. 请求参数使用 ${参数名称} 作为占位符,例如: select a from b where c = ${c}; 2. 不支持多条sql语句。 3. 不支持写入注释。 4. 不支持 insert 、 update 和 delete 等非 select 语法。 5. 不支持 select *，必须明确指定查询的列。 6. in, not in 语句的值需要使用括号包围，例如: select a from b where c in (${c})",
	},
	ServiceSQLSchemaError: {
		description: "库名和所选数据源的库名不匹配",
		cause:       "",
		solution:    "SQL 脚本中请使用所选数据源的库名",
	},
	ServiceSQLTableError: {
		description: "脚本模式下, 使用资源目录关联数据源, 只支单表查询, 不支持多表关联, 且只能使用资源目录绑定的表",
		cause:       "",
		solution:    "SQL 脚本中请使用资源目录绑定的表",
	},
	ServiceSQLWhereError: {
		description: "脚本中缺少 where 语句",
		cause:       "",
		solution:    "请填写 where 语句",
	},
	ServiceOwnerNameError: {
		description: "数据Owner名称错误",
		cause:       "",
		solution:    "",
	},
	ServiceUnPublish: {
		description: "接口未发布或未上线",
		cause:       "",
		solution:    "请重新选择接口",
	},
	DataCatalogNotExist: {
		description: "资产不存在",
		cause:       "",
		solution:    "",
	},
	SubjectDomainIdNotExist: {
		description: "主题域id不存在",
		cause:       "",
		solution:    "",
	},
	SubjectDomainIdNotL3: {
		description: "主题域id只能绑定L2或者L3级别",
		cause:       "",
		solution:    "",
	},
	DataViewIdNotExist: {
		description: "数据视图id不存在",
		cause:       "",
		solution:    "",
	},
	DataViewIdNotPublish: {
		description: "该数据视图未发布, 无法使用",
		cause:       "",
		solution:    "请重新选择",
	},
	DatasourceIdNotExist: {
		description: "数据源id不存在",
		cause:       "",
		solution:    "",
	},
	ServiceCodeGenerationError: {
		description: "接口编码生成失败",
		cause:       "",
		solution:    "",
	},
	ServiceAuditUndoError: {
		description: "接口当前状态不符合要求，不能进行审核撤回操作",
		cause:       "",
		solution:    "请检查接口状态",
	},
	ServiceAbandonChangeError: {
		description: "接口当前状态不符合要求，不能进行恢复到已发布版本的操作",
		cause:       "",
		solution:    "请检查接口状态",
	},
	ServiceDownStatusError: {
		description: "接口当前状态不符合要求，不能进行下线操作",
		cause:       "",
		solution:    "请检查接口状态",
	},
	ServiceUpStatusError: {
		description: "接口当前状态不符合要求，不能进行上线操作",
		cause:       "",
		solution:    "请检查接口状态",
	},
	ServiceChangeStatusError: {
		description: "接口当前状态不符合要求，不能进行变更操作",
		cause:       "",
		solution:    "请检查接口状态",
	},
	ServiceOwnerNotFound: {
		description: "未找到数据 Owner",
		solution:    "请检查用户状态",
	},
	InfoSystemIdNotExist: {
		description: "信息系统ID不存在",
		cause:       "",
		solution:    "请检查信息系统ID是否正确",
	},
	AppsIdNotExist: {
		description: "应用ID不存在",
		cause:       "",
		solution:    "请检查应用ID是否正确",
	},
	ServiceNameNotExist: {
		description: "接口名称不存在",
		cause:       "",
		solution:    "请检查接口名称是否正确",
	},
}
