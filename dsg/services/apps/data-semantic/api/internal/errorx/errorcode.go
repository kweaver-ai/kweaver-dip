package errorx

import (
	"fmt"
	"regexp"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

// Model Name
const (
	publicModelName = "Public"
)

var Success = map[string]string{
	"code":        "0",
	"description": "成功",
	"solution":    "",
}

// Public error
const (
	publicPreCoder = publicModelName + "."

	// 通用错误
	PublicInternalError    = publicPreCoder + "InternalError"
	PublicInvalidParameter = publicPreCoder + "InvalidParameter"

	// 认证相关错误（auth.go 使用）
	NotAuthentication      = publicPreCoder + "NotAuthentication"
	HydraException         = publicPreCoder + "HydraException"
	AuthenticationFailure  = publicPreCoder + "AuthenticationFailure"
	GetUserInfoFailure     = publicPreCoder + "GetUserInfoFailure"
)

var publicErrorMap = ErrorCode{
	PublicInternalError: {
		Description: "内部错误",
		Cause:       "",
		Solution:    "",
	},
	PublicInvalidParameter: {
		Description: "参数值校验不通过",
		Cause:       "",
		Solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	NotAuthentication: {
		Description: "无用户登录信息",
		Cause:       "",
		Solution:    "",
	},
	HydraException: {
		Description: "授权服务异常",
		Cause:       "",
		Solution:    "",
	},
	AuthenticationFailure: {
		Description: "用户登录已过期",
		Cause:       "",
		Solution:    "",
	},
	GetUserInfoFailure: {
		Description: "获取用户信息失败",
		Cause:       "",
		Solution:    "",
	},
}

// ========== 数据理解相关错误码 ==========
const (
	dataUnderstandingPreCoder = "DataUnderstanding."

	// 状态校验错误
	InvalidUnderstandStatus = dataUnderstandingPreCoder + "InvalidUnderstandStatus"
	DuplicateName            = dataUnderstandingPreCoder + "DuplicateName"

	// 业务逻辑错误
	AttributeAlreadyBelongToObject = dataUnderstandingPreCoder + "AttributeAlreadyBelongToObject"
	NoDataToCommit                 = dataUnderstandingPreCoder + "NoDataToCommit"
	DataNotBelongToFormView        = dataUnderstandingPreCoder + "DataNotBelongToFormView"

	// 数据操作错误
	QueryFailed  = dataUnderstandingPreCoder + "QueryFailed"
	UpdateFailed = dataUnderstandingPreCoder + "UpdateFailed"
	DeleteFailed = dataUnderstandingPreCoder + "DeleteFailed"
)

var dataUnderstandingErrorMap = ErrorCode{
	InvalidUnderstandStatus: {
		Description: "当前理解状态不允许此操作",
		Cause:       "请检查当前理解状态",
		Solution:    "等待数据处理完成后再操作",
	},
	DuplicateName: {
		Description: "[name_type]名称已存在: [name]",
		Cause:       "名称冲突",
		Solution:    "请使用不同的名称",
	},
	AttributeAlreadyBelongToObject: {
		Description: "属性已归属到该业务对象，无需移动",
		Cause:       "属性当前已归属于目标业务对象",
		Solution:    "无需重复移动操作",
	},
	NoDataToCommit: {
		Description: "没有可提交的数据",
		Cause:       "版本号为0，未生成任何理解数据",
		Solution:    "请先执行理解操作生成数据后再提交",
	},
	DataNotBelongToFormView: {
		Description: "[data_type]不属于当前库表视图",
		Cause:       "数据与当前库表视图不匹配",
		Solution:    "请检查数据ID是否正确",
	},
	QueryFailed: {
		Description: "查询[operation]失败",
		Cause:       "数据库查询异常",
		Solution:    "请检查数据库状态和数据",
	},
	UpdateFailed: {
		Description: "更新[operation]失败",
		Cause:       "数据库更新异常",
		Solution:    "请检查数据格式和数据库状态",
	},
	DeleteFailed: {
		Description: "删除[operation]失败",
		Cause:       "数据库删除异常",
		Solution:    "请检查数据库状态",
	},
}

type ErrorCodeFullInfo struct {
	Code        string      `json:"code"`
	Description string      `json:"description"`
	Cause       string      `json:"cause"`
	Solution    string      `json:"solution"`
	Detail      interface{} `json:"detail,omitempty"`
}

type ErrorCodeInfo struct {
	Description string
	Cause       string
	Solution    string
}

type ErrorCode map[string]ErrorCodeInfo

var errorCodeMap ErrorCode

func IsErrorCode(err error) bool {
	_, ok := err.(*agerrors.Error)
	return ok
}

func RegisterErrorCode(errCodes ...ErrorCode) {
	if errorCodeMap == nil {
		// errorCodeMap init
		errorCodeMap = ErrorCode{}
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
	RegisterErrorCode(publicErrorMap, dataUnderstandingErrorMap)
}

func Desc(errCode string, args ...any) error {
	return newCoder(errCode, nil, args...)
}
func WithDetail(errCode string, detail map[string]any) error {
	return newCoder(errCode, detail)
}
func Detail(errCode string, err any, args ...any) error {
	return newCoder(errCode, err, args...)
}

func New(errorCode, description, cause, solution string, detail interface{}, errLink string) error {
	coder := agcodes.New(errorCode, description, cause, solution, detail, errLink)
	return agerrors.NewCode(coder)
}

// ManualNew 手动new一个错误
func ManualNew(errCode string, err ErrorCodeInfo) error {
	coder := agcodes.New(errCode, err.Description, err.Cause, err.Solution, err, "")
	return agerrors.NewCode(coder)
}

func newCoder(errCode string, err any, args ...any) error {
	errInfo, ok := errorCodeMap[errCode]
	if !ok {
		errInfo = errorCodeMap[PublicInternalError]
		errCode = PublicInternalError
	}

	desc := errInfo.Description
	if len(args) > 0 {
		desc = FormatDescription(desc, args...)
	}
	if err == nil {
		err = struct{}{}
	}

	coder := agcodes.New(errCode, desc, errInfo.Cause, errInfo.Solution, err, "")
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
