package gorm

type ServiceUpdateOptions struct {
	Filter  Filter  `json:"filter,omitempty"`
	OrderBy OrderBy `json:"order_by,omitempty"`
	Limit   int     `json:"limit,omitempty"`
}
