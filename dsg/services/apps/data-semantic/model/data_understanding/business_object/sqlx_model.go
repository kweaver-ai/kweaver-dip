// Package business_object 业务对象正式表Model (Sqlx实现)
package business_object

import (
	"context"
	"fmt"
	"strings"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewBusinessObjectModelSqlx 创建BusinessObjectModelSqlx实例
func NewBusinessObjectModelSqlx(conn sqlx.SqlConn) *BusinessObjectModelSqlx {
	return &BusinessObjectModelSqlx{conn: conn}
}

// NewBusinessObjectModelSession 创建BusinessObjectModelSqlx实例 (使用 Session)
func NewBusinessObjectModelSession(session sqlx.Session) *BusinessObjectModelSqlx {
	return &BusinessObjectModelSqlx{conn: session}
}

// BusinessObjectModelSqlx BusinessObjectModel实现 (基于 go-zero Sqlx)
type BusinessObjectModelSqlx struct {
	conn sqlx.Session
}

// Insert 插入业务对象记录
func (m *BusinessObjectModelSqlx) Insert(ctx context.Context, data *BusinessObject) (*BusinessObject, error) {
	query := `INSERT IGNORE INTO t_business_object (id, object_name, object_type, form_view_id, mdl_id, status)
	           VALUES (?, ?, ?, ?, ?, ?)`
	_, err := m.conn.ExecCtx(ctx, query, data.Id, data.ObjectName, data.ObjectType, data.FormViewId, data.MdlId, data.Status)
	if err != nil {
		return nil, fmt.Errorf("insert business_object failed: %w", err)
	}
	return data, nil
}

// Update 更新业务对象
func (m *BusinessObjectModelSqlx) Update(ctx context.Context, data *BusinessObject) error {
	query := `UPDATE t_business_object
	           SET object_name = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, data.ObjectName, data.Id)
	if err != nil {
		return fmt.Errorf("update business_object failed: %w", err)
	}
	return nil
}

// Delete 逻辑删除业务对象
func (m *BusinessObjectModelSqlx) Delete(ctx context.Context, id string) error {
	query := `UPDATE t_business_object SET deleted_at = NOW(3) WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete business_object failed: %w", err)
	}
	return nil
}

// WithTx 设置事务
func (m *BusinessObjectModelSqlx) WithTx(tx interface{}) BusinessObjectModel {
	session, ok := tx.(sqlx.Session)
	if !ok {
		return nil
	}
	return &BusinessObjectModelSqlx{conn: session}
}

// FindByFormViewId 根据form_view_id查询业务对象列表
func (m *BusinessObjectModelSqlx) FindByFormViewId(ctx context.Context, formViewId string) ([]*BusinessObject, error) {
	var resp []*BusinessObject
	query := `SELECT id, object_name, object_type, form_view_id, mdl_id, status, created_at, updated_at, deleted_at
	           FROM t_business_object
	           WHERE form_view_id = ? AND deleted_at IS NULL ORDER BY id ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, formViewId)
	if err != nil {
		return nil, fmt.Errorf("find business_object by form_view_id failed: %w", err)
	}
	return resp, nil
}

// FindByFormViewIdAndObjectName 根据form_view_id和object_name查询单个业务对象
func (m *BusinessObjectModelSqlx) FindByFormViewIdAndObjectName(ctx context.Context, formViewId string, objectName string) (*BusinessObject, error) {
	var resp BusinessObject
	query := `SELECT id, object_name, object_type, form_view_id, mdl_id, status, created_at, updated_at, deleted_at
	           FROM t_business_object
	           WHERE form_view_id = ? AND object_name = ? AND deleted_at IS NULL LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, formViewId, objectName)
	if err != nil {
		return nil, fmt.Errorf("find business_object by form_view_id and object_name failed: %w", err)
	}
	return &resp, nil
}

// FindOneById 根据id查询业务对象
func (m *BusinessObjectModelSqlx) FindOneById(ctx context.Context, id string) (*BusinessObject, error) {
	var resp BusinessObject
	query := `SELECT id, object_name, object_type, form_view_id, mdl_id, status, created_at, updated_at, deleted_at
	           FROM t_business_object
	           WHERE id = ? AND deleted_at IS NULL LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	if err != nil {
		return nil, fmt.Errorf("find business_object by id failed: %w", err)
	}
	return &resp, nil
}

// DeleteByFormViewId 根据form_view_id删除所有业务对象
func (m *BusinessObjectModelSqlx) DeleteByFormViewId(ctx context.Context, formViewId string) error {
	query := `UPDATE t_business_object SET deleted_at = NOW(3) WHERE form_view_id = ?`
	_, err := m.conn.ExecCtx(ctx, query, formViewId)
	if err != nil {
		return fmt.Errorf("delete business_object by form_view_id failed: %w", err)
	}
	return nil
}

// BatchUpdateMdlId 批量更新业务对象的 mdl_id
func (m *BusinessObjectModelSqlx) BatchUpdateMdlId(ctx context.Context, ids []string, mdlId string) error {
	if len(ids) == 0 {
		return nil
	}
	query := `UPDATE t_business_object SET mdl_id = ? WHERE id IN (?` + strings.Repeat(",?", len(ids)-1) + `)`
	args := make([]interface{}, 0, len(ids)+1)
	args = append(args, mdlId)
	for _, id := range ids {
		args = append(args, id)
	}
	_, err := m.conn.ExecCtx(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("batch update mdl_id failed: %w", err)
	}
	return nil
}

// BatchInsertFromTemp 从临时表批量插入业务对象
func (m *BusinessObjectModelSqlx) BatchInsertFromTemp(ctx context.Context, formViewId string, version int) (int, error) {
	query := `INSERT INTO t_business_object (id, object_name, object_type, form_view_id, mdl_id, status)
	           SELECT id, object_name, 0, form_view_id, '', 1
	           FROM t_business_object_temp
	           WHERE form_view_id = ? AND version = ? AND deleted_at IS NULL`
	result, err := m.conn.ExecCtx(ctx, query, formViewId, version)
	if err != nil {
		return 0, fmt.Errorf("batch insert business_object from temp failed: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	return int(rowsAffected), nil
}

// CountByFormViewId 根据form_view_id统计业务对象数量
func (m *BusinessObjectModelSqlx) CountByFormViewId(ctx context.Context, formViewId string) (int64, error) {
	var count int64
	query := `SELECT COUNT(*) FROM t_business_object WHERE form_view_id = ? AND deleted_at IS NULL`
	err := m.conn.QueryRowCtx(ctx, &count, query, formViewId)
	if err != nil {
		return 0, fmt.Errorf("count business_object by form_view_id failed: %w", err)
	}
	return count, nil
}

// FuzzyMatchByName 根据名称模糊匹配业务对象
func (m *BusinessObjectModelSqlx) FuzzyMatchByName(ctx context.Context, name string) ([]*BusinessObject, error) {
	var resp []*BusinessObject
	query := `SELECT id, object_name, object_type, form_view_id, mdl_id, status, created_at, updated_at, deleted_at
	           FROM t_business_object
	           WHERE object_name LIKE ? AND deleted_at IS NULL ORDER BY object_name ASC`
	pattern := "%" + name + "%"
	logx.Infof("FuzzyMatchByName: name=%s, pattern=%s", name, pattern)
	err := m.conn.QueryRowsCtx(ctx, &resp, query, pattern)
	if err != nil {
		return nil, fmt.Errorf("fuzzy match business_object by name failed: %w", err)
	}
	logx.Infof("FuzzyMatchByName: found %d records", len(resp))
	return resp, nil
}
