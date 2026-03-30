package errorcode

import (
	"fmt"
	"regexp"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

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
	registerErrorCode(publicErrorMap, explorationErrorMap)
}

func Desc(errCode string, args ...any) error {
	return newCoder(errCode, nil, args...)
}

func Detail(errCode string, err any, args ...any) error {
	return newCoder(errCode, err, args...)
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
// args:  data-exploration-service, create
// =>
// Description: call service [data-exploration-service] api [create] error,
func FormatDescription(s string, args ...interface{}) string {
	if len(args) <= 0 {
		return s
	}
	re, _ := regexp.Compile("\\[\\w+\\]")
	result := re.ReplaceAll([]byte(s), []byte("[%v]"))
	return fmt.Sprintf(string(result), args...)
}

type ErrorCodeBody struct {
	Code        string      `json:"code"`
	Description string      `json:"description"`
	Solution    string      `json:"solution"`
	Detail      interface{} `json:"detail"`
}
