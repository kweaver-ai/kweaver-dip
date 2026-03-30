package v1

import (
	"github.com/gin-gonic/gin"
	errorcode2 "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var _ = new(response.IDResp)

type Service struct {
	uc domain.UseCase
}

func NewGraphModel(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// Create 创建模型
//
//	@Description	创建模型
//	@Tags			图谱模型
//	@Summary		创建模型
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_			    body		domain.CreateModelReq	true	"请求参数"
//	@Success		200				{object}	response.IDResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model  [post]
func (s *Service) Create(c *gin.Context) {
	req := form_validator.Valid[domain.CreateModelReqParam](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.CreateModelReq, s.uc.Create)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CheckExist 模型名称重复检查
//
//	@Description	模型名称重复检查
//	@Tags			图谱模型
//	@Summary		模型名称重复检查
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_			    query		domain.ModelNameCheckReq	true	"请求参数"
//	@Success		200				{object}	response.CheckRepeatResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/check  [GET]
func (s *Service) CheckExist(c *gin.Context) {
	req := form_validator.Valid[domain.ModelNameCheckReqParam](c)
	if req == nil {
		return
	}
	err := util.TraceA1R1(c, &req.ModelNameCheckReq, s.uc.CheckNameExist)
	if err != nil && errorx.Is(err, errorcode2.PublicDatabaseErr.Err()) {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{
		Name:   req.Name(),
		Repeat: err != nil,
	})
}

// Update 更新模型
//
//	@Description	更新模型
//	@Tags			图谱模型
//	@Summary		更新模型
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"模型ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Param			_			    body		domain.UpdateModelReq	true	"请求参数"
//	@Success		200				{object}	response.IDResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/{id}  [PUT]
func (s *Service) Update(c *gin.Context) {
	req := form_validator.Valid[domain.UpdateModelReqParam](c)
	if req == nil {
		return
	}
	req.UpdateModelReq.ID = req.IDReq.ID
	resp, err := util.TraceA1R2(c, &req.UpdateModelReq, s.uc.Update)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Get 模型详情
//
//	@Description	模型详情
//	@Tags			图谱模型
//	@Summary		模型详情
//	@Accept			plain/text
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"模型ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	domain.ModelDetail	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/{id}  [GET]
func (s *Service) Get(c *gin.Context) {
	req := form_validator.Valid[request.IDPathReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.IDReq, s.uc.Get)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// List 模型列表
//
//	@Description	模型列表
//	@Tags			图谱模型
//	@Summary		模型列表
//	@Accept			plain/text
//	@Produce		application/json
//	@Param			Authorization	header		string			true	"token"
//	@Param			_			    query		request.IDReq	true	"请求参数"
//	@Success		200				{object}	response.PageResult[domain.ModeListItem]	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model     [GET]
func (s *Service) List(c *gin.Context) {
	req := form_validator.Valid[domain.ModelListReqParam](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.ModelListReq, s.uc.List)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete 删除模型
//
//	@Description	删除模型
//	@Tags			图谱模型
//	@Summary		删除模型
//	@Accept			plain/text
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"模型ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	response.IDResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/graph-model/{id}    [DELETE]
func (s *Service) Delete(c *gin.Context) {
	req := form_validator.Valid[request.IDPathReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.IDReq, s.uc.Delete)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateMj 设置主题模型密级
//
//	@Description	设置主题模型密级
//	@Tags			图谱模型
//	@Summary		设置主题模型密级
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"模型ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Param			_			    body		domain.UpdateTopicModelMjReqParam	true	"请求参数"
//	@Success		200				{object}	response.IDResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/topic-confidential/{id}  [PUT]
func (s *Service) UpdateMj(c *gin.Context) {
	req := form_validator.Valid[domain.UpdateTopicModelMjReqParam](c)
	if req == nil {
		return
	}
	req.UpdateTopicModelMjReq.ID = req.IDReq.ID
	resp, err := util.TraceA1R2(c, &req.UpdateTopicModelMjReq, s.uc.UpdateTopicModelMj)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// QueryTopicModelLabelRecList 主题模型标签推荐配置列表
//
//	@Description	主题模型标签推荐配置列表
//	@Tags			图谱模型
//	@Summary		主题模型标签推荐配置列表
//	@Accept			plain/text
//	@Produce		application/json
//	@Param			_			    query		request.PageSortKeyword3	true	"请求参数"
//	@Success		200				{object}	response.PageResult[domain.ModelLabelRecRelResp]	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/topic-label-rec     [GET]
func (s *Service) QueryTopicModelLabelRecList(c *gin.Context) {
	req := form_validator.Valid[domain.TopicModelLabelRecListReqParam](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.PageSortKeyword3, s.uc.QueryTopicModelLabelRecList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Create 新增主题模型标签推荐配置
//
//	@Description	新增主题模型标签推荐配置
//	@Tags			图谱模型
//	@Summary		新增主题模型标签推荐配置
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			_			    body		domain.CreateModelLabelRecRelReq	true	"请求参数"
//	@Success		200				{object}	response.IDResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/topic-label-rec  [post]
func (s *Service) CreateTopicModelLabelRec(c *gin.Context) {
	req := form_validator.Valid[domain.CreateModelLabelRecRelReqParam](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.CreateModelLabelRecRelReq, s.uc.CreateTopicModelLabelRec)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UpdateTopicModelLabelRec 修改主题模型标签推荐配置
//
//	@Description	修改主题模型标签推荐配置
//	@Tags			图谱模型
//	@Summary		修改主题模型标签推荐配置
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"配置ID"	Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Param			_			    body		domain.UpdateModelLabelRecRelReqParam	true	"请求参数"
//	@Success		200				{object}	response.IDResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/topic-label-rec/{id}  [PUT]
func (s *Service) UpdateTopicModelLabelRec(c *gin.Context) {
	req := form_validator.Valid[domain.UpdateModelLabelRecRelReqParam](c)
	if req == nil {
		return
	}
	req.UpdateModelLabelRecRelReq.ID = req.IDReq.ID
	resp, err := util.TraceA1R2(c, &req.UpdateModelLabelRecRelReq, s.uc.UpdateTopicModelLabelRec)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetTopicModelLabelRec 主题模型标签推荐配置详情
//
//	@Description	主题模型标签推荐配置详情
//	@Tags			图谱模型
//	@Summary		主题模型标签推荐配置详情
//	@Accept			plain/text
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"配置ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	domain.ModelLabelRecRelResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/topic-label-rec/{id}  [GET]
func (s *Service) GetTopicModelLabelRec(c *gin.Context) {
	req := form_validator.Valid[request.IDPathReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.IDReq, s.uc.GetTopicModelLabelRec)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DeleteTopicModelLabelRec 删除主题模型标签推荐配置
//
//	@Description	删除主题模型标签推荐配置
//	@Tags			图谱模型
//	@Summary		删除主题模型标签推荐配置
//	@Accept			plain/text
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			id			    path		string					true	"配置ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
//	@Success		200				{object}	response.IDResp	        "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/graph-model/topic-label-rec/{id}  [DELETE]
func (s *Service) DeleteTopicModelLabelRec(c *gin.Context) {
	req := form_validator.Valid[request.IDPathReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, &req.IDReq, s.uc.DeleteTopicModelLabelRec)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
