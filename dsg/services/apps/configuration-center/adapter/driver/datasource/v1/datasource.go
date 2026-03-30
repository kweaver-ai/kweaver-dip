package v1

import (
	"net/http"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/trace_util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/datasource"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	_ "github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type Service struct {
	uc domain.UseCase
}

func NewService(uc domain.UseCase) *Service {
	return &Service{
		uc: uc,
	}
}

// PageDataSource
// @Summary     查询数据源列表
// @Description 查询数据源列表
// @Tags        数据源
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _  query    domain.QueryPageReqParam  false "查询参数"
// @Success     200 {object} domain.QueryPageResParam "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource [get]
func (s *Service) PageDataSource(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
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
	res, err := s.uc.GetDataSources(ctx, req)
	if err != nil {
		log.Errorf("list datasource error %v\n", err.Error())
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// GetDataSourceDetail
// @Summary     查询数据源详情
// @Description 查询数据源详情
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param 		id path string  true "数据源标识"
// @Success     200 {object} domain.DataSourceDetail "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/{id} [get]
func (s *Service) GetDataSourceDetail(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.DataSourceId{}
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
	res, err := s.uc.GetDataSource(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// NameRepeat godoc
// @Summary     查询数据源名称是否重复
// @Description 查询数据源名称在同一信息系统是否重复
// @Tags        数据源
// @Accept      x-www-form-urlencoded
// @Produce     json
// @Param       _   query    domain.NameRepeatReq     true "查询参数"
// @Success     200 {string} string "true"
// @Failure     400 {object} rest.HttpError           "失败响应参数"
// @Router      /datasource/repeat [get]
func (s *Service) NameRepeat(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.NameRepeatReq{}
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
	res, err := s.uc.CheckDataSourceRepeat(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// CreateDataSource
// @Summary     新建数据源
// @Description 新建数据源
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param       _   body    domain.CreateDataSource  true "新建数据源参数"
// @Success     200 {object}  response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource [post]
func (s *Service) CreateDataSource(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.CreateDataSource{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
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
	if req.Username == "" && req.GuardianToken == "" {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameterJson, map[string]any{"username": req.Username, "token": req.GuardianToken}))
		return
	}
	if req.Type != "excel" && req.DatabaseName == "" {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameterJson, map[string]any{"database_name": req.DatabaseName}))
		return
	}
	res, err := s.uc.CreateDataSource(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusInternalServerError)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)

}

// CreateDataSourceBatch
// @Summary     批量新建数据源
// @Description 批量新建数据源
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param       _   body    domain.CreateDataSourceBatchReq  true "新建数据源参数"
// @Success     200 {object}  domain.DataSourceBatchRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/batch [post]
func (s *Service) CreateDataSourceBatch(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.CreateDataSourceBatchReq{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
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
	er := make([]*domain.NameIDRespWithError, 0)
	success := make([]*response.NameIDResp, 0)
	for _, source := range req.Datasource {
		if source.Username == "" && source.GuardianToken == "" {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameterJson, map[string]any{"username": source.Username, "token": source.GuardianToken}))
			return
		}
		if source.Type != "excel" && source.DatabaseName == "" {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameterJson, map[string]any{"database_name": source.DatabaseName}))
			return
		}
		r, err := s.uc.CreateDataSource(ctx, source)
		if err != nil {
			er = append(er, &domain.NameIDRespWithError{Name: source.Name, Error: TransferError(err)})
		}
		success = append(success, r)
	}
	ginx.ResOKJson(c, domain.DataSourceBatchRes{
		Success: success,
		Error:   er,
	})
}
func TransferError(err error) any {
	code := agerrors.Code(err)
	return ginx.HttpError{
		Code:        code.GetErrorCode(),
		Description: code.GetDescription(),
		Solution:    code.GetSolution(),
		Cause:       code.GetCause(),
		Detail:      code.GetErrorDetails(),
	}
}

