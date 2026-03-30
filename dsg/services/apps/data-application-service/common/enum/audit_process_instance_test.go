package enum

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsConsideredAsPublished(t *testing.T) {
	tests := []struct {
		name      string
		status    string
		assertion assert.BoolAssertionFunc
	}{

		{
			name:      "未发布",
			status:    PublishStatusUnPublished,
			assertion: assert.False,
		},
		{
			name:      "发布审核中",
			status:    PublishStatusPubAuditing,
			assertion: assert.False,
		},
		{
			name:      "已发布",
			status:    PublishStatusPublished,
			assertion: assert.True,
		},
		{
			name:      "发布审核未通过",
			status:    PublishStatusPubReject,
			assertion: assert.False,
		},
		{
			name:      "变更审核中",
			status:    PublishStatusChangeAuditing,
			assertion: assert.True,
		},
		{
			name:      "变更审核未通过",
			status:    PublishStatusChangeReject,
			assertion: assert.True,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsConsideredAsPublished(tt.status)
			tt.assertion(t, got)
		})
	}
}

func TestIsConsideredAsOnline(t *testing.T) {
	tests := []struct {
		name      string
		status    string
		assertion assert.BoolAssertionFunc
	}{
		{
			name:      "未上线",
			status:    LineStatusNotLine,
			assertion: assert.False,
		},
		{
			name:      "已上线",
			status:    LineStatusOnLine,
			assertion: assert.True,
		},
		{
			name:      "已下线",
			status:    LineStatusOffLine,
			assertion: assert.False,
		},
		{
			name:      "上线审核中",
			status:    LineStatusUpAuditing,
			assertion: assert.False,
		},
		{
			name:      "下线审核中",
			status:    LineStatusDownAuditing,
			assertion: assert.True,
		},
		{
			name:      "上线审核未通过",
			status:    LineStatusUpReject,
			assertion: assert.False,
		},
		{
			name:      "下线审核未通过",
			status:    LineStatusDownReject,
			assertion: assert.True,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsConsideredAsOnline(tt.status)
			tt.assertion(t, got)
		})
	}
}
