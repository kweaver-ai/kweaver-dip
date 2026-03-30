package info_system

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	api_basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	api_data_catalog_frontend_v1 "github.com/kweaver-ai/idrm-go-common/api/data_catalog/frontend/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

func TestDomain_newBSQuery(t *testing.T) {
	d := &Domain{}

	tests := []struct {
		name   string
		filter *api_data_catalog_frontend_v1.InfoSystemSearchFilter
		want   *api_basic_search_v1.InfoSystemSearchQuery
	}{
		{
			name: "不属于任何部门",
			filter: &api_data_catalog_frontend_v1.InfoSystemSearchFilter{
				DepartmentID: ptr.To(""),
			},
			want: &api_basic_search_v1.InfoSystemSearchQuery{
				DepartmentIDs: uuid.UUIDs{},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := d.newBSQuery(context.TODO(), tt.filter)
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)

			assert.Nil(t, tt.want.DepartmentIDs, "want.DepartmentIDs")
			assert.Nil(t, got.DepartmentIDs, "got.DepartmentIDs")

			wantJSON, err := json.Marshal(tt.want)
			require.NoError(t, err)
			t.Logf("want: %s", wantJSON)

			gotJSON, err := json.Marshal(got)
			require.NoError(t, err)
			t.Logf("got: %s", gotJSON)
		})
	}
}
