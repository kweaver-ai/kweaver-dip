package data_lineage

type EntityType string

const (
	Tables EntityType = "t_lineage_tag_table"  // 实体类型 表
	Fields EntityType = "t_lineage_tag_column" // 实体类型 字段
)

type RelationType string

const (
	TableLineageRelation RelationType = "t_lineage_edge_table"                       // 表血缘连线
	FieldLineageRelation RelationType = "t_lineage_edge_column"                      // 字段血缘连线
	FieldTableRelation   RelationType = "t_lineage_tag_column_2_t_lineage_tag_table" // 字段与表间的关系
)

const (
	LineageCacheExpireMinutes = 480
)
