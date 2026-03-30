package af_business

import (
	"context"
	"time"
)

type AFBusinessInterface interface {
	// 业务表
	BusinessFormStandard() BusinessFormStandardInterface
	// 业务模型
	BusinessModel() BusinessModelInterface
	// 业务域
	Domain() DomainInterface
	// 用户
	User() UserInterface
}

type BusinessFormStandardInterface interface {
	Get(ctx context.Context, businessFormID string) (*BusinessFormStandard, error)
}

type BusinessFormStandard struct {
	BusinessFormID  string    `json:"business_form_id,omitempty"`
	BusinessModelID string    `json:"business_model_id,omitempty"`
	Name            string    `json:"name,omitempty"`
	Description     string    `json:"description,omitempty"`
	SourceSystem    []string  `json:"source_system,omitempty" gorm:"serializer:json"`
	UpdatedAt       time.Time `json:"updated_at,omitempty"`
	UpdatedByUID    int       `json:"updated_by_uid,omitempty"`
}

type BusinessModelInterface interface {
	Get(ctx context.Context, businessModelID string) (*BusinessModel, error)
}
type BusinessModel struct {
	BusinessModelID  string `json:"business_model_id,omitempty"`
	BusinessDomainID string `json:"business_domain_id,omitempty"`
	Name             string `json:"name,omitempty"`
}

type DomainInterface interface {
	Get(ctx context.Context, id string) (*Domain, error)
}
type Domain struct {
	ID             string   `json:"id,omitempty"`
	DepartmentID   string   `json:"department_id,omitempty"`
	BusinessSystem []string `json:"business_system,omitempty" gorm:"serializer:json"`
}

type UserInterface interface {
	Get(ctx context.Context, id int) (*User, error)
}
type User struct {
	ID     int
	UserID string
	Name   string
}
