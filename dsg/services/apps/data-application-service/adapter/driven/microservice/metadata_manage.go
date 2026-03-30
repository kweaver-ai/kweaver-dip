package microservice

import (
	"context"
	"errors"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type MetadataManageTableGetRes struct {
	Code        string  `json:"code"`
	Description string  `json:"description"`
	TotalCount  int64   `json:"total_count"`
	Solution    string  `json:"solution"`
	Data        []Table `json:"data"`
}

type Table struct {
	DataSourceType     int    `json:"data_source_type"`
	DataSourceTypeName string `json:"data_source_type_name"`
	DataSourceId       string `json:"data_source_id"`
	DataSourceName     string `json:"data_source_name"`
	SchemaId           string `json:"schema_id"`
	SchemaName         string `json:"schema_name"`
	Id                 string `json:"id"`
	Name               string `json:"name"`
	Description        string `json:"description"`
	AdvancedParams     string `json:"advanced_params"`
	CreateTime         string `json:"create_time"`
	CreateTimeStamp    string `json:"create_time_stamp"`
	UpdateTime         string `json:"update_time"`
	UpdateTimeStamp    string `json:"update_time_stamp"`
	TableRows          string `json:"table_rows"`
}

type TableAdvancedParam struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type MetadataManage interface {
	// TableGet 元数据表详情
	TableGet(ctx context.Context, tableId string) (res *MetadataManageTableGetRes, err error)
}

type metadataManage struct{}

func NewMetadataManageRepo() MetadataManage {
	return &metadataManage{}
}

func (u *metadataManage) TableGet(ctx context.Context, tableId string) (res *MetadataManageTableGetRes, err error) {
	// 获取元数据平台表详情
	//req.DevMode()

	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParam("ids", tableId).
		Get(settings.Instance.Services.MetadataManage + "/api/metadata-manage/v1/table")
	if err != nil {
		log.WithContext(ctx).Error("MetadataManageTableGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("MetadataManageTableGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &MetadataManageTableGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("MetadataManageTableGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return res, nil
}
