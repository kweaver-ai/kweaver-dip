// Package business_object_attributes_temp 业务对象属性临时表Model (Sqlx实现)
package business_object_attributes_temp

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewBusinessObjectAttributesTempModelSqlx 创建BusinessObjectAttributesTempModelSqlx实例
func NewBusinessObjectAttributesTempModelSqlx(conn sqlx.SqlConn) *BusinessObjectAttributesTempModelSqlx {
	return &BusinessObjectAttributesTempModelSqlx{conn: conn}
}

// NewBusinessObjectAttributesTempModelSession 创建BusinessObjectAttributesTempModelSqlx实例 (使用 Session)
func NewBusinessObjectAttributesTempModelSession(session sqlx.Session) *BusinessObjectAttributesTempModelSqlx {
	return &BusinessObjectAttributesTempModelSqlx{conn: session}
}

// BusinessObjectAttributesTempModelSqlx BusinessObjectAttributesTempModel实现 (基于 go-zero Sqlx)
type BusinessObjectAttributesTempModelSqlx struct {
	conn sqlx.Session
}

// Insert 插入业务对象属性记录
func (m *BusinessObjectAttributesTempModelSqlx) Insert(ctx context.Context, data *BusinessObjectAttributesTemp) (*BusinessObjectAttributesTemp, error) {
	query := `INSERT IGNORE INTO t_business_object_attributes_temp (id, form_view_id, in_use, business_object_id, user_id, version, form_view_field_id, attr_name)
	           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := m.conn.ExecCtx(ctx, query, data.Id, data.FormViewId, data.InUse, data.BusinessObjectId, data.UserId, data.Version, data.FormViewFieldId, data.AttrName)
	if err != nil {
		return nil, fmt.Errorf("insert business_object_attributes_temp failed: %w", err)
	}
	return data, nil
}

// WithTx 设置事务
func (m *BusinessObjectAttributesTempModelSqlx) WithTx(tx interface{}) BusinessObjectAttributesTempModel {
	session, ok := tx.(sqlx.Session)
	if !ok {
		return nil
	}
	return &BusinessObjectAttributesTempModelSqlx{conn: session}
}

// FindByBusinessObjectId 根据business_object_id查询属性列表
func (m *BusinessObjectAttributesTempModelSqlx) FindByBusinessObjectId(ctx context.Context, businessObjectId string) ([]*BusinessObjectAttributesTemp, error) {
	var resp []*BusinessObjectAttributesTemp
	query := `SELECT id, form_view_id, in_use, business_object_id, user_id, version, form_view_field_id, attr_name, created_at, updated_at, deleted_at
	           FROM t_business_object_attributes_temp
	           WHERE business_object_id = ? AND deleted_at IS NULL ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, businessObjectId)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes_temp by business_object_id failed: %w", err)
	}
	return resp, nil
}

// FindByFormViewAndVersion 根据form_view_id和version查询所有属性
func (m *BusinessObjectAttributesTempModelSqlx) FindByFormViewAndVersion(ctx context.Context, formViewId string, version int) ([]*BusinessObjectAttributesTemp, error) {
	var resp []*BusinessObjectAttributesTemp
	query := `SELECT id, form_view_id, in_use, business_object_id, user_id, version, form_view_field_id, attr_name, created_at, updated_at, deleted_at
	           FROM t_business_object_attributes_temp
	           WHERE form_view_id = ? AND version = ? AND deleted_at IS NULL ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId, version)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes_temp by form_view_id and version failed: %w", err)
	}
	return resp, nil
}

// FindOneById 根据id查询属性
func (m *BusinessObjectAttributesTempModelSqlx) FindOneById(ctx context.Context, id string) (*BusinessObjectAttributesTemp, error) {
	var resp BusinessObjectAttributesTemp
	query := `SELECT id, form_view_id, in_use, business_object_id, user_id, version, form_view_field_id, attr_name, created_at, updated_at, deleted_at
	           FROM t_business_object_attributes_temp
	           WHERE id = ? AND deleted_at IS NULL LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes_temp by id failed: %w", err)
	}
	return &resp, nil
}

