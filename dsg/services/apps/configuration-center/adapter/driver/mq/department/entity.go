package department

type CreateDepartmentMessage struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ThirdDeptId string `json:"third_id"`
}

type DeleteDepartmentMessage struct {
	ID string `json:"id"`
}

type MoveDepartmentMessage struct {
	ID        string `json:"id"`
	OldPathId string `json:"old_path"`
	NewPathId string `json:"new_path"`
}
