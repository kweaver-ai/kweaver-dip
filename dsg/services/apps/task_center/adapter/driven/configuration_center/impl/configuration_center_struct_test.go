package impl

import (
	"context"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

func TestConfigurationCenter_AddUsersToRole(t *testing.T) {
	c := &ConfigurationCenterCall{
		baseURL: "127.0.0.1:8133",
		client:  trace.NewOtelHttpClient(),
	}
	ctx := context.WithValue(context.Background(), interception.Token, "11")
	err := c.AddUsersToRole(ctx, access_control.ProjectMgm, "e2d97bbe-8db6-417f-9a88-68c1bbe6bd6e")
	if err != nil {
		t.Error(err)
		return
	}

}

func TestConfigurationCenter_DeleteUsersToRole(t *testing.T) {
	c := &ConfigurationCenterCall{
		baseURL: "127.0.0.1:8133",
		client:  trace.NewOtelHttpClient(),
	}
	ctx := context.WithValue(context.Background(), interception.Token, "11")
	err := c.DeleteUsersToRole(ctx, access_control.ProjectMgm, "e2d97bbe-8db6-417f-9a88-68c1bbe6bd6e")
	if err != nil {
		t.Error(err)
		return
	}
}

func TestConfigurationCenter_GetProjectMgmRoleUsers(t *testing.T) {
	c := &ConfigurationCenterCall{
		baseURL: "127.0.0.1:8133",
		client:  trace.NewOtelHttpClient(),
	}
	ctx := context.WithValue(context.Background(), interception.Token, "11")
	user, err := c.GetRoleUsers(ctx, "", configuration_center.UserRolePageInfo{
		Offset:    1,
		Limit:     0,
		Direction: "",
		Sort:      "",
	})
	if err != nil {
		t.Error(err)
		return
	}
	t.Log(user)
}

func TestConfigurationCenter_UserIsInProjectMgm(t *testing.T) {
	c := &ConfigurationCenterCall{
		baseURL: "127.0.0.1:8133",
		client:  trace.NewOtelHttpClient(),
	}
	ctx := context.WithValue(context.Background(), interception.Token, "11")
	is, err := c.UserIsInRole(ctx, "0b7d43af-2e65-44f9-963f-e7f8b0c3cd7a", "")
	if err != nil {
		t.Error(err)
		return
	}
	t.Log(is)
}
