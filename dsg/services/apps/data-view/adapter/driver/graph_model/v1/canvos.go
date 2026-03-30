package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ = new(response.IDResp)

// SaveCanvas 保存画布
//
//	@Description	保存画布
//	@Tags			图谱模型
//	@Summary		保存画布
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_			    body		domain.CanvasContent	true	"请求参数"
//	@Success		200				{object}	response.IDResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/canvas   [POST]
func (s *Service) SaveCanvas(c *gin.Context) {
	req := form_validator.Valid[domain.CanvasContentParam](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.CanvasContent, s.uc.SaveCanvas)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetCanvas 获取画布
//
//	@Description	获取画布
//	@Tags			图谱模型
//	@Summary		获取画布
//	@Accept			plain/text
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"画布ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	domain.CanvasContent	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/canvas/{id} [GET]
func (s *Service) GetCanvas(c *gin.Context) {
	req := form_validator.Valid[request.IDPathReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.IDReq, s.uc.GetCanvas)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
