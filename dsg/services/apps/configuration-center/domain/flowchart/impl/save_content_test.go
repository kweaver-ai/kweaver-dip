package impl

import (
	"context"
	"reflect"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
)

func Test_contentResolver_bindTaskTypes(t *testing.T) {
	type args struct {
		ctx         context.Context
		taskTypeStr string
	}
	tests := []struct {
		name    string
		args    args
		want    constant.TaskTypeStrings
		wantErr bool
	}{
		{
			name: "syncDataView",
			args: args{
				ctx:         context.TODO(),
				taskTypeStr: `["syncDataView"]`,
			},
			want: []constant.TaskTypeString{constant.TaskTypeStringSyncDataView},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &contentResolver{}
			got, err := c.bindTaskTypes(tt.args.ctx, tt.args.taskTypeStr)
			if (err != nil) != tt.wantErr {
				t.Errorf("contentResolver.bindTaskTypes() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("contentResolver.bindTaskTypes() = %v, want %v", got, tt.want)
			}
		})
	}
}
