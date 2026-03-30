package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_overview"
	_ "github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type ProcessingOverviewService struct {
	service data_processing_overview.DataProcessingOverview
}

func NewUserService(d data_processing_overview.DataProcessingOverview) *ProcessingOverviewService {
	return &ProcessingOverviewService{
		service: d,
	}
}

// GetOverview  godoc
//
//	@Description	数据处理概览
//	@Tags			数据处理概览
//	@Summary		数据处理概览
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_processing_overview.GetOverviewReq	true	"请求参数"
//	@Success		200				{object}	data_processing_overview.ProcessingGetOverviewRes	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/date_processing/overview  [GET]
func (d *ProcessingOverviewService) GetOverview(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_processing_overview.GetOverviewReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err := d.service.GetOverview(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetResultsTableCatalog  godoc
//
//	@Description	成果表数据资源目录列表
//	@Tags			数据处理概览
//	@Summary		成果表数据资源目录列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_processing_overview.GetCatalogListsReq	true	"请求参数"
//	@Success		200				{object}	data_processing_overview.CatalogListsResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/date_processing/overview/results_table_catalog  [GET]
func (d *ProcessingOverviewService) GetResultsTableCatalog(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_processing_overview.GetCatalogListsReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err := d.service.GetResultsTableCatalog(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetQualityTableDepartment  godoc
//
//	@Description	应检测部门详情
//	@Tags			数据处理概览
//	@Summary		应检测部门详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_processing_overview.GetQualityTableDepartmentReq	true	"请求参数"
//	@Success		200				{object}	data_processing_overview.GetQualityTableDepartmentResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/date_processing/overview/quality_department  [GET]
func (d *ProcessingOverviewService) GetQualityTableDepartment(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_processing_overview.GetQualityTableDepartmentReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err := d.service.GetQualityTableDepartment(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetDepartmentQualityProcess  godoc
//
//	@Description	部门整改情况详情
//	@Tags			数据处理概览
//	@Summary		部门整改情况详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_processing_overview.GetDepartmentQualityProcessReq	true	"请求参数"
//	@Success		200				{object}	data_processing_overview.GetDepartmentQualityProcessResp	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/date_processing/overview/department_quality_process  [GET]
func (d *ProcessingOverviewService) GetDepartmentQualityProcess(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_processing_overview.GetQualityTableDepartmentReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err := d.service.GetDepartmentQualityProcess(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetProcessTask  godoc
//
//	@Description	加工任务详情
//	@Tags			数据处理概览
//	@Summary		加工任务详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_processing_overview.GetOverviewReq	true	"请求参数"
//	@Success		200				{object}	data_processing_overview.ProcessTaskDetail	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/date_processing/overview/process_task  [GET]
func (d *ProcessingOverviewService) GetProcessTask(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_processing_overview.GetOverviewReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err := d.service.GetProcessTask(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetTargetTable  godoc
//
//	@Description	成果表详情
//	@Tags			数据处理概览
//	@Summary		成果表详情
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string											true	"token"
//	@Param			_				query		data_processing_overview.GetOverviewReq	true	"请求参数"
//	@Success		200				{object}	data_processing_overview.TargetTableDetail	"成功响应参数"
//	@Failure		400				{object}	rest.HttpError									"失败响应参数"
//	@Router			/api/task-center/v1/date_processing/overview/target_table  [GET]
func (d *ProcessingOverviewService) GetTargetTable(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	var req data_processing_overview.GetOverviewReq
	valid, errs := form_validator.BindQueryAndValid(c, &req)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.TaskInvalidParameter, errs))
		return
	}

	resp, err := d.service.GetTargetTable(ctx, &req)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

func (d *ProcessingOverviewService) SyncOverview(c *gin.Context) {
	err := d.service.SyncOverview(c)
	if err != nil {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, nil)
}
