package flowchart_test

import (
	"bytes"
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/flowchart/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"

	// "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	// "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	json2 "encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/agiledragon/gomonkey/v2"
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"

	. "github.com/smartystreets/goconvey/convey"
)

const (
	preUrl = "/api/configuration-center/v1"
)

var (
	uc     = &flowchartUseCase{}
	engine *gin.Engine
)

type flowchartUseCase struct {
}

func (f *flowchartUseCase) HandleRoleMissing(ctx context.Context, rid string) error {
	//TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) ListByPaging(ctx context.Context, req *domain.QueryPageReqParam) (*domain.QueryPageReapParam, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) Delete(ctx context.Context, fid string) (*response.NameIDResp, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) NameExistCheck(ctx context.Context, name string, fid *string) (bool, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) Get(ctx context.Context, fId string) (*domain.GetResp, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) PreCreate(ctx context.Context, req *domain.PreCreateReqParam, uid string) (*domain.PreCreateRespParam, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) Edit(ctx context.Context, body *domain.EditReqParamBody, fId string, uid string) (*response.NameIDResp, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) SaveContent(ctx context.Context, req *domain.SaveContentReqParamBody, fId string) (*domain.SaveContentRespParam, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) GetContent(ctx context.Context, req *domain.GetContentReqParamQuery, fId string) (*domain.GetContentRespParam, error) {
	// TODO implement me
	panic("implement me")
}

func (f *flowchartUseCase) GetNodesInfo(ctx context.Context, req *domain.GetNodesInfoReqParamQuery, fId string) (*domain.GetNodesInfoRespParam, error) {
	// TODO implement me
	panic("implement me")
}

func TestMain(m *testing.M) {
	// 初始化验证器
	form_validator.SetupValidator()

	// patches := gomonkey.ApplyFuncReturn(log.Infof)
	// defer patches.Reset()
	// patches.ApplyFuncReturn(log.Info)
	// patches.ApplyFuncReturn(log.WithContext(ctx).Error)
	// patches.ApplyFuncReturn(log.WithContext(ctx).Errorf)
	//
	// zapxLog := &zapx.ZapWriter{}
	// patches.ApplyMethodReturn(zapxLog, "Info")

	setupRouter()

	os.Exit(m.Run())
}

func setupRouter() {
	r := &driver.Router{
		FlowchartApi: flowchart.NewService(nil),
	}

	engine = driver.NewHttpEngine(r)
}

type utData struct {
	uriParam      []any
	queryParam    map[string]string
	formBodyParam url.Values
	jsonBodyParam any
	statusCode    int
	errCode       string

	needReq []any
}

func controllerUTFunc(method, uriPattern string, d *utData) {
	uri := uriPattern
	if len(d.uriParam) > 0 {
		uri = fmt.Sprintf(uri, d.uriParam...)
	}

	params := make([]string, 0, len(d.queryParam))
	for k, v := range d.queryParam {
		params = append(params, k+"="+v)
	}
	if len(params) > 0 {
		uri = uri + "?" + strings.Join(params, "&")
	}

	if d.formBodyParam != nil && d.jsonBodyParam != nil {
		panic("only form body or json body")
	}

	var body io.Reader
	if d.jsonBodyParam != nil {
		if jsonStr, ok := d.jsonBodyParam.(string); ok {
			body = strings.NewReader(jsonStr)
		} else {
			b, err := json2.Marshal(d.jsonBodyParam)
			So(err, ShouldBeNil)
			body = bytes.NewReader(b)
		}
	}

	req, err := http.NewRequest(method, uri, body)
	So(err, ShouldBeNil)

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)

	resp := rec.Result()
	So(resp.StatusCode, ShouldEqual, d.statusCode)

	if d.statusCode == http.StatusOK {
		return
	}

	respBody, err := ioutil.ReadAll(resp.Body)
	So(err, ShouldBeNil)
	defer resp.Body.Close()

	errResp := &rest.HttpError{}
	err = json2.Unmarshal(respBody, errResp)
	So(err, ShouldBeNil)

	So(errResp.Code, ShouldEqual, d.errCode)
}

