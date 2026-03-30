package statistics

import "context"

type UseCase interface {
	GetOverviewStatistics(ctx context.Context) (*OverviewResp, error)
	GetServiceStatistics(ctx context.Context, id string) ([]*ServiceResp, error)
	SaveStatistics(ctx context.Context) error
	SyncTableCount(ctx context.Context) error
	GetDataInterface(ctx context.Context) ([]*TDataInterfaceApply, error)
}

// OverviewResp 对应 statistics_overview 表的查询结果
type OverviewResp struct {
	ID                string `json:"id"`
	TotalDataCount    int64  `json:"total_data_count"`
	TotalTableCount   int64  `json:"total_table_count"`
	ServiceUsageCount int64  `json:"service_usage_count"`
	SharedDataCount   int64  `json:"shared_data_count"`
	UpdateTime        string `json:"update_time"` // 可以使用 time.Time 类型，这里简化为 string
}

func (s *OverviewResp) TableName() string {
	return "statistics_overview"
}

// ServiceResp 对应 statistics_service 表的查询结果
type ServiceResp struct {
	ID           string `json:"id"`
	Type         int8   `json:"type"`          // TINYINT 对应为 int8
	Quantity     int32  `json:"quantity"`      // INT 对应为 int32
	BusinessTime string `json:"business_time"` // DATETIME 可以用 time.Time 或 string
	CreateTime   string `json:"create_time"`   // DATETIME 可以用 time.Time 或 string
	Week         int32  `json:"week"`          // INT 对应为 int32
	Catalog      string `json:"catalog"`       //类别，1 数据资源量，2 资源申请量
}

func (s *ServiceResp) TableName() string {
	return "statistics_service"
}

type IDReqParamPath struct {
	ID string `uri:"id" binding:"required" validate:"required" example:"1"`
}

type ServiceIDReq struct {
	IDReqParamPath `param_type:"path"`
}

type TDataCatalogApply struct {
	ID         int64  `json:"id"`
	CatalogID  int64  `json:"catalog_id"`
	ApplyNum   int32  `json:"apply_num"`
	CreateTime string `json:"create_time"`
}

func (*TDataCatalogApply) TableName() string {
	return "t_data_catalog_apply"
}

// audit_log结构体
type AuditLog struct {
	ID                int64  `json:"id"`
	AuditType         string `json:"audit_type"`
	AuditState        int32  `json:"audit_state"`
	AuditTime         string `json:"audit_time"`
	AuditResourceType int32  `json:"audit_resource_type"`
}

type TDataInterfaceApply struct {
	ID            int64  `json:"id"`
	InterfaceID   string `json:"interface_id"`
	ApplyNum      int64  `json:"apply_num"`
	BizDate       string `json:"biz_date"`
	InterfaceName string `json:"interface_name"`
}

func (*TDataInterfaceApply) TableName() string {
	return "t_data_interface_apply"
}
