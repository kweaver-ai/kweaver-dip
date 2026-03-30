package sample_lineage

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
)

type ReqPathParams struct {
	CatalogID models.ModelID `uri:"catalogID" binding:"required,VerifyModelID"`
}

// GetDataCatalogSamplesQueryReqParam 默认样例数据去掉分页request.PageBaseInfo，后面写死第1页10条
type GetDataCatalogSamplesQueryReqParam struct {
	Type uint8 `form:"type" binding:"required,oneof=1 2"` // 1：默认样例数据，2：AI生成样例数据
	//FieldIDStr string `json:"fields" form:"fields" binding:"VerifyMultiSnowflakeIDString"` // 要获取的字段，传字段id并以逗号分隔，为空则获取全部字段
}

// GetDataCatalogSamplesReqParam 样例数据的入参
type GetDataCatalogSamplesReqParam struct {
	ReqPathParams
	//GetDataCatalogSamplesQueryReqParam
}

/*// ClearSampleCacheDataCatalogIDsReqParam 清除样例数据redis的缓存的入参
type ClearSampleCacheDataCatalogIDsReqParam struct {
	DataCatalogIDStr string `form:"ids" binding:"required,min=1"` // 数据目录ID，以逗号分隔，为all时则清除所有样例数据缓存
}

// ClearSampleCacheRespParam 清除样例数据redis的缓存的返回
type ClearSampleCacheRespParam struct {
	SuccessKeys             []string               `json:"success_keys"` // 样例数据缓存删除成功的key
	FailKeys                []string               `json:"fail_keys"`    // 样例数据缓存删除失败的key
	settings.SampleDataConf `json:"sample_config"` // 样例数据的配置
}*/

type Column struct {
	ID      uint64 `json:"id,string"`   // 唯一id
	CnTitle string `json:"cn_col_name"` // 样例数据的中文列标题
	EnTitle string `json:"en_col_name"` // 样例数据的英文列标题
}

// GetDataCatalogSamplesRespParam 样例数据返回前端的结构体
// 默认样例数据返回前10条，故不再需要 TotalCount int64  `json:"total_count"` // 样例数据总条数
type GetDataCatalogSamplesRespParam struct {
	IsAI       bool                `json:"is_ai"`                 // 生成类型，为true则是AI生成
	UpdateTime int64               `json:"update_time,omitempty"` // 最后更新时间
	Columns    []*Column           `json:"columns"`               // 字段信息
	Entries    []map[string]string `json:"entries"`               // 对象列表
}

// ADSampleDataRequestBody AD样例数据大模型接口入参结构体
type ADSampleDataRequestBody struct {
	Titles  []string `json:"titles"`
	Example []string `json:"example"`
	Differs []string `json:"differs"`
}

type ADSampleDataResObj struct {
	Count      int                 `json:"count"`
	SampleData []map[string]string `json:"sample_data"`
}

// ADSampleDataResponseBody AD样例数据大模型接口返回结构体
type ADSampleDataResponseBody struct {
	Res ADSampleDataResObj `json:"res"`
}
