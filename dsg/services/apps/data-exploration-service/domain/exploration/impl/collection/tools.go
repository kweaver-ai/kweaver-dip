package collection

var MaxTimeRangeStr = "MaxTimeRange"

var hs = map[string]Tool{
	MaxTimeRangeStr: MaxTimeRangeHandler,
}

func Handle(s string, ds ...any) any {
	h := hs[s]
	if s == MaxTimeRangeStr {
		return h(ds[0])
	}
	return nil
}

type Tool func(any) any
