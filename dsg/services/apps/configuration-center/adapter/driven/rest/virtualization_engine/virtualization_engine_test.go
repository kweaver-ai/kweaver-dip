package virtualization_engine

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func init() {
	log.InitLogger(zapx.LogConfigs{}, &common.TelemetryConf{})
}

func TestVirtualizationEngine_GetConnectors(t *testing.T) {
	tests := []struct {
		name         string
		roundTripper http.RoundTripper
		wantResult   *GetConnectorsRes
		wantErr      bool
	}{
		{
			name:         "example",
			roundTripper: newStaticRoundTripper(http.StatusOK, "yapi_mock_connectors.json"),
			wantResult: &GetConnectorsRes{
				ConnectorNames: []GetConnectorsResConnector{
					{
						OLKConnectorName:  "postgresql",
						ShowConnectorName: "PostgreSQL",
					},
					{
						OLKConnectorName:  "sqlserver",
						ShowConnectorName: "SQL Server",
					},
					{
						OLKConnectorName:  "mysql",
						ShowConnectorName: "MySQL",
					},
					{
						OLKConnectorName:  "maria",
						ShowConnectorName: "MariaDB",
					},
					{
						OLKConnectorName:  "oracle",
						ShowConnectorName: "Oracle",
					},
					{
						OLKConnectorName:  "hive-hadoop2",
						ShowConnectorName: "Apache Hive(hadoop2)",
					},
					{
						OLKConnectorName:  "hive-jdbc",
						ShowConnectorName: "Apache Hive",
					},
					{
						OLKConnectorName:  "clickhouse",
						ShowConnectorName: "ClickHouse",
					},
					{
						OLKConnectorName:  "doris",
						ShowConnectorName: "Apache Doris",
					},
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v := &VirtualizationEngine{HttpClient: &http.Client{Transport: tt.roundTripper}}

			gotResult, err := v.GetConnectors(context.TODO())

			if assert.NoError(t, err) {
				assert.Equal(t, tt.wantResult, gotResult)
			}
		})
	}
}

func TestVirtualizationEngine_GetConnectorConfig(t *testing.T) {
	type args struct {
		name string
	}
	tests := []struct {
		name        string
		roundTrpper http.RoundTripper
		wantResult  *ConnectorConfig
		wantErr     bool
	}{
		{
			name:        "example",
			roundTrpper: newStaticRoundTripper(http.StatusOK, "yapi_mock_connectors_config_sqlserver.json"),
			wantResult: &ConnectorConfig{
				ConnectorName: "sqlserver",
				SchemaExist:   true,
				URL:           "jdbc:sqlserver://",
				Type: []GetConnectorConfigResType{
					{
						SourceType:    "TINYINT",
						OLKSearchType: "TINYINT",
						OLKWriteType:  "TINYINT",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "SMALLINT",
						OLKSearchType: "SMALLINT",
						OLKWriteType:  "SMALLINT",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "INT",
						OLKSearchType: "INT",
						OLKWriteType:  "INT",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "BIGINT",
						OLKSearchType: "BIGINT",
						OLKWriteType:  "BIGINT",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "FLOAT",
						OLKSearchType: "REAL",
						OLKWriteType:  "REAL",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "REAL",
						OLKSearchType: "REAL",
						OLKWriteType:  "REAL",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "",
						OLKSearchType: "DOUBLE",
						OLKWriteType:  "FLOAT",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "DECIMAL",
						OLKSearchType: "DECIMAL",
						OLKWriteType:  "DECIMAL",
						PrecisionFlag: PrecisionFlagWithLengthWithPrecision,
						MinTypeLength: 1,
						MaxTypeLength: 38,
					},
					{
						SourceType:    "NUMERIC",
						OLKSearchType: "NUMERIC",
						OLKWriteType:  "DECIMAL",
						PrecisionFlag: PrecisionFlagWithLengthWithPrecision,
						MinTypeLength: 1,
						MaxTypeLength: 38,
					},
					{
						SourceType:    "BIT",
						OLKSearchType: "BOOLEAN",
						OLKWriteType:  "BIT",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "DATE",
						OLKSearchType: "DATE",
						OLKWriteType:  "DATE",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "TIME",
						OLKSearchType: "TIME",
						OLKWriteType:  "TIME",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "TIMESTAMP",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "DATETIME",
						OLKSearchType: "TIMESTAMP",
						OLKWriteType:  "DATETIME",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "DATETIME2",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "SMALLDATETIME",
						OLKSearchType: "TIMESTAMP",
						OLKWriteType:  "DATETIME",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "DATETIMEOFFSET",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "CHAR",
						OLKSearchType: "CHAR",
						OLKWriteType:  "NCHAR",
						PrecisionFlag: PrecisionFlagWithLengthWithoutPrecision,
						MinTypeLength: 1,
						MaxTypeLength: 4000,
					},
					{
						SourceType:    "NCHAR",
						OLKSearchType: "VARCHAR",
						OLKWriteType:  "NVARCHAR",
						PrecisionFlag: PrecisionFlagWithLengthWithoutPrecision,
					},
					{
						SourceType:    "VARCHAR",
						OLKSearchType: "VARCHAR",
						OLKWriteType:  "NVARCHAR",
						PrecisionFlag: PrecisionFlagWithLengthWithoutPrecision,
					},
					{
						SourceType:    "TEXT",
						OLKSearchType: "VARCHAR",
						OLKWriteType:  "NVARCHAR(max)",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "NVARCHAR",
						OLKSearchType: "VARCHAR",
						OLKWriteType:  "NVARCHAR",
						PrecisionFlag: PrecisionFlagWithLengthWithoutPrecision,
					},
					{
						SourceType:    "NTEXT",
						OLKSearchType: "VARCHAR",
						OLKWriteType:  "NVARCHAR(max)",
					},
					{
						SourceType:    "BINARY",
						OLKSearchType: "VARBINARY",
						OLKWriteType:  "VARBINARY",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "VARBINARY",
						OLKSearchType: "VARBINARY",
						OLKWriteType:  "VARBINARY",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "IMAGE",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "UNIQUEIDENTIFIER",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "MONEY",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "SMALLMONEY",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "XML",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "GEOGRAPHY",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "GEOMETRY",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "HIERARCHYID",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "SQL_VARIANT",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "SYSNAME",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
					{
						SourceType:    "CURSOR",
						PrecisionFlag: PrecisionFlagWithoutLengthWithoutPrecision,
					},
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v := &VirtualizationEngine{HttpClient: &http.Client{Transport: tt.roundTrpper}}

			gotResult, err := v.GetConnectorConfig(context.TODO(), tt.name)

			if assert.NoError(t, err) {
				assert.Equal(t, tt.wantResult, gotResult)
			}
		})
	}
}

type staticRoundTripper struct {
	// response's status code
	code int
	// for response body
	body []byte
}

// newStaticRoundTripper creates a static round tripper and return the response body's closer.
func newStaticRoundTripper(code int, name string) *staticRoundTripper {
	p := filepath.Join("testdata", name)
	b, err := os.ReadFile(p)
	if err != nil {
		panic(err)
	}

	return &staticRoundTripper{code: code, body: b}
}

// RoundTrip implements http.RoundTripper.
func (rt *staticRoundTripper) RoundTrip(_ *http.Request) (*http.Response, error) {
	return &http.Response{StatusCode: rt.code, Body: io.NopCloser(bytes.NewReader(rt.body))}, nil
}

var _ http.RoundTripper = &staticRoundTripper{}

func TestCheckYApiMock(t *testing.T) {
	tests := []struct {
		name   string
		method string
		url    string
		body   io.ReadCloser
		want   string
	}{
		{
			name:   "get connectors",
			method: http.MethodGet,
			url:    "http://api.kweaver-ai.cn/mock/3003/api/virtual_engine_service/v1/connectors",
			body:   http.NoBody,
			want:   "yapi_mock_connectors.json",
		},
		{
			name:   "get connector config",
			method: http.MethodGet,
			url:    "http://api.KweaverAIer-ai.cn/mock/3003/api/virtual_engine_service/v1/connectors/config/sqlserver",
			body:   http.NoBody,
			want:   "yapi_mock_connectors_config_sqlserver.json",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequestWithContext(context.TODO(), tt.method, tt.url, tt.body)
			if err != nil {
				t.Fatal(err)
			}

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()

			if !assert.Equal(t, http.StatusOK, resp.StatusCode) {
				return
			}

			got, err := io.ReadAll(resp.Body)
			if err != nil {
				t.Fatal(err)
			}

			want, err := os.ReadFile(filepath.Join("testdata", tt.want))
			if err != nil {
				t.Fatal(err)
			}

			assert.Equal(t, want, got, "YApi mock has been updated")
		})
	}
}