// ModifyDataSource
// @Summary     修改数据源
// @Description 修改数据源
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param 		id path string  true "数据源标识"
// @Param       _   body    domain.ModifyDataSourceReq  true "修改数据源参数"
// @Success     200 {object}  response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/{id} [put]
func (s *Service) ModifyDataSource(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	dataSourceId := &domain.DataSourceId{}
	valid, errs := form_validator.BindUriAndValid(c, dataSourceId)
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

	req := &domain.ModifyDataSourceReq{}
	valid, errs = form_validator.BindJsonAndValid(c, req)
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

	req.ID = dataSourceId.ID

	res, err := s.uc.ModifyDataSource(ctx, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// ModifyDataSourceBatch
// @Summary     批量修改数据源
// @Description 批量修改数据源
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param       _   body    domain.ModifyDataSourceBatchReq  true "修改数据源参数"
// @Success     200 {object}  domain.DataSourceBatchRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/batch [put]
func (s *Service) ModifyDataSourceBatch(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	req := &domain.ModifyDataSourceBatchReq{}
	valid, errs := form_validator.BindJsonAndValid(c, req)
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
	er := make([]*domain.NameIDRespWithError, 0)
	success := make([]*response.NameIDResp, 0)
	for _, source := range req.Datasource {
		res, err := s.uc.ModifyDataSource(ctx, source)
		if err != nil {
			er = append(er, &domain.NameIDRespWithError{Name: source.ID, Error: TransferError(err)})
		}
		success = append(success, res)
	}

	ginx.ResOKJson(c, domain.DataSourceBatchRes{
		Success: success,
		Error:   er,
	})
}

// DeleteDataSourceBatch
// @Summary     批量删除数据源
// @Description 批量删除数据源
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param       _   body    domain.IDs  true "新建数据源参数"
// @Success     200 {object}  domain.DataSourceBatchRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/batch [delete]
func (s *Service) DeleteDataSourceBatch(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.IDs{}
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
	er := make([]*domain.NameIDRespWithError, 0)
	success := make([]*response.NameIDResp, 0)
	for _, id := range req.IDs {
		res, err := s.uc.DeleteDataSource(ctx, id)
		if err != nil {
			er = append(er, &domain.NameIDRespWithError{Name: id, Error: TransferError(err)})
		}
		success = append(success, res)
	}
	ginx.ResOKJson(c, domain.DataSourceBatchRes{
		Success: success,
		Error:   er,
	})
}

// DeleteDataSource
// @Summary     删除数据源
// @Description 删除数据源
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param 		id path string  true "数据源标识"
// @Success     200 {object}  response.NameIDResp "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/{id} [delete]
func (s *Service) DeleteDataSource(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.DataSourceId{}
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
	res, err := s.uc.DeleteDataSource(ctx, req.ID)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

/*
// GetDataSourceSystemInfos
// @Summary     批量获取信息系统信息
// @Description 数据源id批量获取信息系统信息
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param 		ids body []integer   true "数据源标识"
// @Success     200 {object}  response.GetDataSourceSystemInfosRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/system-info [post]
func (s *Service) GetDataSourceSystemInfos(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.DataSourceIds{}
	valid, _ := form_validator.BindJsonAndValid(c, req)
	if !valid {
		c.JSON(http.StatusOK, make([]string, 0))
		return
	}
	res, err := s.uc.GetDataSourceSystemInfos(ctx, req)
	if err != nil {
		c.JSON(http.StatusOK, make([]string, 0))
		return
	}
	ginx.ResOKJson(c, res)
}*/

// GetDataSourcePrecision
// @Summary     查询数据源
// @Description 查询数据源
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param       _   query    domain.IDs     true "查询参数"
// @Success     200 {object} domain.GetDataSourcesByIds "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/precision [get]
func (s *Service) GetDataSourcePrecision(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	req := &domain.IDs{}
	if valid, errs := form_validator.BindQueryAndValid(c, req); !valid {
		if _, ok := errs.(form_validator.ValidErrors); ok {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
			return
		}
		ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		return
	}
	res, err := s.uc.GetDataSourcesByIds(ctx, req.IDs)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetAll
// @Summary     查询所有数据源
// @Description 查询所有数据源,内部接口,用于后续新加服务数据首次同步
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Success     200 {object} model.Datasource "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/all [get]
func (s *Service) GetAll(c *gin.Context) {
	res, err := trace_util.TraceA0R2(c, s.uc.GetAll)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDataSourceGroupBySourceType
// @Summary     查询数据源组
// @Description 查询数据源组
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Success     200 {object} domain.DataSourceGroupBySourceType "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/group-by-source-type [get]
func (s *Service) GetDataSourceGroupBySourceType(c *gin.Context) {
	res, err := s.uc.GetDataSourceGroupBySourceType(c.Request.Context())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDataSourceGroupByType
// @Summary     查询数据源组
// @Description 查询数据源组
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Success     200 {object} domain.DataSourceGroupByType "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /datasource/group-by-type [get]
func (s *Service) GetDataSourceGroupByType(c *gin.Context) {
	res, err := s.uc.GetDataSourceGroupByType(c.Request.Context())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// UpdateConnectStatus
// @Summary     更改连接状态
// @Description 更改连接状态
// @Tags        数据源
// @Accept      application/json
// @Produce     json
// @Param       _   body    domain.UpdateConnectStatusReq  true "更改连接状态参数"
// @Success     200 {object}  response.NameIDResp "成功响应参数"
// @Router      /datasource/connect-status [PUT]
func (s *Service) UpdateConnectStatus(c *gin.Context) {
	req := &domain.UpdateConnectStatusReq{}
	if valid, errs := form_validator.BindJsonAndValid(c, req); !valid {
		if _, ok := errs.(form_validator.ValidErrors); ok {
			ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, errs))
		} else {
			ginx.ResBadRequestJson(c, errorcode.Desc(errorcode.PublicInvalidParameterJson))
		}
		return
	}
	if err := s.uc.UpdateConnectStatus(c, req); err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, "success")
}
