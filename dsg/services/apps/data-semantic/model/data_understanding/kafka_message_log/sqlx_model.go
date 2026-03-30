// Package kafka_message_log Kafka消息处理记录Model (Sqlx实现)
package kafka_message_log

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// NewKafkaMessageLogModelSqlx 创建KafkaMessageLogModelSqlx实例
func NewKafkaMessageLogModelSqlx(conn sqlx.SqlConn) *KafkaMessageLogModelSqlx {
	return &KafkaMessageLogModelSqlx{conn: conn}
}

// NewKafkaMessageLogModelSession 创建KafkaMessageLogModelSqlx实例 (使用 Session)
func NewKafkaMessageLogModelSession(session sqlx.Session) *KafkaMessageLogModelSqlx {
	return &KafkaMessageLogModelSqlx{conn: session}
}

// KafkaMessageLogModelSqlx KafkaMessageLogModel实现 (基于 go-zero Sqlx)
type KafkaMessageLogModelSqlx struct {
	conn sqlx.Session
}

// Insert 插入Kafka消息处理记录
func (m *KafkaMessageLogModelSqlx) Insert(ctx context.Context, data *KafkaMessageLog) (*KafkaMessageLog, error) {
	query := `INSERT IGNORE INTO t_kafka_message_log (id, message_id, form_view_id, processed_at, status, error_msg)
	           VALUES (?, ?, ?, ?, ?, ?)`
	_, err := m.conn.ExecCtx(ctx, query, data.Id, data.MessageId, data.FormViewId, data.ProcessedAt, data.Status, data.ErrorMsg)
	if err != nil {
		return nil, fmt.Errorf("insert kafka message log failed: %w", err)
	}
	return data, nil
}

// Update 更新处理状态
func (m *KafkaMessageLogModelSqlx) Update(ctx context.Context, data *KafkaMessageLog) error {
	query := `UPDATE t_kafka_message_log
	           SET status = ?, error_msg = ?, processed_at = ?
	           WHERE id = ?`
	_, err := m.conn.ExecCtx(ctx, query, data.Status, data.ErrorMsg, data.ProcessedAt, data.Id)
	if err != nil {
		return fmt.Errorf("update kafka message log failed: %w", err)
	}
	return nil
}

// WithTx 设置事务
func (m *KafkaMessageLogModelSqlx) WithTx(tx interface{}) KafkaMessageLogModel {
	session, ok := tx.(sqlx.Session)
	if !ok {
		return nil
	}
	return &KafkaMessageLogModelSqlx{conn: session}
}

// FindOneByMessageId 根据消息ID查询记录
func (m *KafkaMessageLogModelSqlx) FindOneByMessageId(ctx context.Context, messageId string) (*KafkaMessageLog, error) {
	var resp KafkaMessageLog
	query := `SELECT id, message_id, form_view_id, processed_at, status, error_msg
	           FROM t_kafka_message_log
	           WHERE message_id = ? LIMIT 1`
	err := m.conn.QueryRowCtx(ctx, &resp, query, messageId)
	if err != nil {
		return nil, fmt.Errorf("find kafka message log by message_id failed: %w", err)
	}
	return &resp, nil
}

// ExistsByMessageId 检查消息ID是否已存在
func (m *KafkaMessageLogModelSqlx) ExistsByMessageId(ctx context.Context, messageId string) (bool, error) {
	var count int64
	query := `SELECT COUNT(*) FROM t_kafka_message_log WHERE message_id = ?`
	err := m.conn.QueryRowCtx(ctx, &count, query, messageId)
	if err != nil {
		return false, fmt.Errorf("exists kafka message log by message_id failed: %w", err)
	}
	return count > 0, nil
}

// ExistsSuccessByMessageId 检查消息ID是否已成功处理（status=1）
func (m *KafkaMessageLogModelSqlx) ExistsSuccessByMessageId(ctx context.Context, messageId string) (bool, error) {
	var count int64
	query := `SELECT COUNT(*) FROM t_kafka_message_log WHERE message_id = ? AND status = 1`
	err := m.conn.QueryRowCtx(ctx, &count, query, messageId)
	if err != nil {
		return false, fmt.Errorf("exists success kafka message log by message_id failed: %w", err)
	}
	return count > 0, nil
}

// InsertSuccess 插入成功处理记录（使用 INSERT IGNORE 避免并发问题）
func (m *KafkaMessageLogModelSqlx) InsertSuccess(ctx context.Context, messageId, formViewId string) (*KafkaMessageLog, error) {
	data := &KafkaMessageLog{
		Id:          uuid.New().String(),
		MessageId:   messageId,
		FormViewId:  formViewId,
		ProcessedAt: time.Now(),
		Status:      1, // 处理成功
	}
	// 使用 INSERT IGNORE，如果 message_id 已存在则忽略
	query := `INSERT IGNORE INTO t_kafka_message_log (id, message_id, form_view_id, processed_at, status, error_msg)
	           VALUES (?, ?, ?, ?, ?, ?)`
	_, err := m.conn.ExecCtx(ctx, query, data.Id, data.MessageId, data.FormViewId, data.ProcessedAt, data.Status, data.ErrorMsg)
	if err != nil {
		return nil, fmt.Errorf("insert ignore kafka message log failed: %w", err)
	}
	return data, nil
}

// InsertFailure 插入失败处理记录
func (m *KafkaMessageLogModelSqlx) InsertFailure(ctx context.Context, messageId, formViewId string, errMsg string) (*KafkaMessageLog, error) {
	data := &KafkaMessageLog{
		Id:          uuid.New().String(),
		MessageId:   messageId,
		FormViewId:  formViewId,
		ProcessedAt: time.Now(),
		Status:      2, // 处理失败
		ErrorMsg:    &errMsg,
	}
	return m.Insert(ctx, data)
}
