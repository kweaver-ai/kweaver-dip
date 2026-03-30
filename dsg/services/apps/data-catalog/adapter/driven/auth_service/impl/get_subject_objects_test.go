package impl

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service/impl/mock"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

func TestASDrivenRepo_GetSubjectObjects(t *testing.T) {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})

	type args struct {
		ctx  context.Context
		opts auth_service.GetObjectsOptions
	}
	type httpClientArgs struct {
		ctx    any
		url    *url.URL
		header map[string]string
	}
	type httpClientReturn struct {
		respParam any
		err       error
	}

	tests := []struct {
		name                 string
		authServiceHost      string
		args                 args
		httpClientArgs       httpClientArgs
		httpClientReturn     httpClientReturn
		want                 *auth_service.ObjectWithPermissionsList
		wantErrorCode        string
		wantErrorDescription string
		wantErrorDetail      any
	}{
		{
			name:            "成功",
			authServiceHost: "http://auth-service.example.org",
			args: args{
				ctx: context.WithValue(context.Background(), interception.Token, "UserTokenKeyXXXX"),
				opts: auth_service.GetObjectsOptions{
					SubjectType: auth_service.SubjectTypeUser,
					SubjectID:   "3c56dc53-d72b-4a26-af9f-e32f5e772c13",
					ObjectTypes: []auth_service.ObjectType{
						auth_service.ObjectTypeDataView,
						auth_service.ObjectTypeAPI,
					},
				},
			},
			httpClientArgs: httpClientArgs{
				ctx: gomock.Any(),
				url: &url.URL{
					Scheme: "http",
					Host:   "auth-service.example.org",
					Path:   "/api/auth-service/v1/subject/objects",
					RawQuery: url.Values{
						"subject_type": []string{
							"user",
						},
						"subject_id": []string{
							"3c56dc53-d72b-4a26-af9f-e32f5e772c13",
						},
						"object_type": []string{
							"data_view,api",
						},
					}.Encode(),
				},
				header: map[string]string{
					"Authorization": "UserTokenKeyXXXX",
					"Content-Time":  "application/json",
				},
			},
			httpClientReturn: httpClientReturn{
				respParam: map[string]any{
					"entries": []any{
						map[string]any{
							"object_type": "data_view",
							"object_id":   "cfd81b9a-8dc5-40c4-b085-1d56981bb1ec",
							"permissions": []any{
								map[string]any{
									"action": "read",
									"effect": "allow",
								},
								map[string]any{
									"action": "download",
									"effect": "allow",
								},
							},
						},
					},
					"total_count": 1,
				},
			},
			want: &auth_service.ObjectWithPermissionsList{
				Entries: []auth_service.ObjectWithPermissions{
					{
						ObjectType: auth_service.ObjectTypeDataView,
						ObjectID:   "cfd81b9a-8dc5-40c4-b085-1d56981bb1ec",
						Permissions: []auth_service.PermissionV2{
							{
								Action: auth_service.PolicyActionRead,
								Effect: auth_service.PolicyEffectAllow,
							},
							{
								Action: auth_service.PolicyActionDownload,
								Effect: auth_service.PolicyEffectAllow,
							},
						},
					},
				},
				TotalCount: 1,
			},
		},
		{
			name:            "返回结构化错误",
			authServiceHost: "http://auth-service.example.org/structural-error",
			args: args{
				ctx: context.WithValue(context.Background(), interception.Token, "UserTokenKeyYYYY"),
			},
			httpClientArgs: httpClientArgs{
				ctx: gomock.Any(),
				url: &url.URL{
					Scheme: "http",
					Host:   "auth-service.example.org",
					Path:   "/structural-error/api/auth-service/v1/subject/objects",
				},
				header: map[string]string{
					"Authorization": "UserTokenKeyYYYY",
					"Content-Time":  "application/json",
				},
			},
			httpClientReturn: httpClientReturn{
				err: httpclient.ExHTTPError{
					Status: http.StatusBadRequest,
					Body:   []byte(`{"code":"AuthService.Public.InvalidParameter","description":"参数值校验不通过","solution":"请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档","detail":[{"key":"subject_type","message":"subject_type为必填字段"},{"key":"object_type","message":"object_type为必填字段"},{"key":"subject_id","message":"subject_id为必填字段"}]}`),
				},
			},
			wantErrorCode:        "AuthService.Public.InvalidParameter",
			wantErrorDescription: "参数值校验不通过",
			wantErrorDetail: []any{
				map[string]any{
					"key":     "subject_type",
					"message": "subject_type为必填字段",
				},
				map[string]any{
					"key":     "object_type",
					"message": "object_type为必填字段",
				},
				map[string]any{
					"key":     "subject_id",
					"message": "subject_id为必填字段",
				},
			},
		},
		{
			name:            "返回未知错误",
			authServiceHost: "http://auth-service.example.org/unstructured-error",
			args: args{
				ctx: context.WithValue(context.Background(), interception.Token, "UserTokenKeyZZZZ"),
			},
			httpClientArgs: httpClientArgs{
				ctx: gomock.Any(),
				url: &url.URL{
					Scheme: "http",
					Host:   "auth-service.example.org",
					Path:   "/unstructured-error/api/auth-service/v1/subject/objects",
				},
				header: map[string]string{
					"Authorization": "UserTokenKeyZZZZ",
					"Content-Time":  "application/json",
				},
			},
			httpClientReturn: httpClientReturn{
				err: fmt.Errorf("code:%v,header:%v,body:%v", http.StatusInternalServerError, http.Header{"Content-Time": []string{"text/plain"}}, "Something is wrong."),
			},
			wantErrorCode:        errorcode.PublicInternalError,
			wantErrorDescription: "内部错误",
			wantErrorDetail: map[string]any{
				"method": http.MethodGet,
				"url":    "http://auth-service.example.org/unstructured-error/api/auth-service/v1/subject/objects",
				"err":    "code:500,header:map[Content-Time:[text/plain]],body:Something is wrong.",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// settings.GetConfig().AuthServiceHost
			settings.GetConfig().AuthServiceHost = tt.authServiceHost

			ctrl := gomock.NewController(t)
			mockHTTPClient := mock.NewMockHTTPClient(ctrl)
			mockHTTPClient.
				EXPECT().
				Get(tt.httpClientArgs.ctx, tt.httpClientArgs.url.String(), tt.httpClientArgs.header).
				Return(tt.httpClientReturn.respParam, tt.httpClientReturn.err).
				AnyTimes()

			r := &ASDrivenRepo{
				client: mockHTTPClient,
			}

			got, err := r.GetSubjectObjects(tt.args.ctx, tt.args.opts)
			assert.Equal(t, tt.want, got)
			assertCoder(t, tt.wantErrorCode, tt.wantErrorDescription, tt.wantErrorDetail, err)
		})
	}
}

func assertCoder(t *testing.T, expectedCode string, expectedDescription string, expectedDetail any, err error) bool {
	t.Helper()

	if expectedCode == "" {
		expectedCode = agcodes.CodeNil.GetErrorCode()
	}
	if expectedDescription == "" {
		expectedDescription = agcodes.CodeNil.GetDescription()
	}

	coder := agerrors.Code(err)

	for _, cond := range []bool{
		assert.Equal(t, expectedCode, coder.GetErrorCode(), "Code"),
		assert.Equal(t, expectedDescription, coder.GetDescription(), "Description"),
		assert.Equal(t, expectedDetail, coder.GetErrorDetails(), "Detail"),
	} {
		if cond {
			continue
		}
		return false
	}

	return true
}
