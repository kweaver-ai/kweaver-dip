// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"

	"github.com/jinguoxing/idrm-go-base/telemetry"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/config"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/aiservice"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// 测试配置
var testConfig = config.Config{
	DB: config.DBConfig{
		Default: config.DatabaseConfig{
			Host:     "localhost",
			Port:     3306,
			Database: "data-semantic",
			Username: "root",
			Password: "root123456",
			Charset:  "utf8mb4",
		},
	},
	Redis: config.RedisConfig{
		Host: "localhost",
		Port: 6379,
		DB:   1, // 使用 DB 1 进行测试，避免干扰生产环境
	},
	Telemetry: telemetry.Config{
		Environment: "test", // 测试环境
	},
}

// 测试数据库连接
var testDB sqlx.SqlConn

// 测试 Redis 客户端
var testRedis *redis.Redis

// 测试 AI 服务客户端 (Mock)
var testAIClient *aiservice.MockClient

func init() {
	dataSource := testConfig.DB.Default.DataSource()
	testDB = sqlx.NewMysql(dataSource)

	// 初始化 Redis (可选)
	testRedis = redis.MustNewRedis(redis.RedisConf{
		Host: testConfig.Redis.Addr(),
		Type: redis.NodeType,
	})

	// 初始化 Mock AI 服务客户端
	testAIClient = aiservice.NewMockClient()
}

// getTestFormViewIds 获取测试用的 form_view ID
// 从数据库中查询不同状态的 form_view 记录
func getTestFormViewIds(ctx context.Context) (map[string]string, error) {
	model := form_view.NewFormViewModel(testDB)
	result := make(map[string]string)

	// 查询状态 0 的记录
	if fv, err := model.FindOneById(ctx, "018f7d4b-6f8c-7b9a-0c1d-2e3f4a5b6c7d"); err == nil && fv != nil {
		result["status0"] = fv.Id
	}

	// 如果没有找到，查询任意记录作为备用
	var allFormViews []struct {
		Id               string `db:"id"`
		UnderstandStatus int8   `db:"understand_status"`
	}
	query := `SELECT id, understand_status FROM form_view LIMIT 10`
	err := testDB.QueryRowsCtx(ctx, &allFormViews, query)
	if err != nil {
		return nil, err
	}

	for _, fv := range allFormViews {
		statusKey := ""
		switch fv.UnderstandStatus {
		case 0:
			statusKey = "status0"
		case 1:
			statusKey = "status1"
		case 2:
			statusKey = "status2"
		case 3:
			statusKey = "status3"
		case 4:
			statusKey = "status4"
		}
		if statusKey != "" && result[statusKey] == "" {
			result[statusKey] = fv.Id
		}
	}

	// 如果还是没有找到，返回空map，测试会skip
	return result, nil
}
