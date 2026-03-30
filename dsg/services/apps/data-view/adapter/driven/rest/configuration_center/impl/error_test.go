package impl

import (
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"

	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

func TestResponseErrorIs(t *testing.T) {
	for _, tt := range []struct {
		err  error
		want assert.BoolAssertionFunc
	}{
		{
			err:  &ResponseError{Code: "a.b.c.d"},
			want: assert.True,
		},
		{
			err:  fmt.Errorf("wrapped: %w", &ResponseError{Code: "a.b.c.d"}),
			want: assert.True,
		},
		{
			err:  fmt.Errorf("wrapped: %w", fmt.Errorf("wrapped: %w", &ResponseError{Code: "a.b.c.d"})),
			want: assert.True,
		},
		{
			err:  errors.New("testing"),
			want: assert.False,
		},
	} {
		tt.want(t, errors.Is(tt.err, &ResponseError{}))
	}
}

func TestWrapError(t *testing.T) {
	for _, err := range []error{
		&ResponseError{Code: "ConfiguraionCenter.CodeGenerationRule.ExceedEnding", Description: "期望生成的编码超过终止值[111]", Solution: "联系管理员"},
		errors.New("something wrong"),
	} {
		// t.Logf("\nraw error: %v\nwrapped error: %v", err, WrapError("TestErrorCode", err))
		err = WrapError(my_errorcode.CodeGenerationFailure, err)
		code := agerrors.Code(err)
		t.Log("cod is nil:", code == agcodes.CodeNil)

		j, err := json.Marshal(ginx.HttpError{
			Code:        code.GetErrorCode(),
			Description: code.GetDescription(),
			Solution:    code.GetSolution(),
			Cause:       code.GetCause(),
			Detail:      code.GetErrorDetails(),
		})
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("error: %s", j)
	}
}
