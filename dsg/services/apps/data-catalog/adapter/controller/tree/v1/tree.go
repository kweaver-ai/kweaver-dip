package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc domain.UseCase
}

// NewService 新建tree service
func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// Create 新建目录组
//
//		Disable @Description	新建目录组
//		Disable @Tags			目录组管理
//		Disable @Summary		新建目录组
//		Disable @Accept			application/json
//		Disable @Produce		application/json
//	    Disable @Param       Authorization     header   string                    true "token"
//		Disable @Param			_	body		domain.CreateReqParam	true	"请求参数"
//		Disable @Success		200	{object}	domain.CreateRespParam	"成功响应参数"
//		Disable @Failure		400	{object}	rest.HttpError			"失败响应参数"
//		Disable @Router			/api/data-catalog/v1/trees [post]
func (s *Service) Create(c *gin.Context) {
	req := &domain.CreateReqParam{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req param in create tree, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := s.uc.Create(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to create tree, req: %v, err: %v", req, err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Delete 删除目录组
//
//		Disable @Description	删除目录组
//		Disable @Tags			目录组管理
//		Disable @Summary		删除目录组
//		Disable @Accept			application/json
//		Disable @Produce		application/json
//	 Disable @Param       Authorization     header   string                    true "token"
//		Disable @Param			tree_id	path		string					true	"tree id"	default(1)	minLength(1)
//		Disable @Success		200		{object}	domain.DeleteRespParam	"成功响应参数"
//		Disable @Failure		400		{object}	rest.HttpError			"失败响应参数"
//		Disable @Router			/api/data-catalog/v1/trees/{tree_id} [delete]
func (s *Service) Delete(c *gin.Context) {
	req := &domain.IDPathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in delete tree, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := s.uc.Delete(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to delete tree, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Edit 编辑目录组基本信息
//
//		Disable @Description	编辑目录组基本信息
//		Disable @Tags			目录组管理
//		Disable @Summary		编辑目录组基本信息
//		Disable @Accept			application/json
//		Disable @Produce		application/json
//	 Disable @Param       Authorization     header   string                    true "token"
//		Disable @Param			tree_id	path		string					true	"tree id"	default(1)	minLength(1)
//		Disable @Param			_		body		domain.EditReqBodyParam	true	"请求参数"
//		Disable @Success		200		{object}	domain.EditRespParam	"成功响应参数"
//		Disable @Failure		400		{object}	rest.HttpError			"失败响应参数"
//		Disable @Router			/api/data-catalog/v1/trees/{tree_id} [put]
func (s *Service) Edit(c *gin.Context) {
	req := &domain.EditReqParam{}
	if _, err := form_validator.BindUriAndValid(c, &req.IDPathParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in edit tree, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	if _, err := form_validator.BindJsonAndValid(c, &req.EditReqBodyParam); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in edit tree, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := s.uc.Edit(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to edit tree, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// List 获取目录组列表
//
//		Disable @Description	获取目录组列表
//		Disable @Tags			目录组管理
//		Disable @Summary		获取目录组列表
//		Disable @Accept			application/json
//		Disable @Produce		application/json
//	 Disable @Param       Authorization     header   string                    true "token"
//		Disable @Param			_	query		domain.ListReqParam		true	"请求参数"
//		Disable @Success		200	{object}	domain.ListRespParam	"成功响应参数"
//		Disable @Failure		400	{object}	rest.HttpError			"失败响应参数"
//		Disable @Router			/api/data-catalog/v1/trees [get]
func (s *Service) List(c *gin.Context) {
	req := &domain.ListReqParam{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in list trees, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := s.uc.List(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to list trees, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Get 获取指定目录组信息
//
//		Disable @Description	获取指定目录组信息
//		Disable @Tags			目录组管理
//		Disable @Summary		获取指定目录组信息
//		Disable @Accept			application/json
//		Disable @Produce		application/json
//	    Disable @Param       Authorization     header   string                    true "token"
//		Disable @Param			tree_id	path		string				true	"tree id"	default(1)	minLength(1)
//		Disable @Success		200		{object}	domain.GetRespParam	"成功响应参数"
//		Disable @Failure		400		{object}	rest.HttpError		"失败响应参数"
//		Disable @Router			/api/data-catalog/v1/trees/{tree_id} [get]
func (s *Service) Get(c *gin.Context) {
	req := &domain.IDPathParam{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req path param in get tree, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := s.uc.Get(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to get tree, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// NameExistCheck 检测目录组名称是否已存在
//
//		Disable @Description	检测目录组名称是否已存在
//		Disable @Tags			目录组管理
//		Disable @Summary		检测目录组名称是否已存在
//		Disable @Accept			application/json
//		Disable @Produce		application/json
//	 Disable @Param       Authorization     header   string                    true "token"
//		Disable @Param			_	body		domain.NameExistReqParam	true	"请求参数"
//		Disable @Success		200	{object}	domain.NameExistRespParam	"成功响应参数"
//		Disable @Failure		400	{object}	rest.HttpError				"失败响应参数"
//		Disable @Router			/api/data-catalog/v1/trees/check [post]
func (s *Service) NameExistCheck(c *gin.Context) {
	req := &domain.NameExistReqParam{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding body param in check tree name exist, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := s.uc.NameExistCheck(c, req)
	if err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to check tree name exist, req: %v, err: %v", req, err)
		s.errResp(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (s *Service) errResp(c *gin.Context, err error) {
	c.Writer.WriteHeader(http.StatusBadRequest)
	ginx.ResErrJson(c, err)
}
