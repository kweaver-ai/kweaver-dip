package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
	entity "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/controller/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

type Controller struct {
	dc                  *data_catalog.DataCatalogDomain
	cc                  data_comprehension.ComprehensionDomain
	dataResourceCatalog data_resource_catalog.DataResourceCatalogDomain
}

func NewController(dc *data_catalog.DataCatalogDomain,
	cc data_comprehension.ComprehensionDomain,
	dataResourceCatalog data_resource_catalog.DataResourceCatalogDomain,
) *Controller {
	ctl := &Controller{dc: dc,
		cc:                  cc,
		dataResourceCatalog: dataResourceCatalog,
	}
	// 启动MQ ES索引创建/更新/删除消息发送结果监听
	go dc.ListenProducerResult()
	return ctl
}

// SaveDataCatalogDraft 暂存数据资源目录
//
//	@Description	暂存数据资源目录(包括 创建暂存 和 已创建暂存) 已创建暂存且发布过则生成可变更草稿
//	@Tags			数据资源目录管理
//	@Summary		暂存数据资源目录
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string												true	"token"
//	@Param			_				body		data_resource_catalog.SaveDataCatalogDraftReqBody	true	"请求参数"
//	@Success		200				{object}	response.NameIDResp2								"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog [post]
func (controller *Controller) SaveDataCatalogDraft(c *gin.Context) {
	var req data_resource_catalog.SaveDataCatalogDraftReqBody
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in create catalog, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.SaveDataCatalogDraft(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// SaveDataCatalog 保存数据资源目录
//
//	@Description	保存数据资源目录(包括 创建保存 已创建保存 变更保存)
//	@Tags			数据资源目录管理
//	@Summary		保存数据资源目录
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string								true	"token"
//	@Param			_				body		data_resource_catalog.SaveDataCatalogReqBody	true	"请求参数"
//	@Success		200				{object}	response.NameIDResp2				"成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog [put]
func (controller *Controller) SaveDataCatalog(c *gin.Context) {
	var req data_resource_catalog.SaveDataCatalogReqBody
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param in update catalog, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	for _, resource := range req.MountResources {
		if resource.ResourceType == constant.MountView {
			if len(req.Columns) == 0 {
				ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, "columns array must be one"))
				return
			}
			for _, column := range req.Columns {
				if column.SourceID == "" {
					ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, "MountView source_id cannot null"))
					return
				}
			}
		}
	}

	resp, err := controller.dataResourceCatalog.SaveDataCatalog(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// ImportDataCatalog 导入暂存数据资源目录
//
//	@Description	导入暂存数据资源目录
//	@Tags			数据资源目录管理
//	@Summary		导入暂存数据资源目录
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_				body		data_resource_catalog.SaveDataCatalogDraftReqBody	true	"请求参数"
//	@Success		200				{object}	response.NameIDResp2								"成功响应参数"
//	@Failure		400				{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/import [post]
func (controller *Controller) ImportDataCatalog(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.ImportFileNotExist))
		return
	}
	headers := form.File["file"]
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FormOneMax))
		return
	}

	/*	split := strings.Split(fileHeader.Filename, ".")
		fileType := split[len(split)-1]*/

	resp, err := controller.dataResourceCatalog.ImportDataCatalog(c, headers[0])
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetDataCatalogList 查询数据资源目录列表
//
//	@Description	查询数据资源目录列表
//	@Tags			数据资源目录管理
//	@Summary		查询数据资源目录列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string													true	"token"
//	@Param			_				query		data_resource_catalog.GetDataCatalogList				true	"查询参数"
//	@Success		200				{object}	response.PageResult[data_resource_catalog.DataCatalog]	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError											"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/normal [get]
func (controller *Controller) GetDataCatalogList(c *gin.Context) {
	var req data_resource_catalog.GetDataCatalogList
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get catalog list, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if *req.Limit == 0 {
		req.Offset = lo.ToPtr(1)
	}
	if req.UpdatedAtStart != 0 && req.UpdatedAtEnd != 0 && req.UpdatedAtStart > req.UpdatedAtEnd {
		ginx.ResBadRequestJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, "开始时间必须小于结束时间"))
		return
	}

	res, err := controller.dataResourceCatalog.GetDataCatalogList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	//如果是数据资源理解的内容，加上相应的属性
	if req.ComprehensionStatus != "" && len(res.Entries) > 0 {
		catalogIds := make([]uint64, 0)
		for _, d := range res.Entries {
			modelID := models.ModelID(d.ID)
			catalogIds = append(catalogIds, modelID.Uint64())
		}
		comprehensionInfoMap, err := controller.cc.GetCatalogListInfo(c, catalogIds)
		if err != nil {
			c.Writer.WriteHeader(http.StatusBadRequest)
			ginx.ResErrJson(c, err)
			return
		}
		for _, d := range res.Entries {
			key := models.ModelID(d.ID)
			comprehensionInfo := comprehensionInfoMap[(&key).Uint64()]
			copier.Copy(&d.Comprehension, &comprehensionInfo)

			if comprehensionInfo.Status == data_comprehension.Comprehended {
				d.Comprehension.HasChange = lo.Contains([]int8{data_comprehension.TaskChange, data_comprehension.AllChange}, comprehensionInfo.Mark)
				//d.Comprehension.HasChange = lo.IfF(len(req.TaskId) > 0, func() bool {
				//	return lo.Contains([]int8{data_comprehension.ModelChange, data_comprehension.AllChange}, comprehensionInfo.Mark)
				//}).ElseF(func() bool {
				//	return lo.Contains([]int8{data_comprehension.TaskChange, data_comprehension.AllChange}, comprehensionInfo.Mark)
				//})
			}
		}
	}
	ginx.ResOKJson(c, res)
}

