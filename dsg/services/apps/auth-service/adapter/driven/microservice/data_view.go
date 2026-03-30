package microservice

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strconv"

	"go.uber.org/zap"

	"github.com/imroc/req/v3"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type DataViewGetRes struct {
	UniformCatalogCode string `json:"uniform_catalog_code"`

	// ViewSource.CatalogName
	ViewSourceCatalogName string `json:"view_source_catalog_name,omitempty"`

	TechnicalName   string `json:"technical_name"`
	BusinessName    string `json:"business_name"`
	DatasourceName  string `json:"datasource_name"`
	Schema          string `json:"schema"`
	InfoSystem      string `json:"info_system"`
	Description     string `json:"description"`
	SubjectDomainId string `json:"subject_domain_id"`
	SubjectDomain   string `json:"subject_domain"`
	DepartmentId    string `json:"department_id"`
	Department      string `json:"department"`
	CreatedAt       int64  `json:"created_at"`
	CreatedBy       string `json:"created_by"`
	UpdatedAt       int64  `json:"updated_at"`
	UpdatedBy       string `json:"updated_by"`
	// Owner 列表
	Owners []DataViewOwner `json:"owners,omitempty"`
}

// 逻辑视图的 Owner
type DataViewOwner struct {
	// 数据Owner id
	OwnerID string `json:"owner_id,omitempty"`
	// 数据Owner
	Owner string `json:"owner,omitempty"`
}
type DataViewRepo interface {
	// DataViewGet 主题域详情
	DataViewGet(ctx context.Context, id string) (res *DataViewGetRes, err error)
	// GetIDAndOwnerIDByCatalogSchemaViewName 根据 catalog.schema.view 获取逻辑视图
	GetIDAndOwnerIDByCatalogSchemaViewName(ctx context.Context, csv string) (id, ownerID string, err error)
	// GetFields 返回逻辑视图字段列表
	GetFields(ctx context.Context, id string) (fields []DataViewField, err error)
	// CreateSubViewInternally 创建行列规则（子视图）
	CreateSubViewInternally(ctx context.Context, spec *dto.SubViewSpec) (*dto.SubView, error)
	//UpdateSubViewInternally 修改行列规则（子视图）
	UpdateSubViewInternally(ctx context.Context, id string, spec *dto.SubViewSpec) (*dto.SubView, error)
	// GetSubView 获取指定 ID 的行列规则（子视图）
	GetSubView(ctx context.Context, id string) (*dto.SubView, error)
}

type dataViewRepo struct{}

func NewDataViewRepo() DataViewRepo {
	return &dataViewRepo{}
}

