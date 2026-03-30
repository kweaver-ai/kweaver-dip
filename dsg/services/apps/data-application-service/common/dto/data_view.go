package dto

type DataView struct {
	DataViewId   string `json:"data_view_id" binding:"omitempty,uuid"` // 数据视图Id
	DataViewName string `json:"data_view_name" binding:"omitempty"`    // 数据视图名称
}
