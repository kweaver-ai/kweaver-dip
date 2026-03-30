package errorcode

import (
	"fmt"
	"regexp"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

// Model Name
const (
	publicModelName = "Public"

	flowchartModelName          = "Flowchart"
	nodeConfigModelName         = "NodeConfig"
	businessStructureModelName  = "BusinessStructure"
	roleModelName               = "Role"
	toolModelName               = "Tool"
	UserName                    = "User"
	codeGenerationRuleModelName = "CodeGenerationRule"
	permissionModelName         = "Permission"
	roleGroupModelName          = "RoleGroup"
)

// Public error
const (
	publicPreCoder = constant.ServiceName + "." + publicModelName + "."
	modelName      = "Model"
	modelPreCoder  = constant.ServiceName + "." + modelName + "."

	formModelName = "Form"
	formPreCoder  = constant.ServiceName + "." + formModelName + "."

	PublicInternalError         = publicPreCoder + "InternalError"
	PublicInvalidParameter      = publicPreCoder + "InvalidParameter"
	PublicInvalidParameterJson  = publicPreCoder + "InvalidParameterJson"
	PublicDatabaseError         = publicPreCoder + "DatabaseError"
	PublicRequestParameterError = publicPreCoder + "RequestParameterError"
	PublicUniqueIDError         = publicPreCoder + "PublicUniqueIDError"
	PublicRecordNotExist        = publicPreCoder + "RecordNotExist"
	treeNodeModelName           = "TreeNode"
	treeModelName               = "Tree"
	gradeLabel                  = "GradeLabel"

	PublicRequestParameterUniqueError = publicPreCoder + "InvalidParameterUnique"

	FirmNotExistedError            = publicPreCoder + "FirmNotExistedError"
	FirmNameOrUniCodeConflictError = publicPreCoder + "FirmNameOrUniCodeConflictError"
	FirmContentNotMatchToTemplate  = publicPreCoder + "FirmContentNotMatchToTemplate"

	ModelTemplatesNotExist = modelPreCoder + "ModelTemplatesNotExist"
	PlatformNotExist       = publicPreCoder + "PlatformNotExist"
	GetSessionError        = publicPreCoder + "GetSessionError"
	GetMenuNotOpen         = publicPreCoder + "GetMenuNotOpen"

	AddressBookNotExistedError      = publicPreCoder + "AddressBookNotExistedError"
	AlarmRuleNotExistedError        = publicPreCoder + "AlarmRuleNotExistedError"
	AlarmRuleModifyMessageSendError = publicPreCoder + "AlarmRuleModifyMessageSendError"

	ParentDepartmentParameterError      = publicPreCoder + "RequestParentDepartmentParameterError"
	AppropriateDepartmentParameterError = publicPreCoder + "RequestAppropriateDepartmentParameterError"
)

var publicErrorMap = errorCode{
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
	PublicRequestParameterUniqueError: {
		description: "请求参数格式错误，同一类型下值不能重复",
		cause:       "输入请求参数格式或内容有问题，同一类型下值不能重复",
		solution:    "请输入正确格式的请求参数",
	},
	PublicUniqueIDError: {
		description: "ID生成失败",
		cause:       "",
		solution:    "",
	},
	PublicRecordNotExist: {
		description: "ID记录不存在",
		cause:       "",
		solution:    "",
	},
	PlatformNotExist: {
		description: "平台不存在",
		cause:       "",
		solution:    "",
	},
	GetSessionError: {
		description: "获取session失败",
		cause:       "",
		solution:    "",
	},
	FirmNotExistedError: {
		description: "厂商不存在",
		cause:       "",
		solution:    "请确认",
	},
	FirmNameOrUniCodeConflictError: {
		description: "厂商名称或统一社会信用代码重复",
		cause:       "",
		solution:    "请确认",
	},
	FirmContentNotMatchToTemplate: {
		description: "厂商导入文件内容与模板不符",
		cause:       "",
		solution:    "请确认",
	},
	ModelTemplatesNotExist: {
		description: "模板名称不存在",
		cause:       "",
		solution:    "重新输入模板名称",
	},
	GetMenuNotOpen: {
		description: "获取平台菜单未打开",
		cause:       "",
		solution:    "重新登录",
	},
	AddressBookNotExistedError: {
		description: "人员信息不存在",
		cause:       "",
		solution:    "请确认",
	},
	AlarmRuleNotExistedError: {
		description: "告警规则不存在",
		cause:       "",
		solution:    "请确认",
	},
	AlarmRuleModifyMessageSendError: {
		description: "修改告警规则消息发送失败",
		solution:    "请重试",
	},
	ParentDepartmentParameterError: {
		description: "请先设置上级部门类型后再设置当前部门类型",
		cause:       "",
		solution:    "The parent's department type must be set first",
	},
	AppropriateDepartmentParameterError: {
		description: "请选择正确的部门类型",
		cause:       "",
		solution:    "Please fill in the appropriate type",
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

// Custom 自定义描述信息
func Custom(errCode string, msg string, detail ...string) error {
	errInfo, ok := errorCodeMap[errCode]
	if !ok {
		errInfo = errorCodeMap[PublicInternalError]
		errCode = PublicInternalError
	}

	coder := agcodes.New(errCode, msg, errInfo.cause, errInfo.solution, detail, "")
	return agerrors.NewCode(coder)
}

func Desc(errCode string, args ...any) error {
	return newCoder(errCode, nil, args...)
}

func Detail(errCode string, err any, args ...any) error {
	return newCoder(errCode, err, args...)
}

/*
func WithDetail(errCode string, args ...any) error {
	param := make([]any, len(args))
	for i, arg := range args {
		param[i] = arg
	}
	detail := make([]map[string]any, 1)
	detail[0] = map[string]any{"description": param}
	return newCoder(errCode, detail, args...)
}*/

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
// args:  configuration-center, create
// =>
// Description: call service [configuration-center] api [create] error,
func FormatDescription(s string, args ...interface{}) string {
	if len(args) <= 0 {
		return s
	}
	re, _ := regexp.Compile("\\[\\w+\\]")
	result := re.ReplaceAll([]byte(s), []byte("[%v]"))
	return fmt.Sprintf(string(result), args...)
}

type ErrorCodeFullInfo struct {
	Cause   string `json:"cause"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}
