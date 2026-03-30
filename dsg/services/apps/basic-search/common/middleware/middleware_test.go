package middleware

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/agiledragon/gomonkey/v2"
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/hydra"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/user_management"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models/request"
	"github.com/stretchr/testify/assert"
)

var (
	h     = hydra.NewHydra(nil)
	m     = NewMiddleware(h)
	token = "Bearer token"
	err   = errors.New("error")
)

func TestNewMiddleware(t *testing.T) {
	m := NewMiddleware(nil)
	assert.NotEmptyf(t, m, "middleware.v1.NewMiddleware failed")
}

func TestAuth(t *testing.T) {
	engine := gin.Default()
	engine.Use(m.Auth())
	engine.GET("/basic-search", func(ctx *gin.Context) { ctx.JSON(http.StatusOK, nil) })
	patch := gomonkey.ApplyMethodSeq(reflect.TypeOf(h), "Introspect",
		[]gomonkey.OutputCell{
			{Values: gomonkey.Params{nil, err}},
			{Values: gomonkey.Params{&hydra.TokenIntrospectInfo{Active: false}, nil}},
			{Values: gomonkey.Params{&hydra.TokenIntrospectInfo{Active: true, VisitorID: ""}, nil}, Times: 2},
		})
	patch = patch.ApplyFuncSeq(user_management.GetUserInfoByUserID,
		[]gomonkey.OutputCell{
			{Values: gomonkey.Params{nil, false, err}},
			{Values: gomonkey.Params{&request.UserInfo{Uid: "", UserName: ""}, false, nil}},
		})
	defer patch.Reset()
	req := httptest.NewRequest(http.MethodGet, "http://localhost/basic-search", http.NoBody)
	req.Header.Add("Authorization", token)
	resp := httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusUnauthorized, resp.Result().StatusCode, "middleware.v1.Auth1 failed")
	resp = httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusUnauthorized, resp.Result().StatusCode, "middleware.v1.Auth2 failed")
	resp = httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusBadRequest, resp.Result().StatusCode, "middleware.v1.Auth3 failed")
	resp = httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusOK, resp.Result().StatusCode, "middleware.v1.Auth4 failed")
}

func TestAbortResponse(t *testing.T) {
	engine := gin.Default()
	engine.POST("/basic-search/:id", func() func(ctx *gin.Context) {
		return func(ctx *gin.Context) {

			AbortResponse(ctx, err)
			ctx.JSON(http.StatusOK, nil)
		}
	}())
	patch := gomonkey.ApplyMethodSeq(reflect.TypeOf(h), "Introspect",
		[]gomonkey.OutputCell{
			{Values: gomonkey.Params{nil, err}},
			{Values: gomonkey.Params{&hydra.TokenIntrospectInfo{Active: false}, nil}},
			{Values: gomonkey.Params{&hydra.TokenIntrospectInfo{Active: true, VisitorID: ""}, nil}, Times: 2},
		})
	patch = patch.ApplyFuncSeq(user_management.GetUserInfoByUserID,
		[]gomonkey.OutputCell{
			{Values: gomonkey.Params{nil, false, err}},
			{Values: gomonkey.Params{&request.UserInfo{Uid: "", UserName: ""}, false, nil}},
		})
	defer patch.Reset()
	req := httptest.NewRequest(http.MethodGet, "http://localhost/basic-search", http.NoBody)
	req.Header.Add("Authorization", token)
	resp := httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusUnauthorized, resp.Result().StatusCode, "middleware.v1.Auth1 failed")
	resp = httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusUnauthorized, resp.Result().StatusCode, "middleware.v1.Auth2 failed")
	resp = httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusBadRequest, resp.Result().StatusCode, "middleware.v1.Auth3 failed")
	resp = httptest.NewRecorder()
	engine.ServeHTTP(resp, req)
	assert.Equalf(t, http.StatusOK, resp.Result().StatusCode, "middleware.v1.Auth4 failed")
}

func TestGetUserInfoByUserID(t *testing.T) {

}
