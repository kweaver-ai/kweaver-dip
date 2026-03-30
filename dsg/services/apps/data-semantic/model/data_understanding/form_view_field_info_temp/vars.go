// Package form_view_field_info_temp 库表字段信息临时表Model
package form_view_field_info_temp

// 字段角色常量
const (
	FieldRoleBusinessKey   int8 = 1 // 业务主键
	FieldRoleRelation      int8 = 2 // 关联标识
	FieldRoleBusinessState int8 = 3 // 业务状态
	FieldRoleTimeField     int8 = 4 // 时间字段
	FieldRoleMetric        int8 = 5 // 业务指标
	FieldRoleFeature       int8 = 6 // 业务特征
	FieldRoleAudit         int8 = 7 // 审计字段
	FieldRoleTechnical     int8 = 8 // 技术字段
)
