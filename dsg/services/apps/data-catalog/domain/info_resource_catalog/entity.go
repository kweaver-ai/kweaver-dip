package info_resource_catalog

import (
	"time"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
)

// [信息资源目录对象实体]
type InfoResourceCatalog struct {
	ID                             string                               // 信息资源目录ID
	Name                           string                               // 信息资源目录名称
	Code                           string                               // 信息资源目录编码
	SourceBusinessForm             *BusinessEntity                      // 来源业务表
	SourceDepartment               *BusinessEntity                      // 来源部门
	BelongDepartment               *BusinessEntity                      // 所属部门
	BelongOffice                   *BusinessEntity                      // 所属处室
	BelongBusinessProcessList      arraylist.ArrayList[*BusinessEntity] // 所属业务流程
	DataRange                      EnumDataRange                        // 数据范围
	UpdateCycle                    EnumUpdateCycle                      // 更新周期
	OfficeBusinessResponsibility   string                               // 处室业务责任
	Description                    string                               // 信息资源目录描述
	CategoryNodeList               arraylist.ArrayList[*CategoryNode]   // 类目节点列表
	RelatedInfoSystemList          arraylist.ArrayList[*BusinessEntity] // 关联信息系统列表
	RelatedDataResourceCatalogList arraylist.ArrayList[*BusinessEntity] // 关联数据资源目录列表
	SourceBusinessSceneList        arraylist.ArrayList[*BusinessScene]  // 来源业务场景列表
	RelatedBusinessSceneList       arraylist.ArrayList[*BusinessScene]  // 关联业务场景列表
	RelatedInfoClassList           arraylist.ArrayList[*BusinessEntity] // 关联信息类列表
	RelatedInfoItemList            arraylist.ArrayList[*BusinessEntity] // 关联信息项列表
	SharedType                     EnumSharedType                       // 共享属性
	SharedMessage                  string                               // 共享信息：共享属性为不予共享时是不予共享依据，共享属性为有条件共享时是共享条件
	SharedMode                     EnumSharedMode                       // 共享模式
	OpenType                       EnumOpenType                         // 开放属性
	OpenCondition                  string                               // 开放条件
	PublishStatus                  EnumPublishStatus                    // 发布状态
	PublishAt                      time.Time                            // 发布时间
	OnlineStatus                   EnumOnlineStatus                     // 上线状态
	OnlineAt                       time.Time                            // 上线时间
	UpdateAt                       time.Time                            // 更新时间
	DeleteAt                       time.Time                            // 删除时间
	AuditInfo                      *AuditInfo                           // 审核信息
	Columns                        arraylist.ArrayList[*InfoItem]       // 信息项列表
	CurrentVersion                 bool                                 // 是否现行版本
	AlterUID                       string                               // 变更创建人ID
	AlterName                      string                               // 变更创建人名称
	AlterAt                        time.Time                            // 变更创建时间
	PreID                          string                               // 前一版本ID
	NextID                         string                               // 后一版本ID
	AlterAuditMsg                  string                               // 最后一次变更审核意见
	LabelIds                       []string                             `json:"label_ids" binding:"omitempty,lte=5,dive,max=20"` //资源标签：数组，最多5个，标签ID
} // [/]

// [审核信息]
type AuditInfo struct {
	ID  int64  // 审核ID
	Msg string // 审核消息，最后一次审核意见
} // [/]

// [关联业务对象实体]
type BusinessEntity struct {
	ID       string `json:"id" binding:"required,ne=0,max=36" `   // 实体对象ID，0是暂存时未传递单选关联项自动生成的占位ID，不允许接口传参使用，最大长度36
	Name     string `json:"name" binding:"required_unless=ID ''"` // 实体对象名称，ID不为空时必传
	DataType string `json:"data_type" binding:"omitempty"`        // 关联信息项类型, 仅关联信息项有
} // [/]

// [类目节点对象实体]
type CategoryNode struct {
	CateID   string `json:"cate_id"`   // 类目类型ID
	NodeID   string `json:"node_id"`   // 类目节点ID
	NodeName string `json:"node_name"` // 类目节点名称
	NodePath string `json:"node_path"` // 类目节点路径
}

func (n *CategoryNode) UniqueKey() CategoryNode {
	return CategoryNode{
		CateID: n.CateID,
		NodeID: n.NodeID,
	}
} // [/]

// [业务场景值对象实体]
type BusinessScene struct {
	Type  EnumBusinessSceneType `json:"type"`  // 业务场景类型
	Value string                `json:"value"` // 业务场景值
} // [/]

// [信息项对象实体]
type InfoItem struct {
	ID               string               // 信息项ID
	Name             string               // 信息项名称
	FieldNameEN      string               // 关联业务表字段英文名称
	FieldNameCN      string               // 关联业务表字段中文名称
	RelatedDataRefer *BusinessEntity      // 关联数据元
	RelatedCodeSet   *BusinessEntity      // 关联代码集
	DataType         EnumDataType         // 数据类型
	DataLength       uint16               // 数据长度：数字型为0~65，字符型为0~65535
	DataRange        string               // 数据范围
	IsSensitive      *bool                // 是否敏感属性，可能未定义
	IsSecret         *bool                // 是否密级属性，可能未定义
	IsPrimaryKey     bool                 // 是否主键属性
	IsIncremental    bool                 // 是否增量属性
	IsLocalGenerated bool                 // 是否本地生成
	IsStandardized   bool                 // 是否标准化
	Parent           *InfoResourceCatalog // 所属信息资源目录
} // [/]

// [业务表对象副本]
type BusinessFormCopy struct {
	ID                 string                               // 业务表ID
	Name               string                               // 业务表名称
	Description        string                               // 业务表描述
	Department         *BusinessEntity                      // 所属部门
	RelatedInfoSystems arraylist.ArrayList[*BusinessEntity] // 关联信息系统列表
	UpdateAt           time.Time                            // 更新时间
	UpdateBy           *BusinessEntity                      // 更新者
} // [/]
