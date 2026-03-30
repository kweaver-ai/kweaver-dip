package logout

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
)

type LogOutService interface {
	GetSession(ctx context.Context, cookies *cookie_util.CookieValue) (*d_session.SessionInfo, error)
	DelSessionAndRevoke(ctx context.Context, cookies *cookie_util.CookieValue, sessionInfo *d_session.SessionInfo)
	DoLogOutCallBack(ctx context.Context, cookies *cookie_util.CookieValue, state string) (*d_session.SessionInfo, error)
	RevokeADelSession(ctx context.Context, sessionInfo *d_session.SessionInfo, sessionId string) error
}
