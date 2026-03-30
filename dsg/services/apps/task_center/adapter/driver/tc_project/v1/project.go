package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	_ "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_flow_info"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type ProjectService struct {
	service tc_project.UserCase
}

func NewProjectService(pu tc_project.UserCase) *ProjectService {
	return &ProjectService{
		service: pu,
	}
}

// NewProject  godoc
//
//	@Summary		新建项目信息
//	@Description	新建项目信息
//	@Accept			application/json
//	@Produce		application/json
//	@param			_		body	tc_project.ProjectReqModel	true	"请求参数"
//	@Tags			open项目管理
//	@Success		200	{array}		response.NameIDResp  "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects [POST]
func (p *ProjectService) NewProject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var projectReq tc_project.ProjectReqModel
	valid, errs := form_validator.BindJsonAndValid(c, &projectReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.ProjectInvalidParameterJson))
		}
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	projectReq.CreatedByUID = info.ID
	// start insert
	if err := p.service.Create(ctx, &projectReq); err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.NameIDResp{ID: projectReq.ID, Name: projectReq.Name})
}

// EditProject  godoc
//
//	@Summary		编辑项目信息
//	@Description	编辑项目信息， 该接口支持单独修改项目状态，优先级， 截止时间，项目成员
//	@Accept			application/json
//	@Produce		application/json
//	@param			_		body	tc_project.ProjectEditModel	true	"请求参数"
//	@param			pid			path	string						true	"项目id，uuid"
//	@Tags			open项目管理
//	@Success		200	{array}		response.NameIDResp  "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/{pid} [PUT]
func (p *ProjectService) EditProject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	path := tc_project.FlowchartPath{}
	valid, errs := form_validator.BindUriAndValid(c, &path)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	var projectReq tc_project.ProjectEditModel
	projectReq.ID = path.PId
	valid, errs = form_validator.BindJsonAndValid(c, &projectReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.ProjectInvalidParameterJson))
		}
		return
	}
	info, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	projectReq.UpdatedByUID = info.ID

	// start insert
	if err := p.service.Update(ctx, &projectReq); err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, response.NameIDResp{ID: projectReq.ID, Name: projectReq.Name})
}

// GetProject  godoc
//
//	@Summary		根据项目ID查询项目详情
//	@Description	根据项目ID查询项目详情
//	@Accept			application/json
//	@Produce		application/json
//	@param			pid			path	string	true	"项目 id, uuid(36)"
//	@Tags			open项目管理
//	@Success		200	{object}	tc_project.ProjectDetailModel  "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/{pid} [GET]
func (p *ProjectService) GetProject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	projectPathModel := tc_project.ProjectPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &projectPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	detail, err := p.service.GetDetail(ctx, projectPathModel.Id)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// GetProject  godoc
//
//	@Summary		根据第三方项目ID查询项目详情
//	@Description	根据第三方项目ID查询项目详情
//	@Accept			application/json
//	@Produce		application/json
//	@param			pid			path	string	true	"第三方项目 id"
//	@Tags			open项目管理
//	@Success		200	{object}	tc_project.ProjectDetailModel  "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/third-project/{pid} [GET]
func (p *ProjectService) GetThirdProject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	projectPathModel := tc_project.ProjectPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &projectPathModel)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	detail, err := p.service.GetThirdProjectDetail(ctx, projectPathModel.Id)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// CheckRepeat  godoc
//
//	@Summary		判断项目名称是否重复
//	@Description	判断项目名称是否重复
//	@Accept			application/json
//	@Produce		application/json
//	@Tags			open项目管理
//	@Param			id			query		string	true	"项目 id, uuid(36)"
//	@Param			name		query		string	true	"项目名称"
//	@Success		200			{object}	response.CheckRepeatResp  "成功响应参数"
//	@Failure		400			{object}	rest.HttpError
//	@Router			/projects/repeat [GET]
func (p *ProjectService) CheckRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tc_project.ProjectNameRepeatReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}

	if err := p.service.CheckRepeat(ctx, req); err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Name, Repeat: false})
}

// CardPageQueryProject  godoc
//
//	@Summary		分页查询项目列表
//	@Description	分页查询项目列表
//	@Accept			application/json
//	@Produce		application/json
//	@param			status		query	string	false	"项目状态"
//	@param			name		query	string	false	"项目名称"
//	@param			offset		query	integer	false	"页码，默认1，大于1"									default(1)	minimum(1)
//	@param			limit		query	integer	false	"页数，默认10，大于1"									default(10)	minimum(1)
//	@param			sort		query	string	false	"排序类型，枚举：[创建时间 created_at(默认)，修改时间 updated_at]"	Enums(created_at, updated_at)
//	@param			direction	query	string	false	"排序方向，枚举： [正序asc，逆序desc(默认)]"					Enums(asc, desc)
//	@Tags			open项目管理
//	@Success		200	{object}	response.PageResult{entries=tc_project.ProjectListModel}  "成功响应参数"
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects     [GET]
func (p *ProjectService) CardPageQueryProject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req tc_project.ProjectCardQueryReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	//if !form_validator.CheckKeyWord(&req.Name) {
	//	pageResult := response.PageResult{
	//		Limit:      int(req.Limit),
	//		Offset:     int(req.Offset),
	//		TotalCount: 0,
	//		Entries:    []string{},
	//	}
	//	ginx.ResOKJson(c, pageResult)
	//	return
	//}
	pageResult, err := p.service.QueryProjects(ctx, &req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, pageResult)
}

