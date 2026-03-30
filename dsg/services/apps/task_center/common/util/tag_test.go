package util

import (
	"github.com/stretchr/testify/assert"
	"reflect"
	"testing"
)

type TagTest struct {
	Name string `json:"name" xxx:"realName"`
	Age  int    `json:"age" xxx:"realAge,default=1"`
}

func TestFindTagName(t *testing.T) {
	tt := TagTest{
		Name: "task_center",
		Age:  20,
	}

	ttv := reflect.TypeOf(tt)
	vName, _ := ttv.FieldByName("Name")
	nameTagValue := FindTagName(vName, "xxx")
	assert.Equal(t, nameTagValue, "realName")

	vAge, _ := ttv.FieldByName("Age")
	ageTagValue := FindTagName(vAge, "xxx")
	assert.Equal(t, ageTagValue, "realAge")
}
