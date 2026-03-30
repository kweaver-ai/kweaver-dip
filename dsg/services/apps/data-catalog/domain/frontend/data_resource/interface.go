package data_resource

import "context"

const ( // 类目类型ID
	CATEGORY_TYPE_ORGANIZATION   = "00000000-0000-0000-0000-000000000001" // 组织架构
	CATEGORY_TYPE_SYSTEM         = "00000000-0000-0000-0000-000000000002" // 信息系统
	CATEGORY_TYPE_SUBJECT_DOMAIN = "00000000-0000-0000-0000-000000000003" // 主题域
)

type DataResourceDomain interface {
	Search(ctx context.Context, keyword string, filter Filter, nextFlag NextFlag) (*SearchResult, error)
	SearchForOper(ctx context.Context, keyword string, filter FilterForOper, nextFlag NextFlag) (*SearchResult, error)
}
