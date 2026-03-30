package menu

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/menu"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc menu.UseCase
}

func NewService(uc menu.UseCase) *Service {
	return &Service{uc: uc}
}

func (s *Service) SetMenus(c *gin.Context) {
	req := menu.SetMenusReq{}
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	err := util.TraceA1R1(c, req, s.uc.SetMenus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}

// GetMenus
// @Summary     获取菜单
// @Description 获取菜单
// @Tags        菜单
// @Accept      application/json
// @Produce     json
// @Param       belong   query   menu.GetMenusReq     true "查询参数"
// @Success     200 {object}  menu.GetMenusRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /menus [get]
func (s *Service) GetMenus(c *gin.Context) {
	req := menu.GetMenusReq{}
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	req.Platform = menu.ResourceToPlatform(req.ResourceType)
	res, err := util.TraceA1R2(c, &req, s.uc.GetMenus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// PermissionMenus
// @Summary     获取权限菜单
// @Description 获取权限菜单
// @Tags        菜单
// @Accept      application/json
// @Produce     json
// @Param       belong   query   menu.GetMenusReq     true "查询参数"
// @Success     200 {object}  menu.GetMenusRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /menus [get]
func (s *Service) PermissionMenus(c *gin.Context) {
	req := menu.PermissionMenusReq{}
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	req.Platform = menu.ResourceToPlatform(req.ResourceType)
	res, err := util.TraceA1R2(c, &req, s.uc.GetPermissionMenus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetAllMenus  获取所有菜单
func (s *Service) GetAllMenus(c *gin.Context) {
	res, err := util.TraceA0R2(c, s.uc.GetResourceMenuKeys)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
