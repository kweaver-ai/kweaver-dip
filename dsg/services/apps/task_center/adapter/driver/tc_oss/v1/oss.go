package v1

import (
	"net/http"

	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_oss"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_oss"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

type OssService struct {
	service domain.UserCase
}

func NewOssService(pu domain.UserCase) *OssService {
	return &OssService{
		service: pu,
	}
}

// OssUpload  godoc
//
//	@Summary		对象存储上传图片
//	@Description	对象存储上传图片，目前最大值是1M之内的文件
//	@Accept			multipart/form-data
//	@Produce		application/json
//	@param			file	formData	file	true	"上传的文件或者图片"
//	@Tags			对象存储
//	@Success		200	{array}		response.IDResp
//	@Failure		400	{object}	rest.HttpError
//	@Router			/oss [POST]
func (o *OssService) OssUpload(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	form, err := c.MultipartForm()
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.OssFormDataReadError, err.Error()))
		return
	}
	headers := form.File["file"]
	if len(headers) != 1 {
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.OssMustUploadFile))
		return
	}
	uuid, err := o.service.Save(ctx, headers[0])
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	ginx.ResOKJson(c, response.UUIDResp{UUID: uuid})
}

// GetObj  godoc
//
//	@Summary		获取图片对象
//	@Description	获取图片对象， 不同对象的Header也不一样
//	@Accept			image/jpeg
//	@Produce		image/jpeg
//	@param			uuid	path	string	true	"图片的UUID"
//	@Tags			对象存储
//	@Success		200	{file}		image/jpeg
//	@Failure		400	{object}	rest.HttpError
//	@Router			/oss/{uuid} [GET]
func (o *OssService) GetObj(c *gin.Context) {
	var err error
	ctx, span := af_trace.StartInternalSpan(c.Request.Context())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	reqData := tc_oss.OssUuidModel{}
	valid, errs := form_validator.BindUriAndValid(c, &reqData)
	if !valid {
		log.WithContext(ctx).Error(errs.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, errorcode.Detail(errorcode.OssInvalidParameter, errs))
		return
	}
	_, bytes, err := o.service.Get(ctx, reqData.UUID)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		c.Writer.WriteHeader(400)
		ginx.ResErrJson(c, err)
		return
	}
	_, err = c.Writer.Write(bytes)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		ginx.ResErrJson(c, err)
		return
	}
	c.Writer.WriteHeader(http.StatusOK)
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename=todo")
	c.Header("Content-Transfer-Encoding", "binary")
	return
}
