package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// CreateDataDownloadTask 创建下载任务
//
//	@Description	创建下载任务
//	@Tags			open数据下载
//	@Summary		创建下载任务
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			_			body		form_view.DownloadTaskCreateParams	true	"查询参数"
//	@Success		200				{object}	form_view.DownloadTaskIDResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/download-task [post]
func (f *FormViewService) CreateDataDownloadTask(c *gin.Context) {
	req := form_validator.Valid[form_view.DownloadTaskCreateParams](c)
	if req == nil {
		return
	}

	resp, err := f.uc.CreateDataDownloadTask(c, &req.DownloadTaskCreateReq)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetDataDownloadTaskList 获取数据下载任务列表
//
//	@Description	获取数据下载任务列表
//	@Tags			open数据下载
//	@Summary		获取数据下载任务列表
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			query			query		form_view.GetDownloadTaskListParams	true	"查询参数"
//	@Success		200				{object}	form_view.PageResultNew[DownloadTaskEntry]	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/download-task [get]
func (f *FormViewService) GetDataDownloadTaskList(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDownloadTaskListParams](c)
	if req == nil {
		return
	}

	resp, err := f.uc.GetDataDownloadTaskList(c, &req.GetDownloadTaskListReq)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// DeleteDataDownloadTask 删除数据下载任务
//
//	@Description	删除数据下载任务
//	@Tags			数据下载
//	@Summary		删除数据下载任务
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			taskID			path		uint64	true	"任务ID"
//	@Success		200				{object}	form_view.DownloadTaskIDResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/download-task/{taskID} [delete]
func (f *FormViewService) DeleteDataDownloadTask(c *gin.Context) {
	req := form_validator.Valid[form_view.DownlaodTaskPath](c)
	if req == nil {
		return
	}

	resp, err := f.uc.DeleteDataDownloadTask(c, &req.DownlaodTaskPathReq)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// GetDataDownloadLink 获取下载任务导出文件下载链接
//
//	@Description	获取下载任务导出文件下载链接
//	@Tags			数据下载
//	@Summary		获取下载任务导出文件下载链接
//	@Accept			application/json
//	@Produce		application/json
//	@Param			Authorization	header		string					        true	"token"
//	@Param			taskID			path		uint64	true	"任务ID"
//	@Success		200				{object}	form_view.DownloadLinkResp	    "成功响应参数"
//	@Failure		400				{object}	rest.HttpError			        "失败响应参数"
//	@Router			/download-task/{taskID}/download-link [get]
func (f *FormViewService) GetDataDownloadLink(c *gin.Context) {
	req := form_validator.Valid[form_view.DownlaodTaskPath](c)
	if req == nil {
		return
	}

	resp, err := f.uc.GetDataDownloadLink(c, &req.DownlaodTaskPathReq)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// DataPreview 逻辑视图数据预览
// @Description	逻辑视图数据预览
// @Tags		逻辑视图数据预览
// @Summary		逻辑视图数据预览
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param		_				body		form_view.DataPreviewReqParamBody	true	"请求参数"
// @Success		200				{object}	form_view.DataPreviewResp  "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/data-preview [post]
func (f *FormViewService) DataPreview(c *gin.Context) {
	req := form_validator.Valid[form_view.DataPreviewReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.DataPreview)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DesensitizationFieldDataPreview 逻辑视图脱敏字段数据预览
// @Description	逻辑视图脱敏字段数据预览
// @Tags		逻辑视图数据预览
// @Summary		逻辑视图脱敏字段数据预览
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param		_				body		form_view.DesensitizationFieldDataPreviewReqParamBody	true	"请求参数"
// @Success		200				{object}	form_view.DesensitizationFieldDataPreviewResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/desensitization-field-data-preview [post]
func (f *FormViewService) DesensitizationFieldDataPreview(c *gin.Context) {
	req := form_validator.Valid[form_view.DesensitizationFieldDataPreviewReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.DesensitizationFieldDataPreview)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DataPreviewConfig 保存逻辑视图数据预览配置
// @Description	保存逻辑视图数据预览配置
// @Tags		逻辑视图数据预览
// @Summary		保存逻辑视图数据预览配置
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param		_				body		form_view.DataPreviewConfigReqParamBody	true	"请求参数"
// @Success		200				{object}	form_view.DataPreviewConfigResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/preview-config [post]
func (f *FormViewService) DataPreviewConfig(c *gin.Context) {
	req := form_validator.Valid[form_view.DataPreviewConfigReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.DataPreviewConfig)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// GetDataPreviewConfig 查看逻辑视图数据预览配置
// @Description	查看逻辑视图数据预览配置
// @Tags		逻辑视图数据预览
// @Summary		查看逻辑视图数据预览配置
// @Accept		json
// @Produce		json
// @Param		Authorization	header		string					            true	"token"
// @Param		_     			query    	form_view.GetDataPreviewConfigReqParam true "查询参数"
// @Success		200				{object}	form_view.GetDataPreviewConfigResp          "成功响应参数"
// @Failure		400				{object}	rest.HttpError			            "失败响应参数"
// @Router		/form-view/preview-config [get]
func (f *FormViewService) GetDataPreviewConfig(c *gin.Context) {
	req := form_validator.Valid[form_view.GetDataPreviewConfigReq](c)
	if req == nil {
		return
	}
	res, err := util.TraceA1R2(c, req, f.uc.GetDataPreviewConfig)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, res)
}
