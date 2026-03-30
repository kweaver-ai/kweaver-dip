package data_catalog

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
)

type CatalogBaseInfo struct {
	Title            string         `json:"title" binding:"required,VerifyNameStandard"`                                                       // 目录名称
	GroupID          models.ModelID `json:"group_id" binding:"omitempty,VerifyModelID"`                                                        // 数据资源目录分类ID
	GroupName        string         `json:"group_name" binding:"omitempty,TrimSpace,min=1,max=128"`                                            // 数据资源目录分类名称
	DataRange        int32          `json:"data_range" binding:"omitempty,oneof=1 2 3"`                                                        // 数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县
	UpdateCycle      int32          `json:"update_cycle" binding:"omitempty,min=1,max=9"`                                                      // 更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
	ThemeID          uint64         `json:"theme_id,string" binding:"omitempty,min=1"`                                                         // 主题分类ID
	ThemeName        string         `json:"theme_name" binding:"omitempty,TrimSpace,min=1,max=100"`                                            // 主题分类名称
	DataKind         int32          `json:"data_kind" binding:"omitempty,min=1,max=32"`                                                        // 基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他  可组合，如 人和地 即 1|2 = 3
	Description      string         `json:"description" binding:"omitempty,VerifyDescription,max=1000"`                                        // 资源目录描述
	SharedType       int8           `json:"shared_type" binding:"required,oneof=1 2 3"`                                                        // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SharedCondition  string         `json:"shared_condition" binding:"required_unless=SharedType 1,omitempty,VerifyDescription,min=1,max=255"` // 共享条件
	OpenType         int8           `json:"open_type" binding:"required,oneof=1 2"`                                                            // 开放属性 1 向公众开放 2 不向公众开放
	OpenCondition    string         `json:"open_condition" binding:"omitempty,VerifyDescription,max=255"`                                      // 开放条件
	SharedMode       int8           `json:"shared_mode" binding:"required_unless=SharedType 3,omitempty,oneof=1 2 3"`                          // 共享方式 1 共享平台方式 2 邮件方式 3 介质方式
	PhysicalDeletion *int8          `json:"physical_deletion" binding:"omitempty,oneof=0 1"`                                                   // 挂接实体资源是否存在物理删除(1 是 ; 0 否)
	SyncMechanism    int8           `json:"sync_mechanism" binding:"omitempty,oneof=1 2"`                                                      // 数据归集机制(1 增量 ; 2 全量) ----归集到数据中台
	SyncFrequency    string         `json:"sync_frequency" binding:"omitempty,max=128"`                                                        // 数据归集频率 ----归集到数据中台，因界面没有此字段的编辑故去掉VerifyDescription校验
	Infos            []*InfoItem    `json:"infos" binding:"omitempty,unique=InfoType,max=6,dive"`                                              // 关联信息
	PublishFlag      *int8          `json:"publish_flag" binding:"required,omitempty,oneof=0 1"`                                               // 是否发布到超市 (1 是 ; 0 否)
	DataKindFlag     *int8          `json:"data_kind_flag" binding:"required,omitempty,oneof=0 1"`                                             // 基础信息分类是否智能推荐 (1 是 ; 0 否)
	LabelFlag        *int8          `json:"label_flag" binding:"required,omitempty,oneof=0 1"`                                                 // 标签是否智能推荐 (1 是 ; 0 否)
	SrcEventFlag     *int8          `json:"src_event_flag" binding:"required,omitempty,oneof=0 1"`                                             // 来源业务场景是否智能推荐 (1 是 ; 0 否)
	RelEventFlag     *int8          `json:"rel_event_flag" binding:"required,omitempty,oneof=0 1"`                                             // 关联业务场景是否智能推荐 (1 是 ; 0 否)
	SystemFlag       *int8          `json:"system_flag" binding:"required,omitempty,oneof=0 1"`                                                // 关联信息系统是否智能推荐 (1 是 ; 0 否)
	RelCatalogFlag   *int8          `json:"rel_catalog_flag" binding:"required,omitempty,oneof=0 1"`                                           // 关联目录是否智能推荐 (1 是 ; 0 否)
}

