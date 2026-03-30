package data_catalog

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
)

type NameIDResp struct {
	ID   uint64 `json:"id,string"`
	Name string `json:"name"`
}

/*
type CatalogDetailResp struct {
	ID                 uint64                      `json:"id,string"`                    // 唯一id，雪花算法
	Code               string                      `json:"code"`                         // 目录编码
	Title              string                      `json:"title"`                        // 目录名称
	GroupID            uint64                      `json:"group_id,string,omitempty"`    // 数据资源目录分类ID
	GroupName          string                      `json:"group_name,omitempty"`         // 数据资源目录分类名称
	ThemeID            uint64                      `json:"theme_id,string,omitempty"`    // 主题分类ID
	ThemeName          string                      `json:"theme_name,omitempty"`         // 主题分类名称
	ForwardVersionID   uint64                      `json:"forward_version_id,omitempty"` // 当前目录前一版本目录ID
	Description        string                      `json:"description,omitempty"`        // 资源目录描述
	Version            string                      `json:"version"`                      // 目录版本号，默认初始版本为0.0.0.1
	DataRange          int32                       `json:"data_range,omitempty"`         // 数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县
	UpdateCycle        int32                       `json:"update_cycle,omitempty"`       // 更新频率 参考数据字典：GXZQ，1不定时 2实时 3每日 4每周 5每月 6每季度 7每半年 8每年 9其他
	DataKind           int32                       `json:"data_kind"`                    // 基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他  可组合，如 人和地 即 1|2 = 3
	SharedType         int8                        `json:"shared_type"`                  // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	SharedCondition    string                      `json:"shared_condition,omitempty"`   // 共享条件
	OpenType           int8                        `json:"open_type,omitempty"`          // 开放属性 1 向公众开放 2 不向公众开放
	OpenCondition      string                      `json:"open_condition,omitempty"`     // 开放条件
	SharedMode         int8                        `json:"shared_mode,omitempty"`        // 共享方式 1 共享平台方式 2 邮件方式 3 介质方式
	PhysicalDeletion   *int8                       `json:"physical_deletion,omitempty"`  // 挂接实体资源是否存在物理删除(1 是 ; 0 否)
	SyncMechanism      int8                        `json:"sync_mechanism,omitempty"`     // 数据归集机制(1 增量 ; 2 全量) ----归集到数据中台
	SyncFrequency      string                      `json:"sync_frequency,omitempty"`     // 数据归集频率 ----归集到数据中台
	ViewCount          int32                       `json:"View_count"`                   // 挂载视图数量
	ApiCount           int32                       `json:"api_count"`                    // 挂载接口数量
	State              int8                        `json:"state"`                        // 目录状态，1 草稿  3 已发布  5 已上线  8 已下线
	FlowNodeID         string                      `json:"flow_node_id"`                 // 目录当前所处审核流程结点ID
	FlowNodeName       string                      `json:"flow_node_name"`               // 目录当前所处审核流程结点名称
	FlowType           *int8                       `json:"flow_type"`                    // 审批流程类型 1 上线 2 变更 3 下线 4 发布
	FlowID             string                      `json:"flow_id"`                      // 审批流程ID
	FlowName           string                      `json:"flow_name"`                    // 审批流程名称
	FlowVersion        string                      `json:"flow_version"`                 // 审批流程版本
	Orgcode            string                      `json:"orgcode"`                      // 所属部门ID
	Orgname            string                      `json:"orgname"`                      // 所属部门名称
	CreatedAt          int64                       `json:"created_at"`                   // 创建时间戳
	CreatorUID         string                      `json:"creator_uid,omitempty"`        // 创建用户ID
	CreatorName        string                      `json:"creator_name,omitempty"`       // 创建用户名称
	UpdatedAt          int64                       `json:"updated_at"`                   // 更新时间戳
	UpdaterUID         string                      `json:"updater_uid,omitempty"`        // 更新用户ID
	UpdaterName        string                      `json:"updater_name,omitempty"`       // 更新用户名称
	DeletedAt          int64                       `json:"deleted_at,omitempty"`         // 删除时间戳
	DeleteUID          string                      `json:"delete_uid,omitempty"`         // 删除用户ID
	DeleteName         string                      `json:"delete_name,omitempty"`        // 删除用户名称
	Source             int8                        `json:"source"`                       // 数据来源 1 认知平台自动创建 2 人工创建
	TableType          int8                        `json:"table_type,omitempty"`         // 库表类型 1 贴源表 2 标准表
	CurrentVersion     *int8                       `json:"current_version,omitempty"`    // 是否先行版本 0 否 1 是
	PublishFlag        *int8                       `json:"publish_flag,omitempty"`       // 是否发布到超市 (1 是 ; 0 否)
	DataKindFlag       *int8                       `json:"data_kind_flag,omitempty"`     // 基础信息分类是否智能推荐 (1 是 ; 0 否)
	LabelFlag          *int8                       `json:"label_flag,omitempty"`         // 标签是否智能推荐 (1 是 ; 0 否)
	SrcEventFlag       *int8                       `json:"src_event_flag,omitempty"`     // 来源业务场景是否智能推荐 (1 是 ; 0 否)
	RelEventFlag       *int8                       `json:"rel_event_flag,omitempty"`     // 关联业务场景是否智能推荐 (1 是 ; 0 否)
	SystemFlag         *int8                       `json:"system_flag,omitempty"`        // 关联信息系统是否智能推荐 (1 是 ; 0 否)
	RelCatalogFlag     *int8                       `json:"rel_catalog_flag,omitempty"`   // 关联目录是否智能推荐 (1 是 ; 0 否)
	PublishedAt        int64                       `json:"published_at,omitempty"`       // 上线发布时间戳
	IsIndexed          *int8                       `json:"is_indexed"`                   // 是否已建ES索引，0 否 1 是，默认为0
	AuditState         *int8                       `json:"audit_state"`                  // 审核状态，1 审核中  2 通过  3 驳回
	AuditAdvice        string                      `json:"audit_advice"`                 // 审核意见
	OwnerId            string                      `json:"owner_id"`                     // 目录数据owner的用户ID
	OwnerName          string                      `json:"owner_name"`                   // 目录数据owner的用户名称
	GroupPath          []*common.TreeBase          `json:"group_path"`                   // 资源分类路径
	Infos              []*InfoItem                 `json:"infos"`                        // 关联信息
	MountResources     []*MountResourceItem        `json:"mount_resources"`              // 挂接资源
	Columns            []*model.TDataCatalogColumn `json:"columns"`                      // 关联信息项
	BusinessObjectPath []*common.BOPathItem        `json:"business_object_path"`         // 业务对象路径
	FormViewID         *string                     `json:"form_view_id"`                 // 数据表视图ID
}
*/

