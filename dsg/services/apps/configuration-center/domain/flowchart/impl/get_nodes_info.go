package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (f *flowchartUseCase) GetNodesInfo(ctx context.Context, req *domain.GetNodesInfoReqParamQuery, fId string) (*domain.GetNodesInfoRespParam, error) {
	fc, err := f.FlowchartExistCheckUnscopedDie(ctx, fId)
	if err != nil {
		return nil, err
	}

	fcV, err := f.FlowchartVersionExistAndMatchCheckUnscopedDie(ctx, fc.ID, *req.VersionID)
	if err != nil {
		return nil, err
	}

	if fcV.EditStatus != constant.FlowchartEditStatusNormal.ToInt32() {
		log.WithContext(ctx).Errorf("failed to get flowchart nodes info, flowchart version status not is normal, flowchart id: %v, vid: %v", fId, *req.VersionID)
		return nil, errorcode.Desc(errorcode.FlowchartVersionNotReleased)
	}

	nodesInfo, err := f.getNodesInfo(ctx, fc.ID, fcV.ID)
	if err != nil {
		return nil, err
	}

	return &domain.GetNodesInfoRespParam{
		ID:        fc.ID,
		VersionID: fcV.ID,
		Name:      fc.Name,
		Nodes:     nodesInfo,
		Content:   fcV.DrawProperties,
	}, nil
}

func (f *flowchartUseCase) getNodesInfo(ctx context.Context, fId, vId string) ([]*domain.NodeUnitInfo, error) {
	units, err := f.repoFlowchartUnit.ListUnscoped(ctx, vId)
	if err != nil {
		return nil, err
	}

	stageModels := make(map[string]*model.FlowchartUnit)
	nodeModels := make(map[string]*model.FlowchartUnit)
	nodePrevIdsMap := make(map[string][]string)
	nodePrevUnitIdsMap := make(map[string][]string)
	for _, unit := range units {
		switch constant.FlowchartUnitType(unit.UnitType) {
		case constant.FlowchartUnitTypeStage:
			stageModels[unit.ID] = unit

		case constant.FlowchartUnitTypeNode:
			nodeModels[unit.ID] = unit

		case constant.FlowchartUnitTypeConnector:
			if _, ok := nodePrevIdsMap[unit.TargetID]; !ok {
				nodePrevIdsMap[unit.TargetID] = make([]string, 0, 1)
			}

			if _, ok := nodePrevUnitIdsMap[unit.TargetUnitID]; !ok {
				nodePrevUnitIdsMap[unit.TargetUnitID] = make([]string, 0, 1)
			}

			nodePrevIdsMap[unit.TargetID] = append(nodePrevIdsMap[unit.TargetID], unit.SourceID)
			nodePrevUnitIdsMap[unit.TargetUnitID] = append(nodePrevUnitIdsMap[unit.TargetUnitID], unit.SourceUnitID)
		}
	}

	nodeCfgs, err := f.repoFlowchartNodeConfig.ListUnscoped(ctx, vId)
	if err != nil {
		return nil, err
	}
	nodeCfgModels := make(map[string]*model.FlowchartNodeConfig, len(nodeCfgs))
	for _, cfg := range nodeCfgs {
		nodeCfgModels[cfg.NodeID] = cfg
	}

	nodeTasks, err := f.repoFlowchartNodeTask.ListUnscoped(ctx, vId)
	if err != nil {
		return nil, err
	}
	nodeTaskModels := make(map[string]*model.FlowchartNodeTask, len(nodeTasks))
	for _, task := range nodeTasks {
		nodeTaskModels[task.NodeID] = task
	}

	nodesInfo := make([]*domain.NodeUnitInfo, 0, len(nodeModels))
	var stageM *model.FlowchartUnit
	var nodeCfgM *model.FlowchartNodeConfig
	var nodeTaskM *model.FlowchartNodeTask
	//var ro *model.SystemRole
	for _, nodeM := range nodeModels {
		if len(nodeM.ParentID) > 0 {
			stageM = stageModels[nodeM.ParentID]
		} else {
			stageM = nil
		}

		nodeCfgM = nodeCfgModels[nodeM.ID]

		nodeTaskM = nodeTaskModels[nodeM.ID]

		//ro, err = f.repoRole.Get(ctx, nodeTaskM.ExecRoleID)
		//if err != nil {
		//	return nil, err
		//}

		unitInfo := &domain.NodeUnitInfo{
			ID:              nodeM.ID,
			UnitID:          nodeM.UnitID,
			Name:            nodeM.Name,
			StartMode:       constant.FlowchartNodeStartMode(nodeCfgM.StartMode).ToFlowchartNodeStartModeString(),
			CompletionMode:  constant.FlowchartNodeCompletionMode(nodeCfgM.CompletionMode).ToFlowchartNodeCompletionModeString(),
			PrevNodeIDs:     nodePrevIdsMap[nodeM.ID],
			PrevNodeUnitIDs: nodePrevUnitIdsMap[nodeM.UnitID],
			Stage:           nil,
			NodeTaskConfig: &domain.NodeTaskConfig{
				//ExecRole: domain.RoleToolIDNameSet{
				//	ID:   ro.ID,
				//	Name: ro.Name,
				//},
				CompletionMode: constant.FlowchartTaskCompletionMode(nodeTaskM.CompletionMode).ToFlowchartTaskCompletionModeString(),
				TaskTypes:      constant.TaskTypes(nodeTaskM.TaskType).ToTaskTypeStrings(),
			},
			NodeWorkOrderConfig: &domain.NodeWorkOrderConfig{
				CompletionMode: constant.FlowchartTaskCompletionMode(nodeTaskM.CompletionMode).ToFlowchartTaskCompletionModeString(),
				WorkOrderTypes: constant.WorkOrderTypes(nodeTaskM.WorkOrderType).ToWorkOrderTypeStrings(),
			},
		}
		if stageM != nil {
			unitInfo.Stage = &domain.StageUnitInfo{
				ID:     stageM.ID,
				UnitID: stageM.UnitID,
				Name:   stageM.Name,
				Order:  stageM.UnitOrder,
			}
		}
		nodesInfo = append(nodesInfo, unitInfo)
	}

	return nodesInfo, nil
}
