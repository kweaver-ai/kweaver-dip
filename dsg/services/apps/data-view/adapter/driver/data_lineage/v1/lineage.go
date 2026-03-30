package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_lineage"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc data_lineage.UseCase
}

func NewFormViewService(uc data_lineage.UseCase) *Service {
	return &Service{uc: uc}
}

// GetBase 前台下的获取base节点及相关信息
//
//	@Description	前台下的获取base节点及相关信息
//	@Tags			open数据服务超市
//	@Summary		前台下的获取base节点及相关信息
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					true	"token"
//	@Param			catalogID		path		string					true	"数据资源目录ID"
//	@Success		200				{object}	data_lineage.GetBaseResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/data-lineage/{catalogID}/base [get]
func (s *Service) GetBase(c *gin.Context) {
	req := form_validator.Valid[data_lineage.GetBaseReqParam](c)
	if req == nil {
		return
	}
	base, err := util.TraceA1R2(c, req, s.uc.GetBase)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, base)
}

// ListLineage 前台下的分页获取指定节点上一度血缘关系
//
//	@Description	前台下的分页获取指定节点上一度血缘关系
//	@Tags			open数据服务超市
//	@Summary		前台下的分页获取指定节点上一度血缘关系
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			vid      		path		string					        true	"节点实体ID"
//	@Param			_				query		data_lineage.ListLineageReqParamQuery	true	"请求参数"
//	@Success		200				{object}	data_lineage.ListLineageResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/data-lineage/pre/{vid} [get]
func (s *Service) ListLineage(c *gin.Context) {
	req := form_validator.Valid[data_lineage.ListLineageReqParam](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.ListLineage)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list lineage, req: %#v, err: %v", req, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s *Service) ParserLineage(c *gin.Context) {
	req := form_validator.Valid[data_lineage.ParseLineageParamReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.ParserLineage)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list lineage, req: %#v, err: %v", req, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
