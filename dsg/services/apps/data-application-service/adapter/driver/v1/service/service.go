package service

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	data_application_service_v1 "github.com/kweaver-ai/idrm-go-common/api/data_application_service/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ServiceController struct {
	domain *domain.ServiceDomain
}

func NewServiceController(d *domain.ServiceDomain) *ServiceController {
	return &ServiceController{domain: d}
}

// ServiceCreate 接口创建
//
//	@Description	接口创建
//	@Tags			接口
//	@Summary		接口创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.ServiceCreateReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceCreateRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/v1/services [post]
func (s *ServiceController) ServiceCreate(c *gin.Context) {
	req := &dto.ServiceCreateOrTempReq{}

	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.ServiceCreate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		} else {
			ginx.ResErrJson(c, err)
			return
		}
	}

	ginx.ResOKJson(c, res)
}

// ServiceList 接口列表
//
//	@Description	接口列表
//	@Tags			接口
//	@Summary		接口列表
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ServiceListReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/services [get]
func (s *ServiceController) ServiceList(c *gin.Context) {
	req := &dto.ServiceListReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	// 兼容旧参数 keyword，与 service_keyword 保持一致
	if req.ServiceKeyword == "" {
		if keyword := c.Query("keyword"); keyword != "" {
			req.ServiceKeyword = keyword
		}
	}

	if req.Sort == "" {
		req.Sort = "update_time"
	}

	if req.Direction == "" {
		req.Direction = "desc"
	}

	resp, err := s.domain.ServiceList(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// ServiceGet 接口详情
//
//	@Description	接口详情
//	@Tags			接口
//	@Summary		接口详情
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string				true	"接口ID"
//	@Success		200			{object}	dto.ServiceGetRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/services/{service_id} [get]
func (s *ServiceController) ServiceGet(c *gin.Context) {
	req := &dto.ServiceGetReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.domain.ServiceGet(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// ServiceUpdate 接口更新
//
//	@Description	接口更新
//	@Tags			接口
//	@Summary		接口更新
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string						true	"接口ID"
//	@Param			_			body		dto.ServiceUpdateBodyReq	true	"请求参数"
//	@Success		200			{object}	rest.HttpError				"成功响应参数"
//	@Failure		400			{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/v1/services/{service_id} [put]
func (s *ServiceController) ServiceUpdate(c *gin.Context) {
	req := &dto.ServiceUpdateReqOrTemp{}

	_, err := form_validator.BindUriAndValid(c, &req.ServiceUpdateUriReq)
	_, err = form_validator.BindJsonAndValid(c, &req.ServiceUpdateOrTempBodyReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.ServiceUpdate(c, req)
	if err != nil {
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		} else {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err)
			return
		}
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// SqlToForm SQL转接口参数
//
//	@Description	SQL转接口参数
//	@Tags			接口
//	@Summary		SQL转接口参数
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.ServiceSqlToFormReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceSqlToFormRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/v1/services/sql-to-form [post]
func (s *ServiceController) SqlToForm(c *gin.Context) {
	req := &dto.ServiceSqlToFormReq{}

	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.ServiceSqlToForm(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// FormToSql 接口参数转SQL
//
//	@Description	接口参数转SQL
//	@Tags			接口
//	@Summary		接口参数转SQL
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.ServiceFormToSqlReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceFormToSqlRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/v1/services/form-to-sql [post]
func (s *ServiceController) FormToSql(c *gin.Context) {
	req := &dto.ServiceFormToSqlReq{}

	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.ServiceFormToSql(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ServiceDelete 接口删除
//
//	@Description	接口删除
//	@Tags			接口
//	@Summary		接口删除
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string			true	"接口ID"
//	@Success		200			{object}	rest.HttpError	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-application-service/v1/services/{service_id} [delete]
func (s *ServiceController) ServiceDelete(c *gin.Context) {
	req := &dto.ServiceDeleteReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.ServiceDelete(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// CheckServiceName 接口名称重名检查
//
//	@Description	接口名称重名检查
//	@Tags			接口
//	@Summary		接口名称重名检查
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ServiceCheckServiceNameReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError					"成功响应参数"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-application-service/v1/services/check-service-name [get]
func (s *ServiceController) CheckServiceName(c *gin.Context) {
	req := &dto.ServiceCheckServiceNameReq{}

	_, err := form_validator.BindFormAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.CheckServiceName(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// CheckServicePath 接口路径重名检查
//
//	@Description	接口路径重名检查
//	@Tags			接口
//	@Summary		接口路径重名检查
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ServiceCheckServicePathReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError					"成功响应参数"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-application-service/v1/services/check-service-path [get]
func (s *ServiceController) CheckServicePath(c *gin.Context) {
	req := &dto.ServiceCheckServicePathReq{}

	_, err := form_validator.BindFormAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.CheckServicePath(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// ServiceGetFrontend 接口详情 - 前台
//
//	@Description	接口详情 - 前台
//	@Tags			open接口
//	@Summary		接口详情 - 前台
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string						true	"接口ID"
//	@Success		200			{object}	dto.ServiceGetFrontendRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/services/{service_id} [get]
func (s *ServiceController) ServiceGetFrontend(c *gin.Context) {
	req := &dto.ServiceGetReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.domain.ServiceGetFrontend(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// ServiceListFrontend 接口列表 - 前台
//
//	@Description	接口列表 - 前台
//	@Tags			open接口列表
//	@Summary		接口列表 - 前台
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ServiceListReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/services [get]
func (s *ServiceController) ServiceListFrontend(c *gin.Context) {
	req := &dto.ServiceListReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	if req.Sort == "" {
		req.Sort = "create_time"
	}

	if req.Direction == "" {
		req.Direction = "desc"
	}

	// 判断是否为xx数据局项目
	cssjj, err := s.domain.IsCSSJJ(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}

	// 前台只显示发布的接口
	isEnable, err := s.domain.IsEnableResourceDirectory(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}

	if cssjj {
		// xx数据局项目，无论是否启用数据资源目录，都支持接口上下线
		req.Status = enum.LineStatusOnLine
	} else if isEnable {
		//启用数据资源目录
		req.PublishStatus = enum.PublishStatusPublished
	} else {
		req.Status = enum.LineStatusOnLine
	}
	resp, err := s.domain.ServiceList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// AuditProcessInstanceCreate 审核流程实例创建
//
//	@Description	审核流程实例创建
//	@Tags			审核流程实例
//	@Summary		审核流程实例创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.AuditProcessInstanceCreateReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError						"成功响应参数"
//	@Failure		400	{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-application-service/v1/audit-process-instance [post]
func (s *ServiceController) AuditProcessInstanceCreate(c *gin.Context) {
	req := &dto.AuditProcessInstanceCreateReq{}

	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	err = s.domain.AuditProcessInstanceCreate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// ServiceSearch 服务超市 - 接口服务列表
//
//	@Description	服务超市 - 接口服务列表
//	@Tags			接口
//	@Summary		服务超市 - 接口服务列表
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.ServiceSearchReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceSearchRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/services/search [post]
func (s *ServiceController) ServiceSearch(c *gin.Context) {
	req := &dto.ServiceSearchReq{}

	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.ServiceSearch(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

func (s *ServiceController) GetOwnerAuditors(c *gin.Context) {
	req := &dto.ServiceIDReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.GetOwnerAuditors(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

func (s *ServiceController) ServiceIndexUpdate(c *gin.Context) {
	resp, err := s.domain.ServiceIndexUpdateByKafKa(c)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// 内部接口
func (s *ServiceController) ServiceIndexUpdate2(c *gin.Context) {

	req := &dto.ServiceIdsReq{}
	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	resp, err := s.domain.ServiceIndexUpdateByKafKa2(c, req.ServiceIDs...)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ServicesGetByDataViewId 数据视图id关联的所有接口
//
//	@Description	数据视图id关联的所有接口
//	@Tags			接口
//	@Summary		数据视图id关联的所有接口
//	@Accept			json
//	@Produce		json
//	@Param			data_view_id	path		string							true	"数据视图id"
//	@Success		200				{object}	dto.ServicesGetByDataViewIdRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/data-view/{data_view_id}/services [get]
func (s *ServiceController) ServicesGetByDataViewId(c *gin.Context) {
	req := &dto.ServicesGetByDataViewIdReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.domain.ServicesGetByDataViewId(c, req.DataViewId)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetServicesDataView 接口关联的视图
//
//	@Description	接口关联的视图
//	@Tags			接口
//	@Summary		接口关联的视图
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string							true	"接口id"
//	@Success		200			{object}	dto.ServicesGetByDataViewIdRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/services/{service_id}/data-view [get]
func (s *ServiceController) GetServicesDataView(c *gin.Context) {
	req := &dto.ServiceGetReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.domain.ServicesDataView(c.Request.Context(), req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetOptionsList 获取接口管理页列表下拉筛选项
//
//	@Description	获取接口管理页列表下拉筛选项接口
//	@Tags			接口
//	@Summary		获取接口管理页列表下拉筛选项
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	dto.OptionsInfoRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/services/options/list [get]
func (s *ServiceController) GetOptionsList(c *gin.Context) {
	resp, err := s.domain.ServiceSelectOptions(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UndoAudit 审核撤回
//
//	@Description	审核撤回接口
//	@Tags			接口
//	@Summary		撤回相关类型的审核
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.UndoAuditReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceIdRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/services/revoke [put]
func (s *ServiceController) UndoAudit(c *gin.Context) {
	req := &dto.UndoAuditReq{}
	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return

	}
	res, err := s.domain.UndoAuditByType(c, req.ServiceID, req.OperateType)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DraftServiceGet 获取当前需求的草稿版本
//
//	@Description	获取当前需求的草稿版本
//	@Tags			接口
//	@Summary		获取当前需求的草稿版本
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string				true	"接口ID"
//	@Success		200			{object}	dto.ServiceIdRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/services/draft/:service_id [get]
func (s *ServiceController) DraftServiceGet(c *gin.Context) {
	req := &dto.ServiceIdReq{}
	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	resp, err := s.domain.GetDraftVersion(c, req.ServiceID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ChangePublishedService 变更已发布的需求（包括变更暂存）
//
//	@Description	变更已发布的需求
//	@Tags			接口
//	@Summary		变更已发布的需求（包括变更暂存）
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string					true	"接口ID"
//	@Param			_			body		dto.ServiceChangeReq	true	"请求参数"
//	@Success		200			{object}	dto.ServiceIdRes		"成功响应参数"
//	@Failure		400			{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/v1/services/draft/:service_id [post]
func (s *ServiceController) ChangePublishedService(c *gin.Context) {
	req := &dto.ServiceChangeReq{}
	_, err := form_validator.BindUriAndValid(c, &req.ServiceUpdateUriReq)
	_, err = form_validator.BindJsonAndValid(c, &req.ServiceChangeBodyReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	res, err := s.domain.ServiceChange(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// AbandonChange 放弃变更
//
//	@Description	放弃变更接口
//	@Tags			接口
//	@Summary		变更审核失败后，放弃变更
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string				true	"接口ID"
//	@Success		200			{object}	dto.ServiceIdRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/services/draft/:service_id [delete]
func (s *ServiceController) AbandonChange(c *gin.Context) {
	req := &dto.ServiceIdReq{}
	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	resp, err := s.domain.AbandonServiceChange(c, req.ServiceID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// UndoUpOrDown 接口上下线接口
//
//	@Description	上下线接口
//	@Tags			接口
//	@Summary		接口上线或者下线
//	@Accept			json
//	@Produce		json
//
//	@Param			_	body		dto.ServiceUpOrDownReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceIdRes		"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/v1/services/status [put]
func (s *ServiceController) UndoUpOrDown(c *gin.Context) {
	req := &dto.ServiceUpOrDownReq{}
	_, err := form_validator.BindJsonAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}
	resp, err := s.domain.ServiceUpOrDown(c, req.ServiceID, req.OperateType)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetOwnerID 获取指定接口服务的 OwnerID
func (s *ServiceController) GetOwnerID(c *gin.Context) {
	req := &dto.ServiceIDReq{}
	if _, err := form_validator.BindUriAndValid(c, req); err != nil {
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	ownerID, err := s.domain.GetOwnerID(c, req.ServiceID)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, ownerID)
}

// GetServicesMaxResponse 获取多个接口中最多返回值
func (s *ServiceController) GetServicesMaxResponse(c *gin.Context) {
	req := &dto.GetServicesMaxResponseReq{}
	if _, err := form_validator.BindQueryAndValid(c, req); err != nil {
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	ownerID, err := s.domain.GetServicesMaxResponse(c, req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, ownerID)
}

// BatchPublishAndOnline 批量发布、上线接口服务，不经过审核
func (s *ServiceController) BatchPublishAndOnline(c *gin.Context) {
	r := &data_application_service_v1.BatchPublishAndOnline{}
	if err := c.BindJSON(r); err != nil {
		return
	}
	log.Debug("received request", zap.Any("body", r))

	if err := s.domain.BatchPublishAndOnline(c, r.IDs); err != nil {
		return
	}

	return
}

// GetStatusStatistics 获取接口服务状态统计
//
//	@Description	获取接口服务状态统计
//	@Tags			接口
//	@Summary		获取接口服务状态统计
//	@Accept			json
//	@Produce		json
//	@Param			service_type	query		string								false	"服务类型，不传则返回全部统计"
//	@Success		200				{object}	domain.GetStatusStatisticsRes		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/stats/status-statistics [get]
func (s *ServiceController) GetStatusStatistics(c *gin.Context) {
	req := &domain.GetStatusStatisticsReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.GetStatusStatistics(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetDepartmentStatistics 获取部门统计
//
//	@Description	获取部门统计
//	@Tags			接口
//	@Summary		获取部门统计
//	@Accept			json
//	@Produce		json
//	@Param			top	query		int									false	"数量排序，不传则返回全部部门统计"
//	@Success		200	{object}	domain.GetDepartmentStatisticsRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/stats/department-statistics [get]
func (s *ServiceController) GetDepartmentStatistics(c *gin.Context) {
	req := &domain.GetDepartmentStatisticsReq{}

	_, err := form_validator.BindAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.GetDepartmentStatistics(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ExportAPIDoc 导出API接口文档（PDF或ZIP）
//
//	@Description	导出API接口文档，支持单个PDF下载或批量ZIP压缩包下载
//	@Tags			接口文档
//	@Summary		导出API接口文档
//	@Accept			json
//	@Produce		application/pdf,application/zip
//	@Param			_	body		dto.ExportAPIDocReqBody	true	"请求参数：service_ids传入1个ID时下载单个PDF，传入多个ID时下载ZIP压缩包；app_id为应用ID，用于文件名生成"
//	@Success		200	{object}	string	"成功时返回PDF或ZIP二进制数据，Content-Type为application/pdf或application/zip"
//	@Failure		400	{object}	rest.HttpError		"失败时返回JSON格式错误信息，Content-Type为application/json"
//	@Router			/api/data-application-service/v1/services/api-doc/export [post]
func (s *ServiceController) ExportAPIDoc(c *gin.Context) {
	req := &dto.ExportAPIDocReq{}
	if c.Request.ContentLength > 0 && c.Request.Body != nil {
		if _, err := form_validator.BindJsonAndValid(c, &req.ExportAPIDocReqBody); err != nil {
			c.Writer.Header().Set("Content-Type", "application/json")
			c.Writer.WriteHeader(http.StatusBadRequest)
			if errors.As(err, &form_validator.ValidErrors{}) {
				ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
				return
			}
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
			return
		}
	}

	if len(req.ExportAPIDocReqBody.ServiceIDs) == 1 {
		resp, err := s.domain.ExportAPIDoc(c, req)
		if err != nil {
			c.Writer.Header().Set("Content-Type", "application/json")
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err)
			return
		}

		c.Writer.Header().Set("Content-Type", "application/pdf")
		disposition := fmt.Sprintf("attachment; filename=\"%s\"; filename*=utf-8''%s",
			strings.ReplaceAll(resp.FileName, "\"", "\\\""),
			url.QueryEscape(resp.FileName))
		c.Writer.Header().Set("Content-Disposition", disposition)
		c.Writer.Header().Set("Content-Length", fmt.Sprintf("%d", resp.Buffer.Len()))

		if _, err = c.Writer.Write(resp.Buffer.Bytes()); err != nil {
			c.Writer.Header().Set("Content-Type", "application/json")
			c.Writer.WriteHeader(http.StatusInternalServerError)
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInternalError))
			return
		}
	} else {
		resp, err := s.domain.ExportAPIDocBatch(c, req)
		if err != nil {
			c.Writer.Header().Set("Content-Type", "application/json")
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err)
			return
		}

		c.Writer.Header().Set("Content-Type", "application/zip")
		disposition := fmt.Sprintf("attachment; filename=\"%s\"; filename*=utf-8''%s",
			strings.ReplaceAll(resp.FileName, "\"", "\\\""),
			url.QueryEscape(resp.FileName))
		c.Writer.Header().Set("Content-Disposition", disposition)
		c.Writer.Header().Set("Content-Length", fmt.Sprintf("%d", resp.Buffer.Len()))

		if _, err = c.Writer.Write(resp.Buffer.Bytes()); err != nil {
			c.Writer.Header().Set("Content-Type", "application/json")
			c.Writer.WriteHeader(http.StatusInternalServerError)
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInternalError))
			return
		}
	}
}

// ServiceGetExampleCode 接口使用示例代码
//
//	@Description	接口使用示例代码
//	@Tags			接口
//	@Summary		接口使用示例代码
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string			true	"接口ID"
//	@Success		200			{object}	dto.ExampleCode	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/services/{service_id}/api-doc/example-code [get]
func (s *ServiceController) ServiceGetExampleCode(c *gin.Context) {
	req := &dto.ServiceGetReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.domain.ServiceGetExampleCode(c, req.ServiceID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// ServiceSyncCallback 触发接口同步回调
//
//	@Description	触发接口同步回调
//	@Tags			接口
//	@Summary		触发接口同步回调
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string						true	"接口ID"
//	@Success		200			{object}	domain.ServiceSyncCallbackRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/v1/services/sync/{service_id} [post]
func (s *ServiceController) ServiceSyncCallback(c *gin.Context) {
	req := &dto.ServiceIDReq{}
	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	res, err := s.domain.ServiceSyncCallback(c, req.ServiceID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetServicesByIDs 通过接口ID列表获取接口列表
//
//	@Description	通过接口ID列表获取接口列表
//	@Tags			接口
//	@Summary		通过接口ID列表获取接口列表
//	@Accept			json
//	@Produce		json
//	@Param			ids	query		[]string	true	"接口ID列表"
//	@Failure		400	{object}	rest.HttpError					"失败响应参数"
//	@Router			/api/data-application-service/internal/v1/batch/services [post]
func (s *ServiceController) GetServicesByIDs(c *gin.Context) {
	req := &dto.ServiceIDListReq{}
	if _, err := form_validator.BindJsonAndValid(c, req); err != nil {
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	resp, err := s.domain.GetServicesByIDs(c, req.IDs)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusInternalServerError, err)
		return
	}

	ginx.ResOKJson(c, resp)
}
