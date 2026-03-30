package errorcode

const (
	RelationDataInvalidParameter            = relationDataPreCoder + "InvalidParameter"
	RelationDataInvalidParameterJson        = relationDataPreCoder + "InvalidParameterJson"
	RelationDataDatabaseError               = relationDataPreCoder + "DatabaseError"
	RelationDataParseJsonError              = relationDataPreCoder + "ParseJsonError"
	RelationDataMultiMainBusinessError      = relationDataPreCoder + "MultiMainBusinessError"
	RelationDataNotMatchedMainBusinessError = relationDataPreCoder + "NotMatchedMainBusinessError"
	RelationDataInvalidIdType               = relationDataPreCoder + "InvalidIdType"
	RelationDataInvalidIdExists             = relationDataPreCoder + "InvalidIdExists"
	RelatedMainBusinessShouldNotEmpty       = relationDataPreCoder + "MainBusinessShouldNotEmpty"
	RelatedDataNotComprehendedExists        = relationDataPreCoder + "NotComprehendedExists"
)

var relationDataErrorMap = errorCode{
	RelationDataInvalidParameter: {
		description: "参数值校验不通过",
		solution:    SeeAPIManual,
	},
	RelationDataInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		solution:    "请使用请求参数构造规范化的请求字符串，详细信息参见产品 API 文档",
	},
	RelationDataDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		solution:    CheckDatabaseOrSyntax,
	},
	RelationDataParseJsonError: {
		description: "关联数据解析错误",
		solution:    ContactDeveloper,
	},
	RelationDataMultiMainBusinessError: {
		description: "关联数据出现在多个主干业务",
		solution:    ContactDeveloper,
	},
	RelationDataNotMatchedMainBusinessError: {
		description: "关联数据的主干业务和表单的主干业务不匹配",
		solution:    SeeAPIManual,
	},
	RelationDataInvalidIdType: {
		description: "不合法的关联数据类型",
		solution:    SeeAPIManual,
	},
	RelationDataInvalidIdExists: {
		description: "关联数据部分不存在或被删除",
		solution:    SeeAPIManual,
	},
	RelatedMainBusinessShouldNotEmpty: {
		description: "关联主干业务不能为空",
		solution:    SeeAPIManual,
	},
	RelatedDataNotComprehendedExists: {
		description: "存在未理解的数据资源目录，请检查",
		solution:    "请完成理解后再完成任务",
	},
}
