package service_apply

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ServiceApplyController struct {
	domain *domain.ServiceApplyDomain
}

func NewServiceApplyController(domain *domain.ServiceApplyDomain) *ServiceApplyController {
	return &ServiceApplyController{
		domain: domain,
	}
}

// ServiceApplyCreate 接口申请创建
//
//	@Description	接口申请创建
//	@Tags			接口申请
//	@Summary		接口申请创建
//	@Accept			json
//	@Produce		json
//	@Param			_	body		dto.ServiceApplyCreateReq	true	"请求参数"
//	@Success		200	{object}	rest.HttpError				"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/apply [post]
func (s *ServiceApplyController) ServiceApplyCreate(c *gin.Context) {
	req := &dto.ServiceApplyCreateReq{}

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

	err = s.domain.ServiceApplyCreate(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, errorcode.Success)
}

// ServiceApplyList 接口申请列表
//
//	@Description	接口申请列表
//	@Tags			接口申请
//	@Summary		接口申请列表
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.ServiceApplyListReq	true	"请求参数"
//	@Success		200	{object}	dto.ServiceApplyListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/apply [get]
func (s *ServiceApplyController) ServiceApplyList(c *gin.Context) {
	req := &dto.ServiceApplyListReq{}

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

	res, err := s.domain.ServiceApplyList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ServiceApplyGet 接口申请详情
//
//	@Description	接口申请详情
//	@Tags			接口申请
//	@Summary		接口申请详情
//	@Accept			json
//	@Produce		json
//	@Param			apply_id	path		string					true	"申请id"
//	@Success		200			{object}	dto.ServiceApplyGetRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/apply/{apply_id} [get]
func (s *ServiceApplyController) ServiceApplyGet(c *gin.Context) {
	req := &dto.ServiceApplyGetReq{}

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

	res, err := s.domain.Get(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// AvailableAssetsList 可用接口列表
//
//	@Description	可用接口列表
//	@Tags			接口申请
//	@Summary		可用接口列表
//	@Accept			json
//	@Produce		json
//	@Param			_	query		dto.AvailableAssetsListReq	true	"请求参数"
//	@Success		200	{object}	dto.AvailableAssetsListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/apply/available-assets [get]
func (s *ServiceApplyController) AvailableAssetsList(c *gin.Context) {
	req := &dto.AvailableAssetsListReq{}

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

	res, err := s.domain.AvailableAssetsList(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ServiceAuthInfo 接口授权信息
//
//	@Description	接口授权信息
//	@Tags			接口申请
//	@Summary		接口授权信息
//	@Accept			json
//	@Produce		json
//	@Param			service_id	path		string					true	"接口ID"
//	@Success		200			{object}	dto.ServiceAuthInfoRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-application-service/frontend/v1/services/{service_id}/auth_info [get]
func (s *ServiceApplyController) ServiceAuthInfo(c *gin.Context) {
	req := &dto.ServiceAuthInfoReq{}

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

	res, err := s.domain.ServiceAuthInfo(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetOwnerAuditors workflow 获取数据 owner 审核员
//
//	@Description	workflow 获取数据 owner 审核员
//	@Tags			接口申请
//	@Summary		workflow 获取数据 owner 审核员
//	@Accept			json
//	@Produce		json
//	@Param			apply_id	path		string						true	"审核申请ID"
//	@Success		200			{object}	[]dto.GetOwnerAuditorsRes	"成功响应参数"
//	@Failure		400			{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-application-service/internal/v1/audits/{apply_id}/auditors [get]
func (s *ServiceApplyController) GetOwnerAuditors(c *gin.Context) {
	req := &dto.GetOwnerAuditorsReq{}

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
