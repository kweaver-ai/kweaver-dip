package d_session

import (
	"context"

	"github.com/redis/go-redis/v9"
)

type Session interface {
	GetRawRedisClient() *redis.Client
	SaveSession(ctx context.Context, sessionId string, sessionInfo *SessionInfo) error
	GetSession(ctx context.Context, sessionId string) (*SessionInfo, error)
	DelSession(ctx context.Context, sessionId string) error
}
