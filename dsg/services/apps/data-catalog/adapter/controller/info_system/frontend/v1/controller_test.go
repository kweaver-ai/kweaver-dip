package v1

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"

	data_catalog_frontend_v1 "github.com/kweaver-ai/idrm-go-common/api/data_catalog/frontend/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

func TestJSON(t *testing.T) {
	tests := []struct {
		name string
		data any
	}{
		{
			name: "search",
			data: &data_catalog_frontend_v1.InfoSystemSearch{
				Filter: &data_catalog_frontend_v1.InfoSystemSearchFilter{
					Keyword:      "关键字",
					DepartmentID: ptr.To("019623d0-b23a-7951-a2ad-e2ab6ad19ef9"),
				},
				Limit: 10,
			},
		},
		{
			name: "search-continue",
			data: &data_catalog_frontend_v1.InfoSystemSearch{
				Filter: &data_catalog_frontend_v1.InfoSystemSearchFilter{
					Keyword:      "关键字",
					DepartmentID: ptr.To("019623d0-b23a-7951-a2ad-e2ab6ad19ef9"),
				},
				Limit:    10,
				Continue: base64.StdEncoding.EncodeToString([]byte(`{"hello":"world"}`)),
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f, err := os.Create(filepath.Join("testdata", tt.name+".json"))
			require.NoError(t, err)
			defer f.Close()

			codec := json.NewEncoder(f)
			codec.SetIndent("", "    ")
			require.NoError(t, codec.Encode(tt.data))
		})
	}
}
