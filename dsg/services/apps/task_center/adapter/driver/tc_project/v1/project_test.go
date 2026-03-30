package v1

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang/mock/gomock"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	projectImpl "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project/impl"
	"github.com/stretchr/testify/assert"
)

func TestNewProjectService(t *testing.T) {
	//init parameter validator
	form_validator.SetupValidator()

	ctl := gomock.NewController(t)
	uc := projectImpl.NewMockUserCase(ctl)
	uc.EXPECT().Create(context.TODO(), gomock.Any(), gomock.Any()).AnyTimes().Return(nil)

	//projectService := NewProjectService(uc)

	newProjectInfo := tc_project.ProjectReqModel{
		Name:        "project_name",
		Description: "new project description",
		Image:       "bde3040c-f11c-43a8-81af-f70e0acbf526",
		FlowID:      "439cc88d-e0d1-45e8-a871-6a936e26ffa2",
		FlowVersion: "567f63c5-e7b5-4ac5-8aa6-e5e4ac3d6299",
		Priority:    "common",
		OwnerID:     "a5e341a4-2bef-4034-866d-ba83e60e66b1",
		Deadline:    time.Now().Unix() + int64(1024),
		Members: []tc_project.ProjectMember{{
			UserId: "a5e341a4-2bef-4034-866d-ba83e60e66b1",
			Roles:  []string{"80723e9b-b7ee-487b-bc66-7244f995f41f"},
		}},
	}
	bts, _ := json.Marshal(newProjectInfo)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest(http.MethodGet, "/", bytes.NewBufferString(string(bts)))
	c.Request.Header.Set("Content-Type", gin.MIMEJSON)
	c.Request.Header.Set("userToken", "a5e341a4-2bef-4034-866d-ba83e60e66b1")

	//projectService.NewProject(c)
	assert.True(t, w.Code == http.StatusOK)
}

func TestProjectService_CardPageQueryProject(t *testing.T) {

}

func TestProjectService_CheckRepeat(t *testing.T) {

}

func TestProjectService_EditProject(t *testing.T) {

}

func TestProjectService_GetFlowchart(t *testing.T) {

}

func TestProjectService_GetProject(t *testing.T) {

}

func TestProjectService_NewProject(t *testing.T) {

}

func TestProjectService_ProjectCandidate(t *testing.T) {

}
