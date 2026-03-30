package impl

// import (
// 	"context"
// 	"net/http"

// 	"devops.KweaverAI.cn/KweaverAIDevOps/AnyFabric/_git/af-sailor-service.git/client"
// 	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/anydata_search"
// 	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
// 	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
// 	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
// 	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
// )

// type AnyDataSearchRepo struct {
// 	client client.Client
// }

// func NewAnyDataSearchRepo(httpClient *http.Client) anydata_search.AnyDataSearch {
// 	return &AnyDataSearchRepo{client: client.NewClient(httpClient, settings.GetConfig().DepServicesConf.AfSailorServiceHost)}
// }

// func (r *AnyDataSearchRepo) FulltextSearch(ctx context.Context, kgID string, query string, config []*anydata_search.SearchConfig) (*anydata_search.ADLineageFulltextResp, error) {
// 	var caReq client.GraphFullTextReq
// 	if err := util.CopyUseJson(&caReq.SearchConfig, config); err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
// 	}

// 	caReq.KgId = kgID
// 	caReq.Query = query

// 	caResp, err := r.client.GraphFullText(ctx, &caReq)
// 	if err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, err
// 	}

// 	var resp anydata_search.ADLineageFulltextResp
// 	if err = util.CopyUseJson(&resp, caResp); err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
// 	}

// 	return &resp, nil

// 	//// fulltext https://ip:port/api/alg-server/v1/open/graph-search/kgs/{kg_id}/full-text
// 	//
// 	//conf := settings.GetConfig()
// 	//
// 	//// kgID := conf.ADKgConf.KgID
// 	//fulltextUrl := fmt.Sprintf("%s/api/alg-server/v1/open/graph-search/kgs/%s/full-text", conf.AnyDataAlgServer, kgID)
// 	//
// 	//// tbName, dbType, dbName
// 	//body := anydata_search.NewADLineageFulltextReqBody(kgID, query, config)
// 	//
// 	//appId, err := r.getAppID()
// 	//if err != nil {
// 	//	log.WithContext(ctx).Errorf("failed to get app id, err info: %v", err.Error())
// 	//	return nil, err
// 	//}
// 	//
// 	//timestampString := fmt.Sprintf("%d", time.Now().Unix())
// 	//appKey := OpenAPISecret(appId, timestampString, string(body))
// 	//headers := map[string]string{
// 	//	"appid":     appId,
// 	//	"appKey":    appKey,
// 	//	"timestamp": timestampString,
// 	//}
// 	//
// 	//statusCode, respBytes, err := r.client.Post(fulltextUrl, headers, body)
// 	//if err != nil {
// 	//	log.WithContext(ctx).Errorf("r.client.Post failed, err info: %v\n", err.Error())
// 	//	return nil, err
// 	//}
// 	//
// 	//switch statusCode {
// 	//case http.StatusBadRequest:
// 	//case http.StatusForbidden:
// 	//case http.StatusBadGateway:
// 	//}
// 	//
// 	//resp := anydata_search.NewADLineageFulltextResp(respBytes)
// 	//if resp == nil {
// 	//	log.WithContext(ctx).Errorf("body interface{} convert to ADLineageNeighborsResp failed, body info: %v\n", respBytes)
// 	//	return nil, err
// 	//}
// 	//return resp, nil
// }

// /*
// func (r *AnyDataSearchRepo) NeighborSearch(ctx context.Context, vid string, steps int) (*anydata_search.ADLineageNeighborsResp, error) {

// 	var caReq client.GraphNeighborsReq
// 	caReq.Vid = vid
// 	caReq.Id = settings.GetConfig().KgID
// 	caReq.Steps = steps

// 	caResp, err := r.client.GraphNeighbors(ctx, &caReq)
// 	if err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, err
// 	}

// 	var resp anydata_search.ADLineageNeighborsResp
// 	if err = util.CopyUseJson(&resp, caResp); err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
// 	}

// 	return &resp, nil

// 	//// neighbor https://ip:port/api/alg-server/v1/open/explore/kgs/{kg_id}/neighbors
// 	//
// 	//conf := settings.GetConfig()
// 	//
// 	//kgID := conf.ADKgConf.KgID
// 	//neighborUrl := fmt.Sprintf("%s/api/alg-server/v1/open/explore/kgs/%s/neighbors", conf.AnyDataAlgServer, kgID)
// 	//
// 	//body := anydata_search.NewADLineageNeighborsReqBody(kgID, vid, steps)
// 	//
// 	//appId, err := r.getAppID()
// 	//if err != nil {
// 	//	log.WithContext(ctx).Errorf("failed to get app id, err info: %v", err.Error())
// 	//	return nil, err
// 	//}
// 	//
// 	//timestampString := fmt.Sprintf("%d", time.Now().Unix())
// 	//appKey := OpenAPISecret(appId, timestampString, string(body))
// 	//headers := map[string]string{
// 	//	"appid":     appId,
// 	//	"appKey":    appKey,
// 	//	"timestamp": timestampString,
// 	//}
// 	//
// 	//statusCode, respBytes, err := r.client.Post(neighborUrl, headers, body)
// 	//if err != nil {
// 	//	log.WithContext(ctx).Errorf("r.client.Post failed, err info: %v\n", err.Error())
// 	//	return nil, err
// 	//}
// 	//
// 	//switch statusCode {
// 	//case http.StatusBadRequest:
// 	//case http.StatusUnauthorized:
// 	//case http.StatusForbidden:
// 	//case http.StatusInternalServerError:
// 	//}
// 	//
// 	//resp := anydata_search.NewADLineageNeighborsResp(respBytes)
// 	//if resp == nil {
// 	//	log.WithContext(ctx).Errorf("body interface{} convert to ADLineageNeighborsResp failed, body info: %v\n", respBytes)
// 	//	return nil, err
// 	//}
// 	//return resp, nil
// }
// */
