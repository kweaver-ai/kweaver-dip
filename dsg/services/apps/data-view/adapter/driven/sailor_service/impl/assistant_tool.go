package impl

import (
	"context"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/sailor_service"
	pconfig "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	//"github.com/kweaver-ai/dip-for-datasource/sailor-service/client"
)

type SailorServiceCall struct {
	//client client.Client
}

func NewSailorServiceCall(httpClient *http.Client, bc *pconfig.Bootstrap) sailor_service.GraphSearch {
	//return &SailorServiceCall{client: client.NewClient(httpClient, bc.DepServices.AfSailorServiceHost)}
	return &SailorServiceCall{}
}

func (c SailorServiceCall) FulltextSearch(ctx context.Context, kgID string, query string, config []*sailor_service.SearchConfig) (*sailor_service.ADLineageFulltextResp, error) {
	// var caReq client.GraphFullTextReq
	// if err := util.CopyUseJson(&caReq.SearchConfig, config); err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, code.Detail(errorcode.PublicInternalError, err)
	// }

	// caReq.KgId = kgID
	// caReq.Query = query

	// caResp, err := c.client.GraphFullText(ctx, &caReq)
	// if err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, err
	// }

	var resp sailor_service.ADLineageFulltextResp
	// if err = util.CopyUseJson(&resp, caResp); err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, code.Detail(errorcode.PublicInternalError, err)
	// }

	return &resp, nil
}

func (c SailorServiceCall) NeighborSearch(ctx context.Context, vid string, steps int) (*sailor_service.ADLineageNeighborsResp, error) {

	// var caReq client.GraphNeighborsReq
	// caReq.Vid = vid
	// caReq.Id = sailor_service.LineageKgID
	// caReq.Steps = steps

	// caResp, err := c.client.GraphNeighbors(ctx, &caReq)
	// if err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, err
	// }

	var resp sailor_service.ADLineageNeighborsResp
	// if err = util.CopyUseJson(&resp, caResp); err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, code.Detail(errorcode.PublicInternalError, err)
	// }

	return &resp, nil

}

func (c SailorServiceCall) DataClassificationExplore(ctx context.Context, req *sailor_service.DataCategorizeReq) (*sailor_service.DataCategorizeResp, error) {
	// caReq := client.LogicalViewDatacategorizeReq{
	// 	ViewId:            req.ViewID,
	// 	ViewTechnicalName: req.ViewTechName,
	// 	ViewBusinessName:  req.ViewBusiName,
	// 	ViewDesc:          req.ViewDesc,
	// 	SubjectId:         req.SubjectID,
	// 	ViewFields: make([]struct {
	// 		ViewFieldId            string "json:\"view_field_id\""
	// 		ViewFieldTechnicalName string "json:\"view_field_technical_name\""
	// 		ViewFieldBusinessName  string "json:\"view_field_business_name\""
	// 		StandardCode           string "json:\"standard_code\""
	// 	}, len(req.ViewFields)),
	// }
	// for i := range req.ViewFields {
	// 	caReq.ViewFields[i].ViewFieldId = req.ViewFields[i].FieldID
	// 	caReq.ViewFields[i].ViewFieldTechnicalName = req.ViewFields[i].FieldTechName
	// 	caReq.ViewFields[i].ViewFieldBusinessName = req.ViewFields[i].FieldBusiName
	// 	caReq.ViewFields[i].StandardCode = req.ViewFields[i].StandardCode
	// }

	// log.Infof("探查时请求认知助手入参，caReq: %v", caReq)
	// caResp, err := c.client.LogicalViewDataCategorize(ctx, &caReq)
	// if err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, err
	// }

	var resp sailor_service.DataCategorizeResp
	// if err = util.CopyUseJson(&resp, caResp); err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, code.Detail(errorcode.PublicInternalError, err)
	// }
	// log.Infof("探查时请求认知助手返回结果，resp: %v", resp)

	return &resp, nil
}

