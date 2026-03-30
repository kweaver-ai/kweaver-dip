package virtual_engine

import (
	"reflect"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/infrastructure/repository/db/model"
)

func Test_virtualEngineRepo_Fetch(t *testing.T) {
	type args struct {
		script                 string
		serviceResponseFilters []model.ServiceResponseFilter
	}
	tests := []struct {
		name         string
		args         args
		wantFetchRes *FetchRes
		wantErr      bool
	}{
		{
			name: "",
			args: args{
				script: `select id, developer_id, developer_name from "data_application_service_130_136"."data_application_service"."developer"`,
				serviceResponseFilters: []model.ServiceResponseFilter{
					{
						ID:        0,
						ServiceID: "",
						Param:     "id",
						Operator:  "=",
						Value:     "488e021a-e48a-40e7-94f0-fadbd139d133",
					},
					{
						ID:        0,
						ServiceID: "",
						Param:     "developer_name",
						Operator:  "=",
						Value:     "xxx",
					},
				},
			},
			wantFetchRes: nil,
			wantErr:      false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v := &virtualEngineRepo{}
			gotFetchRes, err := v.Fetch(nil, tt.args.script, 0, tt.args.serviceResponseFilters)
			if (err != nil) != tt.wantErr {
				t.Errorf("Fetch() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotFetchRes, tt.wantFetchRes) {
				t.Errorf("Fetch() gotFetchRes = %v, want %v", gotFetchRes, tt.wantFetchRes)
			}
		})
	}
}
