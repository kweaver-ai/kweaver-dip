package errorcode

import (
	"fmt"
	"regexp"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

type ErrorCodeBody struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Cause       string `json:"cause"`
	Solution    string `json:"solution"`
}

// Model Name
const (
	publicModelName = "Public"

	treeModelName              = "Tree"
	treeNodeModelName          = "TreeNode"
	CognitiveServiceSystemName = "CognitiveServiceSystem"

	lineageModelName         = "Lineage"
	systemOperationModelName = "systemOperation"
)

// Public error
const (
	publicPreCoder = constant.ServiceName + "." + publicModelName + "."

	PublicInternalError               = publicPreCoder + "InternalError"
	PublicInvalidParameter            = publicPreCoder + "InvalidParameter"
	PublicInvalidParameterJson        = publicPreCoder + "InvalidParameterJson"
	PublicUnmarshalJson               = publicPreCoder + "UnmarshalJson"
	PublicInvalidParameterValue       = publicPreCoder + "InvalidParameterValue"
	PublicInvalidExistsValue          = publicPreCoder + "ExistsValue"
	PublicInvalidExistsPlanValue      = publicPreCoder + "ExistsPlanValue"
	PublicInvalidLengthValue          = publicPreCoder + "InvalidLengthValue"
	PublicDatabaseError               = publicPreCoder + "DatabaseError"
	PublicRequestParameterError       = publicPreCoder + "RequestParameterError"
	PublicUniqueIDError               = publicPreCoder + "PublicUniqueIDError"
	PublicResourceNotExisted          = publicPreCoder + "ResourceNotExisted"
	PublicNoAuthorization             = publicPreCoder + "NoAuthorization"
	TokenAuditFailed                  = publicPreCoder + "TokenAuditFailed"
	UserNotActive                     = publicPreCoder + "UserNotActive"
	GetUserInfoFailed                 = publicPreCoder + "GetUserInfoFailed"
	GetUserInfoFailedInterior         = publicPreCoder + "GetUserInfoFailedInterior"
	GetTokenEmpty                     = publicPreCoder + "GetTokenEmpty"
	ResourceMountedConflict           = publicPreCoder + "ResourceMountedConflict"
	CatalogNameConflict               = publicPreCoder + "CatalogNameConflict"
	ResourcePublishDisabled           = publicPreCoder + "ResourcePublishDisabled"
	AssetOfflineError                 = publicPreCoder + "AssetOfflineError"
	ResourceShareDisabled             = publicPreCoder + "ResourceShareDisabled"
	ResourceOpenDisabled              = publicPreCoder + "ResourceOpenDisabled"
	PublicAuditApplyFailedError       = publicPreCoder + "AuditApplyFailedError"
	PublicAuditApplyNotAllowedError   = publicPreCoder + "AuditApplyNotAllowedError"
	PublicNoAuditDefFoundError        = publicPreCoder + "NoAuditDefFoundError"
	PublicResourceEditNotAllowedError = publicPreCoder + "ResourceEditNotAllowedError"
	PublicResourceDelNotAllowedError  = publicPreCoder + "ResourceDelNotAllowedError"
	PublicAuditTypeConflict           = publicPreCoder + "AuditTypeConflict"
	PublicAuditApplyIDParseFailed     = publicPreCoder + "AuditApplyIDParseFailed"
	PublicGetOwnerAuditorsNotAllowed  = publicPreCoder + "GetOwnerAuditorsNotAllowed"
	AvailableAssetNotExisted          = publicPreCoder + "AvailableAssetNotExisted"

	GetThirdPartyAddr = publicPreCoder + "GetThirdPartyAddr"

	GetAccessPermissionError    = publicPreCoder + "GetAccessPermissionError"
	UserNotHavePermission       = publicPreCoder + "UserNotHavePermission"
	AccessTypeNotSupport        = publicPreCoder + "AccessTypeNotSupport"
	PublicAccessPermitted       = publicPreCoder + "AccessPermitted"
	PublicDuplicatedAccessApply = publicPreCoder + "DuplicateAccessApply"

	DataSourceInvalid                   = publicPreCoder + "DataSourceInvalid"
	DataSourceNotFound                  = publicPreCoder + "DataSourceNotFound"
	BigModelSampleRequestErr            = publicPreCoder + "BigModelSampleRequestErr"
	DataSourceRequestErr                = publicPreCoder + "DataSourceRequestErr"
	VirtualEngineRequestErr             = publicPreCoder + "VirtualEngineRequestErr"
	SqlMaskingRequestErr                = publicPreCoder + "SqlMaskingRequestErr"
	ConfigCenterTreeOrgRequestErr       = publicPreCoder + "ConfigCenterTreeOrgRequestErr"
	ConfigCenterDepOwnerUsersRequestErr = publicPreCoder + "ConfigCenterDepOwnerUsersRequestErr"
	OwnerIDNotInDepartmentErr           = publicPreCoder + "OwnerIDNotInDepartmentErr"
	BusinessGroomingOwnerRequestErr     = publicPreCoder + "BusinessGroomingOwnerRequestErr"
	CatalogCodeOverConcurrency          = publicPreCoder + "CatalogCodeOverConcurrency"
	TableOrColumnNotExisted             = publicPreCoder + "TableOrColumnNotExisted"
	DownloadNoPermittedErr              = publicPreCoder + "DownloadNoPermittedErr"
	DataCatalogNoOwnerErr               = publicPreCoder + "DataCatalogNoOwnerErr"
	ConfigCenterDeptRequestErr          = publicPreCoder + "ConfigCenterDeptRequestErr"
	GetInfoSystemDetail                 = publicPreCoder + "GetInfoSystemDetail"
	NoTableMounted                      = publicPreCoder + "NoTableMounted"

	ModelConfigurationCenterUrlError = publicPreCoder + "ConfigurationCenterUrlError"
	ModelDepartmentNotFound          = publicPreCoder + "DepartmentNotFound"
	ModelJsonMarshalError            = publicPreCoder + "JsonMarshalError"
	ModelMainBusinessNotFound        = publicPreCoder + "MainBusinessNotFound"
	ModelJsonUnMarshalError          = publicPreCoder + "JsonUnMarshalError"
	ModelObjectNameAlreadyExist      = publicPreCoder + "ObjectNameAlreadyExist"
	ModelCCUrlError                  = publicPreCoder + "ConfigCenterUrlError"

	FormViewInvalidError      = publicPreCoder + "FormViewInvalidError"
	FormViewResUnmatchedError = publicPreCoder + "FormViewResUnmatchedError"

	AuthPolicyGetError       = publicPreCoder + "AuthPolicyGetError"
	AuthPolicyEnforceError   = publicPreCoder + "AuthPolicyEnforceError"
	AuthAvailableAssetsError = publicPreCoder + "AuthAvailableAssetsError"

	OwnerIDInvalidErr = publicPreCoder + "OwnerIDInvalidErr"

	CatalogFeedbackNotExistedErr       = publicPreCoder + "CatalogFeedbackNotExistedErr"
	CatalogFeedbackLogNotExistedErr    = publicPreCoder + "CatalogFeedbackLogNotExistedErr"
	CatalogFeedbackOpNotAllowedErr     = publicPreCoder + "CatalogFeedbackOpNotAllowedErr"
	CatalogFeedbackCreateNotAllowedErr = publicPreCoder + "CatalogFeedbackCreateNotAllowedErr"

	PublicAuditCancelNotAllowedError     = publicPreCoder + "AuditCancelNotAllowedError"
	PublicResourceAlreadyExist           = publicPreCoder + "ResourceAlreadyExist"
	PublicCatalogScoreRecordAlreadyExist = publicPreCoder + "CatalogScoreRecordAlreadyExist"
	PublicCatalogScoreRecordNotExisted   = publicPreCoder + "CatalogScoreRecordNotExisted"

	CatalogHasBeenFavoredErr              = publicPreCoder + "CatalogHasBeenFavoredErr"
	FavoriteNotExistedOrUserNotMatchedErr = publicPreCoder + "FavoriteNotExistedOrUserNotMatchedErr"

	CatalogNotExisted      = publicPreCoder + "CatalogNotExisted"
	CatalogFavorNotAllowed = publicPreCoder + "CatalogFavorNotAllowed"

	FileMaxUploadError        = publicPreCoder + "FileMaxUploadError"
	SampleDataTypeError       = publicPreCoder + "SampleDataTypeError"
	MyDepartmentNotExistError = publicPreCoder + "MyDepartmentNotExistError"
)

