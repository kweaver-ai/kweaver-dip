package impl

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

// ResponseError 定义上游返回的包含错误码的结构化错误
type ResponseError struct {
	Code        string `json:"code,omitempty"`
	Description string `json:"description,omitempty"`
	Cause       string `json:"cause,omitempty"`
	Solution    string `json:"solution,omitempty"`
	Detail      any    `json:"detail,omitempty"`
}

func (e *ResponseError) String() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Description)
}

func (e *ResponseError) Error() string {
	return e.String()
}

// 根据 GoUtils/httpclient.HTTPClient 返回的 error 生成结构化的 error
func newErrorCode(err error) error {
	var defaultErrorCode = errorcode.Detail(errorcode.PublicInternalError, err.Error())

	ee := &httpclient.ExHTTPError{}
	if !errors.As(err, &ee) {
		return defaultErrorCode
	}

	re := &ResponseError{}
	if err := json.Unmarshal(ee.Body, re); err != nil {
		return defaultErrorCode
	}

	if re.Code == "" {
		return defaultErrorCode
	}

	coder := agcodes.New(re.Code, re.Description, re.Cause, re.Solution, re.Detail, "")
	return agerrors.NewCode(coder)
}
