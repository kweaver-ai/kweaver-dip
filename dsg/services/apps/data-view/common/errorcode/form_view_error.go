package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(FormViewErrorMap)
}

const (
	formViewPreCoder = constant.ServiceName + ".FormView."

	DatabaseError                        = formViewPreCoder + "DatabaseError"
	DataSourceInfoError                  = formViewPreCoder + "DataSourceInfoError"
	FormViewIdNotExist                   = formViewPreCoder + "FormViewIdNotExist"
	FormViewBusinessNameEmpty            = formViewPreCoder + "FormViewBusinessNameEmpty"
	FormViewFieldBusinessNameEmpty       = formViewPreCoder + "FormViewFieldBusinessNameEmpty"
	FormViewTechnicalNameNotExist        = formViewPreCoder + "FormViewTechnicalNameNotExist"
	DataSourceIDNotExistOrRepeat         = formViewPreCoder + "DataSourceIDNotExistOrRepeat"
	StartTimeMustBigEndTime              = formViewPreCoder + "StartTimeMustBigEndTime"
	DataSourceIDNotExist                 = formViewPreCoder + "DataSourceIDNotExist"
	DataSourceIDAndDataSourceTypeExclude = formViewPreCoder + "DataSourceIDAndDataSourceTypeExclude"
	FieldsBusinessNameRepeat             = formViewPreCoder + "FieldsBusinessNameRepeat"
	FormViewFieldIDNotExist              = formViewPreCoder + "FormViewFieldIDNotExist"
	FormViewFieldIDNotComplete           = formViewPreCoder + "FormViewFieldIDNotComplete"
	FormViewFieldIDNotInFormView         = formViewPreCoder + "FormViewFieldIDNotInFormView"
	FormViewNameExist                    = formViewPreCoder + "FormViewNameExist"
	DataSourceIsScanning                 = formViewPreCoder + "DataSourceIsScanning"
	FormViewDeleteCannotUpdate           = formViewPreCoder + "FormViewDeleteCannotUpdate"
	DatasourceEmpty                      = formViewPreCoder + "DatasourceEmpty"
	MetadataCollectTaskFail              = formViewPreCoder + "MetadataCollectTaskFail"
	OnlySubjectDomain                    = formViewPreCoder + "OnlySubjectDomain"
	LogicEntityCanNotChange              = formViewPreCoder + "LogicEntityCanNotChange"
	UserNotHaveThisViewPermissions       = formViewPreCoder + "UserNotHaveThisViewPermissions"
	// 新视图编码超过编码最大值
	NewFormViewEncodingExceedEncodingMaximum            = formViewPreCoder + "NewFormViewEncodingExceedEncodingMaximum"
	MetadataFormViewOnlySubjectDomain                   = formViewPreCoder + "MetadataFormViewOnlySubjectDomain"
	OwnersIncorrect                                     = formViewPreCoder + "OwnersIncorrect"
	GetUsersNameError                                   = formViewPreCoder + "GetUsersNameError"
	UserMgmGetDepartmentNameParentInfoError             = formViewPreCoder + "UserMgmGetDepartmentNameParentInfoError"
	OwnersNotNullWhenPublish                            = formViewPreCoder + "OwnersNotNullWhenPublish"
	DomainIdNotExist                                    = formViewPreCoder + "DomainIdNotExist"
	DepartmentIdNotExist                                = formViewPreCoder + "DepartmentIdNotExist"
	DataExploreJobUpsertErr                             = formViewPreCoder + "DataExploreJobUpsertErr"
	DataExploreJobStatusGetErr                          = formViewPreCoder + "DataExploreJobStatusGetErr"
	DataExploreReportGetErr                             = formViewPreCoder + "DataExploreReportGetErr"
	MustDatasourceFormView                              = formViewPreCoder + "MustDatasourceFormView"
	NotToDatasourceFormView                             = formViewPreCoder + "NotToDatasourceFormView"
	DatasourceViewNameRepeatDatasourceRequire           = formViewPreCoder + "DatasourceViewNameRepeatDatasourceRequire"
	CustomAndLogicEntityViewNameRepeatNameTypeRequire   = formViewPreCoder + "CustomAndLogicEntityViewNameRepeatNameTypeRequire"
	NameRepeat                                          = formViewPreCoder + "NameRepeat"
	TaskNotFound                                        = formViewPreCoder + "TaskNotFound"
	TaskOperateIsForbidden                              = formViewPreCoder + "TaskOperateIsForbidden"
	UserNotHaveThisTaskPermissions                      = formViewPreCoder + "UserNotHaveThisTaskPermissions"
	TaskFileCleanFailed                                 = formViewPreCoder + "TaskFileCleanFailed"
	MqProduceError                                      = formViewPreCoder + "MqProduceError"
	FormViewIDAndDatasourceID                           = formViewPreCoder + "FormViewIDAndDatasourceID"
	FormExistRequiredEmpty                              = formViewPreCoder + "FormExistRequiredEmpty"
	FormOneMax                                          = formViewPreCoder + "FormOneMax"
	FormOpenExcelFileError                              = formViewPreCoder + "FormOpenExcelFileError"
	ExcelContentError                                   = formViewPreCoder + "ExcelContentError"
	OwnerInfoError                                      = formViewPreCoder + "OwnerInfoError"
	DepartmentPathError                                 = formViewPreCoder + "DepartmentPathError"
	SubjectPathError                                    = formViewPreCoder + "SubjectPathError"
	TechNameNotFound                                    = formViewPreCoder + "TechNameNotFound"
	AuditStatusAuditingCannotDelete                     = formViewPreCoder + "AuditStatusAuditingCannotDelete"
	CompletionRepeat                                    = formViewPreCoder + "CompletionRepeat"
	CompletionNotFound                                  = formViewPreCoder + "CompletionNotFound"
	CompletionFailed                                    = formViewPreCoder + "CompletionFailed"
	UnmarshalCompletionFailed                           = formViewPreCoder + "UnmarshalCompletionFailed"
	CodeTableIDsVerifyFail                              = formViewPreCoder + "CodeTableIDsVerifyFail"
	StandardCodesVerifyFail                             = formViewPreCoder + "StandardCodesVerifyFail"
	UserGetAppsNotAllowed                               = formViewPreCoder + "UserGetAppsNotAllowed"
	BusinessTimestampNotFound                           = formViewPreCoder + "BusinessTimestampNotFound"
	DataTypeConversionError                             = formViewPreCoder + "DataTypeConversionError"
	UserNotHaveThisFormViewPermissions                  = formViewPreCoder + "UserNotHaveThisFormViewPermissions"
	UserNotHaveThisFieldPermissions                     = formViewPreCoder + "UserNotHaveThisFieldPermissions"
	DesensitizationRuleRelatePrivacy                    = formViewPreCoder + "DesensitizationRuleRelatePrivacy"
	SubjectHasLabel                                     = formViewPreCoder + "SubjectHasLabel"
	DataSourceSourceTypeAndDataSourceIDExclude          = formViewPreCoder + "DataSourceSourceTypeAndDataSourceIDExclude"
	InfoSystemIDAndDataSourceIDAndDataSourceTypeExclude = formViewPreCoder + "InfoSystemIDAndDataSourceIDAndDataSourceTypeExclude"
)

