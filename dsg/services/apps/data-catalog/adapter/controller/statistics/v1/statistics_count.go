package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	statistics "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/statistics"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Controller struct {
	da statistics.UseCase
}

func NewController(da statistics.UseCase) *Controller {
	return &Controller{da: da}
}

// GetOverviewStatistics 获取首页统计信息
// @Description 获取首页统计信息
// @Tags        认知服务系统
// @Summary     获取首页统计信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Success     200       {object} statistics.OverviewResp         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (s *Controller) GetOverviewStatistics(c *gin.Context) {
	overviewStatistics, err := s.da.GetOverviewStatistics(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, overviewStatistics)
}

// GetServiceStatistics 获取榜单信息
// @Description 获取榜单信息
// @Tags        认知服务系统
// @Summary     获取榜单信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Param       req        query    statistics.ServiceIDReq    true "请求参数"
// @Success     200       {object}  []statistics.ServiceResp         "成功响应参数"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (s *Controller) GetServiceStatistics(c *gin.Context) {
	req := statistics.ServiceIDReq{}
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	overviewStatistics, err := s.da.GetServiceStatistics(c, req.IDReqParamPath.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, overviewStatistics)
}

// SaveStatistics 保存统计信息
// @Description 保存统计信息
// @Tags        认知服务系统
// @Summary     保存统计信息
// @Accept      text/plan
// @Produce     application/json
// @Param       Authorization header   string    true "token"
// @Failure     400       {object} rest.HttpError         "失败响应参数"
// @Router      /api/data-catalog/v1/cognitive-service-system/single-catalog/info [GET]
func (s *Controller) SaveStatistics(c *gin.Context) {
	err := s.da.SaveStatistics(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, "保存成功")
}

func (s *Controller) GetDataInterface(c *gin.Context) {
	interfaces, err := s.da.GetDataInterface(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, interfaces)
}
