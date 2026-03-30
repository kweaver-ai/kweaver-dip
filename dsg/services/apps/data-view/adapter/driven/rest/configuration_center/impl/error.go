package impl

import (
	"errors"
	"fmt"

	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

type ResponseError struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Solution    string `json:"solution"`
	Cause       string `json:"cause"`
	Detail      any    `json:"detail,omitempty"`
}

func (e *ResponseError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Description)
}

func (e *ResponseError) Is(target error) bool {
	if target == nil {
		return false
	}

	ee := &ResponseError{}
	return errors.As(target, &ee)
}

// WrapError 将非结构化的 error 转为指定错误码的结构化 error
func WrapError(code string, err error) error {
	if err == nil {
		return nil
	}

	if re := new(ResponseError); errors.As(err, &re) {

		if re.Code == "ConfigurationCenter.CodeGenerationRule.ExceedEnding" {
			return errorcode.Desc(my_errorcode.NewFormViewEncodingExceedEncodingMaximum)
		}

		return errorcode.New(re.Code, re.Description, re.Cause, re.Solution, re.Detail, "")
	}

	return errorcode.Detail(code, err.Error())
}
