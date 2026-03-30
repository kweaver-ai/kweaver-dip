package data_exploration

import (
	"context"
	"io"
)

type DrivenDataExploration interface {
	CreateTask(ctx context.Context, body io.Reader) (*ExploreJobResp, error)
	UpdateTask(ctx context.Context, body io.Reader, id string) (*ExploreJobResp, error)
	GetTask(ctx context.Context, id string) ([]byte, error)
	GetReport(ctx context.Context, id string, version *int32) ([]byte, error)
	GetFieldReport(ctx context.Context, id, fieldName string, dataType string) ([]byte, error)
	GetRuleList(ctx context.Context) ([]byte, error)
	GetScore(ctx context.Context, id string) ([]byte, error)
	GetThirdPartyScore(ctx context.Context, id string) ([]byte, error)
	GetStatus(ctx context.Context, catalog, schema, taskId string) ([]byte, error)
	GetFormStatus(ctx context.Context, req *TableTaskStatusReq) ([]byte, error)
	StartExplore(ctx context.Context, body io.Reader) ([]byte, error)
	DeleteTask(ctx context.Context, id string) error
	GetThirdReport(ctx context.Context, id string, version *int32) ([]byte, error)
	GetReports(ctx context.Context, body io.Reader) ([]byte, error)
}

type ExploreJobResp struct {
	TaskID  string `json:"task_id"` // 探查作业ID
	Version int    `json:"version"` // 探查作业版本
}

type TableTaskStatusReq struct {
	TableIds []string `json:"table_ids"`
}
