// Package kafka_message_log Kafka消息处理记录Model
package kafka_message_log

import (
	"context"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// 测试数据库连接字符串
const testDSN = "root:root123456@tcp(localhost:3306)/data-semantic?parseTime=true"

// TestKafkaMessageLogModel_Insert 测试插入记录
func TestKafkaMessageLogModel_Insert(t *testing.T) {

	conn := sqlx.NewMysql(testDSN)

	model := NewKafkaMessageLogModelSqlx(conn)

	data := &KafkaMessageLog{
		Id:         "test-id",
		MessageId:  "test-message-id",
		FormViewId: "test-form-view-id",
		Status:     StatusProcessed,
	}

	result, err := model.Insert(context.Background(), data)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestKafkaMessageLogModel_ExistsByMessageId 测试检查消息是否存在
func TestKafkaMessageLogModel_ExistsByMessageId(t *testing.T) {
	t.Skip("需要数据库连接")

	conn := sqlx.NewMysql(testDSN)

	model := NewKafkaMessageLogModelSqlx(conn)

	exists, err := model.ExistsByMessageId(context.Background(), "test-message-id")
	assert.NoError(t, err)
	assert.False(t, exists) // 测试数据中应该不存在
}
