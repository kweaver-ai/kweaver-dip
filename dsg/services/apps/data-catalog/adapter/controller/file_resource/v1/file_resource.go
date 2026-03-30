package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	file_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/file_resource"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
	"github.com/samber/lo"
)

type Controller struct {
	fr file_resource.FileResourceDomain
}

func NewController(
	fr file_resource.FileResourceDomain,
) *Controller {
	ctl := &Controller{
		fr: fr,
	}
	return ctl
}

// CreateFileResource 添加文件资源
// @Description 添加文件资源
// @Tags        文件资源管理
// @Summary     添加文件资源
// @Accept      json
// @Produce     json
// @Param       Authorization header     string                    true "token"
// @Param       _     body   file_resource.CreateFileResourceReq  true "请求参数"
// @Success     200   {object}   file_resource.IDResp    "成功响应参数"
// @Failure     400   {object}   rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource [post]
func (controller *Controller) CreateFileResource(c *gin.Context) {
	var req file_resource.CreateFileResourceReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.fr.CreateFileResource(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetFileResourceList 获取文件资源列表
// @Description 获取文件资源列表
// @Tags        文件资源管理
// @Summary     获取文件资源列表
// @Accept      json
// @Produce     json
// @Param       Authorization header   string                    true "token"
// @Param       _     query    file_resource.GetFileResourceListReq true "查询参数"
// @Success     200   {object} file_resource.GetFileResourceListRes    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource [get]
func (controller *Controller) GetFileResourceList(c *gin.Context) {
	var req file_resource.GetFileResourceListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
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

	res, err := controller.fr.GetFileResourceList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}

	ginx.ResOKJson(c, res)
}

// GetFileResourceDetail 获取文件资源详情
// @Description 获取文件资源详情
// @Tags        文件资源管理
// @Summary     获取文件资源详情
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string              true "token"
// @Param       id path     uint64               true "文件资源ID" default(1)
// @Success     200       {object} file_resource.GetFileResourceDetailRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/{id} [get]
func (controller *Controller) GetFileResourceDetail(c *gin.Context) {
	var p file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	data, err := controller.fr.GetFileResourceDetail(c, p.ID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// UpdateFileResource 编辑文件资源
// @Description 编辑文件资源
// @Tags        文件资源管理
// @Summary     编辑文件资源
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string                    true "token"
// @Param       id path     uint64                     true "文件资源ID" default(1)
// @Param       _         body     file_resource.UpdateFileResourceReq true "请求参数"
// @Success     200       {object} file_resource.IDResp    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/{id} [put]
func (controller *Controller) UpdateFileResource(c *gin.Context) {
	var p file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req file_resource.UpdateFileResourceReq
	if _, err := form_validator.BindJsonAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req body param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.fr.UpdateFileResource(c, p.ID.Uint64(), &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// DeleteFileResource 删除文件资源（逻辑删除）
// @Description 删除文件资源（逻辑删除）
// @Tags        文件资源管理
// @Summary     删除文件资源（逻辑删除）
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string                    true "token"
// @Param       id path     string                     true "文件资源ID" default(1)
// @Success     200       {object} response.IDRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/{id} [delete]
func (controller *Controller) DeleteFileResource(c *gin.Context) {
	var p file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := controller.fr.DeleteFileResource(c, p.ID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{ID: p.ID.String()})
}

// PublishFileResource 发布文件资源
// @Description 发布文件资源
// @Tags        文件资源管理
// @Summary     发布文件资源
// @Accept      json
// @Produce     json
// @Param       Authorization header   string                    true "token"
// @Param       id     path    string true "文件资源ID"
// @Success     200   {object} file_resource.IDResp    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/audit/{id} [post]
func (controller *Controller) PublishFileResource(c *gin.Context) {
	var req file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.fr.PublishFileResource(c, req.ID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// CancelAudit 撤销文件资源审核
// @Description 撤销文件资源审核
// @Tags        文件资源管理
// @Summary     撤销文件资源审核
// @Accept      json
// @Produce     json
// @Param       Authorization header   string                    true "token"
// @Param       id     path    string true "文件资源ID"
// @Success     200   {object} file_resource.IDResp    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/cancel/{id} [put]
func (controller *Controller) CancelAudit(c *gin.Context) {
	var req file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.fr.CancelAudit(c, req.ID.Uint64())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetAuditList   获取待审核文件资源列表
// @Description 获取待审核文件资源列表
// @Tags   		文件资源管理
// @Summary     获取待审核文件资源列表
// @Accept      json
// @Produce     json
// @Param       Authorization header   string     true "token"
// @Param       _     query     file_resource.GetAuditListReq  true "请求参数"
// @Success     200   {object} file_resource.AuditListRes       "成功响应参数"
// @Failure     400   {object} rest.HttpError               "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/audit [GET]
func (controller *Controller) GetAuditList(c *gin.Context) {
	var req file_resource.GetAuditListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}

	resp, err := controller.fr.GetAuditList(c, &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// GetAttachmentList 获取附件列表
// @Description 获取附件列表
// @Tags        文件资源管理
// @Summary     获取附件列表
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string              true "token"
// @Param       id path     uint64               true "文件资源ID" default(1)
// @Param       _     query    file_resource.GetAttachmentListReq true "查询参数"
// @Success     200   {object} file_resource.GetAttachmentListRes    "成功响应参数"
// @Failure     400   {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/{id}/attachment [get]
func (controller *Controller) GetAttachmentList(c *gin.Context) {
	var p file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	var req file_resource.GetAttachmentListReq
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	if *req.Limit == 0 {
		req.Offset = lo.ToPtr(1)
	}

	data, err := controller.fr.GetAttachmentList(c, p.ID.String(), &req)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, data)
}

// UploadAttachment 上传附件
// @Description 上传附件,可批量上传
// @Tags        文件资源管理
// @Summary     上传附件
// @Accept      application/x-www-form-urlencoded
// @Produce     json
// @Param       Authorization header     string                    true "token"
// @Param		file  formData   file   true   "上传的文件"
// @Success     200   {object}   file_resource.UploadAttachmentRes    "成功响应参数"
// @Failure     400   {object}   rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/{id}/attachment [post]
func (controller *Controller) UploadAttachment(c *gin.Context) {
	var p file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		log.WithContext(c.Request.Context()).Error(err.Error())
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	files := form.File["file"]
	if len(files) > 10 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FileMaxUploadError))
		return
	}
	resp, err := controller.fr.UploadAttachment(c, p.ID.Uint64(), files)
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, resp)
}

// PreviewPdf
// @Summary     根据文件ID和pdf对象存储ID预览文件
// @Description 根据文件ID和pdf对象存储ID预览文件
// @Tags        文件资源管理
// @Accept      json
// @Produce     json
// @Param       _ query file_resource.PreviewPdfReq true "预览请求参数"
// @Success     200 {object}   file_resource.PreviewPdfRes "成功响应参数"
// @Failure     400 {object} rest.HttpError     "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/attachment/preview-pdf [get]
func (controller *Controller) PreviewPdf(c *gin.Context) {
	req := &file_resource.PreviewPdfReq{}
	if _, err := form_validator.BindQueryAndValid(c, &req); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req query param, err: %v", err)
		form_validator.ReqParamErrorHandle(c, err)
		return
	}
	res, err := controller.fr.PreviewPdf(c, req)
	if err != nil {
		ginx.ResErrJsonWithCode(c, http.StatusBadRequest, err)
		return
	}
	ginx.ResOKJson(c, res)
}

// DeleteAttachment 移除附件（逻辑删除）
// @Description 移除附件（逻辑删除）
// @Tags        文件资源管理
// @Summary     移除附件（逻辑删除）
// @Accept      json
// @Produce     json
// @Param       Authorization     header   string                    true "token"
// @Param       id path     string                     true "文件ID" default(1)
// @Success     200       {object} response.IDRes    "成功响应参数"
// @Failure     400       {object} rest.HttpError            "失败响应参数"
// @Router      /api/data-catalog/v1/file-resource/attachment/{id} [delete]
func (controller *Controller) DeleteAttachment(c *gin.Context) {
	var p file_resource.IDRequired
	if _, err := form_validator.BindUriAndValid(c, &p); err != nil {
		log.WithContext(c.Request.Context()).Errorf("failed to binding req uri param, err: %v", err)
		form_validator.UriParamErrorHandle(c, err)
		return
	}

	err := controller.fr.DeleteAttachment(c, p.ID.String())
	if err != nil {
		ginx.ResBadRequestJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.IDRes{ID: p.ID.String()})
}
