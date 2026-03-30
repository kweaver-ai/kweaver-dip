package sailor_service

import "context"

const (
	LineageKgID = "consanguinity" //数据血缘的ID
)

type ViewFiledsReq struct {
	FieldID       string `json:"view_field_id"`
	FieldTechName string `json:"view_field_technical_name"`
	FieldBusiName string `json:"view_field_business_name"`
	StandardCode  string `json:"standard_code"`
}

type DataCategorizeReq struct {
	ViewID       string           `json:"view_id"`
	ViewTechName string           `json:"view_technical_name"`
	ViewBusiName string           `json:"view_business_name"`
	ViewDesc     string           `json:"view_desc"`
	SubjectID    string           `json:"subject_id"`
	ViewFields   []*ViewFiledsReq `json:"view_fields"`
}

type ViewFiledMatchResult struct {
	Score     string `json:"score"`
	SubjectID string `json:"subject_id"`
}

type ViewFiledsResp struct {
	FieldID      string                  `json:"view_field_id"`
	MatchResults []*ViewFiledMatchResult `json:"rel_subjects"`
}

type DataCategorizeResp struct {
	Result struct {
		Answers struct {
			ViewID     string            `json:"view_id"`
			ViewFields []*ViewFiledsResp `json:"view_fields"`
		} `json:"answers"`
	} `json:"res"`
}

type GraphSearch interface {
	DataClassificationExplore(ctx context.Context, req *DataCategorizeReq) (*DataCategorizeResp, error)
}
