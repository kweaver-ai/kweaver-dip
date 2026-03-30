package graph_model

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type Repo interface {
	GraphModelRepo
	CanvasRepo
	ModelLabelRecRelRepo
}

type GraphModelRepo interface {
	CreateModel(ctx context.Context, obj *model.TGraphModel, fields []*model.TModelField) error
	UpdateMetaGraph(ctx context.Context, obj *model.TGraphModel, fields []*model.TModelField) error
	UpdateRelations(ctx context.Context, obj *model.TGraphModel, singleNodes []*model.TModelSingleNode, relations []*model.TModelRelation, links []*model.TModelRelationLink) error
	UpdateModelGraphID(ctx context.Context, modeID string, graphID int) error
	DeleteModel(ctx context.Context, id string, txFunc func() error) (err error)
	queryRepo
}

type queryRepo interface {
	GetModel(ctx context.Context, id string) (obj *model.TGraphModel, err error)
	UpdateModel(ctx context.Context, obj *model.TGraphModel) (err error)
	GetModelSlice(ctx context.Context, ids ...string) (objs []*model.TGraphModel, err error)
	GetModelFieldSlice(ctx context.Context, modelID string) (fields []*model.TModelField, err error)
	GetModelRelations(ctx context.Context, modelID string) (relations []*model.TModelRelation, err error)
	GetModelRelationLinks(ctx context.Context, modelID string) (links []*model.TModelRelationLink, err error)
	ListCompositeMetas(ctx context.Context, id string) (models []*domain.ModelDetail, err error)
	GetCompositeMetaNameDict(ctx context.Context, ids ...string) (res map[string][]string, err error)
	ListModel(ctx context.Context, req *domain.ModelListReq) (models []*model.TGraphModel, total int64, err error)
	ExistsTechnicalName(ctx context.Context, modelID string, technicalName string) error
	ExistsBusinessName(ctx context.Context, modelID string, businessName string) error
	GetMetaUsedCount(ctx context.Context, metaModelID string) (count int64, err error)
}

type CanvasRepo interface {
	UpsertCanvas(ctx context.Context, obj *model.TModelCanva) error
	GetCanvas(ctx context.Context, id string) (*model.TModelCanva, error)
}

type ModelLabelRecRelRepo interface {
	ListTopicModelLabelRec(ctx context.Context, req *request.PageSortKeyword3) (models []*model.TModelLabelRecRel, total int64, err error)
	GetTopicModelLabelRec(ctx context.Context, id uint64) (obj *model.TModelLabelRecRel, err error)
	UpdateTopicModelLabelRec(ctx context.Context, obj *model.TModelLabelRecRel) (err error)
	CreateTopicModelLabelRec(ctx context.Context, obj *model.TModelLabelRecRel) error
	DeleteTopicModelLabelRec(ctx context.Context, id uint64) (err error)
}
