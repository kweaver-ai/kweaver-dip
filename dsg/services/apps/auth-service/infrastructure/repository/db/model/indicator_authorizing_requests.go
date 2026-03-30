package model

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"

	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

const TableNameIndicatorAuthorizingRequests = "indicator_authorizing_requests"

type IndicatorAuthorizingRequest struct {
	// 雪花 ID，无业务意义
	SnowflakeID uint64 `gorm:"column:snowflake_id;not null;comment:雪花 ID，无业务意义" json:"snowflake_id,omitempty"`
	// ID
	ID string `gorm:"column:id;comment:id" json:"id,omitempty"`

	// 授权申请的定义，以 JSON 序列化。包括指标；被授权的用户；被授权的动作发起
	// 申请的用户，申请的理由
	Spec []byte `gorm:"column:spec;not null" json:"spec,omitempty"`
	// 策略请求当前所处的阶段
	Phase string `gorm:"column:phase;not null" json:"phase,omitempty"`
	// 策略请求处于当前阶段的原因，人类可读，不是面向机器
	Message string `gorm:"column:message;not null" json:"message,omitempty"`

	CreatedAt time.Time             `json:"created_at,omitempty"`
	UpdatedAt time.Time             `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at"` // 更新时间
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}

// TableName IndicatorAuthorizingRequest's table name
func (_ IndicatorAuthorizingRequest) TableName() string {
	return TableNameIndicatorAuthorizingRequests
}

func (r *IndicatorAuthorizingRequest) BeforeCreate(_ *gorm.DB) (err error) {
	// 生成雪花 ID
	if r.SnowflakeID == 0 {
		if r.SnowflakeID, err = utils.GetUniqueID(); err != nil {
			return
		}
	}
	return
}

// MarshalAPIObject 生成 API 对象
func (r *IndicatorAuthorizingRequest) MarshalAPIObject() (*v1.IndicatorAuthorizingRequest, error) {
	out := &v1.IndicatorAuthorizingRequest{}
	if err := r.MarshalAPIObjectInto(out); err != nil {
		return nil, err
	}
	return out, nil
}

// MarshalAPIObjectInto 生成 API 对象
func (r *IndicatorAuthorizingRequest) MarshalAPIObjectInto(out *v1.IndicatorAuthorizingRequest) error {
	rr := v1.IndicatorAuthorizingRequest{
		ID:                r.ID,
		CreationTimestamp: r.CreatedAt,
		Status: v1.IndicatorAuthorizingRequestStatus{
			Phase:   v1.IndicatorAuthorizingRequestPhase(r.Phase),
			Message: r.Message,
		},
	}

	if err := json.Unmarshal(r.Spec, &rr.Spec); err != nil {
		return err
	}

	*out = rr

	return nil
}

// UnmarshalAPIObject 从 API 对象生成数据库对象
func (r *IndicatorAuthorizingRequest) UnmarshalAPIObject(in *v1.IndicatorAuthorizingRequest) error {
	spec, err := json.Marshal(in.Spec)
	if err != nil {
		return err
	}

	r.ID = in.ID
	r.Spec = spec
	r.Phase = string(in.Status.Phase)
	r.Message = in.Status.Message
	r.CreatedAt = in.CreationTimestamp

	return nil
}
