package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameLogicViewAuthorizingRequests = "logic_view_authorizing_requests"

type LogicViewAuthorizingRequest struct {
	// 雪花 ID，无业务意义
	SnowflakeID uint64 `gorm:"column:snowflake_id;not null;comment:雪花 ID，无业务意义" json:"snowflake_id,omitempty"`
	// ID
	ID string `gorm:"column:id;comment:id" json:"id,omitempty"`

	// 授权申请的定义，以 JSON 序列化。包括逻辑视图、行列规则（子视图）；被授权的
	// 用户；被授权的动作发起申请的用户，申请的理由
	Spec []byte `gorm:"column:spec;not null" json:"spec,omitempty"`
	// 策略请求当前所处的阶段
	Phase string `gorm:"column:phase;not null" json:"phase,omitempty"`
	// 策略请求处于当前阶段的原因，人类可读，不是面向机器
	Message string `gorm:"column:message;not null" json:"message,omitempty"`
	// 审核流程的 ID
	ApplyID string `gorm:"column:apply_id;not null" json:"apply_id,omitempty"`
	// 审核流程的 key
	ProcDefKey string `gorm:"column:proc_def_key;not null" json:"proc_def_key,omitempty"`
	// 逻辑视图授权申请被创建时，申请所引用的行列规则（子视图）的快照，以 JSON 序列化
	Snapshots []byte `gorm:"snapshots;not null" json:"snapshots,omitempty"`

	CreatedAt time.Time             `json:"created_at,omitempty"`
	UpdatedAt time.Time             `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at"` // 更新时间
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}

// TableName LogicViewAuthorizingRequest's table name
func (_ LogicViewAuthorizingRequest) TableName() string {
	return TableNameLogicViewAuthorizingRequests
}

func (r *LogicViewAuthorizingRequest) BeforeCreate(_ *gorm.DB) (err error) {
	// 生成雪花 ID
	if r.SnowflakeID == 0 {
		if r.SnowflakeID, err = utils.GetUniqueID(); err != nil {
			return
		}
	}

	// 生成 ID MariaDB 10.4.31 不支持 INSERT ... RETURNING 所以 db.Create 无
	// 法返回由 MariaDB 根据 DEFAULT 生成的字段，导致
	// LogicViewAuthorizingRequest.ID 为零值。
	if r.ID == "" {
		uuidV7, err := uuid.NewV7()
		if err != nil {
			return err
		}
		r.ID = uuidV7.String()
	}

	if r.Phase == "" {
		//r.Phase = string(dto.LogicViewAuthorizingRequestPending)
		r.Phase = "Pending"
	}

	if r.CreatedAt.IsZero() {
		r.CreatedAt = time.Now()
	}

	return
}
