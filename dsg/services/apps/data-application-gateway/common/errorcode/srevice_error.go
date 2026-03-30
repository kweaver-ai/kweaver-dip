package errorcode

func init() {
	registerErrorCode(serviceErrorMap)
}

const (
	serviceModelName = "Service"
)

// Demo error
const (
	servicePreCoder = ServiceName + "." + serviceModelName + "."

	ServiceNameExist         = servicePreCoder + "ServiceNameExist"
	ServicePathExist         = servicePreCoder + "ServicePathExist"
	ServicePathNotExist      = servicePreCoder + "ServicePathNotExist"
	ServiceIDNotExist        = servicePreCoder + "ServiceIDNotExist"
	ServiceSQLSyntaxError    = servicePreCoder + "ServiceSQLSyntaxError"
	ServiceSQLSchemaError    = servicePreCoder + "ServiceSQLSchemaError"
	ServiceSQLTableError     = servicePreCoder + "ServiceSQLTableError"
	ServiceQueryPublishError = servicePreCoder + "ServiceQueryOnlineError"
	DataViewIdNotExist       = servicePreCoder + "DataViewIdNotExist"
	DataViewIdNotPublish     = servicePreCoder + "DataViewIdNotPublish"
	DatasourceIdNotExist     = servicePreCoder + "DatasourceIdNotExist"
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
	ServicePathNotExist: {
		description: "接口路径不存在",
		cause:       "",
		solution:    "请重新输入接口路径",
	},
	ServiceIDNotExist: {
		description: "接口ID不存在",
		cause:       "",
		solution:    "请重新输入接口ID",
	},
	ServiceSQLSyntaxError: {
		description: "脚本格式错误",
		cause:       "",
		solution:    "请检查脚本格式: 1. 请求参数使用 ${参数名称} 作为占位符,例如: select a from b where c = ${c}; 2. 不支持多条sql语句。 3. 不支持写入注释。 4. 不支持 insert 、 update 和 delete 等非 select 语法。 5. 不支持 select *，必须明确指定查询的列。",
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
	ServiceQueryPublishError: {
		description: "接口未发布或未上线, 无法调用",
		cause:       "",
		solution:    "请稍后再试",
	},
	DataViewIdNotExist: {
		description: "数据视图id不存在",
		cause:       "",
		solution:    "请重新选择",
	},
	DataViewIdNotPublish: {
		description: "该数据视图未发布, 无法使用",
		cause:       "",
		solution:    "请重新选择",
	},
	DatasourceIdNotExist: {
		description: "数据源id不存在",
		cause:       "",
		solution:    "请重新选择",
	},
}
