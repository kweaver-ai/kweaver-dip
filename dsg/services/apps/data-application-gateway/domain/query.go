package domain

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/enum"

	"github.com/samber/lo"

	"github.com/blastrain/vitess-sqlparser/sqlparser"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cast"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/gorm"
	mdl_uniquery "github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/mdl-uniquery"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/reverse_proxy"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/adapter/driven/virtual_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/interception"
	configuration_center_gocommon "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	data_view_gocommon "github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type QueryDomain struct {
	appRepo                    gorm.AppRepo
	serviceRepo                gorm.ServiceRepo
	serviceApplyRepo           gorm.ServiceApplyRepo
	virtualEngineRepo          virtual_engine.VirtualEngineRepo
	configurationRepo          gorm.ConfigurationRepo
	reverseProxyRepo           reverse_proxy.ReverseProxyRepo
	redis                      *repository.Redis
	dataViewRepo               microservice.DataViewRepo
	configurationCenterRepo    microservice.ConfigurationCenterRepo
	authService                microservice.AuthServiceRepo
	dataView                   data_view_gocommon.Driven
	gradeLabel                 configuration_center_gocommon.LabelService
	applicationService         configuration_center_gocommon.ApplicationService
	dataApplicationServiceRepo gorm.DataApplicationServiceRepo
	mdl_uniquery               mdl_uniquery.DrivenMDLUniQuery
}

func NewQueryDomain(
	appRepo gorm.AppRepo,
	serviceRepo gorm.ServiceRepo,
	serviceApplyRepo gorm.ServiceApplyRepo,
	configurationRepo gorm.ConfigurationRepo,
	virtualEngineRepo virtual_engine.VirtualEngineRepo,
	reverseProxyRepo reverse_proxy.ReverseProxyRepo,
	redis *repository.Redis,
	dataViewRepo microservice.DataViewRepo,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	authService microservice.AuthServiceRepo,
	dataView data_view_gocommon.Driven,
	gradeLabel configuration_center_gocommon.LabelService,
	applicationService configuration_center_gocommon.ApplicationService,
	dataApplicationServiceRepo gorm.DataApplicationServiceRepo,
	mdl_uniquery mdl_uniquery.DrivenMDLUniQuery,
) *QueryDomain {
	return &QueryDomain{
		appRepo:                    appRepo,
		serviceRepo:                serviceRepo,
		serviceApplyRepo:           serviceApplyRepo,
		virtualEngineRepo:          virtualEngineRepo,
		configurationRepo:          configurationRepo,
		reverseProxyRepo:           reverseProxyRepo,
		redis:                      redis,
		dataViewRepo:               dataViewRepo,
		configurationCenterRepo:    configurationCenterRepo,
		authService:                authService,
		dataView:                   dataView,
		gradeLabel:                 gradeLabel,
		applicationService:         applicationService,
		dataApplicationServiceRepo: dataApplicationServiceRepo,
		mdl_uniquery:               mdl_uniquery,
	}
}

