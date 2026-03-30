package v1

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/cognitive_service_system"
)

var _ response.PageResult[string]

type Controller struct {
	css cognitive_service_system.CognitiveServiceSystemDomain
}

func NewController(css cognitive_service_system.CognitiveServiceSystemDomain) *Controller {
	return &Controller{css: css}
}
