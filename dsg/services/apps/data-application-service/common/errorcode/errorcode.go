package errorcode

import (
	"fmt"
	"regexp"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

// Model Name
const (
	publicModelName = "Public"

	demoModelName = "Demo"
)

var Success = map[string]string{
	"code":        "0",
	"description": "成功",
	"solution":    "",
}

// Public error
const (
	publicPreCoder = constant.ServiceName + "." + publicModelName + "."

	PublicInternalError         = publicPreCoder + "InternalError"
	PublicInvalidParameter      = publicPreCoder + "InvalidParameter"
	PublicInvalidParameterJson  = publicPreCoder + "InvalidParameterJson"
	PublicDatabaseError         = publicPreCoder + "DatabaseError"
	PublicRequestParameterError = publicPreCoder + "RequestParameterError"
	PublishDataError            = publicPreCoder + "PublishDataError"
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
	PublishDataError: {
		description: "数据库数据发生错误",
		cause:       "可能存在脏数据",
		solution:    "请检查数据后重试",
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
// args:  data-application-service, create
// =>
// Description: call service [data-application-service] api [create] error,
func FormatDescription(s string, args ...interface{}) string {
	if len(args) <= 0 {
		return s
	}
	re, _ := regexp.Compile("\\[\\w+\\]")
	result := re.ReplaceAll([]byte(s), []byte("[%v]"))
	return fmt.Sprintf(string(result), args...)
}
