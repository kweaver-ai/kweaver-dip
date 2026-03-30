package v1

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/ptr"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util/validation/field"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	domain_mock "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule/mock"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type FakeUseCase struct {
	Bool                   bool
	CodeGenerationRule     *domain.CodeGenerationRule
	CodeGenerationRuleList *domain.CodeGenerationRuleList
	CodeList               *domain.CodeList

	Err error
}

// ExistenceCheckPrefix implements code_generation_rule.UseCase.
func (f *FakeUseCase) ExistenceCheckPrefix(ctx context.Context, prefix string) (bool, error) {
	if f.Err != nil {
		return false, f.Err
	}
	return f.Bool, nil
}

// Generate implements code_generation_rule.UseCase.
func (f *FakeUseCase) Generate(ctx context.Context, id uuid.UUID, opts domain.GenerateOptions) (*domain.CodeList, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.CodeList, nil
}

// Get implements code_generation_rule.UseCase.
func (f *FakeUseCase) Get(ctx context.Context, id uuid.UUID) (*domain.CodeGenerationRule, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.CodeGenerationRule, nil
}

// List implements code_generation_rule.UseCase.
func (f *FakeUseCase) List(ctx context.Context) (*domain.CodeGenerationRuleList, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.CodeGenerationRuleList, nil
}

// Patch implements code_generation_rule.UseCase.
func (f *FakeUseCase) Patch(ctx context.Context, rule *domain.CodeGenerationRule) (*domain.CodeGenerationRule, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.CodeGenerationRule, nil
}

// Upgrade implements code_generation_rule.UseCase.
func (f *FakeUseCase) Upgrade(ctx context.Context) error {
	panic("unimplemented")
}

var _ domain.UseCase = &FakeUseCase{}

func TestService_PatchCodeGenerationRule(t *testing.T) {
	log.InitLogger(zapx.LogConfigs{}, &common.TelemetryConf{})

	var (
		ruleID = uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")
		userID = uuid.MustParse("2556877a-e80e-11ee-aa0f-005056b4b3fc")

		rule = domain.CodeGenerationRule{
			CodeGenerationRule: model.CodeGenerationRule{
				ID: ruleID,
				CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
					Prefix:               "SJST",
					PrefixEnabled:        true,
					RuleCodeEnabled:      true,
					CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
					CodeSeparatorEnabled: true,
					DigitalCodeWidth:     6,
					DigitalCodeStarting:  1,
					DigitalCodeEnding:    999999,
				},
				CodeGenerationRuleStatus: model.CodeGenerationRuleStatus{UpdaterID: userID},
			},
		}
	)
	_ = rule

	tests := []struct {
		name string

		id        string
		request   string
		updaterID uuid.UUID

		statusCode int
		response   string

		ucArgs   [2]any
		ucReturn []any
	}{
		// {
		// 	name:       "成功更新编码规则",
		// 	id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
		// 	request:    "patch_0_req.json",
		// 	updaterID:  userID,
		// 	statusCode: http.StatusOK,
		// 	response:   "patch_0_resp.json",
		// 	ucArgs:     [2]any{gomock.Any(), &rule},
		// 	ucReturn:   []any{&domain.PredefinedCodeGenerationRuleDataView, nil},
		// },
		// {
		// 	name:       "发生未定义的错误",
		// 	id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
		// 	request:    "patch_0_req.json",
		// 	updaterID:  userID,
		// 	statusCode: http.StatusInternalServerError,
		// 	response:   "resp_error_undefined.json",
		// 	ucArgs:     [2]any{gomock.Any(), &rule},
		// 	ucReturn:   []any{nil, errors.New("something wrong")},
		// },
		// {
		// 	name:       "编码规则不存在",
		// 	id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
		// 	request:    "patch_0_req.json",
		// 	updaterID:  userID,
		// 	statusCode: http.StatusNotFound,
		// 	response:   "resp_error_not_found.json",
		// 	ucArgs:     [2]any{gomock.Any(), &rule},
		// 	ucReturn:   []any{nil, errorcode.Desc(errorcode.CodeGenerationRuleNotFound)},
		// },
		// {
		// 	name:       "数据库错误",
		// 	id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
		// 	request:    "patch_0_req.json",
		// 	updaterID:  userID,
		// 	statusCode: http.StatusInternalServerError,
		// 	response:   "resp_error_database_error.json",
		// 	ucArgs:     [2]any{gomock.Any(), &rule},
		// 	ucReturn:   []any{nil, errorcode.Desc(errorcode.CodeGenerationRuleDatabaseError)},
		// },
		{
			name:       "通道测试 DEBUG",
			id:         "13daf448-d9c4-11ee-81aa-005056b4b3fc",
			request:    "patch_20230325_1425.json",
			updaterID:  userID,
			statusCode: http.StatusBadRequest,
			response:   "resp_error_database_error.json",
			ucArgs:     [2]any{gomock.Any(), &rule},
			ucReturn:   []any{nil, errorcode.Desc(errorcode.CodeGenerationRuleDatabaseError)},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := domain_mock.NewMockUseCase(gomock.NewController(t))
			uc.EXPECT().Patch(tt.ucArgs[0], tt.ucArgs[1]).Return(tt.ucReturn...).AnyTimes()

			s := &Service{uc: uc}

			router := gin.New()
			router.POST(":id", func(c *gin.Context) {
				userInfo := &model.User{ID: tt.updaterID.String()}
				c.Set(interception.InfoName, userInfo)
				c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), interception.InfoName, userInfo))
			}, s.PatchCodeGenerationRule)

			r, err := os.Open(filepath.Join("testdata", tt.request))
			if err != nil {
				t.Fatal(err)
			}
			defer r.Close()

			w := httptest.NewRecorder()

			req, err := http.NewRequest(http.MethodPost, path.Join("/", tt.id), r)
			if err != nil {
				t.Fatal(err)
			}

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.statusCode, w.Code, "status code")
			assertResponseJSON(t, tt.response, w.Body)
		})
	}
}

