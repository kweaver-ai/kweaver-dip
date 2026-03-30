package v2

const (
	EngineProcess = "engine"
)
const (
	ColumnInfoCacheKeys    = "id,name_cn,column_info"
	ColumnCommentCacheKeys = "id,column_name,column_comment"
	CatalogCacheKeys       = "id,title,catalog_infos"
)

const (
	ExploreType_Data = int32(iota) + 1
	ExploreType_Timestamp
)

const DefaultTotalSample = int32(1000)

const DefaultExploreVersion = int32(0)
