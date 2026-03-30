package data_exploration

import "context"

type DrivenDataExploration interface {
	GetThirdReport(ctx context.Context, id string, version *int32) ([]byte, error)
}
