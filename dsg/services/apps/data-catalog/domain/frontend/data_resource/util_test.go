package data_resource

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
)

func Test_dataResourceTypesFromFilterType(t *testing.T) {
	type args struct {
		t DataResourceType
	}
	tests := []struct {
		name string
		args args
		want []DataResourceType
	}{
		{
			name: "未指定即所有",
			want: []DataResourceType{
				DataResourceTypeDataView,
				DataResourceTypeIndicator,
				DataResourceTypeInterface,
			},
		},
		{
			name: "逻辑视图",
			args: args{t: DataResourceTypeDataView},
			want: []DataResourceType{DataResourceTypeDataView},
		},
		{
			name: "接口",
			args: args{t: DataResourceTypeInterface},
			want: []DataResourceType{DataResourceTypeInterface},
		},
		{
			name: "指标",
			args: args{t: DataResourceTypeIndicator},
			want: []DataResourceType{DataResourceTypeIndicator},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := dataResourceTypesFromFilterType(tt.args.t)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestObjectTypesFromDataResourceTypes(t *testing.T) {
	type args struct {
		types []DataResourceType
	}
	tests := []struct {
		name string
		args args
		want []auth_service.ObjectType
	}{
		{
			name: "例子",
			args: args{types: []DataResourceType{
				DataResourceTypeDataView,
				DataResourceTypeIndicator,
				DataResourceTypeInterface,
			}},
			want: []auth_service.ObjectType{
				auth_service.ObjectTypeDataView,
				auth_service.ObjectTypeAPI,
			},
		},
		{
			name: "输入不支持的类型",
			args: args{types: []DataResourceType{
				DataResourceTypeDataView,
				"UnsupportedType",
				DataResourceTypeInterface,
			}},
			want: []auth_service.ObjectType{
				auth_service.ObjectTypeDataView,
				auth_service.ObjectTypeAPI,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ObjectTypesFromDataResourceTypes(tt.args.types)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_dataResourceTypeObjectTypePolicyActionBindingFromDataResourceType(t *testing.T) {
	type args struct {
		t DataResourceType
	}
	tests := []struct {
		name          string
		args          args
		want          *dataResourceTypeObjectTypePolicyActionBinding
		wantErrString string
	}{
		{
			name: "逻辑视图",
			args: args{t: DataResourceTypeDataView},
			want: &dataResourceTypeObjectTypePolicyActionBinding{
				dataResourceType: DataResourceTypeDataView,
				objectType:       auth_service.ObjectTypeDataView,
				policyAction:     auth_service.PolicyActionDownload,
			},
		},
		{
			name: "接口",
			args: args{t: DataResourceTypeInterface},
			want: &dataResourceTypeObjectTypePolicyActionBinding{
				dataResourceType: DataResourceTypeInterface,
				objectType:       auth_service.ObjectTypeAPI,
				policyAction:     auth_service.PolicyActionRead,
			},
		},
		{
			name:          "不支持的类型",
			args:          args{t: "UnsupportedType"},
			wantErrString: `dataResourceTypeObjectTypePolicyActionBinding for DataResourceType "UnsupportedType" is not found`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := dataResourceTypeObjectTypePolicyActionBindingFromDataResourceType(tt.args.t)
			assert.Equal(t, tt.want, got)
			if tt.wantErrString != "" {
				assert.EqualError(t, err, tt.wantErrString)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func Test_dataResourceTypeObjectTypePolicyActionBindingFromObjectType(t *testing.T) {
	type args struct {
		t auth_service.ObjectType
	}
	tests := []struct {
		name          string
		args          args
		want          *dataResourceTypeObjectTypePolicyActionBinding
		wantErrString string
	}{
		{
			name: "逻辑视图",
			args: args{t: auth_service.ObjectTypeDataView},
			want: &dataResourceTypeObjectTypePolicyActionBinding{
				dataResourceType: DataResourceTypeDataView,
				objectType:       auth_service.ObjectTypeDataView,
				policyAction:     auth_service.PolicyActionDownload,
			},
		},
		{
			name: "接口",
			args: args{t: auth_service.ObjectTypeAPI},
			want: &dataResourceTypeObjectTypePolicyActionBinding{
				dataResourceType: DataResourceTypeInterface,
				objectType:       auth_service.ObjectTypeAPI,
				policyAction:     auth_service.PolicyActionRead,
			},
		},
		{
			name:          "不支持的类型",
			args:          args{t: "UnsupportedType"},
			wantErrString: `dataResourceTypeObjectTypePolicyActionBinding for ObjectType "UnsupportedType" is not found`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := dataResourceTypeObjectTypePolicyActionBindingFromObjectType(tt.args.t)
			assert.Equal(t, tt.want, got)
			if tt.wantErrString == "" {
				assert.NoError(t, err)
			} else {
				assert.EqualError(t, err, tt.wantErrString)
			}
		})
	}
}
