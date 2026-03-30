package datasource

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	ListByPaging(ctx context.Context, pageInfo *request.PageInfo, keyword, infoSystemId string, sourceType int, types []string, huaAoID string, orgCodes []string) ([]*model.Datasource, int64, error)
	GetByID(ctx context.Context, id string) (*model.Datasource, error)
	GetByID2(ctx context.Context, id string) (*model.Datasource, error)
	GetByIDs(ctx context.Context, ids []string) ([]*model.Datasource, error)
	GetByInfoSystemID(ctx context.Context, infoSystemId string) ([]*model.Datasource, error)
	ClearInfoSystemID(ctx context.Context, infoSystemId string) error
	Insert(ctx context.Context, dataSource *model.Datasource) error
	Update(ctx context.Context, dataSource *model.Datasource) error
	Delete(ctx context.Context, dataSource *model.Datasource) error
	NameExistCheck(ctx context.Context, name string, sourceType int32, infoSystemID string, ids ...string) (bool, error)
	GetDataSourceSystemInfos(ctx context.Context, ids []int) ([]*response.GetDataSourceSystemInfosRes, error)
	GetAll(ctx context.Context) ([]*model.Datasource, error)
}
