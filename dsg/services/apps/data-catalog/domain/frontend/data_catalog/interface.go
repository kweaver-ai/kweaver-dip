package data_catalog

import (
	"context"

	fcommon "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"
)

type DataResourceCatalogDomain interface {
	Search(ctx context.Context, keyword string, filter DataCatalogSearchFilter, nextFlag NextFlag) (*fcommon.SearchResult, error)
	SearchForOper(ctx context.Context, keyword string, filter DataCatalogSearchFilterForOper, nextFlag NextFlag) (*fcommon.SearchResult, error)
}