/*// GetDataCatalogBriefList 查询数据资源目录简单信息
// @Description 查询数据资源目录简单信息
// @Tags        数据资源目录管理
// @Summary     查询数据资源目录简单信息
// @Accept		application/json
// @Produce		application/json
// @Param       Authorization header   string                    true "token"
// @Param       _     query    data_catalog.ReqFormParams true "查询参数"
// @Success     200   {object} response.PageResult[data_catalog.CatalogListItem]    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/data-catalog/brief [get]
func (controller *Controller) GetDataCatalogBriefList(c *gin.Context) {
	req := new(data_catalog.CatalogBriefInfoReq)
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	datas, err := controller.dc.GetBriefList(c, req.CatalogIds, req.IsComprehension)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}*/

// GetDataCatalogDetail 查询数据资源目录详情
//
//	@Description	查询数据资源目录详情
//	@Tags			数据资源目录管理
//	@Summary		查询数据资源目录详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string									true	"token"
//	@Param			catalog_id		path		uint64									true	"目录ID"	default(1)
//	@Success		200				{object}	data_resource_catalog.CatalogDetailRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError							"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/{catalog_id} [get]
func (controller *Controller) GetDataCatalogDetail(c *gin.Context) {
	var p data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog detail, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := controller.dataResourceCatalog.GetDataCatalogDetail(c, p.CatalogID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// CheckDataCatalogNameRepeat 数据资源目录名称冲突检查
//
//	@Description	数据资源目录名称冲突检查
//	@Tags			数据资源目录管理
//	@Summary		数据资源目录名称冲突检查
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string						true	"token"
//	@Param			_				query		entity.VerifyNameRepeatReq	true	"查询参数"
//	@Success		200				{object}	response.CheckRepeatResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/check [get]
func (controller *Controller) CheckDataCatalogNameRepeat(c *gin.Context) {
	var req entity.VerifyNameRepeatReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in check catalog name repeat, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	repeat, err := controller.dataResourceCatalog.CheckRepeat(c, req.Id, req.Name)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.CheckRepeatResp{Name: req.Name, Repeat: repeat})
}

// DeleteDataCatalog 删除数据资源目录（逻辑删除）
//
//	@Description	删除数据资源目录（逻辑删除）
//	@Tags			数据资源目录管理
//	@Summary		删除数据资源目录（逻辑删除）
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string			true	"token"
//	@Param			catalog_id		path		string			true	"目录ID"	default(1)
//	@Success		200				{object}	response.IDRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/{catalog_id} [delete]
func (controller *Controller) DeleteDataCatalog(c *gin.Context) {
	var p data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in delete catalog, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := controller.dataResourceCatalog.DeleteDataCatalog(c, p.CatalogID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{ID: p.CatalogID.String()})
}

/*
// CheckResourceMount 资源是否已挂接目录检查
// @Description 资源是否已挂接目录检查
// @Tags        数据资源目录管理
// @Summary     资源是否已挂接目录检查
// @Accept		application/json
// @Produce		application/json
// @Param       Authorization     header   string              true "token"
// @Param       _         query    data_catalog.VerifyResourceMountReq true "查询参数"
// @Success     200       {object} data_catalog.VerifyResourceMountResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/data-catalog/resource/check [get]
func (controller *Controller) CheckResourceMount(c *gin.Context) {
	var req data_catalog.VerifyResourceMountReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in check resource mount, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	data, err := controller.dc.CheckResourceMount(c, &req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}
*/

// GetDataCatalogColumnList 查询数据目录信息项列表
//
//	@Description	查询数据目录信息项列表
//	@Tags			open数据资源目录管理
//	@Summary		查询数据目录信息项列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	path		data_resource_catalog.CatalogIDRequired			true	"请求参数"
//	@Param			_	query		data_resource_catalog.CatalogColumnPageInfo		true	"查询参数"
//	@Success		200	{object}	data_resource_catalog.GetDataCatalogColumnsRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/{catalog_id}/column [get]
func (controller *Controller) GetDataCatalogColumnList(c *gin.Context) {
	var p data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog column list, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	var req data_resource_catalog.CatalogColumnPageInfo
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in check catalog name repeat, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	req.ID = p.CatalogID.Uint64()

	res, err := controller.dataResourceCatalog.GetDataCatalogColumns(c, req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

func (controller *Controller) GetDataCatalogColumnByViewID(c *gin.Context) {
	var p data_resource_catalog.IDStrRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog column by viewID, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}
	res, err := controller.dataResourceCatalog.GetDataCatalogColumnsByViewID(c, p.ID)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDataCatalogMountList 查询数据目录信息挂载资源列表
//
//	@Description	查询数据目录信息挂载资源列表
//	@Tags			open数据资源目录管理
//	@Summary		查询数据目录信息挂载资源列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	path		data_resource_catalog.CatalogIDRequired				true	"请求参数"
//	@Success		200	{object}	data_resource_catalog.GetDataCatalogMountListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/{catalog_id}/mount [get]
func (controller *Controller) GetDataCatalogMountList(c *gin.Context) {
	var p data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog column list, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	res, err := controller.dataResourceCatalog.GetDataCatalogMountList(c, p.CatalogID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetResourceCatalogList 查询数据资源的数据目录列表
//
//	@Description	查询数据资源的数据目录列表
//	@Tags			数据资源目录管理
//	@Summary		查询数据资源的数据目录列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	body		data_resource_catalog.GetResourceCatalogListReq				true	"请求参数"
//	@Success		200	{object}	data_resource_catalog.GetResourceCatalogListRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError										"失败响应参数"
//	@Router			/api/data-catalog/v1/data-resources/data-catalog [post]
func (controller *Controller) GetResourceCatalogList(c *gin.Context) {
	var req data_resource_catalog.GetResourceCatalogListReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog column list, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	res, err := controller.dataResourceCatalog.GetResourceCatalogList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDataCatalogRelation 查询数据目录信息相关目录
//
//	@Description	查询数据目录信息相关目录
//	@Tags			open数据资源目录管理
//	@Summary		查询数据目录信息相关目录
//	@Accept			application/json
//	@Produce		application/json
//	@Param			_	path		data_resource_catalog.CatalogIDRequired			true	"请求参数"
//	@Success		200	{object}	data_resource_catalog.GetDataCatalogRelationRes	"成功响应参数"
//	@Failure		400	{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/{catalog_id}/relation [get]
func (controller *Controller) GetDataCatalogRelation(c *gin.Context) {
	var p data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get catalog column list, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	res, err := controller.dataResourceCatalog.GetDataCatalogRelation(c, p.CatalogID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// CreateAuditInstance 创建数据目录审核实例
//
//	@Description	创建数据目录审核实例
//	@Tags			数据资源目录管理
//	@Summary		创建数据目录审核实例
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					true	"token"
//	@Param			catalog_id		path		uint64					true	"目录ID"	default(1)
//	@Param			audit_type		path		string					true	"审核类型 af-data-catalog-publish 发布审核 af-data-catalog-online 上线审核 af-data-catalog-offline 下线审核"
//	@Success		200				{object}	response.NameIDResp2	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError			"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/{catalog_id}/audit-flow/{audit_type}/instance [post]
func (controller *Controller) CreateAuditInstance(c *gin.Context) {
	var req data_resource_catalog.CreateAuditInstanceReq
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in create catalog audit instance, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := controller.dataResourceCatalog.CreateAuditInstance(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{ID: req.CatalogID.String()})
}

// GetOwnerAuditors workflow获取数据owner审核员接口
//
//	@Description	workflow获取数据owner审核员接口
//	@Tags			数据资源目录管理
//	@Summary		workflow获取数据owner审核员接口
//	@Accept			application/json
//	@Produce		application/json
//	@Param			applyID	path		string						true	"审核申请ID"
//	@Success		200		{object}	[]data_catalog.AuditUser	"成功响应参数"
//	@Failure		400		{object}	rest.HttpError				"失败响应参数"
//	@Router			/api/internal/data-catalog/v1/audits/{applyID}/auditors [get]
func (controller *Controller) GetOwnerAuditors(c *gin.Context) {
	var req data_catalog.ReqAuditorsGetParams
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get owner auditors, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get owner auditors, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dc.GetOwnerAuditors(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

/*
// GetDataOwner 获取目录关联数据owner及有效性
//	@Description	获取目录关联数据owner及有效性
//	@Tags			数据资源目录管理
//	@Summary		获取目录关联数据owner及有效性
//  @Accept		    application/json
//  @Produce		application/json
//  @Param          Authorization   header      string                    			true 	"token"
//  @Param          catalogID       path        uint64                              true "目录ID" default(1)
//	@Success		200				{object}	data_catalog.OwnerGetResp		    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError						"失败响应参数"
//	@Router			/api/data-catalog/v1/data-catalog/{catalogID}/owner [get]
func (controller *Controller) GetDataOwner(c *gin.Context) {
	var p data_catalog.ReqPathParams
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get data owner, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dc.GetDataOwner(c, p.CatalogID.Uint64())
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
*/

// PushCatalogToEs 全量推送到es
//
//	@Description	全量推送到es
//	@Tags			数据资源目录管理
//	@Summary		全量推送到es
//	@Accept			application/json
//	@Produce		application/json
//	@Success		200	{boolean}	boolean			"成功响应参数"
//	@Failure		400	{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/internal/data-catalog/v1/data-catalog/push-all-to-es [post]
func (controller *Controller) PushCatalogToEs(c *gin.Context) {
	var req data_resource_catalog.PushCatalogToEsReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	err := controller.dataResourceCatalog.PushCatalogToEs(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, true)
}

func (controller *Controller) GetDataCatalogBriefList(c *gin.Context) {
	req := new(data_resource_catalog.CatalogBriefInfoReq)
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	datas, err := controller.dataResourceCatalog.GetBriefList(c, req.CatalogIds)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, datas)
}

// TotalOverview 概览-总览
// @Description 概览-总览
// @Tags        数据资源目录管理
// @Summary     概览-总览
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.TotalOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.TotalOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/internal/data-catalog/v1/overview/total [post]
func (controller *Controller) TotalOverview(c *gin.Context) {
	var req data_resource_catalog.TotalOverviewReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get owner auditors, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.TotalOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// StatisticsOverview 概览-分类统计
// @Description 概览-分类统计
// @Tags        数据资源目录管理
// @Summary     概览-分类统计
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.StatisticsOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.StatisticsOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/internal/data-catalog/v1/overview/statistics [post]
func (controller *Controller) StatisticsOverview(c *gin.Context) {
	var req data_resource_catalog.StatisticsOverviewReq
	var err error
	if _, err = form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get owner auditors, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.StatisticsOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetColumnListByIds 根据信息项id批量查询数据目录信息项
func (controller *Controller) GetColumnListByIds(c *gin.Context) {
	var req data_resource_catalog.GetColumnListByIdsReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	res, err := controller.dataResourceCatalog.GetColumnListByIds(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDataCatalogTask 查询目录任务信息
// @Description 查询目录任务信息
// @Tags        数据资源目录管理
// @Summary     查询目录任务信息
// @Accept		application/json
// @Produce		application/json
// @Param       _     path    data_resource_catalog.CatalogIDRequired true "查询参数"
// @Success     200   {object} data_resource_catalog.GetDataCatalogTaskResp   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/data-catalog/{CatalogID}/task [post]
func (controller *Controller) GetDataCatalogTask(c *gin.Context) {
	var req data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get data owner, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	res, err := controller.dataResourceCatalog.GetDataCatalogTask(c, req.CatalogID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetSampleData 获取样例数据
// @Description 获取样例数据
// @Tags        数据资源目录管理
// @Summary     获取样例数据
// @Accept		application/json
// @Produce		application/json
// @Param       _     path    data_resource_catalog.CatalogIDRequired true "查询参数"
// @Success     200   {object} data_resource_catalog.GetDataCatalogTaskResp   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/data-catalog/:catalog_id/sample-data [get]
func (controller *Controller) GetSampleData(c *gin.Context) {
	var req data_resource_catalog.CatalogIDRequired
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param in get data owner, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	res, err := controller.dataResourceCatalog.GetSampleData(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DataGetOverview 数据获取概览
// @Description 数据获取概览
// @Tags        数据资源目录管理
// @Summary     数据获取概览
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataGetOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataGetOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-get [post]
func (controller *Controller) DataGetOverview(c *gin.Context) {
	var req data_resource_catalog.DataGetOverviewReq
	var err error
	if _, err = form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get owner auditors, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataGetOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataGetDepartmentDetail 数据获取部门详情
// @Description 数据获取部门详情
// @Tags        数据资源目录管理
// @Summary     数据获取部门详情
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataGetDepartmentDetailReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataGetDepartmentDetailRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-get-department [post]
func (controller *Controller) DataGetDepartmentDetail(c *gin.Context) {
	var req data_resource_catalog.DataGetDepartmentDetailReq
	var err error
	if _, err = form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get owner auditors, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataGetDepartmentDetail(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataGetAggregationOverview 归集任务详情
// @Description 归集任务详情
// @Tags        数据资源目录管理
// @Summary     归集任务详情
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataGetDepartmentDetailReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataGetAggregationOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-get-aggregation [post]
func (controller *Controller) DataGetAggregationOverview(c *gin.Context) {
	var req data_resource_catalog.DataGetDepartmentDetailReq
	var err error
	if _, err = form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in get owner auditors, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataGetAggregationOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataAssetsOverview 数据资产概览统计
// @Description 数据资产概览统计
// @Tags        数据资源目录管理
// @Summary     数据资产概览统计
// @Accept		application/json
// @Produce		application/json
// @Success     200   {object} data_resource_catalog.DataAssetsOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/data-assets/overview [get]
func (controller *Controller) DataAssetsOverview(c *gin.Context) {
	var req data_resource_catalog.DataAssetsOverviewReq
	resp, err := controller.dataResourceCatalog.DataAssetsOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataAssetsDetail 数据资产部门详情统计
// @Description 数据资产部门详情统计
// @Tags        数据资源目录管理
// @Summary     数据资产部门详情统计
// @Accept		application/json
// @Produce		application/json
// @Param       offset     query    int false "页码，默认1"
// @Param       limit      query    int false "每页大小，默认10，limit=0不分页"
// @Param       department_id     query    string false "部门ID"
// @Success     200   {object} data_resource_catalog.DataAssetsDetailRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/data-assets/detail [get]
func (controller *Controller) DataAssetsDetail(c *gin.Context) {
	var req data_resource_catalog.DataAssetsDetailReq
	var err error
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in DataAssetsDetail, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataAssetsDetail(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataUnderstandOverview 数据理解概览
// @Description 数据理解概览
// @Tags        数据理解概览
// @Summary     数据理解概览
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataUnderstandOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataUnderstandOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-understand [get]
func (controller *Controller) DataUnderstandOverview(c *gin.Context) {
	var req data_resource_catalog.DataUnderstandOverviewReq
	var err error
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in DataAssetsDetail, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataUnderstandOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataUnderstandDepartTopOverview 数据理解概览-部门完成率top30
// @Description 数据理解概览-部门完成率top30
// @Tags        数据理解概览
// @Summary     数据理解概览-部门完成率top30
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataUnderstandDepartTopOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataUnderstandDepartTopOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-understand-depart-top [get]
func (controller *Controller) DataUnderstandDepartTopOverview(c *gin.Context) {
	var req data_resource_catalog.DataUnderstandDepartTopOverviewReq
	var err error
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in DataAssetsDetail, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataUnderstandDepartTopOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataUnderstandDomainOverview 数据理解概览-服务领域详情
// @Description 数据理解概览-服务领域详情
// @Tags        数据理解概览
// @Summary     数据理解概览-服务领域详情
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataUnderstandDomainOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataUnderstandDomainOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-understand-domain-detail [get]
func (controller *Controller) DataUnderstandDomainOverview(c *gin.Context) {
	var req data_resource_catalog.DataUnderstandDomainOverviewReq
	var err error
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in DataAssetsDetail, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataUnderstandDomainOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataUnderstandTaskDetailOverview 数据理解概览-理解任务详情
// @Description 数据理解概览-理解任务详情
// @Tags        数据理解概览
// @Summary     数据理解概览-理解任务详情
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataUnderstandTaskDetailOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataUnderstandTaskDetailOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-understand-task-detail [get]
func (controller *Controller) DataUnderstandTaskDetailOverview(c *gin.Context) {
	var req data_resource_catalog.DataUnderstandTaskDetailOverviewReq
	var err error
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in DataAssetsDetail, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataUnderstandTaskDetailOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DataUnderstandDepartDetailOverview 数据理解概览-部门理解目录详情
// @Description 数据理解概览-部门理解目录
// @Tags        数据理解概览
// @Summary     数据理解概览-部门理解目录
// @Accept		application/json
// @Produce		application/json
// @Param       _     query    data_resource_catalog.DataUnderstandDepartDetailOverviewReq true "查询参数"
// @Success     200   {object} data_resource_catalog.DataUnderstandDepartDetailOverviewRes   "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/overview/data-understand-depart-detail [get]
func (controller *Controller) DataUnderstandDepartDetailOverview(c *gin.Context) {
	var req data_resource_catalog.DataUnderstandDepartDetailOverviewReq
	var err error
	if _, err = form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param in DataAssetsDetail, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.dataResourceCatalog.DataUnderstandDepartDetailOverview(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}
