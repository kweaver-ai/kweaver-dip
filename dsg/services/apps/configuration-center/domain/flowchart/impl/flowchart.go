package impl

import (
	"context"
	"encoding/json"
	"fmt"

	repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_node_config"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_node_task"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_unit"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_version"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/tool"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type flowchartUseCase struct {
	repoFlowchart           repo.Repo
	repoFlowchartVersion    flowchart_version.Repo
	repoFlowchartUnit       flowchart_unit.Repo
	repoFlowchartNodeConfig flowchart_node_config.Repo
	repoFlowchartNodeTask   flowchart_node_task.Repo
	repoRole                role.Repo
	repoTool                tool.Repo
	repoUser                user2.IUserRepo
}

func NewFlowchartUseCase(repoFlowchart repo.Repo, repoFlowchartVersion flowchart_version.Repo,
	repoFlowchartUnit flowchart_unit.Repo, repoFlowchartNodeConfig flowchart_node_config.Repo,
	repoFlowchartNodeTask flowchart_node_task.Repo, repoRole role.Repo, repoTool tool.Repo,
	repoUser user2.IUserRepo) domain.UseCase {
	return &flowchartUseCase{repoFlowchart: repoFlowchart, repoFlowchartVersion: repoFlowchartVersion,
		repoFlowchartUnit: repoFlowchartUnit, repoFlowchartNodeConfig: repoFlowchartNodeConfig,
		repoFlowchartNodeTask: repoFlowchartNodeTask, repoRole: repoRole, repoTool: repoTool, repoUser: repoUser}
}

func (f *flowchartUseCase) FlowchartExistCheckDie(ctx context.Context, fid string, includeStatus ...constant.FlowchartEditStatus) (*model.Flowchart, error) {
	fc, err := f.repoFlowchart.Get(ctx, fid, includeStatus...)
	if err != nil {
		log.WithContext(ctx).Error("flowchart not found", zap.String("flowchart id", fid), zap.Error(err))
		return nil, err
	}

	return fc, nil
}

func (f *flowchartUseCase) FlowchartExistCheckUnscopedDie(ctx context.Context, fid string, includeStatus ...constant.FlowchartEditStatus) (*model.Flowchart, error) {
	fc, err := f.repoFlowchart.GetUnscoped(ctx, fid, includeStatus...)
	if err != nil {
		log.WithContext(ctx).Error("flowchart not found", zap.String("flowchart id", fid), zap.Error(err))
		return nil, err
	}

	return fc, nil
}

// FlowchartExistCheckUnscopedDieCheckConfigStatus FlowchartExistCheckDie的基础上增加了对config_status的校验
func (f *flowchartUseCase) FlowchartExistCheckUnscopedDieCheckConfigStatus(ctx context.Context, fid string, includeStatus ...constant.FlowchartEditStatus) (*model.Flowchart, error) {
	fc, err := f.repoFlowchart.GetUnscoped(ctx, fid, includeStatus...)
	if err != nil {
		log.WithContext(ctx).Error("flowchart not found", zap.String("flowchart id", fid), zap.Error(err))
		return nil, err
	}
	//if fc.ConfigStatus == constant.FlowchartConfigStatusInt32MissingRole {
	//	return nil, errorcode.FlowChartMissingRoleError
	//}

	return fc, nil
}

func (f *flowchartUseCase) FlowchartVersionExistCheckDie(ctx context.Context, vId string) (*model.FlowchartVersion, error) {
	fcV, err := f.repoFlowchartVersion.Get(ctx, vId)
	if err != nil {
		log.WithContext(ctx).Error("flowchart version not found", zap.String("flowchart version id", vId), zap.Error(err))
		return nil, err
	}

	return fcV, nil
}

func (f *flowchartUseCase) FlowchartVersionExistCheckUnscopedDie(ctx context.Context, vId string) (*model.FlowchartVersion, error) {
	fcV, err := f.repoFlowchartVersion.GetUnscoped(ctx, vId)
	if err != nil {
		log.WithContext(ctx).Error("flowchart version not found", zap.String("flowchart version id", vId), zap.Error(err))
		return nil, err
	}

	return fcV, nil
}

