package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/oauth2"
	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/refresh_token"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type refreshUsecase struct {
	oauth2 oauth2.DrivenOauth2
	//session *redis.Client
	session d_session.Session
}

func NewRefreshUsecase(oauth2 oauth2.DrivenOauth2, session d_session.Session) domain.RefreshService {
	return &refreshUsecase{
		oauth2:  oauth2,
		session: session,
	}
}
func (r *refreshUsecase) DoRefresh(ctx context.Context, cookies *cookie_util.CookieValue) (*domain.DoRefresh, error) {
	//r.oauth2.RefreshToken(refreshToken) //get from redis
	sessionInfo, err := r.session.GetSession(ctx, cookies.SessionId)
	if err != nil {
		log.WithContext(ctx).Error("RefreshToken DoRefresh GetSession error")
		return nil, err
	}
	if sessionInfo.Token != cookies.Token {
		log.WithContext(ctx).Error("RefreshToken DoRefresh redis  Session not same to cookies")
		return nil, errors.New("session not same cookies")
	}
	tokenInfo, err := r.oauth2.RefreshToken(ctx, sessionInfo.RefreshToken)
	if err != nil {
		log.WithContext(ctx).Error("RefreshToken DoRefresh oauth2 RefreshToken  err", zap.Error(err))
		return nil, err
	}
	log.Infof("Refresh [%v] ExpiresIn [%v]", tokenInfo.AccessToken, tokenInfo.ExpiresIn)
	err = r.session.SaveSession(ctx, cookies.SessionId, &d_session.SessionInfo{
		RefreshToken: tokenInfo.RefreshToken,
		Token:        tokenInfo.AccessToken,
		IdToken:      tokenInfo.IdToken,
		Userid:       sessionInfo.Userid,
		UserName:     sessionInfo.UserName,
		State:        sessionInfo.State,
	})
	if err != nil {
		log.WithContext(ctx).Error("RefreshToken DoRefresh SaveSession error")
		return nil, err
	}

	return &domain.DoRefresh{
		Token: tokenInfo.AccessToken,
	}, nil
}
