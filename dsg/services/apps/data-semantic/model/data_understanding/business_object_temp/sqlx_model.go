// Package business_object_temp 业务对象临时表Model (Sqlx实现)
package business_object_temp

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewBusinessObjectTempModelSqlx 创建BusinessObjectTempModelSqlx实例
func NewBusinessObjectTempModelSqlx(conn sqlx.SqlConn) *BusinessObjectTempModelSqlx {
	return &BusinessObjectTempModelSqlx{conn: conn}
}

// NewBusinessObjectTempModelSession 创建BusinessObjectTempModelSqlx实例 (使用 Session)
func NewBusinessObjectTempModelSession(session sqlx.Session) *BusinessObjectTempModelSqlx {
	return &BusinessObjectTempModelSqlx{conn: session}
}

// BusinessObjectTempModelSqlx BusinessObjectTempModel实现 (基于 go-zero Sqlx)
type BusinessObjectTempModelSqlx struct {
	conn sqlx.Session
}

// Insert 插入业务对象记录
func (m *BusinessObjectTempModelSqlx) Insert(ctx context.Context, data *BusinessObjectTemp) (*BusinessObjectTemp, error) {
	query := `INSERT IGNORE INTO t_business_object_temp (id, form_view_id, in_use, user_id, version, object_name)
	           VALUES (?, ?, ?, ?, ?, ?)`
	_, err := m.conn.ExecCtx(ctx, query, data.Id, data.FormViewId, data.InUse, data.UserId, data.Version, data.ObjectName)
	if err != nil {
		return nil, fmt.Errorf("insert business_object_temp failed: %w", err)
	}
	return data, nil
}

// WithTx 设置事务
func (m *BusinessObjectTempModelSqlx) WithTx(tx interface{}) BusinessObjectTempModel {
	session, ok := tx.(sqlx.Session)
	if !ok {
		return nil
	}
	return &BusinessObjectTempModelSqlx{conn: session}
}

// FindByFormViewAndVersion 根据form_view_id和version查询业务对象列表
func (m *BusinessObjectTempModelSqlx) FindByFormViewAndVersion(ctx context.Context, formViewId string, version int) ([]*BusinessObjectTemp, error) {
	var resp []*BusinessObjectTemp
	query := `SELECT id, form_view_id, in_use, user_id, version, object_name, created_at, updated_at, deleted_at
	           FROM t_business_object_temp
	           WHERE form_view_id = ? AND version = ? AND deleted_at IS NULL ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId, version)
	if err != nil {
		return nil, fmt.Errorf("find business_object_temp by form_view_id and version failed: %w", err)
	}
	return resp, nil
}

// FindOneById 根据id查询业务对象
func (m *BusinessObjectTempModelSqlx) FindOneById(ctx context.Context, id string) (*BusinessObjectTemp, error) {
	var resp BusinessObjectTemp
	query := `SELECT id, form_view_id, in_use, user_id, version, object_name, created_at, updated_at, deleted_at
	           FROM t_business_object_temp
	           WHERE id = ? AND deleted_at IS NULL LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	if err != nil {
		return nil, fmt.Errorf("find business_object_temp by id failed: %w", err)
	}
	return &resp, nil
}

