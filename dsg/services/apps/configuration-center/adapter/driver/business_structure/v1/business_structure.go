package business_structure

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"go.uber.org/zap"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

/*
// CheckRepeat godoc
//
//	@Summary		名称重复性校验
//	@Tags			组织架构
//	@Description	名称重复性校验，同一部门下不允许有多个同名子部门
//	@Accept			x-www-form-urlencoded
//	@Produce		json
//	@Param			_	query		domain.CheckRepeatReq	false	"重复性校验请求参数"
//	@Success		200	{object}	response.CheckRepeatResp	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/objects/check [get]
func (s *Service) CheckRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var req domain.CheckRepeatReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	repeat, err := s.uc.CheckRepeat(ctx, req.CheckType, req.ID, *req.Name, req.ObjectType)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	if repeat {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.BusinessStructureObjectNameRepeat))
		return
	}
	ginx.ResOKJson(c, &response.CheckRepeatResp{Name: *req.Name, Repeat: false})
}
*/

/*
// DeleteObjects godoc
//
//	@Description	批量删除
//	@Tags			组织架构
//	@Summary		根据id批量删除部门及其下属部门
//	@Accept			application/json
//	@Produce		application/json
//	@Param			ids	body		domain.ObjectDeleteReq	true	"Object IDS，uuid"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/objects/batch [post]
func (s *Service) DeleteObjects(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var deleteReq domain.ObjectDeleteReq
	valid, errs := form_validator.BindJsonAndValid(c, &deleteReq)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	if c.GetHeader("x-real-method") != http.MethodDelete {
		log.WithContext(ctx).Error("unsupported request")
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.BusinessStructureUnsupportedRequest))
		return
	}

	err = s.uc.DeleteObjects(ctx, &deleteReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, nil)

}
*/

// Update godoc
//
//		@Description	修改组织架构信息
//		@Tags			组织架构
//		@Summary		修改组织架构信息
//		@Accept			application/json
//		@Produce		application/json
//	 	@Param			id  path		string						true	"部门id，uuid"
//		@Param			_	body		domain.ObjectUpdateReqBody	true	"请求参数"
//		@Success		200	{object}	response.NameIDResp			"成功响应参数"
//		@Failure		400	{object}	rest.HttpError				"失败响应参数"
//		@Router			/objects/{id} [put]
func (s *Service) Update(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, &uriParam)
	jsonParam := domain.ObjectUpdateReqBody{}
	valid, errs := form_validator.BindJsonAndValid(c, &jsonParam)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	var req = domain.ObjectUpdateReq{
		ObjectPathParam:     uriParam,
		ObjectUpdateReqBody: jsonParam,
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	name, err := s.uc.UpdateObject(ctx, &req, userInfo.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, []response.NameIDResp{{ID: req.ID, Name: name}})
}

/*
// Create godoc
//
//	@Description	创建部门
//	@Tags			组织架构
//	@Summary		创建部门
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	body		domain.ObjectCreateReq	true	"请求参数"
//	@Success		200	{object}	response.NameIDResp		"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/objects [post]
func (s *Service) Create(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	var create domain.ObjectCreateReq
	valid, errs := form_validator.BindJsonAndValid(c, &create)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	id, name, err := s.uc.CreateObject(ctx, &create)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, []response.NameIDResp{{ID: id, Name: name}})
}
*/

