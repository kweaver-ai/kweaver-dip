package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_manage"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var ServiceSet = wire.NewSet(New)

type Service struct {
	domain work_order_manage.Domain
	clock  clock.Clock
}

func New(domain work_order_manage.Domain) *Service {
	return &Service{
		domain: domain,
		clock:  clock.RealClock{},
	}
}

// Create 创建工单模板
//
//	@Description	创建工单模板
//	@Tags		工单模板管理
//	@Summary	创建工单模板
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		_				body		work_order_manage.CreateRequest	true	"请求参数"
//	@Success	200				{object}	work_order_manage.CreateResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/work-order-manage [POST]
func (s *Service) Create(c *gin.Context) {
	req := &work_order_manage.CreateRequest{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		return
	}

	// 从上下文获取用户信息
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	req.CreatedBy = info.ID

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
//	@Tags		工单模板管理
//	@Summary	获取工单模板详情
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		uint64	true	"模板ID"
//	@Success	200				{object}	work_order_manage.TemplateResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/work-order-manage/{id} [GET]
func (s *Service) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
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
//	@Tags		工单模板管理
//	@Summary	更新工单模板
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		uint64	true	"模板ID"
//	@Param		_				body		work_order_manage.UpdateRequest	true	"请求参数"
//	@Success	200				{object}	work_order_manage.UpdateResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/work-order-manage/{id} [PUT]
func (s *Service) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	req := &work_order_manage.UpdateRequest{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		return
	}

	// 从上下文获取用户信息
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	req.UpdatedBy = info.ID

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
//	@Tags		工单模板管理
//	@Summary	删除工单模板
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		uint64	true	"模板ID"
//	@Success	200				{object}	work_order_manage.DeleteResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/task-center/v1/work-order-manage/{id} [DELETE]
func (s *Service) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	result, err := s.domain.Delete(c, id)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// List 获取工单模板列表
//
//	@Description	获取工单模板列表
//	@Tags		工单模板管理
//	@Summary	获取工单模板列表
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		template_name	query		string	false	"工单模板名称（模糊查询）"
//	@Param		template_type	query		string	false	"工单模板类型"
//	@Param		is_active		query		int8	false	"是否启用：0-禁用，1-启用"
//	@Param		keyword			query		string	false	"关键词（搜索模板名称或描述）"
//	@Param		offset			query		int		false	"页码，从1开始"
//	@Param		limit			query		int		false	"每页数量"
//	@Success	200				{object}	work_order_manage.ListResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError					"失败响应参数"
//	@Router		/api/data-catalog/v1/work-order-manage [GET]
func (s *Service) List(c *gin.Context) {
	req := &work_order_manage.ListRequest{}
	valid, errs := form_validator.BindQueryAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		return
	}

	result, err := s.domain.List(c, req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// ListVersions 获取工单模板历史版本列表
//
//	@Description	获取工单模板历史版本列表
//	@Tags		工单模板管理
//	@Summary	获取工单模板历史版本列表
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		uint64	true	"模板ID"
//	@Param		offset			query		int		false	"页码，从1开始"
//	@Param		limit			query		int		false	"每页数量"
//	@Success	200				{object}	work_order_manage.ListVersionsResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError							"失败响应参数"
//	@Router		/api/task-center/v1/work-order-manage/{id}/versions [GET]
func (s *Service) ListVersions(c *gin.Context) {
	templateIDStr := c.Param("id")
	templateID, err := strconv.ParseUint(templateIDStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	req := &work_order_manage.ListVersionsRequest{}
	valid, errs := form_validator.BindQueryAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		return
	}

	result, err := s.domain.ListVersions(c, templateID, req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetVersion 获取工单模板历史版本详情
//
//	@Description	获取工单模板历史版本详情
//	@Tags		工单模板管理
//	@Summary	获取工单模板历史版本详情
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		id				path		uint64	true	"模板ID"
//	@Param		version			path		int		true	"版本号"
//	@Success	200				{object}	work_order_manage.VersionResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/work-order-manage/{id}/versions/{version} [GET]
func (s *Service) GetVersion(c *gin.Context) {
	templateIDStr := c.Param("id")
	templateID, err := strconv.ParseUint(templateIDStr, 10, 64)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	versionStr := c.Param("version")
	version, err := strconv.Atoi(versionStr)
	if err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	result, err := s.domain.GetVersion(c, templateID, version)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

// CheckNameExists 校验模板名称是否存在
//
//	@Description	校验模板名称是否存在
//	@Tags		工单模板管理
//	@Summary	校验模板名称是否存在
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string	true	"token"
//	@Param		template_name	query		string	true	"模板名称"
//	@Param		exclude_id		query		string	false	"排除的模板ID（更新时使用）"
//	@Success	200				{object}	work_order_manage.CheckNameExistsResponse	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError							"失败响应参数"
//	@Router		/api/task-center/v1/work-order-manage/check-name [GET]
func (s *Service) CheckNameExists(c *gin.Context) {
	req := &work_order_manage.CheckNameExistsRequest{}
	valid, errs := form_validator.BindQueryAndValid(c, req)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		return
	}

	result, err := s.domain.CheckNameExists(c, req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, result)
}
