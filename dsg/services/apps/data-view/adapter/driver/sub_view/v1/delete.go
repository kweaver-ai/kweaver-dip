package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// Delete 删除指定子视图
//
//	@Description    删除指定子视图
//	@Tags           子视图
//	@Summary        删除指定子视图
//	@Accept         application/json
//	@Produce        application/json
//	@Param          id  path        string  true    "子视图 ID"     Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success        200 "成功"
//	@Failure        400 {object}    rest.HttpError  "失败响应参数"
//	@Router         /sub-views/{id} [delete]
func (s *SubViewService) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error()))
		return
	}

	if err := s.uc.Delete(c, id); err != nil {
		resErrJson(c, err)
		return
	}
	c.Status(http.StatusOK)
}
