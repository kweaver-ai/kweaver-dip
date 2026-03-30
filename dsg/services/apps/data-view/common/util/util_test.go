package util

import (
	"testing"
)

func TestChQuotationMark(t *testing.T) {
	t.Log(ChQuotationMarkFast("fa中文aaf\""))
	t.Log(ChQuotationMarkFast("fa中文aaf"))
}

func BenchmarkChQuotationMark(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = ChQuotationMarkFast("fa中文aaf")
	}
}
