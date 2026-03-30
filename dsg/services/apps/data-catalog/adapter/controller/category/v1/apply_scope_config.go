package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/middleware"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category/apply_scope_config"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type CategoryApplyScopeConfigService struct{ uc domain.UseCase }

func NewCategoryApplyScopeConfigService(uc domain.UseCase) *CategoryApplyScopeConfigService {
	return &CategoryApplyScopeConfigService{uc: uc}
}

// Get 获取类目-应用范围配置
//
//	@Description	获取所有类目及配置（不需要category_id，返回所有类目及配置）
//	@Tags			类目管理
//	@Summary		获取类目-应用范围配置
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_				query		domain.GetReqParam		false	"查询参数"
//	@Success		200				{object}	domain.GetResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/category/apply-scope-config [get]
func (s *CategoryApplyScopeConfigService) Get(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.GetReqParam](c)
	if err != nil {
		s.err(c, err)
		return
	}
	resp, err := s.uc.Get(c.Request.Context(), req.Keyword)
	if err != nil {
		s.err(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Update 更新类目-应用范围配置
//
//	@Description	全量覆盖指定类目的模块树配置
//	@Tags			类目管理
//	@Summary		更新类目-应用范围配置
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			category_id		path		string					true	"类目ID，uuid"
//	@Param			_				body		domain.UpdateReqParam	true	"请求参数"
//	@Success		200				{object}	map[string]string		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/category/{category_id}/apply-scope-config [put]
func (s *CategoryApplyScopeConfigService) Update(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.UpdateReqParam](c)
	if err != nil {
		s.err(c, err)
		return
	}
	if err := s.uc.Update(c.Request.Context(), req.CategoryID, req.Items); err != nil {
		s.err(c, err)
		return
	}
	ginx.ResOKJson(c, map[string]string{"status": "ok"})
}

func (s *CategoryApplyScopeConfigService) err(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}
