package info_system

import (
	"context"

	api_data_catalog_frontend_v1 "github.com/kweaver-ai/idrm-go-common/api/data_catalog/frontend/v1"
)

type Interface interface {
	// Search 搜索信息系统
	Search(ctx context.Context, search *api_data_catalog_frontend_v1.InfoSystemSearch) (*api_data_catalog_frontend_v1.InfoSystemSearchResult, error)
}