func (u *QueryDomain) queryUserAuthedSubServices(c context.Context, serviceID string, subject *v1.Subject) (subServiceModels []model.SubService, err error) {
	//查询可授权的子规则
	objectEntries, err := u.authService.SubjectObjects(c, "sub_service", subject.ID, string(subject.Type))
	if err != nil {
		return nil, err
	}
	if len(objectEntries.Entries) <= 0 {
		return nil, nil
	}
	//查询用户有的子规则，如果有子规则的读取权限，才可以读取，然后将合并子规则，然后再执行
	subServices, err := u.serviceRepo.GetSubServices(c, serviceID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(subServices) <= 0 {
		return nil, nil
	}
	authedObjectDict := make(map[string]int)
	for _, object := range objectEntries.Entries {
		if len(object.Permissions) <= 0 {
			continue
		}
		for _, p := range object.Permissions {
			if !(p.Action == string(v1.ActionRead) && p.Effect == string(v1.PolicyAllow)) {
				continue
			}
			authedObjectDict[object.ObjectId] = 1
		}
	}
	subServices = lo.Filter(subServices, func(item *model.SubService, index int) bool {
		return authedObjectDict[item.ID.String()] > 0
	})
	return lo.Times(len(subServices), func(index int) model.SubService {
		return *subServices[index]
	}), nil
}

func (u *QueryDomain) Query(c context.Context, req *dto.QueryReq, cssjj string) (length int64, res io.ReadCloser, err error) {
	// 获取配置中心配置，如果配置中心配置cssjj为true，则不进行鉴权
	// cssjj, err := u.configurationRepo.GetConf(nil, c, "cssjj")
	// log.WithContext(c).Info("cssjj", zap.String("cssjj", cssjj))
	// if err != nil {
	// 	return 0, nil, err
	// }

	service, err := u.serviceRepo.ServiceGet(c, req.ServicePath)
	if err != nil {
		return 0, nil, err
	}
	if service.Status != enum.ServiceStatusOnline &&
		service.Status != enum.ServiceStatusDownAuditing &&
		service.Status != enum.ServiceStatusDownReject {
		return 0, nil, errorcode.Desc(errorcode.ServiceStatusNotAvailable)
	}

	if cssjj == "true" {
		//todo xx鉴权逻辑
		if err := u.cssjjAuth(c, req, service); err != nil {
			return 0, nil, err
		}
	} else {
		// 从 context 获取接调用者的信息，如果获取失败或调用者不是一个应用则禁止调用
		subject, err := interception.AuthServiceSubjectFromContext(c)
		if err != nil {
			return 0, nil, err
		}
		if subject.Type != v1.SubjectAPP {
			return 0, nil, errorcode.Desc(errorcode.ServiceApplyNotPass)
		}

		//查询下子服务
		//subServices, err := u.queryUserAuthedSubServices(c, service.ServiceID, subject)
		//if err != nil {
		//	return 0, nil, err
		//}
		//service.SubServices = subServices
		enforce := microservice.Enforce{
			SubjectType: string(subject.Type),
			SubjectId:   subject.ID,
			ObjectType:  "api",
			ObjectId:    service.ServiceID,
			Action:      "read",
		}
		resp, err := u.authService.Enforce(c, []microservice.Enforce{enforce})
		if err != nil {
			return 0, nil, err
		}

		authorized := resp[0]

		// var authorized bool
		// enforce.Effect = "allow" // 期望的 effect 是 allow
		// for _, e := range enforceRes {
		// 	if e != enforce {
		// 		continue
		// 	}
		// 	authorized = true
		// 	break
		// }
		log.Infof("app %v authorized result %v", subject.ID, authorized)
		if !authorized {
			return 0, nil, errorcode.Desc(errorcode.ServiceApplyNotPass)
		}
	}

	err = u.checkParams(c, req, service)
	if err != nil {
		return 0, nil, err
	}

	if err = u.getServiceParamDataProtectionQuery(c, service); err != nil {
		return 0, nil, err
	}

	// 执行查询
	length, res, queryErr := u.query(c, req.Params, service)

	// 异步统计埋点，不影响主流程
	// go func() {
	// 	ctx := context.Background()
	// 	if queryErr != nil {
	// 		// 查询失败，增加失败计数
	// 		if statErr := u.dataApplicationServiceRepo.IncrementFailCount(ctx, service.ServiceID); statErr != nil {
	// 			log.WithContext(ctx).Error("Query IncrementFailCount failed",
	// 				zap.String("service_id", service.ServiceID),
	// 				zap.Error(statErr))
	// 		}
	// 	} else {
	// 		// 查询成功，增加成功计数
	// 		if statErr := u.dataApplicationServiceRepo.IncrementSuccessCount(ctx, service.ServiceID); statErr != nil {
	// 			log.WithContext(ctx).Error("Query IncrementSuccessCount failed",
	// 				zap.String("service_id", service.ServiceID),
	// 				zap.Error(statErr))
	// 		}
	// 	}
	// }()

	return length, res, queryErr
}

// xx鉴权逻辑
func (u *QueryDomain) cssjjAuth(c context.Context, req *dto.QueryReq, service *model.ServiceAssociations) (err error) {
	var xTifSignature, xTifTimestamp, xTifNonce string
	var ok bool

	// 获取参数
	if param, exists := req.Params["x-tif-signature"]; exists {
		xTifSignature, ok = param.Value.(string)
		if !ok {
			log.WithContext(c).Error("cssjjAuth", zap.String("x-tif-signature", "x-tif-signature值不存在"))
			return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "x-tif-signature值不存在")
		}
	} else {
		log.WithContext(c).Error("cssjjAuth", zap.String("x-tif-signature", "x-tif-signature不存在"))
		return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "x-tif-signature不存在")
	}
	if param, exists := req.Params["x-tif-timestamp"]; exists {
		xTifTimestamp, ok = param.Value.(string)
		if !ok {
			log.WithContext(c).Error("cssjjAuth", zap.String("x-tif-timestamp", "x-tif-timestamp值不存在"))
			return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "x-tif-timestamp值不存在")
		}
	} else {
		log.WithContext(c).Error("cssjjAuth", zap.String("x-tif-timestamp", "x-tif-timestamp不存在"))
		return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "x-tif-timestamp不存在")
	}
	if param, exists := req.Params["x-tif-nonce"]; exists {
		xTifNonce, ok = param.Value.(string)
		if !ok {
			log.WithContext(c).Error("cssjjAuth", zap.String("x-tif-nonce", "x-tif-nonce值不存在"))
			return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "x-tif-nonce值不存在")
		}
	} else {
		log.WithContext(c).Error("cssjjAuth", zap.String("x-tif-nonce", "x-tif-nonce不存在"))
		return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "x-tif-nonce不存在")
	}

	// 获取 secret
	if service.AppsID == nil {
		log.WithContext(c).Error("cssjjAuth", zap.String("service.AppsID", "service.AppsID为空"))
		return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "service.AppsID为空")
	}

	application, err := u.applicationService.GetApplicationInternal(c, *service.AppsID)
	if err != nil {
		log.WithContext(c).Error("cssjjAuth", zap.String("application", "application不存在"))
		return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "application不存在")
	}
	if application == nil || application.Token == "" {
		log.WithContext(c).Error("cssjjAuth", zap.String("application.Token", "application.Token不存在"))
		return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "application.Token不存在")
	}
	secret := application.Token

	// 校验签名
	ok, resHeaders := checkSign(secret, xTifTimestamp, xTifNonce, xTifSignature)
	if !ok {
		log.WithContext(c).Error("cssjjAuth", zap.String("签名校验失败", "x-tif-signature="+resHeaders["x-tif-signature"]+" x-tif-timestamp="+resHeaders["x-tif-timestamp"]+" x-tif-nonce="+resHeaders["x-tif-nonce"]))
		return errorcode.Desc(errorcode.ServiceApplyNotPassCssjj + "签名校验失败：x-tif-signature=" + resHeaders["x-tif-signature"] + " x-tif-timestamp=" + resHeaders["x-tif-timestamp"] + " x-tif-nonce=" + resHeaders["x-tif-nonce"])
	}

	// 更新请求头
	for k, v := range resHeaders {
		req.Params[k] = dto.NewParam(v, dto.ParamPositionHeader, dto.ParamDataTypeString)
	}

	return nil
}

