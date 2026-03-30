package explore_task

import (
	"context"
	"encoding/json"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ExploreTaskHandler struct {
	et explore_task.ExploreTaskUseCase
}

func NewExploreTaskHandler(et explore_task.ExploreTaskUseCase) *ExploreTaskHandler {
	return &ExploreTaskHandler{et: et}
}

type MsgAsyncExplore struct {
	TaskId   string `json:"task_id"`   // 任务id
	UserId   string `json:"user_id"`   // 用户id
	UserName string `json:"user_name"` // 用户名
}

// AsyncDataExplore 探查配置处理
func (e *ExploreTaskHandler) AsyncDataExplore(msg []byte) error {
	log.Infof("AsyncDataExplore msg :%s", string(msg))
	var data MsgAsyncExplore
	if err := json.Unmarshal(msg, &data); err != nil {
		log.Errorf("json.Unmarshal data explore msg (%s) failed: %v", string(msg), err)
		return err
	}
	return e.et.ExecExplore(context.Background(), data.TaskId, data.UserId, data.UserName)
}
