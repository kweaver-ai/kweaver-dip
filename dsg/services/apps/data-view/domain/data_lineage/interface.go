package data_lineage

import (
	"context"
)

type UseCase interface {
	GetBase(ctx context.Context, req *GetBaseReqParam) (*GetBaseResp, error)
	ListLineage(ctx context.Context, req *ListLineageReqParam) (*ListLineageResp, error)
	ParserLineage(ctx context.Context, req *ParseLineageParamReq) (any, error)
}
