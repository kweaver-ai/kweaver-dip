package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/sms_conf"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc sms_conf.UseCase
}

// NewService service
func NewService(uc sms_conf.UseCase) *Service {
	return &Service{uc: uc}
}

// Update 编辑短信推送配置
// @Description 编辑短信推送配置
// @Tags        短信推送配置
// @Summary     编辑短信推送配置
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string            true "Authorization header"
// @Param       req           body     sms_conf.UpdateReq true    "请求参数"
// @Success     200           {object} map[string]any            "成功响应参数"
// @Failure     400           {object} rest.HttpError         "失败响应参数"
// @Router      /api/configuration-center/v1/sms-conf [put]
func (s *Service) UpdateSMSConf(c *gin.Context) {
	var updateReq sms_conf.UpdateReq
	if _, err := form_validator.BindJsonAndValid(c, &updateReq); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in sms conf update, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	err := s.uc.Update(c, &updateReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, map[string]any{})
}

// GetSMSConf 获取短信推送配置
// @Description 获取短信推送配置
// @Tags        短信推送配置
// @Summary     获取短信推送配置
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string           true "Authorization header"
// @Success     200           {object} sms_conf.SMSConfResp         "成功响应参数"
// @Failure     400           {object} rest.HttpError        "失败响应参数"
// @Router      /api/configuration-center/v1/sms-conf [get]
func (s *Service) GetSMSConf(c *gin.Context) {
	resp, err := s.uc.Get(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
