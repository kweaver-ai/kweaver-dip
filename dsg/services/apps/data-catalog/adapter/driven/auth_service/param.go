package auth_service

// PolicyEnforceRespItem 策略验证返回
type PolicyEnforceRespItem struct {
	Action      string `json:"action"`
	Effect      string `json:"effect"`
	ObjectId    string `json:"object_id"`
	ObjectType  string `json:"object_type"`
	SubjectId   string `json:"subject_id"`
	SubjectType string `json:"subject_type"`
}

// PolicyDetailResp 策略详情返回
type PolicyDetailResp struct {
	ObjectId   string `json:"object_id"`
	ObjectName string `json:"object_name"`
	ObjectType string `json:"object_type"`
	OwnerId    string `json:"owner_id"`
	OwnerName  string `json:"owner_name"`
	Subjects   []struct {
		Departments []struct {
			DepartmentId   string `json:"department_id"`
			DepartmentName string `json:"department_name"`
		} `json:"departments"`

		Permissions []struct {
			Action string `json:"action"` //请求动作 view 查看 read 读取 download 下载
			Effect string `json:"effect"` //策略结果 allow 允许 deny 拒绝
		} `json:"permissions"`

		SubjectId   string `json:"subject_id"`
		SubjectName string `json:"subject_name"`
		SubjectType string `json:"subject_type"`
	} `json:"subjects"`
}

type Permission struct {
	Action string `json:"action"` //请求动作 view 查看 read 读取 download 下载
	Effect string `json:"effect"` //策略结果 allow 允许 deny 拒绝
}

// PolicyAvailableRespItem 访问者拥有的资源返回
type PolicyAvailableRespItem struct {
	ObjectId    string        `json:"object_id"`   //资源id
	ObjectType  string        `json:"object_type"` //资源类型 domain 主题域 data_catalog 数据目录 data_view 数据表视图 api 接口
	Permissions []*Permission `json:"permissions"`
}
