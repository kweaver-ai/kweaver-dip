package info_resource_catalog

// [信息资源目录 t_info_resource_catalog]
type InfoResourceCatalogPO struct {
	ID                           int64  `db:"f_id"`                             // 主键ID，雪花ID
	Name                         string `db:"f_name"`                           // 信息资源目录名称
	Code                         string `db:"f_code"`                           // 信息资源目录编码
	DataRange                    int8   `db:"f_data_range"`                     // 数据范围
	UpdateCycle                  int8   `db:"f_update_cycle"`                   // 更新周期
	OfficeBusinessResponsibility string `db:"f_office_business_responsibility"` // 处室业务责任
	Description                  string `db:"f_description"`                    // 信息资源目录描述
	SharedType                   int8   `db:"f_shared_type"`                    // 共享属性
	SharedMessage                string `db:"f_shared_message"`                 // 共享信息
	SharedMode                   int8   `db:"f_shared_mode"`                    // 共享方式
	OpenType                     int8   `db:"f_open_type"`                      // 开放属性
	OpenCondition                string `db:"f_open_condition"`                 // 开放条件
	PublishStatus                int8   `db:"f_publish_status"`                 // 发布状态
	PublishAt                    int64  `db:"f_publish_at"`                     // 发布时间
	OnlineStatus                 int8   `db:"f_online_status"`                  // 上线状态
	OnlineAt                     int64  `db:"f_online_at"`                      // 上线时间
	UpdateAt                     int64  `db:"f_update_at"`                      // 更新时间
	DeleteAt                     int64  `db:"f_delete_at"`                      // 删除时间
	AuditID                      int64  `db:"f_audit_id"`                       // 审核ID
	AuditMsg                     string `db:"f_audit_msg"`                      // 最后一次审核意见
	CurrentVersion               int8   `db:"f_current_version"`                // 是否现行版本
	AlterUID                     string `db:"f_alter_uid"`                      // 变更创建人ID
	AlterName                    string `db:"f_alter_name"`                     // 变更创建人名称
	AlterAt                      int64  `db:"f_alter_at"`                       // 变更创建时间
	PreID                        int64  `db:"f_pre_id"`                         // 前一版本ID
	NextID                       int64  `db:"f_next_id"`                        // 后一版本ID
	AlterAuditMsg                string `db:"f_alter_audit_msg"`                // 最后一次变更审核意见
	LabelIds                     string `db:"label_ids"`                        // 标签ids
} // [/]

// [信息资源目录来源信息 t_info_resource_catalog_source_info]
type InfoResourceCatalogSourceInfoPO struct {
	ID               int64  `db:"f_id"`                 // 主键ID，信息资源目录ID
	BusinessFormID   string `db:"f_business_form_id"`   // 来源业务表ID
	BusinessFormName string `db:"f_business_form_name"` // 来源业务表名称
	DepartmentID     string `db:"f_department_id"`      // 来源部门ID
	DepartmentName   string `db:"f_department_name"`    // 来源部门名称
} // [/]

// [信息资源目录关联项 t_info_resource_catalog_related_item]
type InfoResourceCatalogRelatedItemPO struct {
	ID                    int64                                          `db:"f_id"`                               // 自增主键
	InfoResourceCatalogID int64                                          `db:"f_info_resource_catalog_id"`         // 信息资源目录ID
	RelatedItemID         string                                         `db:"f_related_item_id"`                  // 关联项ID
	RelatedItemName       string                                         `db:"f_related_item_name"`                // 关联项名称
	RelatedItemDataType   string                                         `db:"f_related_item_data_type,omitempty"` // 关联信息项类型, 仅当关联信息项时存在
	RelationType          InfoResourceCatalogRelatedItemRelationTypeEnum `db:"f_relation_type"`                    // 关联类型
}

func (po *InfoResourceCatalogRelatedItemPO) UniqueKey() InfoResourceCatalogRelatedItemPO {
	return InfoResourceCatalogRelatedItemPO{
		InfoResourceCatalogID: po.InfoResourceCatalogID,
		RelatedItemID:         po.RelatedItemID,
		RelationType:          po.RelationType,
	}
}

type InfoResourceCatalogRelatedItemRelationTypeEnum int8

