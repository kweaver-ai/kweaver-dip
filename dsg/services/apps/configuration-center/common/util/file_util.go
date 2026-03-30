package util

import (
	"path/filepath"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

// IsValidSize check valid size
func IsValidSize(size int64) bool {
	return size <= constant.MaxUploadSize
}

// IsValidType 检查文件名的后缀是否为允许的类型
func IsValidType(filename string) bool {
	// 使用 filepath.Ext 获取文件后缀
	ext := filepath.Ext(filename)
	if ext == "" {
		return false
	}
	// 去除后缀前面的点，并转换为小写
	ext = strings.TrimPrefix(strings.ToLower(ext), ".")

	// 定义允许的文件后缀
	validExtensions := []string{"doc", "docx", "pdf", "xls", "xlsx"}
	for _, validExt := range validExtensions {
		if ext == validExt {
			return true
		}
	}
	return false
}

func GetFilenameWithoutExt(path string) string {
	filename := filepath.Base(path)        // 获取带后缀的文件名
	return strings.Split(filename, ".")[0] // 简单按点分割
}
