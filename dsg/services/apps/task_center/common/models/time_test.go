package models

import (
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

type UserForTest struct {
	Name  string     `json:"name"`
	Birth CommonTime `json:"birth"`
}

func TestCommonTime_MarshalJSON_1(t1 *testing.T) {
	ut := UserForTest{
		Name:  "Tom",
		Birth: CommonTime{time.Now()},
	}
	utStr, _ := json.Marshal(ut)
	ut1 := UserForTest{}
	err := json.Unmarshal(utStr, &ut1)
	assert.Nil(t1, err)
	assert.Equal(t1, "Tom", ut1.Name)
}

func TestCommonTime_MarshalJSON_2(t1 *testing.T) {
	ut := UserForTest{
		Name: "Tom",
	}
	utStr, _ := json.Marshal(ut)
	ut1 := UserForTest{}
	err := json.Unmarshal(utStr, &ut1)
	assert.Nil(t1, err)
	assert.Equal(t1, "Tom", ut1.Name)
}

func TestCommonTime_Scan(t1 *testing.T) {

}

func TestCommonTime_UnmarshalJSON(t1 *testing.T) {

}

func TestCommonTime_Value(t1 *testing.T) {
}
