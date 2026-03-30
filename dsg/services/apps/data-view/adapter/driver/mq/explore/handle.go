package data_explore

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
)

type MsgExploreFinished struct {
	TableId string   `json:"table_id"` // 字段探查报告id
	TaskId  string   `json:"task_id"`  // 任务id
	Result  []string `json:"result"`   // 探查结果
}

type DataExplorationHandler struct {
	f form_view.FormViewUseCase
}

func NewDataExplorationHandler(f form_view.FormViewUseCase) *DataExplorationHandler {
	return &DataExplorationHandler{f: f}
}

// ExploreFinishedHandler 探查任务完成处理
func (d *DataExplorationHandler) ExploreFinishedHandler(msg []byte) error {
	return d.f.MarkFormViewBusinessTimestamp(context.Background(), msg)
}

// ExploreDataFinishedHandler 数据探查任务完成处理
func (d *DataExplorationHandler) ExploreDataFinishedHandler(msg []byte) error {
	return d.f.SaveFormViewExtend(context.Background(), msg)
}
