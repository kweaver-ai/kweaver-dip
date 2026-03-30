package virtual_engine

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"strings"
	"time"

	"github.com/imroc/req/v2"
	"github.com/spf13/cast"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"

	"github.com/kweaver-ai/TelemetrySDK-Go/exporter/v2/ar_trace"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	goframetrace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type FetchRawRes struct {
	Columns    []Column        `json:"columns"`
	Data       [][]interface{} `json:"data"`
	TotalCount int             `json:"total_count"`
}

type FetchRawResTransform struct {
	TotalCount int        `json:"total_count"`
	Data       [][]Column `json:"data"`
}

type FetchRes struct {
	TotalCount int                      `json:"total_count"`
	Data       []map[string]interface{} `json:"data"`
}

type Column struct {
	Name  string      `json:"name"`
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

type FetchError struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Detail      string `json:"detail"`
	Solution    string `json:"solution"`
}

type T struct {
	Name string `json:"name"`
	Type string `json:"type"`
}
type VirtualEngineRepo interface {
	Fetch(ctx context.Context, script string, timeout uint32, serviceResponseFilters []model.ServiceResponseFilter) (fetchRes *FetchRes, err error)
	FetchCount(ctx context.Context, script string, timeout uint32) (totalCount int64, err error)
}

func NewVirtualEngineRepo() VirtualEngineRepo {
	return &virtualEngineRepo{}
}

type virtualEngineRepo struct{}

func (v *virtualEngineRepo) Fetch(ctx context.Context, script string, timeout uint32, serviceResponseFilters []model.ServiceResponseFilter) (fetchRes *FetchRes, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "virtualEngine", trace.WithSpanKind(trace.SpanKindClient))
	defer func() { goframetrace.TelemetrySpanEnd(span, err) }()

	reqBody := struct {
		SQL  string `json:"sql"`
		TYPE int    `json:"type"`
	}{
		SQL:  script,
		TYPE: 0,
	}
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	client := req.
		SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true}).
		SetTimeout(time.Duration(timeout) * time.Second).
		DevMode()

	response, err := client.R().
		// SetHeader("X-Presto-User", "admin").
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", "Bearer "+util.GetToken(ctx)).
		SetBodyString(string(jsonBody)).
		// Post(settings.Instance.Services.VirtualEngine + "/api/virtual_engine_service/v1/fetch")
		Post(settings.Instance.Services.VirtualEngine + "/api/data-connection/v1/gateway/fetch")
	if err != nil {
		log.WithContext(ctx).Error("Fetch", zap.Error(err))
		return nil, errorcode.Detail(errorcode.QueryError, err.Error())
	}

	if response.StatusCode != 200 {
		fetchError := &FetchError{}
		err := response.UnmarshalJson(fetchError)
		if err != nil {
			log.WithContext(ctx).Error("Fetch", zap.String("body", response.String()), zap.String("script", script))
			return nil, err
		}
		log.WithContext(ctx).Error("Fetch", zap.String("body", response.String()), zap.String("script", script))
		var e string
		if fetchError.Solution != "" {
			e = fetchError.Solution
		} else if fetchError.Detail != "" {
			e = fetchError.Detail
		}
		return nil, errorcode.Detail(errorcode.QueryError, e)
	}

	fetchRawRes := &FetchRawRes{}
	d := json.NewDecoder(bytes.NewReader(response.Bytes()))
	d.UseNumber()
	err = d.Decode(fetchRawRes)
	if err != nil {
		log.WithContext(ctx).Error("Fetch decode response fail", zap.Error(err), zap.ByteString("body", response.Bytes()))
		return nil, err
	}

	//把数据值和数据类型都放到 Column 里
	fetchRawResTransform := &FetchRawResTransform{
		TotalCount: cast.ToInt(fetchRawRes.TotalCount),
		Data:       make([][]Column, 0),
	}

	for _, datum := range fetchRawRes.Data {
		item := make([]Column, 0)
		for i, column := range fetchRawRes.Columns {
			c := Column{
				Name:  column.Name,
				Type:  column.Type,
				Value: datum[i],
			}
			item = append(item, c)
		}
		fetchRawResTransform.Data = append(fetchRawResTransform.Data, item)
	}

	//过滤结果
	var filters = make(map[string]model.ServiceResponseFilter)
	for _, filter := range serviceResponseFilters {
		filters[filter.Param] = filter
	}

	fetchRes = &FetchRes{
		Data: make([]map[string]interface{}, 0),
	}

	for _, columns := range fetchRawResTransform.Data {
		if !v.fetchResFilter(columns, filters) {
			continue
		}
		item := make(map[string]interface{})
		for _, column := range columns {
			item[column.Name] = column.Value
		}
		fetchRes.Data = append(fetchRes.Data, item)
	}

	fetchRes.TotalCount = len(fetchRes.Data)

	return fetchRes, nil
}

