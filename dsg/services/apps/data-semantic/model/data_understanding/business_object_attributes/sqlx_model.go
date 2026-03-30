// Package business_object_attributes 业务对象属性正式表Model (Sqlx实现)
package business_object_attributes

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewBusinessObjectAttributesModelSqlx 创建BusinessObjectAttributesModelSqlx实例
func NewBusinessObjectAttributesModelSqlx(conn sqlx.SqlConn) *BusinessObjectAttributesModelSqlx {
	return &BusinessObjectAttributesModelSqlx{conn: conn}
}

// NewBusinessObjectAttributesModelSession 创建BusinessObjectAttributesModelSqlx实例 (使用 Session)
func NewBusinessObjectAttributesModelSession(session sqlx.Session) *BusinessObjectAttributesModelSqlx {
	return &BusinessObjectAttributesModelSqlx{conn: session}
}

// BusinessObjectAttributesModelSqlx BusinessObjectAttributesModel实现 (基于 go-zero Sqlx)
type BusinessObjectAttributesModelSqlx struct {
	conn sqlx.Session
}

// Insert 插入业务对象属性记录
func (m *BusinessObjectAttributesModelSqlx) Insert(ctx context.Context, data *BusinessObjectAttributes) (*BusinessObjectAttributes, error) {
	query := `INSERT IGNORE INTO t_business_object_attributes (id, form_view_id, business_object_id, form_view_field_id, attr_name)
	           VALUES (?, ?, ?, ?, ?)`
	_, err := m.conn.ExecCtx(ctx, query, data.Id, data.FormViewId, data.BusinessObjectId, data.FormViewFieldId, data.AttrName)
	if err != nil {
		return nil, fmt.Errorf("insert business_object_attributes failed: %w", err)
	}
	return data, nil
}

// Update 更新属性
func (m *BusinessObjectAttributesModelSqlx) Update(ctx context.Context, data *BusinessObjectAttributes) error {
	query := `UPDATE t_business_object_attributes
	           SET attr_name = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, data.AttrName, data.Id)
	if err != nil {
		return fmt.Errorf("update business_object_attributes failed: %w", err)
	}
	return nil
}

// FindOneById 根据id查询属性
func (m *BusinessObjectAttributesModelSqlx) FindOneById(ctx context.Context, id string) (*BusinessObjectAttributes, error) {
	var resp BusinessObjectAttributes
	query := `SELECT id, form_view_id, business_object_id, form_view_field_id, attr_name, created_at, updated_at, deleted_at
	           FROM t_business_object_attributes
	           WHERE id = ? AND deleted_at IS NULL LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes by id failed: %w", err)
	}
	return &resp, nil
}

