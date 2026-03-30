package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/middleware"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category/module_config"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type CategoryModuleConfigService struct {
	uc domain.UseCase
}

func NewCategoryModuleConfigService(uc domain.UseCase) *CategoryModuleConfigService {
	return &CategoryModuleConfigService{uc: uc}
}

func (s *CategoryModuleConfigService) Get(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.GetReq](c)
	if err != nil {
		s.errResp(c, err)
		return
	}
	resp, err := s.uc.Get(c.Request.Context(), req)
	if err != nil {
		s.errResp(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (s *CategoryModuleConfigService) SaveAll(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.SaveAllReq](c)
	if err != nil {
		s.errResp(c, err)
		return
	}
	err = s.uc.SaveAll(c.Request.Context(), req)
	if err != nil {
		s.errResp(c, err)
		return
	}
	ginx.ResOKJson(c, map[string]string{"status": "ok"})
}

func (s *CategoryModuleConfigService) Update(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.UpdateReq](c)
	if err != nil {
		s.errResp(c, err)
		return
	}
	err = s.uc.Update(c.Request.Context(), req)
	if err != nil {
		s.errResp(c, err)
		return
	}
	ginx.ResOKJson(c, map[string]string{"status": "ok"})
}

func (s *CategoryModuleConfigService) errResp(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}