func (u *dataViewRepo) DataViewGet(ctx context.Context, id string) (res *DataViewGetRes, err error) {
	//req.DevMode()
	resp, err := req.SetContext(ctx).Get(settings.Instance.Services.DataView + "/api/internal/data-view/v1/form-view/" + id + "/details")
	if err != nil {
		log.WithContext(ctx).Error("DataViewGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataViewGet", zap.Error(errors.New(resp.String())))
		// 结构化错误
		var he ginx.HttpError
		if err := resp.UnmarshalJson(&he); err == nil {
			return nil, ConvertUpstreamError(&he)
		}
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &DataViewGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataViewGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}
func (d *dataViewRepo) GetIDAndOwnerIDByCatalogSchemaViewName(ctx context.Context, csv string) (id, ownerID string, err error) {
	formViewInfo, err := d.GetViewByKey(ctx, csv)
	if err != nil {
		log.Error("data-view not found", zap.String("catalogSchemaViewName", csv))
		return "", "", errorcode.Detail(errorcode.InternalError, fmt.Sprintf("data-view %q not found", csv))
	}
	return formViewInfo.ID, formViewInfo.OwnerID, nil
}

// GetIDAndOwnerIDByCatalogSchemaViewNameV0 implements DataViewRepo.
func (d *dataViewRepo) GetIDAndOwnerIDByCatalogSchemaViewNameV0(ctx context.Context, csv string) (id, ownerID string, err error) {
	// limit 100 records per page.
	const limit = 100

	var resp *listDataViewResponse
	for offset, totalCount := 1, 0; offset == 1 || (offset-1)*limit < totalCount; offset++ {
		// list by page
		if resp, err = d.listDataView(ctx, limit, offset); err != nil {
			return
		}
		// update totalCount
		totalCount = resp.TotalCount
		// check every entries
		for _, e := range resp.Entries {
			// skip unmatched
			if e.ViewSourceCatalogName+"."+e.TechnicalName != csv {
				continue
			}
			return e.ID, e.OwnerID, nil
		}
	}

	log.Error("data-view not found", zap.String("catalogSchemaViewName", csv))
	return "", "", errorcode.Detail(errorcode.InternalError, fmt.Sprintf("data-view %q not found", csv))
}

// Only contains necessary fields.
type listDataViewResponse struct {
	Entries    []listDataViewResponseEntry `json:"entries,omitempty"`
	TotalCount int                         `json:"total_count,omitempty"`
}

// Only contains necessary fields.
type listDataViewResponseEntry struct {
	ID                    string `json:"id,omitempty"`
	TechnicalName         string `json:"technical_name,omitempty"`
	OwnerID               string `json:"owner_id,omitempty"`
	ViewSourceCatalogName string `json:"view_source_catalog_name,omitempty"`
}

func (u *dataViewRepo) listDataView(ctx context.Context, limit, offset int) (*listDataViewResponse, error) {
	// API Endpoint
	base, err := url.Parse(settings.Instance.Services.DataView)
	if err != nil {
		log.WithContext(ctx).Error("parse data-view address fail", zap.Error(err), zap.String("address", settings.Instance.Services.DataView))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("parse data-view address %q fail: %v", settings.Instance.Services.DataView, err))
	}
	base.Path = path.Join(base.Path, "/api/data-view/v1/form-view")

	// Query parameters
	var query = make(url.Values)
	query.Set("limit", strconv.Itoa(limit))
	query.Set("offset", strconv.Itoa(offset))
	base.RawQuery = query.Encode()

	// create http request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error("create http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("create http request fail: %v", err))
	}
	// Set authorization
	req.Header.Set("authorization", util.GetToken(ctx))

	// send http request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()

	// status code other than 200 is considered a failure
	if resp.StatusCode != http.StatusOK {
		var body []byte
		if body, err = io.ReadAll(resp.Body); err != nil {
			log.WithContext(ctx).Error("read response body fail", zap.Error(err))
		}
		log.WithContext(ctx).Error("invoke API ListDataView fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base), zap.ByteString("response.body", body))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("%s %s, status: %s, body: %s", req.Method, req.URL, resp.Status, body))
	}

	var result listDataViewResponse
	// decode response body as json
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.WithContext(ctx).Error("decode response body of API ListDataView fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("decode response body of API ListDataView fail: %v", err))
	}

	return &result, nil
}

// Only contains necessary fields.
type dataViewWithFields struct {
	Fields []DataViewField `json:"fields,omitempty"`
}

// Only contains necessary fields.
type DataViewField struct {
	// 技术名称
	TechnicalName string `json:"technical_name,omitempty"`
	// 状态
	Status DataViewFieldStatus `json:"status,omitempty"`
}

// 逻辑视图字段状态
type DataViewFieldStatus string

// 逻辑视图字段状态
const (
	// 无变化
	DataViewFieldUniformity DataViewFieldStatus = "uniformity"
	// 新增
	DataViewFieldNew DataViewFieldStatus = "new"
	// 变更
	DataViewFieldModify DataViewFieldStatus = "modify"
	// 删除
	DataViewFieldDelete DataViewFieldStatus = "delete"
	// 不支持类型
	DataViewFieldNotSupport DataViewFieldStatus = "not_support"
)

// GetFields implements DataViewRepo.
func (u *dataViewRepo) GetFields(ctx context.Context, id string) (fields []DataViewField, err error) {
	// API Endpoint
	base, err := url.Parse(settings.Instance.Services.DataView)
	if err != nil {
		log.WithContext(ctx).Error("parse data-view address fail", zap.Error(err), zap.String("address", settings.Instance.Services.DataView))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("parse data-view address %q fail: %v", settings.Instance.Services.DataView, err))
	}
	base.Path = path.Join(base.Path, "/api/data-view/v1/form-view", id)

	// create http request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error("create http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("create http request fail: %v", err))
	}
	// Set authorization
	req.Header.Set("authorization", util.GetToken(ctx))

	// send http request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()

	// status code other than 200 is considered a failure
	if resp.StatusCode != http.StatusOK {
		var body []byte
		if body, err = io.ReadAll(resp.Body); err != nil {
			log.WithContext(ctx).Error("read response body fail", zap.Error(err))
		}
		log.WithContext(ctx).Error("invoke API GetDataViewFields fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base), zap.ByteString("response.body", body))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("%s %s, status: %s, body: %s", req.Method, req.URL, resp.Status, body))
	}

	var v dataViewWithFields
	// decode response body as json
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		log.WithContext(ctx).Error("decode response body of API ListDataView fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("decode response body of API ListDataView fail: %v", err))
	}

	fields = v.Fields
	return
}

