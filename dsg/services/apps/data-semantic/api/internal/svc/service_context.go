// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"sync"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/config"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/agentretrieval"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/aiservice"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/hydra"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/usermgm"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"github.com/zeromicro/go-zero/rest"
	"golang.org/x/time/rate"
)

type rateLimitEntry struct {
	limiter    *rate.Limiter
	lastAccess time.Time
	mu         sync.Mutex // 保护每个限流器的并发访问
}

type ServiceContext struct {
	Config    config.Config
	DB        sqlx.SqlConn              // 数据库连接
	Redis     *redis.Redis              // Redis 客户端
	AIClient  aiservice.ClientInterface // AI 服务客户端
	Hydra     *hydra.Client            // Hydra 客户端
	UserMgm   *usermgm.Client          // UserManagement 客户端
	AgentRetrieval agentretrieval.ClientInterface // AgentRetrieval 服务客户端
	rateLimiters sync.Map               // formViewId -> *rateLimitEntry (限流器缓存)

	// 认证中间件
	JWTAuth rest.Middleware // JWT 验证中间件 (供 goctl 生成的 routes.go 使用)
}

func NewServiceContext(c config.Config) *ServiceContext {
	// 初始化数据库连接
	db := sqlx.NewMysql(c.DB.Default.DataSource())

	// 初始化 Redis
	redisClient := initRedis(c)

	// 初始化 AI 服务客户端
	aiTimeout := time.Duration(c.AIService.TimeoutSeconds) * time.Second
	aiClient := aiservice.NewClient(c.AIService.URL, aiTimeout)

	// 初始化 Hydra 客户端
	hydraTimeout := time.Duration(c.Auth.HydraTimeoutSec) * time.Second
	hydraClient := hydra.NewClient(c.Auth.HydraAdminURL, hydraTimeout)

	// 初始化 UserManagement 客户端
	userMgmTimeout := time.Duration(c.UserManagement.TimeoutSeconds) * time.Second
	userMgmClient := usermgm.NewClient(c.UserManagement.URL, userMgmTimeout)

	// 初始化 AgentRetrieval 客户端
	agentRetrievalTimeout := time.Duration(c.AgentRetrieval.TimeoutSeconds) * time.Second
	agentRetrievalClient := agentretrieval.NewClient(c.AgentRetrieval.URL, agentRetrievalTimeout)

	// 创建 JWT 认证中间件 (使用 goctl 生成的中间件结构体)
	jwtAuthMiddleware := middleware.NewJWTAuthMiddleware(hydraClient, userMgmClient)
	jwtAuth := jwtAuthMiddleware.Handle

	return &ServiceContext{
		Config:          c,
		DB:              db,
		Redis:           redisClient,
		AIClient:        aiClient,
		Hydra:           hydraClient,
		UserMgm:         userMgmClient,
		AgentRetrieval:  agentRetrievalClient,
		JWTAuth:         jwtAuth,
	}
}

// initRedis 初始化 Redis 客户端
func initRedis(c config.Config) *redis.Redis {
	return redis.MustNewRedis(redis.RedisConf{
		Host: c.Redis.Addr(),
		Pass: c.Redis.Password,
		Type: redis.NodeType,
	})
}

// GetRateLimiter 获取或创建指定 formViewId 的限流器
// 使用 1 秒窗口，允许 1 次请求
// 返回限流器的 Allow 方法，已加锁保护
func (s *ServiceContext) GetRateLimiter(formViewId string) *rate.Limiter {
	// 尝试从缓存中获取
	if entry, ok := s.rateLimiters.Load(formViewId); ok {
		return entry.(*rateLimitEntry).limiter
	}

	// 创建新的限流器：1 秒内最多 1 次请求
	limiter := rate.NewLimiter(rate.Every(time.Second), 1)
	entry := &rateLimitEntry{
		limiter:    limiter,
		lastAccess: time.Now(),
	}

	// 存入缓存（如果已存在则使用已存在的）
	actual, _ := s.rateLimiters.LoadOrStore(formViewId, entry)
	return actual.(*rateLimitEntry).limiter
}

// AllowRequest 检查并消耗令牌（线程安全）
func (s *ServiceContext) AllowRequest(formViewId string) bool {
	entry, _ := s.rateLimiters.LoadOrStore(formViewId, &rateLimitEntry{
		limiter:    rate.NewLimiter(rate.Every(time.Second), 1),
		lastAccess: time.Now(),
	})

	e := entry.(*rateLimitEntry)
	e.mu.Lock()
	defer e.mu.Unlock()
	e.lastAccess = time.Now()
	return e.limiter.Allow()
}
