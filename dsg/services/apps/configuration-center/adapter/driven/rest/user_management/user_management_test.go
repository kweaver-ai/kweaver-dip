package user_management

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"testing"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

func TestMain(m *testing.M) {
	// Initialize the logger, otherwise logging will panic.
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})

	m.Run()
}

// fakeHTTPClient 用于模拟 httpclient.HTTPClient。
type fakeHTTPClient struct {
	CalledURL string

	Response *http.Response
	Err      error
}

// newFakeHTTPClient 返回一个 fakeHTTPClient
func newFakeHTTPClient(code int, body string, err error) *fakeHTTPClient {
	if err != nil {
		return &fakeHTTPClient{Err: err}
	}
	return &fakeHTTPClient{
		Response: &http.Response{
			Status:     http.StatusText(code),
			StatusCode: code,
			Body:       io.NopCloser(bytes.NewBufferString(body)),
		},
	}
}

// Delete implements httpclient.HTTPClient.
func (f *fakeHTTPClient) Delete(ctx context.Context, url string, headers map[string]string) (respParam interface{}, err error) {
	panic("unimplemented")
}

// Get implements httpclient.HTTPClient.
func (f *fakeHTTPClient) Get(ctx context.Context, url string, headers map[string]string) (respParam interface{}, err error) {
	f.CalledURL = url

	if f.Err != nil {
		return nil, f.Err
	}

	if f.Response.StatusCode < http.StatusOK || http.StatusMultipleChoices < f.Response.StatusCode {
		body, err := io.ReadAll(f.Response.Body)
		if err != nil {
			panic(err)
		}

		// 这部分与 httpclient.HTTPClient 处理错误的方式一致。因为处理过程未独立
		// 成一个函数，所以在此重新实现一遍。
		httpErr := httpclient.HTTPError{}
		if err = jsoniter.Unmarshal(body, &httpErr); err != nil {
			// Unmarshal失败时转成内部错误, body为空Unmarshal失败
			return nil, fmt.Errorf("code:%v,header:%v,body:%v", f.Response.StatusCode, f.Response.Header, string(body))
		}

		return nil, httpclient.ExHTTPError{
			Body:   body,
			Status: f.Response.StatusCode,
		}
	}

	if err := json.NewDecoder(f.Response.Body).Decode(&respParam); err != nil {
		panic(err)
	}
	return
}

// Post implements httpclient.HTTPClient.
func (f *fakeHTTPClient) Post(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error) {
	panic("unimplemented")
}

// Put implements httpclient.HTTPClient.
func (f *fakeHTTPClient) Put(ctx context.Context, url string, headers map[string]string, reqParam interface{}) (respCode int, respParam interface{}, err error) {
	panic("unimplemented")
}

var _ httpclient.HTTPClient = &fakeHTTPClient{}

