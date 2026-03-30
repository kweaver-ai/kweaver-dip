package v1

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/data_resource"
)

type Controller struct {
	domain data_resource.DataResourceDomain
}

func NewController(d data_resource.DataResourceDomain) *Controller {
	return &Controller{domain: d}
}
