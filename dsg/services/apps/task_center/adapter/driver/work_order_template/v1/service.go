package v1

import (
	"net/http"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"

	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_template"
)

var ServiceSet = wire.NewSet(New)

type Service struct {
	domain work_order_template.Domain
	clock  clock.Clock
}

func New(domain work_order_template.Domain) *Service {
	return &Service{
		domain: domain,
		clock:  clock.RealClock{},
	}
}

// Create 创建工单模板
//
//	@Description	创建工单模板
//	@Tags		工单模板
//	@Summary	创建工单模板
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		_				body		work_order_template.CreateRequest	true	"请求参数"
//	@Success	200				{object}	work_order_template.CreateResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/work-order-template [POST]
func (s *Service) Create(c *gin.Context) {
	req := &work_order_template.CreateRequest{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	// 从上下文获取用户信息
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	req.CreatedByUID = info.ID
	req.UpdatedByUID = info.ID

	result, err := s.domain.Create(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// Get 获取工单模板详情
//
//	@Description	获取工单模板详情
//	@Tags		工单模板
//	@Summary	获取工单模板详情
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		int64	true	"模板ID"
//	@Success	200				{object}	work_order_template.TemplateResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/work-order-template/{id} [GET]
func (s *Service) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, err))
		return
	}

	result, err := s.domain.Get(c, id)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// Update 更新工单模板
//
//	@Description	更新工单模板
//	@Tags		工单模板
//	@Summary	更新工单模板
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		int64	true	"模板ID"
//	@Param		_				body		work_order_template.UpdateRequest	true	"请求参数"
//	@Success	200				{object}	work_order_template.UpdateResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/work-order-template/{id} [PUT]
func (s *Service) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, err))
		return
	}

	req := &work_order_template.UpdateRequest{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	// 从上下文获取用户信息
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	req.UpdatedByUID = info.ID

	result, err := s.domain.Update(c, id, req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// Delete 删除工单模板
//
//	@Description	删除工单模板
//	@Tags		工单模板
//	@Summary	删除工单模板
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		int64	true	"模板ID"
//	@Success	200				{object}	map[string]any	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError	"失败响应参数"
//	@Router		/api/task-center/v1/work-order-template/{id} [DELETE]
func (s *Service) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, err))
		return
	}

	err = s.domain.Delete(c, id)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// List 获取工单模板列表
//
//	@Description	获取工单模板列表
//	@Tags		工单模板
//	@Summary	获取工单模板列表
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		limit			query		int		false	"每页数量，默认10"
//	@Param		offset			query		int		false	"页码，默认1"
//	@Param		ticket_type		query		string	false	"工单类型"
//	@Param		status			query		bool	false	"状态"
//	@Param		is_builtin		query		bool	false	"是否内置模板"
//	@Param		keyword			query		string	false	"关键字搜索"
//	@Success	200				{object}	work_order_template.ListResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/work-order-template [GET]
func (s *Service) List(c *gin.Context) {
	req := &work_order_template.ListRequest{}
	valid, errs := form_validator.BindQueryAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	result, err := s.domain.List(c, req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// UpdateStatus 更新工单模板状态
// @Summary		更新工单模板状态
// @Description	启用或停用工单模板
// @Tags			工单模板管理
// @Accept			json
// @Produce		json
// @Param			id		path		int		true	"模板ID"
// @Param			state	path		int		true	"状态 1-启用 0-停用"
// @Param			request	body		work_order_template.UpdateStatusRequest	true	"更新状态请求"
// @Success		200		{object}	work_order_template.UpdateResponse	"成功响应参数"
// @Router			/api/task-center/v1/work-order-template/{id}/{state} [PUT]
func (s *Service) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, err))
		return
	}

	stateStr := c.Param("state")
	state, err := strconv.ParseInt(stateStr, 10, 32)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, err))
		return
	}

	// 验证状态值
	if state != 0 && state != 1 {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errors.New("invalid state value, must be 0 or 1")))
		return
	}

	// 从上下文获取用户信息
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	result, err := s.domain.UpdateStatus(c, id, int32(state), info.ID)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}