// Update 更新属性名称和用户ID
func (m *BusinessObjectAttributesTempModelSqlx) Update(ctx context.Context, data *BusinessObjectAttributesTemp) error {
	query := `UPDATE t_business_object_attributes_temp
	           SET attr_name = ?, user_id = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, data.AttrName, data.UserId, data.Id)
	if err != nil {
		return fmt.Errorf("update business_object_attributes_temp failed: %w", err)
	}
	return nil
}

// UpdateBusinessObjectId 更新属性归属的业务对象
func (m *BusinessObjectAttributesTempModelSqlx) UpdateBusinessObjectId(ctx context.Context, attributeId, businessObjectId string) error {
	query := `UPDATE t_business_object_attributes_temp
	           SET business_object_id = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, businessObjectId, attributeId)
	if err != nil {
		return fmt.Errorf("update business_object_id for attribute failed: %w", err)
	}
	return nil
}

// FieldWithAttrInfoTemp 属性关联字段信息（临时表）
type FieldWithAttrInfoTemp struct {
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
func (m *BusinessObjectAttributesTempModelSqlx) FindByBusinessObjectIdWithFieldInfo(ctx context.Context, businessObjectId string) ([]*FieldWithAttrInfoTemp, error) {
	var resp []*FieldWithAttrInfoTemp
	query := `SELECT boat.id, boat.business_object_id, boat.form_view_field_id, boat.attr_name,
	           fvf.technical_name AS field_tech_name,
	           COALESCE(ffit.field_business_name, fvf.business_name) AS field_business_name,
	           COALESCE(ffit.field_role, fvf.field_role) AS field_role,
	           fvf.data_type AS field_type,
	           COALESCE(ffit.field_description, fvf.field_description) AS field_description
	           FROM t_business_object_attributes_temp boat
	           INNER JOIN form_view_field fvf ON boat.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	           LEFT JOIN t_form_view_field_info_temp ffit ON ffit.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	               AND ffit.version = (
	                   SELECT MAX(version) FROM t_form_view_field_info_temp
	                   WHERE form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci AND deleted_at IS NULL
	               )
	               AND ffit.deleted_at IS NULL
	           WHERE boat.business_object_id = ? AND boat.deleted_at IS NULL AND fvf.deleted_at = 0
	           ORDER BY boat.id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, businessObjectId)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes_temp with field info failed: %w", err)
	}
	return resp, nil
}

// FindByFormViewAndVersionWithFieldInfo 根据form_view_id和version查询所有属性（包含字段信息）
func (m *BusinessObjectAttributesTempModelSqlx) FindByFormViewAndVersionWithFieldInfo(ctx context.Context, formViewId string, version int) ([]*FieldWithAttrInfoTemp, error) {
	var resp []*FieldWithAttrInfoTemp
	query := `SELECT boat.id, boat.business_object_id, boat.form_view_field_id, boat.attr_name,
	           fvf.technical_name AS field_tech_name,
	           COALESCE(ffit.field_business_name, fvf.business_name) AS field_business_name,
	           COALESCE(ffit.field_role, fvf.field_role) AS field_role,
	           fvf.data_type AS field_type,
	           COALESCE(ffit.field_description, fvf.field_description) AS field_description
	           FROM t_business_object_attributes_temp boat
	           INNER JOIN form_view_field fvf ON boat.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	           LEFT JOIN t_form_view_field_info_temp ffit ON ffit.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	               AND ffit.version = ?
	               AND ffit.deleted_at IS NULL
	           WHERE boat.form_view_id = ? AND boat.version = ? AND boat.deleted_at IS NULL AND fvf.deleted_at = 0
	           ORDER BY boat.id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId, version, formViewId, version)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes_temp with field info by form_view_id and version failed: %w", err)
	}
	return resp, nil
}

