package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/scene_analysis"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest"
	"fmt"
	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
	"io"
	"net/http"
)

type SceneAnalysisDriven struct {
	baseURL string
	client  *http.Client
}

func NewSceneAnalysisDriven(conf *my_config.Bootstrap, client *http.Client) scene_analysis.SceneAnalysisDriven {
	return &SceneAnalysisDriven{
		client:  client,
		baseURL: conf.DepServices.SceneAnalysisHost,
	}
}

func (s *SceneAnalysisDriven) GetScene(ctx context.Context, id string) (sceneObjDetail *scene_analysis.SceneObj, err error) {
	drivenMsg := "SceneAnalysisDriven GetScene "
	urlStr := fmt.Sprintf("%s/api/internal/scene-analysis/v1/scene/%s", s.baseURL, id)

	log.Infof(drivenMsg+" url:%s \n", urlStr)

	request, err := http.NewRequest(http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.SceneAnalysisDrivenGetSceneError, err.Error())
	}

	//request.Header.Set("Authorization", util.ObtainToken(ctx))
	resp, err := s.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.SceneAnalysisDrivenGetSceneError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(drivenMsg+" io.ReadAll error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.SceneAnalysisDrivenGetSceneError, err.Error())
	}
	if resp.StatusCode == http.StatusOK {
		var res scene_analysis.SceneObj
		if err = jsoniter.Unmarshal(body, &res); err != nil {
			log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.SceneAnalysisDrivenGetSceneError, err.Error())
		}
		log.Infof(drivenMsg+"res : %v ", res)
		return &res, nil
	} else {
		if g, ok := ctx.(*gin.Context); ok {
			g.Set(interception.StatusCode, resp.StatusCode)
		}
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return nil, Unmarshal(ctx, body, drivenMsg)
		} else {
			log.WithContext(ctx).Error(drivenMsg+"http status error", zap.String("status", resp.Status), zap.String("body", string(body)))
			return nil, errorcode.Desc(my_errorcode.SceneAnalysisDrivenGetSceneError, resp.StatusCode)
		}
	}
}

func Unmarshal(ctx context.Context, body []byte, drivenMsg string) error {
	var res rest.HttpError
	if err := jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
		return errorcode.Detail(my_errorcode.SceneAnalysisDrivenGetSceneError, err.Error())
	}
	log.WithContext(ctx).Errorf("%+v", res)
	return errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
}