// xx签名校验逻辑
func checkSign(secret, timestamp, nonce, sign string) (bool, map[string]string) {
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return false, nil
	}
	now := time.Now().Unix()
	if ts > now+180 || ts < now-180 {
		return false, nil
	}
	log.Info("checkSign", zap.String("timestamp", timestamp), zap.String("secret", secret), zap.String("nonce", nonce), zap.String("sign", sign))
	signData := fmt.Sprintf("%s%s%s%s", timestamp, secret, nonce, timestamp)
	res := strings.ToUpper(fmt.Sprintf("%x", sha256.Sum256([]byte(signData))))

	// 生成一个类似于 Math.random().toString(36).substr(2) 的随机字符串

	resNonce := randomNonce()
	resTimestamp := strconv.FormatInt(time.Now().Unix(), 10)
	resSign := strings.ToUpper(fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%s%s%s%s", resTimestamp, secret, resNonce, resTimestamp)))))

	resHeaders := map[string]string{
		"x-tif-signature": resSign,
		"x-tif-timestamp": resTimestamp,
		"x-tif-nonce":     resNonce,
	}
	return res == strings.ToUpper(sign), resHeaders
}
func randomNonce() string {
	n := rand.Int63() // 生成一个随机int64
	return strings.TrimLeft(strconv.FormatInt(n, 36), "0")
}

func (u *QueryDomain) getServiceParamDataProtectionQuery(c context.Context, service *model.ServiceAssociations) (err error) {
	// 查询逻辑视图字段
	var dataViewFieldRes *data_view_gocommon.GetFieldsRes
	if dataViewFieldRes, err = u.dataView.GetDataViewFieldByInternal(c, service.ServiceDataSource.DataViewID); err != nil {
		return
	}
	// 查询字段是否开启查询保护
	// map[字段ID]是否开启查询保护
	fieldIDGradeIDMap := make(map[string]string)
	fieldProtectionQueryMap := make(map[string]bool)
	uniqueGradeIDMap := make(map[string]string)
	uniqueGradeIDSlice := []string{}
	for _, field := range dataViewFieldRes.FieldsRes {
		if field.LabelID != "" {
			if _, exist := uniqueGradeIDMap[field.LabelID]; !exist {
				fieldIDGradeIDMap[field.TechnicalName] = field.LabelID
				uniqueGradeIDMap[field.LabelID] = ""
				uniqueGradeIDSlice = append(uniqueGradeIDSlice, field.LabelID)
			}
		}
	}
	if len(uniqueGradeIDSlice) > 0 {
		// 获取标签详情
		var labelByIdsRes *configuration_center_gocommon.GetLabelByIdsRes
		labelByIdsRes, err = u.gradeLabel.GetLabelByIds(c, strings.Join(uniqueGradeIDSlice, ","))
		if err != nil {
			return
		}
		for _, v := range labelByIdsRes.Entries {
			fieldProtectionQueryMap[v.ID] = v.DataProtectionQuery
		}
		for i := range service.ServiceParams {
			if labelID, exist := fieldIDGradeIDMap[service.ServiceParams[i].EnName]; exist {
				service.ServiceParams[i].DataProtectionQuery = fieldProtectionQueryMap[labelID]
			}
		}
	}
	return
}

