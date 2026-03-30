package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestResponseWrapperWithError 测试 ResponseWrapper 对错误响应的处理
func TestResponseWrapperWithError(t *testing.T) {
	wrapper := ResponseWrapper()

	errorHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("查询[库表视图]失败"))
	}

	wrappedHandler := wrapper(errorHandler)
	req := httptest.NewRequest("GET", "/test", nil)
	recorder := httptest.NewRecorder()

	wrappedHandler(recorder, req)

	resp := recorder.Result()
	defer resp.Body.Close()

	var httpErr HttpError
	if err := json.NewDecoder(resp.Body).Decode(&httpErr); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if httpErr.Code == "" {
		t.Error("Expected non-empty error code")
	}
	if httpErr.Description != "查询[库表视图]失败" {
		t.Errorf("Expected description '查询[库表视图]失败', got '%s'", httpErr.Description)
	}

	t.Logf("✓ Error response correctly formatted: code=%s, description=%s",
		httpErr.Code, httpErr.Description)
}

// TestResponseWrapperWithSuccess 测试 ResponseWrapper 对成功响应的处理
func TestResponseWrapperWithSuccess(t *testing.T) {
	wrapper := ResponseWrapper()

	successHandler := func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"message":"hello"}`))
	}

	wrappedHandler := wrapper(successHandler)
	req := httptest.NewRequest("GET", "/test", nil)
	recorder := httptest.NewRecorder()

	wrappedHandler(recorder, req)

	resp := recorder.Result()
	defer resp.Body.Close()

	var result map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if result["code"] != "" {
		t.Errorf("Expected empty code for success, got %v", result["code"])
	}
	if result["message"] != "success" {
		t.Errorf("Expected message 'success', got %v", result["message"])
	}

	t.Logf("✓ Success response correctly wrapped: %+v", result)
}

// TestResponseWrapperWithPlainTextSuccess 测试纯文本成功响应（如 health check）
func TestResponseWrapperWithPlainTextSuccess(t *testing.T) {
	wrapper := ResponseWrapper()

	successHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}

	wrappedHandler := wrapper(successHandler)
	req := httptest.NewRequest("GET", "/health", nil)
	recorder := httptest.NewRecorder()

	wrappedHandler(recorder, req)

	resp := recorder.Result()
	defer resp.Body.Close()

	body := make([]byte, 1024)
	n, _ := resp.Body.Read(body)

	if string(body[:n]) != "OK" {
		t.Errorf("Expected plain text 'OK', got %s", string(body[:n]))
	}

	t.Logf("✓ Plain text success response passed through: %s", string(body[:n]))
}
