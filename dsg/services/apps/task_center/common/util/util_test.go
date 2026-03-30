package util

import (
	"errors"
	"github.com/stretchr/testify/assert"
	"k8s.io/utils/strings/slices"
	"testing"
)

func TestCopy(t *testing.T) {
	source := []string{"1", "2", "3", "4"}
	dest := make([]string, 0)
	err := Copy(&source, &dest)
	assert.Nil(t, err)
	dest[0] = "11"
	assert.True(t, source[0] != dest[0])
}

func TestIsContain(t *testing.T) {
	source := []string{"1", "2", "3", "4"}
	assert.True(t, IsContain(source, "1"))
	assert.False(t, IsContain(source, "5"))
}

func TestNewUUID(t *testing.T) {
	unique := make(map[string]int)
	for i := 0; i < 100; i++ {
		uuid := NewUUID()
		if _, ok := unique[uuid]; ok {
			assert.Error(t, errors.New("create a same uuid"))
		} else {
			unique[uuid] = 1
		}
	}
}

func TestPathExists(t *testing.T) {
	assert.True(t, PathExists("."))
	assert.False(t, PathExists("xxx"))
}

func TestRandomInt(t *testing.T) {
	unique := make(map[int]int)
	for i := 0; i < 100; i++ {
		n := RandomInt(1000)
		if _, ok := unique[n]; ok {
			assert.Error(t, errors.New("create a same uuid"))
		} else {
			unique[n] = 1
		}
	}
}

func TestSliceUnique(t *testing.T) {
	source := []string{"1", "2", "3", "4", "3"}
	unique := SliceUnique(source)
	assert.False(t, slices.Equal(source, unique))
}

func TestTransAnyStruct(t *testing.T) {
	type TagTest struct {
		Name string `json:"name" xxx:"realName"`
		Age  int    `json:"age" xxx:"realAge,default=1"`
	}
	ts := TagTest{
		Name: "task_center",
		Age:  20,
	}
	smap := TransAnyStruct(ts)
	if _, ok := smap["name"]; !ok {
		assert.Error(t, errors.New("invalid struct"))
	}

	anyMap := TransAnyStruct("ss")
	if _, ok := anyMap["ss"]; ok {
		assert.Error(t, errors.New("invalid struct any"))
	}
}