// UpdateBusinessObjectId 更新属性归属的业务对象
func (m *BusinessObjectAttributesModelSqlx) UpdateBusinessObjectId(ctx context.Context, attributeId, businessObjectId string) error {
	query := `UPDATE t_business_object_attributes
	           SET business_object_id = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, businessObjectId, attributeId)
	if err != nil {
		return fmt.Errorf("update business_object_id for attribute failed: %w", err)
	}
	return nil
}

// BatchInsert 批量插入属性
func (m *BusinessObjectAttributesModelSqlx) BatchInsert(ctx context.Context, data []*BusinessObjectAttributes) (int, error) {
	if len(data) == 0 {
		return 0, nil
	}

	query := `INSERT IGNORE INTO t_business_object_attributes (id, form_view_id, business_object_id, form_view_field_id, attr_name)
	           VALUES `
	args := make([]interface{}, 0, len(data)*5)
	placeholders := make([]string, 0, len(data))

	for _, item := range data {
		placeholders = append(placeholders, "(?, ?, ?, ?, ?)")
		args = append(args, item.Id, item.FormViewId, item.BusinessObjectId, item.FormViewFieldId, item.AttrName)
	}

	query += fmt.Sprintf("%s", placeholders[0])
	for i := 1; i < len(placeholders); i++ {
		query += ", " + placeholders[i]
	}

	result, err := m.conn.ExecCtx(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("batch insert business_object_attributes failed: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	return int(rowsAffected), nil
}

// BatchUpdate 批量更新属性
func (m *BusinessObjectAttributesModelSqlx) BatchUpdate(ctx context.Context, data []*BusinessObjectAttributes) error {
	if len(data) == 0 {
		return nil
	}

	// 使用 CASE WHEN 批量更新
	query := `UPDATE t_business_object_attributes
	           SET business_object_id = CASE id `
	args := make([]interface{}, 0)
	ids := make([]string, 0, len(data))

	for _, item := range data {
		query += "WHEN ? THEN ? "
		args = append(args, item.Id, item.BusinessObjectId)
		ids = append(ids, item.Id)
	}

	query += `END,
	           attr_name = CASE id `
	for _, item := range data {
		query += "WHEN ? THEN ? "
		args = append(args, item.Id, item.AttrName)
	}

	query += `END WHERE id IN (`
	for i, id := range ids {
		if i > 0 {
			query += ", "
		}
		query += "?"
		args = append(args, id)
	}
	query += `)`

	_, err := m.conn.ExecCtx(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("batch update business_object_attributes failed: %w", err)
	}
	return nil
}

// Delete 逻辑删除属性
func (m *BusinessObjectAttributesModelSqlx) Delete(ctx context.Context, id string) error {
	query := `UPDATE t_business_object_attributes SET deleted_at = NOW(3) WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete business_object_attributes failed: %w", err)
	}
	return nil
}

// WithTx 设置事务
func (m *BusinessObjectAttributesModelSqlx) WithTx(tx interface{}) BusinessObjectAttributesModel {
	session, ok := tx.(sqlx.Session)
	if !ok {
		return nil
	}
	return &BusinessObjectAttributesModelSqlx{conn: session}
}

// FindByBusinessObjectId 根据business_object_id查询属性列表
func (m *BusinessObjectAttributesModelSqlx) FindByBusinessObjectId(ctx context.Context, businessObjectId string) ([]*BusinessObjectAttributes, error) {
	var resp []*BusinessObjectAttributes
	query := `SELECT id, form_view_id, business_object_id, form_view_field_id, attr_name, created_at, updated_at, deleted_at
	           FROM t_business_object_attributes
	           WHERE business_object_id = ? AND deleted_at IS NULL ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, businessObjectId)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes by business_object_id failed: %w", err)
	}
	return resp, nil
}

// FindByFormViewId 根据form_view_id查询所有属性
func (m *BusinessObjectAttributesModelSqlx) FindByFormViewId(ctx context.Context, formViewId string) ([]*BusinessObjectAttributes, error) {
	var resp []*BusinessObjectAttributes
	query := `SELECT id, form_view_id, business_object_id, form_view_field_id, attr_name, created_at, updated_at, deleted_at
	           FROM t_business_object_attributes
	           WHERE form_view_id = ? AND deleted_at IS NULL ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes by form_view_id failed: %w", err)
	}
	return resp, nil
}

// FieldWithAttrInfo 属性关联字段信息
type FieldWithAttrInfo struct {
	Id                string  `db:"id"`
	BusinessObjectId  string  `db:"business_object_id"`
	FormViewFieldId   string  `db:"form_view_field_id"`
	AttrName          string  `db:"attr_name"`
	FieldTechName     string  `db:"field_tech_name"`
	FieldBusinessName *string `db:"field_business_name"`
	FieldRole         *int8   `db:"field_role"`
	FieldType         string  `db:"field_type"`
	Description       *string `db:"field_description"`
}

