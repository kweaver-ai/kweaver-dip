package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/metadata"
)

type MetadataMock struct {
}

func NewMetadataMock() metadata.DrivenMetadata {
	return &Metadata{}
}

// GetDataTables 获取数据表
func (m *MetadataMock) GetDataTables(ctx context.Context, req *metadata.GetDataTablesReq) (*metadata.GetDataTablesRes, error) {

	return nil, nil
}

// GetDataTableDetail 表详情，表字段
func (m *MetadataMock) GetDataTableDetail(ctx context.Context, req *metadata.GetDataTableDetailReq) (*metadata.GetDataTableDetailRes, error) {

	return nil, nil
}

func (m *MetadataMock) GetDataTableDetailBatch(ctx context.Context, req *metadata.GetDataTableDetailBatchReq) (*metadata.GetDataTableDetailBatchRes, error) {
	return nil, nil
}

func (m *MetadataMock) DoCollect(ctx context.Context, req *metadata.DoCollectReq) (*metadata.DoCollectRes, error) {
	return nil, nil
}

func (m *MetadataMock) GetTasks(ctx context.Context, req *metadata.GetTasksReq) (*metadata.GetTasksRes, error) {
	return nil, nil
}
