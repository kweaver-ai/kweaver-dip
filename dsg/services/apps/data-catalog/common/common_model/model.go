package common_model

type SubjectInfo struct {
	SubjectID   string `json:"subject_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 所属主题id
	SubjectName string `json:"subject" binding:"required" example:"所属主题"`                                         // 所属主题
	SubjectPath string `json:"subject_path" example:"所属主题路径"`                                                     // 所属主题路径
}
type DepartmentInfo struct {
	DepartmentID   string `json:"department_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 所属部门id
	Department     string `json:"department" binding:"required" example:"所属部门"`                                         // 所属部门
	DepartmentPath string `json:"department_path" example:"所属部门路径"`                                                     // 所属部门路径
}
type InfoSystemInfo struct {
	InfoSystemID string `json:"info_system_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 信息系统id
	InfoSystem   string `json:"info_system" binding:"required" example:"信息系统名称"`                                       // 关联信息系统
}

type CategoryInfo struct {
	CategoryID     string `json:"category_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 资源属性分类id
	Category       string `json:"category" binding:"required" example:"资源属性分类"`                                       // 资源属性分类
	CategoryNodeID string `json:"category_node_id" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`                    // 资源属性分类节点id
	CategoryNode   string `json:"category_node" example:"资源属性分类节点"`                                                   // 资源属性分类节点
}