// ProjectCandidate  godoc
//
//	 @Deprecated
//		@Summary		获取项目成员候选人列表（废弃）
//		@Description	获取项目流水线支持的角色的所有的用户（废弃）
//		@Accept			application/json
//		@Produce		application/json
//		@param			userToken		header	string	true	"用户标识, uuid(36)"
//		@param			id				query	string	true	"项目ID, uuid(36)"
//		@param			flow_id			query	string	true	"流水线id, uuid(36)"
//		@param			flow_version	query	string	true	"流水线版本, uuid(36)"
//		@Tags			项目管理
//		@Success		200	{object}	tc_project.ProjectCandidates
//		@Failure		400	{object}	rest.HttpError
//		@Router			/projects/candidate  [GET]
func (p *ProjectService) ProjectCandidate(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqData := tc_project.FlowIdModel{}
	valid, errs := form_validator.BindQueryAndValid(c, &reqData)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	detail, err := p.service.GetProjectCandidate(ctx, &reqData)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// ProjectCandidateByTaskType  godoc
//
//	@Summary		查询项目下所有任务支持的成员
//	@Description	获取项目流水线支持的任务的角色的所有的用户
//	@Accept			application/json
//	@Produce		application/json
//	@param			id				query	string	true	"项目ID, uuid(36)"
//	@param			flow_id			query	string	true	"流水线id, uuid(36)"
//	@param			flow_version	query	string	true	"流水线版本, uuid(36)"
//	@Tags			项目管理
//	@Success		200	{object}	tc_project.ProjectCandidates
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/candidate/task-type  [GET]
func (p *ProjectService) ProjectCandidateByTaskType(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqData := tc_project.ProjectID{}
	valid, errs := form_validator.BindQueryAndValid(c, &reqData)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}
	detail, err := p.service.GetProjectCandidateByTaskType(ctx, &reqData)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, detail)
}

// GetFlowchart  godoc
//
//	@Summary		查询项目流程看板
//	@Description	查询项目流程看板
//	@Tags			open项目管理
//	@Accept			application/json
//	@Produce		application/json
//	@param			pid			path		string	true	"项目 id, uuid(36)"
//	@Success		200			{object}	tc_project.FlowchartView  "成功响应"
//	@Failure		400			{object}	rest.HttpError
//	@Router			/projects/{pid}/flowchart [GET]
func (p *ProjectService) GetFlowchart(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	path := tc_project.FlowchartPath{}
	valid, errs := form_validator.BindUriAndValid(c, &path)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}

	view, err := p.service.GetFlowView(ctx, path.PId)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, view)
}

// DeleteProject  godoc
//
//	@Summary		删除项目
//	@Description	删除项目，删除进行中项目对应的产物
//	@Accept			application/json
//	@Produce		application/json
//	@param			id			query	string	true	"项目ID, uuid(36)"
//	@Tags			项目管理
//	@Success		200	{object}	response.NameIDResp
//	@Failure		400	{object}	rest.HttpError
//	@Router			/projects/{pid} [DELETE]
func (p *ProjectService) DeleteProject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	projectPathModel := tc_project.ProjectPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &projectPathModel)
	if !valid {
		log.WithContext(ctx).Error("form_validator.BindUriAndValid:", zap.Error(errs))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	name, err := p.service.DeleteProject(ctx, projectPathModel.Id)
	if err != nil {
		log.WithContext(ctx).Error("service.DeleteProject:", zap.Error(err))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, &response.NameIDResp{ID: projectPathModel.Id, Name: name})
}

func (p *ProjectService) QueryDomainCreatedByProject(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	projectPathModel := tc_project.ProjectPathModel{}
	valid, errs := form_validator.BindUriAndValid(c, &projectPathModel)
	if !valid {
		log.WithContext(ctx).Error("form_validator.BindUriAndValid:", zap.Error(errs))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	data, err := p.service.QueryDomainCreatedByProject(ctx, projectPathModel.Id)
	if err != nil {
		log.WithContext(ctx).Error("service.QueryDomainCreatedByProject:", zap.Error(err))
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// GetProjectWorkItems  godoc
//
//	@Summary		获取项目下所有工单和任务（工单/任务看板）
//	@Description	获取项目下所有工单和任务（工单/任务看板）
//	@Tags			open项目管理
//	@Accept			application/json
//	@Produce		application/json
//	@param			pid			path		string	true	"项目 id, uuid(36)"
//	@Param			_	     query		 tc_project.WorkitemsQueryParam	true	"请求参数"
//	@Success		200			{object}	tc_project.WorkitemsQueryResp "成功响应参数"
//	@Failure		400			{object}	rest.HttpError
//	@Router			/projects/{pid}/workitem [GET]
func (p *ProjectService) GetProjectWorkItems(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	path := tc_project.FlowchartPath{}
	valid, errs := form_validator.BindUriAndValid(c, &path)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.ProjectInvalidParameter, errs))
		return
	}

	query := tc_project.WorkitemsQueryParam{}
	valid, errs = form_validator.BindQueryAndValid(c, &query)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}
	query.ProjectId = path.PId

	resp, err := p.service.GetProjectWorkitems(ctx, &query)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