// Update 更新业务对象名称和用户ID
func (m *BusinessObjectTempModelSqlx) Update(ctx context.Context, data *BusinessObjectTemp) error {
	query := `UPDATE t_business_object_temp
	           SET object_name = ?, user_id = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, data.ObjectName, data.UserId, data.Id)
	if err != nil {
		return fmt.Errorf("update business_object_temp failed: %w", err)
	}
	return nil
}

// FindLatestVersion 查询指定form_view_id的最新版本号
func (m *BusinessObjectTempModelSqlx) FindLatestVersion(ctx context.Context, formViewId string) (int, error) {
	var result struct {
		LatestVersion int `db:"latest_version"`
	}
	query := `SELECT COALESCE(MAX(version), 9) AS latest_version
	           FROM t_business_object_temp
	           WHERE form_view_id = ? AND deleted_at IS NULL`
	err := m.conn.QueryRowCtx(ctx, &result, query, formViewId)
	if err != nil {
		return 0, fmt.Errorf("find latest version by form_view_id failed: %w", err)
	}
	return result.LatestVersion, nil
}

// FindLatestVersionByFormViewId 查询指定form_view_id的最新版本号
func (m *BusinessObjectTempModelSqlx) FindLatestVersionByFormViewId(ctx context.Context, formViewId string) (int, error) {
	var result struct {
		LatestVersion int `db:"latest_version"`
	}
	query := `SELECT COALESCE(MAX(version), 9) AS latest_version
	           FROM t_business_object_temp
	           WHERE form_view_id = ? AND deleted_at IS NULL`
	err := m.conn.QueryRowCtx(ctx, &result, query, formViewId)
	if err != nil {
		return 0, fmt.Errorf("find latest version by form_view_id failed: %w", err)
	}
	return result.LatestVersion, nil
}

// FindLatestVersionWithLock 查询指定form_view_id的最新版本号（带行锁，用于防止并发冲突）
// 注意：查询包含逻辑删除的数据，以确保版本号递增正确（避免与已删除数据的唯一键冲突）
func (m *BusinessObjectTempModelSqlx) FindLatestVersionWithLock(ctx context.Context, formViewId string) (int, error) {
	var result struct {
		LatestVersion int `db:"latest_version"`
	}
	query := `SELECT COALESCE(MAX(version), 9) AS latest_version
	           FROM t_business_object_temp
	           WHERE form_view_id = ?
	           FOR UPDATE`
	err := m.conn.QueryRowCtx(ctx, &result, query, formViewId)
	if err != nil {
		return 0, fmt.Errorf("find latest version with lock by form_view_id failed: %w", err)
	}
	return result.LatestVersion, nil
}

// FindByFormViewIdLatest 查询指定form_view_id的最新版本业务对象列表
func (m *BusinessObjectTempModelSqlx) FindByFormViewIdLatest(ctx context.Context, formViewId string) ([]*BusinessObjectTemp, error) {
	// 先获取最新版本号
	latestVersion, err := m.FindLatestVersionByFormViewId(ctx, formViewId)
	if err != nil {
		return nil, err
	}
	// 如果版本号为初始值9，说明没有数据，返回空列表
	if latestVersion == 9 {
		return []*BusinessObjectTemp{}, nil
	}
	return m.FindByFormViewAndVersion(ctx, formViewId, latestVersion)
}

// DeleteByFormViewId 根据form_view_id删除所有业务对象
func (m *BusinessObjectTempModelSqlx) DeleteByFormViewId(ctx context.Context, formViewId string) error {
	query := `UPDATE t_business_object_temp SET deleted_at = NOW(3) WHERE form_view_id = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId)
	if err != nil {
		return fmt.Errorf("delete business_object_temp by form_view_id failed: %w", err)
	}
	return nil
}

// DeleteByFormViewIdAndInUse 根据 form_view_id 和 in_use 删除（删除当前使用的识别结果）
func (m *BusinessObjectTempModelSqlx) DeleteByFormViewIdAndInUse(ctx context.Context, formViewId string, inUse int8) error {
	query := `UPDATE t_business_object_temp SET deleted_at = NOW(3) WHERE form_view_id = ? AND in_use = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId, inUse)
	if err != nil {
		return fmt.Errorf("delete business_object_temp by form_view_id and in_use failed: %w", err)
	}
	return nil
}

// DeleteByFormViewIdAndVersion 根据form_view_id和version逻辑删除指定版本的业务对象
func (m *BusinessObjectTempModelSqlx) DeleteByFormViewIdAndVersion(ctx context.Context, formViewId string, version int) error {
	query := `UPDATE t_business_object_temp SET deleted_at = NOW(3) WHERE form_view_id = ? AND version = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId, version)
	if err != nil {
		return fmt.Errorf("delete business_object_temp by form_view_id and version failed: %w", err)
	}
	return nil
}

// DeleteById 根据id删除业务对象
func (m *BusinessObjectTempModelSqlx) DeleteById(ctx context.Context, id string) error {
	query := `UPDATE t_business_object_temp SET deleted_at = NOW(3) WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete business_object_temp by id failed: %w", err)
	}
	return nil
}

// UpdateInUse 更新 in_use 状态：将指定 form_view_id 的新版本设置为 1，历史版本设置为 0
func (m *BusinessObjectTempModelSqlx) UpdateInUse(ctx context.Context, formViewId string, newVersion int) error {
	// 1. 将该 form_view_id 的所有记录的 in_use 设置为 0（历史版本）
	query := `UPDATE t_business_object_temp
	           SET in_use = 0
	           WHERE form_view_id = ? AND deleted_at IS NULL`
	_, err := m.conn.ExecCtx(ctx, query, formViewId)
	if err != nil {
		return fmt.Errorf("update in_use to 0 failed: %w", err)
	}

	// 2. 将新版本的 in_use 设置为 1（当前使用）
	query = `UPDATE t_business_object_temp
	           SET in_use = 1
	           WHERE form_view_id = ? AND version = ? AND deleted_at IS NULL`
	_, err = m.conn.ExecCtx(ctx, query, formViewId, newVersion)
	if err != nil {
		return fmt.Errorf("update in_use to 1 failed: %w", err)
	}

	return nil
}
