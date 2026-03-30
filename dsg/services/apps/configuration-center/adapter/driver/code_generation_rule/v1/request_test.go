package v1

import (
	"net/http"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestPatchCodeGenerationRuleRequest(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr assert.ErrorAssertionFunc
	}{
		{
			name: "合法输入",
			body: `{
				"id": "3c68d2b0-fdc9-48a0-9658-2aefa9c629df",
				"type": "DataCatalog",
				"prefix": "SJST",
				"prefix_enabled": true,
				"rule_code": "YYYYMMDD",
				"rule_code_enabled": true,
				"code_separator": "_",
				"code_separator_enabled": true,
				"digital_code_type": "Sequence",
				"digital_code_width": 6,
				"digital_code_starting": 1,
				"digital_code_ending": 999999,
				"updater_id": "3c68d2b0-fdc9-48a0-9658-2aefa9c629df"
			}`,
			wantErr: assert.NoError,
		},
	}
	for _, tt := range tests {
		req, err := http.NewRequest(http.MethodPost, "", strings.NewReader(tt.body))
		if err != nil {
			t.Fatal(err)
		}

		c := &gin.Context{Request: req}

		opts := &PatchCodeGenerationRuleRequest{}
		err = c.ShouldBindJSON(opts)
		tt.wantErr(t, err)
	}
}

func TestGenerateCodesRequest(t *testing.T) {
	for _, tt := range []struct {
		body    string
		wantErr assert.ErrorAssertionFunc
	}{
		{
			body:    `{"count":1}`,
			wantErr: assert.NoError,
		},
		{
			body:    `{"count":10}`,
			wantErr: assert.NoError,
		},
		{
			body:    `{"count":0}`,
			wantErr: assert.Error,
		},
		{
			body:    `{"count":false}`,
			wantErr: assert.Error,
		},
		{
			body:    `{}`,
			wantErr: assert.Error,
		},
		{
			body:    `{"count":true}`,
			wantErr: assert.Error,
		},
	} {
		t.Run("", func(t *testing.T) {
			req, err := http.NewRequest(http.MethodPost, "", strings.NewReader(tt.body))
			if err != nil {
				t.Fatal(err)
			}

			c := &gin.Context{Request: req}

			opts := &GenerateCodesRequest{}
			err = c.ShouldBindJSON(opts)
			t.Log(tt.body)
			t.Log(err)
			tt.wantErr(t, err, tt.body)
		})
	}

}
