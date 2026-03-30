package dict

import (
	"net/http"
	"strings"

	"github.com/kweaver-ai/idrm-go-frame/core/validator"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/dict"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc domain.UseCase
}

// NewService service
func NewService(uc domain.UseCase) *Service {
	return &Service{uc: uc}
}

// GetDictItemByType根据字典类型查询字典值列表
// @Description 根据字典类型查询字典值列表
// @Tags 数据字典
// @Summary     根据字典类型查询字典值列表
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string                    true "token"
// @Param       _     query    domain.DictTypeReq true "查询参数"
// @Success     200       {object} domain.DictResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /dict/getDictItemByType [get]
func (s *Service) GetDictItemByType(c *gin.Context) {
	var req domain.DictTypeReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get dict, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := err.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}

	var dictTypes []string
	if len(req.DictType) > 0 {
		dictTypes = strings.Split(req.DictType, ",")
	}
	resp, err := s.uc.GetDictItemByType(c.Request.Context(), dictTypes, req.QueryType)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// QueryDictPage
// @Summary     查询字典分页列表
// @Description 查询字典分页列表
// @Tags 数据字典
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _  query    domain.QueryPageReqParam  false "查询参数"
// @Success     200 {object} domain.QueryPageRespParam "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /dict/page [get]
func (s *Service) QueryDictPage(c *gin.Context) {
	req := &domain.QueryPageReqParam{}
	valid, errs := form_validator.BindQueryAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	res, err := s.uc.QueryDictPage(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// QueryDictItemPage
// @Summary     查询字典项分页列表
// @Description 查询字典项分页列表
// @Tags 数据字典
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _  query    domain.QueryPageReqParam  false "查询参数"
// @Success     200 {object} domain.QueryPageItemRespParam "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /dict/dict-item-page [get]
func (s *Service) QueryDictItemPage(c *gin.Context) {
	req := &domain.QueryPageItemReqParam{}
	valid, errs := form_validator.BindQueryAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	res, err := s.uc.QueryDictItemPage(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// GetDictById
// @Summary     查询字典详情
// @Description 查询字典详情
// @Tags        数据字典
// @Accept      application/json
// @Produce     json
// @Param 		id  path string true "字典ID"
// @Success     200 {object} domain.DictDetailResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /dict/getId/{id} [get]
func (s *Service) GetDictById(c *gin.Context) {
	req := &domain.DictIdReq{}
	valid, errs := form_validator.BindUriAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	res, err := s.uc.GetDictById(c.Request.Context(), req.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDictDetail
// @Summary     查询字典详情及字典项列表
// @Description 查询字典详情及字典项列表
// @Tags        数据字典
// @Accept      application/json
// @Produce     json
// @Param 		id  path string true "字典ID"
// @Success     200 {object} domain.DictDetailResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /dict/detail/{id} [get]
func (s *Service) GetDictDetail(c *gin.Context) {
	req := &domain.DictIdReq{}
	valid, errs := form_validator.BindUriAndValid(c, req)
	if !valid {
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := errs.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	res, err := s.uc.GetDictDetail(c.Request.Context(), req.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDictItemTypeList
// @Summary     查询有字典值的类型和值列表
// @Description 查询有字典值的类型和值列表
// @Tags        数据字典
// @Accept      application/json
// @Produce     json
// @Param 		_ query domain.QueryTypeReq false "请求参数"
// @Success     200 {object} domain.Dicts "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /dict/getDictItemTypeList [get]
func (s *Service) GetDictItemTypeList(c *gin.Context) {
	var req domain.QueryTypeReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get GetDictItemTypeList, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := err.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	res, err := s.uc.GetDictItemTypeList(c.Request.Context(), req.QueryType)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDictList
// @Summary     查询字典列表
// @Description 查询字典列表
// @Tags        数据字典
// @Accept      application/json
// @Produce     json
// @Param 		_ query domain.QueryTypeReq false "请求参数"
// @Success     200 {array} domain.DictResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /dict/list [get]
func (s *Service) GetDictList(c *gin.Context) {
	var req domain.QueryTypeReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get GetDictList, err: %v", err)
		c.Writer.WriteHeader(http.StatusBadRequest)
		_, ok := err.(form_validator.ValidErrors)
		if ok {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
		} else {
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	res, err := s.uc.GetDictList(c.Request.Context(), req.QueryType)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// UpdateDictAndItem  编辑数据字典和字典值
// @Summary     编辑数据字典和字典值
// @Description 编辑数据字典和字典值
// @Tags        数据字典
// @Accept      application/json
// @Produce     json
// @Param 		 data body domain.DictUpdateResParam true "修改数据字典的请求体"
// @Success      200 {object} rest.HttpError
// @Failure      400 {object} rest.HttpError
// @Router      /dict/update-dict-item [post]
func (s *Service) UpdateDictAndItem(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.DictUpdateResParam{}
	valid, errs := form_validator.BindJsonAndValid(c, req, true)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	var keys []string
	for _, obj := range req.DicItemRes {
		keys = append(keys, obj.DictKey)
	}
	//验证数据类型的值是否正确
	valid, errs = form_validator.GetDictTypeValidate(req.DictRes.Type, keys)
	if !valid || errs != nil {
		c.Writer.WriteHeader(400)
		errCustom := errorcode.Custom(errorcode.LabelInvalidParameter, strings.ReplaceAll(errs.Error(), "key: , msg: ", ""))
		ginx.ResErrJson(c, errCustom)
		return
	}
	res, err := s.uc.UpdateDictAndItem(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// CreateDictAndItem  新增数据字典和字典值
// @Summary     新增数据字典和字典值
// @Description 新增数据字典和字典值
// @Tags        数据字典
// @Accept      application/json
// @Produce     json
// @Param 		 data body domain.DictCreateResParam true "新增数据字典的请求体"
// @Success      200 {object} rest.HttpError
// @Failure      400 {object} rest.HttpError
// @Router      /dict/create-dict-item [post]
func (s *Service) CreateDictAndItem(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.DictCreateResParam{}
	valid, errs := form_validator.BindJsonAndValid(c, req, true)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	var keys []string
	for _, obj := range req.DicItemRes {
		keys = append(keys, obj.DictKey)
	}
	//验证数据类型的值是否正确
	valid, errs = form_validator.GetDictTypeValidate(req.DictRes.Type, keys)
	if !valid || errs != nil {
		c.Writer.WriteHeader(400)
		errCustom := errorcode.Custom(errorcode.LabelInvalidParameter, strings.ReplaceAll(errs.Error(), "key: , msg: ", ""))
		ginx.ResErrJson(c, errCustom)
		return
	}
	res, err := s.uc.CreateDictAndItem(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DeleteDictAndItem  删除数据字典和字典值
// @Summary     删除数据字典和字典值
// @Description 删除数据字典和字典值
// @Tags        数据字典
// @Accept      application/json
// @Produce     json
// @Success      200 {object} rest.HttpError
// @Failure      400 {object} rest.HttpError
// @Router      /dict/delete-dict-item/{id} [delete]
func (s *Service) DeleteDictAndItem(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.DictIdReq{}
	if _, err = validator.BindUriAndValid(c, req); err != nil {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, err))
		return
	}

	res, err := s.uc.DeleteDictAndItem(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (s *Service) BatchCheckNotExistTypeKey(c *gin.Context) {
	req := &domain.DictTypeKeyReq{}
	valid, errs := form_validator.BindJsonAndValid(c, req, true)
	if !valid {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	//验证数据类型的值是否符合定义的正则校验
	valid, errs = form_validator.GetDictTypeValidateArray(req.DictTypeKey)
	if !valid || errs != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.LabelInvalidParameter, errs))
		return
	}
	res, err := s.uc.BatchCheckNotExistTypeKey(c.Request.Context(), req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
