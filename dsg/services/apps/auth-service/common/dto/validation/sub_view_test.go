package validation

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/validation/field"
)

func Test_validateSubViewSpec(t *testing.T) {
	// fldPath 仅用于在错误中标识出错的字段，与验证逻辑关系不大，可以不做详细验证
	var fldPath = field.NewPath("a", "b")
	type args struct {
		spec *dto.SubViewSpec
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "缺少名称",
			args: args{
				spec: &dto.SubViewSpec{
					LogicViewID: "01907188-9eaa-7387-997c-9a916fef7b05",
					Detail:      "{}",
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.name",
					BadValue: "",
				},
			},
		},
		{
			name: "不合法的逻辑视图 ID",
			args: args{
				spec: &dto.SubViewSpec{
					Name:   "东区数据",
					Detail: "{}",
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.logic_view_id",
					BadValue: "",
				},
			},
		},
		{
			name: "缺少具体定义",
			args: args{
				spec: &dto.SubViewSpec{
					LogicViewID: "0190718a-9892-723c-8438-b2ab59531c92",
					Name:        "东区数据",
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.detail",
					BadValue: "",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validateSubViewSpec(tt.args.spec, fldPath)
			assert.Equal(t, tt.want, got)
		})
	}
}