const (
	BelongDepartment           InfoResourceCatalogRelatedItemRelationTypeEnum = 0 // 所属部门
	BelongOffice               InfoResourceCatalogRelatedItemRelationTypeEnum = 1 // 所属处室
	BelongBusinessProcess      InfoResourceCatalogRelatedItemRelationTypeEnum = 2 // 所属业务流程
	RelatedInfoSystem          InfoResourceCatalogRelatedItemRelationTypeEnum = 3 // 关联信息系统
	RelatedDataResourceCatalog InfoResourceCatalogRelatedItemRelationTypeEnum = 4 // 关联数据资源目录
	RelatedInfoClass           InfoResourceCatalogRelatedItemRelationTypeEnum = 5 // 关联信息类
	RelatedInfoItem            InfoResourceCatalogRelatedItemRelationTypeEnum = 6 // 关联信息项
)

// [/]

// [信息资源目录类目节点 t_info_resource_catalog_category_node]
type InfoResourceCatalogCategoryNodePO struct {
	ID                    int64  `db:"f_id"`                       // 自增主键
	CategoryNodeID        string `db:"f_category_node_id"`         // 类目节点ID
	CategoryCateID        string `db:"f_category_cate_id"`         // 类目分类ID
	InfoResourceCatalogID int64  `db:"f_info_resource_catalog_id"` // 信息资源目录ID
} // [/]

// [业务场景 t_business_scene]
type BusinessScenePO struct {
	ID                    int64                        `db:"f_id"`                       // 自增主键
	Type                  int8                         `db:"f_type"`                     // 业务类型
	Value                 string                       `db:"f_value"`                    // 业务场景
	InfoResourceCatalogID int64                        `db:"f_info_resource_catalog_id"` // 所属信息资源目录ID
	RelatedType           BusinessSceneRelatedTypeEnum `db:"f_related_type"`             // 关联类型
}

type BusinessSceneRelatedTypeEnum int8

const (
	SourceBusinessScene  BusinessSceneRelatedTypeEnum = 0 // 来源业务场景
	RelatedBusinessScene BusinessSceneRelatedTypeEnum = 1 // 关联业务场景
)

// [/]

// [信息资源目录下属信息项 t_info_resource_catalog_column]
type InfoResourceCatalogColumnPO struct {
	ID                    int64  `db:"f_id"`                       // 主键ID，雪花ID
	Name                  string `db:"f_name"`                     // 信息项名称
	FieldNameEN           string `db:"f_field_name_en"`            // 关联业务表字段英文名称
	FieldNameCN           string `db:"f_field_name_cn"`            // 关联业务表字段中文名称
	DataType              int8   `db:"f_data_type"`                // 数据类型
	DataLength            int64  `db:"f_data_length"`              // 数据长度
	DataRange             string `db:"f_data_range"`               // 数据值域
	IsSensitive           int8   `db:"f_is_sensitive"`             // 是否敏感属性
	IsSecret              int8   `db:"f_is_secret"`                // 是否涉密属性
	IsIncremental         int8   `db:"f_is_incremental"`           // 是否增量属性
	IsPrimaryKey          int8   `db:"f_is_primary_key"`           // 是否主键属性
	IsLocalGenerated      int8   `db:"f_is_local_generated"`       // 是否本部门产生
	IsStandardized        int8   `db:"f_is_standardized"`          // 是否标准化
	InfoResourceCatalogID int64  `db:"f_info_resource_catalog_id"` // 所属信息资源目录ID
	Order                 int16  `db:"f_order"`                    // 排序索引
} // [/]

// [信息项关联信息 t_info_resource_catalog_column_related_info]
type InfoResourceCatalogColumnRelatedInfoPO struct {
	ID            int64  `db:"f_id"`              // 主键ID，信息项ID
	CodeSetID     int64  `db:"f_code_set_id"`     // 关联代码集ID
	CodeSetName   string `db:"f_code_set_name"`   // 关联代码集名称
	DataReferID   int64  `db:"f_data_refer_id"`   // 关联数据元ID
	DataReferName string `db:"f_data_refer_name"` // 关联数据元名称
} // [/]

// [未编目业务表 t_business_form_not_cataloged]
type BusinessFormNotCatalogedPO struct {
	ID               string `db:"f_id"`                 // 主键ID，业务表ID
	Name             string `db:"f_name"`               // 业务表名称
	Description      string `db:"f_description"`        // 业务表描述信息
	DepartmentID     string `db:"f_department_id"`      // 所属部门ID
	InfoSystemID     string `db:"f_info_system_id"`     // 信息系统的ID
	BusinessModelID  string `db:"f_business_model_id"`  // 业务模型ID
	BusinessDomainID string `db:"f_business_domain_id"` // 业务流程ID, 也就是当前的主干业务ID
	UpdateAt         int64  `db:"f_update_at"`          // 更新时间
} // [/]
