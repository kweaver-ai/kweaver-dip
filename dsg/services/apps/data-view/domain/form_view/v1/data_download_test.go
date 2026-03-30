package v1

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_quote(t *testing.T) {
	tests := []struct {
		name  string
		field string
		want  string
	}{
		{
			name:  "转义",
			field: "name",
			want:  `"name"`,
		},
		{
			name:  "重复转义",
			field: `"name"`,
			want:  `"""name"""`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, escape(tt.field))
		})
	}
}
