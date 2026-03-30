package configuration_center

import "context"

type Repo interface {
	GetSubOrgCodes(ctx context.Context, req *GetSubOrgCodesReq) (*GetSubOrgCodesResp, error)
}

type GetSubOrgCodesReq struct {
	OrgCode string
}

type GetSubOrgCodesResp struct {
	Codes []string
}
