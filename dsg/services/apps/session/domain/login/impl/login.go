package impl

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/audit"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/authentication"
	"github.com/kweaver-ai/dsg/services/apps/session/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/session/common/units"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/anyshare"
	deploy_management "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/deploy_manager"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/hydra"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/oauth2"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/user_management"
	"github.com/kweaver-ai/dsg/services/apps/session/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/session/domain/login"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

const DEFAULT_RESPONSE_TYPE = "code" // 默认response_type为授权码

type LoginUsecase struct {
	//httpClient    http_client.HTTPClient
	//rawHttpClient *http.Client
	oauth2  oauth2.DrivenOauth2
	userMgm user_management.DrivenUserMgnt
	//session *redis.Client
	session        d_session.Session
	deployMgm      deploy_management.DrivenDeployMgm
	hydraClient    hydra.Hydra
	asClient       anyshare.DrivenAnyshare
	authentication authentication.Driven
	auditLogger    *audit.Logger // 审计日志的日志器
}

func NewLoginUsecase(
	oauth2 oauth2.DrivenOauth2,
	userMgm user_management.DrivenUserMgnt,
	session d_session.Session,
	d deploy_management.DrivenDeployMgm,
	hydraClient hydra.Hydra,
	asClient anyshare.DrivenAnyshare,
	authentication authentication.Driven,
	auditLogger *audit.Logger,
) domain.LoginService {
	return &LoginUsecase{
		oauth2:         oauth2,
		userMgm:        userMgm,
		session:        session,
		deployMgm:      d,
		hydraClient:    hydraClient,
		asClient:       asClient,
		authentication: authentication,
		auditLogger:    auditLogger,
	}
}

var ErrSessionStateNotEqual = errors.New("session State not equal")

func (l *LoginUsecase) TokenEffect(ctx context.Context, token string) (bool, error) {
	introspect, err := l.hydraClient.Introspect(ctx, token)
	if err != nil {
		return false, err
	}
	return introspect.Active, nil
}
func (l *LoginUsecase) DoLogin(ctx context.Context, code string, state string, sessionId string) (*d_session.SessionInfo, error) {
	sessionInfo, err := l.session.GetSession(ctx, sessionId)
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin GetSession error")
		return sessionInfo, err
	}
	if sessionInfo == nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin Get Session  sessionInfo nil")
		return sessionInfo, errors.New("session State empty")
	}
	if sessionInfo.State != state {
		log.WithContext(ctx).Errorf("LoginCallback state change session: %v ,req: %v", sessionInfo.State, state)
		return sessionInfo, ErrSessionStateNotEqual
	}
	GetHostRes, err := l.deployMgm.GetHost(ctx)
	if err != nil {
		log.Info("deployMgm GetHost error", zap.Error(err))
		return sessionInfo, errorcode.Detail(errorcode.GetHostError, err)
	}
	accessUrl := fmt.Sprintf("https://%s:%s", GetHostRes.Host, GetHostRes.Port)
	code2TokenRes, err := l.oauth2.Code2Token(ctx, code, accessUrl)
	if err != nil {
		return sessionInfo, err
	}
	log.Infof("code2TokenRes:%v", code2TokenRes)
	/*	userid, err := l.oauth2.Token2Userid(code2TokenRes.AccessToken)
		if err != nil {
			return nil,  err
		}*/
	introspect, err := l.hydraClient.Introspect(ctx, code2TokenRes.AccessToken)
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin hydraClient Introspect error", zap.Error(err))
		return sessionInfo, err
	}
	if !introspect.Active {
		return sessionInfo, errors.New("token not active")
	}
	userid := introspect.VisitorID
	log.Infof("Token2Userid:%v", userid)
	userInfos, err := l.userMgm.BatchGetUserInfoByID(ctx, []string{userid})
	if err != nil {
		log.WithContext(ctx).Error("userid2Userinfo userMgm driven", zap.Error(err))
		return sessionInfo, err
	}
	userinfo := userInfos[userid]
	log.Infof("Userid2UserInfoRes:%v", userinfo)

	sessionInfo.RefreshToken = code2TokenRes.RefreshToken
	sessionInfo.Token = code2TokenRes.AccessToken
	sessionInfo.IdToken = code2TokenRes.IdToken
	sessionInfo.Userid = userid
	sessionInfo.VisionName = userinfo.VisionName
	sessionInfo.UserName = userInfos[userid].VisionName
	sessionInfo.VisitorTyp = introspect.VisitorTyp
	err = l.session.SaveSession(ctx, sessionId, sessionInfo)
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin SaveSession error")
		return sessionInfo, err
	}
	//// 需要判断用户有无权限，无权限则返回异常
	//resp, err := l.DrivenConfigurationCenter.GetUserPermissionScopeList(ctx, code2TokenRes.AccessToken)
	//if err != nil {
	//	return sessionInfo, err
	//}
	//if len(resp) == 0 {
	//	return sessionInfo, errorcode.Desc(errorcode.UserHasNoPermissionError)
	//}
	//添加审计日志
	l.auditLogger.AuditLogForLogin(ctx, sessionInfo)
	return sessionInfo, nil
}

