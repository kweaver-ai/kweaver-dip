package data_catalog

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/middleware"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/trace_util"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

const spanNamePre = "uc DataCatalogUseCase "

type Service interface {
	Search(c *gin.Context)
	Statistics(c *gin.Context)
}

type RestServiceV1 struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) Service {
	return &RestServiceV1{uc: uc}
}

// Search 搜索数据目录
//
//	@Description	搜索数据目录
//	@Tags			数据目录
//	@Summary		搜索数据目录
//	@Accept			application/json
//	@Produce		application/json
//	@Param			query			query		domain.SearchReqQueryParam	true	"请求参数"
//	@Param			body			body		domain.SearchReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.SearchRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/basic-search/v1/data-catalog/search [post]
func (s RestServiceV1) Search(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.SearchReqParam](c)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to validate SearchReqParam, err info: %v", err.Error())
		s.errResp(c, err)
		return
	}

	if req.Size < 1 {
		req.Size = 20
	}

	reqJson := string(lo.T2(json.Marshal(req)).A)
	log.WithContext(c.Request.Context()).Infof("data catalog search req: %s", reqJson)
	resp, err := s.uc.Search(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to search data catalog, req: %s, err: %v", reqJson, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Statistics 获取统计信息
//
//	@Description	获取统计信息
//	@Tags			数据目录
//	@Summary		获取统计信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			body			body		domain.StatisticsReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.StatisticsRespParam		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/basic-search/v1/data-catalog/statistics [post]
func (s RestServiceV1) Statistics(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.StatisticsReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	reqJson := string(lo.T2(json.Marshal(req)).A)
	log.Infof("data catalog statistics req: %s", reqJson)
	resp, err := traceDomainFunc(c, "Statistics", req, s.uc.Statistics)
	if err != nil {
		log.Errorf("failed to add tree node, req: %s, err: %v", reqJson, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s RestServiceV1) errResp(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}

func traceDomainFunc[A1 any, R1 any, R2 any](ctx context.Context, methodName string, a1 A1, f trace_util.A1R2Func[A1, R1, R2]) (R1, R2) {
	return trace_util.TraceA1R2(ctx, spanNamePre+methodName, a1, f)
}
