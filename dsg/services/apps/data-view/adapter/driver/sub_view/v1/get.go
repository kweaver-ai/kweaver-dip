package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	_ "github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Get 获取指定子视图
//
//	@Description    获取指定子视图
//	@Tags           子视图
//	@Summary        获取指定子视图
//	@Accept         application/json
//	@Produce        application/json
//	@Param          id  path        string              true    "子视图 ID"     Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success        200 {object}    sub_view.SubView            "成功响应参数"
//	@Failure        400 {object}    rest.HttpError              "失败响应参数"
//	@Router         /sub-views/{id} [get]
func (s *SubViewService) Get(c *gin.Context) {
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

func (s *SubViewService) GetLogicViewID(c *gin.Context) {
	ctx, span := trace.StartServerSpan(c)
	defer span.End()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	resp, err := s.uc.GetLogicViewID(ctx, id)
	if err != nil {
		resErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
