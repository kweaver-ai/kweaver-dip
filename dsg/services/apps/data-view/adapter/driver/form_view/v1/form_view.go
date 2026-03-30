package v1

import (
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/gin-gonic/gin"
)

var _ = new(response.BoolResp)

type FormViewService struct {
	uc form_view.FormViewUseCase
}

func NewFormViewService(uc form_view.FormViewUseCase) *FormViewService {
	return &FormViewService{uc: uc}
}

// PageList 获取逻辑视图列表
//
//	@Description	获取逻辑视图列表,包括元数据视图、自定义视图、逻辑实体视图
//	@Tags			逻辑视图
//	@Summary		获取逻辑视图列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			query			query		form_view.PageListFormViewReq	true	"查询参数"
//	@Success		200				{object}	form_view.PageListFormViewResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view [get]
func (f *FormViewService) PageList(c *gin.Context) {
	req := form_validator.Valid[form_view.PageListFormViewReq](c)
	if req == nil {
		return
	}
	if (req.CreatedAtEnd != 0 && req.CreatedAtStart >= req.CreatedAtEnd) || (req.UpdatedAtEnd != 0 && req.UpdatedAtStart >= req.UpdatedAtEnd) {
		ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.StartTimeMustBigEndTime))
		return
	}
	//if (len(req.DatasourceType) != 0 && req.DatasourceId != "") || (len(req.DatasourceIds) != 0 && req.DatasourceId != "") {
	if (req.DatasourceType != "" && req.DatasourceId != "") ||
		(len(req.DatasourceIds) != 0 && req.DatasourceId != "") {
		ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.DataSourceIDAndDataSourceTypeExclude))
		return
	}
	if req.InfoSystemID != nil {
		if *req.InfoSystemID != "" && (req.DatasourceId != "" && req.DataSourceSourceType != "") {
			ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.InfoSystemIDAndDataSourceIDAndDataSourceTypeExclude))
			return
		}
	}

	if req.DataSourceSourceType != "" && req.DatasourceId != "" {
		ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.DataSourceSourceTypeAndDataSourceIDExclude))
		return
	}
	// kylin 要求不能传数组改为逗号分割
	if req.DatasourceIdString != "" {
		split := strings.Split(req.DatasourceIdString, ",")
		if len(split) > 0 {
			regexPattern := regexp.MustCompile(constant.UUIDRegexString)
			req.DatasourceIds = make([]string, len(split))
			for i, s := range split {
				if !regexPattern.MatchString(s) {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"datasource_ids": "must be uuid"}))
					return
				}
				req.DatasourceIds[i] = s
			}
		}
	}
	if req.FormViewIdsString != "" {
		split := strings.Split(req.FormViewIdsString, ",")
		if len(split) > 0 {
			regexPattern := regexp.MustCompile(constant.UUIDRegexString)
			req.FormViewIds = make([]string, len(split))
			for i, s := range split {
				if !regexPattern.MatchString(s) {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"form_view_id": "must be uuid"}))
					return
				}
				req.FormViewIds[i] = s
			}
		}
	}
	if req.OwnerIDString != "" {
		split := strings.Split(req.OwnerIDString, ",")
		if len(split) > 0 {
			regexPattern := regexp.MustCompile(constant.UUIDRegexString)
			req.OwnerIDs = make([]string, len(split))
			for i, s := range split {
				if s == constant.UnallocatedId {
					req.NotHaveOwner = true
					continue
				}
				if !regexPattern.MatchString(s) {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"owner_id": "must be uuid"}))
					return
				}
				req.OwnerIDs[i] = s
			}
		}
	}

	if req.StatusListString != "" {
		split := strings.Split(req.StatusListString, ",")
		if len(split) > 0 {
			req.StatusList = make([]int32, len(split))
			for i, s := range split {
				statusInt := enum.ToInteger[constant.FormViewScanStatus](s).Int32()
				if statusInt == 0 {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"status_list": "must in uniformity new modify delete"}))
					return
				}
				req.StatusList[i] = statusInt
			}
		}
	}

	if req.OnlineStatusListString != "" {
		split := strings.Split(req.OnlineStatusListString, ",")
		if len(split) > 0 {
			req.OnlineStatusList = make([]string, len(split))
			for i, s := range split {
				if _, exist := constant.LineStatusMap[s]; !exist {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"online_status_list": "must in notline online offline up-auditing down-auditing up-reject down-reject"}))
					return
				}
				req.OnlineStatusList[i] = s
			}
		}
	}

	resp, err := util.TraceA1R2(c, req, f.uc.PageList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// PublishPageList 获取已发布逻辑视图列表
//
//	@Description	获取已发布逻辑视图列表,包括元数据视图、自定义视图、逻辑实体视图
//	@Tags			逻辑视图
//	@Summary		获取已发布逻辑视图列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			query			query		form_view.PageListFormViewReqQueryParamBase	true	"查询参数"
//	@Success		200				{object}	form_view.PageListFormViewResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view/published [get]
func (f *FormViewService) PublishPageList(c *gin.Context) {
	req := form_validator.Valid[form_view.PageListFormViewReq](c)
	if req == nil {
		return
	}
	if (req.CreatedAtEnd != 0 && req.CreatedAtStart >= req.CreatedAtEnd) || (req.UpdatedAtEnd != 0 && req.UpdatedAtStart >= req.UpdatedAtEnd) {
		ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.StartTimeMustBigEndTime))
		return
	}
	//if (len(req.DatasourceType) != 0 && req.DatasourceId != "") || (len(req.DatasourceIds) != 0 && req.DatasourceId != "") {
	if (req.DatasourceType != "" && req.DatasourceId != "") ||
		(len(req.DatasourceIds) != 0 && req.DatasourceId != "") {
		ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.DataSourceIDAndDataSourceTypeExclude))
		return
	}
	if req.InfoSystemID != nil {
		if *req.InfoSystemID != "" && (req.DatasourceId != "" && req.DataSourceSourceType != "") {
			ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.InfoSystemIDAndDataSourceIDAndDataSourceTypeExclude))
			return
		}
	}

	if req.DataSourceSourceType != "" && req.DatasourceId != "" {
		ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.DataSourceSourceTypeAndDataSourceIDExclude))
		return
	}
	// kylin 要求不能传数组改为逗号分割
	if req.DatasourceIdString != "" {
		split := strings.Split(req.DatasourceIdString, ",")
		if len(split) > 0 {
			regexPattern := regexp.MustCompile(constant.UUIDRegexString)
			req.DatasourceIds = make([]string, len(split))
			for i, s := range split {
				if !regexPattern.MatchString(s) {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"datasource_ids": "must be uuid"}))
					return
				}
				req.DatasourceIds[i] = s
			}
		}
	}
	if req.FormViewIdsString != "" {
		split := strings.Split(req.FormViewIdsString, ",")
		if len(split) > 0 {
			regexPattern := regexp.MustCompile(constant.UUIDRegexString)
			req.FormViewIds = make([]string, len(split))
			for i, s := range split {
				if !regexPattern.MatchString(s) {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"form_view_id": "must be uuid"}))
					return
				}
				req.FormViewIds[i] = s
			}
		}
	}
	if req.OwnerIDString != "" {
		split := strings.Split(req.OwnerIDString, ",")
		if len(split) > 0 {
			regexPattern := regexp.MustCompile(constant.UUIDRegexString)
			req.OwnerIDs = make([]string, len(split))
			for i, s := range split {
				if s == constant.UnallocatedId {
					req.NotHaveOwner = true
					continue
				}
				if !regexPattern.MatchString(s) {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"owner_id": "must be uuid"}))
					return
				}
				req.OwnerIDs[i] = s
			}
		}
	}

	if req.StatusListString != "" {
		split := strings.Split(req.StatusListString, ",")
		if len(split) > 0 {
			req.StatusList = make([]int32, len(split))
			for i, s := range split {
				statusInt := enum.ToInteger[constant.FormViewScanStatus](s).Int32()
				if statusInt == 0 {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"status_list": "must in uniformity new modify delete"}))
					return
				}
				req.StatusList[i] = statusInt
			}
		}
	}

	if req.OnlineStatusListString != "" {
		split := strings.Split(req.OnlineStatusListString, ",")
		if len(split) > 0 {
			req.OnlineStatusList = make([]string, len(split))
			for i, s := range split {
				if _, exist := constant.LineStatusMap[s]; !exist {
					ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"online_status_list": "must in notline online offline up-auditing down-auditing up-reject down-reject"}))
					return
				}
				req.OnlineStatusList[i] = s
			}
		}
	}
	req.PublishStatus = constant.FormViewReleased.String

	resp, err := util.TraceA1R2(c, req, f.uc.PageList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Scan 扫描数据源
//
//	@Description	扫描数据源
//	@Tags			元数据视图
//	@Summary		扫描数据源
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					            true	"token"
//	@Param			_				body		form_view.ScanReq	true	"请求参数"
//	@Success		200				{object}	    form_view.ScanRes          "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			            "失败响应参数"
//	@Router			/form-view/scan [post]
func (f *FormViewService) Scan(c *gin.Context) {
	req := form_validator.Valid[form_view.ScanReq](c)
	if req == nil {
		return
	}
	res, err := f.uc.Scan(c, req) // 已记录业务审计日志
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// NameRepeat 逻辑视图重名校验
//
// @Description 逻辑视图重名校验
// @Tags        逻辑视图
// @Summary     逻辑视图重名校验
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       _           body  form_view.NameRepeatParam true "请求参数"
// @Success     200         {object}	response.BoolResp "成功响应参数"
// @Failure     400         {object} rest.HttpError "失败响应参数"
// @Router      /form-view/repeat [get]
func (f *FormViewService) NameRepeat(c *gin.Context) {
	req := form_validator.Valid[form_view.NameRepeatReq](c)
	if req == nil {
		return
	}
	if req.NameType == "technical_name" {
		compile := regexp.MustCompile("^[a-z_][a-z0-9_]*$")
		if !compile.Match([]byte(req.Name)) || len([]rune(req.Name)) > 100 {
			ginx.ResBadRequestJson(c, errorcode.WithDetail(errorcode.PublicInvalidParameter, map[string]any{"technical_name": "长度必须不超过100，只能包含小写字母，数字和下划线，且不能以数字开头"}))
			return
		}
	}

	res, err := util.TraceA1R2(c, req, f.uc.NameRepeat)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateFormView 编辑元数据视图
//
// @Description 编辑元数据视图
// @Tags        元数据视图
// @Summary     编辑元数据视图
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       id          path  string true "视图ID"
// @Param       _           body  form_view.UpdateReq true "请求参数"
// @Success     200         {object} form_view.UpdateRes "成功响应参数"
// @Failure     400         {object} rest.HttpError "失败响应参数"
// @Router      /form-view/{id} [put]
func (f *FormViewService) UpdateFormView(c *gin.Context) {
	req := form_validator.Valid[form_view.UpdateReq](c)
	if req == nil {
		return
	}

	err := f.uc.UpdateDatasourceView(c, req) // 已记录业务审计日志
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}

// BatchPublish 批量发布元数据视图
//
// @Description	根据数据源名称及技术名称批量发布元数据视图
// @Tags		元数据视图
// @Summary		批量发布元数据视图
// @Accept		application/json
// @Produce		application/json
// @Param		Authorization	header		string   true	"token"
// @Param		_				body		form_view.BatchPublishBody	true	"请求参数"
// @Success		200				{object}	form_view.BatchPublishRes          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/batch/publish [put]
func (f *FormViewService) BatchPublish(c *gin.Context) {
	req := form_validator.Valid[form_view.BatchPublishReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.BatchPublish)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ExcelBatchPublish excel批量发布元数据视图
//
// @Description	excel根据数据源名称及技术名称批量发布元数据视图
// @Tags		元数据视图
// @Summary		excel批量发布元数据视图
// @Accept		multipart/form-data
// @Produce		application/json
// @param       file   formData   file   true   "上传的文件"
// @Param		Authorization	header		string   true	"token"
// @Param		_				query		form_view.ExcelBatchPublishForm	true	"请求参数"
// @Success		200				{object}	form_view.ExcelBatchPublishRes          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/excel/batch/publish [put]
func (f *FormViewService) ExcelBatchPublish(c *gin.Context) {
	req := form_validator.Valid[form_view.ExcelBatchPublishReq](c)
	if req == nil {
		return
	}
	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(my_errorcode.FormExistRequiredEmpty))
		return
	}
	headers := form.File["file"]
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(my_errorcode.FormOneMax))
		return
	}

	res, err := util.TraceA2R2(c, req, headers[0], f.uc.ExcelBatchPublish)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteFormView 删除逻辑视图
//
// @Description 删除逻辑视图
// @Tags        逻辑视图
// @Summary     删除逻辑视图
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       id          path  string true "视图ID" Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
// @Param       keyword     query string false "名称"
// @Success     200         {object} form_view.UpdateRes "成功响应参数"
// @Failure     400         {object} rest.HttpError      "失败响应参数"
// @Router      /form-view/{id} [delete]
func (f *FormViewService) DeleteFormView(c *gin.Context) {
	req := form_validator.Valid[form_view.DeleteReq](c)
	if req == nil {
		return
	}

	err := f.uc.DeleteFormView(c, req) // 已记录业务审计日志
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}

func (f *FormViewService) GetFields(c *gin.Context) {
	req := form_validator.Valid[form_view.GetFieldsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetFields)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetDatasourceList 获取数据源列表
//
// @Description 获取数据源列表
// @Tags        元数据视图
// @Summary     获取数据源列表
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetDatasourceListRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /datasource [get]
func (f *FormViewService) GetDatasourceList(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDatasourceListReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDataSources)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

/*
func (f *FormViewService) FinishProject(c *gin.Context) {
	req := form_validator.Valid[form_view.FinishProjectReq](c)
	if req == nil {
		return
	}

	err := util.TraceA1R1(c, req, f.uc.FinishProject)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}*/

func (f *FormViewService) DeleteRelated(c *gin.Context) {
	req := form_validator.Valid[form_view.DeleteRelatedReq](c)
	if req == nil {
		return
	}

	err := util.TraceA1R1(c, req, f.uc.DeleteRelated)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, err)
}

func (f *FormViewService) GetRelatedFieldInfo(c *gin.Context) {
	req := form_validator.Valid[form_view.GetRelatedFieldInfoReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetRelatedFieldInfo)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

func (f *FormViewService) GetFormViewDetails(c *gin.Context) {
	req := form_validator.Valid[form_view.GetFormViewDetailsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetFormViewDetails)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateFormViewDetails 编辑逻辑视图基本信息
//
// @Description 编辑逻辑视图基本信息
// @Tags        逻辑视图
// @Summary     编辑逻辑视图基本信息
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       id          path  string true "视图ID" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
// @Param       _           body  form_view.UpdateFormViewDetailsReq true "请求参数"
// @Success     200         {object} form_view.UpdateFormViewDetailsRes "成功响应参数"
// @Failure     400         {object} rest.HttpError                 "失败响应参数"
// @Router      /form-view/{id}/details [PUT]
func (f *FormViewService) UpdateFormViewDetails(c *gin.Context) {
	req := form_validator.Valid[form_view.UpdateFormViewDetailsReq](c)
	if req == nil {
		return
	}

	err := f.uc.UpdateFormViewDetails(c, req) // 已记录业务审计日志
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}

// GetUsersFormViews 获取用户有权限下的视图
//
// @Description 获取用户有权限下的视图
// @Tags        open逻辑视图
// @Summary     获取用户有权限下的视图
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       query         query  form_view.GetUsersFormViewsReq true "请求参数"
// @Success     200           {object} form_view.GetUsersFormViewsPageRes "成功响应参数"
// @Failure     400           {object} rest.HttpError                 "失败响应参数"
// @Router      /user/form-view [get]
func (f *FormViewService) GetUsersFormViews(c *gin.Context) {
	req := form_validator.Valid[form_view.GetUsersFormViewsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetUsersFormViews)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetUsersAllFormViews 获取用户有权限下与授权的视图
//
// @Description 获取用户有权限下的与授权的视图
// @Tags        open逻辑视图
// @Summary     获取用户有权限下的与授权的视图
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       query         query  form_view.GetUsersFormViewsReq true "请求参数"
// @Success     200           {object} form_view.GetUsersFormViewsPageRes "成功响应参数"
// @Failure     400           {object} rest.HttpError                 "失败响应参数"
// @Router      /user/form-all-view [get]
func (f *FormViewService) GetUsersAllFormViews(c *gin.Context) {
	req := form_validator.Valid[form_view.GetUsersFormViewsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetUsersAllFormViews)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetUsersFormViewsFields 获取用户有权限下的视图字段
//
// @Description 获取用户有权限下的视图字段
// @Tags        open逻辑视图
// @Summary     获取用户有权限下的视图字段
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       id            path   string true "视图ID" Format(uuid) example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"
// @Param       query         query  form_view.GetUsersFormViewsFieldsReq false "请求参数"
// @Success     200           {object} form_view.GetFieldsRes "成功响应参数"
// @Failure     400           {object} rest.HttpError       "失败响应参数"
// @Router      /user/form-view/{id} [get]
func (f *FormViewService) GetUsersFormViewsFields(c *gin.Context) {
	req := form_validator.Valid[form_view.GetUsersFormViewsFieldsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetUsersFormViewsFields)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetUsersMultiFormViewsFields 获取用户有权限下的多个视图字段
//
// @Description 获取用户有权限下的多个视图字段
// @Tags        open逻辑视图
// @Summary     获取用户有权限下的多个视图字段
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       query         body   form_view.GetUsersMultiFormViewsFieldsBody true "请求参数"
// @Success     200           {object} form_view.GetUsersMultiFormViewsFieldsRes "成功响应参数"
// @Failure     400           {object} rest.HttpError                        "失败响应参数"
// @Router      /user/form-view/field/multi [post]
func (f *FormViewService) GetUsersMultiFormViewsFields(c *gin.Context) {
	req := form_validator.Valid[form_view.GetUsersMultiFormViewsFieldsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetUsersMultiFormViewsFields)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetMultiViewsFields 获取多个逻辑视图字段
//
//	@Description	获取多个逻辑视图字段
//	@Tags			逻辑视图
//	@Summary		获取多个逻辑视图字段
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					            true	"token"
//	@Param			query			body		form_view.GetMultiViewsFieldsBody	true	"请求参数"
//	@Success		200				{object}	form_view.GetMultiViewsFieldsRes          "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			            "失败响应参数"
//	@Router			/logic-view/field/multi [post]
func (f *FormViewService) GetMultiViewsFields(c *gin.Context) {
	req := form_validator.Valid[form_view.GetMultiViewsFieldsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req.IDs, f.uc.GetMultiViewsFields)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// FormViewFilter 传入视图ID列表，返回未被删除的
//
//	@Description	传入视图ID列表，返回未被删除的, 资产全景过滤浏览器本地用户点击记录
//	@Tags			逻辑视图
//	@Summary		逻辑实体过滤器
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string					            true	"token"
//	@Param			body			body		form_view.FormViewFilterReq	true	"请求参数"
//	@Success		200		{object}	form_view.FormViewFilterResp "成功响应参数"
//	@Failure		400		{object}	rest.HttpError			            "失败响应参数"
//	@Router			/form-view/filter [POST]
func (f *FormViewService) FormViewFilter(c *gin.Context) {
	req := form_validator.Valid[form_view.FormViewFilterReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.FormViewFilter)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// QueryLogicalEntityByView 查询逻辑视图的关联的逻辑实体的路径信息
//
//	@Description	查询逻辑视图的关联的逻辑实体的路径信息
//	@Tags			open逻辑视图
//	@Summary		资产全景搜索
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string		true	"token"
//	@Param			_				body		form_view.QueryLogicalEntityByViewReq	true	"请求参数"
//	@Success		200				{object}	form_view.QueryLogicalEntityByViewResp           "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			            "失败响应参数"
//	@Router			/api/data-view/v1/subject-domain/logical-view [GET]
func (f *FormViewService) QueryLogicalEntityByView(c *gin.Context) {
	req := form_validator.Valid[form_view.QueryLogicalEntityByViewReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.QueryRelatedLogicalEntityInfo)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

func (f *FormViewService) QueryViewDetail(c *gin.Context) {
	req := form_validator.Valid[form_view.QueryViewDetailBySubjectIDReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.QueryViewDetail)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetExploreJobStatus 获取探查执行状态
// @Description	获取探查执行状态
// @Tags		数据探查
// @Summary		获取探查执行状态
// @Accept		json
// @Produce		json
// @Param       Authorization   header      string                    			true 	"token"
// @Param       _				query		form_view.GetExploreJobStatusReq	true	"查询参数"
// @Success		200				{array}	form_view.ExploreJobStatusResp		"成功响应参数"
// @Failure		400				{object}	rest.HttpError						"失败响应参数"
// @Router		/form-view/explore-conf/status [get]
func (f *FormViewService) GetExploreJobStatus(c *gin.Context) {
	req := form_validator.Valid[form_view.GetExploreJobStatusReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetExploreJobStatus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetExploreReport 探查报告查询
// @Description	探查报告查询
// @Tags		open数据探查
// @Summary		探查报告查询
// @Accept		json
// @Produce		json
// @Param       Authorization   header      string                    			true 	"token"
// @Param       _     query    form_view.GetExploreReportReq true "查询参数"
// @Success		200				{object}	form_view.ExploreReportResp		"成功响应参数"
// @Failure		400				{object}	rest.HttpError						"失败响应参数"
// @Failure		404				{object}	rest.HttpError						"失败响应参数"
// @Router		/form-view/explore-report [get]
func (f *FormViewService) GetExploreReport(c *gin.Context) {
	req := form_validator.Valid[form_view.GetExploreReportReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetExploreReport)
	if err != nil {
		errorCode := agerrors.Code(err).GetErrorCode()
		if errorCode == my_errorcode.FormViewIdNotExist || errorCode == my_errorcode.DataExploreReportGetErr {
			ginx.ResErrJsonWithCode(c, 404, err)
			return
		}
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetDatasourceOverview 获取数据源概览
// @Description	获取数据源概览
// @Tags		数据探查
// @Summary		获取数据源概览
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param		type			query		form_view.GetDatasourceOverviewReq	true 	"请求参数"
// @Success		200				{object}	form_view.DatasourceOverviewResp          	"成功响应参数"
// @Failure		400				{object}	rest.HttpError			            		"失败响应参数"
// @Router		/overview [get]
func (f *FormViewService) GetDatasourceOverview(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDatasourceOverviewReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDatasourceOverview)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetExploreConfig 获取探查配置
//
//	@Description	获取探查配置
//	@Tags			数据探查
//	@Summary		获取探查配置
//	@Accept			json
//	@Produce		json
//	@Param			Authorization	header		string							true	"token"
//	@Param			query			query		form_view.GetExploreConfigReq	true 	"请求参数"
//	@Success		200				{object}	form_view.ExploreConfigResp       		"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			            	"失败响应参数"
//	@Router			/explore-conf [get]
func (f *FormViewService) GetExploreConfig(c *gin.Context) {
	req := form_validator.Valid[form_view.GetExploreConfigReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetExploreConfig)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetFieldExploreReport 字段探查结果查询
// @Description	字段探查结果查询
// @Tags		open数据探查
// @Summary		字段探查结果查询
// @Accept		json
// @Produce		json
// @Param       Authorization   header      string                    			true 	"token"
// @Param       _     query    form_view.GetFieldExploreReportReq true "查询参数"
// @Success		200				{object}	form_view.FieldExploreReportResp		"成功响应参数"
// @Failure		400				{object}	rest.HttpError						"失败响应参数"
// @Router		/form-view/explore-report/field [get]
func (f *FormViewService) GetFieldExploreReport(c *gin.Context) {
	req := form_validator.Valid[form_view.GetFieldExploreReportReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetFieldExploreReport)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetFilterRule 获取逻辑视图过滤规则
// @Description	获取逻辑视图过滤规则
// @Tags		数据过滤规则
// @Summary		获取逻辑视图过滤规则
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param       id path string true "视图ID"
// @Success		200				{object}	form_view.GetFilterRuleResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/{id}/filter-rule [get]
func (f *FormViewService) GetFilterRule(c *gin.Context) {
	req := form_validator.Valid[form_view.GetFilterRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetFilterRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateFilterRule 更新逻辑视图过滤规则
// @Description	更新逻辑视图过滤规则
// @Tags		数据过滤规则
// @Summary		更新逻辑视图过滤规则
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param       id path string true "视图ID"
// @Param		_				body		form_view.UpdateFilterRuleReqParamBody	true	"请求参数"
// @Success		200				{object}	form_view.UpdateFilterRuleResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/{id}/filter-rule [put]
func (f *FormViewService) UpdateFilterRule(c *gin.Context) {
	req := form_validator.Valid[form_view.UpdateFilterRuleReq](c)
	if req == nil {
		return
	}

	err := util.TraceA1R1(c, req, f.uc.UpdateFilterRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}

// DeleteFilterRule 删除逻辑视图过滤规则
// @Description	删除逻辑视图过滤规则
// @Tags		数据过滤规则
// @Summary		删除逻辑视图过滤规则
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param       id path string true "视图ID"
// @Success		200				{object}	form_view.DeleteFilterRuleResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/{id}/filter-rule [delete]
func (f *FormViewService) DeleteFilterRule(c *gin.Context) {
	req := form_validator.Valid[form_view.DeleteFilterRuleReq](c)
	if req == nil {
		return
	}

	err := util.TraceA1R1(c, req, f.uc.DeleteFilterRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, true)
}

// ExecFilterRule 预览过滤规则执行结果
// @Description	预览过滤规则执行结果
// @Tags		数据过滤规则
// @Summary		预览过滤规则执行结果
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param       id path string true "视图ID"
// @Param		_				body		form_view.ExecFilterRuleReqParamBody	true	"请求参数"
// @Success		200				{object}	form_view.ExecFilterRuleResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/{id}/filter-rule/test [post]
func (f *FormViewService) ExecFilterRule(c *gin.Context) {
	req := form_validator.Valid[form_view.ExecFilterRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.ExecFilterRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CreateCompletion 逻辑视图补全
// @Description	逻辑视图补全
// @Tags		逻辑视图补全
// @Summary		逻辑视图补全
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param       id path string true "视图ID"
// @Param		_				body		form_view.CreateCompletionReqParamBody	true	"请求参数"
// @Success		201				{object}	form_view.CreateCompletionResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/{id}/completion/task [post]
func (f *FormViewService) CreateCompletion(c *gin.Context) {
	req := form_validator.Valid[form_view.CreateCompletionReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.CreateCompletion)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	c.JSON(201, res)
}

// GetCompletion 获取逻辑视图补全结果
// @Description	获取逻辑视图补全结果
// @Tags		逻辑视图补全
// @Summary		获取逻辑视图补全结果
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param       id path string true "视图ID"
// @Success		200				{object}	form_view.GetCompletionResp          "成功响应参数"
// @Success		202				{object}	form_view.GetCompletionResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Failure		404				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/{id}/completion [get]
func (f *FormViewService) GetCompletion(c *gin.Context) {
	req := form_validator.Valid[form_view.GetCompletionReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.GetCompletion)
	if err != nil {
		errorCode := agerrors.Code(err).GetErrorCode()
		if errorCode == my_errorcode.FormViewIdNotExist || errorCode == my_errorcode.CompletionNotFound {
			ginx.ResErrJsonWithCode(c, 404, err)
			return
		}
		ginx.ResBadRequestJson(c, err)
		return
	}
	if res.Result == nil {
		c.JSON(202, res)
	} else {
		ginx.ResOKJson(c, res)
	}
}

// UpdateCompletion 更新逻辑视图补全结果
// @Description	更新逻辑视图补全结果
// @Tags		逻辑视图补全
// @Summary		更新逻辑视图补全结果
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param       id path string true "视图ID"
// @Param		_				body		form_view.UpdateCompletionReqParamBody	true	"请求参数"
// @Success		200				{object}	form_view.UpdateCompletionResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/{id}/completion [put]
func (f *FormViewService) UpdateCompletion(c *gin.Context) {
	req := form_validator.Valid[form_view.UpdateCompletionReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.UpdateCompletion)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetBusinessUpdateTime 查看逻辑视图业务更新时间
//
// @Description 查看逻辑视图业务更新时间
// @Tags        open逻辑视图
// @Summary     查看逻辑视图业务更新时间
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       id          path  string true "视图ID"
// @Success     200         {object} form_view.GetBusinessUpdateTimeResp "成功响应参数"
// @Failure     400         {object} rest.HttpError "失败响应参数"
// @Router      /form-view/{id}/business-update-time [get]
func (f *FormViewService) GetBusinessUpdateTime(c *gin.Context) {
	req := form_validator.Valid[form_view.GetBusinessUpdateTimeReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetBusinessUpdateTime)
	if err != nil {
		errorCode := agerrors.Code(err).GetErrorCode()
		if errorCode == my_errorcode.FormViewIdNotExist || errorCode == my_errorcode.BusinessTimestampNotFound {
			ginx.ResErrJsonWithCode(c, 404, err)
			return
		}
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ConvertRulesVerify 转换规则校验
//
// @Description 转换规则校验
// @Tags        元数据视图
// @Summary     转换规则校验
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       _           body  form_view.ConvertRulesVerifyReq true "请求参数"
// @Success     200         {object} form_view.ConvertRulesVerifyResp "成功响应参数"
// @Failure     400         {object} rest.HttpError "失败响应参数"
// @Router      /form-view/convert-rule/verify [post]
func (f *FormViewService) ConvertRulesVerify(c *gin.Context) {
	req := form_validator.Valid[form_view.ConvertRulesVerifyReq](c)
	if req == nil {
		return
	}
	//if req.DataLength < req.DataAccuracy {
	//	ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, "data_length must greater than data_accuracy"))
	//	return
	//}

	res, err := util.TraceA1R2(c, req, f.uc.ConvertRulesVerify)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DataTypeMapping 数据类型映射
//
// @Description 数据类型映射
// @Tags 逻辑视图
// @Summary 数据类型映射
// @Accept json
// @Produce json
// @Param Authorization header string true "token"
// @Success 200 {object} form_view.DataTypeMapping "成功响应参数"
// @Failure 400 {object} rest.HttpError "失败响应参数"
// @Router /form-view/data-type/mapping [get]
func (f *FormViewService) DataTypeMapping(c *gin.Context) {
	ginx.ResOKJson(c, constant.SimpleTypeMapping)
}

// CreateExcelView 创建excel元数据视图
// @Description	创建excel元数据视图
// @Tags		元数据视图
// @Summary		创建excel元数据视图
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string true	"token"
// @Param		_				body		form_view.CreateExcelViewReq	true	"请求参数"
// @Success		200	{object}	response.BoolResp "成功响应参数"
// @Failure		400	 {object}	rest.HttpError "失败响应参数"
// @Router		/form-view/excel-view [post]
func (f *FormViewService) CreateExcelView(c *gin.Context) {
	req := form_validator.Valid[form_view.CreateExcelViewReq](c)
	if req == nil {
		return
	}

	res, err := f.uc.CreateExcelView(c, req) // 已记录业务审计日志
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateExcelView 编辑excel元数据视图
// @Description	编辑excel元数据视图
// @Tags		元数据视图
// @Summary		编辑excel元数据视图
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string true	"token"
// @Param		_				body		form_view.UpdateExcelViewReq	true	"请求参数"
// @Success		200	{object}	response.BoolResp "成功响应参数"
// @Failure		400	 {object}	rest.HttpError "失败响应参数"
// @Router		/form-view/excel-view [put]
func (f *FormViewService) UpdateExcelView(c *gin.Context) {
	req := form_validator.Valid[form_view.UpdateExcelViewReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateExcelView)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetWhiteListPolicyList 获取白名单策略列表
//
// @Description 获取白名单策略列表
// @Tags        元数据视图
// @Summary     获取白名单策略列表
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetWhiteListPolicyListRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /datasource [get]
func (f *FormViewService) GetWhiteListPolicyList(c *gin.Context) {
	req := form_validator.Valid[form_view.GetWhiteListPolicyListReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetWhiteListPolicyList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetWhiteListPolicyDetails 获取白名单策略详情
//
// @Description 获取白名单策略详情
// @Tags        元数据视图
// @Summary     获取白名单策略详情
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetWhiteListPolicyListRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /datasource [get]
func (f *FormViewService) GetWhiteListPolicyDetails(c *gin.Context) {
	req := form_validator.Valid[form_view.GetWhiteListPolicyDetailsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetWhiteListPolicyDetails)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CreateWhiteListPolicy 创建白名单策略
//
// @Description 创建白名单策略
// @Tags        白名单策略
// @Summary     创建白名单策略
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetWhiteListPolicyListRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /white-list-policy [post]
func (f *FormViewService) CreateWhiteListPolicy(c *gin.Context) {
	req := form_validator.Valid[form_view.CreateWhiteListPolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.CreateWhiteListPolicy)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateWhiteListPolicy 更新白名单策略
//
// @Description 更新白名单策略
// @Tags        白名单策略
// @Summary     更新白名单策略
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetWhiteListPolicyListRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /white-list-policy [put]
func (f *FormViewService) UpdateWhiteListPolicy(c *gin.Context) {
	req := form_validator.Valid[form_view.UpdateWhiteListPolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateWhiteListPolicy)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteWhiteListPolicy 删除白名单策略
//
// @Description 删除白名单策略
// @Tags        白名单策略
// @Summary     删除白名单策略
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetWhiteListPolicyListRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /white-list-policy [delete]
func (f *FormViewService) DeleteWhiteListPolicy(c *gin.Context) {
	req := form_validator.Valid[form_view.DeleteWhiteListPolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.DeleteWhiteListPolicy)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ExecuteWhiteListPolicy 执行白名单策略
//
// @Description 执行白名单策略
// @Tags        白名单策略
// @Summary     执行白名单策略
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.ExecuteWhiteListPolicyRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /white-list-policy [post]
func (f *FormViewService) ExecuteWhiteListPolicy(c *gin.Context) {
	req := form_validator.Valid[form_view.ExecuteWhiteListPolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.ExecuteWhiteListPolicy)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetWhiteListPolicyWhereSql 获取指定逻辑视图白名单策略条件sql
//
// @Description 获取指定逻辑视图白名单策略条件sql
// @Tags        白名单策略
// @Summary     获取白名单策略条件sql
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetWhiteListPolicyWhereSqlRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /white-list-policy [post]
func (f *FormViewService) GetWhiteListPolicyWhereSql(c *gin.Context) {
	req := form_validator.Valid[form_view.GetWhiteListPolicyWhereSqlReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetWhiteListPolicyWhereSql)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetDesensitizationFieldInfos 获取指定逻辑视图脱敏字段信息
//
// @Description 获取指定逻辑视图脱敏字段信息
// @Tags        白名单策略
// @Summary     获取白名单策略条件sql
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetWhiteListPolicyWhereSqlRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /white-list-policy [post]
func (f *FormViewService) GetDesensitizationFieldInfos(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDesensitizationFieldInfosReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDesensitizationFieldInfos)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetFormViewRelateWhiteListPolicy 获取逻辑视图相关白名单策略
//
// @Description 获取逻辑视图相关白名单策略
// @Tags        白名单策略
// @Summary     获取逻辑视图相关白名单策略
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetFormViewRelateWhiteListPolicyRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /white-list-policy [post]
func (f *FormViewService) GetFormViewRelateWhiteListPolicy(c *gin.Context) {
	req := form_validator.Valid[form_view.GetFormViewRelateWhiteListPolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetFormViewRelateWhiteListPolicy)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetDesensitizationRuleList 获取脱敏算法规则列表
//
// @Description 获取脱敏算法规则列表
// @Tags        元数据视图
// @Summary     获取脱敏算法规则列表
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetDesensitizationRuleListRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [get]
func (f *FormViewService) GetDesensitizationRuleList(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDesensitizationRuleListReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDesensitizationRuleList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetDesensitizationRuleByIds 获取脱敏算法规则详情
//
// @Description 获取脱敏算法规则详情
// @Tags        元数据视图
// @Summary     获取脱敏算法规则详情
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetDesensitizationRuleByIdsRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) GetDesensitizationRuleByIds(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDesensitizationRuleByIdsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDesensitizationRuleByIds)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// @Description 获取脱敏算法规则详情
// @Tags        元数据视图
// @Summary     获取脱敏算法规则详情
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetDesensitizationRuleDetailsRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [get]
func (f *FormViewService) GetDesensitizationRuleDetails(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDesensitizationRuleDetailsReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDesensitizationRuleDetails)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// CreateDesensitizationRule 创建脱敏算法规则
//
// @Description 创建脱敏算法规则
// @Tags        元数据视图
// @Summary     创建脱敏算法规则
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.CreateDesensitizationRuleRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) CreateDesensitizationRule(c *gin.Context) {
	req := form_validator.Valid[form_view.CreateDesensitizationRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.CreateDesensitizationRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// UpdateDesensitizationRule 更新脱敏算法规则
//
// @Description 更新脱敏算法规则
// @Tags        元数据视图
// @Summary     更新脱敏算法规则
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.UpdateDesensitizationRuleRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) UpdateDesensitizationRule(c *gin.Context) {
	req := form_validator.Valid[form_view.UpdateDesensitizationRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.UpdateDesensitizationRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// DeleteDesensitizationRule 更新脱敏算法规则
//
// @Description 删除脱敏算法规则
// @Tags        元数据视图
// @Summary     删除脱敏算法规则
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.DeleteDesensitizationRuleRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) DeleteDesensitizationRule(c *gin.Context) {
	req := form_validator.Valid[form_view.DeleteDesensitizationRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.DeleteDesensitizationRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ExecuteDesensitizationRule 执行脱敏算法规则
//
// @Description 执行脱敏算法规则
// @Tags        元数据视图
// @Summary     执行脱敏算法规则
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.ExecuteDesensitizationRuleRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) ExecuteDesensitizationRule(c *gin.Context) {
	req := form_validator.Valid[form_view.ExecuteDesensitizationRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.ExecuteDesensitizationRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// ExportDesensitizationRule 导出脱敏算法规则
//
// @Description 导出脱敏算法规则
// @Tags        脱敏算法
// @Summary     导出脱敏算法规则
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.ExportDesensitizationRuleRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) ExportDesensitizationRule(c *gin.Context) {
	req := form_validator.Valid[form_view.ExportDesensitizationRuleReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.ExportDesensitizationRule)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	file := excelize.NewFile()
	now := time.Now()
	// 定义日期格式
	dateFormat := "2000-01-01"
	// 格式化时间为字符串
	dateStr := now.Format(dateFormat)
	fileName := fmt.Sprintf("desensitization_Rule_%s.xlsx", dateStr)
	sheetName := "Sheet1"

	headers := []string{"规则名称", "描述", "算法规则", "脱敏方式"}
	for colIndex, header := range headers {
		cell, err := excelize.CoordinatesToCellName(colIndex+1, 1)
		if err != nil {
			//http.Error(c.Writer, fmt.Sprintf("坐标转换出错: %v", err), http.StatusInternalServerError)
			ginx.ResBadRequestJson(c, err)
			return
		}
		err = file.SetCellValue(sheetName, cell, header)
		if err != nil {
			//http.Error(c.Writer, fmt.Sprintf("坐标转换出错: %v", err), http.StatusInternalServerError)
			ginx.ResBadRequestJson(c, err)
			return
		}
	}

	for rowIndex, data := range res.Entities {
		values := []interface{}{data.Name, data.Description, data.Algorithm, data.Method}
		for colIndex, value := range values {
			cell, err := excelize.CoordinatesToCellName(colIndex+1, rowIndex+2)
			if err != nil {
				http.Error(c.Writer, fmt.Sprintf("坐标转换出错: %v", err), http.StatusInternalServerError)
				ginx.ResBadRequestJson(c, err)
				return
			}
			err = file.SetCellValue(sheetName, cell, value)
		}
	}

	Write(c, fileName, file)

	//ginx.ResOKJson(c, res)
}

func Write(ctx *gin.Context, fileName string, file *excelize.File) {
	ctx.Writer.Header().Set("Content-Type", "application/octet-stream")
	fileName = url.QueryEscape(fileName)
	disposition := fmt.Sprintf("attachment; filename*=utf-8''%s", fileName)
	ctx.Writer.Header().Set("Content-disposition", disposition)
	ctx.Writer.Header().Set("Content-Transfer-Encoding", "binary")
	_ = file.Write(ctx.Writer)

}

// GetDesensitizationRuleRelatePolicy 获取脱敏算法规则相关隐私策略
//
// @Description 获取脱敏算法规则相关隐私策略
// @Tags        脱敏算法
// @Summary     获取脱敏算法规则相关隐私策略
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetDesensitizationRuleRelatePolicyRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) GetDesensitizationRuleRelatePolicy(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDesensitizationRuleRelatePolicyReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDesensitizationRuleRelatePolicy)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetDesensitizationRuleInternalAlgorithm 获取脱敏算法规则内置算法
//
// @Description 获取脱敏算法规则内置算法
// @Tags        脱敏算法
// @Summary     获取脱敏算法规则内置算法
// @Accept      json
// @Produce     json
// @Param       Authorization header string true "token"
// @Param       type        query  string false "类型"
// @Success     200         {object} form_view.GetDesensitizationRuleInternalAlgorithmRes "成功响应参数"
// @Failure     400         {object} rest.HttpError               "失败响应参数"
// @Router      /desensitization-rule [post]
func (f *FormViewService) GetDesensitizationRuleInternalAlgorithm(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDesensitizationRuleInternalAlgorithmReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.GetDesensitizationRuleInternalAlgorithm)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetByAuditStatus 根据稽核状态获取逻辑视图列表
//
//	@Description	根据稽核状态获取逻辑视图列表,可使用数据源类型或数据源ID筛选
//	@Tags			逻辑视图
//	@Summary		根据稽核状态获取逻辑视图列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			_			query		form_view.GetByAuditStatusReq	true	"查询参数"
//	@Success		200				{object}	form_view.GetByAuditStatusResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view/by-audit-status [get]
func (f *FormViewService) GetByAuditStatus(c *gin.Context) {
	req := form_validator.Valid[form_view.GetByAuditStatusReq](c)
	if req == nil {
		return
	}
	if req.DatasourceType != "" && req.DatasourceId != "" {
		ginx.ResBadRequestJson(c, errorcode.Desc(my_errorcode.DataSourceIDAndDataSourceTypeExclude))
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetByAuditStatus)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetBasicViewList 根据ID批量查询逻辑视图基本信息
//
//	@Description	根据ID批量查询逻辑视图基本信息
//	@Tags			逻辑视图
//	@Summary		根据ID批量查询逻辑视图基本信息
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			_			query		form_view.GetBasicViewListReqParam	true	"查询参数"
//	@Success		200				{object}	form_view.GetBasicViewListResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view/basic [get]
func (f *FormViewService) GetBasicViewList(c *gin.Context) {
	req := form_validator.Valid[form_view.GetBasicViewListReqParam](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.GetBasicViewList)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// IsAllowClearGrade 是否允许清除分级标签
//
//	@Description	是否允许清除分级标签
//	@Tags			逻辑视图
//	@Summary		是否允许清除分级标签
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			_			query		form_view.IsAllowClearGradeReq	true	"查询参数"
//	@Success		200				{object}	form_view.IsAllowClearGradeResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view/is-allow-clear-grade [post]
func (f *FormViewService) IsAllowClearGrade(c *gin.Context) {
	req := form_validator.Valid[form_view.IsAllowClearGradeReq](c)
	if req == nil {
		return
	}

	res, err := util.TraceA1R2(c, req, f.uc.IsAllowClearGrade)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// QueryStreamStart 流式查询开始
//
//	@Description	流式查询开始
//	@Tags			流式查询
//	@Summary		流式查询开始
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			_			query		form_view.QueryStreamStartReq	true	"查询参数"
//	@Success		200				{object}	form_view.QueryStreamStartResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view/query-stream-start [post]
func (f *FormViewService) QueryStreamStart(c *gin.Context) {
	req := form_validator.Valid[form_view.QueryStreamStartReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.QueryStreamStart)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// QueryStreamNext 流式查询下一页
//
//	@Description	流式查询下一页
//	@Tags			流式查询
//	@Summary		流式查询下一页
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			_			query		form_view.QueryStreamNextReq	true	"查询参数"
//	@Success		200				{object}	form_view.QueryStreamNextResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view/query-stream-next [post]
func (f *FormViewService) QueryStreamNext(c *gin.Context) {
	req := form_validator.Valid[form_view.QueryStreamNextReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.QueryStreamNext)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetViewByTechnicalNameAndHuaAoId 通过技术名称和华奥ID查询视图
//
//	@Description	通过技术名称和华奥ID查询视图
//	@Tags			逻辑视图
//	@Summary		通过技术名称和华奥ID查询视图
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			_			query		form_view.GetViewByTechnicalNameAndHuaAoIdReqParam	true	"查询参数"
//	@Success		200				{object}	form_view.GetViewFieldsResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/form-view/by-technical-name-and-hua-ao-id [get]
func (f *FormViewService) GetViewByTechnicalNameAndHuaAoId(c *gin.Context) {
	req := form_validator.Valid[form_view.GetViewByTechnicalNameAndHuaAoIdReqParam](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.GetViewByTechnicalNameAndHuaAoId)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetOverview 获取单个部门视图概览
// @Description	获取单个部门视图概览
// @Tags		数据探查
// @Summary		获取单个部门视图概览
// @Accept		json
// @Produce		json
// @Param       _				query		form_view.GetOverviewReq	true	"查询参数"
// @Success		200				{object}	form_view.GetOverviewResp		"成功响应参数"
// @Failure		400				{object}	rest.HttpError						"失败响应参数"
// @Router		/department/overview [get]
func (f *FormViewService) GetOverview(c *gin.Context) {
	req := form_validator.Valid[form_view.GetOverviewReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetOverview)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetExploreReports 单个部门探查报告列表查询
// @Description	单个部门探查报告列表查询
// @Tags		数据探查
// @Summary		单个部门探查报告列表查询
// @Accept		json
// @Produce		json
// @Param       _     query    form_view.GetExploreReportsReq true "查询参数"
// @Success		200				{object}	form_view.GetExploreReportsResp		"成功响应参数"
// @Failure		400				{object}	rest.HttpError						"失败响应参数"
// @Failure		404				{object}	rest.HttpError						"失败响应参数"
// @Router		/department/explore-reports [get]
func (f *FormViewService) GetExploreReports(c *gin.Context) {
	req := form_validator.Valid[form_view.GetExploreReportsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetExploreReports)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ExportExploreReports 单个部门导出探查报告
// @Description	单个部门导出探查报告
// @Tags		数据探查
// @Summary		单个部门导出探查报告
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param		_				body		form_view.ExportExploreReportsReqBody	true	"请求参数"
// @Success		200				{object}	string "二进制数据"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/department/explore-reports/export [post]
func (f *FormViewService) ExportExploreReports(c *gin.Context) {
	req := form_validator.Valid[form_view.ExportExploreReportsReq](c)
	if req == nil {
		return
	}
	resp, err := util.TraceA1R2(c, req, f.uc.ExportExploreReports)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	c.Writer.Header().Set("Content-Type", "application/pdf")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename*=utf-8''%s", url.PathEscape(resp.FileName)))
	c.Writer.Header().Set("Content-Length", fmt.Sprintf("%d", resp.Buffer.Len()))
	_, err = c.Writer.Write(resp.Buffer.Bytes())
	if err != nil {
		http.Error(c.Writer, "写入响应失败: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// GetDepartmentExploreReports 所有部门探查报告列表查询
// @Description	所有部门探查报告列表查询
// @Tags		数据探查
// @Summary		所有部门探查报告列表查询
// @Accept		json
// @Produce		json
// @Param       _     query    form_view.GetDepartmentExploreReportsReqParam true "查询参数"
// @Success		200				{object}	form_view.GetDepartmentExploreReportsResp		"成功响应参数"
// @Failure		400				{object}	rest.HttpError						"失败响应参数"
// @Failure		404				{object}	rest.HttpError						"失败响应参数"
// @Router		/form-view/explore-reports [get]
func (f *FormViewService) GetDepartmentExploreReports(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDepartmentExploreReportsReq](c)
	if req == nil {
		return
	}

	resp, err := util.TraceA1R2(c, req, f.uc.GetDepartmentExploreReports)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (f *FormViewService) CreateExploreReports(c *gin.Context) {
	go f.uc.CreateExploreReports()
	ginx.ResOKJson(c, nil)
}
