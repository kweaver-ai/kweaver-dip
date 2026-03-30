package classify

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type ClassifyRepo interface {
	Create(ctx context.Context, classify *model.Classify) error
	CreateInBatches(ctx context.Context, classify []*model.Classify) error
	GetClassifyByID(ctx context.Context, id string) (*model.Classify, error)
	GetClassifyByParentID(ctx context.Context, parentID string) ([]*model.Classify, error)
	GetClassifyByPathID(ctx context.Context, pathId string) ([]*model.Classify, error)
	UpdateClassify(ctx context.Context, classify *model.Classify) error
	DeleteClassify(ctx context.Context, id int) error
	ListClassifies(ctx context.Context, keyword string) ([]*model.Classify, error)
	Truncate(ctx context.Context) error
	GetAll(ctx context.Context) ([]*model.Classify, error)
}
