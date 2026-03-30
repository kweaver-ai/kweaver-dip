package file

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

var fileTypes = map[string]struct{}{
	"doc":  {},
	"docx": {},
	"xls":  {},
	"xlsx": {},
	"ppt":  {},
	"pptx": {},
	"pdf":  {},
}

type FileController struct {
	domain *domain.FileDomain
}

func NewFileController(d *domain.FileDomain) *FileController {
	return &FileController{domain: d}
}

// Upload 文件上传
//
//	@Description	文件上传
//	@Tags			文件
//	@Summary		文件上传
//	@Produce		json
//	@Param			file	formData	file				true	"文件"
//	@Success		200		{object}	dto.FileUploadRes	"成功响应参数"
//	@Failure		400		{object}	rest.HttpError		"失败响应参数"
//	@Router			/api/data-application-service/v1/files [post]
func (s *FileController) Upload(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FileNotExist))
		return
	}

	files := form.File["file"]
	if len(files) == 0 {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FileRequired))
		return
	}
	if len(files) > 1 {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FileOneMax))
		return
	}
	file := files[0]
	if file.Size > 10<<20 {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FileSizeMax))
		return
	}

	fileType := strings.ToLower(path.Ext(file.Filename)[1:])
	_, ok := fileTypes[fileType]
	if !ok {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, errorcode.Desc(errorcode.FileInvalidType))
		return
	}

	resp, err := s.domain.FileUpload(c, file, fileType)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	ginx.ResOKJson(c, resp)
}

// Download 文件下载
//
//	@Description	文件下载
//	@Tags			文件
//	@Summary		文件下载
//	@Accept			json
//	@Produce		json
//	@Param			file_id	path		string			true	"文件"
//	@Failure		400		{object}	rest.HttpError	"失败响应参数"
//	@Router			/api/data-application-service/v1/files/download/{file_id} [get]
func (s *FileController) Download(c *gin.Context) {
	req := &dto.FileDownloadReq{}

	_, err := form_validator.BindUriAndValid(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		if errors.As(err, &form_validator.ValidErrors{}) {
			ginx.ResErrJson(c, errorcode.Detail(errorcode.PublicInvalidParameter, err))
			return
		}

		ginx.ResErrJson(c, errorcode.Desc(errorcode.PublicRequestParameterError))
		return
	}

	fileBytes, file, err := s.domain.FileDownload(c, req)
	if err != nil {
		c.Writer.WriteHeader(http.StatusBadRequest)
		ginx.ResErrJson(c, err)
		return
	}

	c.Writer.WriteHeader(http.StatusOK)
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename*=utf-8''%s", url.PathEscape(file.FileName)))
	c.Header("Content-Transfer-Encoding", "binary")
	_, err = c.Writer.Write(fileBytes)
	if err != nil {
		log.WithContext(c).Error("Download failed to Write", zap.Error(err))
	}
}
