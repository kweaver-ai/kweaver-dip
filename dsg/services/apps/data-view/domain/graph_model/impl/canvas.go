package impl

import (
	"context"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func (u *useCase) GetCanvas(ctx context.Context, req *request.IDReq) (*domain.CanvasContent, error) {
	obj, err := u.repo.GetCanvas(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return &domain.CanvasContent{
		ID:      obj.ID,
		Content: obj.Canvas,
	}, nil
}

func (u *useCase) SaveCanvas(ctx context.Context, req *domain.CanvasContent) (*response.IDResp, error) {
	canvas := &model.TModelCanva{
		ID:     req.ID,
		Canvas: req.Content,
	}
	if canvas.ID == "" {
		canvas.ID = uuid.New().String()
	}
	if err := u.repo.UpsertCanvas(ctx, canvas); err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return response.ID(req.ID), nil
}
