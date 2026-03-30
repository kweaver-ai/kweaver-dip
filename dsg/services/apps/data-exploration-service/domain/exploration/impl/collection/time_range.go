package collection

import "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"

type TimeRange struct {
	Start int64 `json:"start"`
	End   int64 `json:"end"`
}

func MaxTimeRangeHandler(data any) any {
	ts, err := util.Transfer[[]TimeRange](data)
	if err != nil {
		return nil
	}
	return MaxTimeRange(*ts)
}

func MaxTimeRange(ts []TimeRange) *TimeRange {
	if len(ts) == 0 {
		return nil
	}
	start := ts[0].Start
	end := ts[0].End

	for _, t := range ts {
		if t.Start < start {
			start = t.Start
		}
		if t.End > end {
			end = t.End
		}
	}
	return &TimeRange{
		Start: start,
		End:   end,
	}
}
