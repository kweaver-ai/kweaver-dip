package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/data_masking"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	dc *data_masking.SqlMaskingDomain
}

func NewService(dc *data_masking.SqlMaskingDomain) *Service {
	ctl := &Service{dc: dc}
	return ctl
}

// DoMasking 数据脱敏模块
// @Description 数据脱敏
// @Tags        数据脱敏
// @Summary     数据脱敏
// @Accept      json
// @Produce     json
// @Param       _     body       data_masking.CreateReqBodyParams true "请求参数"
// @Success     200   {object}   data_masking.MaskedSql        "成功响应参数"
// @Failure     400   {object}   rest.HttpError            "失败响应参数"
// @Router      	/api/data-security/v1/data-masking/sql-masking [post]
func (controller *Service) DoMasking(c *gin.Context) {
	var req data_masking.CreateReqBodyParams
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil { //对body校验
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in create audit process bind, err: %v", err)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := controller.dc.DoMasking(c, &req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to data masking, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
