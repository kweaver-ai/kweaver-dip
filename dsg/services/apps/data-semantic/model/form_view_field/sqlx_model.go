// Package form_view_field 字段Model
package form_view_field

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewFormViewFieldModel 创建FormViewFieldModel实例 (使用 go-zero Sqlx)
func NewFormViewFieldModel(conn sqlx.SqlConn) *FormViewFieldModelSqlx {
	return &FormViewFieldModelSqlx{conn: conn}
}

// NewFormViewFieldModelSession 创建FormViewFieldModelSqlx实例 (使用 Session)
func NewFormViewFieldModelSession(session sqlx.Session) *FormViewFieldModelSqlx {
	return &FormViewFieldModelSqlx{conn: session}
}

// FormViewFieldModelSqlx FormViewFieldModel实现 (基于 go-zero Sqlx)
type FormViewFieldModelSqlx struct {
	conn sqlx.Session
}

// WithTx 设置事务
func (m *FormViewFieldModelSqlx) WithTx(tx interface{}) FormViewFieldModel {
	session, ok := tx.(sqlx.Session)
	if !ok {
		return nil
	}
	return &FormViewFieldModelSqlx{conn: session}
}

// FindByFormViewId 根据form_view_id查询字段列表
func (m *FormViewFieldModelSqlx) FindByFormViewId(ctx context.Context, formViewId string) ([]*FormViewFieldBase, error) {
	var resp []*FormViewFieldBase
	query := `SELECT id, technical_name, data_type FROM form_view_field WHERE form_view_id = ? AND deleted_at = 0 ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find form_view_field by form_view_id failed: %w", err)
	}
	return resp, nil
}

// FindFullByFormViewId 根据form_view_id查询字段完整信息 (包含语义信息)
func (m *FormViewFieldModelSqlx) FindFullByFormViewId(ctx context.Context, formViewId string) ([]*FormViewField, error) {
	var resp []*FormViewField
	query := `SELECT id, form_view_id, technical_name, data_type, business_name, field_role, field_description, comment
	          FROM form_view_field WHERE form_view_id = ? AND deleted_at = 0 ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find form_view_field full info by form_view_id failed: %w", err)
	}
	return resp, nil
}

// UpdateBusinessInfo 更新字段业务名称、角色和描述
func (m *FormViewFieldModelSqlx) UpdateBusinessInfo(ctx context.Context, id string, businessName *string, fieldRole *int8, fieldDescription *string) error {
	query := `UPDATE form_view_field SET business_name = ?, field_role = ?, field_description = ? WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, businessName, fieldRole, fieldDescription, id)
	if err != nil {
		return fmt.Errorf("update form_view_field business info failed: %w", err)
	}
	return nil
}

// FieldBusinessInfoUpdate 字段业务信息更新结构
type FieldBusinessInfoUpdate struct {
	Id               string
	BusinessName     *string
	FieldRole        *int8
	FieldDescription *string
}

// BatchUpdateBusinessInfo 批量更新字段业务名称、角色和描述（使用 CASE WHEN 一次更新多条记录）
func (m *FormViewFieldModelSqlx) BatchUpdateBusinessInfo(ctx context.Context, updates []FieldBusinessInfoUpdate) error {
	if len(updates) == 0 {
		return nil
	}

	// 构建 CASE WHEN 语句
	var idParams []interface{}
	var businessNameParams []interface{}
	var fieldRoleParams []interface{}
	var fieldDescParams []interface{}

	for _, u := range updates {
		idParams = append(idParams, u.Id)
		businessNameParams = append(businessNameParams, u.BusinessName)
		fieldRoleParams = append(fieldRoleParams, u.FieldRole)
		fieldDescParams = append(fieldDescParams, u.FieldDescription)
	}

	// 构建批量更新的 SQL
	query := `UPDATE form_view_field SET
		business_name = CASE id `
	for range updates {
		query += `WHEN ? THEN ? `
	}
	query += `END,
		field_role = CASE id `
	for range updates {
		query += `WHEN ? THEN ? `
	}
	query += `END,
		field_description = CASE id `
	for range updates {
		query += `WHEN ? THEN ? `
	}
	query += `END
	WHERE id IN (`
	for i := range updates {
		if i > 0 {
			query += `,`
		}
		query += `?`
	}
	query += `)`

	// 合并所有参数
	var params []interface{}
	for i := range updates {
		params = append(params, idParams[i], businessNameParams[i])
	}
	for i := range updates {
		params = append(params, idParams[i], fieldRoleParams[i])
	}
	for i := range updates {
		params = append(params, idParams[i], fieldDescParams[i])
	}
	params = append(params, idParams...)

	_, err := m.conn.ExecCtx(ctx, query, params...)
	if err != nil {
		return fmt.Errorf("batch update form_view_field business info failed: %w", err)
	}
	return nil
}

// FormViewFieldBase 字段基础信息结构
type FormViewFieldBase struct {
	Id            string `db:"id"`
	FieldTechName string `db:"technical_name"`
	FieldType     string `db:"data_type"`
}
