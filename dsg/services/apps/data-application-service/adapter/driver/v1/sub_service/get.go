package sub_service

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	_ "github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Get 获取指定子视图
//
//	@Description    获取指定子视图
//	@Tags           子视图
//	@Accept         application/json
//	@Produce        application/json
//	@Param          id  path        string              true    "子视图 ID"     Format(uuid)
//	@Success        200 {object}    sub_service.SubService            "成功响应参数"
//	@Failure        400 {object}    rest.HttpError              "失败响应参数"
//	@Router         /api/v1/data-application-service/v1/sub-views:id [put]
func (s *SubServiceService) Get(c *gin.Context) {
	ctx, span := trace.StartServerSpan(c)
	defer span.End()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	resp, err := s.uc.Get(ctx, id)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetServiceID
// GetServiceID 获取子视图（行列规则）的 ID 列表
//
//	@Description    获取子视图（行列规则）的 ID 列表
//	@Tags           子视图
//	@Accept         application/json
//	@Produce        application/json
//	@Param          id  path        string              true    "子视图 ID"     Format(uuid)
//	@Router         /api/internal/data-application-service/v1/sub-views/:id/logic_view_id [put]
func (s *SubServiceService) GetServiceID(c *gin.Context) {
	ctx, span := trace.StartServerSpan(c)
	defer span.End()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	resp, err := s.uc.GetServiceID(ctx, id)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
