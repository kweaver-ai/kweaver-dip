package indicator

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/middleware"
	domain "github.com/kweaver-ai/dsg/services/apps/basic-search/domain/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) Service {
	return Service{uc: uc}
}

func (s *Service) Search(c *gin.Context) {
	req, err := middleware.GetReqParam[domain.SearchReqParam](c)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to validate SearchReqParam, err info: %v", err.Error())
		s.errResp(c, err)
		return
	}
	reqJson := string(lo.T2(json.Marshal(req)).A)
	resp, err := s.uc.Search(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to search interface-svc, req: %s, err info: %v", reqJson, err.Error())
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s *Service) errResp(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}
