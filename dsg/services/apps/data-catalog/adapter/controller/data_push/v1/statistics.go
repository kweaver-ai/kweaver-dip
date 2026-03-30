package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Overview 数据推送概览
// @Description 数据推送概览
// @Tags        数据推送
// @Summary     数据推送概览
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    data_push.OverviewReq    true "请求参数"
// @Success     200       {object} data_push.OverviewResp         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/overview [GET]
func (controller *Controller) Overview(c *gin.Context) {
	req := new(data_push.OverviewReq)
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	resp, err := controller.dp.Overview(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// AnnualStatistics 近一年数据推送总量
// @Description 近一年数据推送总量
// @Tags        数据推送
// @Summary     近一年数据推送总量
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Success     200       {object} []data_push.AnnualStatisticItem         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/data-push/annual-statistics [GET]
func (controller *Controller) AnnualStatistics(c *gin.Context) {
	resp, err := controller.dp.AnnualStatistics(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
