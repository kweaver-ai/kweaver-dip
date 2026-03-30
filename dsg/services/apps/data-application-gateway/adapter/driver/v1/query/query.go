package query

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type QueryController struct {
	domain                  *domain.QueryDomain
	serviceCallRecordDomain *domain.ServiceCallRecordDomain
	configurationRepo       gorm.ConfigurationRepo
}

func NewQueryController(d *domain.QueryDomain, serviceCallRecordDomain *domain.ServiceCallRecordDomain, configurationRepo gorm.ConfigurationRepo) *QueryController {
	return &QueryController{domain: d,
		serviceCallRecordDomain: serviceCallRecordDomain,
		configurationRepo:       configurationRepo,
	}
}

// Query 数据查询外部接口
//
//	@Summary	数据查询外部接口
//	@Tags		数据查询
//	@Param		service_path	path		string	true	"服务路径"
//	@Success	200				{object}	object
//	@Router		/data-application-gateway/{service_path} [post]
func (s *QueryController) Query(c *gin.Context) {
	// 记录调用开始时间
	callStartTime := time.Now()

	// 获取配置中心配置，如果配置中心配置cssjj为true，则不进行鉴权
	cssjj, err := s.configurationRepo.GetConf(nil, c, "cssjj")
	log.WithContext(c).Info("cssjj", zap.String("cssjj", cssjj))
	if err != nil {
		ginx.ResErrJson(c, err)
		return
	}

	log.WithContext(c).Info("Query")
	req := &dto.QueryReq{
		Params: make(map[string]*dto.Param),
	}

	_, err = form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			// 记录失败的调用
			s.recordServiceCall(c, req, callStartTime, http.StatusBadRequest, 0, err.Error(), cssjj)
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		// 记录失败的调用
		s.recordServiceCall(c, req, callStartTime, http.StatusBadRequest, 0, "请求参数错误", cssjj)
		return
	}

	//解析header
	for k, vs := range c.Request.Header {
		k = strings.ToLower(k) // 统一转小写
		for _, v := range vs {
			req.Params[k] = dto.NewParam(v, dto.ParamPositionHeader, dto.ParamDataTypeString)
			log.WithContext(c).Info("Query", zap.String("header", k+"="+v))
		}
	}

	//解析body
	bodyBytes, err := util.GetBody(c.Request)
	if err != nil {
		log.WithContext(c).Error("Query", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		// 记录失败的调用
		s.recordServiceCall(c, req, callStartTime, http.StatusBadRequest, 0, err.Error(), cssjj)
		return
	}

	body := make(map[string]interface{})
	if len(bodyBytes) > 0 {
		d := json.NewDecoder(bytes.NewReader(bodyBytes))
		d.UseNumber()
		err = d.Decode(&body)
		if err != nil {
			log.WithContext(c).Error("Query", zap.Error(err))
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
			// 记录失败的调用
			s.recordServiceCall(c, req, callStartTime, http.StatusBadRequest, 0, err.Error(), cssjj)
			return
		}
		for k, v := range body {
			req.Params[k] = dto.NewParam(v, dto.ParamPositionBody, "")
		}
	}

	//解析query
	for k, v := range c.Request.URL.Query() {
		if len(v) == 1 && len(v[0]) != 0 {
			req.Params[k] = dto.NewParam(v[0], dto.ParamPositionQuery, dto.ParamDataTypeString)
		}
	}

	length, res, err := s.domain.Query(c, req, cssjj)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			// 记录失败的调用
			s.recordServiceCall(c, req, callStartTime, http.StatusBadRequest, 0, err.Error(), cssjj)
			return
		}

		ginx.ResErrJson(c, err)
		// 记录失败的调用
		s.recordServiceCall(c, req, callStartTime, http.StatusBadRequest, 0, err.Error(), cssjj)
		return
	}
	defer res.Close()

	// 记录成功的调用
	s.recordServiceCall(c, req, callStartTime, http.StatusOK, 1, "", cssjj)

	for _, k := range []string{"x-tif-signature", "x-tif-timestamp", "x-tif-nonce"} {
		if param, ok := req.Params[k]; ok && param.Position == dto.ParamPositionHeader {
			if v, ok := param.Value.(string); ok {
				c.Header(k, v)
			}
		}
	}

	c.DataFromReader(http.StatusOK, length, "application/json", res, nil)
}

