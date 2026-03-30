package field

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestErrorList_Is(t *testing.T) {
	type args struct {
		target error
	}
	tests := []struct {
		name string
		list ErrorList
		args args
		want assert.BoolAssertionFunc
	}{
		{
			name: "true",
			list: ErrorList{Invalid(nil, nil, "something wrong")},
			args: args{&ErrorList{}},
			want: assert.True,
		},
		{
			name: "false",
			list: ErrorList{Invalid(nil, nil, "something wrong")},
			args: args{errors.New("something wrong")},
			want: assert.False,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.want(t, tt.list.Is(tt.args.target))
		})
	}
}
