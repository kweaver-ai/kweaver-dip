package v1

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

func TestService_ListCodeGenerationRules(t *testing.T) {
	form_validator.SetupValidator()

	const apiPath = "/api/configuration-center/v1/code-generation-rules"

	tests := []struct {
		name string

		uc *FakeUseCase

		statusCode int
		response   string
	}{
		{
			name: "获取更新编码规则",
			uc: &FakeUseCase{
				CodeGenerationRuleList: &domain.CodeGenerationRuleList{
					Entries: []domain.CodeGenerationRule{
						{
							CodeGenerationRule: model.CodeGenerationRule{
								ID:   uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc"),
								Name: "逻辑视图",
								CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
									Type:                 model.CodeGenerationRuleTypeDataView,
									Prefix:               "SJST",
									PrefixEnabled:        true,
									RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
									RuleCodeEnabled:      true,
									CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
									CodeSeparatorEnabled: true,
									DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
									DigitalCodeWidth:     6,
									DigitalCodeStarting:  1,
									DigitalCodeEnding:    999999,
								},
								CodeGenerationRuleStatus: model.CodeGenerationRuleStatus{
									UpdaterID: uuid.MustParse("69480a5b-31cb-49db-a390-c6b84c3563a0"),
									CreatedAt: time.Date(2024, 03, 22, 11, 04, 23, 0, time.Local),
									UpdatedAt: time.Date(2024, 03, 22, 11, 05, 23, 0, time.Local),
								},
							},
							UpdaterName: "Remilia",
						},
					},
					TotalCount: 1,
				},
			},
			statusCode: http.StatusOK,
			response:   "list_0_resp.json",
		},
		{
			name:       "发生未定义的错误",
			uc:         &FakeUseCase{Err: errors.New("something wrong")},
			statusCode: http.StatusInternalServerError,
			response:   "resp_error_undefined.json",
		},
		{
			name:       "数据库错误",
			uc:         &FakeUseCase{Err: errorcode.Desc(errorcode.CodeGenerationRuleDatabaseError)},
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
			router.GET(apiPath, s.ListCodeGenerationRules)

			w := httptest.NewRecorder()
			req, err := http.NewRequest(http.MethodGet, apiPath, http.NoBody)
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