func (u *dataViewRepo) UpdateSubViewInternally(ctx context.Context, id string, spec *dto.SubViewSpec) (*dto.SubView, error) {
	// API Endpoint
	base, err := url.Parse(settings.Instance.Services.DataView)
	if err != nil {
		log.WithContext(ctx).Error("parse data-view address fail", zap.Error(err), zap.String("address", settings.Instance.Services.DataView))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("parse data-view address %q fail: %v", settings.Instance.Services.DataView, err))
	}
	base.Path = path.Join(base.Path, "/api/internal/data-view/v1/sub-views", id)

	// request body
	log.WithContext(ctx).Info("marshal sub view spec", zap.Any("spec", spec))
	body, err := json.Marshal(spec)
	if err != nil {
		log.WithContext(ctx).Error("marshal sub view fail", zap.Error(err), zap.Any("spec", spec))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("marshal sub view fail: %v", err))
	}

	// create http request
	log.WithContext(ctx).Info("create http request")
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, base.String(), bytes.NewReader(body))
	if err != nil {
		log.WithContext(ctx).Error("create http request fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("create http request fail: %v", err))
	}

	// send http request
	log.WithContext(ctx).Info("send http request", zap.String("method", req.Method), zap.Stringer("url", req.URL), zap.Any("header", req.Header), zap.ByteString("body", body))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err), zap.String("method", req.Method), zap.Stringer("url", req.URL), zap.Any("header", req.Header))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()

	var errReadResponseBody error
	if body, errReadResponseBody = io.ReadAll(resp.Body); errReadResponseBody != nil {
		log.WithContext(ctx).Error("read response body fail", zap.Error(errReadResponseBody))
		body = []byte(errReadResponseBody.Error())
	}
	log.WithContext(ctx).Info(
		"http response",
		zap.Error(err),
		zap.String("method", resp.Request.Method),
		zap.Stringer("url", resp.Request.URL),
		zap.Any("response.header", resp.Header),
		zap.ByteString("response.body", body),
	)

	// status code other than 200 is considered a failure
	if resp.StatusCode != http.StatusOK {
		// 结构化错误
		var errH ginx.HttpError
		if err := json.Unmarshal(body, &errH); err != nil || errH.Code == "" {
			return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
				"method": req.Method,
				"url":    req.URL.String(),
				"status": resp.Status,
				"body":   body,
			})
		}
		return nil, agerrors.NewCode(agcodes.New(errH.Code, errH.Description, errH.Cause, errH.Solution, errH.Detail, ""))
	}

	if errReadResponseBody != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
			"method":              req.Method,
			"url":                 req.URL.String(),
			"status":              resp.Status,
			"errReadResponseBody": errReadResponseBody.Error(),
		})
	}

	var result dto.SubView
	// decode response body as json
	if err := json.Unmarshal(body, &result); err != nil {
		log.WithContext(ctx).Error("decode response body of API CreateSubView fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("decode response body of API dto.SubView fail: %v", err))
	}

	return &result, nil
}

// CreateSubViewInternally implements DataViewRepo.
func (u *dataViewRepo) CreateSubViewInternally(ctx context.Context, spec *dto.SubViewSpec) (*dto.SubView, error) {
	// API Endpoint
	base, err := url.Parse(settings.Instance.Services.DataView)
	if err != nil {
		log.WithContext(ctx).Error("parse data-view address fail", zap.Error(err), zap.String("address", settings.Instance.Services.DataView))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("parse data-view address %q fail: %v", settings.Instance.Services.DataView, err))
	}
	base.Path = path.Join(base.Path, "/api/internal/data-view/v1/sub-views")

	// request body
	log.WithContext(ctx).Info("marshal sub view spec", zap.Any("spec", spec))
	body, err := json.Marshal(spec)
	if err != nil {
		log.WithContext(ctx).Error("marshal sub view fail", zap.Error(err), zap.Any("spec", spec))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("marshal sub view fail: %v", err))
	}

	// create http request
	log.WithContext(ctx).Info("create http request")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base.String(), bytes.NewReader(body))
	if err != nil {
		log.WithContext(ctx).Error("create http request fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("create http request fail: %v", err))
	}

	// send http request
	log.WithContext(ctx).Info("send http request", zap.String("method", req.Method), zap.Stringer("url", req.URL), zap.Any("header", req.Header), zap.ByteString("body", body))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err), zap.String("method", req.Method), zap.Stringer("url", req.URL), zap.Any("header", req.Header))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()

	var errReadResponseBody error
	if body, errReadResponseBody = io.ReadAll(resp.Body); errReadResponseBody != nil {
		log.WithContext(ctx).Error("read response body fail", zap.Error(errReadResponseBody))
		body = []byte(errReadResponseBody.Error())
	}
	log.WithContext(ctx).Info(
		"http response",
		zap.Error(err),
		zap.String("method", resp.Request.Method),
		zap.Stringer("url", resp.Request.URL),
		zap.Any("response.header", resp.Header),
		zap.ByteString("response.body", body),
	)

	// status code other than 200 is considered a failure
	if resp.StatusCode != http.StatusOK {
		// 结构化错误
		var errH ginx.HttpError
		if err := json.Unmarshal(body, &errH); err != nil || errH.Code == "" {
			return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
				"method": req.Method,
				"url":    req.URL.String(),
				"status": resp.Status,
				"body":   body,
			})
		}
		return nil, agerrors.NewCode(agcodes.New(errH.Code, errH.Description, errH.Cause, errH.Solution, errH.Detail, ""))
	}

	if errReadResponseBody != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
			"method":              req.Method,
			"url":                 req.URL.String(),
			"status":              resp.Status,
			"errReadResponseBody": errReadResponseBody.Error(),
		})
	}

	var result dto.SubView
	// decode response body as json
	if err := json.Unmarshal(body, &result); err != nil {
		log.WithContext(ctx).Error("decode response body of API CreateSubView fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("decode response body of API dto.SubView fail: %v", err))
	}

	return &result, nil
}