func (l *LoginUsecase) SingleSignOn(ctx context.Context, asToken, sessionId string) (res *oauth2.Code2TokenRes, uInfo *user_management.UserInfo, err error) {
	var (
		asUserInfo              *anyshare.UserInfo
		accountInfo             *user_management.AccountInfoResp
		GetHostRes              *deploy_management.GetHostRes
		cookies                 []*http.Cookie
		deviceInfo              *hydra.DeviceInfo
		codeInfo                *hydra.TokenInfo
		isTokenExpiredOrInvalid bool

		loginChallenge, redirectURL, consentChallenge string
	)

	if !l.asClient.CheckAnyshareHostValid() {
		log.WithContext(ctx).Errorf("SingleSignOn anyshare host invalid")
		return nil, nil, errorcode.Desc(errorcode.AnyshareHostConfNotFindError)
	}
	isTokenExpiredOrInvalid, asUserInfo, err = l.asClient.GetUserInfoByASToken(ctx, asToken)
	if err != nil {
		if isTokenExpiredOrInvalid {
			return nil, nil, errorcode.Detail(errorcode.ASTokenExpiredOrInvalidError, err)
		}
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	accountInfo, err = l.userMgm.GetAccountInfoByAccount(ctx, asUserInfo.Account)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	if !accountInfo.Result {
		log.WithContext(ctx).Errorf(fmt.Sprintf("account: %s not existed", asUserInfo.Account))
		return nil, nil, errorcode.Desc(errorcode.UserNotExistedError)
	} else if accountInfo.Result && accountInfo.User.DisableStatus {
		log.WithContext(ctx).Errorf(fmt.Sprintf("uid: %s account: %s has been disabled", accountInfo.User.ID, accountInfo.User.Account))
		return nil, nil, errorcode.Desc(errorcode.UserDisabledError)
	}
	GetHostRes, err = l.deployMgm.GetHost(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("SingleSignOn deployMgm.GetHost error", zap.Error(err))
		return nil, nil, errorcode.Detail(errorcode.GetHostError, err)
	}
	accessHost := fmt.Sprintf("%s://%s:%s", GetHostRes.Scheme, GetHostRes.Host, GetHostRes.Port)
	state := uuid.New().String()
	loginChallenge, cookies, err = l.hydraClient.AuthorizeRequest(ctx, DEFAULT_RESPONSE_TYPE, accessHost, state)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	deviceInfo, err = l.hydraClient.GetLoginRequestInformation(ctx, loginChallenge)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	redirectURL, err = l.hydraClient.AcceptLoginRequest(ctx, accountInfo.User.ID, loginChallenge)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	consentChallenge, cookies, err = l.hydraClient.VerifyLoginRequest(ctx, redirectURL, cookies)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	redirectURL, err = l.hydraClient.AcceptConsentRequest(ctx, consentChallenge, deviceInfo.ClientType)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	codeInfo, err = l.hydraClient.VerifyConsent(ctx, redirectURL, DEFAULT_RESPONSE_TYPE, cookies)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	res, err = l.oauth2.Code2Token(ctx, codeInfo.Code, accessHost)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}

	userInfos, err := l.userMgm.BatchGetUserInfoByID(ctx, []string{accountInfo.User.ID})
	if err != nil {
		log.WithContext(ctx).Error("SingleSignOn userMgm.BatchGetUserInfoByID error", zap.Error(err))
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	if len(userInfos) == 0 {
		log.WithContext(ctx).Error("SingleSignOn userMgm.BatchGetUserInfoByID get 0 user info")
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, "未获取到用户信息")
	}
	ui := userInfos[accountInfo.User.ID]
	//roles, err := l.DrivenConfigurationCenter.GetUserRoles(ctx, res.AccessToken)
	//if err != nil {
	//	return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	//}
	//if len(roles) == 0 {
	//	return nil, nil, errorcode.Desc(errorcode.UserHasNoRolesError)
	//}
	// 需要判断用户有无权限，无权限则返回异常
	//resp, err := l.DrivenConfigurationCenter.GetUserPermissionScopeList(ctx, res.AccessToken)
	//if err != nil {
	//	return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	//}
	//if len(resp) == 0 {
	//	return nil, nil, errorcode.Desc(errorcode.UserHasNoPermissionError)
	//}
	err = l.session.SaveSession(ctx, sessionId, &d_session.SessionInfo{
		RefreshToken: res.RefreshToken,
		Token:        res.AccessToken,
		IdToken:      res.IdToken,
		Userid:       accountInfo.User.ID,
		UserName:     ui.VisionName,
		State:        state,
	})
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin SaveSession error")
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	uInfo = &ui
	return res, uInfo, nil
}

