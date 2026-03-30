package v1

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_task"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	util_validation "github.com/kweaver-ai/idrm-go-common/util/validation"
	"github.com/kweaver-ai/idrm-go-common/util/validation/field"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	domain work_order_task.Domain

	clock clock.Clock
}

func New(domain work_order_task.Domain) *Service {
	return &Service{
		domain: domain,
		clock:  clock.RealClock{},
	}
}

// Create 创建工单任务
//
//	@Description	创建工单任务
//	@Tags			工单任务
//	@Summary		创建工单任务
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			_				body		task_center_v1.WorkOrderTask	true	"请求参数"
//	@Success		200				{object}	task_center_v1.WorkOrderTask	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/task-center/v1/work-order-tasks [POST]
func (s *Service) Create(c *gin.Context) {
	task := &task_center_v1.WorkOrderTask{}
	valid, errs := form_validator.BindJsonAndValid(c, task)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	// Completion
	if task.ID == "" {
		id, err := uuid.NewV7()
		if err != nil {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
			return
		}
		task.ID = id.String()
	}
	now := s.clock.Now()
	task.CreatedAt = meta_v1.NewTime(now)
	task.UpdatedAt = meta_v1.NewTime(now)

	// Validation

	if err := s.domain.Create(c, task); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	c.JSON(http.StatusOK, task)
}

// Get 获取工单任务
//
//	@Description	获取工单任务
//	@Tags			工单任务
//	@Summary		获取工单任务
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Success		200				{object}	task_center_v1.WorkOrderTask	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/task-center/v1/work-order-tasks/{id} [GET]
func (s *Service) Get(c *gin.Context) {
	id := c.Param("id")

	// Validation
	if allErrs := util_validation.ValidateUUID(id, field.NewPath("id")); allErrs != nil {
		ginx.AbortResponseWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.TaskInvalidParameter, form_validator.NewValidErrorsForFieldErrorList(allErrs)))
	}

	got, err := s.domain.Get(c, id)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// Update 更新工单任务
//
//	@Description	更新工单任务
//	@Tags			工单任务
//	@Summary		更新工单任务
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string							true	"token"
//	@Param			id				path		string							true	"工单id"
//	@Param			_				body		task_center_v1.WorkOrderTask	true	"请求参数"
//	@Success		200				{object}	task_center_v1.WorkOrderTask	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/task-center/v1/work-order-tasks/{id} [PUT]
func (s *Service) Update(c *gin.Context) {
	task := &task_center_v1.WorkOrderTask{}
	valid, errs := form_validator.BindJsonAndValid(c, task)
	if !valid {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.WorkOrderInvalidParameter, errs))
		return
	}

	// Completion
	task.ID = c.Param("id")
	task.UpdatedAt = meta_v1.NewTime(s.clock.Now())

	// Validation

	if err := s.domain.Update(c, task); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, task)
}

// List 获取工单任务列表
//
//	@Description	获取工单任务列表
//	@Tags			工单任务
//	@Summary		获取工单任务列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			_				query		task_center_v1.WorkOrderTaskListOptions	true	"请求参数"
//	@Success		200				{object}	task_center_v1.WorkOrderTaskList		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/task-center/v1/work-order-tasks [GET]
func (s *Service) List(c *gin.Context) {
	opts := &task_center_v1.WorkOrderTaskListOptions{}
	q := c.Request.URL.Query()
	if err := task_center_v1.Convert_url_Values_To_v1_WorkOrderTaskListOptions(&q, opts); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.WorkOrderInvalidParameter))
		return
	}

	// TODO: Completion

	// TODO: Validation

	got, err := s.domain.List(c, opts)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// BatchCreate 批量创建工单任务
//
//	@Summary	批量创建工单任务
//	@Tags		工单任务
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string								true	"token"
//	@Param		_				body		task_center_v1.WorkOrderTaskList	true	"请求参数"
//	@Success	200				{object}	task_center_v1.WorkOrderTaskList	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/batch/work-order-tasks [POST]
func (s *Service) BatchCreate(c *gin.Context) {
	var list task_center_v1.WorkOrderTaskList
	if err := c.ShouldBind(&list); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		return
	}

	// Completion
	now := s.clock.Now()
	for i := range list.Entries {
		list.Entries[i].ID = uuid.Must(uuid.NewV7()).String()
		list.Entries[i].CreatedAt = meta_v1.NewTime(now)
		list.Entries[i].UpdatedAt = meta_v1.NewTime(now)
	}

	// Validation

	if err := s.domain.BatchCreate(c, &list); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, list)
}

// BatchUpdate 批量更新工单任务
//
//	@Summary	批量更新工单任务
//	@Tags		工单任务
//	@Accept		application/json
//	@Produce	application/json
//	@Param		Authorization	header		string								true	"token"
//	@Param		_				body		task_center_v1.WorkOrderTaskList	true	"请求参数"
//	@Success	200				{object}	task_center_v1.WorkOrderTaskList	"成功响应参数"
//	@Failure	400				{object}	rest.HttpError						"失败响应参数"
//	@Router		/api/task-center/v1/batch/work-order-tasks [PUT]
func (s *Service) BatchUpdate(c *gin.Context) {
	var list task_center_v1.WorkOrderTaskList
	if err := c.ShouldBind(&list); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		return
	}

	// Completion
	now := s.clock.Now()
	for i := range list.Entries {
		list.Entries[i].UpdatedAt = meta_v1.NewTime(now)
	}

	// Validation
	var allErrs form_validator.ValidErrors
	for i, t := range list.Entries {
		if t.ID == "" {
			allErrs = append(allErrs, &form_validator.ValidError{
				Key:     fmt.Sprintf("entries[%d].id", i),
				Message: "id is required",
			})
		} else if _, err := uuid.Parse(t.ID); err != nil {
			allErrs = append(allErrs, &form_validator.ValidError{
				Key:     fmt.Sprintf("entries[%d].id", i),
				Message: fmt.Sprintf("%s 必须是一个有效的UUID", t.ID),
			})
		}
	}
	if allErrs != nil {
		ginx.ResBadRequestJson(c, allErrs)
		return
	}

	if err := s.domain.BatchUpdate(c, &list); err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, list)
}

// ListFrontend 获取工单任务列表
func (s *Service) ListFrontend(c *gin.Context) {
	opts := &task_center_v1.WorkOrderTaskListOptions{}
	q := c.Request.URL.Query()
	log.Debug("request", zap.Any("query", q))
	if err := task_center_v1.Convert_url_Values_To_v1_WorkOrderTaskListOptions(&q, opts); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.WorkOrderInvalidParameter))
		return
	}

	// TODO: Completion

	// TODO: Validation

	got, err := s.domain.ListFrontend(c, opts)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, got)
}

// CatalogTaskStatus 获取目录任务状态
func (s *Service) CatalogTaskStatus(c *gin.Context) {
	var req work_order_task.CatalogTaskStatusReq
	if err := c.ShouldBind(&req); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameter))
		return
	}

	resp, err := s.domain.CatalogTaskStatus(c, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CatalogTask 获取目录任务详情
func (s *Service) CatalogTask(c *gin.Context) {
	var req work_order_task.CatalogTaskReq
	if err := c.ShouldBind(&req); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameter))
		return
	}

	resp, err := s.domain.CatalogTask(c, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (s *Service) GetDataAggregationTask(c *gin.Context) {
	var req work_order_task.DataAggregationTaskReq

	if err := c.ShouldBind(&req); err != nil {
		ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameter))
		return
	}
	got, err := s.domain.GetDataAggregationTask(c, &req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, got)
}