func (u *QueryDomain) query(c context.Context, params map[string]*dto.Param, service *model.ServiceAssociations) (length int64, res io.ReadCloser, err error) {
	c, span := trace.StartInternalSpan(c)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	switch service.ServiceType {
	case "service_generate":
		length, res, err = u.serviceGenerateQuery(c, params, service)
	case "service_register":
		length, res, err = u.serviceRegisterQuery(c, params, service)
	}

	return length, res, err
}

func (u *QueryDomain) QueryTest(c context.Context, req *dto.QueryTestReq) (length int64, res io.ReadCloser, err error) {
	c, span := trace.StartInternalSpan(c)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	service := &model.ServiceAssociations{
		Service: model.Service{
			BackendServiceHost: req.BackendServiceHost,
			BackendServicePath: req.BackendServicePath,
			CreateModel:        req.CreateModel,
			HTTPMethod:         req.HTTPMethod,
			ServiceType:        req.ServiceType,
		},
		ServiceScriptModel: model.ServiceScriptModel{
			PageSize: cast.ToUint32(req.Params[dto.Limit].Value),
			Script:   req.Script,
		},
	}
	if req.CurrentRules != nil {
		service.SubServices = []model.SubService{
			{
				RowFilterClause: genWhereClause(req.CurrentRules),
			},
		}
	}
	//接口生成
	if req.ServiceType == "service_generate" {
		//检查数据表视图id
		dataViewListRes, err := u.dataViewRepo.DataViewList(c, []string{req.DataViewId})
		if err != nil {
			return 0, nil, err
		}

		if dataViewListRes.TotalCount == 0 {
			return 0, nil, errorcode.Desc(errorcode.DataViewIdNotExist)
		}

		dataView := dataViewListRes.Entries[0]

		if dataView.PublishAt == 0 {
			return 0, nil, errorcode.Desc(errorcode.DataViewIdNotPublish)
		}

		catalogName, schemaName := u.dataViewRepo.ParseViewSourceCatalogName(dataView.ViewSourceCatalogName)

		service.ServiceDataSource = model.ServiceDataSource{
			CatalogName:    catalogName,
			DataSchemaName: schemaName,
			DataTableName:  dataView.TechnicalName,
		}
	}

	var serviceParams []model.ServiceParam
	for _, p := range req.DataTableRequestParams {
		if p.DefaultValue == "" {
			continue
		}

		m := model.ServiceParam{
			ParamType:    "request",
			CnName:       p.CNName,
			EnName:       p.EnName,
			Description:  p.Description,
			DataType:     p.DataType,
			Required:     p.Required,
			Operator:     p.Operator,
			DefaultValue: p.DefaultValue,
		}
		serviceParams = append(serviceParams, m)

		value, err := u.SetDefaultValue(p.EnName, p.DefaultValue, p.DataType)
		if err != nil {
			return 0, nil, err
		}

		req.Params[p.EnName] = dto.NewParam(value, dto.ParamPositionBody, dto.ParamDataType(p.DataType))
	}
	for _, p := range req.DataTableResponseParams {
		m := model.ServiceParam{
			ParamType:   "response",
			CnName:      p.CNName,
			EnName:      p.EnName,
			Description: p.Description,
			DataType:    p.DataType,
			Sequence:    uint32(p.Sequence),
			Sort:        p.Sort,
			Masking:     p.Masking,
		}
		serviceParams = append(serviceParams, m)
	}

	service.ServiceParams = serviceParams

	var serviceResponseFilters []model.ServiceResponseFilter
	for _, rule := range req.Rules {
		if rule.Param == "" {
			continue
		}

		f := model.ServiceResponseFilter{
			Param:    rule.Param,
			Operator: rule.Operator,
			Value:    rule.Value,
		}

		serviceResponseFilters = append(serviceResponseFilters, f)
	}

	service.ServiceResponseFilters = serviceResponseFilters

	return u.query(c, req.Params, service)
}