func assertResponseJSON(t *testing.T, expectFilename string, actualBody io.Reader) bool {
	t.Helper()

	expectBytes, err := os.ReadFile(filepath.Join("testdata", expectFilename))
	if err != nil {
		t.Fatal(err)
	}

	actualBytes, err := io.ReadAll(actualBody)
	if err != nil {
		t.Fatal(err)
	}

	return assert.JSONEq(t, string(expectBytes), string(actualBytes), "response body")
}

func Test_getUserID(t *testing.T) {
	log.InitLogger(zapx.LogConfigs{}, &common.TelemetryConf{})

	type args struct {
		ctx context.Context
	}
	tests := []struct {
		name string
		args args
		want uuid.UUID
	}{
		{
			name: "成功获取到用户信息",
			args: args{ctx: context.WithValue(context.Background(), interception.InfoName, &model.User{ID: "029722c7-2e8d-45f2-b3b7-21ccb5b383cf"})},
			want: uuid.MustParse("029722c7-2e8d-45f2-b3b7-21ccb5b383cf"),
		},
		{
			name: "不包含用户信息",
			args: args{ctx: context.Background()},
			want: uuid.Nil,
		},
		{
			name: "不合法的 UUID",
			args: args{ctx: context.WithValue(context.Background(), interception.InfoName, &model.User{ID: "029722c7-2e8d-45f2-b3b7-21ccb5b383cg"})},
			want: uuid.Nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			AssertUUID(t, tt.want, getUserID(tt.args.ctx))
		})
	}
}

func AssertUUID(t *testing.T, expected, actual uuid.UUID, msgAndArgs ...any) bool {
	t.Helper()

	if expected != actual {
		return assert.Fail(t, fmt.Sprintf(
			"Error message not equal:\n"+
				"expected: %v\n"+
				"actual  : %v",
			expected, actual,
		), msgAndArgs...)
	}
	return true
}

type ErrorListAssertionFunc func(*testing.T, field.ErrorList, ...interface{}) bool

func AssertErrorListEmpty(t *testing.T, errList field.ErrorList, msgAndArgs ...any) bool {
	t.Helper()
	return assert.Len(t, errList, 0, msgAndArgs...)
}

func AssertErrorListOne(t *testing.T, errList field.ErrorList, msgAndArgs ...any) bool {
	t.Helper()
	return assert.Len(t, errList, 1, msgAndArgs...)
}

