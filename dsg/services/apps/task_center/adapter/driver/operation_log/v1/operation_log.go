package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/operation_log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"

	"go.uber.org/zap"
)

var _ response.PageResult

type Service struct {
	userCase operation_log.UserCase
}

func NewService(u operation_log.UserCase) *Service {
	return &Service{
		userCase: u,
	}
}

// QueryOperationLog  godoc
//
//	@Summary		查询操作日志
//	@Description	查询模块操作日志
//	@Accept			application/json
//	@Produce		application/json
//	@param			obj	query	operation_log.OperationLogQueryParams	true	"操作日志查询参数"
//	@Tags			日志操作
//	@Success		200	{object}	response.PageResult{entries=operation_log.OperationLogListModel}
//	@Failure		400	{object}	rest.HttpError
//	@Router			/operation   [GET]
func (o *Service) QueryOperationLog(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	queryParams := new(operation_log.OperationLogQueryParams)
	valid, errs := form_validator.BindQueryAndValid(c, queryParams)
	if !valid {
		log.WithContext(ctx).Error("QueryOperationLog BindQueryAndValid error ", zap.Error(errs))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	logs, err := o.userCase.Query(ctx, queryParams)
	if err != nil {
		log.WithContext(ctx).Error("QueryOperationLog error", zap.Error(err))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, logs)
	return
}
