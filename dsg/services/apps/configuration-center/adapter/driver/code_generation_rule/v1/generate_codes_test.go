package v1

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
)

func TestService_GenerateCodes(t *testing.T) {
	form_validator.SetupValidator()

	const apiPath = "/api/configuration-center/v1/code-generation-rules"

	var id = uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")

	tests := []struct {
		name string

		uc *FakeUseCase

		request string

		statusCode int
		response   string
	}{
		{
			name: "成功生成编码",
			uc: &FakeUseCase{
				CodeList: &domain.CodeList{
					Entries: []string{
						"SJST20240322/000001",
					},
					TotalCount: 1,
				},
			},
			request:    "generate_codes_0_req.json",
			statusCode: http.StatusOK,
			response:   "generate_codes_0_resp.json",
		},
		{
			name:       "发生未定义的错误",
			uc:         &FakeUseCase{Err: errors.New("something wrong")},
			request:    "generate_codes_0_req.json",
			statusCode: http.StatusInternalServerError,
			response:   "resp_error_undefined.json",
		},
		{
			name:       "编码规则不存在",
			uc:         &FakeUseCase{Err: errorcode.Desc(errorcode.CodeGenerationRuleNotFound)},
			request:    "generate_codes_0_req.json",
			statusCode: http.StatusNotFound,
			response:   "resp_error_not_found.json",
		},
		{
			name:       "数据库错误",
			uc:         &FakeUseCase{Err: errorcode.Desc(errorcode.CodeGenerationRuleDatabaseError)},
			request:    "generate_codes_0_req.json",
			statusCode: http.StatusInternalServerError,
			response:   "resp_error_database_error.json",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &Service{
				uc: tt.uc,
			}

			router := gin.New()
			router.POST(path.Join(apiPath, ":id"), s.GenerateCodes)

			r, err := os.Open(filepath.Join("testdata", tt.request))
			if err != nil {
				t.Fatal(err)
			}
			defer r.Close()

			w := httptest.NewRecorder()
			req, err := http.NewRequest(http.MethodPost, path.Join(apiPath, id.String()), r)
			if err != nil {
				t.Fatal(err)
			}

			router.ServeHTTP(w, req)
			t.Logf("response %d: %s", w.Code, w.Body)

			assert.Equal(t, tt.statusCode, w.Code, "status code")
			assertResponseJSON(t, tt.response, w.Body)
		})
	}
}

func TestParseURLParamID(t *testing.T) {
	id, err := uuid.Parse("%F0%9F%99%82")
	t.Log(id, err)
}
