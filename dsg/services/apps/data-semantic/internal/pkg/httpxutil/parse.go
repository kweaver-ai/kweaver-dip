package httpxutil

import (
	"net/http"

	"github.com/jinguoxing/idrm-go-base/validator"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Parse 解析并验证 HTTP 请求
func Parse(r *http.Request, v interface{}) error {
	if err := httpx.Parse(r, v); err != nil {
		return err
	}
	return validator.Validate(v)
}
