package info_system

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases/af_configuration"
	api_basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	api_data_catalog_frontend_v1 "github.com/kweaver-ai/idrm-go-common/api/data_catalog/frontend/v1"
	basic_search_v1 "github.com/kweaver-ai/idrm-go-common/rest/basic_search/v1"
)

type Domain struct {
	// 数据库表 af_configuration.object
	Object af_configuration.ObjectInterface
	// 微服务 basic-search 信息系统 InfoSystem
	InfoSystem basic_search_v1.InfoSystemInterface
}

func New(
	// 数据库
	database databases.Interface,
	// 微服务 basic-search
	bs basic_search_v1.Interface,
) *Domain {
	return &Domain{
		// 数据库表 af_configuration.object
		Object: database.AFConfiguration().Object(),
		// 微服务 configuration-center 部门 Department
		InfoSystem: bs.InfoSystems(),
	}
}

// Search 搜索信息系统
func (d *Domain) Search(ctx context.Context, search *api_data_catalog_frontend_v1.InfoSystemSearch) (*api_data_catalog_frontend_v1.InfoSystemSearchResult, error) {
	q, err := d.newBSQuery(ctx, search.Filter)
	if err != nil {
		return nil, err
	}

	o := &api_basic_search_v1.InfoSystemSearchOptions{
		Limit:    search.Limit,
		Continue: search.Continue,
	}

	got, err := d.InfoSystem.Search(ctx, q, o)
	if err != nil {
		return nil, err
	}

	// TODO: 信息系统所属部门的路径

	return d.AggregateInfoSystemSearchResult(ctx, got), nil
}

var _ Interface = &Domain{}

func (d *Domain) newBSQuery(ctx context.Context, filter *api_data_catalog_frontend_v1.InfoSystemSearchFilter) (*api_basic_search_v1.InfoSystemSearchQuery, error) {
	if filter == nil {
		return nil, nil
	}

	departmentIDs, err := d.newBSQueryDepartmentIDs(ctx, filter.DepartmentID)
	if err != nil {
		return nil, err
	}

	return &api_basic_search_v1.InfoSystemSearchQuery{
		Keyword:       filter.Keyword,
		DepartmentIDs: departmentIDs,
	}, nil
}

func (d *Domain) newBSQueryDepartmentIDs(ctx context.Context, idPtr *string) (uuid.UUIDs, error) {
	if idPtr == nil {
		return nil, nil
	}

	id := *idPtr

	// TODO: []string{"00000000-0000-0000-0000-000000000000"} 代表搜索不属于任何部门的信息系统
	if len(id) == 0 {
		return uuid.UUIDs{uuid.Nil}, nil
	}

	// 获取过滤条件中的部门及下属部门
	departments, err := d.Object.ListByParent(ctx, id)
	if err != nil {
		return nil, err
	}

	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}

	uuids := uuid.UUIDs{uid}
	for _, d := range departments {
		id, err := uuid.Parse(d.ID)
		if err != nil {
			return nil, err
		}
		uuids = append(uuids, id)
	}

	return uuids, nil
}