// QueryTest 数据查询测试接口
//
//	@Summary	数据查询测试接口
//	@Tags		数据查询
//	@Accept		json
//	@Produce	json
//	@Param		_	body		dto.QueryTestReq	true	"请求参数"
//	@Success	200	{object}	dto.QueryTestRes
//	@Router		/api/data-application-gateway/v1/query-test [post]
func (s *QueryController) QueryTest(c *gin.Context) {
	req := &dto.QueryTestReq{
		Params: make(map[string]*dto.Param),
	}

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

	err = s.queryTestReqCheck(req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	//解析header
	for k, vs := range c.Request.Header {
		for _, v := range vs {
			req.Params[k] = dto.NewParam(v, dto.ParamPositionHeader, dto.ParamDataTypeString)
		}
	}

	req.Params[dto.Offset] = dto.NewParam(1, "", dto.ParamDataTypeInt)

	//测试接口最大只取10条数据
	if req.PageSize == 0 || req.PageSize > 10 {
		req.PageSize = 10
	}
	req.Params[dto.Limit] = dto.NewParam(req.PageSize, "", dto.ParamDataTypeInt)

	_, rc, err := s.domain.QueryTest(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, err)
		return
	}
	defer rc.Close()

	request := make(map[string]interface{})
	for _, requestParam := range req.DataTableRequestParams {
		if requestParam.DefaultValue != "" {
			defaultValue, _ := s.domain.SetDefaultValue(requestParam.EnName, requestParam.DefaultValue, requestParam.DataType)
			request[requestParam.EnName] = defaultValue
		}
	}

	requestMarshal, err := json.Marshal(request)
	if err != nil {
		log.WithContext(c).Error("QueryTest json.Marshal request", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	responseMarshal, err := io.ReadAll(rc)
	if err != nil {
		log.WithContext(c).Error("QueryTest json.Marshal response", zap.Error(err))
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	res := dto.QueryTestRes{
		Request:  string(requestMarshal),
		Response: string(responseMarshal),
	}

	ginx.ResOKJson(c, res)
}

func (s *QueryController) queryTestReqCheck(req *dto.QueryTestReq) (err error) {
	var validErrors form_validator.ValidErrors

	if req.ServiceType == "service_generate" {
		for _, param := range req.DataTableRequestParams {
			if param.Required == "yes" && param.DefaultValue == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: param.EnName, Message: param.EnName + "为必填字段"})
			}

			if param.Operator == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "data_table_request_params", Message: "operator为必填字段"})
			}
		}
		if len(req.DataTableResponseParams) == 0 {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "data_table_response_params", Message: "data_table_response_params为必填字段"})
		}

		if req.CreateModel == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "create_model", Message: "create_model为必填字段"})
		}

		if req.DatasourceId == "" {
			log.Warn("QueryTestReq.DatasourceId id deprecated")
		}

		if req.CreateModel == "wizard" {
			if req.DataViewId == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "data_view_id", Message: "data_view_id为必填字段"})
			}
		}

		if req.CreateModel == "script" {
			if req.Script == "" {
				validErrors = append(validErrors, &form_validator.ValidError{Key: "script", Message: "script为必填字段"})
			}
		}
	}

	if req.ServiceType == "service_register" {
		if req.BackendServiceHost == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "backend_service_host", Message: "backend_service_host为必填字段"})
		}

		if req.BackendServicePath == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "backend_service_path", Message: "backend_service_path为必填字段"})
		}

		if req.HTTPMethod == "" {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "http_method", Message: "http_method为必填字段"})
		}
	}

	if len(validErrors) == 0 {
		return nil
	}

	return validErrors
}

// recordServiceCall 记录服务调用信息
func (s *QueryController) recordServiceCall(c *gin.Context, req *dto.QueryReq, callStartTime time.Time, httpCode int, callStatus int, errorMessage, cssjj string) {
	// xx环境由里约网关记录
	if cssjj == "true" {
		return
	}
	// 异步记录，避免影响主流程性能
	go func() {
		callEndTime := time.Now()

		// // 从请求中提取用户信息
		// userIdentification := c.GetHeader("User-Identification")
		// if userIdentification == "" {
		// 	userIdentification = c.GetHeader("X-User-ID")
		// }

		// // 从请求中提取部门信息
		// callDepartmentID := c.GetHeader("Call-Department-ID")
		// if callDepartmentID == "" {
		// 	callDepartmentID = c.GetHeader("X-Department-ID")
		// }

		// // 从请求中提取系统信息
		// callInfoSystemID := c.GetHeader("Call-Info-System-ID")
		// if callInfoSystemID == "" {
		// 	callInfoSystemID = c.GetHeader("X-System-ID")
		// }

		// // 从请求中提取应用信息
		// callAppID := c.GetHeader("Call-App-ID")
		// if callAppID == "" {
		// 	callAppID = c.GetHeader("X-App-ID")
		// }

		// 构建记录请求
		recordReq := &domain.RecordServiceCallReq{
			ServiceID:           req.ServicePath,
			ServiceDepartmentID: "", // 需要从服务信息中获取
			ServiceSystemID:     "", // 需要从服务信息中获取
			ServiceAppID:        "", // 需要从服务信息中获取
			RemoteAddress:       c.RemoteIP(),
			ForwardFor:          c.GetHeader("X-Forwarded-For"),
			UserIdentification:  "", // 需要从外部接口中获取
			CallDepartmentID:    "", // 需要从外部接口中获取
			CallInfoSystemID:    "", // 需要从外部接口中获取
			CallAppID:           "", // 需要从外部接口中获取
			CallStartTime:       callStartTime,
			CallEndTime:         &callEndTime,
			CallHTTPCode:        &httpCode,
			CallStatus:          callStatus,
			ErrorMessage:        errorMessage,
			CallOtherMessage:    "", // 可以记录其他相关信息
		}

		// 记录服务调用
		if err := s.serviceCallRecordDomain.RecordServiceCall(c, recordReq); err != nil {
			log.WithContext(c).Error("记录服务调用失败", zap.Error(err))
		}
	}()
}
