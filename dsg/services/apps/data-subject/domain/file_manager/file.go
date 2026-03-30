package file_manager

import (
	"mime/multipart"
	"os"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	uuid "github.com/satori/go.uuid"
)

type File struct {
	ID               uint64 `json:"id"`
	FileID           string `json:"file_id"`            // 文件唯一id
	BusinessDomainID int32  `json:"business_domain_id"` // 业务域标识
	BusinessModelID  string `json:"business_model_id"`  // 业务模型标识
	Name             string `json:"name"`               // 文件名称
	Path             string `json:"path"`               // 文件保存路径
	Size             int64  `json:"size"`               // 文件大小，单位字节
	FileType         string `json:"file_type"`          // 文件类型xlsx/slx
	TemplateType     int32  `json:"template_type"`      // 模板类型
	Version          int32  `json:"version"`            // 文件版本
}

func SaveFile(c *gin.Context, mId string, fileHeader *multipart.FileHeader, dir string) (*File, error) {
	if fileHeader.Size > 10*1<<20 {
		return nil, errorcode.Desc(my_errorcode.FormFileSizeLarge)
	}
	format := strings.HasSuffix(fileHeader.Filename, ".xlsx")
	if !format {
		return nil, errorcode.Desc(my_errorcode.FormExcelInvalidType)
	}

	split := strings.Split(fileHeader.Filename, ".")
	fileType := split[len(split)-1]
	if len([]rune(split[0])) > 64 {
		tmp := []rune(split[0])[:64]
		fileHeader.Filename = string(tmp) + "." + fileType
	}

	u := uuid.NewV4()
	filename := u.String() + fileHeader.Filename
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err = os.MkdirAll(dir, os.ModePerm)
		if err != nil {
			return nil, errorcode.Desc(my_errorcode.FormCreateDirError)
		}
	}

	dstPath := path.Join(dir, filename)

	err := c.SaveUploadedFile(fileHeader, dstPath)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.FormSaveFileError, err)
	}
	f := &File{
		FileID:          u.String(),
		BusinessModelID: mId,
		Name:            fileHeader.Filename,
		Path:            dstPath,
		Size:            fileHeader.Size,
		FileType:        fileType,
	}
	return f, nil
}