/*func (l *LoginUsecase) GetSession(ctx context.Context, sessionId string) (*distributed_session.SessionInfo, error) {
	result, err := l.session.Get(ctx, sessionId).Result()
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin redis Get Session  err", zap.Error(err))
		return nil, err
	}
	if result == "" {
		log.WithContext(ctx).Error("LoginCallback DoLogin redis Get Session  empty")
		return nil, errors.New("session empty")
	}
	var sessionInfo *distributed_session.SessionInfo
	err = sessionInfo.Deserialization(result)
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin Session Deserialization err")
		return nil, err
	}
	if sessionInfo.State == "" {
		log.WithContext(ctx).Error("LoginCallback DoLogin redis Get Session  State empty")
		return nil, errors.New("session State empty")
	}
	return sessionInfo, nil
}*/

func (l *LoginUsecase) SingleSignOn2(ctx context.Context, params map[string]string, sessionId string) (*authentication.SSORes, *user_management.UserInfo, error) {
	GetHostRes, err := l.deployMgm.GetHost(ctx)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.GetHostError, err.Error())
	}
	accessUrl := fmt.Sprintf("%s://%s:%s", GetHostRes.Scheme, GetHostRes.Host, GetHostRes.Port)
	//thirdPartyId := params["thirdpartyid"]
	loginConfig, err := l.deployMgm.GetLoginConfig(ctx, accessUrl)
	if err != nil {
		return nil, nil, err
	}
	thirdPartyId := loginConfig.ThirdAuth.ID
	if thirdPartyId == "" {
		return nil, nil, errorcode.Desc(errorcode.ThirdPartyIdEmptyError)
	}
	ssoRes, err := l.authentication.SSO(ctx, accessUrl, &authentication.SSOReq{
		ClientID:    settings.ConfigInstance.Config.Oauth.OauthClientID2,
		RedirectURI: fmt.Sprintf("%s/oauthlogin", accessUrl),
		//RedirectURI:  fmt.Sprintf("%s/af/api/session/v1/login/callback", accessUrl),
		ResponseType: "token id_token",
		Scope:        "offline openid all",
		//UDIDs:        make([]string, 0),
		Credential: authentication.Credential{
			ID:     thirdPartyId,
			Params: params,
		},
	})
	if err != nil {
		return nil, nil, err
	}

	/*code2TokenRes, err := l.oauth2.Code2Token(ctx, ssoRes.Code, accessUrl)
	if err != nil {
		return nil, nil, err
	}*/

	introspect, err := l.hydraClient.Introspect(ctx, ssoRes.AccessToken)
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin hydraClient Introspect error", zap.Error(err))
		return nil, nil, err
	}
	if !introspect.Active {
		return nil, nil, errors.New("token not active")
	}
	userid := introspect.VisitorID
	userInfos, err := l.userMgm.BatchGetUserInfoByID(ctx, []string{userid})
	if err != nil {
		log.WithContext(ctx).Error("userid2Userinfo userMgm driven", zap.Error(err))
		return nil, nil, err
	}
	userinfo := userInfos[userid]
	state := units.RandLenRandString(10, 50)
	sessionInfo := &d_session.SessionInfo{
		//RefreshToken: ssoRes.RefreshToken,
		Token:      ssoRes.AccessToken,
		IdToken:    ssoRes.IdToken,
		Userid:     userinfo.ID,
		UserName:   userinfo.VisionName,
		VisionName: userinfo.VisionName,
		VisitorTyp: introspect.VisitorTyp,
		State:      state,
		SSO:        constant.SSOLogin,
	}
	err = l.session.SaveSession(ctx, sessionId, sessionInfo)
	if err != nil {
		log.WithContext(ctx).Error("LoginCallback DoLogin SaveSession error")
		return nil, nil, errorcode.Detail(errorcode.UserLoginError, err)
	}
	//添加审计日志
	l.auditLogger.AuditLogForLogin(ctx, sessionInfo)
	return ssoRes, &userinfo, nil
}
