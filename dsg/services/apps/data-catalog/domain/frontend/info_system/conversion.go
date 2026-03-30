package info_system

import (
	"go.uber.org/zap"

	api_basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	api_data_catalog_frontend_v1 "github.com/kweaver-ai/idrm-go-common/api/data_catalog/frontend/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func convert_BasicSearchV1_Total_Into_DataCatalogV1_Total(in *api_basic_search_v1.Total, out *api_data_catalog_frontend_v1.Total) {
	out.Value = in.Value
	out.Relation = convert_BasicSearchV1_TotalRelation_To_DataCatalogV1_TotalRelation(in.Relation)
}
func convert_BasicSearchV1_Total_To_DataCatalogV1_Total(in *api_basic_search_v1.Total) (out *api_data_catalog_frontend_v1.Total) {
	if in == nil {
		return
	}
	out = new(api_data_catalog_frontend_v1.Total)
	return
}

func convert_BasicSearchV1_TotalRelation_To_DataCatalogV1_TotalRelation(in api_basic_search_v1.TotalRelation) (out api_data_catalog_frontend_v1.TotalRelation) {
	switch in {
	case api_basic_search_v1.TotalEqual:
		out = api_data_catalog_frontend_v1.TotalEqual
	case api_basic_search_v1.TotalGreaterThanOrEqual:
		out = api_data_catalog_frontend_v1.TotalGreaterThanOrEqual
	default:
		log.Warn("unsupported total relation", zap.Any("value", in))
	}
	return
}
