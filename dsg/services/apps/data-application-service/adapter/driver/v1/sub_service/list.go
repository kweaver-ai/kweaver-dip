package sub_service

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service/validation"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// List 获取子视图列表
//
//	@Description    获取子视图列表
//	@Tags           子视图
//	@Accept         application/json
//	@Produce        application/json
//	@Param          logic_view_id   query   string  false   "逻辑视图 ID"   Format(uuid)
//	@Param          offset          query   int     false   "页码"          default(1)
//	@Param          limit           query   int     false   "每页数量"      default(10)
//	@Success        200 {object}    sub_service.SubService    "子视图列表"
//	@Failure        400 {object}    rest.HttpError          "失败响应参数"
//	@Router         /api/v1/data-application-service/v1/sub-views [get]
func (s *SubServiceService) List(c *gin.Context) {
	var err error
	var opts sub_service.ListOptions
	if err = c.ShouldBindQuery(&opts); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}
	// gin doesn't support bind uuid.UUID from query.
	if v, ok := c.GetQuery("service_id"); ok {
		if opts.ServiceID, err = uuid.Parse(v); err != nil {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.ValidError{Key: "service_id", Message: "service_id 必须是一个有效的 UUID"}))
			return
		}
	}

	if err := validation.ValidateListOptions(&opts); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.CreateValidErrorsFromFieldErrorList(err)))
		return
	}

	resp, err := s.uc.List(c, opts)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// ListID 获取子视图的 ID 列表
//
//	@Description    获取子视图的 ID 列表
//	@Tags           子视图
//	@Produce        application/json
//	@Router         /api/internal/data-application-service/v1/sub-view-ids [get]
func (s *SubServiceService) ListID(c *gin.Context) {
	req := form_validator.Valid[sub_service.ListIDReq](c)
	if req == nil {
		return
	}

	var serviceID uuid.UUID
	if req.ServiceID != "" {
		serviceID = uuid.MustParse(req.ServiceID)
	}

	resp, err := s.uc.ListID(c, serviceID)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s *SubServiceService) ListSubService(c *gin.Context) {
	req := form_validator.Valid[sub_service.ListSubServicesReq](c)
	if req == nil {
		return
	}

	resp, err := s.uc.ListSubServices(c, req)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
