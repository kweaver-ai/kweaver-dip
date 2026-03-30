package errorcode

import (
	"errors"
	"fmt"
	"testing"

	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/stretchr/testify/assert"
)

func TestDesc(t *testing.T) {
	desc := Desc(InternalError)
	_, ok := desc.(*agerrors.Error)
	assert.True(t, ok)
}

func TestDetail(t *testing.T) {
	detail := Detail(InternalError, errors.New("test error"))
	_, ok := detail.(*agerrors.Error)
	assert.True(t, ok)
}

func TestFormatDescription(t *testing.T) {
	s1 := FormatDescription("task [center]", "hello")
	assert.Equal(t, s1, "task [hello]")

	s2 := FormatDescription("task [%v]", "hello")
	assert.Equal(t, s2, "task [hello]")
}

func TestAnd(t *testing.T) {
	var a1 int8 = 7
	var b1 int8 = 1 //1 2 4
	fmt.Println(a1&b1 == 0)
	a1 = 6                  //2+4
	b1 = 1                  //1 2 4
	fmt.Println(a1&b1 == 0) //true
	a1 = 2                  //2+4
	b1 = 1                  //1 2 4
	fmt.Println(a1&b1 == 0) //true

}
