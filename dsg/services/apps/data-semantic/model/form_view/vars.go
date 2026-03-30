// Package form_view 库表视图Model
package form_view

// Table 表名
const Table = "form_view"

// 理解状态常量
const (
	StatusNotUnderstanding int8 = 0 // 未理解
	StatusUnderstanding    int8 = 1 // 理解中
	StatusPendingConfirm   int8 = 2 // 待确认
	StatusCompleted        int8 = 3 // 已完成
	StatusPublished        int8 = 4 // 已发布
	StatusFailed           int8 = 5 // 理解失败
)