func (u *QueryDomain) serviceGenerateQuery(c context.Context, params map[string]*dto.Param, service *model.ServiceAssociations) (length int64, res io.ReadCloser, err error) {
	c, span := trace.StartInternalSpan(c)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	catalogName := service.ServiceDataSource.CatalogName
	schemaName := service.ServiceDataSource.DataSchemaName
	tableName := service.ServiceDataSource.DataTableName
	script := service.ServiceScriptModel.Script
	scriptCount := ""
	serviceParams := service.ServiceParams
	serviceResponseFilters := service.ServiceResponseFilters
	subServiceRule := strings.Join(lo.Times(len(service.SubServices), func(index int) string {
		return service.SubServices[index].RowFilterClause
	}), " or  ")

	switch service.CreateModel {
	case "wizard":
		script, err = u.serviceRepo.WizardModelScript(c, params, catalogName, schemaName, tableName, subServiceRule, serviceParams, false)
		scriptCount, err = u.serviceRepo.WizardModelScript(c, params, catalogName, schemaName, tableName, subServiceRule, serviceParams, true)
	case "script":
		script, err = u.serviceRepo.ScriptModelScript(c, params, catalogName, schemaName, script, subServiceRule, serviceParams, false)
		scriptCount, err = u.serviceRepo.ScriptModelScript(c, params, catalogName, schemaName, service.ServiceScriptModel.Script, subServiceRule, serviceParams, true)
		scriptCount = replaceSelectWithCountSafe(scriptCount)
	}

	if err != nil {
		return 0, nil, err
	}

	script = strings.ReplaceAll(script, "`", `"`)

	log.Info("serviceGenerateQuery",
		zap.String("service_path", service.ServicePath),
		zap.String("service_id", service.ServiceID),
		zap.String("script", script),
		zap.Any("params", params),
	)

	length, err = u.virtualEngineRepo.FetchCount(c, scriptCount, service.Timeout)
	if err != nil {
		return
	}
	// ids := service.ServiceDataSource.DataViewID
	// ids = "1991404463606149121"
	// result, err := u.mdl_uniquery.QueryData(c, ids, mdl_uniquery.QueryDataBody{SQL: scriptCount})
	// if err != nil {
	// 	return 0, nil, err
	// }
	// length = int64(result.Entries[0]["_col0"].(float64))

	// result2, err := u.mdl_uniquery.QueryData(c, ids, mdl_uniquery.QueryDataBody{SQL: script})
	// if err != nil {
	// 	return 0, nil, err
	// }

	// type FetchRes struct {
	// 	TotalCount int                      `json:"total_count"`
	// 	Data       []map[string]interface{} `json:"data"`
	// }

	// fetchRes := FetchRes{}

	fetchRes, err := u.virtualEngineRepo.Fetch(c, script, service.Timeout, serviceResponseFilters)
	if err != nil {
		return
	}
	fetchRes.TotalCount = int(length)
	// fetchRes.Data = result2.Entries

	fetchResJSON, err := json.Marshal(fetchRes)
	if err != nil {
		return
	}

	return int64(len(fetchResJSON)), io.NopCloser(bytes.NewReader(fetchResJSON)), nil
}

func (u *QueryDomain) serviceRegisterQuery(c context.Context, params map[string]*dto.Param, service *model.ServiceAssociations) (length int64, res io.ReadCloser, err error) {
	c, span := trace.StartInternalSpan(c)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	log.Info("serviceRegisterQuery",
		zap.String("service_path", service.ServicePath),
		zap.String("backend_service_host", service.BackendServiceHost),
		zap.String("backend_service_path", service.BackendServicePath),
		zap.Any("params", params),
	)
	return u.reverseProxyRepo.Serve(c, params, service.HTTPMethod, service.BackendServiceHost, service.BackendServicePath, service.Timeout)
}

