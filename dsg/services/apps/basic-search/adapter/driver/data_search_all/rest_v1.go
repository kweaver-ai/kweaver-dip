package data_search_all

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/middleware"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/trace_util"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_search_all"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

const spanNamePre = "uc DataSearchAllUseCase "

type Service interface {
	SearchAll(c *gin.Context)
	//Statistics(c *gin.Context)
}

type RestServiceV1 struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) Service {
	return &RestServiceV1{uc: uc}
}

// SearchAll 搜索数据视图和接口服务
//
//	@Description	搜索数据视图和接口服务
//	@Tags			数据资源
//	@Summary		搜索数据视图和接口服务
//	@Accept			application/json
//	@Produce		application/json
//	@Param			body			body		domain.SearchReqBodyParam	true	"请求参数"
//	@Success		200				{object}	domain.SearchAllRespParam		    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError				        "失败响应参数"
//	@Router			/api/basic-search/v1/data-resource/search [post]
func (s RestServiceV1) SearchAll(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.SearchAllReqParam](c)
	if err != nil {
		s.errResp(c, err)
		return
	}

	if req.Size < 1 {
		req.Size = 20
	}

	reqJson := string(lo.T2(json.Marshal(req)).A)
	log.Infof("data_resources search req: %s", reqJson)
	resp, err := traceDomainFunc(c, "Search", req, s.uc.SearchAll)
	if err != nil {
		log.Errorf("failed to search all data , req: %s, err: %v", reqJson, err)
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
