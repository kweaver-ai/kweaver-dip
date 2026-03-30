package v1

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/file_manager"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/subject_domain"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/af_sailor"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

var (
	_ af_sailor.SailorSubjectRecReq
	_ af_sailor.SailorSubjectRecResp
)

type SubjectDomainService struct {
	uc *subject_domain.SubjectDomainUsecase
}

func NewBusinessDomainService(uc *subject_domain.SubjectDomainUsecase) *SubjectDomainService {
	return &SubjectDomainService{uc: uc}
}

// List 获取业务对象定义列表
//
//	@Description	获取业务对象定义列表
//	@Tags			open业务对象
//	@Summary		获取业务对象定义列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			query			query		subject_domain.ListObjectsReqQueryParam	true	"查询参数"
//	@Success		200				{object}	subject_domain.ListObjectsResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/subject-domains [get]
func (s *SubjectDomainService) List(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := form_validator.Valid[subject_domain.ListObjectsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(ctx, req, s.uc.List)
	if err != nil {
		//log.WithContext(c.Request.Context()).Errorf("failed to get object list, req: %v, err: %v", req, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// CheckRepeat 名称重复校验
//
//	@Description	名称重复校验
//	@Tags			open业务对象
//	@Summary		名称重复校验
//	@Accept			json
//	@Produce		json
//	@Param			_				body		subject_domain.CheckRepeatReqParamBody	true	"请求参数"
//	@Success		200				{object}	subject_domain.CheckRepeatResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/subject-domain/check [post]
func (s *SubjectDomainService) CheckRepeat(c *gin.Context) {
	req := form_validator.Valid[subject_domain.CheckRepeatReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.CheckRepeat)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("name repeat or failed to check, req: %v, err: %v", req, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// AddObject 新建对象
//
//	@Description	新建对象
//	@Tags			业务对象定义
//	@Summary		新建对象
//	@Accept			application/json
//	@Produce		application/json
//	@Param			body			body		subject_domain.AddObjectReqBodyParam	true	"请求参数"
//	@Success		200				{object}	subject_domain.AddObjectResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/subject-domain [post]
func (s *SubjectDomainService) AddObject(c *gin.Context) {
	req := form_validator.Valid[subject_domain.AddObjectReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.AddObject)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to add Object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// UpdateObject 更新对象
//
//	@Description	更新对象
//	@Tags			业务对象定义
//	@Summary		更新对象
//	@Accept			application/json
//	@Produce		application/json
//	@Param			body			body		subject_domain.UpdateObjectBodyReqParam	true	"请求参数"
//	@Success		200				{object}	subject_domain.UpdateObjectResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/subject-domain [put]
func (s *SubjectDomainService) UpdateObject(c *gin.Context) {
	req := form_validator.Valid[subject_domain.UpdateObjectReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.UpdateObject)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to update Object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// DelObject 删除对象
//
//	@Description	删除对象
//	@Tags			业务对象定义
//	@Summary		删除对象
//	@Accept			application/json
//	@Produce		application/json
//	@Param			did				path		string							true	"对象ID"
//	@Success		200				{object}	subject_domain.DelObjectResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/subject-domain/{did} [delete]
func (s *SubjectDomainService) DelObject(c *gin.Context) {
	req := form_validator.Valid[subject_domain.DelObjectReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.DelObject)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete Object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetObject 获取对象详情
//
//	@Description	获取对象详情
//	@Tags			open业务对象
//	@Summary		获取对象详情
//	@Accept			json
//	@Produce		json
//	@Param			req 			query		subject_domain.ObjectIDReqQueryParam	true	"查询参数"
//	@Success		200				{object}	subject_domain.GetObjectResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/subject-domain [get]
func (s *SubjectDomainService) GetObject(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetObjectReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetObject)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get Object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetDetailAndChild 获取对象详情以及子孙节点
//
//	@Description	获取对象详情以及子孙节点
//	@Tags			open业务对象
//	@Summary		获取对象详情以及子孙节点
//	@Accept			json
//	@Produce		json
//	@Param			req			    query		subject_domain.GetObjectChildDetailReq	true	"查询参数"
//	@Success		200				{object}	subject_domain.GetObjectChildDetailResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-subject/v1/subject-domain/child [get]
func (s *SubjectDomainService) GetDetailAndChild(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetObjectChildDetailReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetObjectChildDetail)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get Object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// LevelCount 获取当前节点下的层级统计信息
//
//	@Description	获取当前节点下的层级统计信息
//	@Tags			open资产全景
//	@Summary		获取当前节点下的层级统计信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			req				query		subject_domain.IDReqQueryParam		false	"查询参数"
//	@Success		200				{object}	subject_domain.GetLevelCountResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/subject-domain/count [get]
func (s *SubjectDomainService) LevelCount(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetLevelCountReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, req, s.uc.GetLevelCount)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get level count, req: %v, err: %v", req, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// AddBusinessObject 编辑业务对象/业务活动定义
//
//	@Description	编辑业务对象/业务活动定义
//	@Tags			业务对象定义
//	@Summary		编辑业务对象/业务活动定义
//	@Accept			application/json
//	@Produce		application/json
//	@Param			body			body		subject_domain.AddBusinessObjectReqBodyParam	true	"请求参数"
//	@Success		200				{object}	subject_domain.AddBusinessObjectResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/subject-domain/logic-entity [post]
func (s *SubjectDomainService) AddBusinessObject(c *gin.Context) {
	req := form_validator.Valid[subject_domain.AddBusinessObjectReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.AddBusinessObject)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to add business Object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetBusinessObject 查看业务对象/业务活动定义
//
//	@Description	查看业务对象/业务活动定义
//	@Tags			open业务对象
//	@Summary		查看业务对象/业务活动定义
//	@Accept			json
//	@Produce		json
//	@Param			query			query		subject_domain.ObjectIDReqQueryParam	true	"查询参数"
//	@Success		200				{object}	subject_domain.GetBusinessObjectResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/subject-domain/logic-entity [get]
func (s *SubjectDomainService) GetBusinessObject(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetBusinessObjectReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetBusinessObject)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get business object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// CheckReferences 循环引用校验
//
//	@Description	循环引用校验
//	@Tags			业务对象
//	@Summary		循环引用校验
//	@Accept			application/json
//	@Produce		application/json
//	@Param			query			query		subject_domain.CheckReferencesReqQueryParam	true	"请求参数"
//	@Success		200				{object}	subject_domain.CheckReferencesResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/subject-domain/business-object/check-references [get]
func (s *SubjectDomainService) CheckReferences(c *gin.Context) {
	req := form_validator.Valid[subject_domain.CheckReferencesReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.CheckReferences)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to check references, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetObjectEntityPath 批量获取业务对象的全路径
//
//	@Description	批量获取业务对象的全路径
//	@Tags			open业务对象
//	@Summary		批量获取业务对象的全路径
//	@Accept			application/json
//	@Produce		application/json
//	@Param			query			query		subject_domain.GetPathReqQueryParam	true	"请求体"
//	@Success		200				{object}	subject_domain.GetPathResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/subject-domain/object-entity/path [get]
func (s *SubjectDomainService) GetObjectEntityPath(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetPathReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetObjectEntityPath)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get path, req: %v, err: %v", req, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetPath 批量获取业务对象和逻辑实体的全路径
//
//	@Description	批量获取业务对象和逻辑实体的全路径
//	@Tags			open业务对象
//	@Summary		批量获取业务对象和逻辑实体的全路径
//	@Accept			application/json
//	@Produce		application/json
//	@Param			query			query		subject_domain.GetPathReqQueryParam	true	"请求体"
//	@Success		200				{object}	subject_domain.GetPathResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/subject-domain/business-object/path [get]
func (s *SubjectDomainService) GetPath(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetPathReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetPath)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get path, req: %v, err: %v", req, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetBusinessObjectOwner 批量查看业务对象/业务活动关联数据owner详细信息
//
//	@Description	批量查看业务对象/业务活动关联数据owner详细信息
//	@Tags			open业务对象
//	@Summary		批量查看业务对象/业务活动关联数据owner详细信息
//	@Accept			json
//	@Produce		json
//	@Param			query			query		subject_domain.GetBusinessObjectOwnerReqQueryParam	true	"查询参数"
//	@Success		200				{object}	subject_domain.GetBusinessObjectOwnerResp			"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/subject-domain/business-object/owner [get]
func (s *SubjectDomainService) GetBusinessObjectOwner(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetBusinessObjectOwnerReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetBusinessObjectOwner)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get business object owner info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
func (s *SubjectDomainService) GetBusinessObjectsInternal(c *gin.Context) {
	req := form_validator.Valid[subject_domain.ObjectIdInternalReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetBusinessObjectsInternal)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get business object owner info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
func (s *SubjectDomainService) GetBusinessObjectInternal(c *gin.Context) {
	req := form_validator.Valid[subject_domain.ObjectIdInternalReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetBusinessObjectInternal)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get business object owner info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
func (s *SubjectDomainService) GetAttributeByObjectInternal(c *gin.Context) {
	req := form_validator.Valid[subject_domain.ObjectIdInternalReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetAttributeByObjectInternal)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get business object owner info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// BatchCreateObjectAndContent 批量新建业务对象/活动
//
//	@Description	批量新建业务对象/活动 及其下面的逻辑实体及属性
//	@Tags			业务对象定义
//	@Summary		批量新建业务对象/活动
//	@Accept			application/json
//	@Produce		application/json
//	@Param			body			body		subject_domain.BatchCreateObjectContentReq	true	"请求参数"
//	@Success		200				bool		bool										"成功响应参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/business-object/context [post]
func (s *SubjectDomainService) BatchCreateObjectAndContent(c *gin.Context) {
	req := form_validator.Valid[subject_domain.BatchCreateObjectContentReq](c)
	if req == nil {
		return
	}

	err := util.TraceA1R1(c, req, s.uc.BatchCreateObjectContent)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to BatchCreateObjectAndContent, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}

// GetFormSubjects  godoc
//
//	@Summary		获取业务表关联业务对象
//	@Description	获取业务表关联业务对象
//	@Accept			application/json
//	@Produce		application/json
//	@Tags			open业务对象
//	@Param			fid				query		string	true	"业务表id,uuid"
//	@Param			oid				query		string	true	"业务对象id,uuid"
//	@Success		200				{object}	subject_domain.GetFormFiledRelevanceObjectRes
//	@Failure		400				{object}	rest.HttpError
//	@Router			/forms/glossary	 [get]
func (b *SubjectDomainService) GetFormSubjects(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetFormSubjectsReqParam](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, b.uc.GetFormSubjects)
	if err != nil {
		log.Errorf(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// UpdateFormSubjects  godoc
//
//	@Summary		修改业务表关业务对象
//	@Description	修改业务表关业务对象
//	@Accept			application/json
//	@Produce		application/json
//	@Tags			open业务对象
//	@Param			fid				path		string										true	"业务表id"
//	@Param			data			body		subject_domain.UpdateFormSubjectsReqParam	true	"修改业务表字段关联属性请求体"
//	@Success		200				{boolean}	boolean										"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/forms/subjects	 [PUT]
func (b *SubjectDomainService) UpdateFormSubjects(c *gin.Context) {
	req := form_validator.Valid[subject_domain.UpdateFormSubjectsReqParam](c)
	if req == nil {
		return
	}

	if err := util.TraceA1R1(c, req, b.uc.UpdatesFormSubjects); err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, "OK")
}

// DeleteFormSubjects  godoc
//
//	@Summary		批量删除修改业务表关业务对象
//	@Description	批量删除修改业务表关业务对象，bg服务使用
//	@Accept			application/json
//	@Produce		application/json
//	@Tags			BusinessForm,glossary
//	@Param			fid				path		string										true	"业务表id"
//	@Param			data			body		subject_domain.RemoveFormSubjectsReqParam	true	"删除业务表字段关联属性请求体"
//	@Success		200				{boolean}	boolean										"成功响应参数"
//	@Failure		400				{object}	rest.HttpError
//	@Router			/forms/subjects	 [PUT]
func (b *SubjectDomainService) DeleteFormSubjects(c *gin.Context) {
	req := form_validator.Valid[subject_domain.RemoveFormSubjectsReqParam](c)
	if req == nil {
		return
	}

	if err := util.TraceA1R1(c, req.FormIDSlice, b.uc.RemoveFormSubjects); err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, "OK")
}

// GetObjectPrecision 根据id列表批量获取业务对象详情
//
//	@Description	根据id列表批量获取业务对象详情
//	@Tags			open业务对象
//	@Summary		根据id列表批量获取业务对象详情
//	@Accept			json
//	@Produce		json
//	@Param			query			query		subject_domain.GetObjectPrecisionReq	true	"查询参数"
//	@Success		200				{object}	subject_domain.GetObjectPrecisionRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/subject-domain/precision [get]
func (s *SubjectDomainService) GetObjectPrecision(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetObjectPrecisionReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, req, s.uc.GetObjectPrecision)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get business object owner info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetSubjectDomainByPaths 根据业务对象Path批量获取业务对象详情
//
//	@Description	根据业务对象Path批量获取业务对象详情
//	@Tags			open业务对象
//	@Summary		根据业务对象Path批量获取业务对象详情
//	@Accept			json
//	@Produce		json
//	@Param			body			body		subject_domain.GetSubjectDomainByPathsReq	true	"查询参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/subject-domain/paths [post]
func (s *SubjectDomainService) GetSubjectDomainByPaths(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetSubjectDomainByPathsReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, req.Paths, s.uc.GetSubjectDomainByPaths)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get subject domain info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (s *SubjectDomainService) DelLabels(c *gin.Context) {
	req := form_validator.Valid[subject_domain.DelLabelIdsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.DelLabels)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete label, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetAttribute 获取属性信息
//
//	@Description	获取属性信息
//	@Tags			open业务对象
//	@Summary		获取属性信息
//	@Accept			json
//	@Produce		json
//	@Param			query			query		subject_domain.GetAttributeReq	true	"查询参数"
//	@Success		200				{object}	subject_domain.GetAttributRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/subject-domain/attribute [get]
func (s *SubjectDomainService) GetAttribute(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetAttributeReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetAttribute)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get Object, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetClassificationFullView 统计顶层或者某个主题的分类分级详情
//
//	@Description	统计顶层或者某个主题的分类分级详情
//	@Tags			open资产全景
//	@Summary		统计顶层或者某个主题的分类分级详情
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			req				query		subject_domain.QueryClassificationReq	true	"查询参数"
//	@Success		200				{object}	subject_domain.QueryClassificationResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/classification [get]
func (s *SubjectDomainService) GetClassificationFullView(c *gin.Context) {
	req := form_validator.Valid[subject_domain.QueryClassificationReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.QueryClassificationInfo)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get classify info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetHierarchyViewFieldDetail 查询主题节点的分类分级以及关联的字段详情
//
//	@Description	统计多个分级标签下面某节点视图数量
//	@Tags			资产全景
//	@Summary		统计多个分级标签下面某节点视图数量
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			req				query		subject_domain.QueryHierarchyTotalInfoReq	true	"查询参数"
//	@Success		200				{object}	subject_domain.QueryHierarchyTotalInfoResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/classification/field [get]
func (s *SubjectDomainService) GetHierarchyViewFieldDetail(c *gin.Context) {
	req := form_validator.Valid[subject_domain.QueryHierarchyTotalInfoReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.QueryClassifyViewDetail)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get classify field info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetHierarchyViewFieldDetailByPage 分页查询主题节点的分类分级以及关联的字段详情
//
//	@Description	统计多个分级标签下面某节点视图数量
//	@Tags			open资产全景
//	@Summary		统计多个分级标签下面某节点视图数量
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			req				query		subject_domain.QueryHierarchyTotalInfoReq	true	"查询参数"
//	@Success		200				{object}	subject_domain.QueryHierarchyTotalInfoResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError								"失败响应参数"
//	@Router			/classification/fields [get]
func (s *SubjectDomainService) GetHierarchyViewFieldDetailByPage(c *gin.Context) {
	req := form_validator.Valid[subject_domain.QueryHierarchyTotalInfoReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.QueryClassifyFieldsDetailByPage)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get classify field info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetClassificationStats 分类分级统计详情
//
//	@Description	分类分级统计详情
//	@Tags			open资产全景
//	@Summary		分类分级统计详情
//	@Accept			text/plain
//	@Produce		application/json
//	@Param			req				query		subject_domain.QueryClassificationReq	true	"查询参数"
//	@Success		200				{object}	subject_domain.QueryClassificationResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/classification [get]
func (s *SubjectDomainService) GetClassificationStats(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetClassificationStatsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetClassificationStats)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get QueryHierarchyCountDetail info, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (s *SubjectDomainService) GetAttributes(c *gin.Context) {
	req := form_validator.Valid[subject_domain.GetAttributesReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.GetAttributes)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get Objects, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// ImportSubjectDomain 导入业务对象
//
//	@Description	导入业务对象
//	@Tags			导入导出
//	@Summary		导入业务对象
//	@Accept			multipart/form-data
//	@Produce		json
//	@param			file			formData	file	true	"上传的文件"
//	@Success		200
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/subject-domains/import [post]
func (s *SubjectDomainService) ImportSubjectDomain(c *gin.Context) {
	defer func() {
		if err := recover(); err != nil {
			if v, ok := err.(error); ok {
				log.WithContext(c.Request.Context()).Error("ExportSubjectDomain Panic " + v.Error())
				c.Writer.WriteHeader(400)
				ginx.ResErrJson(c, errorcode.Detail(my_errorcode.FormPanic, v.Error()))
				return
			}
			log.WithContext(c.Request.Context()).Error(fmt.Sprintf("ExportSubjectDomain Panic %v", err))
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, errorcode.Desc(my_errorcode.FormPanic))
			return
		}
	}()

	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(my_errorcode.FormExistRequiredEmpty))
		return
	}
	headers := form.File["file"]
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(my_errorcode.FormOneMax))
		return
	}

	formFile := headers[0]
	//保存文件
	// dir := settings.ConfigInstance.Config.Form.Standard.Dir
	dir := "/root/subjectdomain"
	file, err := file_manager.SaveFile(c, "", formFile, dir)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}

	err = s.uc.ImportSubDomain(c, file, formFile)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}

// ExportSubjectDomain 下载业务对象模板
//
//	@Description	导出业务对象
//	@Tags			导入导出
//	@Summary		导出业务对象
//	@Accept			json
//	@Produce		json
//	@Param			req			body	subject_domain.ExportObjectIdsReq	true	"请求参数"
//	@Success		200
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/subject-domains/export [post]
func (s *SubjectDomainService) ExportSubjectDomain(c *gin.Context) {
	defer func() {
		if err := recover(); err != nil {
			if v, ok := err.(error); ok {
				log.WithContext(c.Request.Context()).Error("ExportSubjectDomain Panic " + v.Error())
				c.Writer.WriteHeader(400)
				ginx.ResErrJson(c, errorcode.Detail(my_errorcode.FormPanic, v.Error()))
				return
			}
			log.WithContext(c.Request.Context()).Error(fmt.Sprintf("ExportSubjectDomain Panic %v", err))
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, errorcode.Desc(my_errorcode.FormPanic))
			return
		}
	}()

	req := form_validator.Valid[subject_domain.ExportObjectIdsReq](c)
	if req == nil {
		return
	}

	var name string
	file, name, err := s.uc.ExportSubjectDomains(c, req.IDs)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResBadRequestJson(c, err)
		return
	}
	var fileName string
	if len(req.IDs) > 1 {
		fileName = fmt.Sprintf("%s-%d.xlsx", "业务对象excel导出", time.Now().Unix())
	} else {
		fileName = fmt.Sprintf("%s.xlsx", name)
	}
	util.Write(c, fileName, file)
}

// ExportSubjectDomainTemplate 下载业务对象模板
//
//	@Description	下载业务对象模板
//	@Tags			导入导出
//	@Summary		下载业务对象模板
//	@Accept			json
//	@Produce		json
//	@Success		200
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/subject-domains/template [get]
func (s *SubjectDomainService) ExportSubjectDomainTemplate(c *gin.Context) {
	defer func() {
		if err := recover(); err != nil {
			if v, ok := err.(error); ok {
				log.WithContext(c.Request.Context()).Error("ExportSubjectDomainTemplate Panic " + v.Error())
				c.Writer.WriteHeader(400)
				ginx.ResErrJson(c, errorcode.Detail(my_errorcode.FormPanic, v.Error()))
				return
			}
			log.WithContext(c.Request.Context()).Error(fmt.Sprintf("ExportSubjectDomainTemplate Panic %v", err))
			c.Writer.WriteHeader(400)
			ginx.ResErrJson(c, errorcode.Desc(my_errorcode.FormPanic))
			return
		}
	}()

	file, err := s.uc.ExportSubjectDomainTemplate(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResBadRequestJson(c, err)
		return
	}
	fileName := "业务对象导入模板.xlsx"
	util.Write(c, fileName, file)
}

// 业务对象属性识别业务标准表字段推荐
//
//	@Description	业务对象识别业务标准表字段推荐
//	@Tags			open业务对象
//	@Summary		业务对象识别业务标准表字段推荐
//	@Accept      application/json
//	@Produce     json
//	@Param 		 data body af_sailor.SailorSubjectRecReq true "批量获取业务属性关联业务标准关系列表"
//	@Success       200 {object} af_sailor.SailorSubjectRecResp "成功响应参数"
//	@Failure      400 {object} rest.HttpError
//	@Router			/subject-domain/query-business-rec-list [post]
func (s *SubjectDomainService) QueryBusinessSubjectRecList(c *gin.Context) {
	req := form_validator.Valid[subject_domain.BusinessSubjectRecReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, s.uc.QueryBusinessSubjectRecList)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get QueryBusinessSubjectRecList, req: %s, err: %v", lo.T2(json.Marshal(req)).A, err)
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
