package dto

import "time"

type SubjectObjectsRes PageResult[SubjectObjectsResEntity]

type SubjectObjectsResEntity struct {
	ObjectId    string                              `json:"object_id,omitempty"`
	ObjectType  string                              `json:"object_type,omitempty"`
	Permissions []SubjectObjectsResEntityPermission `json:"permissions,omitempty"`
	// 权限过期时间。nil 代表永久有效
	ExpiredAt *time.Time `json:"expired_at,omitempty"`
}

type SubjectObjectsResEntityPermission struct {
	Action string `json:"action,omitempty"`
	Effect string `json:"effect,omitempty"`
}
