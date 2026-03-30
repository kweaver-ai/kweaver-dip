package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	address_book "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/address_book"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc address_book.UseCase
}

// NewService service
func NewService(uc address_book.UseCase) *Service {
	return &Service{uc: uc}
}

// Create 新建人员信息
// @Description 新建人员信息
// @Tags        通讯录管理
// @Summary     新建人员信息
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string            true "Authorization header"
// @Param       req           body     address_book.UserInfoReq true "请求参数"
// @Success     200           {object} address_book.IDResp          "成功响应参数"
// @Failure     400           {object} rest.HttpError         "失败响应参数"
// @Router      /address-book [post]
func (s *Service) Create(c *gin.Context) {
	var req address_book.UserInfoReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in address book create, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	resp, err := s.uc.Create(c, userInfo.ID, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Import 导入人员信息
// @Description 导入人员信息
// @Tags        通讯录管理
// @Summary     导入人员信息
// @Accept      multipart/form-data
// @Produce     application/json
// @Param       Authorization header   string          true "Authorization header"
// @param       file          formData file            true "上传的文件"
// @Success     200           {object} address_book.TotalCountResp        "成功响应参数"
// @Failure     400           {object} rest.HttpError       "失败响应参数"
// @Router      /address-book/import [post]
func (s *Service) Import(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormExistRequiredEmpty))
		return
	}
	headers := form.File["file"]
	if len(headers) != 1 {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	resp, err := s.uc.Import(c, userInfo.ID, headers[0])
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Update 编辑人员信息
// @Description 编辑人员信息
// @Tags        通讯录管理
// @Summary     编辑人员信息
// @Accept      application/json
// @Produce     application/json
// @param       id   path  string  true "人员信息ID"
// @Param       _           body     address_book.UserInfoReq true    "请求参数"
// @Success     200           {object} address_book.IDResp            "成功响应参数"
// @Failure     400           {object} rest.HttpError         "失败响应参数"
// @Router      /address-book/{id} [put]
func (s *Service) Update(c *gin.Context) {
	var req address_book.IDReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in address book update, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	var updateReq address_book.UserInfoReq
	if _, err := form_validator.BindJsonAndValid(c, &updateReq); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in address book update, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	resp, err := s.uc.Update(c, userInfo.ID, req.ID.Uint64(), &updateReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// Delete 删除人员信息
// @Description 删除人员信息
// @Tags        通讯录管理
// @Summary     删除人员信息
// @Accept      application/json
// @Produce     application/json
// @param       id   path  string  true "人员信息ID"
// @Success     200           {object} address_book.IDResp       "成功响应参数"
// @Failure     400           {object} rest.HttpError      "失败响应参数"
// @Router      /address-book/{id} [delete]
func (s *Service) Delete(c *gin.Context) {
	var req address_book.IDReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in address book delete, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	resp, err := s.uc.Delete(c, userInfo.ID, req.ID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetList 人员信息列表
// @Description 人员信息列表
// @Tags        通讯录管理
// @Summary     人员信息列表
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string           true "Authorization header"
// @Param       req           query    address_book.ListReq     true "请求参数"
// @Success     200           {object} address_book.ListResp         "成功响应参数"
// @Failure     400           {object} rest.HttpError        "失败响应参数"
// @Router      /address-book [get]
func (s *Service) GetList(c *gin.Context) {
	var req address_book.ListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get address book list, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		return
	}

	resp, err := s.uc.GetList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
