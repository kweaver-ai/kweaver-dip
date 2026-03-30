package dict

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type Repo interface {
	ListDictByPaging(ctx context.Context, pageInfo *request.PageInfo, name string, queryType string) ([]*model.TDict, int64, error)
	GetDictByID(ctx context.Context, id uint64) (*model.TDict, error)
	GetDictList(ctx context.Context, queryType string) ([]*model.TDict, error)
	UpdateDictAndItem(ctx context.Context, tdict *model.TDict, dictItems []*model.TDictItem) (err error)
	CreateDictAndItem(ctx context.Context, tdict *model.TDict, dictItems []*model.TDictItem) (err error)
	DeleteDictAndItem(ctx context.Context, id uint64) (err error)
	GetDictItemListByDictID(ctx context.Context, dictId uint64) ([]*model.TDictItem, error)
	GetDictItemByType(ctx context.Context, dictTypes []string, queryType string) ([]*model.TDictItem, error)
	GetDictItemTypeList(ctx context.Context, queryType string) ([]*model.TDictItem, error)
	ListDictItemByPaging(ctx context.Context, pageInfo *request.PageInfo, name string, dictId uint64) ([]*model.TDictItem, int64, error)

	GetCheckTypeKeyList(ctx context.Context, dictItems []model.TDictItem) ([]*model.TDictItem, error)
	GetDictItemByKeys(ctx context.Context, dictType string, itemKeys ...string) (resp []*model.TDictItem, err error)
}