// FindByFormViewIdLatestWithFieldInfo 查询指定form_view_id的最新版本属性列表（包含字段信息）
func (m *BusinessObjectAttributesTempModelSqlx) FindByFormViewIdLatestWithFieldInfo(ctx context.Context, formViewId string) ([]*FieldWithAttrInfoTemp, error) {
	var resp []*FieldWithAttrInfoTemp
	query := `SELECT boat.id, boat.business_object_id, boat.form_view_field_id, boat.attr_name,
	           fvf.technical_name AS field_tech_name,
	           COALESCE(ffit.field_business_name, fvf.business_name) AS field_business_name,
	           COALESCE(ffit.field_role, fvf.field_role) AS field_role,
	           fvf.data_type AS field_type,
	           COALESCE(ffit.field_description, fvf.field_description) AS field_description
	           FROM t_business_object_attributes_temp boat
	           INNER JOIN form_view_field fvf ON boat.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	           LEFT JOIN t_form_view_field_info_temp ffit ON ffit.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	               AND ffit.version = (
	                   SELECT MAX(version) FROM t_form_view_field_info_temp
	                   WHERE form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci AND deleted_at IS NULL
	               )
	               AND ffit.deleted_at IS NULL
	           WHERE boat.form_view_id = ? AND boat.version = (
	               SELECT MAX(version) FROM t_business_object_attributes_temp
	               WHERE form_view_id = ? AND deleted_at IS NULL
	           ) AND boat.deleted_at IS NULL AND fvf.deleted_at = 0
	           ORDER BY boat.id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find business_object_attributes_temp with field info by form_view_id latest failed: %w", err)
	}
	return resp, nil
}

// DeleteByFormViewId 根据form_view_id删除所有属性
func (m *BusinessObjectAttributesTempModelSqlx) DeleteByFormViewId(ctx context.Context, formViewId string) error {
	query := `UPDATE t_business_object_attributes_temp SET deleted_at = NOW(3) WHERE form_view_id = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId)
	if err != nil {
		return fmt.Errorf("delete business_object_attributes_temp by form_view_id failed: %w", err)
	}
	return nil
}

// DeleteByFormViewIdAndInUse 根据 form_view_id 和 in_use 删除（删除当前使用的识别结果）
func (m *BusinessObjectAttributesTempModelSqlx) DeleteByFormViewIdAndInUse(ctx context.Context, formViewId string, inUse int8) error {
	query := `UPDATE t_business_object_attributes_temp SET deleted_at = NOW(3) WHERE form_view_id = ? AND in_use = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId, inUse)
	if err != nil {
		return fmt.Errorf("delete business_object_attributes_temp by form_view_id and in_use failed: %w", err)
	}
	return nil
}

// DeleteByFormViewIdAndVersion 根据form_view_id和version逻辑删除指定版本的属性
func (m *BusinessObjectAttributesTempModelSqlx) DeleteByFormViewIdAndVersion(ctx context.Context, formViewId string, version int) error {
	query := `UPDATE t_business_object_attributes_temp SET deleted_at = NOW(3) WHERE form_view_id = ? AND version = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId, version)
	if err != nil {
		return fmt.Errorf("delete business_object_attributes_temp by form_view_id and version failed: %w", err)
	}
	return nil
}

// DeleteById 根据id删除属性
func (m *BusinessObjectAttributesTempModelSqlx) DeleteById(ctx context.Context, id string) error {
	query := `UPDATE t_business_object_attributes_temp SET deleted_at = NOW(3) WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete business_object_attributes_temp by id failed: %w", err)
	}
	return nil
}

// UnidentifiedFieldInfo 未识别字段信息
type UnidentifiedFieldInfo struct {
	Id            string  `db:"id"`
	TechnicalName string  `db:"technical_name"`
	DataType      string  `db:"data_type"`
	BusinessName  *string `db:"business_name"`
	FieldRole     *int8   `db:"field_role"`
	Description   *string `db:"description"`
}

// FindUnidentifiedFieldsLatest 查询未识别字段（attr_name 和 business_object_id 为空的字段）
// 返回最新版本中未识别的字段列表
func (m *BusinessObjectAttributesTempModelSqlx) FindUnidentifiedFieldsLatest(ctx context.Context, formViewId string) ([]*UnidentifiedFieldInfo, error) {
	var resp []*UnidentifiedFieldInfo
	query := `SELECT boat.id, fvf.technical_name, fvf.data_type,
	           COALESCE(ffit.field_business_name, fvf.business_name) AS business_name,
	           COALESCE(ffit.field_role, fvf.field_role) AS field_role,
	           COALESCE(ffit.field_description, fvf.field_description) AS description
	           FROM t_business_object_attributes_temp boat
	           INNER JOIN form_view_field fvf ON boat.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	           LEFT JOIN t_form_view_field_info_temp ffit ON ffit.form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci
	               AND ffit.form_view_id = ?
	               AND ffit.version = (
	                   SELECT MAX(version) FROM t_form_view_field_info_temp
	                   WHERE form_view_field_id = fvf.id COLLATE utf8mb4_unicode_ci AND deleted_at IS NULL
	               )
	               AND ffit.deleted_at IS NULL
	           WHERE boat.form_view_id = ? AND boat.version = (
	               SELECT MAX(version) FROM t_business_object_attributes_temp
	               WHERE form_view_id = ? AND deleted_at IS NULL
	           ) AND (boat.business_object_id = '' OR boat.business_object_id IS NULL)
	             AND (boat.attr_name = '' OR boat.attr_name IS NULL)
	             AND boat.deleted_at IS NULL AND fvf.deleted_at = 0
	           ORDER BY boat.id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId, formViewId, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find unidentified fields latest failed: %w", err)
	}
	return resp, nil
}