func (c SailorServiceCall) TableCompletion(ctx context.Context, req *sailor_service.TableCompletionReq) (*sailor_service.TableCompletionTableInfoResp, error) {
	// caReq := client.TableCompletionTableInfoReqBody{
	// 	Id:            req.ID,
	// 	TechnicalName: req.TechnicalName,
	// 	BusinessName:  req.BusinessName,
	// 	Desc:          req.Desc,
	// 	Database:      req.Database,
	// 	Subject:       req.Subject,
	// 	Columns: make([]struct {
	// 		Id            string "json:\"id\""
	// 		TechnicalName string "json:\"technical_name\""
	// 		BusinessName  string "json:\"business_name\""
	// 		DataType      string "json:\"data_type\""
	// 		Comment       string "json:\"comment\""
	// 	}, len(req.Columns)),
	// 	RequestType:           req.RequestType,
	// 	ViewSourceCatalogName: req.ViewSourceCatalogName,
	// }
	// for i := range req.Columns {
	// 	caReq.Columns[i].Id = req.Columns[i].ID
	// 	caReq.Columns[i].TechnicalName = req.Columns[i].TechnicalName
	// 	caReq.Columns[i].BusinessName = req.Columns[i].BusinessName
	// 	caReq.Columns[i].DataType = req.Columns[i].DataType
	// 	caReq.Columns[i].Comment = req.Columns[i].Comment
	// }
	// token := ctx.Value(interception.Token).(string)
	// caResp, err := c.client.TableCompletionTableInfo(ctx, &caReq, token)
	// if err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, err
	// }

	var resp sailor_service.TableCompletionTableInfoResp
	// if err = util.CopyUseJson(&resp, caResp); err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, code.Detail(errorcode.PublicInternalError, err)
	// }

	return &resp, nil
}

func (c SailorServiceCall) FieldCompletion(ctx context.Context, req *sailor_service.FieldCompletionReq) (*sailor_service.TableCompletionTableInfoResp, error) {
	// caReq := client.TableCompletionReqBody{
	// 	Id:            req.ID,
	// 	TechnicalName: req.TechnicalName,
	// 	BusinessName:  req.BusinessName,
	// 	Desc:          req.Desc,
	// 	Database:      req.Database,
	// 	Subject:       req.Subject,
	// 	Columns: make([]struct {
	// 		Id            string "json:\"id\""
	// 		TechnicalName string "json:\"technical_name\""
	// 		BusinessName  string "json:\"business_name\""
	// 		DataType      string "json:\"data_type\""
	// 		Comment       string "json:\"comment\""
	// 	}, len(req.Columns)),
	// 	RequestType:           req.RequestType,
	// 	GenFieldIds:           req.GenFieldIds,
	// 	ViewSourceCatalogName: req.ViewSourceCatalogName,
	// }
	// for i := range req.Columns {
	// 	caReq.Columns[i].Id = req.Columns[i].ID
	// 	caReq.Columns[i].TechnicalName = req.Columns[i].TechnicalName
	// 	caReq.Columns[i].BusinessName = req.Columns[i].BusinessName
	// 	caReq.Columns[i].DataType = req.Columns[i].DataType
	// 	caReq.Columns[i].Comment = req.Columns[i].Comment
	// }
	// token := ctx.Value(interception.Token).(string)
	// caResp, err := c.client.TableCompletionAll(ctx, &caReq, token)
	// if err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, err
	// }

	var resp sailor_service.TableCompletionTableInfoResp
	// if err = util.CopyUseJson(&resp, caResp); err != nil {
	// 	log.WithContext(ctx).Error(err.Error())
	// 	return nil, code.Detail(errorcode.PublicInternalError, err)
	// }

	return &resp, nil
}

func (c SailorServiceCall) GenerateFakeSamples(ctx context.Context, req *sailor_service.GenerateFakeSamplesReq) (*sailor_service.GenerateFakeSamplesRes, error) {
	// drivenMsg := "SailorServiceCall GenerateFakeSamples "
	// urlStr := fmt.Sprintf("%s/api/af-sailor-service/v1/form-view/generate_fake_samples", c.client.BaseUrl())

	// log.Infof("%s  url:%s \n", drivenMsg, urlStr)

	// statusCode, body, err := base.DOWithToken(ctx, drivenMsg, http.MethodPost, urlStr, c.client.HttpClient(), req)
	// if err != nil {
	// 	return nil, errorcode.Detail(my_errorcode.SailorGenerateFakeSamplesError, err.Error())
	// }

	// if statusCode != http.StatusOK {
	// 	return nil, base.StatusCodeNotOK(drivenMsg, statusCode, body)
	// }
	var res sailor_service.GenerateFakeSamplesRes
	// if err = jsoniter.Unmarshal(body, &res); err != nil {
	// 	log.WithContext(ctx).Error(drivenMsg+" jsoniter.Unmarshal error", zap.Error(err))
	// 	return nil, errorcode.Detail(my_errorcode.SailorGenerateFakeSamplesError, err.Error())
	// }
	// log.Infof(drivenMsg+"res : %v ", res)
	return &res, nil
}
