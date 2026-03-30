package service_call_record

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ServiceCallRecordController struct {
	domain *domain.ServiceCallRecordDomain
}

func NewServiceCallRecordController(domain *domain.ServiceCallRecordDomain) *ServiceCallRecordController {
	return &ServiceCallRecordController{
		domain: domain,
	}
}

// MonitorList 获取服务调用记录监控列表
//
//	@Description	获取服务调用记录监控列表
//	@Tags			服务调用记录
//	@Summary		获取服务调用记录监控列表
//	@Accept			json
//	@Produce		json
//	@Param			service_id				query		string									false	"接口ID"
//	@Param			keyword					query		string									false	"关键词"
//	@Param			service_department_id	query		string									false	"接口所属部门ID"
//	@Param			call_department_id		query		string									false	"调用部门ID"
//	@Param			call_info_system_id		query		string									false	"调用信息系统ID"
//	@Param			call_app_id				query		string									false	"调用应用ID"
//	@Param			status					query		string									false	"调用状态 success 成功 fail 失败"
//	@Param			start_time				query		string									false	"调用开始时间，格式：2006-01-02 15:04:05"
//	@Param			end_time				query		string									false	"调用结束时间，格式：2006-01-02 15:04:05"
//	@Param			offset					query		int										false	"偏移量，默认0"
//	@Param			limit					query		int										false	"每页大小，默认10，最大100"
//	@Param			sort					query		string									false	"排序类型 create_time update_time call_start_time call_end_time"
//	@Param			direction				query		string									false	"排序方向 asc 正序 desc 倒序"
//	@Success		200						{object}	dto.MonitorListRes						"成功响应参数"
//	@Failure		400						{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-application-service/v1/monitor/list [get]
func (s *ServiceCallRecordController) MonitorList(c *gin.Context) {
	req := &dto.MonitorListReq{}

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

	res, count, err := s.domain.MonitorList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	// 构造分页响应
	response := &dto.MonitorListRes{
		PageResult: dto.PageResult[dto.MonitorRecord]{
			TotalCount: count,
			Entries:    res,
		},
	}

	ginx.ResOKJson(c, response)
}
