package oauth2

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (o *oauth2) RevokeToken(ctx context.Context, accessToken string) error {
	payload := fmt.Sprintf("token=%s", accessToken)
	respCode, _, err := o.httpClient.Post(ctx, fmt.Sprintf("%s/oauth2/revoke", o.hydraSVCURL), o.getHeader(), []byte(payload))
	if err != nil {
		log.WithContext(ctx).Error("RevokeToken httpClient Post", zap.Error(err))
		return err
	}
	if respCode != http.StatusOK {
		log.WithContext(ctx).Error("RevokeToken httpClient Post", zap.Error(errors.New("respCode not ok")))
		return errors.New("respCode not ok")
	}
	return nil
}

/*func (o *oauth2) RevokeUser(userid, state string) error {
	//url := fmt.Sprintf("%s/oauth2/sessions/logout", o.hydraURL)
	url := fmt.Sprintf(`%s/oauth2/sessions/logout`+
		`?post_logout_redirect_uri=https://10.4.132.246:443/api/session/v1/logout/callback`+
		`&id_token_hint=%s`+
		`&state=%s`, o.hydraSVCURL, userid, state)
	_, err := o.httpClient.Get(url, o.getHeader())
	if err != nil {
		log.WithContext(ctx).Error("RevokeToken httpClient Post", zap.Error(err))
		return err
	}

	return nil
}
*/
