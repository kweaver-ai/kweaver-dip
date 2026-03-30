package impl

import (
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
)

type ExplorationSuccess struct {
	Id string `json:"id"`
}
type ExplorationFail struct {
	Id    string `json:"id"`
	Error error  `json:"error"`
}

func TaskConfigToReport(task *model.TaskConfig) *model.Report {
	now := time.Now()
	return &model.Report{
		Code:           util.ValueToPtr(uuid.NewString()),
		TaskID:         task.TaskID,
		TaskVersion:    task.Version,
		QueryParams:    task.QueryParams,
		ExploreType:    task.ExploreType,
		Table:          task.Table,
		TableID:        task.TableID,
		Schema:         task.Schema,
		VeCatalog:      task.VeCatalog,
		TotalSample:    task.TotalSample,
		Status:         util.ValueToPtr(constant.Explore_Status_Excuting),
		Latest:         constant.NO,
		CreatedAt:      &now,
		DvTaskID:       task.DvTaskID,
		CreatedByUID:   task.CreatedByUID,
		CreatedByUname: task.CreatedByUname,
	}
}
