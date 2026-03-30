package v1

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"path"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	domain_mock "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule/mock"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

func TestService_GetCodeGenerationRule(t *testing.T) {
	tests := []struct {
		name string

		id         string
		statusCode int
		response   string

		ucArgs   [2]any
		ucReturn []any
	}{
		{
			name:       "获取编码规则",
			id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
			statusCode: http.StatusOK,
			response:   "get_0_resp.json",
			ucArgs:     [2]any{gomock.Any(), uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")},
			ucReturn: []any{
				&domain.CodeGenerationRule{
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
				}, nil,
			},
		},
		{
			name:       "发生未定义的错误",
			id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
			statusCode: http.StatusInternalServerError,
			response:   "resp_error_undefined.json",
			ucArgs:     [2]any{gomock.Any(), uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")},
			ucReturn:   []any{nil, errors.New("something wrong")},
		},
		{
			name:       "编码规则不存在",
			id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
			statusCode: http.StatusNotFound,
			response:   "resp_error_not_found.json",
			ucArgs:     [2]any{gomock.Any(), uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")},
			ucReturn:   []any{nil, errorcode.Desc(errorcode.CodeGenerationRuleNotFound)},
		},
		{
			name:       "数据库错误",
			id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
			statusCode: http.StatusInternalServerError,
			response:   "resp_error_database_error.json",
			ucArgs:     [2]any{gomock.Any(), uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")},
			ucReturn:   []any{nil, errorcode.Desc(errorcode.CodeGenerationRuleDatabaseError)},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := domain_mock.NewMockUseCase(gomock.NewController(t))
			uc.EXPECT().Get(tt.ucArgs[0], tt.ucArgs[1]).Return(tt.ucReturn...).AnyTimes()

			s := &Service{uc: uc}

			router := gin.New()
			router.GET(":id", s.GetCodeGenerationRule)

			w := httptest.NewRecorder()
			req, err := http.NewRequest(http.MethodGet, path.Join("/", tt.id), http.NoBody)
			if err != nil {
				t.Fatal(err)
			}

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.statusCode, w.Code, "status code")
			assertResponseJSON(t, tt.response, w.Body)
		})
	}
}
