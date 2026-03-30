package datasource

import "context"

// mockgen  -source "adapter/driven/mq/datasource/handle.go"  -destination="interface/mock/datasource_mq_mock.go" -package=mock

type DataSourceHandle interface {
	CreateDataSource(ctx context.Context, payload *DatasourcePayload) error
}

const (
	DataSourceTopic = "af.configuration-center.datasource"
)

type DatasourceMessage struct {
	Payload *DatasourcePayload `json:"payload"`
	Header  *DatasourceHeader  `json:"header"`
}
type DatasourceHeader struct {
	Method string `json:"method"`
}
type DatasourcePayload struct {
	DataSourceID uint64 `json:"data_source_id"`
	ID           string `json:"id"`
	InfoSystemID string `json:"info_system_id"`
	Name         string `json:"name"`
	CatalogName  string `json:"catalog_name"`
	Type         int32  `json:"type"`
	Host         string `json:"host"`
	Port         int32  `json:"port"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	DatabaseName string `json:"database_name"`
	Schema       string `json:"schema"`
	SourceType   string `json:"source_type"`
}
