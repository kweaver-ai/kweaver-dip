package v1

import (
	"errors"
	"fmt"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	_ "github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type TaskService struct {
	service tc_task.UserCase
}

func NewTaskService(tu tc_task.UserCase) *TaskService {
	return &TaskService{
		service: tu,
	}
}

// NewTask  godoc
//
//	@Summary		新建任务
//	@Description	新建任务接口描述
//	@Accept			application/json
//	@Produce		application/json
//	@param			userToken	header	string						true	"用户标识, uuid(36)"
//	@param			project		body	tc_task.TaskCreateReqModel	true	"新建任务请求体"
//	@Tags			任务管理
//	@Success		200	{array}		response.NameIDResp
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/task [POST]
func (t *TaskService) NewTask(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var taskReq tc_task.TaskCreateReqModel
	valid, errs := form_validator.BindJsonAndValid(c, &taskReq)
	if !valid {
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		}
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	taskReq.CreatedByUID = info.ID

	err = t.service.Create(ctx, &taskReq)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, []response.NameIDResp{{ID: taskReq.Id, Name: taskReq.Name}})
}

// UpdateTask  godoc
//
//	@Summary		编辑任务
//	@Description	编辑任务接口描述
//	@Accept			application/json
//	@Produce		application/json
//	@param			userToken	header	string						true	"用户标识, uuid(36)"
//	@param			id			path	string						true	"任务id, uuid(36)"
//	@param			project		body	tc_task.TaskUpdateReqModel	true	"编辑任务请求体"
//	@Tags			任务管理
//	@Success		200	{object}	tc_task.InspiredTasks
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/tasks/{id} [PUT]
func (t *TaskService) UpdateTask(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	defer func() {
		if err := recover(); err != nil {
			if v, ok := err.(error); ok {
				log.WithContext(ctx).Error("UpdateTask Panic " + v.Error())
				c.Writer.WriteHeader(400)
				ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskPanic, v.Error()))
				return
			}
			log.WithContext(ctx).Error(fmt.Sprintf("UpdateTask Panic %v", err))
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskPanic))
			return
		}
	}()
	var taskReq tc_task.TaskUpdateReqModel
	valid, errs := form_validator.BindJsonAndValid(c, &taskReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		}
		return
	}
	uri := tc_task.BriefTaskPathModel{}
	valid, errs = form_validator.BindUriAndValid(c, &uri)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	taskReq.UpdatedByUID = info.ID
	taskReq.Id = uri.Id
	taskIds, err := t.service.UpdateTask(ctx, &taskReq)
	if err != nil {
		log.WithContext(ctx).Error("UpdateTask", zap.Error(err))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, tc_task.InspiredTasks{ID: uri.Id, Name: taskReq.Name, NextExecutables: taskIds})
}

// GetTaskById  godoc
//
//	@Summary		查看任务详情
//	@Description	查看任务详情接口描述
//	@Accept			application/json
//	@Produce		application/json
//	@param			id			path	string	true	"任务id, uuid(36)"
//	@Tags			open任务管理
//	@Success		200	{object}	tc_task.TaskDetailModel "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/tasks/{id} [GET]
func (t *TaskService) GetTaskById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := tc_task.BriefTaskPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	taskDetail, err := t.service.GetDetail(ctx, taskPathModel.Id)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, taskDetail)
}

// GetTaskByModelID  godoc
//
//	@Summary		根据模型获取任务详情
//	@Description	根据模型获取任务详情
//	@Accept			application/json
//	@Produce		application/json
//	@param			id			path	string	true	"任务id, uuid(36)"
//	@Tags			任务管理
//	@Success		200	{object}	tc_task.TaskDetailModel
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/tasks/model/{id} [GET]
func (t *TaskService) GetTaskByModelID(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := tc_task.BriefTaskPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	taskDetail, err := t.service.GetBriefTaskByModelID(ctx, taskPathModel.Id)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, taskDetail)
}

