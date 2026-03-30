package sub_service

// EnforceRequest 定义策略验证的请求
type EnforceRequest struct {
	// 操作者类型
	SubjectType string `json:"subject_type,omitempty"`
	// 操作者 ID
	SubjectID string `json:"subject_id,omitempty"`
	// 资源类型
	ObjectType string `json:"object_type,omitempty"`
	// 资源 ID
	ObjectID string `json:"object_id,omitempty"`
	// 操作者对资源执行的动作
	Action string `json:"action,omitempty"`
}

// EnforceResponse 定义策略验证的响应
type EnforceResponse struct {
	// 响应对应的请求
	EnforceRequest `json:",inline"`
	// 策略结果
	Effect string `json:"effect,omitempty"`
}
