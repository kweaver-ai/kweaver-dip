package info_system

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/opensearch"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func TestDomain_Search(t *testing.T) {
	log.InitLogger(zapx.LogConfigs{}, &common.TelemetryConf{})
	openSearch, err := opensearch.NewOpenSearchClient(&settings.Config{
		OpenSearchConf: settings.OpenSearchConf{
			ReadUri:  "http://10.4.110.47:31126",
			WriteUri: "http://10.4.110.47:31126",
			Username: "admin",
			Password: "password",
			Debug:    true,
			Highlight: struct {
				PreTag  string "json:\"preTag\""
				PostTag string "json:\"postTag\""
			}{
				PreTag:  "<span>",
				PostTag: "</span>",
			},
		},
	})
	require.NoError(t, err)

	d := &Domain{OpenSearch: openSearch}

	type args struct {
		query *basic_search_v1.InfoSystemSearchQuery
		opts  *basic_search_v1.InfoSystemSearchOptions
	}
	tests := []struct {
		name string
		args args
	}{
		{
			name: "first 2",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{},
				opts:  &basic_search_v1.InfoSystemSearchOptions{Limit: 2},
			},
		},
		{
			name: "next 2",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{},
				opts: &basic_search_v1.InfoSystemSearchOptions{
					Limit:    2,
					Continue: "WzE3NDQ2MDAyMDAwMDAsIjAxOTYzMjQ5LTNjMGUtNzQwNy1iZDM4LTIwMWI5ODVjNTc5MSJd",
				},
			},
		},
		{
			name: "keyword",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{
					Keyword: "名称",
				},
				opts: &basic_search_v1.InfoSystemSearchOptions{Limit: 2},
			},
		},
		{
			name: "keyword continue",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{
					Keyword: "名称",
				},
				opts: &basic_search_v1.InfoSystemSearchOptions{
					Limit:    2,
					Continue: "WzAuMTM5MjI3MDMsIjAxOTYzMjQ1LTUzYzQtN2I0OS04NDhiLWZkN2EzOTBmODQzOSJd",
				},
			},
		},
		{
			name: "keyword continue continue",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{
					Keyword: "名称",
				},
				opts: &basic_search_v1.InfoSystemSearchOptions{
					Limit:    2,
					Continue: "WzAuMTM5MjI3MDMsIjAxOTYzMjVjLWMxZTctNzMyYi04Y2E0LTZiMzYyMjcwNDlkZCJd",
				},
			},
		},
		{
			name: "department",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{
					DepartmentIDs: uuid.UUIDs{
						uuid.MustParse("01963249-3c0e-7416-b506-01d3a0c94834"),
					},
				},
				opts: &basic_search_v1.InfoSystemSearchOptions{Limit: 10},
			},
		},
		{
			name: "departments",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{
					DepartmentIDs: uuid.UUIDs{
						uuid.MustParse("01963249-3c0e-7416-b506-01d3a0c94834"),
						uuid.MustParse("01963246-75d0-7d20-87ab-1aab78873b11"),
					},
				},
				opts: &basic_search_v1.InfoSystemSearchOptions{Limit: 10},
			},
		},
		{
			name: "without department",
			args: args{
				query: &basic_search_v1.InfoSystemSearchQuery{DepartmentIDs: uuid.UUIDs{}},
				opts:  &basic_search_v1.InfoSystemSearchOptions{Limit: 10},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := d.Search(context.TODO(), tt.args.query, tt.args.opts)
			require.NoError(t, err)

			gotJSON, err := json.MarshalIndent(got, "", "  ")
			require.NoError(t, err)

			t.Logf("got: %s", gotJSON)
		})
	}
}