// GetTasks  godoc
//
//	@Summary		分页查看任务列表
//	@Description	分页任务列表接口描述
//	@Accept			application/json
//	@Produce		application/json
//	@Tags			open任务管理
//	@param			_	query		tc_task.TaskQueryParam	false	"请求参数"
//	@Success		200	{object}	tc_task.QueryPageReapParam  "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/tasks [GET]
func (t *TaskService) GetTasks(c *gin.Context) {
	/*uriParam := tc_task.TaskPathOmitemptyProjectId{}
	valid, errs := form_validator.BindUriAndValid(c, &uriParam)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}*/
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	query := tc_task.TaskQueryParam{}
	valid, errs := form_validator.BindQueryAndValid(c, &query)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	query.UserId = info.ID
	resp, err := t.service.ListTasks(ctx, query)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetFlowchartNodes  godoc
//
//	@Summary		查看工单任务看板
//	@Description	查看工单任务看板
//	@Accept			application/json
//	@Produce		application/json
//	@param			pid			path	string	true	"项目id, uuid(36)"
//	@Tags			open任务管理
//	@Success		200	{object}	tc_task.StageInfoResult "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/{pid}/flowchart/nodes [GET]
func (t *TaskService) GetFlowchartNodes(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	stageReqModel := tc_task.TaskPathProjectId{}
	valid, errs := form_validator.BindUriAndValid(c, &stageReqModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	stageInfo, totalCount, err := t.service.GetNodes(ctx, stageReqModel.PId)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, tc_task.StageInfoResult{
		Entries:    stageInfo,
		TotalCount: totalCount,
	})
}

// GetRate  godoc
//
//	@Summary		查看流水线进度
//	@Description	查看流水线进度接口描述
//	@Accept			application/json
//	@Produce		application/json
//	@param			pid			path	string	true	"项目id, uuid(36)"
//	@Tags			任务管理
//	@Success		200	{array}		tc_task.RateInfo
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/{pid}/rate [GET]
func (t *TaskService) GetRate(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskReq := tc_task.TaskPathProjectId{}
	valid, errs := form_validator.BindUriAndValid(c, &taskReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	stageInfo, err := t.service.GetRateInfo(ctx, taskReq.PId)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, stageInfo)
}

// GetTaskMember  godoc
//
//	 @Deprecated
//		@Summary		查询任务支持的成员（废弃）
//		@Description	查询任务支持的成员描述（废弃）
//		@Accept			application/json
//		@Produce		application/json
//		@param			pid			path	string	true	"项目id, uuid(36)"
//		@param			task_type	path	string	true	"任务类型,例如 normal"	Enums(normal, modeling, standardization , indicator, fieldStandard, dataCollecting, dataProcessing)
//		@Tags			任务管理
//		@Success		200	{array}		model.User
//		@Failure		400	{object}	rest.HttpError
//		@Router			/projects/{pid}/task/{task_type}/members [GET]
func (t *TaskService) GetTaskMember(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	//taskReq := domain_model.TaskPathNodeId{}
	taskReq := tc_task.TaskPathTaskType{}
	valid, errs := form_validator.BindUriAndValid(c, &taskReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		}
		return
	}
	TaskUser, err := t.service.GetTaskMember(ctx, taskReq)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, TaskUser)
}

// GetAllTaskMember  godoc
//
//	 @Deprecated
//		@Summary		查询所有任务支持的成员（废弃）
//		@Description	查询所有任务支持的成员描述（废弃）
//		@Accept			application/json
//		@Produce		application/json
//		@param			pid			path	string	true	"项目id, uuid(36)"
//		@param			task_type	path	string	true	"任务类型,例如 normal"	Enums(normal, modeling, standardization , indicator, fieldStandard, dataCollecting, dataProcessing)
//		@Tags			任务管理
//		@Success		200	{array}		model.User
//		@Failure		400	{object}	rest.HttpError
//		@Router			/projects/{pid}/task/members [GET]
func (t *TaskService) GetAllTaskMember(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	//taskReq := domain_model.TaskPathNodeId{}
	taskReq := tc_task.TaskPathTaskType{}
	valid, errs := form_validator.BindUriAndValid(c, &taskReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
		}
		return
	}
	TaskUser, err := t.service.GetTaskMember(ctx, taskReq)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, TaskUser)
}

// GetMyTaskExecutors  godoc
//
//	@Summary		查询任务所有执行人列表
//	@Description	查询任务所有执行人列表,我创建的
//	@Accept			application/json
//	@Produce		application/json
//	@param			userToken	header	string	true	"用户标识, uuid(36)"
//	@Tags			任务管理
//	@Success		200	{array}		model.User
//	@Failure		400	{object}	rest.HttpError
//	@Router			/executors [GET]
func (t *TaskService) GetMyTaskExecutors(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskReq := tc_task.TaskUserId{}
	/*		valid, errs := form_validator.BindUriAndValid(c, &taskReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}*/
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	taskReq.UId = info.ID
	TaskUser, err := t.service.GetTaskExecutors(ctx, taskReq)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, TaskUser)
}

