package http_client

import jsoniter "github.com/json-iterator/go"

// HTTPError 服务错误结构体
type HTTPError struct {
	Cause   string                 `json:"cause"`
	Code    int                    `json:"code"`
	Message string                 `json:"message"`
	Detail  map[string]interface{} `json:"detail,omitempty"`
}

func (err HTTPError) Error() string {
	errstr, _ := jsoniter.Marshal(err)
	return string(errstr)
}

// ExHTTPError 其他服务响应的错误结构体
type ExHTTPError struct {
	Status int
	Body   []byte
}

func (err ExHTTPError) Error() string {
	return string(err.Body)
}
