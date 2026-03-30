package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	alarm_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/alarm_rule"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc alarm_rule.UseCase
}

// NewService service
func NewService(uc alarm_rule.UseCase) *Service {
	return &Service{uc: uc}
}

// Update 编辑告警规则
// @Description 编辑告警规则
// @Tags        消息设置
// @Summary     编辑告警规则
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string            true "Authorization header"
// @Param       req           body     alarm_rule.UpdateReq true    "请求参数"
// @Success     200           {object} alarm_rule.UpdateResp            "成功响应参数"
// @Failure     400           {object} rest.HttpError         "失败响应参数"
// @Router      /api/configuration-center/v1/alarm-rule [put]
func (s *Service) Update(c *gin.Context) {

	var updateReq alarm_rule.UpdateReq
	if _, err := form_validator.BindJsonAndValid(c, &updateReq); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in address book update, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	resp, err := s.uc.Update(c, userInfo.ID, &updateReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetList 告警规则列表
// @Description 告警规则列表
// @Tags        消息设置
// @Summary     告警规则列表
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string           true "Authorization header"
// @Param       req           query    alarm_rule.ListReq     true "请求参数"
// @Success     200           {object} alarm_rule.ListResp         "成功响应参数"
// @Failure     400           {object} rest.HttpError        "失败响应参数"
// @Router      /api/configuration-center/v1/alarm-rule [get]
func (s *Service) GetList(c *gin.Context) {
	var req alarm_rule.ListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get address book list, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.GetList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (s *Service) InternalGetList(c *gin.Context) {
	var req alarm_rule.ListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get address book list, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.GetList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
