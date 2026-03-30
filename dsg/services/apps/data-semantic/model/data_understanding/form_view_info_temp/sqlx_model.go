// Package form_view_info_temp 库表信息临时表Model (Sqlx实现)
package form_view_info_temp

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewFormViewInfoTempModelSqlx 创建FormViewInfoTempModelSqlx实例
func NewFormViewInfoTempModelSqlx(conn sqlx.SqlConn) *FormViewInfoTempModelSqlx {
	return &FormViewInfoTempModelSqlx{conn: conn}
}

// NewFormViewInfoTempModelSession 创建FormViewInfoTempModelSqlx实例 (使用 Session)
func NewFormViewInfoTempModelSession(session sqlx.Session) *FormViewInfoTempModelSqlx {
	return &FormViewInfoTempModelSqlx{conn: session}
}

// FormViewInfoTempModelSqlx FormViewInfoTempModel实现 (基于 go-zero Sqlx)
type FormViewInfoTempModelSqlx struct {
	conn sqlx.Session
}

// Insert 插入库表信息临时记录
func (m *FormViewInfoTempModelSqlx) Insert(ctx context.Context, data *FormViewInfoTemp) (*FormViewInfoTemp, error) {
	query := `INSERT IGNORE INTO t_form_view_info_temp (id, form_view_id, user_id, version, table_business_name, table_description)
	           VALUES (?, ?, ?, ?, ?, ?)`
	_, err := m.conn.ExecCtx(ctx, query, data.Id, data.FormViewId, data.UserId, data.Version, data.TableBusinessName, data.TableDescription)
	if err != nil {
		return nil, fmt.Errorf("insert form_view_info_temp failed: %w", err)
	}
	return data, nil
}

// FindLatestByFormViewId 查询指定form_view_id的最新版本记录
func (m *FormViewInfoTempModelSqlx) FindLatestByFormViewId(ctx context.Context, formViewId string) (*FormViewInfoTemp, error) {
	var resp FormViewInfoTemp
	query := `SELECT id, form_view_id, user_id, version, table_business_name, table_description, created_at, updated_at, deleted_at
	           FROM t_form_view_info_temp
	           WHERE form_view_id = ? AND deleted_at IS NULL ORDER BY version DESC LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find latest form_view_info_temp by form_view_id failed: %w", err)
	}
	return &resp, nil
}

// FindOneByFormViewAndVersion 根据form_view_id和version查询记录
func (m *FormViewInfoTempModelSqlx) FindOneByFormViewAndVersion(ctx context.Context, formViewId string, version int) (*FormViewInfoTemp, error) {
	var resp FormViewInfoTemp
	query := `SELECT id, form_view_id, user_id, version, table_business_name, table_description, created_at, updated_at, deleted_at
	           FROM t_form_view_info_temp
	           WHERE form_view_id = ? AND version = ? AND deleted_at IS NULL LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, formViewId, version)
	if err != nil {
		return nil, fmt.Errorf("find form_view_info_temp by form_view_id and version failed: %w", err)
	}
	return &resp, nil
}

// Update 更新库表信息和用户ID
func (m *FormViewInfoTempModelSqlx) Update(ctx context.Context, data *FormViewInfoTemp) error {
	query := `UPDATE t_form_view_info_temp
	           SET table_business_name = ?, table_description = ?, user_id = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, data.TableBusinessName, data.TableDescription, data.UserId, data.Id)
	if err != nil {
		return fmt.Errorf("update form_view_info_temp failed: %w", err)
	}
	return nil
}

// DeleteByFormViewId 逻辑删除指定form_view_id的所有记录
func (m *FormViewInfoTempModelSqlx) DeleteByFormViewId(ctx context.Context, formViewId string) error {
	query := `UPDATE t_form_view_info_temp SET deleted_at = NOW(3) WHERE form_view_id = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId)
	if err != nil {
		return fmt.Errorf("delete form_view_info_temp by form_view_id failed: %w", err)
	}
	return nil
}

// FindLatestVersionWithLock 查询指定form_view_id的最新版本号（带行锁，用于防止并发冲突）
// 注意：查询包含逻辑删除的数据，以确保版本号递增正确（避免与已删除数据的唯一键冲突）
func (m *FormViewInfoTempModelSqlx) FindLatestVersionWithLock(ctx context.Context, formViewId string) (int, error) {
	var result struct {
		LatestVersion int `db:"latest_version"`
	}
	query := `SELECT COALESCE(MAX(version), 9) AS latest_version
	           FROM t_form_view_info_temp
	           WHERE form_view_id = ?
	           FOR UPDATE`
	err := m.conn.QueryRowCtx(ctx, &result, query, formViewId)
	if err != nil {
		return 0, fmt.Errorf("find latest version with lock by form_view_id failed: %w", err)
	}
	return result.LatestVersion, nil
}
