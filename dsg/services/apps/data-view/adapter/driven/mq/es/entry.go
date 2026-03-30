package es

type FormViewESIndex struct {
	Type string              `json:"type"`
	Body FormViewESIndexBody `json:"body"`
}

type FormViewESIndexBody struct {
	ID              string      `json:"id"`
	DocID           string      `json:"docid"`
	Code            string      `json:"code"`
	Name            string      `json:"name"`
	NameEn          string      `json:"name_en"`
	Description     string      `json:"description"`
	OwnerID         string      `json:"data_owner_id"`
	OwnerName       string      `json:"data_owner_name"`
	OnlineAt        int64       `json:"online_at"`
	UpdatedAt       int64       `json:"updated_at"`
	IsPublish       bool        `json:"is_publish"`
	IsOnline        bool        `json:"is_online"`
	PublishedAt     int64       `json:"published_at"`
	PublishedStatus string      `json:"published_status"`
	OnlineStatus    string      `json:"online_status"`
	FieldCount      int         `json:"field_count"`
	Fields          []*FieldObj `json:"fields"`
	CateInfos       []*CateInfo `json:"cate_info"`
}

type FieldObj struct {
	FieldNameZH string `json:"field_name_zh"`
	FieldNameEN string `json:"field_name_en"`
}

type CateInfo struct {
	CateId   string `json:"cate_id"`
	NodeId   string `json:"node_id"`
	NodeName string `json:"node_name"`
	NodePath string `json:"node_path"`
}
