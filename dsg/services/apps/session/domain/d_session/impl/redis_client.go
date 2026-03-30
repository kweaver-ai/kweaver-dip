package impl

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"

	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type session struct {
	redisClient *redis.Client
}

func NewSession() d_session.Session {
	cli := redis.NewFailoverClient(&redis.FailoverOptions{
		MasterName: settings.ConfigInstance.Config.Redis.ConnectInfo.MasterGroupName,
		SentinelAddrs: []string{
			fmt.Sprintf("%s:%s",
				settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelHost,
				settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelPort),
		},
		SentinelUsername: settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelUsername,
		SentinelPassword: settings.ConfigInstance.Config.Redis.ConnectInfo.SentinelPassword,
		Username:         settings.ConfigInstance.Config.Redis.ConnectInfo.Username,
		Password:         settings.ConfigInstance.Config.Redis.ConnectInfo.Password,
	})
	// cli := redis.NewClient(
	// 	&redis.Options{
	// 		Addr:     fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
	// 		Username: os.Getenv("REDIS_USER_NAME"),
	// 		Password: os.Getenv("REDIS_PASSWORD"),
	// 		DB:       1,
	// 	},
	// )
	//cli.AddHook(redisotel.NewTracingHook())
	s, err := cli.Ping(context.Background()).Result()
	if err != nil || s != "PONG" {
		log.Error("REDIS PING NOT PONG", zap.Error(err))
		//panic("REDIS PING NOT PONG")
	}
	return &session{
		redisClient: cli,
	}
}

func (r *session) GetRawRedisClient() *redis.Client {
	return r.redisClient
}

func (r *session) GetSession(ctx context.Context, sessionId string) (res *d_session.SessionInfo, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	result, err := r.redisClient.Get(ctx, sessionId).Result()
	if err != nil {
		log.WithContext(ctx).Error("session Get Session  err", zap.Error(err))
		return nil, err
	}
	if result == "" {
		log.WithContext(ctx).Error("session Get Session  empty")
		return nil, errors.New("session empty")
	}
	var sessionInfo d_session.SessionInfo
	log.Infof("GetSession result :%v", result)
	err = sessionInfo.Deserialization(result)
	if err != nil {
		log.WithContext(ctx).Error("session Session Deserialization err", zap.Error(err))
		return nil, err
	}
	return &sessionInfo, nil
}
func (r *session) SaveSession(ctx context.Context, sessionId string, sessionInfo *d_session.SessionInfo) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	//return l.session.Do(ctx, session.SessionId, "states").Err()
	expireTime := settings.ConfigInstance.Config.SessionExpireSecondInt
	result, err := r.redisClient.Set(
		ctx,
		sessionId,
		sessionInfo.Serialize(),
		time.Second*time.Duration(expireTime)).Result()
	if err != nil {
		log.WithContext(ctx).Error("session SaveSession err", zap.Error(err))
		return err
	}
	log.Infof("SaveSession result :%v", result)
	return nil
}
func (r *session) DelSession(ctx context.Context, sessionId string) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	result, err := r.redisClient.Del(ctx, sessionId).Result()
	if err != nil {
		log.WithContext(ctx).Error("session DelSession err", zap.Error(err))
		return err
	}
	log.Infof("result :%v", result)
	return nil
}
