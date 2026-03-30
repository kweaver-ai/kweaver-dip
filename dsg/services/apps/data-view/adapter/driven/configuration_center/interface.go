package configuration_center

import "context"

type ObjectSearch interface {
	GetInfoSystemDetail(ctx context.Context, infoSystemId string) (*GetInfoSystemRes, error)
	GetInfoSystemsBatch(ctx context.Context, ids []string) ([]*GetInfoSystemByIdsRes, error)
	GetInfoSystemNameBatch(ctx context.Context, ids []string) (map[string]string, error)
	GetStatusCheck(ctx context.Context) (string, error)
}

type GetInfoSystemByIdsRes struct {
	ID           string `json:"id"`             // 信息系统业务id
	Name         string `json:"name"`           // 信息系统名称
	Description  string `json:"description"`    // 信息系统描述
	CreatedAt    int64  `json:"created_at"`     // 创建时间
	CreatedByUID string `json:"created_by_uid"` // 创建用户ID
	UpdatedAt    int64  `json:"updated_at"`     // 更新时间
	UpdatedByUID string `json:"updated_by_uid"` // 更新用户ID
}

type GetInfoSystemRes struct {
	InfoSystemID   string `json:"id"`
	InfoSystemName string `json:"name"`
}