func TestValidatePrefix(t *testing.T) {
	tests := []struct {
		name       string
		enabled    *bool
		prefix     *string
		assertFunc ErrorListAssertionFunc
	}{
		{
			name:       "禁用 空字符串",
			enabled:    ptr.To(false),
			prefix:     ptr.To(""),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "禁用 未定义",
			enabled:    ptr.To(false),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "启用 空字符串",
			enabled:    ptr.To(true),
			prefix:     ptr.To(""),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 未定义",
			enabled:    ptr.To(true),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 A",
			enabled:    ptr.To(true),
			prefix:     ptr.To("A"),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 ab",
			enabled:    ptr.To(true),
			prefix:     ptr.To("ab"),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 AC",
			enabled:    ptr.To(true),
			prefix:     ptr.To("AC"),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "启用 AC00",
			enabled:    ptr.To(true),
			prefix:     ptr.To("AC00"),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 AC😀",
			enabled:    ptr.To(true),
			prefix:     ptr.To("AC😀"),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 ABCDEF",
			enabled:    ptr.To(true),
			prefix:     ptr.To("ABCDEF"),
			assertFunc: AssertErrorListEmpty,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.assertFunc(t, ValidatePrefix(tt.enabled, tt.prefix, nil))
		})
	}
}

func TestValidateRuleCode(t *testing.T) {
	tests := []struct {
		name       string
		enabled    *bool
		assertFunc ErrorListAssertionFunc
	}{
		{
			name:       "未定义",
			enabled:    nil,
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "true",
			enabled:    ptr.To(true),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "false",
			enabled:    ptr.To(false),
			assertFunc: AssertErrorListEmpty,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.assertFunc(t, ValidateRuleCode(tt.enabled, nil))
		})
	}
}