// FindByBusinessObjectIdWithFieldInfo 根据business_object_id查询属性列表（包含字段信息）
func (m *BusinessObjectAttributesModelSqlx) FindByBusinessObjectIdWithFieldInfo(ctx context.Context, businessObjectId string) ([]*FieldWithAttrInfo, error) {
	var resp []*FieldWithAttrInfo
	query := `SELECT boa.id, boa.business_object_id, boa.form_view_field_id, boa.attr_name,
	           fvf.technical_name AS field_tech_name, fvf.business_name AS field_business_name,
	           fvf.field_role, fvf.data_type AS field_type, fvf.field_description
	           FROM t_business_object_attributes boa
	           INNER JOIN form_view_field fvf ON boa.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	           WHERE boa.business_object_id = ? AND boa.deleted_at IS NULL AND fvf.deleted_at = 0
	           ORDER BY boa.id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, businessObjectId)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes with field info failed: %w", err)
	}
	return resp, nil
}

// DeleteByFormViewId 根据form_view_id删除所有属性
func (m *BusinessObjectAttributesModelSqlx) DeleteByFormViewId(ctx context.Context, formViewId string) error {
	query := `UPDATE t_business_object_attributes SET deleted_at = NOW(3) WHERE form_view_id = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId)
	if err != nil {
		return fmt.Errorf("delete business_object_attributes by form_view_id failed: %w", err)
	}
	return nil
}

// DeleteByFormViewAndField 根据form_view_id和form_view_field_id删除属性（保证一个字段只能绑定一个属性）
func (m *BusinessObjectAttributesModelSqlx) DeleteByFormViewAndField(ctx context.Context, formViewId string, formViewFieldId string) error {
	query := `UPDATE t_business_object_attributes SET deleted_at = NOW(3) WHERE form_view_id = ? AND form_view_field_id = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId, formViewFieldId)
	if err != nil {
		return fmt.Errorf("delete business_object_attributes by form_view and field failed: %w", err)
	}
	return nil
}

// BatchInsertFromTemp 从临时表批量插入属性
func (m *BusinessObjectAttributesModelSqlx) BatchInsertFromTemp(ctx context.Context, formViewId string, version int) (int, error) {
	query := `INSERT INTO t_business_object_attributes (id, form_view_id, business_object_id, form_view_field_id, attr_name)
	           SELECT id, form_view_id, business_object_id, form_view_field_id, attr_name
	           FROM t_business_object_attributes_temp
	           WHERE form_view_id = ? AND version = ? AND deleted_at IS NULL`
	result, err := m.conn.ExecCtx(ctx, query, formViewId, version)
	if err != nil {
		return 0, fmt.Errorf("batch insert business_object_attributes from temp failed: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	return int(rowsAffected), nil
}

// FindUnrecognizedFields 查询未识别字段（business_object_id 和 attr_name 都为空的记录）
func (m *BusinessObjectAttributesModelSqlx) FindUnrecognizedFields(ctx context.Context, formViewId string) ([]*UnrecognizedFieldInfo, error) {
	var resp []*UnrecognizedFieldInfo
	query := `SELECT boa.id, boa.form_view_field_id,
	           fvf.technical_name AS field_tech_name, fvf.business_name AS field_business_name,
	           fvf.field_role, fvf.data_type AS field_type, fvf.field_description
	           FROM t_business_object_attributes boa
	           INNER JOIN form_view_field fvf ON boa.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	           WHERE boa.form_view_id = ? AND boa.business_object_id = '' AND boa.attr_name = '' AND boa.deleted_at IS NULL
	           ORDER BY boa.id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find unrecognized fields failed: %w", err)
	}
	return resp, nil
}

// UnrecognizedFieldInfo 未识别字段信息
type UnrecognizedFieldInfo struct {
	Id                string  `db:"id"`
	FormViewFieldId   string  `db:"form_view_field_id"`
	FieldTechName     string  `db:"field_tech_name"`
	FieldBusinessName *string `db:"field_business_name"`
	FieldRole         *int8   `db:"field_role"`
	FieldType         string  `db:"field_type"`
	Description       *string `db:"field_description"`
}