func (f *flowchartUseCase) FlowchartVersionExistAndMatchCheckDie(ctx context.Context, fId, vId string) (*model.FlowchartVersion, error) {
	// 运营流程版本存在检测
	fcV, err := f.FlowchartVersionExistCheckDie(ctx, vId)
	if err != nil {
		return nil, err
	}

	// 运营流程与运营流程版本匹配检测
	if fcV.FlowchartID != fId {
		err = fmt.Errorf("flowchart id and flowchart version id not match")
		log.WithContext(ctx).Errorf("flowchart id and flowchart version id not match, fid: %v, vid: %v", fId, vId)
		return nil, errorcode.Detail(errorcode.FlowchartVersionNotExist, err)
	}

	return fcV, nil
}

func (f *flowchartUseCase) FlowchartVersionExistAndMatchCheckUnscopedDie(ctx context.Context, fId, vId string) (*model.FlowchartVersion, error) {
	// 运营流程版本存在检测
	fcV, err := f.FlowchartVersionExistCheckUnscopedDie(ctx, vId)
	if err != nil {
		return nil, err
	}

	// 运营流程与运营流程版本匹配检测
	if fcV.FlowchartID != fId {
		err = fmt.Errorf("flowchart id and flowchart version id not match")
		log.WithContext(ctx).Errorf("flowchart id and flowchart version id not match, fid: %v, vid: %v", fId, vId)
		return nil, errorcode.Detail(errorcode.FlowchartVersionNotExist, err)
	}

	return fcV, nil
}

func (f *flowchartUseCase) HandleRoleMissing(ctx context.Context, rid string) error {
	//err := f.repoFlowchart.MarkFlowchartByRoleId(ctx, rid, constant.FlowchartConfigStatusInt32MissingRole)
	//if err != nil {
	//	return fmt.Errorf("HandleRoleMissing error %v", err)
	//}
	return nil
}

func (f *flowchartUseCase) Migration(ctx context.Context) error {
	//修改NodeTask
	flowchartNodeTask, err := f.repoFlowchartNodeTask.ListALLUnscoped(ctx)
	if err != nil {
		return err
	}
	for _, fT := range flowchartNodeTask {
		if done, newType := Reduce(fT.TaskType); done {
			fT.TaskType = newType
			if err = f.repoFlowchartNodeTask.UpdateTaskType(ctx, fT); err != nil {
				return err
			}
		}
	}

	//修改Version
	if err = f.MigrationVersion(ctx); err != nil {
		return err
	}

	return nil
}
func (f *flowchartUseCase) MigrationVersion(ctx context.Context) error {
	flowchartVersion, err := f.repoFlowchartVersion.GetAll(ctx)
	if err != nil {
		return err
	}
	for _, fV := range flowchartVersion {
		var change bool
		var units []*FrontUnitInfo
		if fV.DrawProperties == "" {
			continue
		}
		if err = json.Unmarshal([]byte(fV.DrawProperties), &units); err != nil {
			log.WithContext(ctx).Errorf("failed to parse flowchart content, unmarshal json err, content: %v, err: %v", fV.DrawProperties, err)
			return err
		}
		if len(units) < 1 {
			continue
		}
		for _, unit := range units {
			taskTypes := TaskTypeStrings{}
			if unit.Shape != constant.FlowchartShapeNode {
				continue
			}
			if unit.Data.TaskConfig.TaskTypeStr == "" {
				continue
			}
			if err = json.Unmarshal([]byte(unit.Data.TaskConfig.TaskTypeStr), &taskTypes); err != nil {
				log.WithContext(ctx).Errorf("failed to parse flowchart content, unmarshal json err, content: %v, err: %v", unit.Data.TaskConfig.TaskTypeStr, err)
				return err
			}
			toInt32 := taskTypes.ToInt32()
			if done, newType := Reduce(toInt32); done {
				change = true
				ret := constant.TaskTypes(newType).ToTaskTypeStrings()
				marshal, err := json.Marshal(ret)
				if err != nil {
					return err
				}
				s := string(marshal)
				unit.Data.TaskConfig.TaskTypeStr = s
			}
		}
		if change {
			marshal, err := json.Marshal(units)
			if err != nil {
				return err
			}
			fV.DrawProperties = string(marshal)
			if err = f.repoFlowchartVersion.UpdateDrawProperties(ctx, fV); err != nil {
				return err
			}
		}
	}
	return nil
}

