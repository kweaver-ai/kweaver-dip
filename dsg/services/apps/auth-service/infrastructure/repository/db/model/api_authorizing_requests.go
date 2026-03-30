package model

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"

	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

const TableNameAPIAuthorizingRequests = "api_authorizing_requests"

type APIAuthorizingRequest struct {
	// Sonyflake ID，无业务意义
	SonyflakeID uint64 `gorm:"column:sonyflake_id;not null;comment:Sonyflake ID" json:"sonyflake_id,omitempty"`
	// ID
	ID string `gorm:"column:id;comment:id" json:"id,omitempty"`

	// 授权申请的定义，以 JSON 序列化。包括接口；被授权的用户；被授权的动作发起
	// 申请的用户，申请的理由
	Spec []byte `gorm:"column:spec;not null" json:"spec,omitempty"`
	// 授权申请当前所处的阶段
	Phase string `gorm:"column:phase;not null" json:"phase,omitempty"`
	// 授权申请处于当前阶段的原因，人类可读，不是面向机器
	Message string `gorm:"column:message;not null" json:"message,omitempty"`

	CreatedAt time.Time             `json:"created_at,omitempty"`
	UpdatedAt time.Time             `gorm:"column:updated_at;not null;autoUpdateTime;comment:更新时间" json:"updated_at"` // 更新时间
	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}

// TableName APIAuthorizingRequest's table name
func (APIAuthorizingRequest) TableName() string {
	return TableNameAPIAuthorizingRequests
}

func (r *APIAuthorizingRequest) BeforeCreate(tx *gorm.DB) (err error) {
	// 生成雪花 ID
	if r.SonyflakeID == 0 {
		if r.SonyflakeID, err = utils.GetUniqueID(); err != nil {

			return tx.AddError(err)
		}
	}
	return
}

// MarshalAPIObject 生成 API 对象
func (r *APIAuthorizingRequest) MarshalAPIObject() (*v1.APIAuthorizingRequest, error) {
	out := &v1.APIAuthorizingRequest{}
	if err := r.MarshalAPIObjectInto(out); err != nil {
		return nil, err
	}
	return out, nil
}

// MarshalAPIObjectInto 生成 API 对象
func (r *APIAuthorizingRequest) MarshalAPIObjectInto(out *v1.APIAuthorizingRequest) error {
	rr := v1.APIAuthorizingRequest{
		ID: r.ID,
		Status: v1.APIAuthorizingRequestStatus{
			Phase:   v1.APIAuthorizingRequestPhase(r.Phase),
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
func (r *APIAuthorizingRequest) UnmarshalAPIObject(in *v1.APIAuthorizingRequest) error {
	spec, err := json.Marshal(in.Spec)
	if err != nil {
		return err
	}

	r.ID = in.ID
	r.Spec = spec
	r.Phase = string(in.Status.Phase)
	r.Message = in.Status.Message

	return nil
}
