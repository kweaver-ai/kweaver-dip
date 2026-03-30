package impl

import (
	"context"
	"net/http"

	//"github.com/kweaver-ai/dip-for-datasource/sailor-service/client"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/rest/sailor_service"
	pconfig "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
)

type SailorServiceCall struct {
	//client client.Client
}

func NewSailorServiceCall(httpClient *http.Client, bc *pconfig.Bootstrap) sailor_service.GraphSearch {
	//return &SailorServiceCall{client: client.NewClient(httpClient, bc.DepServices.AfSailorServiceHost)}
	return &SailorServiceCall{}
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

	return &resp, nil
}
