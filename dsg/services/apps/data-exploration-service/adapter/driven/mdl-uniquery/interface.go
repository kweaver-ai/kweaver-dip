package mdl_uniquery

import "context"

type DrivenMDLUniQuery interface {
	QueryData(ctx context.Context, ids string, timeOut string, body QueryDataBody) (*QueryDataResult, error)
	QueryDataV2(ctx context.Context, uid, ids string, body QueryDataBody) (*QueryDataResult, error)
}

type QueryDataBody struct {
	SQL string `json:"sql"`
	//Format         string `json:"format"`
	NeedTotal      bool     `json:"need_total"`
	UseSearchAfter bool     `json:"use_search_after"`
	SearchAfter    []string `json:"search_after,omitempty"`
}
type QueryDataResult struct {
	Entries        []map[string]any `json:"entries"`
	VegaDurationMS int              `json:"vega_duration_ms"`
	OverallMS      int              `json:"overall_ms"`
	TotalCount     int              `json:"total_count"`
	SearchAfter    []string         `json:"search_after,omitempty"`
}
