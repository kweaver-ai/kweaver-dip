package tool

import "context"

type UseCase interface {
	List(ctx context.Context) ([]*SummaryInfo, int64, error)
}

type SummaryInfo struct {
	ID   string `json:"id" binding:"required,uuid" example:"3ccd8d5a76b711edb78d00505697bd0b"` // 工具ID
	Name string `json:"name" binding:"required,min=1,max=128" example:"tool_name"`             // 工具名称
}
