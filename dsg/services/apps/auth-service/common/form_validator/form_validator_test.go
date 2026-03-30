package form_validator

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/validation/field"
)

func TestNewValidErrorForFieldError(t *testing.T) {
	type args struct {
		err *field.Error
	}
	tests := []struct {
		name string
		args args
		want *ValidError
	}{
		{
			name: "nil",
		},
		{
			name: "invalid",
			args: args{
				err: field.Invalid(field.NewPath("a").Child("b").Index(2).Child("c"), "VALUE", "DETAIL"),
			},
			want: &ValidError{
				Key:     "a.b[2].c",
				Message: "DETAIL",
			},
		},
		{
			name: "required",
			args: args{
				err: field.Required(field.NewPath("a").Child("b").Index(2).Child("c"), "DETAIL"),
			},
			want: &ValidError{
				Key:     "a.b[2].c",
				Message: "a.b[2].c 为必填字段",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewValidErrorForFieldError(tt.args.err)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestNewValidErrorsForFieldErrorList(t *testing.T) {
	type args struct {
		errList field.ErrorList
	}
	tests := []struct {
		name       string
		args       args
		wantResult ValidErrors
	}{
		{
			name: "nil",
		},
		{
			name: "non-nil",
			args: args{
				errList: field.ErrorList{
					field.Required(field.NewPath("a").Index(2).Child("b").Key("k"), "DETAIL"),
					field.Invalid(field.NewPath("a").Index(2).Child("b").Key("k"), "VALUE", "DETAIL"),
				},
			},
			wantResult: ValidErrors{
				{
					Key:     "a[2].b[k]",
					Message: "a[2].b[k] 为必填字段",
				},
				{
					Key:     "a[2].b[k]",
					Message: "DETAIL",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if gotResult := NewValidErrorsForFieldErrorList(tt.args.errList); !reflect.DeepEqual(gotResult, tt.wantResult) {
				t.Errorf("NewValidErrorsForFieldErrorList() = %v, want %v", gotResult, tt.wantResult)
			}
		})
	}
}
