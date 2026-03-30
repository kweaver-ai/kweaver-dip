package info_system

import (
	"context"

	basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
)

type Interface interface {
	// 搜索信息系统
	Search(ctx context.Context, query *basic_search_v1.InfoSystemSearchQuery, opts *basic_search_v1.InfoSystemSearchOptions) (*basic_search_v1.InfoSystemSearchResult, error)
	// 处理信息系统的创建、删除、更新事件
	Reconcile(ctx context.Context, event *meta_v1.WatchEvent[configuration_center_v1.InfoSystem]) error
}