func Test_usermgntSvc_GetUserInfos(t *testing.T) {
	type args struct {
		userIDs []string
		fields  []UserInfoField
	}
	type response struct {
		code   int
		header http.Header
		body   string
		err    error
	}
	tests := []struct {
		name string

		baseURL string

		args     args
		response response

		want      []UserInfoV2
		assertErr assert.ErrorAssertionFunc
	}{
		{
			name:    "get 1 user 1 field",
			baseURL: "http://user-management.example.com",
			args: args{
				userIDs: []string{"8455927c-1197-11ef-b3c3-7ab5ba133de2"},
				fields:  []UserInfoField{UserInfoFieldName},
			},
			response: response{
				code: http.StatusOK,
				body: `[{"name":"Remilia Scarlet","id":"8455927c-1197-11ef-b3c3-7ab5ba133de2"}]`,
			},
			want:      []UserInfoV2{{ID: "8455927c-1197-11ef-b3c3-7ab5ba133de2", Name: "Remilia Scarlet"}},
			assertErr: assert.NoError,
		},
		{
			name:    "get 1 user 2 fields",
			baseURL: "http://user-management.example.com",
			args: args{
				userIDs: []string{"8455927c-1197-11ef-b3c3-7ab5ba133de2"},
				fields:  []UserInfoField{UserInfoFieldName, UserInfoFieldParentDeps},
			},
			response: response{
				code: http.StatusOK,
				body: `[{"name":"Remilia Scarlet","parent_deps":[[{"id":"076cf984-020c-11ef-bdb6-7ab5ba133de2","name":"AF研发线","type":"department"},{"id":"0dc4af48-020c-11ef-bdb6-7ab5ba133de2","name":"数据资源运营研发部","type":"department"},{"id":"78d39772-0d01-11ef-bdb6-7ab5ba133de2","name":"数据资源管理开发组","type":"department"}]],"id":"8455927c-1197-11ef-b3c3-7ab5ba133de2"}]`,
			},
			want: []UserInfoV2{
				{
					ID:   "8455927c-1197-11ef-b3c3-7ab5ba133de2",
					Name: "Remilia Scarlet",
					ParentDeps: []DepartmentPath{
						{
							{
								ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
								Name: "AF研发线",
								Type: "department",
							},
							{
								ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源运营研发部",
								Type: "department",
							},
							{
								ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源管理开发组",
								Type: "department",
							},
						},
					},
				},
			},
			assertErr: assert.NoError,
		},
		{
			name:    "get 2 users 2 fields",
			baseURL: "http://user-management.example.com",
			args: args{
				userIDs: []string{"8455927c-1197-11ef-b3c3-7ab5ba133de2"},
				fields:  []UserInfoField{UserInfoFieldName, UserInfoFieldParentDeps},
			},
			response: response{
				code: http.StatusOK,
				body: `[{"id":"8455927c-1197-11ef-b3c3-7ab5ba133de2","name":"Remilia Scarlet","parent_deps":[[{"id":"076cf984-020c-11ef-bdb6-7ab5ba133de2","name":"AF研发线","type":"department"},{"id":"0dc4af48-020c-11ef-bdb6-7ab5ba133de2","name":"数据资源运营研发部","type":"department"},{"id":"78d39772-0d01-11ef-bdb6-7ab5ba133de2","name":"数据资源管理开发组","type":"department"}]]},{"parent_deps":[[{"id":"076cf984-020c-11ef-bdb6-7ab5ba133de2","name":"AF研发线","type":"department"},{"id":"0dc4af48-020c-11ef-bdb6-7ab5ba133de2","name":"数据资源运营研发部","type":"department"},{"id":"78d39772-0d01-11ef-bdb6-7ab5ba133de2","name":"数据资源管理开发组","type":"department"}]],"id":"9a9dbf3c-1197-11ef-adbd-7ab5ba133de2","name":"Flandre Scarlet"}]`,
			},
			want: []UserInfoV2{
				{
					ID:   "8455927c-1197-11ef-b3c3-7ab5ba133de2",
					Name: "Remilia Scarlet",
					ParentDeps: []DepartmentPath{
						{
							{
								ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
								Name: "AF研发线",
								Type: "department",
							},
							{
								ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源运营研发部",
								Type: "department",
							},
							{
								ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源管理开发组",
								Type: "department",
							},
						},
					},
				},
				{
					ID:   "9a9dbf3c-1197-11ef-adbd-7ab5ba133de2",
					Name: "Flandre Scarlet",
					ParentDeps: []DepartmentPath{
						{
							{
								ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
								Name: "AF研发线",
								Type: "department",
							},
							{
								ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源运营研发部",
								Type: "department",
							},
							{
								ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源管理开发组",
								Type: "department",
							},
						},
					},
				},
			},
			assertErr: assert.NoError,
		},
		{
			name:    "failure invalid type",
			baseURL: "http://user-management.example.com",
			args: args{
				userIDs: []string{"8455927c-1197-11ef-b3c3-7ab5ba133de2"},
				fields:  []UserInfoField{"undefined-field"},
			},
			response: response{
				code: http.StatusBadRequest,
				header: http.Header{
					"Content-Type":   []string{"application/json"},
					"Date":           []string{"Tue, 04 Jun 2024 07:02:07 GMT"},
					"Content-Length": []string{"112"},
				},
				body: `{"cause":"invalid type","code":400000000,"message":"参数不合法。","detail":{"params":["undefined-field"]}}`,
			},
			assertErr: assertErrorIsErrorCodeWithDetail(errorcode.DrivenUserManagementError, map[string]any{
				"message":  "invoke http api fail",
				"method":   http.MethodGet,
				"endpoint": &url.URL{Scheme: "http", Host: "user-management.example.com", Path: "v1/users/8455927c-1197-11ef-b3c3-7ab5ba133de2/undefined-field"},
				"err":      `{"cause":"invalid type","code":400000000,"message":"参数不合法。","detail":{"params":["undefined-field"]}}`,
			}),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := newFakeHTTPClient(tt.response.code, tt.response.body, tt.response.err)

			u := &usermgntSvc{
				baseURL:    tt.baseURL,
				httpClient: c,
			}

			got, err := u.GetUserInfos(context.Background(), tt.args.userIDs, tt.args.fields)

			// assert return values
			tt.assertErr(t, err, "return error")
			assert.Equal(t, tt.want, got, "return value")

			// assert http request
			wantURL := fmt.Sprintf("%s/v1/users/%s/%s", tt.baseURL, pathParameterUserIDsFrom(tt.args.userIDs), pathParameterFieldsFrom(tt.args.fields))
			assert.Equal(t, wantURL, c.CalledURL, "http request url")
		})
	}
}

// assertErrorIsErrorCodeWithDetail 返回 assert.ErrorAssertionFunc，用于判断
// error 是否是具有指定错误码、详细信息的结构化错误
func assertErrorIsErrorCodeWithDetail(errorCode string, detail map[string]any) assert.ErrorAssertionFunc {
	return func(t assert.TestingT, err error, msgAndArgs ...interface{}) bool {
		if tt, ok := t.(*testing.T); ok {
			tt.Helper()
		}

		c := agerrors.Code(err)

		conditions := []bool{
			assert.Equal(t, errorCode, c.GetErrorCode(), "ErrorCode"),
			assert.Equal(t, detail, c.GetErrorDetails(), "ErrorDetail"),
		}

		// return true if all conditions are true
		for _, c := range conditions {
			if !c {
				return false
			}
		}
		return true
	}
}
