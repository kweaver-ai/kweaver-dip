package sailor_service

import (
	"context"
)

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
	ViewID                string           `json:"view_id"`
	ViewTechName          string           `json:"view_technical_name"`
	ViewBusiName          string           `json:"view_business_name"`
	ViewDesc              string           `json:"view_desc"`
	SubjectID             string           `json:"subject_id"`
	ViewFields            []*ViewFiledsReq `json:"view_fields"`
	ExploreSubjectIDS     []string         `json:"explore_subject_ids"`
	ViewSourceCatalogName string           `json:"view_source_catalog_name"`
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

type TableCompletionReq struct {
	ID                    string    `json:"id"`
	TechnicalName         string    `json:"technical_name"`
	BusinessName          string    `json:"business_name"`
	Desc                  string    `json:"desc"`
	ViewSourceCatalogName string    `json:"view_source_catalog_name"`
	Database              string    `json:"database"`
	Subject               string    `json:"subject"`
	RequestType           int       `json:"request_type"`
	Columns               []*Column `json:"columns"`
}

type Column struct {
	ID            string `json:"id"`
	TechnicalName string `json:"technical_name"`
	BusinessName  string `json:"business_name"`
	DataType      string `json:"data_type"`
	Comment       string `json:"comment"`
}

type TableCompletionTableInfoResp struct {
	Res struct {
		TaskId string `json:"task_id"`
	} `json:"res"`
}

type FieldCompletionReq struct {
	TableCompletionReq
	GenFieldIds []string `json:"gen_field_ids"`
}

type GraphSearch interface {
	FulltextSearch(ctx context.Context, kgID string, query string, config []*SearchConfig) (*ADLineageFulltextResp, error)
	NeighborSearch(ctx context.Context, vid string, steps int) (*ADLineageNeighborsResp, error)
	DataClassificationExplore(ctx context.Context, req *DataCategorizeReq) (*DataCategorizeResp, error)
	TableCompletion(ctx context.Context, req *TableCompletionReq) (*TableCompletionTableInfoResp, error)
	FieldCompletion(ctx context.Context, req *FieldCompletionReq) (*TableCompletionTableInfoResp, error)
	GenerateFakeSamples(ctx context.Context, req *GenerateFakeSamplesReq) (*GenerateFakeSamplesRes, error)
}

type GenerateFakeSamplesReq struct {
	ViewID      string `json:"view_id"`
	SamplesSize int    `json:"samples_size"` //样例的数量,范围1-10
	MaxRetry    int    `json:"max_retry"`    //最高重试次数，默认2
}

type GenerateFakeSamplesRes struct {
	FakeSamples [][]*FakeSamples `json:"res"`
}
type FakeSamples struct {
	ColumnName  string `json:"column_name"`
	ColumnValue any    `json:"column_value"`
}
