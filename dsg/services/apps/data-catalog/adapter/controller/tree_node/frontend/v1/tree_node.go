package v1

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/trace_util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

const (
	defaultDataResourceClassificationTreeID models.ModelID = "1"
)

const spanNamePre = "uc TreeNodeUseCase "

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// List 获取父节点下的子目录分类列表（树形结构使用）
//
//	@Description	获取父节点下的子目录分类列表（树形结构使用）
//	@Tags			目录分类前台接口
//	@Summary		获取父节点下的子目录分类列表（树形结构使用）
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				query		domain.ListReqQueryParam	true	"请求参数"
//	@Success		200				{object}	domain.ListRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/frontend/v1/trees/nodes [get]
func (s *Service) List(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.ListReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if len(req.TreeID) < 1 || req.TreeID.Uint64() < 1 {
		req.TreeID = defaultDataResourceClassificationTreeID
	}

	resp, err := traceDomainFunc(c, "List", req, s.uc.List)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list tree nodes, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}
	if len(resp.Entries) == 0 {
		resp.Entries = make([]*domain.SubNode, 0)
	}

	ginx.ResOKJson(c, resp)
}

func (s *Service) errResp(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}

func traceDomainFunc[A1 any, R1 any, R2 any](ctx context.Context, methodName string, a1 A1, f trace_util.A1R2Func[A1, R1, R2]) (R1, R2) {
	return trace_util.TraceA1R2(ctx, spanNamePre+methodName, a1, f)
}
