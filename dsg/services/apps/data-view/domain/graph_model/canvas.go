package graph_model

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
)

type Canvas interface {
	GetCanvas(ctx context.Context, req *request.IDReq) (*CanvasContent, error)
	SaveCanvas(ctx context.Context, req *CanvasContent) (*response.IDResp, error)
}

type CanvasContentParam struct {
	CanvasContent `param_type:"body"`
}

type CanvasContent struct {
	ID      string `json:"id" binding:"omitempty" `      // id, 可以不填
	Content string `json:"content"  binding:"required" ` // 画布数据，大json
}
