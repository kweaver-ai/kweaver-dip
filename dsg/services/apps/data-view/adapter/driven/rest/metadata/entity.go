package metadata

import (
	"context"
	"encoding/json"
)

type DrivenMetadata interface {
	GetDataTables(ctx context.Context, req *GetDataTablesReq) ([]*GetDataTablesDataRes, error)
	GetDataTableDetail(ctx context.Context, req *GetDataTableDetailReq) (*GetDataTableDetailRes, error)
	GetDataTableDetailBatch(ctx context.Context, req *GetDataTableDetailBatchReq) (*GetDataTableDetailBatchRes, error)
	DoCollect(ctx context.Context, req *DoCollectReq) (*DoCollectRes, error) //采集元数据
	GetTasks(ctx context.Context, req *GetTasksReq) (*GetTasksRes, error)
}

//region GetDataTables

type GetDataTablesReq struct {
	Offset       int    `json:"offset"`
	Limit        int    `json:"limit"`
	Keyword      string `json:"keyword"`
	DataSourceId uint64 `json:"data_source_id"`
	SchemaId     string `json:"schema_id"`
	Ids          string `json:"ids"`
	Sort         string `json:"sort"`
	Direction    string `json:"direction"`
	CheckField   bool   `json:"checkField"`
}
type GetDataTablesRes struct {
	Code        string                  `json:"code"`
	Description string                  `json:"description"`
	Solution    string                  `json:"solution"`
	TotalCount  int                     `json:"total_count"`
	Data        []*GetDataTablesDataRes `json:"data"`
}
type GetDataTablesDataRes struct {
	DataSourceType     int            `json:"data_source_type"`
	DataSourceTypeName string         `json:"data_source_type_name"`
	DataSourceId       string         `json:"data_source_id"`
	DataSourceName     string         `json:"data_source_name"`
	SchemaId           string         `json:"schema_id"`
	SchemaName         string         `json:"schema_name"`
	Id                 string         `json:"id"`
	Name               string         `json:"name"`
	AdvancedParams     string         `json:"advanced_params"`
	AdvancedDataSlice  []AdvancedData `json:"advanced_data_slice"`
	CreateTime         string         `json:"create_time"`
	CreateTimeStamp    string         `json:"create_time_stamp"`
	UpdateTime         string         `json:"update_time"`
	UpdateTimeStamp    string         `json:"update_time_stamp"`
	TableRows          string         `json:"table_rows"`
	HaveField          bool           `json:"have_field"`
}

type AdvancedData struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

//endregion

//region GetDataTableDetail

type GetDataTableDetailReq struct {
	DataSourceId uint64 `json:"data_source_id"`
	SchemaId     string `json:"schema_id"`
	TableId      string `json:"table_id"`
}

type GetDataTableDetailRes struct {
	Code        string                       `json:"code"`
	Description string                       `json:"description"`
	Solution    string                       `json:"solution"`
	Data        []*GetDataTableDetailDataRes `json:"data"`
}
type GetDataTableDetailDataRes struct {
	Name           string            `json:"name"`
	AdvancedParams []*AdvancedParams `json:"advanced_params"`
	Fields         []*Fields         `json:"fields"`
}

type AdvancedParams struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type Fields struct {
	ID             string `json:"id"`
	FieldName      string `json:"field_name"`
	FieldLength    int    `json:"field_length"`
	FieldPrecision int    `json:"field_precision"`
	FieldComment   string `json:"field_comment"`
	AdvancedParams int    `json:"advanced_params"`
	FieldTypeName  string `json:"field_type_name"`
}

//endregion

//region GetDataTableDetailBatch

type GetDataTableDetailBatchReq struct {
	Limit        int    `json:"limit"`
	Offset       int    `json:"offset"`
	DataSourceId uint64 `json:"data_source_id"`
	SchemaId     string `json:"schema_id"`
	//TableIds     []string `json:"table_ids"`
}

