package mdl_data_model

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
)

type DrivenMdlDataModel interface {
	GetDataViews(ctx context.Context, updateTimeStart int64, dataSourceId string, offset, limit int) (*GetDataViewsResp, error)
	GetDataView(ctx context.Context, viewIds []string) ([]*GetDataViewResp, error)
	UpdateDataView(ctx context.Context, viewId string, view *UpdateDataView) ([]*GetDataViewResp, error)
	DeleteDataView(ctx context.Context, viewId string) error
	QueryData(ctx context.Context, uid, ids string, body QueryDataBody) (*QueryDataResult, error)
}

type GetDataViewsResp struct {
	response.PageResult[DataViewInfo]
}

type DataViewInfo struct {
	Id             string   `json:"id"`
	Name           string   `json:"name"`
	TechnicalName  string   `json:"technical_name"`
	GroupId        string   `json:"group_id"`
	GroupName      string   `json:"group_name"`
	Type           string   `json:"type"`
	QueryType      string   `json:"query_type"`
	Tags           []string `json:"tags"`
	Comment        string   `json:"comment"`
	Builtin        bool     `json:"builtin"`
	CreateTime     int64    `json:"create_time"`
	UpdateTime     int64    `json:"update_time"`
	DataSourceType string   `json:"data_source_type"`
	DataSourceId   string   `json:"data_source_id"`
	DataSourceName string   `json:"data_source_name"`
	FileName       string   `json:"file_name"`
	Status         string   `json:"status"`
}

type GetDataViewResp struct {
	Id            string      `json:"id"`
	Name          string      `json:"name"`
	TechnicalName string      `json:"technical_name"`
	GroupId       string      `json:"group_id"`
	GroupName     string      `json:"group_name"`
	Type          string      `json:"type"`
	QueryType     string      `json:"query_type"`
	Tags          []string    `json:"tags"`
	Comment       string      `json:"comment"`
	Fields        []FieldInfo `json:"fields"`
	DataSourceId  string      `json:"data_source_id"`
	ModuleType    string      `json:"module_type"`
	CreateTime    int64       `json:"create_time"`
	UpdateTime    int64       `json:"update_time"`
	Creator       UserInfo    `json:"creator"`
	Updater       UserInfo    `json:"updater"`
	Status        string      `json:"status"`
}

type UserInfo struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Name string `json:"name"`
}

type FieldInfo struct {
	OriginalName      string `json:"original_name"`
	Name              string `json:"name"`
	DisplayName       string `json:"display_name"`
	Type              string `json:"type"`
	Comment           string `json:"comment"`
	DataLength        int32  `json:"data_length"`
	DataAccuracy      int32  `json:"data_accuracy"`
	Status            string `json:"status"`
	IsNullable        string `json:"is_nullable"`
	BusinessTimestamp bool   `json:"business_timestamp"`
}

type UpdateDataView struct {
	Name    string      `json:"name"`
	Comment string      `json:"comment"`
	Fields  []FieldInfo `json:"fields"`
}

type QueryDataBody struct {
	SQL string `json:"sql"`
	//Format         string `json:"format"`
	NeedTotal      bool     `json:"need_total"`
	UseSearchAfter bool     `json:"use_search_after"`
	SearchAfter    []string `json:"search_after,omitempty"`
}
type QueryDataResult struct {
	Entries        []map[string]any `json:"entries"`
	VegaDurationMS int              `json:"vega_duration_ms"`
	OverallMS      int              `json:"overall_ms"`
	TotalCount     int              `json:"total_count"`
	SearchAfter    []string         `json:"search_after,omitempty"`
}
