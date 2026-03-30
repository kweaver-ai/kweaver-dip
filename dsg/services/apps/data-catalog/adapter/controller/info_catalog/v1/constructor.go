package v1

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
)

type Controller struct {
	infoCatalog    info_resource_catalog.InfoResourceCatalogDomain
	infoCatalogNew *info_catalog.InfoCatalogDomain
}

func NewController(domain info_resource_catalog.InfoResourceCatalogDomain, infoCatalogNew *info_catalog.InfoCatalogDomain) *Controller {
	return &Controller{
		infoCatalog:    domain,
		infoCatalogNew: infoCatalogNew,
	}
}

func (ctrl *Controller) setDefaultValue(params any) {
	if s, ok := params.(*info_resource_catalog.SortParams); ok && s != nil && s.Direction == nil {
		s.Direction = new(string)
		*s.Direction = "desc"
	}
	if p, ok := params.(info_resource_catalog.PaginationParam); ok {
		if p.Limit == nil {
			p.Limit = new(int)
			*p.Limit = 10
		}
		if p.PageNumber == nil {
			p.PageNumber = new(int)
			*p.PageNumber = 1
		}
	}
}