/*
type CreateColumnItem struct {
	ColumnName      string `json:"column_name" binding:"required,min=1,max=500"`                                    // 字段名称
	NameCn          string `json:"name_cn" binding:"required,min=1,max=500"`                                        // 信息项名称
	DataFormat      *int32 `json:"data_format" binding:"omitempty,oneof=0 1 2 3 4 5 6"`                             // 字段类型 0:数字型 1:字符型 2:日期型 3:日期时间型 4:时间戳型 5:布尔型 6:二进制
	DataLength      *int32 `json:"data_length" binding:"omitempty,min=0"`                                           // 字段长度
	DatametaID      string `json:"datameta_id" binding:"omitempty,min=1,max=50"`                                    // 关联数据元ID
	DatametaName    string `json:"datameta_name" binding:"omitempty,min=1,max=200"`                                 // 关联数据元名称
	Ranges          string `json:"ranges" binding:"omitempty,min=1,max=200"`                                        // 字段值域，因界面没有此字段的编辑故去掉VerifyDescription校验
	CodesetID       string `json:"codeset_id" binding:"omitempty,min=1,max=50"`                                     // 关联代码集ID
	CodesetName     string `json:"codeset_name" binding:"omitempty,min=1,max=200"`                                  // 关联代码集名称
	PrimaryFlag     *int8  `json:"primary_flag" binding:"omitempty,oneof=0 1"`                                      // 是否主键(1 是 ; 0 否)
	NullFlag        *int8  `json:"null_flag" binding:"omitempty,oneof=0 1"`                                         // 是否为空(1 是 ; 0 否)
	ClassifiedFlag  *int8  `json:"classified_flag" binding:"omitempty,oneof=0 1"`                                   // 是否涉密属性(1 是 ; 0 否)
	SensitiveFlag   *int8  `json:"sensitive_flag" binding:"omitempty,oneof=0 1"`                                    // 是否敏感属性(1 是 ; 0 否)
	Description     string `json:"description" binding:"omitempty,min=1,max=2048"`                                  // 字段描述，因界面没有此字段的编辑故去掉VerifyDescription校验
	SharedType      *int8  `json:"shared_type" binding:"required,oneof=1 2 3"`                                      // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SharedCondition string `json:"shared_condition" binding:"required_unless=SharedType 1,omitempty,min=1,max=255"` // 共享条件，因界面没有此字段的编辑故去掉VerifyDescription校验
	OpenType        *int8  `json:"open_type" binding:"required,oneof=1 2"`                                          // 开放属性 1 向公众开放 2 不向公众开放
	OpenCondition   string `json:"open_condition" binding:"omitempty,max=255"`                                      // 开放条件，因界面没有此字段的编辑故去掉VerifyDescription校验
	// TimestampFlag  *int8  `json:"timestamp_flag" binding:"required,oneof=0 1"`           // 是否时间戳(1 是 ; 0 否)
}*/
/*
type UpdateColumnItem struct {
	ID        uint64 `json:"id,string" binding:"omitempty,min=1"`         // 唯一id，雪花算法
	CatalogID uint64 `json:"catalog_id,string" binding:"omitempty,min=1"` // 数据资源目录ID
	*CreateColumnItem
}*/

type InfoItem struct {
	InfoType int8        `json:"info_type" binding:"required,min=1,max=6"` // 关联信息类型 1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联表、字段 6 业务域
	Entries  []*InfoBase `json:"entries" binding:"omitempty,unique=InfoKey,dive"`
}

type InfoBase struct {
	InfoKey   string `json:"info_key" binding:"required,TrimSpace,min=1,max=50"`     // 关联信息key（仅当info_type为5时为关联目录ID，其它情况下为ID或枚举值）
	InfoValue string `json:"info_value" binding:"required,TrimSpace,min=1,max=1000"` // 关联信息名称（info_type为5时表示关联目录及其信息项的json字符串）
}

type MountResourceItem struct {
	ResourceType int8                 `json:"resource_type" binding:"required,oneof=1 2"` // 挂接资源类型 1逻辑视图 2 接口
	Entries      []*MountResourceBase `json:"entries" binding:"required,min=1,unique=ResourceID,dive"`
}

type MountResourceBase struct {
	ResourceID   string `json:"resource_id,string" binding:"required,min=1"`              // 挂接资源ID
	ResourceName string `json:"resource_name" binding:"required,TrimSpace,min=1,max=255"` // 挂接资源名称
}