func (v *virtualEngineRepo) FetchCount(ctx context.Context, script string, timeout uint32) (totalCount int64, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "virtualEngine", trace.WithSpanKind(trace.SpanKindClient))
	defer func() { goframetrace.TelemetrySpanEnd(span, err) }()

	reqBody := struct {
		SQL  string `json:"sql"`
		TYPE int    `json:"type"`
	}{
		SQL:  script,
		TYPE: 0,
	}
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return 0, err
	}

	client := req.
		SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true}).
		SetTimeout(time.Duration(timeout) * time.Second).
		DevMode()

	response, err := client.R().
		// SetHeader("X-Presto-User", "admin").
		SetHeader("Authorization", "Bearer "+util.GetToken(ctx)).
		SetHeader("Content-Type", "application/json").
		SetBodyString(string(jsonBody)).
		// Post(settings.Instance.Services.VirtualEngine + "/api/virtual_engine_service/v1/fetch")
		Post(settings.Instance.Services.VirtualEngine + "/api/data-connection/v1/gateway/fetch")
	if err != nil {
		log.WithContext(ctx).Error("Fetch", zap.Error(err))
		return 0, errorcode.Detail(errorcode.QueryError, err.Error())
	}

	if response.StatusCode != 200 {
		fetchError := &FetchError{}
		err := response.UnmarshalJson(fetchError)
		if err != nil {
			log.WithContext(ctx).Error("Fetch", zap.String("body", response.String()), zap.String("script", script))
			return 0, err
		}
		log.WithContext(ctx).Error("Fetch", zap.String("body", response.String()), zap.String("script", script))
		var e string
		if fetchError.Solution != "" {
			e = fetchError.Solution
		} else if fetchError.Detail != "" {
			e = fetchError.Detail
		}
		return 0, errorcode.Detail(errorcode.QueryError, e)
	}

	fetchRawRes := &FetchRawRes{}
	d := json.NewDecoder(bytes.NewReader(response.Bytes()))
	d.UseNumber()
	err = d.Decode(fetchRawRes)
	if err != nil {
		log.WithContext(ctx).Error("Fetch decode response fail", zap.Error(err), zap.ByteString("body", response.Bytes()))
		return 0, err
	}

	b := (fetchRawRes.Data[0][0]).(json.Number)
	totalCount, err = b.Int64()
	if err != nil {
		log.WithContext(ctx).Error("Fetch decode response fail", zap.Error(err), zap.ByteString("body", response.Bytes()))
		return 0, err
	}
	return totalCount, nil

}

func (v *virtualEngineRepo) fetchResFilter(columns []Column, filters map[string]model.ServiceResponseFilter) bool {
	for _, column := range columns {
		filter, ok := filters[column.Name]
		if !ok {
			continue
		}

		if !v.fetchResFilterEach(column.Type, column.Value, filter) {
			return false
		}
	}

	return true
}

func (v *virtualEngineRepo) fetchResFilterEach(columnType string, value interface{}, filter model.ServiceResponseFilter) bool {
	index := strings.Index(columnType, "(")
	if index > 0 {
		columnType = columnType[0:index]
	}

	switch columnType {
	case "varchar", "char", "varbinary", "json":
		return v.stringCompare(cast.ToString(value), filter)
	case "tinyint", "smallint", "integer", "bigint":
		return v.intCompare(cast.ToInt64(value), filter)
	case "float", "double", "decimal":
		return v.floatCompare(cast.ToFloat64(value), filter)
	case "time", "datetime", "timestamp":
		return v.timeCompare(util.ToTime(value), filter)
	case "boolean":
		return v.booleanCompare(cast.ToBool(value), filter)
	}

	return false
}

