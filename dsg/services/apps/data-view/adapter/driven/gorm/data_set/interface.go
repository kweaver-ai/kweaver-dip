package data_set

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

// DataSetRepo 是数据集表的仓储接口
type DataSetRepo interface {
	Db() *gorm.DB
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.DataSet, error)
	Create(ctx context.Context, dataSet *model.DataSet) (string, error)
	Update(ctx context.Context, dataSet *model.DataSet) error
	Delete(ctx context.Context, id string) error
	PageList(ctx context.Context, sort string, direction string, keyword string, limit int, offset int, user string) (total int64, dataSets []*model.DataSet, err error)
	GetByName(ctx context.Context, name string) (*model.DataSet, error)
	GetByNameCount(ctx context.Context, name string, id string) (*int64, error)
	GetFormViewDetailsByDataSetId(ctx context.Context, dataSetId string, limit, offset int) ([]model.FormView, int64, error)
	GetAllDataSets(ctx context.Context) ([]model.DataSet, error)
	GetViewsByDataSetId(ctx context.Context, dataSetId string) ([]model.FormView, error)
}
