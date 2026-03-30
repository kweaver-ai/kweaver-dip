package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/hydra"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/user_management"
	redis_driver "github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/user_info"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type UserInfoUsecase struct {
	hydraClient hydra.Hydra
	userMgm     user_management.DrivenUserMgnt
	session     redis_driver.Session
}

func NewUserInfoUsecase(hydraClient hydra.Hydra, userMgm user_management.DrivenUserMgnt, session redis_driver.Session) domain.UserInfoService {
	return &UserInfoUsecase{
		hydraClient: hydraClient,
		userMgm:     userMgm,
		session:     session,
	}
}
func (l *UserInfoUsecase) GetUserInfo(ctx context.Context, token string) (*user_management.UserInfo, error) {
	/*	userid, err := l.oauth2.Token2Userid(token)
		if err != nil {
			log.WithContext(ctx).Error("GetUserInfo Token2Userid error")
			return nil, err
		}*/
	introspect, err := l.hydraClient.Introspect(ctx, token)
	if err != nil {
		log.WithContext(ctx).Error("GetUserInfo hydraClient Introspect error", zap.Error(err))
		return nil, err
	}
	if !introspect.Active {
		return nil, errors.New("token not active")
	}
	userid := introspect.VisitorID
	userInfo, err := l.userMgm.BatchGetUserInfoByID(ctx, []string{userid})
	if err != nil {
		log.WithContext(ctx).Error("GetUserInfo userMgm driven error", zap.Error(err))
		return nil, err
	}
	info := userInfo[userid]
	return &info, nil
}
func (l *UserInfoUsecase) GetUserName(ctx context.Context, sessionId string) (string, error) {
	session, err := l.session.GetSession(ctx, sessionId)
	if err != nil {
		log.WithContext(ctx).Error("GetUserInfo GetSession error", zap.Error(err))
		return "", err
	}
	return session.UserName, nil
}