func TestValidateCodeSeparator(t *testing.T) {
	tests := []struct {
		name       string
		enabled    *bool
		separator  *string
		assertFunc ErrorListAssertionFunc
	}{
		{
			name:       "禁用 未定义",
			enabled:    ptr.To(false),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "禁用 空字符串",
			enabled:    ptr.To(false),
			separator:  ptr.To(""),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "启用 未定义",
			enabled:    ptr.To(true),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 空字符",
			enabled:    ptr.To(true),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 _",
			enabled:    ptr.To(true),
			separator:  ptr.To(`_`),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "启用 -",
			enabled:    ptr.To(true),
			separator:  ptr.To(`-`),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "启用 /",
			enabled:    ptr.To(true),
			separator:  ptr.To(`/`),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `启用 \`,
			enabled:    ptr.To(true),
			separator:  ptr.To(`\`),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "启用 %",
			enabled:    ptr.To(true),
			separator:  ptr.To("%"),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 c",
			enabled:    ptr.To(true),
			separator:  ptr.To("c"),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "启用 *",
			enabled:    ptr.To(true),
			separator:  ptr.To("*"),
			assertFunc: AssertErrorListOne,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.assertFunc(t, ValidateCodeSeparator(tt.enabled, tt.separator, nil))
		})
	}
}

func TestValidateDigitalCodeWidth(t *testing.T) {
	tests := []struct {
		name       string
		width      *int
		assertFunc ErrorListAssertionFunc
	}{
		{
			name:       `未定义`,
			assertFunc: AssertErrorListOne,
		},
		{
			name:       `-2`,
			width:      ptr.To(-2),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       `0`,
			width:      ptr.To(0),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       `1`,
			width:      ptr.To(1),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       `2`,
			width:      ptr.To(2),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       `3`,
			width:      ptr.To(3),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `4`,
			width:      ptr.To(4),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `5`,
			width:      ptr.To(5),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `6`,
			width:      ptr.To(6),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `7`,
			width:      ptr.To(7),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `8`,
			width:      ptr.To(8),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `9`,
			width:      ptr.To(9),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       `10`,
			width:      ptr.To(10),
			assertFunc: AssertErrorListOne,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.assertFunc(t, ValidateDigitalCodeWidth(tt.width, nil))
		})
	}
}

func TestValidateDigitalCodeStarting(t *testing.T) {
	tests := []struct {
		width      *int
		starting   *int
		assertFunc ErrorListAssertionFunc
	}{
		{
			width:      ptr.To(3),
			starting:   ptr.To(1),
			assertFunc: AssertErrorListEmpty,
		},
		{
			width:      ptr.To(3),
			starting:   ptr.To(99),
			assertFunc: AssertErrorListEmpty,
		},
		{
			width:      ptr.To(3),
			starting:   ptr.To(999),
			assertFunc: AssertErrorListEmpty,
		},
		{
			width:      ptr.To(3),
			starting:   ptr.To(1111),
			assertFunc: AssertErrorListOne,
		},
		{
			width:      ptr.To(6),
			starting:   ptr.To(2),
			assertFunc: AssertErrorListEmpty,
		},
		{
			width:      ptr.To(6),
			starting:   ptr.To(-2),
			assertFunc: AssertErrorListOne,
		},
		{
			width:      ptr.To(6),
			assertFunc: AssertErrorListOne,
		},
	}
	name := func(a, b *int) string {
		aa := "nil"
		if a != nil {
			aa = strconv.Itoa(*a)
		}
		bb := "nil"
		if b != nil {
			bb = strconv.Itoa(*b)
		}
		return aa + " " + bb
	}
	for _, tt := range tests {
		t.Run(name(tt.width, tt.starting), func(t *testing.T) {
			tt.assertFunc(t, ValidateDigitalCodeStarting(tt.width, tt.starting, nil))
		})
	}
}

func TestValidateDigitalCodeEnding(t *testing.T) {
	tests := []struct {
		name       string
		width      *int
		ending     *int
		assertFunc ErrorListAssertionFunc
	}{
		{
			name:       "未定义数字码宽度",
			ending:     ptr.To(999999),
			assertFunc: AssertErrorListEmpty,
		},
		{
			name:       "与数字码宽度不匹配",
			width:      ptr.To(3),
			ending:     ptr.To(999999),
			assertFunc: AssertErrorListOne,
		},
		{
			name:       "合法输入",
			width:      ptr.To(6),
			ending:     ptr.To(999999),
			assertFunc: AssertErrorListEmpty,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.assertFunc(t, ValidateDigitalCodeEnding(tt.width, tt.ending, nil))
		})
	}
}

func TestValidatePatchCodeGenerationRuleRequestV2(t *testing.T) {
	tests := []struct {
		name string
		req  *PatchCodeGenerationRuleRequest
		want ErrorListAssertionFunc
	}{
		{
			name: "所有属性都合法",
			req: &PatchCodeGenerationRuleRequest{
				Prefix:               ptr.To("SJST"),
				PrefixEnabled:        ptr.To(true),
				RuleCodeEnabled:      ptr.To(true),
				CodeSeparator:        ptr.To(`/`),
				CodeSeparatorEnabled: ptr.To(true),
				DigitalCodeWidth:     ptr.To(6),
				DigitalCodeStarting:  ptr.To(1),
				DigitalCodeEnding:    ptr.To(999999),
			},
			want: AssertErrorListEmpty,
		},
		{
			name: "禁用前缀 前缀为空字符串",
			req: &PatchCodeGenerationRuleRequest{
				Prefix:               ptr.To("SJST"),
				PrefixEnabled:        ptr.To(true),
				RuleCodeEnabled:      ptr.To(true),
				CodeSeparator:        ptr.To(`/`),
				CodeSeparatorEnabled: ptr.To(true),
				DigitalCodeWidth:     ptr.To(6),
				DigitalCodeStarting:  ptr.To(1),
				DigitalCodeEnding:    ptr.To(999999),
			},
			want: AssertErrorListEmpty,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.want(t, ValidatePatchCodeGenerationRuleRequest(tt.req, nil))
		})
	}
}

func TestUnmarshal(t *testing.T) {
	const a = `{"code_separator":"%","code_separator_enabled":true,"digital_code_ending":999999,"digital_code_starting":1,"digital_code_width":6,"prefix":"SJST","prefix_enabled":true,"rule_code_enabled":true}`
	req := &PatchCodeGenerationRuleRequest{}
	if err := json.Unmarshal([]byte(a), req); err != nil {
		t.Fatal(err)
	}
	j, err := json.MarshalIndent(req, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("req: %s", j)
}

func Test_generateDigitalCodeEnding(t *testing.T) {
	tests := []struct {
		width      int
		wantEnding int
	}{
		{width: 0, wantEnding: 0},
		{width: 1, wantEnding: 9},
		{width: 2, wantEnding: 99},
		{width: 3, wantEnding: 999},
		{width: 4, wantEnding: 9999},
		{width: 5, wantEnding: 99999},
		{width: 6, wantEnding: 999999},
		{width: 7, wantEnding: 9999999},
		{width: 8, wantEnding: 99999999},
		{width: 9, wantEnding: 999999999},
	}
	for _, tt := range tests {
		t.Run(strconv.Itoa(tt.width), func(t *testing.T) {
			if gotEnding := generateDigitalCodeEnding(tt.width); gotEnding != tt.wantEnding {
				t.Errorf("generateDigitalCodeEnding() = %v, want %v", gotEnding, tt.wantEnding)
			}
		})
	}
}
