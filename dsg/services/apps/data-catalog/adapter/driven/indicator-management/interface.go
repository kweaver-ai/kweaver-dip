package indicator_management

import (
	"context"
	"time"
)

type Repo interface {
	// GetIndicatorDetail 根据指标ID获取指标详情
	GetIndicatorDetail(ctx context.Context, req *GetIndicatorDetailReq) (*IndicatorDetailResp, error)
}

// region GetIndicatorDetail
type GetIndicatorDetailReq struct {
	IndicatorID string `json:"-" uri:"id" binding:"required"` // 指标ID
}

// IndicatorDetailResp 与indicator-management项目保持一致的结构
type IndicatorDetailResp struct {
	// 嵌入基础属性
	IndicatorDetailBaseProperty
	// 嵌入管理属性
	IndicatorDetailMgntProperty
	// 嵌入管理属性扩展
	IndicatorMgntProperty
	// 其他属性
	WhereInfo           interface{} `json:"where_info"`                  // 限定内容
	UpdateCycle         string      `json:"update_cycle"`                // 更新周期
	DimModelID          uint64      `json:"dimensional_model_id,string"` // 维度模型ID
	DimModelName        string      `json:"dimensional_model_name"`      // 维度模型名称
	AtomicIndicatorID   string      `json:"atomic_indicator_id"`         // 原子指标ID
	AtomicIndicatorName string      `json:"atomic_indicator_name"`       // 原子指标名称
	FactTableID         string      `json:"fact_table_id"`               // 维度模型下事实表ID
	Expression          string      `json:"expression"`                  // 表达式
	AnalysisDim         []Dimension `json:"analysis_dimensions"`         // 分析维度
	SceneAnalysisID     string      `json:"scene_analysis_id"`           // 场景分析ID
	ViewID              string      `json:"refer_view_id"`               //  引用视图ID
	ViewName            string      `json:"refer_view_name"`             // 引用视图名称
	ExecSQL             string      `json:"exec_sql"`                    // 指标执行sql
	DateMark            Dimension   `json:"date_mark"`                   // 日期标识
	ViewFullPath        string      `json:"view_full_path"`              // 指标依赖的全路径
}

// 指标详情基础属性
type IndicatorDetailBaseProperty struct {
	ID                    uint64 `json:"id,string"`               // 指标ID
	Name                  string `json:"name"`                    // 指标名称
	Description           string `json:"description"`             // 指标描述
	Code                  string `json:"code"`                    // 指标编码
	IndicatorUnit         string `json:"indicator_unit"`          // 指标单位
	BusinessIndicatorID   string `json:"business_indicator_id"`   // 业务指标ID
	BusinessIndicatorName string `json:"business_indicator_name"` // 业务指标名称
	Level                 string `json:"level"`                   // 指标等级
}

// 指标详情管理属性
type IndicatorDetailMgntProperty struct {
	DomainID      string     `json:"domain_id"`      // 主题域ID
	DomainName    string     `json:"domain_name"`    // 主题域名称
	DomainPathID  string     `json:"domain_path_id"` // 主题域节点id的path
	ReferCount    int32      `json:"refer_count"`    // 被引用的数量
	UpdatedAt     *time.Time `json:"updated_at"`     // 更新时间戳
	UpdaterUID    string     `json:"updater_uid"`    // 更新用户ID
	UpdaterName   string     `json:"updater_name"`   // 更新用户名称
	CreatedAt     *time.Time `json:"created_at"`     // 创建用户id
	CreatorUid    string     `json:"creator_uid"`    // 创建用户ID
	CreatorName   string     `json:"creator_name"`   // 创建用户名称
	IndicatorType string     `json:"indicator_type"` // 指标类型
}

// 指标管理属性
type IndicatorMgntProperty struct {
	OwnerID     string `json:"owner_id"`      // 指标负责人ID
	OwnerName   string `json:"owner_name"`    // 指标负责人名称
	MgntDepID   string `json:"mgnt_dep_id"`   // 管理部门ID
	MgntDepName string `json:"mgnt_dep_name"` // 管理部门名称
	MgntPath    string `json:"mgnt_path"`     // 管理路径
}

// 指标负责人
type IndicatorOwner struct {
	OwnerID   string `json:"user_id"`    // 负责人ID - 注意：这里用user_id而不是owner_id
	OwnerName string `json:"owner_name"` // 负责人名称
}

// 维度信息
type Dimension struct {
	TableID           string `json:"table_id"`                // 表ID
	FieldID           string `json:"field_id"`                // 字段ID
	FieldNameZH       string `json:"field_name_zh"`           // 字段中文名称
	FieldNameEN       string `json:"field_name_en"`           // 字段英文名称
	FieldType         string `json:"field_type"`              // 字段类型
	OriginalFieldType string `json:"original_field_type"`     // 原始字段类型
	IsRequired        bool   `json:"is_required,omitempty"`   // 是否必填
	DefaultValue      string `json:"default_value,omitempty"` // 默认值
}

//endregion
