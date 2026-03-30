package data_exploration_handler

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DataExplorationHandler struct {
	ed exploration.Domain
}

func NewDataExplorationHandler(ed exploration.Domain) *DataExplorationHandler {
	return &DataExplorationHandler{ed: ed}
}

/*
// AsyncExplorationHandler 异步探查处理
func (d *DataExplorationHandler) AsyncExplorationHandler(msg []byte) error {
	var task exploration.DataASyncExploreMsg
	if err := json.Unmarshal(msg, &task); err != nil {
		log.Errorf("json.Unmarshal task msg (%s) failed: %v", string(msg), err)
		return err
	}
	return d.ed.DataAsyncExploreExec(context.Background(), &task)
}
*/

// ExplorationResultHandler 探查结果处理
func (d *DataExplorationHandler) ExplorationResultHandler(msg []byte) error {
	log.Infof("kafka msg handler :ExplorationResultHandler rec msg: %s", string(msg))
	var taskResult exploration.DataASyncExploreResultMsg
	if err := json.Unmarshal(msg, &taskResult); err != nil {
		var taskResultNil exploration.DataASyncExploreResultNilMsg
		if err := json.Unmarshal(msg, &taskResultNil); err != nil {
			log.Errorf("json.Unmarshal task msg (%s) failed: %v", string(msg), err)
			return nil
		}
		taskResult.Columns = taskResultNil.Columns
		taskResult.Data = make([][]any, 0)
		taskResult.Result = taskResultNil.Result
	}
	return d.ed.ExplorationResultUpdate(context.Background(), &taskResult)
}

// AsyncExplorationDataResultHandler 探查结果处理 【时间戳探查结果】
func (d *DataExplorationHandler) AsyncExplorationDataResultHandler(msg []byte) error {
	log.Infof("kafka msg handler :AsyncExplorationTimestampResultHandler rec msg: %s", string(msg))
	return d.ed.ExplorationResultHandler(context.Background(), msg)
}

func (d *DataExplorationHandler) DeleteExploreTaskHandler(msg []byte) error {
	log.Infof("kafka msg handler :DeleteExploreTaskHandler msg: %s", string(msg))
	var task exploration.DeleteTaskMsg
	if err := json.Unmarshal(msg, &task); err != nil {
		log.Errorf("json.Unmarshal task msg (%s) failed: %v", string(msg), err)
		return err
	}
	return d.ed.DeleteExploreTaskHandler(context.Background(), &task)
}

func (d *DataExplorationHandler) ThirdPartyExplorationDataResultHandler(msg []byte) error {
	log.Infof("kafka msg handler :ThirdPartyExplorationDataResultHandler rec msg: %s", string(msg))
	return d.ed.ThirdPartyExplorationResultHandler(context.Background(), msg)
}
