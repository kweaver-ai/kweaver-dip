package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/firm"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc firm.UseCase
}

// NewService service
func NewService(uc firm.UseCase) *Service {
	return &Service{uc: uc}
}

// Create 厂商创建接口
// @Description 厂商创建接口
// @Tags        厂商管理
// @Summary     厂商创建接口
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string            true "Authorization header"
// @Param       req           body     firm.CreateReq true "请求参数"
// @Success     200           {object} firm.IDResp          "成功响应参数"
// @Failure     400           {object} rest.HttpError         "失败响应参数"
// @Router      /firm [post]
func (s *Service) Create(c *gin.Context) {
	var req firm.CreateReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in firm create, err: %v", err)
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

	datas, err := s.uc.Create(c, userInfo.ID, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// Import 厂商导入接口
// @Description 厂商导入接口
// @Tags        厂商管理
// @Summary     厂商导入接口
// @Accept      multipart/form-data
// @Produce     application/json
// @Param       Authorization header   string          true "Authorization header"
// @param       file          formData file            true "上传的文件"
// @Success     200           {object} firm.NullResp        "成功响应参数"
// @Failure     400           {object} rest.HttpError       "失败响应参数"
// @Router      /firm/import [post]
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

	datas, err := s.uc.Import(c, userInfo.ID, headers[0])
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// Update 厂商编辑接口
// @Description 厂商编辑接口
// @Tags        厂商管理
// @Summary     厂商编辑接口
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string            true "Authorization header"
// @Param       firm_id       path     string            true "厂商ID"
// @Param       req           body     firm.CreateReq true    "请求参数"
// @Success     200           {object} firm.IDResp            "成功响应参数"
// @Failure     400           {object} rest.HttpError         "失败响应参数"
// @Router      /firm/{firm_id} [put]
func (s *Service) Update(c *gin.Context) {
	var req firm.FirmIDPathReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in firm update, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	var bReq firm.CreateReq
	if _, err := form_validator.BindJsonAndValid(c, &bReq); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in firm update, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	datas, err := s.uc.Update(c, userInfo.ID, req.FirmID.Uint64(), &bReq)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// Delete 厂商删除接口
// @Description 厂商删除接口
// @Tags        厂商管理
// @Summary     厂商删除接口
// @Accept      application/json
// @Produce     application/json
// @Param       Authorization header   string         true "Authorization header"
// @Param       req           body     firm.DeleteReq true "请求参数"
// @Success     200           {object} firm.NullResp       "成功响应参数"
// @Failure     400           {object} rest.HttpError      "失败响应参数"
// @Router      /firm [delete]
func (s *Service) Delete(c *gin.Context) {
	var req firm.DeleteReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in firm delete, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	userInfo, err := user_util.ObtainUserInfo(c)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicRequestParameterError, err))
		return
	}

	datas, err := s.uc.Delete(c, userInfo.ID, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// GetList 厂商列表接口
// @Description 厂商列表接口
// @Tags        厂商管理
// @Summary     厂商列表接口
// @Accept      text/plain
// @Produce     application/json
// @Param       Authorization header   string           true "Authorization header"
// @Param       req           query    firm.ListReq     true "请求参数"
// @Success     200           {object} firm.ListResp         "成功响应参数"
// @Failure     400           {object} rest.HttpError        "失败响应参数"
// @Router      /firm [get]
func (s *Service) GetList(c *gin.Context) {
	var req firm.ListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get firm list, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	datas, err := s.uc.GetList(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// UniqueCheck 厂商管理唯一性校验接口
// @Description 厂商管理唯一性校验接口
// @Tags        厂商管理
// @Summary     厂商管理唯一性校验接口
// @Accept      text/plain
// @Produce     application/json
// @Param       Authorization header   string               true "Authorization header"
// @Param       requireID     path     string               true "供需ID"
// @Param       req           query    firm.UniqueCheckReq  true "请求参数"
// @Success     200           {object} firm.UniqueCheckResp      "成功响应参数"
// @Failure     400           {object} rest.HttpError            "失败响应参数"
// @Router      /firm/uniqueCheck [get]
func (s *Service) UniqueCheck(c *gin.Context) {
	var req firm.UniqueCheckReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req form param in firm name / uniform code unique check, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	datas, err := s.uc.UniqueCheck(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}
