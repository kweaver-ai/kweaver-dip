package interface_svc

import "context"

type InterfaceSvc interface {
	ServiceListByCodes(ctx context.Context, codes []string) (*Res, error)
}

type Res struct {
	TotalCount int64          `json:"total_count"`
	Entries    []*ServiceInfo `json:"entries"`
}

type ServiceInfo struct {
	ServiceCode string `json:"service_code"`
	ServiceName string `json:"service_name"`
	Description string `json:"description"`
	Department  *struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"department"`
	OwnerId    string `json:"owner_id"`
	OwnerName  string `json:"owner_name"`
	OnlineTime int64  `json:"online_time"`
}