var publicErrorMap = errorCode{
	ModelConfigurationCenterUrlError: {
		description: "配置中心服务异常，或url地址有误",
		solution:    "请检查配置中心服务，检查ip和端口后重试",
	},
	ModelDepartmentNotFound: {
		description: "部门或组织不存在",
		solution:    "请重试",
	},
	ModelJsonMarshalError: {
		description: "json.Marshal转化失败",
		cause:       "",
		solution:    "检查文件内容",
	},
	ModelMainBusinessNotFound: {
		description: "该主干业务不存在，请刷新页面",
		solution:    "请选择存在的主干业务",
	},
	ModelObjectNameAlreadyExist: {
		description: "业务架构下该主干业务名称已存在，请重新输入",
		cause:       "",
		solution:    "请更换其它名称",
	},
	ModelCCUrlError: {
		description: "配置中心服务异常，或url地址有误",
		solution:    "请检查配置中心服务，检查ip和端口后重试",
	},
	ModelJsonUnMarshalError: {
		description: "json.UnMarshal转化失败",
		cause:       "",
		solution:    "检查文件内容",
	},
	PublicInternalError: {
		description: "内部错误",
		cause:       "",
		solution:    "",
	},
	PublicInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	PublicInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		solution:    "请使用请求参数构造规范化的请求字符串，详细信息参见产品 API 文档",
	},
	PublicUnmarshalJson: {
		description: "json解析失败",
		solution:    "请重试",
	},
	PublicInvalidLengthValue: {
		description: "名称长度不能超过128字符",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	PublicInvalidExistsValue: {
		description: "当前部门已存在相同名称的目标，请重新输入",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	PublicInvalidExistsPlanValue: {
		description: "当前类型下已存在相同名称的计划，请重新输入",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	PublicInvalidParameterValue: {
		description: "参数值[param]校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	PublicDatabaseError: {
		description: "数据库异常",
		cause:       "",
		solution:    "请检查数据库状态",
	},
	PublicRequestParameterError: {
		description: "请求参数格式错误",
		cause:       "输入请求参数格式或内容有问题",
		solution:    "请输入正确格式的请求参数",
	},
	PublicUniqueIDError: {
		description: "模型ID生成失败",
		cause:       "",
		solution:    "",
	},
	PublicResourceNotExisted: {
		description: "资源不存在",
		cause:       "",
		solution:    "请检查资源是否已被删除",
	},
	PublicResourceAlreadyExist: {
		description: "资源已存在，不可重复操作",
		cause:       "",
		solution:    "请检查资源是否存在",
	},
	PublicNoAuthorization: {
		description: "无当前操作权限",
		cause:       "",
		solution:    "请确认已取得当前操作权限",
	},
	TokenAuditFailed: {
		description: "用户信息验证失败",
		cause:       "",
		solution:    "请重试",
	},
	UserNotActive: {
		description: "用户登录已过期",
		cause:       "",
		solution:    "请重新登陆",
	},
	GetUserInfoFailed: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请重试",
	},
	GetUserInfoFailedInterior: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	GetTokenEmpty: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ResourceMountedConflict: {
		description: "资源挂接冲突",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	CatalogNameConflict: {
		description: "目录名称冲突",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ResourcePublishDisabled: {
		description: "资源已取消发布",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	AssetOfflineError: {
		description: "资产已下线",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ResourceShareDisabled: {
		description: "资源未开放共享",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ResourceOpenDisabled: {
		description: "资源未向公众开放",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicAuditApplyFailedError: {
		description: "当前资源审核申请失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicAuditApplyNotAllowedError: {
		description: "当前资源不允许进行审核申请",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicNoAuditDefFoundError: {
		description: "未找到匹配的审核流程",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicResourceEditNotAllowedError: {
		description: "当前资源不允许编目",
		cause:       "",
		solution:    "请联系系统维护者",
	},

	PublicResourceDelNotAllowedError: {
		description: "当前资源不允许删除",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicAuditTypeConflict: {
		description: "当前审核类型流程绑定已创建，不可重复创建",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicAccessPermitted: {
		description: "已拥有权限，不可重复申请",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicDuplicatedAccessApply: {
		description: "已申请权限，正在审核中，不可重复申请",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	DataSourceInvalid: {
		description: "数据源无效",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	DataSourceNotFound: {
		description: "数据源不存在",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	BigModelSampleRequestErr: {
		description: "AI样例数据请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	DataSourceRequestErr: {
		description: "数据源请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	VirtualEngineRequestErr: {
		description: "虚拟化引擎数据请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	SqlMaskingRequestErr: {
		description: "Sql脱敏数据请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ConfigCenterTreeOrgRequestErr: {
		description: "配置中心子孙部门数据请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ConfigCenterDepOwnerUsersRequestErr: {
		description: "配置中心查询部门下Owner角色的用户请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	OwnerIDNotInDepartmentErr: {
		description: "数据owner不存在",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	BusinessGroomingOwnerRequestErr: {
		description: "获取数据owner请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ConfigCenterDeptRequestErr: {
		description: "获取部门信息请求失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	CatalogCodeOverConcurrency: {
		description: "资产目录编码超过最大并发数",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	TableOrColumnNotExisted: {
		description: "数据表或数据表对应的字段不存在",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	DownloadNoPermittedErr: {
		description: "当前资源无下载权限或下载有效期已过期",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	DataCatalogNoOwnerErr: {
		description: "当前目录没有数据Owner",
		cause:       "",
		solution:    "请配置数据Owner",
	},
	GetAccessPermissionError: {
		description: "获取访问权限失败",
		cause:       "",
		solution:    "请重试",
	},
	UserNotHavePermission: {
		description: "暂无权限，您可联系系统管理员配置",
		cause:       "",
		solution:    "请重试",
	},
	AccessTypeNotSupport: {
		description: "暂不支持的访问类型",
		cause:       "",
		solution:    "请重试",
	},
	PublicAuditApplyIDParseFailed: {
		description: "审核申请ID无法解析",
		cause:       "",
		solution:    "请重试",
	},
	PublicGetOwnerAuditorsNotAllowed: {
		description: "当前资源不可获取owner审核员",
		cause:       "",
		solution:    "请重试",
	},
	AvailableAssetNotExisted: {
		description: "可用资产不存在",
		cause:       "",
		solution:    "请检查资源是否已被删除或不属于可用资产",
	},
	NoTableMounted: {
		description: "当前资源未挂接数据表",
		cause:       "",
		solution:    "请检查资源有效性",
	},
	FormViewInvalidError: {
		description: "数据表视图无效",
		cause:       "",
		solution:    "请检查数据",
	},
	FormViewResUnmatchedError: {
		description: "数据表视图与元数据表ID不匹配",
		cause:       "",
		solution:    "请检查数据",
	},
	AuthPolicyGetError: {
		description: "权限策略详情获取失败",
		cause:       "",
		solution:    "请重试",
	},
	AuthPolicyEnforceError: {
		description: "策略验证失败",
		cause:       "",
		solution:    "请重试",
	},
	AuthAvailableAssetsError: {
		description: "可用权限的资产获取失败",
		cause:       "",
		solution:    "请重试",
	},
	OwnerIDInvalidErr: {
		description: "owner用户不存在",
		cause:       "",
		solution:    "请重试",
	},
	CatalogFeedbackNotExistedErr: {
		description: "目录反馈不存在",
		cause:       "",
		solution:    "请检查数据",
	},
	CatalogFeedbackLogNotExistedErr: {
		description: "目录反馈操作记录不存在",
		cause:       "",
		solution:    "请检查数据",
	},
	CatalogFeedbackOpNotAllowedErr: {
		description: "目录反馈不允许该操作",
		cause:       "",
		solution:    "请检查目录反馈状态",
	},
	CatalogFeedbackCreateNotAllowedErr: {
		description: "目录反馈创建不允许",
		cause:       "",
		solution:    "请检查目录状态",
	},
	PublicAuditCancelNotAllowedError: {
		description: "当前资源不允许取消审核",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	PublicCatalogScoreRecordAlreadyExist: {
		description: "目录评分记录已存在，不可重复操作",
		cause:       "",
		solution:    "请检查目录评分记录是否存在",
	},
	PublicCatalogScoreRecordNotExisted: {
		description: "目录评分记录不存在，不可操作",
		cause:       "",
		solution:    "请检查目录评分记录是否存在",
	},
	CatalogHasBeenFavoredErr: {
		description: "当前资源已被收藏，不能重复收藏",
		cause:       "",
		solution:    "请检查数据",
	},
	FavoriteNotExistedOrUserNotMatchedErr: {
		description: "当前资源已取消收藏或用户不匹配",
		cause:       "",
		solution:    "请检查数据",
	},
	CatalogNotExisted: {
		description: "当前资源不存在",
		cause:       "",
		solution:    "请检查数据",
	},
	CatalogFavorNotAllowed: {
		description: "当前资源不允许收藏",
		cause:       "",
		solution:    "请检查数据",
	},
	FileMaxUploadError: {
		description: "超过文件最大上传数量（10）",
		solution:    "请检查文件数量",
	},
	SampleDataTypeError: {
		description: "当前资源不允许收藏",
		cause:       "",
		solution:    "请检查数据",
	},
	MyDepartmentNotExistError: {
		description: "不存在本部门或查询失败",
		cause:       "",
		solution:    "请检查",
	},
}

type errorCodeInfo struct {
	description string
	cause       string
	solution    string
}

type errorCode map[string]errorCodeInfo

var errorCodeMap errorCode

func IsErrorCode(err error) bool {
	_, ok := err.(*agerrors.Error)
	return ok
}

func registerErrorCode(errCodes ...errorCode) {
	if errorCodeMap == nil {
		// errorCodeMap init
		errorCodeMap = errorCode{}
	}

	for _, m := range errCodes {
		for k := range m {
			if _, ok := errorCodeMap[k]; ok {
				// error code is not allowed to repeat
				panic(fmt.Sprintf("error code is not allowed to repeat, code: %s", k))
			}

			errorCodeMap[k] = m[k]
		}
	}
}

func init() {
	registerErrorCode(publicErrorMap)
}

func Desc(errCode string, args ...any) error {
	return newCoder(errCode, nil, args...)
}

func Detail(errCode string, err any, args ...any) error {
	return newCoder(errCode, err, args...)
}

// DescReplace 替换description
func DescReplace(errCode string, replaceDesc string) error {
	return newCoderDescReplace(errCode, replaceDesc)
}

func newCoderDescReplace(errCode string, replaceDesc string) error {
	errInfo, ok := errorCodeMap[errCode]
	if !ok {
		errInfo = errorCodeMap[PublicInternalError]
		errCode = PublicInternalError
	}

	coder := agcodes.New(errCode, replaceDesc, errInfo.cause, errInfo.solution, nil, "")
	return agerrors.NewCode(coder)
}

func newCoder(errCode string, err any, args ...any) error {
	errInfo, ok := errorCodeMap[errCode]
	if !ok {
		errInfo = errorCodeMap[PublicInternalError]
		errCode = PublicInternalError
	}

	desc := errInfo.description
	if len(args) > 0 {
		desc = FormatDescription(desc, args...)
	}
	if err == nil {
		err = struct{}{}
	}

	coder := agcodes.New(errCode, desc, errInfo.cause, errInfo.solution, err, "")
	return agerrors.NewCode(coder)
}

// FormatDescription replace the placeholder in coder.Description
// Example:
// Description: call service [service_name] api [api_name] error,
// args:  data-catalog, create
// =>
// Description: call service [data-catalog] api [create] error,
func FormatDescription(s string, args ...interface{}) string {
	if len(args) <= 0 {
		return s
	}
	re, _ := regexp.Compile("\\[\\w+\\]")
	result := re.ReplaceAll([]byte(s), []byte("[%v]"))
	return fmt.Sprintf(string(result), args...)
}
