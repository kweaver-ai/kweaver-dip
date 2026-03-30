package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	client_info "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/client_info"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	log "github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"gorm.io/gorm"
)

type CommonDomainImpl struct {
	clientInfoRepo client_info.Repo
	data           *db.Data
}

func NewCommonDomain(data *db.Data, clientInfoRepo client_info.Repo) common.Domain {

	return &CommonDomainImpl{
		data:           data,
		clientInfoRepo: clientInfoRepo,
	}
}

func (c *CommonDomainImpl) GetToken(ctx context.Context) (string, error) {
	clientID, clientSecret, err := c.getClientInfo(ctx)
	if err != nil {
		log.Errorf("failed to getClientInfo, err: %v", err)
		return "", err
	}
	token, err := util.RequestToken(clientID, clientSecret)
	if err != nil {
		log.Errorf("failed to RequestToken, err: %v", err)
		return "", err
	}
	return token, nil
}

func (c *CommonDomainImpl) getClientInfo(ctx context.Context) (string, string, error) {
	info, err := c.clientInfoRepo.Get(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			clientID, clientSecret, err := util.GetClientInfo()
			if err != nil {
				log.Errorf("failed to getClientInfo, err: %v", err)
				return "", "", err
			}
			err = c.clientInfoRepo.Insert(ctx, &model.ClientInfo{ClientID: clientID, ClientSecret: clientSecret})
			if err != nil {
				log.Errorf("failed to insert clientInfo, err: %v", err)
				return "", "", err
			}
			info.ClientID = clientID
			info.ClientSecret = clientSecret
		}
	}
	return info.ClientID, info.ClientSecret, nil
}

// GetDictList 获取从标准化服务获取字典列表
func (c *CommonDomainImpl) GetDictList(ctx context.Context, dictId string) (dict *common.Dict, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	standardizationHost := settings.GetConfig().DepServicesConf.StandardizationHost
	urlStr := "%s/api/standardization/v1/dataelement/dict/internal/getId/%s"
	urlStr = fmt.Sprintf(urlStr, standardizationHost, dictId)
	request, _ := http.NewRequest("GET", urlStr, nil)
	span.AddEvent("Request.Header set Authorization")
	request.Header.Set("Authorization", ctx.Value(constant.UserTokenKey).(string))
	//request.Header.Set("Authorization", "Bearer ory_at_GLXU3d1yumDZeGdonZA5yxnkLRmCn10EbAhnLsZCsGQ.tY_sGcGmK9oxyrnxQNlnYD_kQL0KYTLXri6s83GRwRU")
	resp, err := trace.NewOtelHttpClient().Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Desc(errorcode.StandardizationUrlError)
	}
	// 延时关闭
	defer resp.Body.Close()
	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)

	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		err = errorcode.Detail(errorcode.StandardizationUrlError, err.Error())
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		log.WithContext(ctx).Errorf("request default resp.status: %v", resp.StatusCode)
		err = errorcode.Detail(errorcode.StandardizationUrlError, "request default")
		return nil, err
	}

	var item common.Dict

	if err = json.Unmarshal(body, &item); err != nil {
		log.WithContext(ctx).Errorf("convert configuration objects error: %v", err)
		return nil, err
	}
	return &item, nil
}