// 运算逻辑 = 等于, != 不等于, > 大于, >= 大于等于, < 小于, <= 小于等于, like 模糊匹配, in 包含, not in 不包含
func (v *virtualEngineRepo) stringCompare(value string, filter model.ServiceResponseFilter) bool {
	switch filter.Operator {
	case "=":
		return value == filter.Value
	case "!=":
		return value != filter.Value
	case "like":
		return strings.Contains(value, filter.Value)
	case "in":
		array := strings.Split(filter.Value, ",")
		return util.InArrayString(array, value)
	case "not in":
		array := strings.Split(filter.Value, ",")
		return !util.InArrayString(array, value)
	}
	return false
}

func (v *virtualEngineRepo) intCompare(value int64, filter model.ServiceResponseFilter) bool {
	switch filter.Operator {
	case "=":
		return value == cast.ToInt64(filter.Value)
	case "!=":
		return value != cast.ToInt64(filter.Value)
	case ">":
		return value > cast.ToInt64(filter.Value)
	case ">=":
		return value >= cast.ToInt64(filter.Value)
	case "<":
		return value < cast.ToInt64(filter.Value)
	case "<=":
		return value <= cast.ToInt64(filter.Value)
	case "in":
		array := strings.Split(filter.Value, ",")
		var arrayInt []int64
		for _, item := range array {
			arrayInt = append(arrayInt, cast.ToInt64(item))
		}
		return util.InArrayInt(arrayInt, value)
	case "not in":
		array := strings.Split(filter.Value, ",")
		var arrayInt []int64
		for _, item := range array {
			arrayInt = append(arrayInt, cast.ToInt64(item))
		}
		return !util.InArrayInt(arrayInt, value)
	}
	return false
}

func (v *virtualEngineRepo) floatCompare(value float64, filter model.ServiceResponseFilter) bool {
	switch filter.Operator {
	case "=":
		return value == cast.ToFloat64(filter.Value)
	case "!=":
		return value != cast.ToFloat64(filter.Value)
	case ">":
		return value > cast.ToFloat64(filter.Value)
	case ">=":
		return value >= cast.ToFloat64(filter.Value)
	case "<":
		return value < cast.ToFloat64(filter.Value)
	case "<=":
		return value <= cast.ToFloat64(filter.Value)
	case "in":
		array := strings.Split(filter.Value, ",")
		var arrayInt []float64
		for _, item := range array {
			arrayInt = append(arrayInt, cast.ToFloat64(item))
		}
		return util.InArrayFloat(arrayInt, value)
	case "not in":
		array := strings.Split(filter.Value, ",")
		var arrayInt []float64
		for _, item := range array {
			arrayInt = append(arrayInt, cast.ToFloat64(item))
		}
		return !util.InArrayFloat(arrayInt, value)
	}

	return false
}

func (v *virtualEngineRepo) timeCompare(value time.Time, filter model.ServiceResponseFilter) bool {
	switch filter.Operator {
	case "=":
		return value.Equal(util.ToTime(filter.Value))
	case "!=":
		return !value.Equal(util.ToTime(filter.Value))
	case ">":
		return value.Sub(util.ToTime(filter.Value)) > 0
	case ">=":
		return value.Sub(util.ToTime(filter.Value)) >= 0
	case "<":
		return value.Sub(util.ToTime(filter.Value)) < 0
	case "<=":
		return value.Sub(util.ToTime(filter.Value)) <= 0
	case "in":
		array := strings.Split(filter.Value, ",")
		var arrayTime []time.Time
		for _, item := range array {
			arrayTime = append(arrayTime, util.ToTime(item))
		}
		return util.InArrayTime(arrayTime, value)
	case "not in":
		array := strings.Split(filter.Value, ",")
		var arrayTime []time.Time
		for _, item := range array {
			arrayTime = append(arrayTime, util.ToTime(item))
		}
		return !util.InArrayTime(arrayTime, value)
	}
	return false
}

func (v *virtualEngineRepo) booleanCompare(value bool, filter model.ServiceResponseFilter) bool {
	switch filter.Operator {
	case "=":
		return value == cast.ToBool(filter.Value)
	case "!=":
		return value != cast.ToBool(filter.Value)
	case "in":
		array := strings.Split(filter.Value, ",")
		var arrayBool []bool
		for _, item := range array {
			arrayBool = append(arrayBool, cast.ToBool(item))
		}
		return util.InArrayBool(arrayBool, value)
	case "not in":
		array := strings.Split(filter.Value, ",")
		var arrayBool []bool
		for _, item := range array {
			arrayBool = append(arrayBool, cast.ToBool(item))
		}
		return !util.InArrayBool(arrayBool, value)
	}
	return false
}
