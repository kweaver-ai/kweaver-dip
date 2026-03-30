package statistics

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/statistics"
)

type Repo interface {
	GetOverviewStatistics(ctx context.Context) (*Statistics, error)
	GetServiceStatistics(ctx context.Context, ids string) ([]*Service, error)
	SaveStatistics(ctx context.Context) error
	DeleteExistingRecords(ctx context.Context, records []*Service) error
	UpdateStatistics(ctx context.Context, req *domain.OverviewResp) error
}
type Statistics struct {
	ID                string `json:"id"`
	ServiceUsageCount int64  `json:"service_usage_count"`
	SharedDataCount   int64  `json:"shared_data_count"`
	TotalDataCount    int64  `json:"total_data_count"`
	TotalTableCount   int64  `json:"total_table_count"`
	UpdateTime        string `json:"update_time"`
}

type Service struct {
	BusinessTime string `json:"business_time"`
	CreateTime   string `json:"create_time"`
	ID           string `json:"id"`
	Quantity     int32  `json:"quantity"`
	Type         int8   `json:"type"`
	Week         int32  `json:"week"`
	Catalog      string `json:"catalog"`
}

func (s *Service) TableName() string {
	return "statistics_service"
}

func (s *Statistics) TableName() string {
	return "statistics_overview"
}