var reduceType = []int32{2, 4, 8, 128} //TaskTypeModeling     //TaskTypeStandardization   //TaskTypeIndicator

func Reduce(o int32) (bool, int32) {
	reduce := false
	for _, r := range reduceType {
		if o&r == r {
			o = o ^ r
			o = o | constant.TaskTypeModeling.ToInt32()
			reduce = true
		}
	}
	return reduce, o
}

type TaskTypeString string

const (
	TaskTypeStringNormal          TaskTypeString = "normal"
	TaskTypeStringModeling        TaskTypeString = "modeling"
	TaskTypeStringStandardization TaskTypeString = "standardization"
	TaskTypeStringIndicator       TaskTypeString = "indicator"
	TaskTypeStringFieldStandard   TaskTypeString = "fieldStandard"
	TaskTypeStringDataCollecting  TaskTypeString = "dataCollecting"
	TaskTypeStringDataProcessing  TaskTypeString = "dataProcessing"
	TaskTypeStringNewMainBusiness TaskTypeString = "newMainBusiness"
)

func (t TaskTypeStrings) ToInt32() int32 {
	return t.ToTaskTypes().ToInt32()
}

type TaskTypeStrings []TaskTypeString

func (t TaskTypeStrings) ToTaskTypes() (ret TaskTypes) {
	for _, s := range t {
		ret = ret.Or(s.ToTaskType())
	}

	return
}

type TaskType int32

func (t TaskType) ToInt32() int32 {
	return int32(t)
}

const (
	TaskTypeNormal TaskType = 1 << iota
	TaskTypeModeling
	TaskTypeStandardization
	TaskTypeIndicator
	TaskTypeFieldStandard
	TaskTypeDataCollecting
	TaskTypeDataProcessing
	TaskTypeNewMainBusiness
)

func (t TaskTypeString) ToTaskType() TaskType {
	return taskTypeStringToTaskType[t]
}

type TaskTypes int32

func (t TaskTypes) Or(a TaskType) TaskTypes {
	return TaskTypes(t.ToInt32() | a.ToInt32())
}
func (t TaskTypes) ToInt32() int32 {
	return int32(t)
}

var (
	taskTypeStringToTaskType = map[TaskTypeString]TaskType{
		TaskTypeStringNormal:          TaskTypeNormal,
		TaskTypeStringModeling:        TaskTypeModeling,
		TaskTypeStringStandardization: TaskTypeStandardization,
		TaskTypeStringIndicator:       TaskTypeIndicator,
		TaskTypeStringFieldStandard:   TaskTypeFieldStandard,
		TaskTypeStringNewMainBusiness: TaskTypeNewMainBusiness,
		TaskTypeStringDataCollecting:  TaskTypeDataCollecting,
		TaskTypeStringDataProcessing:  TaskTypeDataProcessing,
	}

	taskTypeToTaskTypeString = map[TaskType]TaskTypeString{
		TaskTypeNormal:          TaskTypeStringNormal,
		TaskTypeModeling:        TaskTypeStringModeling,
		TaskTypeStandardization: TaskTypeStringStandardization,
		TaskTypeIndicator:       TaskTypeStringIndicator,
		TaskTypeFieldStandard:   TaskTypeStringFieldStandard,
		TaskTypeNewMainBusiness: TaskTypeStringNewMainBusiness,
		TaskTypeDataCollecting:  TaskTypeStringDataCollecting,
		TaskTypeDataProcessing:  TaskTypeStringDataProcessing,
	}
)