func (u *QueryDomain) checkParams(c context.Context, req *dto.QueryReq, service *model.ServiceAssociations) (err error) {
	var validErrors form_validator.ValidErrors

	//检查分页参数
	offset, ok := req.Params[dto.Offset]
	if ok {
		value, err := cast.ToIntE(offset.Value)
		if err != nil {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "offset", Message: "接口 " + req.ServicePath + " 的请求参数 " + "offset" + " 应为 int 类型"})
		}

		if value < 1 {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "offset", Message: "接口 " + req.ServicePath + " 的请求参数 " + "offset" + " 最小值为 1"})
		}
	} else {
		req.Params[dto.Offset] = dto.NewParam(1, "", dto.ParamDataTypeInt)
	}

	limit, ok := req.Params[dto.Limit]
	if ok {
		value, err := cast.ToIntE(limit.Value)
		if err != nil {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "limit", Message: "接口 " + req.ServicePath + " 的请求参数 " + "limit" + " 应为 int 类型"})
		}

		if value < 0 {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "limit", Message: "接口 " + req.ServicePath + " 的请求参数 " + "limit" + " 最小值为 1"})
		}
		if value > 1000 {
			validErrors = append(validErrors, &form_validator.ValidError{Key: "limit", Message: "接口 " + req.ServicePath + " 的请求参数 " + "limit" + " 最大值为 1000"})
		}
	} else {
		if service.ServiceScriptModel.PageSize == 0 {
			req.Params[dto.Limit] = dto.NewParam(1000, "", dto.ParamDataTypeInt)
		} else {
			req.Params[dto.Limit] = dto.NewParam(service.ServiceScriptModel.PageSize, "", dto.ParamDataTypeInt)
		}
	}

	//检查用户配置的参数
	for _, serviceParam := range service.ServiceParams {
		//只检查请求参数
		if serviceParam.ParamType != "request" {
			continue
		}

		//检查参数必填项
		_, ok := req.Params[serviceParam.EnName]
		if serviceParam.Required == "yes" && !ok {
			validErrors = append(validErrors, &form_validator.ValidError{Key: serviceParam.EnName, Message: "接口 " + req.ServicePath + " 的请求参数 " + serviceParam.EnName + " 为必填字段"})
		}

		//非必填项没传参 且有默认值 参数值设置为用户填的默认值
		if serviceParam.Required == "no" && serviceParam.DefaultValue != "" && !ok {
			value, err := u.SetDefaultValue(serviceParam.EnName, serviceParam.DefaultValue, serviceParam.DataType)
			if err != nil {
				return err
			}
			req.Params[serviceParam.EnName] = dto.NewParam(value, "", dto.ParamDataType(serviceParam.DataType))
		}

		reqParam, ok := req.Params[serviceParam.EnName]
		if !ok {
			continue
		}

		//转换query参数的数据类型
		if reqParam.Position == dto.ParamPositionQuery {
			switch serviceParam.DataType {
			case string(dto.ParamDataTypeInt), string(dto.ParamDataTypeLong):
				value, err := cast.ToInt64E(reqParam.Value)
				if err != nil {
					return errorcode.Detail(errorcode.QueryError, err.Error())
				}
				//使用转换数据类型后的参数 覆盖原参数
				req.Params[serviceParam.EnName] = dto.NewParam(value, dto.ParamPositionQuery, dto.ParamDataTypeLong)
			case string(dto.ParamDataTypeFloat), string(dto.ParamDataTypeDouble):
				value, err := cast.ToFloat64E(reqParam.Value)
				if err != nil {
					return errorcode.Detail(errorcode.QueryError, err.Error())
				}
				req.Params[serviceParam.EnName] = dto.NewParam(value, dto.ParamPositionQuery, dto.ParamDataTypeDouble)
			}
		}

		// 检查body参数的数据类型
		if reqParam.Position == dto.ParamPositionBody {
			switch serviceParam.DataType {
			case string(dto.ParamDataTypeString):
				if _, ok := reqParam.Value.(string); !ok {
					validErrors = append(validErrors, u.newValidError(req.ServicePath, serviceParam.EnName, dto.ParamDataTypeString))
				}
				reqParam.DataType = dto.ParamDataTypeString
			case string(dto.ParamDataTypeInt):
				value, ok := reqParam.Value.(json.Number)
				valueInt64, err := value.Int64()
				if !ok || err != nil {
					validErrors = append(validErrors, u.newValidError(req.ServicePath, serviceParam.EnName, dto.ParamDataTypeInt))
				}
				reqParam.Value = valueInt64
				reqParam.DataType = dto.ParamDataTypeInt
			case string(dto.ParamDataTypeLong):
				value, ok := reqParam.Value.(json.Number)
				valueInt64, err := value.Int64()
				if !ok || err != nil {
					validErrors = append(validErrors, u.newValidError(req.ServicePath, serviceParam.EnName, dto.ParamDataTypeLong))
				}

				reqParam.Value = valueInt64
				reqParam.DataType = dto.ParamDataTypeLong
			case string(dto.ParamDataTypeFloat):
				value, ok := reqParam.Value.(json.Number)
				valueFloat64, err := value.Float64()
				if !ok || err != nil {
					validErrors = append(validErrors, u.newValidError(req.ServicePath, serviceParam.EnName, dto.ParamDataTypeFloat))
				}

				reqParam.Value = valueFloat64
				reqParam.DataType = dto.ParamDataTypeFloat
			case string(dto.ParamDataTypeDouble):
				value, ok := reqParam.Value.(json.Number)
				valueFloat64, err := value.Float64()
				if !ok || err != nil {
					validErrors = append(validErrors, u.newValidError(req.ServicePath, serviceParam.EnName, dto.ParamDataTypeDouble))
				}

				reqParam.Value = valueFloat64
				reqParam.DataType = dto.ParamDataTypeDouble
			case string(dto.ParamDataTypeBoolean):
				value, ok := reqParam.Value.(bool)
				if !ok {
					validErrors = append(validErrors, u.newValidError(req.ServicePath, serviceParam.EnName, dto.ParamDataTypeBoolean))
				}
				reqParam.Value = value
				reqParam.DataType = dto.ParamDataTypeBoolean
			}
		}
	}

	if len(validErrors) == 0 {
		return nil
	}

	return validErrors
}

