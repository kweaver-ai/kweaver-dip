package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Revocation 撤回审核
// @Description 待审核列表
// @Tags        数据推送
// @Summary     待审核列表
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        body    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} response.IDRes      "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/audit/revocation [PUT]
func (controller *Controller) Revocation(c *gin.Context) {
	req := new(data_push.CommonIDReq)
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if err := controller.dp.Revocation(c, req); err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, &response.IDRes{
		ID: req.ID.String(),
	})
}

// AuditList 待审核列表
// @Description 待审核列表
// @Tags        数据推送
// @Summary     待审核列表
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.AuditListReq    true "请求参数"
// @Success     200       {object} response.PageResult[data_push.AuditListItem]         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/audit [GET]
func (controller *Controller) AuditList(c *gin.Context) {
	req := new(data_push.AuditListReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.AuditList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
