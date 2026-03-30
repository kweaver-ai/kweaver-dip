package errorcode

import (
	"errors"
	"fmt"
	"regexp"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

const (
	// Model Name
	projectPreCoder      = common.ServiceName + ".Project."
	ossPreCoder          = common.ServiceName + ".OSS."
	operationLogPreCoder = common.ServiceName + ".OperationLog."

	taskModelName = "Task"
	taskPreCoder  = common.ServiceName + "." + taskModelName + "."

	commonModelName = "Common"
	commonPreCoder  = common.ServiceName + "." + commonModelName + "."

	userModelName = "User"
	userPreCoder  = common.ServiceName + "." + userModelName + "."

	loginName     = "Login"
	loginPreCoder = common.ServiceName + "." + loginName + "."

	relationDataPreCoder = common.ServiceName + ".RelationData."
	drivenName           = "Driven"
	drivenPreCoder       = common.ServiceName + "." + drivenName + "."

	PlanName     = "Plan"
	planPreCoder = common.ServiceName + "." + PlanName + "."

	WorkOrderName     = "WorkOrder"
	workOrderPreCoder = common.ServiceName + "." + WorkOrderName + "."

	ReportName     = "Report"
	reportPreCoder = common.ServiceName + "." + ReportName + "."

	PointsName     = "Points_management"
	pointsPreCoder = common.ServiceName + "." + PointsName + "."

	FusionModelName     = "FusionModel"
	FusionModelPreCoder = common.ServiceName + "." + FusionModelName + "."

	QualityAuditModelName     = "QualityAuditModel"
	QualityAuditModelPreCoder = common.ServiceName + "." + QualityAuditModelName + "."

	SandboxPreCoder = common.ServiceName + ".SandboxManagement."

	TenantApplicationName     = "TenantApplication"
	TenantApplicationPreCoder = common.ServiceName + "." + TenantApplicationName + "."
)

const (
	// Public error
	InternalError             = common.ServiceName + "." + "InternalError"
	MissingUserToken          = commonPreCoder + "MissingUserToken"
	InvalidUserToken          = commonPreCoder + "InvalidUserToken"
	InvalidUser               = commonPreCoder + "InvalidUser"
	PublicServiceError        = commonPreCoder + "ServiceError"
	PublicResourceNotFound    = commonPreCoder + "ResourceNotFound"
	PublicParseDataError      = commonPreCoder + "ParseDataError"
	PublicCallParametersError = commonPreCoder + "CallParametersError"
	PublicDatabaseError       = commonPreCoder + "DatabaseError"
	PublicInvalidParameter    = commonPreCoder + "PublicInvalidParameter"
	// 默认模板不能删除
	DeleteBuiltinTemplate = commonPreCoder + "DeleteBuiltinTemplate"
	// 默认模板不能停用
	DisableBuiltinTemplate = commonPreCoder + "DisableBuiltinTemplate"
	// 模板名称已经存在
	TemplateNameExisted = commonPreCoder + "TemplateNameExisted"
)

var publicErrorMap = errorCode{
	InternalError: {
		description: "internal error",
		cause:       "",
		solution:    "please contact developer",
	},
	MissingUserToken: {
		description: "用户token必填",
		cause:       "",
		solution:    ContactDeveloper,
	},
	InvalidUserToken: {
		description: "用户token非法",
		cause:       "",
		solution:    CheckInputData,
	},
	InvalidUser: {
		description: "该用户不存在",
		cause:       "",
		solution:    CheckInputData,
	},
	PublicServiceError: {
		description: "调用服务异常，或url地址有误",
		solution:    "请检查服务，检查ip和端口后重试",
	},
	PublicResourceNotFound: {
		description: "获取资源，不存在",
		solution:    "请检查输入参数",
	},
	PublicParseDataError: {
		description: "获取资源，解析数据错误或返回数据错误",
		solution:    "请检查输入参数",
	},
	PublicCallParametersError: {
		description: "获取资源, 参数错误",
		solution:    "请检查输入参数",
	},
	PublicDatabaseError: {
		description: "数据库异常",
		cause:       "",
		solution:    "请检查数据库状态",
	},
	PublicInvalidParameter: {
		description: "参数值校验不通过",
		solution:    SeeAPIManual,
	},
	DeleteBuiltinTemplate: {
		description: "默认模板不能删除",
		solution:    "请勿删除默认模板",
	},
	DisableBuiltinTemplate: {
		description: "默认模板不能停用",
		solution:    "请勿停用默认模板",
	},
	TemplateNameExisted: {
		description: "模板名称已经存在",
		solution:    "请勿重复创建模板",
	},
}

type ErrorCodeBody struct {
	Code        string      `json:"code"`
	Description string      `json:"description"`
	Cause       string      `json:"cause"`
	Solution    string      `json:"solution"`
	Detail      interface{} `json:"detail,omitempty"`
}

type errorCodeInfo struct {
	description string
	cause       string
	solution    string
}

type errorCode map[string]errorCodeInfo

var errorCodeMap errorCode

func init() {

	maps := []errorCode{
		publicErrorMap,
		projectErrorMap,
		taskErrorMap,
		ossErrorMap,
		operationLogErrorMap,
		UserMap,
		loginErrorMap,
		relationDataErrorMap,
		DrivenErrorMap,
		planErrorMap,
		workOrderErrorMap,
		reportErrorMap,
		pointsErrorMap,
		FusionModelErrorMap,
		QualityAuditModelErrorMap,
		tenantApplicationErrorMap,
	}

	errorCodeMap = errorCode{}
	for _, m := range maps {
		for k, v := range m {
			errorCodeMap[k] = v
		}
	}
}

func IsErrorCode(err error) bool {
	_, ok := err.(*agerrors.Error)
	return ok
}

func Desc(errCode string, args ...any) error {
	return newCoder(errCode, nil, args...)
}

func Detail(errCode string, err any, args ...any) error {
	return newCoder(errCode, err, args...)
}
func WithDetail(errCode string, detail map[string]any) error {
	return newCoder(errCode, detail)
}
func WithDetailKV(errCode string, args map[string]any) error {
	detail := make([]map[string]any, 0)
	for k, v := range args {
		detail = append(detail, map[string]any{"key": k, "message": v})
	}
	if len(args) == 0 {
		detail = nil
	}
	return newCoder(errCode, detail)
}
func New(errorCode, description, cause, solution string, detail interface{}, errLink string) error {
	coder := agcodes.New(errorCode, description, cause, solution, detail, errLink)
	return agerrors.NewCode(coder)
}
func newCoder(errCode string, err any, args ...any) error {
	errInfo, ok := errorCodeMap[errCode]
	if !ok {
		errInfo = errorCodeMap[InternalError]
		errCode = InternalError
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
// args:  task_center, create
// =>
// Description: call service [task_center] api [create] error,
func FormatDescription(s string, args ...interface{}) string {
	if len(args) <= 0 {
		return s
	}
	re, _ := regexp.Compile("\\[\\w+\\]")
	result := re.ReplaceAll([]byte(s), []byte("[%v]"))
	return fmt.Sprintf(string(result), args...)
}

func NewPublicDatabaseError(err error) error {
	return newCoder(PublicDatabaseError, err.Error())
}

func WrapNotfoundError(err error) error {
	if err == nil {
		return err
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return PublicResourceNotFoundError.Detail(err.Error())
	}
	return PublicDatabaseErr.Detail(err.Error())
}