// SetDefaultValue default_value 字段以字符串类型传值, 可能和数据库中实际的字段数据类型不一致, 需要转成参数的实际类型
func (u *QueryDomain) SetDefaultValue(name string, value interface{}, dataType string) (newValue interface{}, err error) {
	switch dto.ParamDataType(dataType) {
	case dto.ParamDataTypeInt:
		newValue, err = cast.ToInt32E(value)
	case dto.ParamDataTypeLong:
		newValue, err = cast.ToInt64E(value)
	case dto.ParamDataTypeFloat:
		newValue, err = cast.ToFloat32E(value)
	case dto.ParamDataTypeDouble:
		newValue, err = cast.ToFloat64E(value)
	case dto.ParamDataTypeBoolean:
		if newValue != "true" && value != "false" {
			err = errors.New(fmt.Sprintf("%s 必须为 true 或 false", name))
		} else {
			newValue, err = cast.ToBoolE(value)
		}
	default:
		newValue = value
	}

	if err != nil {
		return nil, errorcode.Detail(errorcode.QueryError, err.Error())
	}
	return
}

func (u *QueryDomain) newValidError(servicePath, paramName string, dataType dto.ParamDataType) *form_validator.ValidError {
	message := fmt.Sprintf("接口 %s 的请求参数 %s 应为 %s 类型", servicePath, paramName, dataType)
	return &form_validator.ValidError{Key: paramName, Message: message}
}

