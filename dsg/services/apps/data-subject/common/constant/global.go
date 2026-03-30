package constant

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

const (
	ServiceName = "DataSubject"

	DefaultHttpRequestTimeout = 60 * time.Second

	CommonTimeFormat = "2006-01-02 15:04:05"
)

const (
	SortByCreatedAt = "created_at"
	SortByUpdatedAt = "updated_at"
)
const (
	TypeBsFromDs = 2 //业务表类型，从数据源导入的业务表
)

type FieldStandardStatus enum.Object

var (
	FieldStandardStatusUnStandardized = enum.New[FieldStandardStatus](1, "", "未创建")
	FieldStandardStatusStandardized   = enum.New[FieldStandardStatus](2, "normal", "已标准化")
	FieldStandardStatusModified       = enum.New[FieldStandardStatus](4, "modified", "标准被修改")
	FieldStandardStatusDeleted        = enum.New[FieldStandardStatus](8, "deleted", "标准被删除")
)

const (
	LogicViewSourceCatalogName  = "logic_entity_view_source" //逻辑实体视图固定名称
	CustomViewSourceCatalogName = "custom_view_source"       //自定义视图固定名称
	CommonViewSchema            = "default"
)

const (
	LogicViewType  = 3 //逻辑实体视图
	CustomViewType = 2 //自定义视图
)
