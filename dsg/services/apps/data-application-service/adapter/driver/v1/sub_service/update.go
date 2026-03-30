package sub_service

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Update 更新指定子视图
//
//	@Description    更新指定子视图
//	@Tags           子视图
//	@Accept         application/json
//	@Produce        application/json
//	@Param          id  path        string              true    "子视图 ID"     Format(uuid)
//	@Param          _   body        sub_service.SubService    true    "请求参数"
//	@Success        200 {object}    sub_service.SubService            "成功响应参数"
//	@Failure        400 {object}    rest.HttpError              "失败响应参数"
//	@Router         /api/v1/data-application-service/v1/sub-views:id [put]
func (s *SubServiceService) Update(c *gin.Context) {
	ctx, span := trace.StartServerSpan(c)
	defer span.End()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	var sv = &sub_service.SubService{ID: id}
	if err := c.ShouldBindJSON(sv); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error()))
		return
	}

	if sv, err = s.uc.Update(ctx, sv); err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, sv)
}