type CatalogListItem struct {
	ID                 uint64                   `json:"id,string"`            // 唯一id，雪花算法
	Code               string                   `json:"code"`                 // 目录编码
	Title              string                   `json:"title"`                // 目录名称
	Version            string                   `json:"version"`              // 目录版本号，默认初始版本为0.0.0.1
	Description        string                   `json:"description"`          // 目录的描述信息
	DataKind           int32                    `json:"data_kind"`            // 基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他  可组合，如 人和地 即 1|2 = 3
	State              int8                     `json:"state"`                // 目录状态，1 草稿  3 已发布  5 已上线  8 已下线
	FlowNodeID         string                   `json:"flow_node_id"`         // 目录当前所处审核流程结点ID
	FlowNodeName       string                   `json:"flow_node_name"`       // 目录当前所处审核流程结点名称
	FlowType           *int8                    `json:"flow_type"`            // 审批流程类型 1 上线 2 变更 3 下线 4 发布
	FlowID             string                   `json:"flow_id"`              // 审批流程ID
	FlowName           string                   `json:"flow_name"`            // 审批流程名称
	FlowVersion        string                   `json:"flow_version"`         // 审批流程版本
	Orgcode            string                   `json:"orgcode"`              // 所属部门ID
	Orgname            string                   `json:"orgname"`              // 所属部门名称
	OwnerId            string                   `json:"owner_id"`             // 目录数据owner的用户ID
	OwnerName          string                   `json:"owner_name"`           // 目录数据owner的用户名称
	OrgPaths           []string                 `json:"org_paths"`            // 所在部门的路径数组，数据理解任务用
	ViewCount          int32                    `json:"View_count"`           // 挂载视图数量
	ApiCount           int32                    `json:"api_count"`            // 挂载接口数量
	CreatedAt          int64                    `json:"created_at"`           // 创建时间戳
	UpdatedAt          int64                    `json:"updated_at"`           // 更新时间戳
	TableType          int8                     `json:"table_type"`           // 库表类型 1 贴源表 2 标准表/业务表
	Source             int8                     `json:"source"`               // 数据来源 1 认知平台自动创建 2 人工创建
	AuditState         *int8                    `json:"audit_state"`          // 审核状态，1 审核中  2 通过  3 驳回
	Operations         int32                    `json:"operations"`           // 可做的操作：1 编目；2 删除；4 生成接口；8 发布；16 上线；32 变更；64 下线；允许多个操作则进行或运算得到的结果即可
	Comprehension      ComprehensionCatalogInfo `json:"comprehension"`        //  数据理解需要的字段
	Labels             []*InfoBase              `json:"labels"`               // 资源标签数组
	BusinessObjectPath []*common.BOPathItem     `json:"business_object_path"` // 业务对象路径数组
	CreatorUID         string                   `json:"creator_uid"`          // 创建用户ID
	CreatorName        string                   `json:"creator_name"`         // 创建用户名称
}

type VerifyResourceMountAttachedInfo struct {
	ID   string `json:"id"`
	Code string `json:"code"`
}

type ComprehensionCatalogInfo struct {
	MountSourceName  string `json:"mount_source_name,omitempty"`          // 挂载的数据表名称
	Status           int8   `json:"status,omitempty"`                     // 理解状态
	UpdateTime       int64  `json:"comprehension_update_time,omitempty"`  // 理解更新时间
	ExceptionMessage string `json:"exception_message,omitempty"`          // 异常信息
	HasChange        bool   `json:"has_change"`                           // 是否有理解变更，红点逻辑
	Creator          string `json:"creator,omitempty"`                    // 理解创建人
	CreatedTime      int64  `json:"comprehension_created_time,omitempty"` // 理解创建时间
	UpdateBy         string `json:"update_by,omitempty"`                  // 理解更新人
}

type VerifyResourceMountResp struct {
	MountedResIDs []string                           `json:"mounted_res_ids"` // 已挂接或编目资源ID列表
	AttachedInfos []*VerifyResourceMountAttachedInfo `json:"attached_infos"`  // 已挂接或编目资源对应目录信息
}

type ListRespParam struct {
	response.PageResult[CatalogListItem]
}

// AuditUser
type AuditUser struct {
	UserId string `json:"user_id" binding:"TrimSpace"` // 审核员用户id
}

type OwnerGetResp struct {
	OwnerID   string `json:"owner_id"`   // 数据owner ID
	OwnerName string `json:"owner_name"` // 数据owner 名称
	Validity  bool   `json:"validity"`   // 是否有效owner true:有效 false:无效
}
