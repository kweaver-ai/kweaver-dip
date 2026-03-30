// Package form_view 库表视图Model
package form_view

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewFormViewModel 创建FormViewModel实例 (使用 go-zero Sqlx)
func NewFormViewModel(conn sqlx.SqlConn) *FormViewModelSqlx {
	return &FormViewModelSqlx{conn: conn}
}

// NewFormViewModelSession 创建FormViewModel实例 (使用 Session)
func NewFormViewModelSession(session sqlx.Session) *FormViewModelSqlx {
	return &FormViewModelSqlx{conn: session}
}

// FormViewModelSqlx FormViewModel实现 (基于 go-zero Sqlx)
type FormViewModelSqlx struct {
	conn sqlx.Session
}

// WithTx 设置事务
func (m *FormViewModelSqlx) WithTx(tx interface{}) FormViewModel {
	session, ok := tx.(sqlx.Session)
	if !ok {
		return nil
	}
	return &FormViewModelSqlx{conn: session}
}

// FindOneById 根据id查询库表视图
func (m *FormViewModelSqlx) FindOneById(ctx context.Context, id string) (*FormView, error) {
	var resp FormView
	query := `SELECT id, understand_status, technical_name, business_name, description, mdl_id, created_at, updated_at FROM form_view WHERE id = ? LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	if err != nil {
		return nil, fmt.Errorf("find form_view by id failed: %w", err)
	}
	return &resp, nil
}

// GetTechnicalName 获取表技术名称
func (m *FormViewModelSqlx) GetTechnicalName(ctx context.Context, id string) (string, error) {
	var result struct {
		TechnicalName string `db:"technical_name"`
	}
	query := `SELECT technical_name FROM form_view WHERE id = ? LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &result, query, id)
	if err != nil {
		return "", fmt.Errorf("get technical_name failed: %w", err)
	}
	return result.TechnicalName, nil
}

// GetTableInfo 获取表信息 (包含状态和技术名称)
func (m *FormViewModelSqlx) GetTableInfo(ctx context.Context, id string) (*FormViewTableInfo, error) {
	var resp FormViewTableInfo
	query := `SELECT id, understand_status, technical_name FROM form_view WHERE id = ? LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, id)
	if err != nil {
		return nil, fmt.Errorf("get table info failed: %w", err)
	}
	return &resp, nil
}

// UpdateUnderstandStatus 更新理解状态
func (m *FormViewModelSqlx) UpdateUnderstandStatus(ctx context.Context, id string, status int8) error {
	query := `UPDATE form_view SET understand_status = ? WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("update form_view understand_status failed: %w", err)
	}
	return nil
}

// UpdateBusinessInfo 更新库表业务名称和描述
func (m *FormViewModelSqlx) UpdateBusinessInfo(ctx context.Context, id string, businessName *string, description *string) error {
	query := `UPDATE form_view SET business_name = ?, description = ? WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, businessName, description, id)
	if err != nil {
		return fmt.Errorf("update form_view business info failed: %w", err)
	}
	return nil
}

// FormViewTableInfo 表信息结构
type FormViewTableInfo struct {
	Id              string `db:"id"`
	UnderstandStatus int8  `db:"understand_status"`
	TechnicalName   string `db:"technical_name"`
}

// FuzzyMatchByName 根据业务名称或描述模糊匹配视图
func (m *FormViewModelSqlx) FuzzyMatchByName(ctx context.Context, name string) ([]*FormView, error) {
	var resp []*FormView
	query := `SELECT id, understand_status, technical_name, business_name, description, mdl_id, created_at, updated_at
	           FROM form_view
	           WHERE (business_name LIKE ? OR description LIKE ?) ORDER BY business_name ASC`
	err := m.conn.QueryRowsCtx(ctx, &resp, query, "%"+name+"%", "%"+name+"%")
	if err != nil {
		return nil, fmt.Errorf("fuzzy match form_view by name failed: %w", err)
	}
	return resp, nil
}
