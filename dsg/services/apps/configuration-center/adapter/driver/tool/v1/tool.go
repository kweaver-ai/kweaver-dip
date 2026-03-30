package tool

import (
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/tool"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// List 获取工具列表
// @Description 获取工具列表
// @Tags        工具管理
// @Summary     获取工具列表
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Success     200 {object} response.PageResult{entries=domain.SummaryInfo} "成功响应参数"
// @Failure     400 {object} rest.HttpError                                  "失败响应参数"
// @Router      /tools [get]
func (s *Service) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	res, total, err := s.uc.List(ctx)
	if err != nil {
		log.WithContext(ctx).Error("failed to get tool list", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	log.Infof("get tool list req, res: %v, total: %v", res, total)
	ginx.ResList(c, res, int(total))
}
