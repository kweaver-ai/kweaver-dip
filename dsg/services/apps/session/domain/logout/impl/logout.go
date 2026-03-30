package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/audit"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/oauth2"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/user_management"
	"github.com/kweaver-ai/dsg/services/apps/session/common/cookie_util"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/logout"
	gConfiguration_center "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type LogoOutUsecase struct {
	oauth2      oauth2.DrivenOauth2
	userMgm     user_management.DrivenUserMgnt
	session     d_session.Session
	auditLogger *audit.Logger // 审计日志的日志器
}

func NewLogOutUsecase(
	oauth2 oauth2.DrivenOauth2,
	userMgm user_management.DrivenUserMgnt,
	session d_session.Session,
	ccDriven gConfiguration_center.Driven,
	auditLogger *audit.Logger,
) domain.LogOutService {
	return &LogoOutUsecase{
		oauth2:      oauth2,
		userMgm:     userMgm,
		session:     session,
		auditLogger: auditLogger,
	}
}
func (l *LogoOutUsecase) GetSession(ctx context.Context, cookies *cookie_util.CookieValue) (*d_session.SessionInfo, error) {
	sessionInfo, err := l.session.GetSession(ctx, cookies.SessionId)
	if err != nil {
		log.WithContext(ctx).Error("Logout GetSession GetSession error")
		//_ = l.oauth2.RevokeToken(cookies.Token) //session not find , direct Revoke not call back
		return nil, err
	}
	return sessionInfo, nil
}
func (l *LogoOutUsecase) DelSessionAndRevoke(ctx context.Context, cookies *cookie_util.CookieValue, sessionInfo *d_session.SessionInfo) {
	_ = l.oauth2.RevokeToken(ctx, sessionInfo.Token)
	err := l.session.DelSession(ctx, cookies.SessionId)
	if err != nil {
		log.WithContext(ctx).Error("LogOut DelSessionAndRevoke DelSession error")
	}
}
func (l *LogoOutUsecase) DoLogOutCallBack(ctx context.Context, cookies *cookie_util.CookieValue, state string) (*d_session.SessionInfo, error) {
	sessionInfo, err := l.session.GetSession(ctx, cookies.SessionId)
	if err != nil {
		//not find clear cookie
		log.WithContext(ctx).Error("LogOutCallback DoLogOutCallBack GetSession error")
		return sessionInfo, err
	}
	/*	if sessionInfo.Token != cookies.Token {
		log.WithContext(ctx).Error("Logout GetSession redis  Session not same to cookies")
		return errors.New("session not same cookies")
	}*/
	if state != sessionInfo.State {
		log.WithContext(ctx).Errorf("LoginCallback state change session: %v ,req: %v", sessionInfo.State, state)
		return sessionInfo, errors.New("session State not equal")
	}
	/*	err = l.oauth2.RevokeToken(sessionInfo.Token)
		if err != nil {
			log.WithContext(ctx).Error("LogOutCallback DoLogOutCallBack Revoke Token error", zap.Error(err))
		}*/
	err = l.RevokeADelSession(ctx, sessionInfo, cookies.SessionId)
	//记录登出日志
	l.auditLogger.AuditLogForLogout(ctx, sessionInfo)
	return sessionInfo, err
}
func (l *LogoOutUsecase) RevokeADelSession(ctx context.Context, sessionInfo *d_session.SessionInfo, sessionId string) error {
	var err error
	err = l.oauth2.RevokeToken(ctx, sessionInfo.RefreshToken)
	if err != nil {
		log.WithContext(ctx).Error("LogOut RevokeADelSession Revoke RefreshToken error", zap.Error(err))
	}
	err = l.session.DelSession(ctx, sessionId)
	if err != nil {
		log.WithContext(ctx).Error("LogOut RevokeADelSession DelSession error", zap.Error(err))
	}
	return err
}
