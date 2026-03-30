package form_validator

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/stretchr/testify/assert"
)

type TestRequestItem struct {
	Name        string             `json:"name" form:"name" binding:"trimSpace,verifyName"`
	NickName    string             `json:"nick_name" form:"nick_name" binding:"verifyNameNotRequired"`
	LastName    []string           `json:"last_name" form:"last_name" binding:"maxLen=2"`
	TaskName    string             `json:"task_name" form:"task_name" binding:"verifyNameTask"`
	Description string             `json:"description" form:"description" binding:"verifyDescription255"`
	Status      string             `json:"status" form:"status" binding:"verifyMultiStatus"`
	Priority    string             `json:"priority" form:"priority" binding:"verifyMultiPriority"`
	Deadline    int64              `json:"deadline" form:"deadline" binding:"verifyDeadline"`
	Members     string             `json:"members" form:"members" binding:"verifyMultiUuid"`
	Creator     string             `json:"creator" form:"creator" binding:"verifyUuidNotRequired"`
	Updater     string             `json:"updater" form:"updater" binding:"verifyUserExistence"`
	Role        string             `json:"role" form:"role" binding:"verifyRoleExistence"`
	Properties  []TestPropertyInfo `json:"display_properties"    form:"display_properties"  binding:"unique=Property,required"  mapstructure:"-"`
}

type TestPropertyInfo struct {
	Property string `json:"key"  form:"key" binding:"required,verifyName"`
	Explain  string `json:"explain" form:"explain" binding:"required,verifyDescription255"`
}

func requestWithBody(method, path, body string) (req *http.Request) {
	req, _ = http.NewRequest(method, path, bytes.NewBufferString(body))
	return
}

func TestPostJson_ok(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	reqBody := TestRequestItem{
		Name:        "task_center              ",
		NickName:    "AF_task_center",
		LastName:    []string{"1234567890", "1234567890"},
		TaskName:    "this_is_a_task_name",
		Description: "task center of AnyData Fabric",
		Status:      fmt.Sprintf("%s,%s,%s", constant.CommonStatusReady.String, constant.CommonStatusOngoing.String, constant.CommonStatusCompleted.String),
		//Priority:    fmt.Sprintf("%s,%s,%s", constant.PriorityStringCommon, constant.PriorityStringEmergent, constant.PriorityStringUrgent),
		Deadline: time.Now().Unix() + int64(1000),
		Members:  "bde3040c-f11c-43a8-81af-f70e0acbf526,02f34bfc-69b0-4959-80fd-f835c071c345",
		Creator:  "02f34bfc-69b0-4959-80fd-f835c071c345",
		Updater:  "bde3040c-f11c-43a8-81af-f70e0acbf526",
		Role:     "09095468-122a-4c6a-8bd3-0c2e438782de",
		Properties: []TestPropertyInfo{
			{
				Property: "task",
				Explain:  "center",
			},
		},
	}
	body, _ := json.Marshal(reqBody)
	c.Request = requestWithBody(http.MethodPost, "/", string(body))
	c.Request.Header.Add("Content-Type", binding.MIMEJSON)

	reqData := TestRequestItem{}
	valid, err := BindAndValid(c, &reqData)
	assert.True(t, valid)
	assert.Nil(t, err)
}

func TestPostJson_fail_1(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	reqBody := TestRequestItem{
		Name:        "task center",
		NickName:    "",
		TaskName:    "this is a task name",
		Description: "task center of AnyData Fabric!@#$%^",
		Status:      fmt.Sprintf("%s,%s,%s", constant.CommonStatusReady.String, constant.CommonStatusOngoing.String, "hehe"),
		//Priority:    fmt.Sprintf("%s,%s,%s", constant.PriorityStringCommon, constant.PriorityStringEmergent, "hehe"),
		Deadline: time.Now().Unix() - int64(1000),
		Members:  "bde3040c-f11c-43a8-81af-f70e0acbf526,02f34bfc-69b0-4959-80fd-f835c071c345,f835c071c345-f835c071c345",
		Creator:  "",
		Updater:  "bde3040c-f11c-43a8-81af-f70e0acbf527",
		Role:     "09095468-122a-4c6a-8bd3-0c2e438782df",
		Properties: []TestPropertyInfo{
			{
				Property: "task",
				Explain:  "center",
			}, {
				Property: "task",
				Explain:  "center",
			},
		},
	}
	body, _ := json.Marshal(reqBody)
	c.Request = requestWithBody(http.MethodPost, "/", string(body))
	c.Request.Header.Add("Content-Type", binding.MIMEJSON)

	reqData := TestRequestItem{}
	valid, err := BindJsonAndValid(c, &reqData)
	validErrors, ok := err.(ValidErrors)
	assert.True(t, ok)
	assert.Equal(t, len(validErrors), 9)
	assert.False(t, valid)
}