func (u *QueryDomain) checkScript(c *gin.Context, script string) (err error) {
	if script == "" {
		return nil
	}

	// 语法解析检查
	stmt, err := sqlparser.Parse(script)
	if err != nil {
		return errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	sql := strings.ToLower(script)
	//排除 select *
	if strings.Contains(sql, "select*") || strings.Contains(sql, "select *") {
		return errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	//排除注释
	if strings.HasPrefix(sql, "#") || strings.HasPrefix(sql, "/*") {
		return errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	//排除 insert、update、delete
	_, ok := stmt.(*sqlparser.Insert)
	if ok {
		return errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}
	_, ok = stmt.(*sqlparser.Update)
	if ok {
		return errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}
	_, ok = stmt.(*sqlparser.Delete)
	if ok {
		return errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	_, ok = stmt.(*sqlparser.Select)
	if !ok {
		return errorcode.Desc(errorcode.ServiceSQLSyntaxError)
	}

	return nil
}

// IsEnableResourceDirectory 查询是否启用数据资源目录，1即数据资源目录，返回true，接口需要编目
func (u *QueryDomain) IsEnableResourceDirectory(ctx context.Context) (isEnable bool, err error) {
	res, err := u.configurationCenterRepo.GetDataResourceDirectoryConfigInfo(ctx)
	if err != nil {
		return false, err
	}
	isEnable = res.Using == 1
	return
}

// 容忍的时间戳误差范围
const timestampToleration = time.Minute * 5

// func (u *QueryDomain) SignValidate(c *gin.Context, req *dto.QueryReq) error {
// 	authorizationHeader := c.GetHeader(enum.HeaderAuthorization)
// 	if authorizationHeader == "" {
// 		return errorcode.Desc(errorcode.SignValidateError)
// 	}

// 	authorization, err := util.ParseAuthorization(authorizationHeader)
// 	if err != nil {
// 		return errorcode.Desc(errorcode.SignValidateError)
// 	}

// 	//时间戳是否存在
// 	if authorization.Timestamp == "" {
// 		return errorcode.Desc(errorcode.TimestampRequired)
// 	}
// 	//时间戳解析
// 	timestampInt, err := strconv.ParseInt(authorization.Timestamp, 10, 64)
// 	if err != nil {
// 		return errorcode.Desc(errorcode.TimestampError)
// 	}
// 	timestamp := time.Unix(timestampInt, 0)
// 	// 检查时间戳是否处于误差范围内
// 	if !isTimeInDelta(time.Now(), timestamp, timestampToleration) {
// 		return errorcode.Desc(errorcode.TimestampExpired)
// 	}

// 	//appid是否存在
// 	if authorization.AppId == "" {
// 		return errorcode.Desc(errorcode.AppIdRequired)
// 	}
// 	app, err := u.appRepo.Get(c, authorization.AppId)
// 	if err != nil {
// 		return errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}
// 	if app.AppID == "" {
// 		return errorcode.Desc(errorcode.AppIdNotExist)
// 	}

// 	//验证请求签名
// 	validate := util.HttpSignValidate(c.Request, app.AppSecret, authorization)
// 	if !validate {
// 		return errorcode.Desc(errorcode.SignValidateError)
// 	}

// 	//检查接口状态
// 	isEnable, err := u.IsEnableResourceDirectory(c)
// 	if err != nil {
// 		log.Error("SignValidate: 查询启用数据资源管理方式配置出错：", zap.Error(err))
// 		isEnable = true
// 	}

// 	service, err := u.serviceRepo.ServiceGetFields(c, c.Request.Method, req.ServicePath, []string{"service_id", "service_path", "publish_status", "status", "rate_limiting", "owner_id"})
// 	if err != nil {
// 		return errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}
// 	if service.ServiceID == "" {
// 		return errorcode.Desc(errorcode.ServicePathNotExist)
// 	}
// 	//启用数据资源目录
// 	if isEnable {
// 		if service.PublishStatus != enum.PublishStatusPublished {
// 			return errorcode.Desc(errorcode.ServiceQueryPublishError)
// 		}
// 	} else {
// 		if service.Status != enum.ServiceStatusOnline {
// 			return errorcode.Desc(errorcode.ServiceQueryPublishError)
// 		}
// 	}

// 	//频次限制
// 	if service.RateLimiting != 0 {
// 		limiterKey := app.AppID + service.ServiceID
// 		limiter := redis_rate.NewLimiter(u.redis.Client)
// 		res, err := limiter.Allow(c, limiterKey, redis_rate.PerSecond(int(service.RateLimiting)))
// 		if err != nil {
// 			return errorcode.Detail(errorcode.PublicInternalError, err)
// 		}
// 		if res.Allowed == 0 {
// 			return errorcode.Desc(errorcode.RateLimitError)
// 		}
// 	}

// 	//随机请求串是否使用过
// 	if authorization.Nonce == "" {
// 		return errorcode.Desc(errorcode.SignValidateError)
// 	}
// 	key := "data-application-gateway-nonce:" + authorization.Nonce
// 	setNX := u.redis.Client.SetNX(c, key, authorization.Nonce, 300*time.Second)
// 	if !setNX.Val() {
// 		return errorcode.Desc(errorcode.SignValidateError)
// 	}

// 	// 如果发起请求的用户是否为接口服务的 Owner，认为有调用权限，不需要向 auth-service 鉴权
// 	if app.UID == service.OwnerID {
// 		return nil
// 	}

// 	//appid所属用户是否有接口权限

// 	enforcesReq := []microservice.Enforce{
// 		{
// 			Action:      "read",
// 			ObjectId:    service.ServiceID,
// 			ObjectType:  "api",
// 			SubjectId:   app.UID,
// 			SubjectType: "user",
// 		},
// 	}

// 	enforces, err := u.authService.Enforce(c, enforcesReq)
// 	if err != nil {
// 		return err
// 	}
// 	if len(enforces) == 0 {
// 		return errorcode.Desc(errorcode.ServiceApplyNotPass)
// 	}
// 	if enforces[0].Effect == "deny" {
// 		return errorcode.Desc(errorcode.ServiceApplyNotPass)
// 	}

// 	return nil
// }

// isTimeInDelta 判断两个时间是相差在范围内，闭区间。
func isTimeInDelta(expected, actual time.Time, delta time.Duration) bool {
	if expected.After(actual.Add(delta)) {
		return false
	}
	if actual.After(expected.Add(delta)) {
		return false
	}
	return true
}

// 替换sql为count(*)
func replaceSelectWithCountSafe(sql string) string {
	// 转换为小写方便查找，但保留原始大小写用于返回结果
	lowerSQL := strings.ToLower(sql)

	// 查找SELECT的位置
	selectIndex := strings.Index(lowerSQL, "select")
	if selectIndex == -1 {
		return sql // 没有找到SELECT，返回原SQL
	}

	// 从SELECT之后查找FROM
	fromIndex := strings.Index(lowerSQL[selectIndex+len("select"):], "from")
	if fromIndex == -1 {
		return sql // 没有找到FROM，返回原SQL
	}

	// 计算FROM在原字符串中的实际位置
	fromIndex += selectIndex + len("select")

	// 构造新的SQL
	// 保留SELECT之前的部分
	beforeSelect := sql[:selectIndex+len("select")]
	// 保留FROM及其之后的部分
	afterFrom := sql[fromIndex:]

	// 组合结果: SELECT + COUNT(*) + FROM及其后的内容
	return beforeSelect + " COUNT(*) " + afterFrom
}