// GetSubView implements DataViewRepo.
func (u *dataViewRepo) GetSubView(ctx context.Context, id string) (*dto.SubView, error) {
	// API Endpoint
	base, err := url.Parse(settings.Instance.Services.DataView)
	if err != nil {
		log.WithContext(ctx).Error("parse data-view address fail", zap.Error(err), zap.String("address", settings.Instance.Services.DataView))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("parse data-view address %q fail: %v", settings.Instance.Services.DataView, err))
	}
	base.Path = path.Join(base.Path, "/api/data-view/v1/sub-views", id)

	// create http request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error("create http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("create http request fail: %v", err))
	}
	// Set authorization
	if t, err := interception.BearerTokenFromContextCompatible(ctx); err == nil {
		req.Header.Set("Authorization", "Bearer "+t)
	}

	// send http request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()

	// status code other than 200 is considered a failure
	if resp.StatusCode != http.StatusOK {
		var body []byte
		if body, err = io.ReadAll(resp.Body); err != nil {
			log.WithContext(ctx).Error("read response body fail", zap.Error(err))
		}
		log.WithContext(ctx).Error("invoke API GetSubView fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base), zap.ByteString("response.body", body))

		// 结构化错误
		var errH ginx.HttpError
		if err := json.Unmarshal(body, &errH); err != nil || errH.Code == "" {
			return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
				"method": req.Method,
				"url":    req.URL.String(),
				"status": resp.Status,
				"body":   body,
			})
		}
		return nil, agerrors.NewCode(agcodes.New(errH.Code, errH.Description, errH.Cause, errH.Solution, errH.Detail, ""))
	}

	var result dto.SubView
	// decode response body as json
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.WithContext(ctx).Error("decode response body of API GetSubView fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("decode response body of API dto.SubView fail: %v", err))
	}

	return &result, nil
}

type FormViewSimpleInfo struct {
	ID            string `json:"id"`             // 逻辑视图uuid
	TechnicalName string `json:"technical_name"` // 表技术名称
	BusinessName  string `json:"business_name"`  // 表业务名称
	OwnerID       string `json:"owner_id"`       // 数据Owner id
}

func (u *dataViewRepo) GetViewByKey(ctx context.Context, logicViewName string) (*FormViewSimpleInfo, error) {
	// API Endpoint
	base, err := url.Parse(settings.Instance.Services.DataView)
	if err != nil {
		log.WithContext(ctx).Error("parse data-view address fail", zap.Error(err), zap.String("address", settings.Instance.Services.DataView))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("parse data-view address %q fail: %v", settings.Instance.Services.DataView, err))
	}
	base.Path = path.Join(base.Path, fmt.Sprintf("/api/internal/data-view/v1/form-view/simple/%s", logicViewName))
	// create http request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error("create http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("create http request fail: %v", err))
	}
	// send http request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("send http request fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()
	// status code other than 200 is considered a failure
	if resp.StatusCode != http.StatusOK {
		var body []byte
		if body, err = io.ReadAll(resp.Body); err != nil {
			log.WithContext(ctx).Error("read response body fail", zap.Error(err))
		}
		log.WithContext(ctx).Error("invoke API GetDataViewFields fail", zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("url", base), zap.ByteString("response.body", body))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("%s %s, status: %s, body: %s", req.Method, req.URL, resp.Status, body))
	}
	var result FormViewSimpleInfo
	// decode response body as json
	if err = json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.WithContext(ctx).Error("decode response body of API GetViewByKey fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("decode response body of API GetViewByKey fail: %v", err))
	}
	return &result, nil
}