// FindLatestVersionWithLock 查询指定form_view_id的最新版本号（带行锁，用于防止并发冲突）
// 注意：查询包含逻辑删除的数据，以确保版本号递增正确（避免与已删除数据的唯一键冲突）
func (m *BusinessObjectAttributesTempModelSqlx) FindLatestVersionWithLock(ctx context.Context, formViewId string) (int, error) {
	var result struct {
		LatestVersion int `db:"latest_version"`
	}
	query := `SELECT COALESCE(MAX(version), 9) AS latest_version
	           FROM t_business_object_attributes_temp
	           WHERE form_view_id = ?
	           FOR UPDATE`
	err := m.conn.QueryRowCtx(ctx, &result, query, formViewId)
	if err != nil {
		return 0, fmt.Errorf("find latest version with lock by form_view_id failed: %w", err)
	}
	return result.LatestVersion, nil
}

// FindByFormViewIdLatest 查询指定form_view_id的最新版本属性列表
func (m *BusinessObjectAttributesTempModelSqlx) FindByFormViewIdLatest(ctx context.Context, formViewId string) ([]*BusinessObjectAttributesTemp, error) {
	// 先获取最新版本号
	latestVersion, err := m.FindLatestVersionByFormViewId(ctx, formViewId)
	if err != nil {
		return nil, err
	}
	// 如果版本号为初始值9，说明没有数据，返回空列表
	if latestVersion == 9 {
		return []*BusinessObjectAttributesTemp{}, nil
	}
	return m.FindByFormViewAndVersion(ctx, formViewId, latestVersion)
}

// FindLatestVersionByFormViewId 查询指定form_view_id的最新版本号
func (m *BusinessObjectAttributesTempModelSqlx) FindLatestVersionByFormViewId(ctx context.Context, formViewId string) (int, error) {
	var result struct {
		LatestVersion int `db:"latest_version"`
	}
	query := `SELECT COALESCE(MAX(version), 9) AS latest_version
	           FROM t_business_object_attributes_temp
	           WHERE form_view_id = ? AND deleted_at IS NULL`
	err := m.conn.QueryRowCtx(ctx, &result, query, formViewId)
	if err != nil {
		return 0, fmt.Errorf("find latest version by form_view_id failed: %w", err)
	}
	return result.LatestVersion, nil
}

// UpdateInUse 更新 in_use 状态：将指定 form_view_id 的新版本设置为 1，历史版本设置为 0
func (m *BusinessObjectAttributesTempModelSqlx) UpdateInUse(ctx context.Context, formViewId string, newVersion int) error {
	// 1. 将该 form_view_id 的所有记录的 in_use 设置为 0（历史版本）
	query := `UPDATE t_business_object_attributes_temp
	           SET in_use = 0
	           WHERE form_view_id = ? AND deleted_at IS NULL`
	_, err := m.conn.ExecCtx(ctx, query, formViewId)
	if err != nil {
		return fmt.Errorf("update in_use to 0 failed: %w", err)
	}

	// 2. 将新版本的 in_use 设置为 1（当前使用）
	query = `UPDATE t_business_object_attributes_temp
	           SET in_use = 1
	           WHERE form_view_id = ? AND version = ? AND deleted_at IS NULL`
	_, err = m.conn.ExecCtx(ctx, query, formViewId, newVersion)
	if err != nil {
		return fmt.Errorf("update in_use to 1 failed: %w", err)
	}

	return nil
}
