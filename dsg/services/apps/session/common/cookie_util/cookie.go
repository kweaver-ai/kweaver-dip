package cookie_util

import (
	"context"
	"errors"
	"os"

	"github.com/gin-gonic/gin"
	deploy_management "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/deploy_manager"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

var (
	CookieDomain  string
	CookieTimeOut int
)

func init() {
	CookieTimeOut = 60 * 60 * 24 * 7
}

const (
	SessionId   = "af.session_id"
	Oauth2Token = "af.oauth2_token"
	//UserName    = "af.user_name"
	Userid = "af.user_id"
	//State       = "af.state"

	//IdToken     = "af.id_token"
)

type CookieValue struct {
	SessionId string
	Token     string
	//UserName  string
	Userid string
	//State string
	//IdToken   string
}

func SetCookieDomain(ctx context.Context) {
	host, err := deploy_management.GetHost(ctx)
	if err == nil {
		CookieDomain = host.Host
		log.Infof("【CookieDomain】 DomainName:%s", CookieDomain)
		return
	} else {
		log.WithContext(ctx).Error("【CookieDomain】 deploy_management.GetHost err", zap.Error(err))
	}
	HOSTIP := os.Getenv("HOST_IP")
	if HOSTIP != "" {
		CookieDomain = HOSTIP
		log.Infof("【CookieDomain】 HOST_IP:%s", CookieDomain)
		return
	}
	CookieDomain = "localhost"
	log.Info(" 【CookieDomain】 localhost")
}
func SetCookieDomain_old() {
	if settings.ConfigInstance.Config.DomainName != "" {
		CookieDomain = settings.ConfigInstance.Config.DomainName
		log.Infof("CookieDomain DomainName:%s", CookieDomain)
		return
	}
	HOSTIP := os.Getenv("HOST_IP")
	if HOSTIP != "" {
		CookieDomain = HOSTIP
		log.Infof("CookieDomain HOST_IP:%s", CookieDomain)
		return
	}
	CookieDomain = "localhost"
	log.Info(" CookieDomain localhost")
}

func GetCookieValue(c *gin.Context) (cookie *CookieValue, err error) {
	cookie = &CookieValue{}
	cookie.SessionId, err = c.Cookie(SessionId)
	if err != nil {
		err = errors.New("af.session_id not exist")
		return
	}
	cookie.Token, err = c.Cookie(Oauth2Token)
	if err != nil {
		err = errors.New("af.oauth2_token not exist")
		return
	}

	return
}

func GetCookieValueFromHeader(c *gin.Context) (cookie *CookieValue, err error) {
	cookie = &CookieValue{}
	cookie.SessionId = c.GetHeader(SessionId)
	if len(cookie.SessionId) == 0 {
		err = errors.New("af.session_id not exist")
		return
	}
	cookie.Token = c.GetHeader(Oauth2Token)
	if len(cookie.Token) == 0 {
		err = errors.New("af.oauth2_token not exist")
		return
	}
	return
}

func GetSession(c *gin.Context) (cookie *CookieValue, err error) {
	cookie = &CookieValue{}
	cookie.SessionId, err = c.Cookie(SessionId)
	if err != nil {
		err = errors.New("af.session_id not exist")
		return
	}
	return
}

func GetSessionFromHeader(c *gin.Context) (cookie *CookieValue, err error) {
	cookie = &CookieValue{}
	cookie.SessionId = c.GetHeader(SessionId)
	if len(cookie.SessionId) == 0 {
		err = errors.New("af.session_id not exist")
		return
	}
	return
}