func TestService_QueryPage(t *testing.T) {
	uri := preUrl + "/flowchart-configurations"
	method := http.MethodGet

	Convey("TestFlowchartQueryPage", t, func() {
		Convey("RequestParamErrUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "ListByPaging", &domain.QueryPageReapParam{}, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"no param": {
					queryParam: nil,
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
				"offset is 0": {
					queryParam: map[string]string{
						"offset": "0",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"default value--release state is unreleased": {
					queryParam: map[string]string{
						"release_state": string(constant.FlowchartReleaseStateUnreleased),
					},
					statusCode: http.StatusOK,
					needReq: []any{&domain.QueryPageReqParam{
						PageInfo: domain.PageInfo{
							Offset:    util.ValueToPtr(1),
							Limit:     util.ValueToPtr(12),
							Direction: util.ValueToPtr("desc"),
							Sort:      util.ValueToPtr(constant.SortByCreatedAt),
						},
						Keyword:      "",
						ReleaseState: constant.FlowchartReleaseStateUnreleased,
						ChangeState:  nil,
						IsAll:        false,
						WithImage:    true,
					}},
				},
				"keyword exist space": {
					queryParam: map[string]string{
						"release_state": string(constant.FlowchartReleaseStateUnreleased),
						"keyword":       "   k   ",
					},
					statusCode: http.StatusOK,
					needReq: []any{&domain.QueryPageReqParam{
						PageInfo: domain.PageInfo{
							Offset:    util.ValueToPtr(1),
							Limit:     util.ValueToPtr(12),
							Direction: util.ValueToPtr("desc"),
							Sort:      util.ValueToPtr(constant.SortByCreatedAt),
						},
						Keyword:      "k",
						ReleaseState: constant.FlowchartReleaseStateUnreleased,
						ChangeState:  nil,
						IsAll:        false,
						WithImage:    true,
					}},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "ListByPaging", func(_ context.Context, req *domain.QueryPageReqParam) (*domain.QueryPageReapParam, error) {
						So(req, ShouldResemble, tt.needReq[0])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"database err": {
					queryParam: map[string]string{
						"release_state": string(constant.FlowchartReleaseStateUnreleased),
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "ListByPaging", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_Get(t *testing.T) {
	uri := preUrl + "/flowchart-configurations/%v"
	method := http.MethodGet

	Convey("TestServiceGet", t, func() {
		Convey("RequestParamErrUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "Get", &domain.SummaryInfo{}, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"fid not is uuid": {
					uriParam:   []any{"1"},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"fid is uuid": {
					uriParam:   []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					statusCode: http.StatusOK,
					needReq:    []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "Get", func(_ context.Context, req string) (*domain.GetResp, error) {
						So(req, ShouldResemble, tt.needReq[0])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					uriParam:   []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "Get", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_Delete(t *testing.T) {
	uri := preUrl + "/flowchart-configurations/%v"
	method := http.MethodDelete

	Convey("TestService_Delete", t, func() {
		Convey("RequestParamUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "Delete", &response.NameIDResp{ID: "1", Name: "f_name"}, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"fid not is uuid": {
					uriParam:   []any{"1"},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"fid is uuid": {
					uriParam:   []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					statusCode: http.StatusOK,
					needReq:    []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "Delete", func(_ context.Context, req string) (*response.NameIDResp, error) {
						So(req, ShouldResemble, tt.needReq[0])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					uriParam:   []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "Delete", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_PreCreate(t *testing.T) {
	uri := preUrl + "/flowchart-configurations"
	method := http.MethodPost

	Convey("TestService_PreCreate", t, func() {
		Convey("RequestParamUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "PreCreate", &domain.PreCreateRespParam{ID: "1", Name: "f_name"}, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"name has @": {
					jsonBodyParam: map[string]string{
						"name":        "n1@",
						"description": "d1",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"suc": {
					jsonBodyParam: map[string]string{
						"name":        "n1",
						"description": "d1",
					},
					statusCode: http.StatusOK,
					needReq: []any{
						&domain.PreCreateReqParam{
							Name:        util.ValueToPtr("n1"),
							Description: util.ValueToPtr("d1"),
						},
					},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "PreCreate", func(_ context.Context, req0 *domain.PreCreateReqParam) (*domain.PreCreateRespParam, error) {
						So(req0, ShouldResemble, tt.needReq[0])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					jsonBodyParam: map[string]string{
						"name":        "n1",
						"description": "d1",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "PreCreate", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_Edit(t *testing.T) {
	uri := preUrl + "/flowchart-configurations/%v"
	method := http.MethodPut

	Convey("TestService_Edit", t, func() {
		Convey("RequestParamUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "Edit", &response.NameIDResp{ID: "1", Name: "f_name"}, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"fid not is uuid": {
					uriParam: []any{"1"},
					jsonBodyParam: map[string]string{
						"name":        "n1",
						"description": "d1",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
				"name has @": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					jsonBodyParam: map[string]string{
						"name":        "n1@",
						"description": "d1",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"fid is uuid": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					jsonBodyParam: map[string]string{
						"name":        "n1",
						"description": "d1",
					},
					statusCode: http.StatusOK,
					needReq: []any{
						&domain.EditReqParamBody{
							Name:        util.ValueToPtr("n1"),
							Description: util.ValueToPtr("d1"),
						},
						"dd174132-9d27-4795-9b78-574fc0cf1bc9",
					},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "Edit", func(_ context.Context, req0 *domain.EditReqParamBody, req1 string) (*response.NameIDResp, error) {
						So(req0, ShouldResemble, tt.needReq[0])
						So(req1, ShouldResemble, tt.needReq[1])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					jsonBodyParam: map[string]string{
						"name":        "n1",
						"description": "d1",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "Edit", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_NameExistCheck(t *testing.T) {
	uri := preUrl + "/flowchart-configurations/check"
	method := http.MethodGet

	Convey("TestService_NameExistCheck", t, func() {
		Convey("RequestParamErrUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "NameExistCheck", false, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"flowchart_id is empty": {
					queryParam: map[string]string{
						"flowchart_id": "",
						"name":         "1",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"no flowchart_id": {
					queryParam: map[string]string{
						"name": "1",
					},
					statusCode: http.StatusOK,
					needReq:    []any{"1", (*string)(nil)},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "NameExistCheck", func(_ context.Context, req0 string, req1 *string) (bool, error) {
						So(req0, ShouldResemble, tt.needReq[0])
						So(req1, ShouldResemble, tt.needReq[1])
						return false, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					queryParam: map[string]string{
						"name": "1",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				patches := gomonkey.ApplyMethodReturn(uc, "NameExistCheck", false, errorcode.Desc(tt.errCode))
				defer patches.Reset()

				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_SaveContent(t *testing.T) {
	uri := preUrl + "/flowchart-configurations/%v/content"
	method := http.MethodPost

	Convey("TestService_SaveContent", t, func() {
		Convey("RequestParamErrUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "SaveContent", nil, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"fid not is uuid": {
					uriParam: []any{"1"},
					jsonBodyParam: &domain.SaveContentReqParamBody{
						Type:    util.ValueToPtr(constant.FlowchartSaveTypeTemp),
						Content: util.ValueToPtr("[]"),
						Image:   nil,
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
				"type is final image is nil": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					jsonBodyParam: map[string]string{
						"type":    "final",
						"content": "[]",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"suc": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					jsonBodyParam: map[string]string{
						"type":    "final",
						"content": "[]",
						"image":   "image==",
					},
					statusCode: http.StatusOK,
					needReq: []any{&domain.SaveContentReqParamBody{
						Type:    util.ValueToPtr(constant.FlowchartSaveTypeFinal),
						Content: util.ValueToPtr("[]"),
						Image:   util.ValueToPtr("image=="),
					}, "dd174132-9d27-4795-9b78-574fc0cf1bc9"},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "SaveContent", func(_ context.Context, req0 *domain.SaveContentReqParamBody, req1 string) (*domain.SaveContentRespParam, error) {
						So(req0, ShouldResemble, tt.needReq[0])
						So(req1, ShouldResemble, tt.needReq[1])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					jsonBodyParam: map[string]string{
						"type":    "temp",
						"content": "[]",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "SaveContent", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_GetContent(t *testing.T) {
	uri := preUrl + "/flowchart-configurations/%v/content"
	method := http.MethodGet

	Convey("TestService_GetContent", t, func() {
		Convey("RequestParamErrUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "GetContent", nil, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"fid not is uuid": {
					uriParam:   []any{"1"},
					queryParam: nil,
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"suc": {
					uriParam:   []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					queryParam: nil,
					statusCode: http.StatusOK,
					needReq: []any{
						&domain.GetContentReqParamQuery{
							VersionID: nil,
						},
						"dd174132-9d27-4795-9b78-574fc0cf1bc9",
					},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "GetContent", func(_ context.Context, req0 *domain.GetContentReqParamQuery, req1 string) (*domain.GetContentRespParam, error) {
						So(req0, ShouldResemble, tt.needReq[0])
						So(req1, ShouldResemble, tt.needReq[1])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					uriParam:   []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					queryParam: nil,
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "GetContent", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}

func TestService_GetNodesInfo(t *testing.T) {
	uri := preUrl + "/flowchart-configurations/%v/nodes"
	method := http.MethodGet

	Convey("TestService_GetNodesInfo", t, func() {
		Convey("RequestParamErrUT", func() {
			patches := gomonkey.ApplyMethodReturn(uc, "GetNodesInfo", nil, nil)
			defer patches.Reset()

			tests := map[string]*utData{
				"fid not is uuid": {
					uriParam:   []any{"1"},
					queryParam: nil,
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicInvalidParameter,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleSucUT", func() {
			tests := map[string]*utData{
				"suc": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					queryParam: map[string]string{
						"version_id": "3586dea9-4619-4869-9f93-8b7f6a1538ad",
					},
					statusCode: http.StatusOK,
					needReq: []any{
						&domain.GetNodesInfoReqParamQuery{
							VersionID: util.ValueToPtr("3586dea9-4619-4869-9f93-8b7f6a1538ad"),
						},
						"dd174132-9d27-4795-9b78-574fc0cf1bc9",
					},
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodFunc(uc, "GetNodesInfo", func(_ context.Context, req0 *domain.GetNodesInfoReqParamQuery, req1 string) (*domain.GetNodesInfoRespParam, error) {
						So(req0, ShouldResemble, tt.needReq[0])
						So(req1, ShouldResemble, tt.needReq[1])
						return nil, nil
					})
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})

		Convey("RequestHandleErrUT", func() {
			tests := map[string]*utData{
				"db err": {
					uriParam: []any{"dd174132-9d27-4795-9b78-574fc0cf1bc9"},
					queryParam: map[string]string{
						"version_id": "3586dea9-4619-4869-9f93-8b7f6a1538ad",
					},
					statusCode: http.StatusBadRequest,
					errCode:    errorcode.PublicDatabaseError,
				},
			}

			for name, tt := range tests {
				Convey(name, func() {
					patches := gomonkey.ApplyMethodReturn(uc, "GetNodesInfo", nil, errorcode.Desc(tt.errCode))
					defer patches.Reset()

					controllerUTFunc(method, uri, tt)
				})
			}
		})
	})
}
