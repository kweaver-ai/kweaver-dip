package data_catalog

import (
	"context"
)

type CatalogInfo struct {
	ID                  uint64 `json:"id,string"`            // 唯一id，雪花算法
	Code                string `json:"code"`                 // 目录编码
	Title               string `json:"title"`                // 目录名称
	ComprehensionStatus int8   `json:"comprehension_status"` // 理解状态
	State               int8   `json:"state"`                // 编目状态
}

type Call interface {
	GetCatalogInfos(ctx context.Context, catalogIds ...string) ([]*CatalogInfo, error)
}