// GetProjectTaskExecutors  godoc
//
//	@Summary		查询项目下任务所有执行人列表
//	@Description	查询项目下任务所有执行人列表,项目中有任务的人员
//	@Accept			application/json
//	@Produce		application/json
//	@param			userToken	header	string	true	"用户标识, uuid(36)"
//	@param			pid			path	string	true	"项目id, uuid(36)"
//	@Tags			任务管理
//	@Success		200	{array}		model.User
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/{pid}/executors [GET]
func (t *TaskService) GetProjectTaskExecutors(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskReq := tc_task.TaskPathProjectId{}
	valid, errs := form_validator.BindUriAndValid(c, &taskReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	TaskUser, err := t.service.GetProjectTaskExecutors(ctx, taskReq)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, TaskUser)
}

// DeleteTask  godoc
//
//	@Summary		删除任务
//	@Description	删除任务
//	@Accept			application/json
//	@Produce		application/json
//	@param			id			path	string	true	"任务id, uuid(36)"
//	@Tags			任务管理
//	@Success		200	{object}	response.NameIDResp
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/tasks/{id} [DELETE]
func (t *TaskService) DeleteTask(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := tc_task.BriefTaskPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	name, err := t.service.DeleteTask(ctx, taskPathModel)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, &response.NameIDResp{ID: taskPathModel.Id, Name: name})
}

// BatchDeleteTask  godoc
//
//	@Summary		批量删除任务
//	@Description	批量删除任务
//	@Accept			application/json
//	@Produce		application/json
//	@param			_	body	tc_task.TaskBatchIdsReq	true	"批量删除任务Ids"
//	@Tags			任务管理
//	@Success		200	{object}	response.NameIDResp
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/tasks/batch/ids [DELETE]
func (t *TaskService) BatchDeleteTask(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskIds := tc_task.TaskBatchIdsReq{}
	valid, errs := form_validator.BindJsonAndValid(c, &taskIds)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	for _, v := range taskIds.Ids {
		_, err := t.service.DeleteTask(ctx, tc_task.BriefTaskPathModel{Id: v})
		if err != nil {
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, err)
			return
		}
	}
	ginx.ResOKJson(c, nil)
}

// GetTaskInfoById  godoc
//
//	@Summary		查看任务的详细信息
//	@Description	内部接口，获取任务状态，判断能否修改模型资源
//	@Accept			application/json
//	@Produce		application/json
//	@param			userToken	header	string	true	"用户标识, uuid(36)"
//	@param			id			path	string	true	"任务id, uuid(36)"
//	@Tags			任务管理
//	@Success		200	{object}	tc_task.TaskInfo
//	@Failure		400	{object}	rest.HttpError
//	@Router			/internal/tasks/{tid} [GET]
func (t *TaskService) GetTaskInfoById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	taskPathModel := tc_task.BriefTaskPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &taskPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	taskInfo, err := t.service.GetTaskInfo(ctx, taskPathModel.Id)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, taskInfo)
}

// GetTaskBrief  godoc
//
//	@Summary		查看任务的简略信息
//	@Description	前端查询接口
//	@Accept			application/json
//	@Produce		application/json
//	@param			id			query	string	true	"任务id, 多个uuid(36)逗号拼接"
//	@param			field		query	string	true	"任务id, 多个字段逗号拼接，使用"
//	@Tags			任务管理
//	@Success		200	{object}	tc_task.TaskInfo
//	@Failure		400	{object}	rest.HttpError
//	@Router			/tasks/brief [GET]
func (t *TaskService) GetTaskBrief(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	reqData := tc_task.BriefTaskQueryModel{}
	valid, errs := form_validator.BindQueryAndValid(c, &reqData)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	reqData.Parse()
	taskInfo, err := t.service.GetTaskBriefInfo(ctx, &reqData)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, taskInfo)
}

// GetComprehensionTemplateRelation  godoc
// @Summary     查询该数据理解模板是否绑定任务（内部）
// @Description 查询该数据理解模板是否绑定任务（内部）
// @Accept      application/json
// @Produce     application/json
// @Tags        任务管理
// @Failure     400 {object} rest.HttpError
// @Router    /api/internal/task-center/v1/data-comprehension-template [POST]
func (t *TaskService) GetComprehensionTemplateRelation(c *gin.Context) {
	var req tc_task.GetComprehensionTemplateRelationReq
	if valid, err := form_validator.BindJsonAndValid(c, &req); !valid {
		ReqParamErrorHandle(c, err)
		return
	}

	res, err := t.service.GetComprehensionTemplateRelation(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func ReqParamErrorHandle(c *gin.Context, err error) {
	if errors.As(err, &form_validator.ValidErrors{}) {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, err))
		return
	}

	ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.TaskInvalidParameterJson))
}