/*type CreateReqBodyParams struct {
	Source     int8   `json:"source" binding:"required,oneof=1 2"`                                       // 数据来源 1 认知平台自动创建 2 人工创建
	CodePrefix string `json:"code_profix" binding:"required,min=1,max=40"`                               // 目录编码前缀（类、项、目码+细节码）
	TableType  int8   `json:"table_type" binding:"required,oneof=1 2"`                                   // 库表类型 1 贴源表 2 标准表
	Orgcode    string `json:"orgcode" binding:"required,uuid"`                                           // 所属部门ID
	Orgname    string `json:"orgname" binding:"required,TrimSpace,min=1,max=200"`                        // 所属部门名称
	Uid        string `json:"uid" binding:"required_if=Source 1,omitempty,TrimSpace,min=1,max=50"`       // 创建用户ID
	UserName   string `json:"user_name" binding:"required_if=Source 1,omitempty,TrimSpace,min=1,max=50"` // 创建用户名称
	CatalogBaseInfo
	Columns        []*CreateColumnItem  `json:"columns" binding:"required,min=1,unique=ColumnName,dive"`                                  // 关联信息项
	MountResources []*MountResourceItem `json:"mount_resources" binding:"required_if=Source 1,omitempty,min=1,max=2,unique=ResType,dive"` // 挂接资源(source为2即页面人工创建时该参数不需要填写)
	OwnerId        string               `json:"owner_id" binding:"required_if=Source 2,omitempty,uuid"`                                   // 目录数据owner的用户ID
	OwnerName      string               `json:"owner_name" binding:"required_if=Source 2,omitempty,min=1,max=255"`                        // 目录数据owner的用户名称
	FormViewID     string               `json:"form_view_id" binding:"required_if=Source 2,omitempty,uuid"`                               // 编目数据表视图ID(仅source为2即页面人工创建时该参数必须填写)
}*/

/*type UpdateReqBodyParams struct {
	Source    int8   `json:"source" binding:"omitempty,oneof=1 2"  default:"2"`  // 数据来源 1 认知平台自动创建 2 人工创建
	TableType int8   `json:"table_type" binding:"required,oneof=1 2"`            // 库表类型 1 贴源表 2 标准表
	Orgcode   string `json:"orgcode" binding:"required,uuid"`                    // 所属部门ID
	Orgname   string `json:"orgname" binding:"required,TrimSpace,min=1,max=200"` // 所属部门名称
	CatalogBaseInfo
	Columns             []*UpdateColumnItem `json:"columns" binding:"required,min=1,unique=ColumnName,dive"`           // 关联信息项
	ComprehensionStatus int8                `json:"comprehension_status" binding:"omitempty"`                          // 理解状态，单个值
	OwnerId             string              `json:"owner_id" binding:"required_if=Source 2,omitempty,uuid"`            // 目录数据owner的用户ID
	OwnerName           string              `json:"owner_name" binding:"required_if=Source 2,omitempty,min=1,max=255"` // 目录数据owner的用户名称
}*/

type ReqPathParams struct {
	CatalogID models.ModelID `uri:"catalogID" binding:"required,VerifyModelID"`
}

type PageInfo struct {
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                                       // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at name mount_source_name" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序; name: 按名称排序, mount_source_name: 按挂接资源名称排序。默认按创建时间排序
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                                            // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=10" binding:"omitempty,min=0,max=100" default:"10"`                                                    // 每页大小，默认10，为0表示获取全部
}

func (p PageInfo) ToReqPageInfo() *request.PageInfo {
	return &request.PageInfo{
		PageBaseInfo: request.PageBaseInfo{
			Offset: p.Offset,
			Limit:  p.Limit,
		},
		Direction: p.Direction,
		Sort:      p.Sort,
	}
}

type ReqFormParams struct {
	request.CatalogListReqBase
	PageInfo
}

type ReqColumnFormParams struct {
	Keyword string `form:"keyword" binding:"omitempty,TrimSpace"`
	PageInfo
}

type VerifyResourceMountReq struct {
	ResourceType int8   `json:"res_type" form:"res_type" binding:"required,oneof=1 2"` // 挂接资源类型 1逻辑视图 2 接口
	ResourceIDs  string `json:"res_ids" form:"res_ids" binding:"required,min=1"`       // 多个资源ID用英文逗号分隔
}

type VerifyFormViewMountReq struct {
	FormViewIDs string `json:"form_view_ids" form:"form_view_ids" binding:"required,min=1,VerifyMultiUUIDString"` // 多个数据表视图ID用英文逗号分隔
}

type ReqAuditApplyParams struct {
	CatalogID models.ModelID `uri:"catalogID" binding:"required,VerifyModelID"` // 目录ID
	FlowType  int            `uri:"flowType" binding:"required,oneof=1 3 4"`    // 审批流程类型 1 上线 2 变更 3 下线 4 发布（暂时只支持上线 下线 发布）
}

type CatalogBriefInfoReq struct {
	CatalogIds      string `json:"catalog_ids" form:"catalog_ids" binding:"required"`
	IsComprehension bool   `json:"is_comprehension" form:"is_comprehension,default=true" binding:"omitempty"`
}

type ReqAuditorsGetParams struct {
	ApplyID        string `uri:"applyID" binding:"required,min=20,max=60" example:""`       // 审核申请ID
	AuditGroupType int    `form:"auditGroupType" binding:"omitempty,oneof=1 2" example:"1"` // 审核组类型 1 下载审核  2 发布/上线/下线审核
}