var FormViewErrorMap = errorcode.ErrorCode{
	DatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	DataSourceInfoError: {
		Description: "数据源信息错误",
		Cause:       "",
		Solution:    "",
	},
	FormViewIdNotExist: {
		Description: "逻辑视图id不存在",
		Cause:       "",
		Solution:    "",
	},
	FormViewTechnicalNameNotExist: {
		Description: "逻辑视图技术名称不存在",
		Cause:       "",
		Solution:    "",
	},
	FormViewBusinessNameEmpty: {
		Description: "发布时业务逻辑视图业务名称不能为空",
		Cause:       "",
		Solution:    "",
	},
	FormViewFieldBusinessNameEmpty: {
		Description: "发布时业务逻辑视图列业务名称不能为空",
		Cause:       "",
		Solution:    "",
	},
	DataSourceIDNotExistOrRepeat: {
		Description: "数据源ID不存在或者数据源ID重复",
		Cause:       "",
		Solution:    "",
	},
	StartTimeMustBigEndTime: {
		Description: "开始时间必须小于结束时间",
		Cause:       "",
		Solution:    "",
	},
	DataSourceIDNotExist: {
		Description: "数据源不存在",
		Cause:       "",
		Solution:    "",
	},
	DataSourceIDAndDataSourceTypeExclude: {
		Description: "数据源和(数据源类型筛选、数据源筛选)同时只支持一个",
		Cause:       "",
		Solution:    "",
	},
	DataSourceSourceTypeAndDataSourceIDExclude: {
		Description: "数据源和(数据源来源类型筛选、数据源筛选)同时只支持一个",
		Cause:       "",
		Solution:    "",
	},
	InfoSystemIDAndDataSourceIDAndDataSourceTypeExclude: {
		Description: "数据源和(信息系统筛选)只支持一个",
		Cause:       "",
		Solution:    "",
	},
	FieldsBusinessNameRepeat: {
		Description: "同一个数据源下字段业务名称不能重复",
		Cause:       "",
		Solution:    "",
	},
	FormViewFieldIDNotExist: {
		Description: "逻辑视图字段id不存在",
		Cause:       "",
		Solution:    "",
	},
	FormViewFieldIDNotComplete: {
		Description: "逻辑视图字段id不完整",
		Cause:       "",
		Solution:    "需要一张逻辑视图所有字段id",
	},
	FormViewFieldIDNotInFormView: {
		Description: "逻辑视图字段id不存在该逻辑视图中",
		Cause:       "",
		Solution:    "",
	},
	FormViewNameExist: {
		Description: "逻辑视图业务名称已经存在",
		Cause:       "",
		Solution:    "",
	},
	DataSourceIsScanning: {
		Description: "之前发起的扫描任务未完成逻辑视图采集，不能重复发起 ，请稍后再试。",
		Cause:       "",
		Solution:    "",
	},
	FormViewDeleteCannotUpdate: {
		Description: "删除状态的逻辑视图不能发布和保存",
		Cause:       "",
		Solution:    "",
	},
	DatasourceEmpty: {
		Description: "数据源下没有采集到表",
		Cause:       "",
		Solution:    "",
	},
	MetadataCollectTaskFail: {
		Description: "元数据服务执行采集任务失败",
		Cause:       "",
		Solution:    "",
	},
	OnlySubjectDomain: {
		Description: "只能绑定主题域、业务对象及业务活动",
		Cause:       "",
		Solution:    "",
	},
	LogicEntityCanNotChange: {
		Description: "逻辑实体视图不能切换逻辑实体",
		Cause:       "",
		Solution:    "",
	},
	OwnersIncorrect: {
		Description: "owners不是数据owner下的用户",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	GetUsersNameError: {
		Description: "获取用户名称失败",
		Cause:       "",
		Solution:    "",
	},
	DataExploreJobUpsertErr: {
		Description: "质量检测作业配置失败",
		Cause:       "",
		Solution:    "请检查配置是否正确",
	},
	DataExploreJobStatusGetErr: {
		Description: "质量检测作业执行状态获取失败",
		Cause:       "",
		Solution:    "请重试",
	},
	DataExploreReportGetErr: {
		Description: "探查报告不存在",
		Cause:       "",
		Solution:    "请重试",
	},
	UserMgmGetDepartmentNameParentInfoError: {
		Description: "获取部门用户名及父部门信息失败",
		Cause:       "",
		Solution:    "",
	},
	OwnersNotNullWhenPublish: {
		Description: "发布数据Owner不能为空",
		Cause:       "",
		Solution:    "",
	},
	UserNotHaveThisViewPermissions: {
		Description: "该用户没有此视图权限",
		Cause:       "",
		Solution:    "请检查权限",
	},
	NewFormViewEncodingExceedEncodingMaximum: {
		Description: "新视图编码超过编码最大值，可联系管理员调整编码规则",
	},
	DomainIdNotExist: {
		Description: "当前选择的主题域已不存在，请重新选择",
		Cause:       "",
		Solution:    "",
	},
	DepartmentIdNotExist: {
		Description: "当前选择的部门已不存在，请重新选择",
		Cause:       "",
		Solution:    "",
	},
	MustDatasourceFormView: {
		Description: "只能对元数据视图操作",
		Cause:       "",
		Solution:    "",
	},
	NotToDatasourceFormView: {
		Description: "不能对元数据视图操作",
		Cause:       "",
		Solution:    "",
	},
	DatasourceViewNameRepeatDatasourceRequire: {
		Description: "元数据视图名称检验数据源id和form_id必填",
		Cause:       "",
		Solution:    "",
	},
	CustomAndLogicEntityViewNameRepeatNameTypeRequire: {
		Description: "视图名称检验名称类型必填",
		Cause:       "",
		Solution:    "",
	},
	NameRepeat: {
		Description: "[name]重复",
		Cause:       "",
		Solution:    "",
	},
	TaskNotFound: {
		Description: "任务未找到",
		Cause:       "",
		Solution:    "请检查任务是否存在",
	},
	TaskOperateIsForbidden: {
		Description: "任务不可操作",
		Cause:       "",
		Solution:    "请检查任务状态",
	},
	UserNotHaveThisTaskPermissions: {
		Description: "该用户没有此任务权限",
		Cause:       "",
		Solution:    "请检查是否该用户创建的任务",
	},
	TaskFileCleanFailed: {
		Description: "清理任务导出文件失败",
		Cause:       "",
		Solution:    "请检查网关配置",
	},
	MqProduceError: {
		Description: "消息发送失败",
		Cause:       "",
		Solution:    "请稍后重试",
	},
	FormViewIDAndDatasourceID: {
		Description: "视图id和数据源id至少填一个",
		Cause:       "",
		Solution:    "请稍后重试",
	},
	FormExistRequiredEmpty: {
		Description: "存在文件内必填项为空",
		Solution:    "请检查必填项",
	},
	FormOneMax: {
		Description: "仅支持每次上传一个文件",
		Solution:    "请重新上传",
	},
	FormOpenExcelFileError: {
		Description: "打开文件失败",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	ExcelContentError: {
		Description: "excel内容格式错误",
		Cause:       "",
		Solution:    "重新选择上传文件",
	},
	OwnerInfoError: {
		Description: "owner信息有误",
		Cause:       "",
		Solution:    "",
	},
	DepartmentPathError: {
		Description: "部门信息有误",
		Cause:       "",
		Solution:    "",
	},
	SubjectPathError: {
		Description: "主题域信息有误",
		Cause:       "",
		Solution:    "",
	},
	TechNameNotFound: {
		Description: "存在技术名称不存在",
		Cause:       "",
		Solution:    "",
	},
	AuditStatusAuditingCannotDelete: {
		Description: "审核中的视图不能删除",
		Cause:       "",
		Solution:    "",
	},
	CompletionRepeat: {
		Description: "已发起过视图补全",
		Cause:       "",
		Solution:    "",
	},
	CompletionNotFound: {
		Description: "补全结果不存在",
		Cause:       "",
		Solution:    "",
	},
	CompletionFailed: {
		Description: "补全失败",
		Cause:       "",
		Solution:    "重新发起",
	},
	UnmarshalCompletionFailed: {
		Description: "解析补全结果失败",
		Cause:       "",
		Solution:    "重新发起",
	},
	CodeTableIDsVerifyFail: {
		Description: "参数值校验不通过:码表不存在",
	},
	StandardCodesVerifyFail: {
		Description: "参数值校验不通过:标准不存在",
	},
	UserGetAppsNotAllowed: {
		Description: "该用户没有此应用权限",
		Cause:       "",
		Solution:    "该用户没有此应用权限",
	},
	BusinessTimestampNotFound: {
		Description: "未标记业务更新时间字段",
		Cause:       "",
		Solution:    "",
	},
	DataTypeConversionError: {
		Description: "不支持的转换类型",
		Cause:       "",
		Solution:    "",
	},
	UserNotHaveThisFormViewPermissions: {
		Description: "该用户没有此视图权限",
		Cause:       "",
		Solution:    "请检查",
	},
	UserNotHaveThisFieldPermissions: {
		Description: "该用户没有此字段权限",
		Cause:       "",
		Solution:    "请检查",
	},
	DesensitizationRuleRelatePrivacy: {
		Description: "该规则已有关联隐私策略",
		Cause:       "",
		Solution:    "请先在隐私策略中取消关联规则，再删除",
	},
	SubjectHasLabel: {
		Description: "该分类有分级标签，不能清除字段分级",
		Cause:       "",
		Solution:    "请先删除或更改分类",
	},
}
