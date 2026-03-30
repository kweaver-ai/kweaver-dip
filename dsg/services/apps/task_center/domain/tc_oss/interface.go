package tc_oss

import (
	"context"
	"mime/multipart"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type UserCase interface {
	Save(ctx context.Context, file *multipart.FileHeader) (string, error)
	Get(ctx context.Context, uuid string) (*model.TcOss, []byte, error)
}

const (
	maxUploadSize = 1024 * 1024
)

var (
	allowedAppendix = map[string]int{
		"jpg":  1,
		"jpeg": 1,
		"png":  1,
		"pdf":  1,
		"doc":  1,
		"docx": 1,
	}
)

type OssGetReq struct {
	UUID string `json:"uuid"`
}

type OssUuidModel struct {
	UUID string `json:"uuid" uri:"uuid"  binding:"required,uuid"`
}

type OssFile struct {
	MultiFileHeader *multipart.FileHeader
}

// ValidAppendix check valid appendix
func ValidAppendix(appendix string) bool {
	appendix = strings.ToLower(appendix)
	_, ok := allowedAppendix[appendix]
	return ok
}

// ValidSize check valid size
func ValidSize(size int64, appendix string) bool {
	if strings.ToLower(appendix) == "jpg" || strings.ToLower(appendix) == "jpeg" || strings.ToLower(appendix) == "png" {
		return size <= maxUploadSize
	} else {
		return size <= maxUploadSize*10
	}
}