type GetDataTableDetailBatchRes struct {
	Code        string                            `json:"code"`
	Description string                            `json:"description"`
	TotalCount  int                               `json:"total_count"`
	Solution    string                            `json:"solution"`
	Data        []*GetDataTableDetailDataBatchRes `json:"data"`
}
type GetDataTableDetailDataBatchRes struct {
	SchemaId                  string              `json:"schema_id"`
	SchemaName                string              `json:"schema_name"`
	Id                        string              `json:"id"`
	Name                      string              `json:"name"`
	OrgName                   string              `json:"org_name"`
	Description               string              `json:"description"`
	AdvancedParams            AdvancedParamStruct `json:"_"`
	AdvancedParamMap          map[string]string   `json:"-"`
	AdvancedParamMapAvailable bool                `json:"-"`
	AdvancedParamsO           string              `json:"advanced_params"`
	HaveField                 bool                `json:"have_field"`
	Fields                    []*FieldsBatch      `json:"fields"`
}

type FieldsBatch struct {
	ID                        string              `json:"id"`
	FieldName                 string              `json:"field_name"`
	OrgFieldName              string              `json:"org_field_name"`
	FieldLength               int32               `json:"field_length"`
	FieldPrecision            *int32              `json:"field_precision"`
	FieldComment              string              `json:"field_comment"`
	AdvancedParams            AdvancedParamStruct `json:"_"`
	AdvancedParamMap          map[string]string   `json:"-"`
	AdvancedParamMapAvailable bool                `json:"-"`
	AdvancedParamsO           string              `json:"advanced_params"`
	FieldTypeName             string              `json:"field_type_name"`
}
type AdvancedParamStruct []*AdvancedParams

func (r GetDataTableDetailBatchRes) SerializeAdvancedParams() (err error) {
	for _, data := range r.Data {
		err = json.Unmarshal([]byte(data.AdvancedParamsO), &data.AdvancedParams)
		if err != nil {
			return err
		}
		for _, field := range data.Fields {
			err = json.Unmarshal([]byte(field.AdvancedParamsO), &field.AdvancedParams)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
func (r GetDataTableDetailBatchRes) AdvancedParamsToMap() {
	for _, data := range r.Data {
		data.AdvancedParamMap = make(map[string]string, len(data.AdvancedParams))
		for _, param := range data.AdvancedParams {
			data.AdvancedParamMap[param.Key] = param.Value
		}
		for _, field := range data.Fields {
			field.AdvancedParamMap = make(map[string]string, len(field.AdvancedParams))
			for _, fieldParam := range field.AdvancedParams {
				data.AdvancedParamMap[fieldParam.Key] = fieldParam.Value
			}
			field.AdvancedParamMapAvailable = true
		}
		data.AdvancedParamMapAvailable = true
	}
}
func (s AdvancedParamStruct) GetValue(key string) string {
	for _, params := range s {
		if params.Key == key {
			return params.Value
		}
	}
	return ""
}
func (s AdvancedParamStruct) IsPrimaryKey() bool {
	for _, params := range s {
		if params.Key == "checkPrimaryKey" && params.Value == "YES" {
			return true
		}
		if params.Key == "checkPrimaryKey" && params.Value == "NO" {
			return false
		}
	}
	return false
}

//endregion

//region DoCollect

type DoCollectReq struct {
	DataSourceId uint64 `json:"data_source_id"`
}
type DoCollectRes struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Solution    string `json:"solution"`
	Data        string `json:"data"`
}

//endregion

//region DoCollect

type GetTasksReq struct {
	Keyword string `json:"keyword"`
}
type GetTasksRes struct {
	Code        string  `json:"code"`
	Description string  `json:"description"`
	Solution    string  `json:"solution"`
	Data        []*Data `json:"data"`
}
type Data struct {
	ID         string `json:"id"`
	ObjectId   string `json:"object_id"`
	ObjectType int    `json:"object_type"`
	Name       string `json:"name"`
	Status     int    `json:"status"`
}

//endregion
