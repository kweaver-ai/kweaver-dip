package mdl_uniquery

import "context"

type DrivenMDLUniQuery interface {
	QueryData(ctx context.Context, ids string, body QueryDataBody) (*QueryDataResult, error)
}

type QueryDataBody struct {
	SQL string `json:"sql"`
}
type QueryDataResult struct {
	Entries        []map[string]any `json:"entries"`
	VegaDurationMS int              `json:"vega_duration_ms"`
	OverallMS      int              `json:"overall_ms"`
}
