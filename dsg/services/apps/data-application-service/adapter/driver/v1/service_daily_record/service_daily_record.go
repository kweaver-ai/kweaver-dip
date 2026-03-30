package service_daily_record

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ServiceDailyRecordController struct {
	domain *domain.ServiceDailyRecordDomain
}

func NewServiceDailyRecordController(domain *domain.ServiceDailyRecordDomain) *ServiceDailyRecordController {
	return &ServiceDailyRecordController{
		domain: domain,
	}
}

// GetDailyStatistics 获取每日统计数据
//
//	@Description	获取每日统计数据
//	@Tags			每日统计
//	@Summary		获取每日统计数据
//	@Accept			json
//	@Produce		json
//	@Param			department_id	query		string									false	"部门ID"
//	@Param			service_type	query		string									false	"服务类型"
//	@Param			key				query		string									false	"匹配接口服务名称"
//	@Param			start_time		query		string									false	"开始时间，格式：2025-01-01"
//	@Param			end_time		query		string									false	"结束时间，格式：2025-01-01"
//	@Success		200				{object}	domain.GetDailyStatisticsRes			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-application-service/v1/daily-statistics [get]
func (s *ServiceDailyRecordController) GetDailyStatistics(c *gin.Context) {
	req := &domain.GetDailyStatisticsReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.GetDailyStatistics(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
