package rest

import (
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	common_scene_analysis "github.com/kweaver-ai/idrm-go-common/rest/scene_analysis"
	common_scene_analysis_impl "github.com/kweaver-ai/idrm-go-common/rest/scene_analysis/impl"
	"net/http"
)

func NewCommonSceneAnalysisDriven(conf *my_config.Bootstrap, client *http.Client) common_scene_analysis.SceneAnalysisDriven {
	return common_scene_analysis_impl.NewSceneAnalysisDriven(client, conf.DepServices.SceneAnalysisHost)
}
