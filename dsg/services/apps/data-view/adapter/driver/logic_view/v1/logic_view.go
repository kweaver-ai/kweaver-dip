package v1

import (
	"github.com/gin-gonic/gin"
	_ "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/logic_view"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ = new(response.BoolResp)

type LogicViewService struct {
	uc logic_view.LogicViewUseCase
}

func NewLogicViewService(uc logic_view.LogicViewUseCase) *LogicViewService {
	return &LogicViewService{uc: uc}
}

// AuthorizableViewList 可授权逻辑视图列表
//
//	@Description	可授权逻辑视图列表
//	@Tags			逻辑视图
//	@Summary		可授权逻辑视图列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			query			query		logic_view.AuthorizableViewListReq	true	"查询参数"
//	@Success		200				{object}	logic_view.AuthorizableViewListResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/logic-view/authorizable [get]
func (l *LogicViewService) AuthorizableViewList(c *gin.Context) {
	req := form_validator.Valid[logic_view.AuthorizableViewListReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, l.uc.AuthorizableViewList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// SubjectDomainList 用户有权限的主题域列表
//
//	@Description	用户有权限的主题域列表
//	@Tags			open逻辑视图
//	@Summary		登录用户有权限的主题域列表
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{object}	logic_view.SubjectDomainListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/logic-view/subject-domains [get]
func (l *LogicViewService) SubjectDomainList(c *gin.Context) {
	res, err := util.TraceA0R2(c, l.uc.SubjectDomainList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CreateLogicView 创建自定义视图和逻辑实体视图（字段+基本信息）
//
//	@Description	创建自定义视图和逻辑实体视图（字段+基本信息）
//	@Tags			逻辑视图
//	@Summary		创建自定义视图和逻辑实体视图字段基本信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_				body		logic_view.CreateLogicViewReq	true	"请求参数"
//	@Success		200	{object}	response.BoolResp "成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/logic-view [post]
func (l *LogicViewService) CreateLogicView(c *gin.Context) {
	req := form_validator.Valid[logic_view.CreateLogicViewReq](c)
	if req == nil {
		return
	}

	logicVieId, err := l.uc.CreateLogicView(c, req) // 已记录业务审计日志
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, logicVieId)
}

// UpdateLogicView 编辑自定义视图和逻辑实体视图（字段）
//
//	@Description	编辑自定义视图和逻辑实体视图（字段）
//	@Tags			逻辑视图
//	@Summary		编辑自定义视图和逻辑实体视图字段
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_				body		logic_view.UpdateLogicViewReq	true	"请求参数"
//	@Success		200	{object}	response.BoolResp "成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/logic-view [put]
func (l *LogicViewService) UpdateLogicView(c *gin.Context) {
	req := form_validator.Valid[logic_view.UpdateLogicViewReq](c)
	if req == nil {
		return
	}

	if err := l.uc.UpdateLogicView(c, req); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// GetDraft 查询视图草稿
//
//	@Description	查询视图草稿
//	@Tags			逻辑视图
//	@Summary		查询视图草稿
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			id				path		string							true	"视图ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Param			_				body		logic_view.UpdateLogicViewReq	true	"请求参数"
//	@Success		200	{object}	response.BoolResp "成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/logic-view/{id}/draft [put]
func (l *LogicViewService) GetDraft(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetDraftReq](c)
	if req == nil {
		return
	}

	draft, err := util.TraceA1R2(c, req, l.uc.GetDraftReq)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, draft)
}

// DeleteDraft 删除草稿(恢复到发布)
//
//	@Description	删除草稿(恢复到发布)
//	@Tags			逻辑视图
//	@Summary		删除草稿恢复到发布
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			id				path		string							true	"视图ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Param			_				body		logic_view.UpdateLogicViewReq	true	"请求参数"
//	@Success		200	{object}	response.BoolResp "成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/logic-view/{id}/draft [put]
func (l *LogicViewService) DeleteDraft(c *gin.Context) {
	req := form_validator.Valid[logic_view.DeleteDraftReq](c)
	if req == nil {
		return
	}

	if err := util.TraceA1R1(c, req, l.uc.DeleteDraft); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// CreateAuditProcessInstance 审核流程实例创建
//
//	@Description	审核流程实例创建
//	@Tags			审核流程实例
//	@Summary		审核流程实例创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		logic_view.CreateAuditProcessInstanceReq	true	"请求参数"
//	@Success		200	{boolean}						"成功响应参数"
//	@Failure		400	{object}	rest.HttpError						"失败响应参数"
//	@Router			/logic-view/audit-process-instance [post]
func (l *LogicViewService) CreateAuditProcessInstance(c *gin.Context) {
	req := form_validator.Valid[logic_view.CreateAuditProcessInstanceReq](c)
	if req == nil {
		return
	}

	if err := l.uc.CreateAuditProcessInstance(c, req); err != nil { // 已记录业务审计日志
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// UndoAudit 审核撤回
//
//	@Description	审核撤回
//	@Tags			审核流程实例
//	@Summary		审核撤回
//	@Accept			json
//	@Produce		json
//	@Param			_	body		form_view.UndoAuditReq	true	"请求参数"
//	@Success		200	{boolean}						"成功响应参数"
//	@Failure		400	{object}	rest.HttpError						"失败响应参数"
//	@Router			/logic-view/revoke [put]
func (l *LogicViewService) UndoAudit(c *gin.Context) {
	req := form_validator.Valid[form_view.UndoAuditReq](c)
	if req == nil {
		return
	}

	if err := util.TraceA1R1(c, req, l.uc.UndoAudit); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

func (l *LogicViewService) GetViewAuditorsByApplyId(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetViewAuditorsByApplyIdReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, l.uc.GetViewAuditorsByApplyId)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (l *LogicViewService) GetViewAuditors(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetViewAuditorsReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, l.uc.GetViewAuditors)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (l *LogicViewService) GetViewBasicInfo(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetViewBasicInfoReqParam](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, l.uc.GetViewBasicInfo)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// PushViewToEs 2.0.0.5版本升级接口，发布后不可修改
func (l *LogicViewService) PushViewToEs(c *gin.Context) {
	err := util.TraceA0R1(c, l.uc.PushViewToEs)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// GetSyntheticData 获取合成数据
//
//	@Description	获取合成数据
//	@Tags			逻辑视图
//	@Summary		获取合成数据
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			id				path		string							true	"视图ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	virtualization_engine.FetchDataRes	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/logic-view/{id}/synthetic-data [get]
func (l *LogicViewService) GetSyntheticData(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetSyntheticDataReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, l.uc.GetSyntheticData)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (l *LogicViewService) GetSyntheticDataCatalog(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetSyntheticDataReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, l.uc.GetSyntheticDataCatalog)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (l *LogicViewService) ClearSyntheticDataCache(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetSyntheticDataReq](c)
	if req == nil {
		return
	}
	if err := util.TraceA1R1(c, req, l.uc.ClearSyntheticDataCache); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

// GetSampleData 获取样例数据
//
//	@Description	获取样例数据
//	@Tags			逻辑视图
//	@Summary		获取样例数据
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			id				path		string							true	"视图ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	virtualization_engine.FetchDataRes	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/logic-view/{id}/sample-data [get]
func (l *LogicViewService) GetSampleData(c *gin.Context) {
	req := form_validator.Valid[logic_view.GetSampleDataReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, l.uc.GetSampleData)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
