package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/resource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"gorm.io/gorm"
)

type resourceRepo struct {
	q *query.Query
}

func NewResourceRepo(db *gorm.DB) resource.Repo {
	return &resourceRepo{q: common.GetQuery(db)}
}
func (r resourceRepo) Truncate(ctx context.Context) error {
	return r.q.Resource.WithContext(ctx).UnderlyingDB().Exec("TRUNCATE table resource").Error
}
func (r resourceRepo) GetScope(ctx context.Context, rids []string) ([]*model.Resource, error) {
	rs := r.q.Resource
	return rs.WithContext(ctx).Where(rs.RoleID.In(rids...), rs.Type.Lte(access_control.BusinessDomainScope.ToInt32())).Find()
}

func (r resourceRepo) GetResource(ctx context.Context, rids []string) ([]*model.Resource, error) {
	rs := r.q.Resource
	return rs.WithContext(ctx).Where(rs.RoleID.In(rids...), rs.Type.Gte(access_control.BusinessDomain.ToInt32())).Find()
}
func (r resourceRepo) InsertResource(ctx context.Context, resources []*model.Resource) error {
	return r.q.Resource.WithContext(ctx).CreateInBatches(resources, common.DefaultBatchSize)
}

func (r resourceRepo) GetResourceByType(ctx context.Context, rids []string, resourceType, resourceSubType int32) ([]*model.Resource, error) {
	rs := r.q.Resource
	if resourceSubType != 0 {
		return rs.WithContext(ctx).Where(rs.SubType.Eq(resourceSubType), rs.RoleID.In(rids...)).Find()
	} else {
		return rs.WithContext(ctx).Where(rs.Type.Eq(resourceType), rs.RoleID.In(rids...)).Find()
	}
}
