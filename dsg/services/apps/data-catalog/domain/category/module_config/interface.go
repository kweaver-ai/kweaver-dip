package module_config

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	repoModel "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/middleware"
)

type UseCase interface {
	Get(ctx context.Context, req *GetReq) (*GetResp, error)
	SaveAll(ctx context.Context, req *SaveAllReq) error
	Update(ctx context.Context, req *UpdateReq) error
}

type ModuleItem struct {
	ModuleCode string `json:"module_code" binding:"required,oneof=interface_service data_resource_catalog info_resource_catalog"`
	Selected   bool   `json:"selected"`
	Required   bool   `json:"required"`
}

type GetReq struct {
	CategoryID string `json:"category_id" uri:"category_id" binding:"required,uuid"`
}

type GetResp struct {
	response.PageResult[ModuleItem]
}

type SaveAllReq struct {
	CategoryID string       `json:"category_id" uri:"category_id" binding:"required,uuid"`
	Items      []ModuleItem `json:"items" binding:"required,dive"`
}

type UpdateReq struct {
	CategoryID string     `json:"category_id" uri:"category_id" binding:"required,uuid"`
	Item       ModuleItem `json:"item" binding:"required"`
}

func (m ModuleItem) ToModel(user *middleware.User, categoryID string) *repoModel.CategoryModuleConfig {
	selected := 0
	if m.Selected {
		selected = 1
	}
	required := 0
	if m.Required {
		required = 1
	}
	return &repoModel.CategoryModuleConfig{
		CategoryID:  categoryID,
		ModuleCode:  m.ModuleCode,
		Selected:    selected,
		Required:    required,
		CreatorUID:  user.ID,
		CreatorName: user.Name,
		UpdaterUID:  user.ID,
		UpdaterName: user.Name,
	}
}
