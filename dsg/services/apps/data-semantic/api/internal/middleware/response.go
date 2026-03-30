package middleware

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

// HttpError 错误响应
type HttpError struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Solution    string `json:"solution,omitempty"`
	Cause       string `json:"cause,omitempty"`
	Detail      any    `json:"detail,omitempty"`
}

type Response struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

type responseWrapper struct {
	http.ResponseWriter
	statusCode int
	body       *bytes.Buffer
}

func (w *responseWrapper) WriteHeader(code int) {
	w.statusCode = code
}

func (w *responseWrapper) Write(data []byte) (int, error) {
	return w.body.Write(data)
}

// ResponseWrapper 统一响应格式中间件
func ResponseWrapper() func(next http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			wrapper := &responseWrapper{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
				body:           bytes.NewBuffer(nil),
			}

			next(wrapper, r)

			body := wrapper.body.Bytes()
			if len(body) == 0 {
				return
			}

			// 尝试解析为 JSON
			var data map[string]any
			if err := json.Unmarshal(body, &data); err != nil {
				handleNonJSONResponse(wrapper, body)
				return
			}

			handleJSONResponse(wrapper, body, data)
		}
	}
}

// handleNonJSONResponse 处理非 JSON 响应
func handleNonJSONResponse(wrapper *responseWrapper, body []byte) {
	if wrapper.statusCode >= 400 {
		// 错误响应：转换为 HttpError 格式
		bodyStr := strings.TrimSpace(string(body))
		writeJSON(wrapper.ResponseWriter, wrapper.statusCode, HttpError{
			Code:        "Public.InternalError",
			Description: bodyStr,
		})
	} else {
		// 成功响应：直接透传（如 health check）
		wrapper.ResponseWriter.Write(body)
	}
}

// handleJSONResponse 处理 JSON 响应
func handleJSONResponse(wrapper *responseWrapper, body []byte, data map[string]any) {
	code, hasCode := data["code"].(string)
	_, hasDesc := data["description"]
	_, hasMessage := data["message"]

	// 判断是否为错误响应
	if hasCode && code != "" && (hasDesc || hasMessage) {
		// 已是 HttpError 格式或需要转换格式
		if !hasDesc && hasMessage {
			// go-zero 格式 → HttpError 格式
			writeJSON(wrapper.ResponseWriter, wrapper.statusCode, HttpError{
				Code:        code,
				Description: data["message"].(string),
				Detail:      data["detail"],
			})
		} else {
			// 已是 HttpError 格式，直接写入
			if wrapper.statusCode != 0 && wrapper.statusCode != http.StatusOK {
				wrapper.ResponseWriter.WriteHeader(wrapper.statusCode)
			}
			wrapper.ResponseWriter.Header().Set("Content-Type", "application/json")
			wrapper.ResponseWriter.Write(body)
		}
		return
	}

	// 成功响应：包装为标准格式
	writeJSON(wrapper.ResponseWriter, http.StatusOK, Response{
		Code:    "",
		Message: "success",
		Data:    data,
	})
}

// writeJSON 写入 JSON 响应
func writeJSON(w http.ResponseWriter, statusCode int, v any) {
	if statusCode != 0 && statusCode != http.StatusOK {
		w.WriteHeader(statusCode)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

// AbortResponseWithCode 中止请求并返回错误
func AbortResponseWithCode(w http.ResponseWriter, code int, err error) {
	if wrapper, ok := w.(*responseWrapper); ok {
		wrapper.statusCode = code
		jsonData, _ := json.Marshal(buildHttpError(err))
		wrapper.body.Write(jsonData)
		return
	}

	writeJSON(w, code, buildHttpError(err))
}

// AbortResponse 中止请求（默认 400 状态码）
func AbortResponse(w http.ResponseWriter, err error) {
	AbortResponseWithCode(w, http.StatusBadRequest, err)
}

// RespondWithError 统一错误响应（供 Logic 层使用）
func RespondWithError(w http.ResponseWriter, err error) {
	if wrapper, ok := w.(*responseWrapper); ok {
		jsonData, _ := json.Marshal(buildHttpError(err))
		wrapper.body.Write(jsonData)
		return
	}

	writeJSON(w, http.StatusOK, buildHttpError(err))
}

// RespondWithSuccess 统一成功响应（供 Logic 层使用）
func RespondWithSuccess(w http.ResponseWriter, data any) {
	if wrapper, ok := w.(*responseWrapper); ok {
		jsonData, _ := json.Marshal(Response{
			Code:    "",
			Message: "success",
			Data:    data,
		})
		wrapper.body.Write(jsonData)
		return
	}

	writeJSON(w, http.StatusOK, Response{
		Code:    "",
		Message: "success",
		Data:    data,
	})
}

// buildHttpError 构建错误响应
func buildHttpError(err error) HttpError {
	var code agcodes.Coder
	if err == nil {
		code = agcodes.CodeNotAuthorized
	} else {
		code = agerrors.Code(err)
	}
	return HttpError{
		Code:        code.GetErrorCode(),
		Description: code.GetDescription(),
		Solution:    code.GetSolution(),
		Cause:       code.GetCause(),
		Detail:      code.GetErrorDetails(),
	}
}
