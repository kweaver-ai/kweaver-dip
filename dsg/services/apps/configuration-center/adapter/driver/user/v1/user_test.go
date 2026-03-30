package user

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"path"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user/impl"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
)

func TestMain(m *testing.M) {
	// Initialize the logger, otherwise logging will panic.
	log.InitLogger(zapx.LogConfigs{}, &common.TelemetryConf{})
	// Setup the validator, otherwise gin binding will panic.
	form_validator.SetupValidator()

	m.Run()
}

func TestService_GetUserRoles(t *testing.T) {
	// Service
	var s = &Service{}
	// gin engine
	var r = gin.New()
	// register route
	r.GET("/users/:id", s.GetUser)

	type useCaseResponse struct {
		user *domain.User
		err  error
	}
	type args struct {
		id     string
		fields []string
	}
	type want struct {
		code int
		body string
	}
	tests := []struct {
		name            string
		useCaseResponse useCaseResponse
		args            args
		want            want
		wantUseCaseArgs *fakeUseCaseGetUserArgs
	}{
		{
			name: "get name and parent_deps",
			useCaseResponse: useCaseResponse{
				user: &domain.User{
					ID:   "8455927c-1197-11ef-b3c3-7ab5ba133de2",
					Name: "Remilia Scarlet",
					ParentDeps: []domain.DepartmentPath{
						{
							{
								ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
								Name: "AF研发线",
							},
							{
								ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源运营研发部",
							},
							{
								ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
								Name: "数据资源管理开发组",
							},
						},
					},
				},
			},
			args: args{
				id:     "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				fields: []string{"name", "parent_deps"},
			},
			want: want{
				code: http.StatusOK,
				body: `{"name":"Remilia Scarlet","parent_deps":[[{"id":"076cf984-020c-11ef-bdb6-7ab5ba133de2","name":"AF研发线"},{"id":"0dc4af48-020c-11ef-bdb6-7ab5ba133de2","name":"数据资源运营研发部"},{"id":"78d39772-0d01-11ef-bdb6-7ab5ba133de2","name":"数据资源管理开发组"}]],"id":"8455927c-1197-11ef-b3c3-7ab5ba133de2"}`,
			},
			wantUseCaseArgs: &fakeUseCaseGetUserArgs{
				userID: "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				opts:   domain.GetUserOptions{Fields: []domain.UserField{domain.UserFieldName, domain.UserFieldParentDeps}},
			},
		},
		{
			name: "underlying failure",
			useCaseResponse: useCaseResponse{
				err: errorcode.Detail(errorcode.PublicInternalError, "something wrong"),
			},
			args: args{
				id:     "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				fields: []string{"name", "parent_deps"},
			},
			want: want{
				code: http.StatusBadRequest,
				body: `{"code":"ConfigurationCenter.Public.InternalError","description":"内部错误","detail":"something wrong"}`,
			},
			wantUseCaseArgs: &fakeUseCaseGetUserArgs{
				userID: "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				opts:   domain.GetUserOptions{Fields: []domain.UserField{domain.UserFieldName, domain.UserFieldParentDeps}},
			},
		},
		{
			name: "invalid user id",
			useCaseResponse: useCaseResponse{
				err: errorcode.Detail(errorcode.PublicInternalError, "something wrong"),
			},
			args: args{
				id:     "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx",
				fields: []string{"name", "parent_deps"},
			},
			want: want{
				code: http.StatusBadRequest,
				body: `{"code":"ConfigurationCenter.Public.InvalidParameter","description":"参数值校验不通过","solution":"请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档","detail":[{"key":"id","message":"id必须是一个有效的UUID"}]}`,
			},
		},
		{
			name: "invalid field name",
			args: args{
				id:     "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				fields: []string{"name", "xxxx"},
			},
			want: want{
				code: http.StatusBadRequest,
				body: `{"code":"ConfigurationCenter.Public.InvalidParameter","description":"参数值校验不通过","solution":"请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档","detail":[{"key":"fields[1]","message":"must be one of supported values: \"name\", \"parent_deps\""}]}`,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := newFakeUseCase(tt.useCaseResponse.user, tt.useCaseResponse.err)

			s.uc = uc

			w := httptest.NewRecorder()

			query := &url.Values{}
			for _, f := range tt.args.fields {
				query.Add("fields", f)
			}
			u := &url.URL{
				Path:     path.Join("/users", tt.args.id),
				RawQuery: query.Encode(),
			}

			req, err := http.NewRequest(http.MethodGet, u.String(), http.NoBody)
			if err != nil {
				t.Fatal(err)
			}

			r.ServeHTTP(w, req)

			t.Logf("http response, status code: %d, body: %s", w.Code, w.Body)

			// assert http response
			assert.Equal(t, tt.want.code, w.Code, "http response status code")
			assert.JSONEq(t, tt.want.body, w.Body.String(), "http response body")
			// assert underlying args
			assert.Equal(t, tt.wantUseCaseArgs, uc.calledGetUserArgs, "use case get user args")
		})
	}
}