func TestPostJson_fail_2(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	reqBody := TestRequestItem{
		Name:     "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
		NickName: "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
		TaskName: "1234567890123456789012345678901234567890",
		Description: `1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                      1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890`,
		Status: fmt.Sprintf("%s,%s,%s", constant.CommonStatusReady.String, constant.CommonStatusOngoing.String, "hehe"),
		//	Priority: fmt.Sprintf("%s,%s,%s", constant.PriorityStringCommon, constant.PriorityStringEmergent, "hehe"),
		Deadline: time.Now().Unix() - int64(1000),
		Members:  "bde3040c-f11c-43a8-81af-f70e0acbf527",
		Creator:  "",
		Updater:  "bde3040c-f11c-43a8-81af-f70e0acbf5",
		Role:     "09095468-122a-4c6a-8bd3-0c2e43878f",
		Properties: []TestPropertyInfo{
			{
				Property: "task",
				Explain:  "center",
			}, {
				Property: "task",
				Explain:  "center",
			},
		},
	}
	body, _ := json.Marshal(reqBody)
	c.Request = requestWithBody(http.MethodPost, "/", string(body))
	c.Request.Header.Add("Content-Type", binding.MIMEJSON)

	reqData := TestRequestItem{}
	valid, err := BindJsonAndValid(c, &reqData)
	validErrors, ok := err.(ValidErrors)
	assert.True(t, ok)
	assert.Equal(t, len(validErrors), 10)
	assert.False(t, valid)
}

func TestPostJson_fail_3(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	type User struct {
		Name string `json:"name" binding:"required"`
		Age  int    `json:"age"  binding:"gt=1"`
	}
	reqBody := `{"name":"task center","age":"xxx"}`
	c.Request = requestWithBody(http.MethodPost, "/", reqBody)
	c.Request.Header.Add("Content-Type", binding.MIMEJSON)

	reqData := User{}
	valid, err := BindJsonAndValid(c, &reqData)
	_, ok := err.(ValidErrors)
	assert.True(t, ok)
	assert.False(t, valid)
}

func TestPostJson_fail_4(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	type User struct {
		Name string `json:"name" binding:"required"`
		Age  int    `json:"age"  binding:"gt=1"`
	}
	reqBody := `{"name":"task center";"age":"xxx"}`
	c.Request = requestWithBody(http.MethodPost, "/", reqBody)
	c.Request.Header.Add("Content-Type", binding.MIMEJSON)

	reqData := User{}
	valid, err := BindJsonAndValid(c, &reqData)
	_, ok := err.(*json.SyntaxError)
	assert.True(t, ok)
	assert.False(t, valid)
}

func TestQuery_ok(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	type User struct {
		Name string `json:"name" form:"name"  binding:"required"`
		Age  int    `json:"age"  form:"age"  binding:"gt=1"`
	}
	c.Request = requestWithBody(http.MethodGet, "/?name=task&age=10", "")
	c.Request.Header.Add("Content-Type", binding.MIMEPlain)

	u := User{}
	valid, err := BindQueryAndValid(c, &u)
	assert.True(t, valid)
	assert.Nil(t, err)
}

func TestQuery_fail(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	type User struct {
		Name string `json:"name" form:"name"  binding:"required"`
		Age  int    `json:"age"  form:"age"  binding:"gt=1"`
	}
	c.Request = requestWithBody(http.MethodGet, "/?name=task&age=xx", "")
	c.Request.Header.Add("Content-Type", binding.MIMEPlain)

	u := User{}
	valid, err := BindQueryAndValid(c, &u)
	assert.False(t, valid)
	assert.NotNil(t, err)
}

func TestBindUriAndValid(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	type User struct {
		Name string `json:"name" uri:"name"  binding:"required"`
		Age  int    `json:"age"  uri:"age"   binding:"gt=1"`
	}
	c.Request = requestWithBody(http.MethodGet, "/", "")
	c.Request.Header.Add("Content-Type", binding.MIMEPlain)
	c.Params = []gin.Param{{Key: "name", Value: "task"}, {Key: "age", Value: "2"}}

	reqData := User{}
	valid, err := BindUriAndValid(c, &reqData)
	assert.Nil(t, err)
	assert.True(t, valid)
}

func TestBindFormAndValid(t *testing.T) {
	SetupValidator()
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	type User struct {
		Name string `json:"name" form:"name"  binding:"required"`
		Age  int    `json:"age"  form:"age"   binding:"gt=1"`
	}
	c.Request = requestWithBody(http.MethodGet, "/", "")
	c.Request.Header.Add("Content-Type", binding.MIMEPlain)
	c.Params = []gin.Param{{Key: "name", Value: "task"}, {Key: "age", Value: "2"}}
	c.Request.PostForm = map[string][]string{
		"name": []string{"task"},
		"age":  []string{"2"},
	}

	reqData := User{}
	valid, err := BindFormAndValid(c, &reqData)
	assert.Nil(t, err)
	assert.True(t, valid)
}

func TestCheckKeyWord(t *testing.T) {
	name := "123"
	assert.True(t, CheckKeyWord(&name))
	name = "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"
	assert.False(t, CheckKeyWord(&name))
}

func TestCheckKeyWord32(t *testing.T) {
	name := "123"
	assert.True(t, CheckKeyWord32(&name))
	name = "1234567890123456789012345678901234567890"
	assert.False(t, CheckKeyWord32(&name))

}
