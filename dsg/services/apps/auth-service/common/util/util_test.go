package util

import (
	"reflect"
	"testing"
)

func TestParsePathIds(t *testing.T) {
	type args struct {
		ids string
	}
	tests := []struct {
		name              string
		args              args
		wantGroupPolicies [][]string
	}{
		{
			name: "",
			args: args{
				ids: "a/b/c/d",
			},
			wantGroupPolicies: [][]string{
				{"d", "c"},
				{"c", "b"},
				{"b", "a"},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if gotGroupPolicies := ParsePathIds(tt.args.ids); !reflect.DeepEqual(gotGroupPolicies, tt.wantGroupPolicies) {
				t.Errorf("ParsePathIds() = %v, want %v", gotGroupPolicies, tt.wantGroupPolicies)
			}
		})
	}
}