// GetObjects godoc
//
//	@Summary		获取部门列表
//	@Tags			open组织架构
//	@Description	获取部门列表，支持分页
//	@Accept			x-www-form-urlencoded
//	@Produce		json
//	@Param			_	query		domain.QueryPageReqParam	false	"查询参数"
//	@Success		200	{object}	domain.QueryPageReapParam	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/objects [get]
func (s *Service) GetObjects(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.QueryPageReqParam{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	var res *domain.QueryPageReapParam
	res, err = s.uc.ListByPaging(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to list object", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetObjectsOraganization godoc
//
//	@Summary		获取部门部门列表
//	@Tags			open组织架构
//	@Description	获取部门列表，支持分页
//	@Accept			x-www-form-urlencoded
//	@Produce		json
//	@Param			_	query		domain.QueryPageReqParam	false	"查询参数"
//	@Success		200	{object}	domain.QueryPageReapParam	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/objects [get]
func (s *Service) GetObjectsOraganization(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.QueryOrgPageReqParam{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	var res *domain.QueryPageReapParam
	res, err = s.uc.ListByPagingWithRegisterAndTag(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to list object", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

func (s *Service) GetObjectList(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.QueryPageReqParam{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	var res *domain.QueryPageReapParam
	res, err = s.uc.ListByPaging(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to list object", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetObjectById 查看部门详情
//
//	@Summary		查看部门详情
//	@Description	查看部门详情接口描述
//	@Tags			组织架构
//	@Accept			x-www-form-urlencoded
//	@Produce		json
//	@Param			id	path		string			true	"部门ID，uuid"
//	@Success		200	{object}	domain.GetResp	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/objects/{id} [get]
func (s *Service) GetObjectById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get object api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	req := &domain.QueryType{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	id := uriParam.ID
	types := req.Type

	resp, err := s.uc.GetType(ctx, id, int32(types))
	if err != nil {
		log.WithContext(ctx).Error("failed to get object info", zap.String("object id", id), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Upload godoc
//
//	@Description	上传文件
//	@Tags			组织架构
//	@Summary		上传文件
//	@Accept			multipart/form-data
//	@Produce		application/json
//	@Param			id	path string	true "部门ID，uuid"
//	@Param			file   formData   file   true   "上传的文件"
//	@Success		200	{object}	string		"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/objects/{id}/upload [post]
func (s *Service) Upload(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in upload api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	id := uriParam.ID
	form, err := c.MultipartForm()
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.BusinessStructureFormDataReadError, err.Error()))
		return
	}
	files := form.File["file"]
	if len(files) == 0 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.BusinessStructureMustUploadFile))
		return
	}
	res, err := s.uc.Save(ctx, id, files)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// Download  godoc
// @Summary     下载文件
// @Description 下载文件
// @Accept      plain
// @Produce     application/json
// @param       id   path  string  true "文件的UUID"
// @Param       req  body  domain.DownloadReq true    "请求参数"
// @Tags        组织架构
// @Success     200 {object}  response.NameIDResp
// @Failure     400 {object} rest.HttpError
// @Router      /objects/{id}/download [POST]
func (s *Service) Download(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req uri param in download api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	jsonParam := domain.DownloadReq{}
	if _, err := form_validator.BindJsonAndValid(c, &jsonParam); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req body param in download api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	data, fileName, err := s.uc.GetFile(ctx, uriParam.ID, jsonParam.FileId)
	if err != nil {
		//log.WithContext(ctx).Error("failed to Download ", zap.String("object id", uriParam.ID), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	c.Writer.WriteHeader(http.StatusOK)
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename*=utf-8''%s", url.PathEscape(fileName)))
	c.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	//c.Header("Accept-Length", fmt.Sprintf("%d", len(data)))
	_, err = c.Writer.Write(data)
	if err != nil {
		log.WithContext(ctx).Error("Download failed to Write", zap.Error(err))
	}
}

/*
// GetObjectNames  godoc
// @Summary     获取部门名称
// @Description 获取部门名称
// @Accept      plain
// @Produce     application/json
// @Tags        组织架构
// @Param		ids	body domain.ObjectIDReqParam true "Object IDS，uuid"
// @Success     200 {array}  domain.ObjectInfoResp
// @Failure     400 {object} rest.HttpError
// @Router      /objects/names [GET]
func (s *Service) GetObjectNames(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.ObjectIDReqParam{}
	_, err = form_validator.BindJsonAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in get object names api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := s.uc.GetNames(ctx, req.IDS, req.Type)
	if err != nil {
		log.WithContext(ctx).Error("failed to get object names", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
*/

// GetObjectsPathTree godoc
//
//	@Summary		获取树形部门列表
//	@Tags			open组织架构
//	@Description	获取指定部门列表，以树形结构展示，不支持分页
//	@Accept			x-www-form-urlencoded
//	@Produce		json
//	@Param			_	query		domain.QueryPageReqParam	false	"查询参数"
//	@Success		200	{array}	    domain.SummaryInfoTreeNode	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/objects/tree [get]
func (s *Service) GetObjectsPathTree(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	treeReq := &domain.QueryPageReqParam{}
	_, err = form_validator.BindQueryAndValid(c, treeReq)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	treeReq.IsAll = true
	treeReq.Offset = 1
	treeReq.Limit = 0

	//var res *domain.QueryPageReapParam

	tree, err := s.uc.ToTree(ctx, treeReq)
	if err != nil {
		log.WithContext(ctx).Error("failed to list object", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	// []*business_structure.SummaryInfoTreeNode
	//s.uc.ToTree(ctx, treeReq)
	//tree, _ := res.ToTree(treeReq.ID)

	ginx.ResOKJson(c, tree)
}

/*
// Move godoc
//
//		@Description	移动部门
//		@Tags			组织架构
//		@Summary		移动部门
//		@Accept			application/json
//		@Produce		application/json
//	 	@Param			id  path		string						true	"移动后父部门id，uuid"
//		@Param			_	body		domain.ObjectMoveReqBody	true	"请求参数"
//		@Success		200	{object}	response.NameIDResp			"成功响应参数"
//		@Failure		400	{object}	rest.HttpError				"失败响应参数"
//		@Router			/objects/{id}/move [put]
func (s *Service) Move(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in move object api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	req := domain.ObjectMoveReqBody{}
	valid, errs := form_validator.BindJsonAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	name, err := s.uc.MoveObject(ctx, uriParam.ID, req.OID, req.Name)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, response.NameIDResp{ID: req.OID, Name: name})
}
*/

/*
// GetObjectPathInfo  godoc
// @Summary     获取部门路径信息
// @Description 获取部门路径信息
// @Accept      plain
// @Produce     application/json
// @Tags       组织架构
// @Param		id path string true "部门id，uuid"
// @Success     200 {array}  domain.ObjectPathInfoResp
// @Failure     400 {object} rest.HttpError
// @Router      /objects/{id}/path [GET]
func (s *Service) GetObjectPathInfo(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get object path api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.GetObjectPathInfo(ctx, uriParam.ID)
	if err != nil {
		log.WithContext(ctx).Error("failed to get object path", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
*/

/*
// GetSuggestedName  godoc
// @Summary     获取部门建议名
// @Description 获取部门建议名
// @Accept      plain
// @Produce     application/json
// @Tags        组织架构
// @Param		id path string true "部门id，uuid"
// @Param		_ query domain.SuggestedNameReq	false "查询参数"
// @Success     200 {object} response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError
// @Router      /objects/{id}/suggested-name [GET]
func (s *Service) GetSuggestedName(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get suggested name api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	req := &domain.SuggestedNameReq{}
	_, err = form_validator.BindQueryAndValid(c, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query suggested name api, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	name, err := s.uc.GetSuggestedName(ctx, uriParam.ID, req.ParentID)
	if err != nil {
		log.WithContext(ctx).Error("failed to get suggested name", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, []response.NameIDResp{{ID: uriParam.ID, Name: name}})
}
*/

func (s *Service) GetDepartmentPrecision(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.GetDepartmentPrecisionReq{}
	if _, err = form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetDepartmentPrecision(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("failed to list object", zap.Error(err))
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}
func (s *Service) GetDepartmentByPath(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &configuration_center.GetDepartmentByPathReq{}
	if _, err = form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(ctx).Errorf("failed to bind req param in query domain list api, err: %v", err)
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	ginx.ResOKJson(c, "res")
}

// GetDepartsByPaths
// @Summary     查询路径对应的部门
// @Description 查询路径对应的部门
// @Tags        组织架构
// @Accept      application/json
// @Produce     json
// @Param 		Authorization header string  true "用户令牌"
// @Param 		req query configuration_center.GetDepartmentByPathReq  true "请求参数"
// @Success     200 {array} configuration_center.GetDepartmentByPathRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /department/paths [post]
func (s *Service) GetDepartsByPaths(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &configuration_center.GetDepartmentByPathReq{}
	if _, err = form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(ctx).Error("failed to bind req param in GetDepartsByPaths api", zap.Error(err))
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	res, err := s.uc.GetDepartsByPaths(ctx, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// SyncStructure 同步组织架构
//
//		@Description	同步组织架构
//		@Tags			组织架构
//		@Summary		同步组织架构
//		@Accept			application/json
//		@Produce		application/json
//	    @Param 		    Authorization header string  true "用户令牌"
//		@Success		200	{object}	boolean		            "成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/objects/sync [post]
func (s *Service) SyncStructure(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	res, err := s.uc.SyncStructure(ctx)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetSyncTime 获取组织架构同步时间
//
//		@Description	获取组织架构同步时间
//		@Tags			组织架构
//		@Summary		获取组织架构同步时间
//		@Accept			application/json
//		@Produce		application/json
//	    @Param 		    Authorization header string  true "用户令牌"
//		@Success		200	{object}	domain.GetSyncTimeResp		            "成功响应参数"
//		@Failure		400	{object}	rest.HttpError			"失败响应参数"
//		@Router			/objects/sync/time [get]
func (s *Service) GetSyncTime(c *gin.Context) {
	var err error
	_, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	res, err := s.uc.GetSyncTime()
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (s *Service) UpdateFileById(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, &uriParam)
	jsonParam := domain.ObjectUpdateFileReq{}
	valid, errs := form_validator.BindJsonAndValid(c, &jsonParam)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	name, err := s.uc.UpdateFileById(ctx, &jsonParam, uriParam.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, []response.NameIDResp{{ID: uriParam.ID, Name: name}})
}

// FirstLevelDepartment 查询一级部门
//
//	@Description	查询一级部门
//	@Tags			组织架构
//	@Summary		查询一级部门
//	@Produce		application/json
//	@Success		200				{object}	domain.FirstLevelDepartmentRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/objects/first_level_department [get]
func (s *Service) FirstLevelDepartment(c *gin.Context) {
	var err error
	_, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	res, err := s.uc.FirstLevelDepartment(c)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDepartmentByIdOrThirdId
//
//	@Summary		根据部门ID或第三方部门ID查询部门部门
//	@Description	根据部门ID或第三方部门ID查询部门部门
//	@Tags			组织架构
//	@Accept			x-www-form-urlencoded
//	@Produce		json
//	@Param			id	path		string			true	"部门ID或第三方部门ID，uuid"
//	@Success		200	{object}	domain.GetResp	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/objects/department/{id} [get]
func (s *Service) GetDepartmentByIdOrThirdId(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	uriParam := &domain.ObjectPathParam{}
	_, err = form_validator.BindUriAndValid(c, uriParam)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get GetDepartmentByIdOrThirdId api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	id := uriParam.ID

	resp, err := s.uc.GetDepartmentByIdOrThirdId(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("failed to get GetDepartmentByIdOrThirdId info", zap.String("GetDepartmentByIdOrThirdId", id), zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s *Service) GetDepartmentsByIds(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	param := &domain.IdsReq{}
	_, err = form_validator.BindQueryAndValid(c, param)
	if err != nil {
		log.WithContext(ctx).Error("failed to bind req param in get GetDepartmentsByIds api", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}
	resp, err := s.uc.GetDepartmentsByIds(ctx, param.IDs)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
