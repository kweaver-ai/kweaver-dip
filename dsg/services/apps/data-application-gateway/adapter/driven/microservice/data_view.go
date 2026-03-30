package microservice

import (
	"context"
	"errors"
	"strings"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type DataViewGetRes struct {
	Fields                []DataViewField `json:"fields"`
	LastPublishTime       int64           `json:"last_publish_time"`
	TechnicalName         string          `json:"technical_name"`
	BusinessName          string          `json:"business_name"`
	Status                string          `json:"status"`
	DatasourceType        string          `json:"datasource_type"`
	ViewSourceCatalogName string          `json:"view_source_catalog_name"`
}

type DataViewField struct {
	Id               string `json:"id"`
	TechnicalName    string `json:"technical_name"`
	BusinessName     string `json:"business_name"`
	Status           string `json:"status"`
	PrimaryKey       bool   `json:"primary_key"`
	DataType         string `json:"data_type"`
	DataLength       int    `json:"data_length"`
	DataAccuracy     int    `json:"data_accuracy"`
	OriginalDataType string `json:"original_data_type"`
	IsNullable       string `json:"is_nullable"`
}

type DataViewListRes struct {
	Entries []struct {
		Id                    string `json:"id"`
		TechnicalName         string `json:"technical_name"`
		BusinessName          string `json:"business_name"`
		Type                  string `json:"type"`
		DatasourceId          string `json:"datasource_id"`
		Datasource            string `json:"datasource"`
		DatasourceType        string `json:"datasource_type"`
		Status                string `json:"status"`
		PublishAt             int64  `json:"publish_at"`
		EditStatus            string `json:"edit_status"`
		MetadataFormId        string `json:"metadata_form_id"`
		CreatedAt             int64  `json:"created_at"`
		CreatedBy             string `json:"created_by"`
		UpdatedAt             int64  `json:"updated_at"`
		UpdatedBy             string `json:"updated_by"`
		ViewSourceCatalogName string `json:"view_source_catalog_name"`
	} `json:"entries"`
	TotalCount   int `json:"total_count"`
	LastScanTime int `json:"last_scan_time"`
}

type DataViewRepo interface {
	// DataViewGet 数据视图详情
	DataViewGet(ctx context.Context, id string) (res *DataViewGetRes, err error)
	// DataViewList 数据视图列表
	DataViewList(ctx context.Context, ids []string) (res *DataViewListRes, err error)
	// ParseViewSourceCatalogName 解析 catalog 名称
	ParseViewSourceCatalogName(viewSourceCatalogName string) (catalogName, schemaName string)
}

type dataViewRepo struct{}

func NewDataViewRepo() DataViewRepo {
	return &dataViewRepo{}
}

func (u *dataViewRepo) DataViewGet(ctx context.Context, id string) (res *DataViewGetRes, err error) {
	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.DataView + "/api/data-view/v1/form-view/" + id)
	if err != nil {
		log.WithContext(ctx).Error("DataViewGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataViewGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.PublicInternalError, resp.String())
	}

	res = &DataViewGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataViewGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	return res, nil
}

func (u *dataViewRepo) DataViewList(ctx context.Context, ids []string) (res *DataViewListRes, err error) {
	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParam("form_view_ids", strings.Join(ids, ",")).
		Get(settings.Instance.Services.DataView + "/api/data-view/v1/form-view")
	if err != nil {
		log.WithContext(ctx).Error("DataViewList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataViewList", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.PublicInternalError, resp.String())
	}

	res = &DataViewListRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataViewList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	return res, nil
}

func (u *dataViewRepo) ParseViewSourceCatalogName(viewSourceCatalogName string) (catalogName, schemaName string) {
	if viewSourceCatalogName == "" {
		return
	}
	// vdm_e6333421a0624289bc00ef02d3ec569a.default
	ViewSourceCatalogNameSplit := strings.Split(viewSourceCatalogName, ".")
	// vdm_e6333421a0624289bc00ef02d3ec569a
	catalogName = ViewSourceCatalogNameSplit[0]

	if len(ViewSourceCatalogNameSplit) == 2 {
		// default
		schemaName = ViewSourceCatalogNameSplit[1]
	} else {
		schemaName = "default"
	}

	return
}
