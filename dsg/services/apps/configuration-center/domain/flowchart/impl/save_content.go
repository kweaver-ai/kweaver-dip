package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"time"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/tool"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	defaultStageCount = 50
	defaultNodeCount  = 200
)

func (f *flowchartUseCase) SaveContent(ctx context.Context, req *domain.SaveContentReqParamBody, fId string) (*domain.SaveContentRespParam, error) {
	log.Infof("save type: %v", req.Type)

	// 运营流程与运营流程版本匹配检测
	fc, err := f.FlowchartExistCheckDie(ctx, fId)
	if err != nil {
		return nil, err
	}

	fcV := &model.FlowchartVersion{
		Image:          util.PtrToValue(req.Image),
		FlowchartID:    fc.ID,
		DrawProperties: *req.Content,
	}

	hasImage := req.Image != nil
	switch *req.Type {
	case constant.FlowchartSaveTypeTemp:
		err = f.saveTmpContent(ctx, fcV, hasImage)

	case constant.FlowchartSaveTypeFinal:
		err = f.saveFinalContent(ctx, fcV, hasImage)

	default:
		return nil, fmt.Errorf("unsupport save type, type: %v", req.Type)
	}
	if err != nil {
		log.WithContext(ctx).Errorf("failed to save flowchart content, err: %v", err)
		return nil, err
	}

	return &domain.SaveContentRespParam{
		ID:   fc.ID,
		Name: fc.Name,
	}, nil
}

func (f *flowchartUseCase) saveTmpContent(ctx context.Context, fcV *model.FlowchartVersion, hasImage bool) error {
	var err error
	suc := false

	tmpFcV := *fcV

	rand.Seed(time.Now().UnixNano())
	for i := 0; i < 2; i++ {
		if i > 0 {
			log.Warnf("tmp save flowchart content txn conflict, flowchart id: %v", fcV.ID)
			time.Sleep(time.Duration(rand.Intn(10)+1) * 100 * time.Millisecond) // rand sleep 0.1s~1s
		}

		tmp := tmpFcV
		fcV = &tmp
		suc, err = f.repoFlowchartVersion.UpdateDrawPropertiesAndImage(ctx, fcV, hasImage)
		if err != nil {
			break
		}

		if suc {
			break
		}
	}

	if err == nil && !suc {
		err = fmt.Errorf("possible transaction conflict")
		log.WithContext(ctx).Errorf("failed to tmp save flowchart, fid: %v, err: %v", fcV.FlowchartID, err)
		err = errorcode.Detail(errorcode.FlowchartAlreadyEdited, err)
	}

	return err
}

func (f *flowchartUseCase) saveFinalContent(ctx context.Context, fcV *model.FlowchartVersion, hasImage bool) error {
	var err error

	// 解析&验证content，获取阶段、节点、连接、节点配置、任务配置对象
	resolver := contentResolver{
		repoRole: f.repoRole,
		repoTool: f.repoTool,
		content:  []byte(fcV.DrawProperties),
	}
	unitModels, nodeCfgModels, taskCfg, err := resolver.Parse(ctx)
	if err != nil {
		return err
	}

	suc := false
	tmpFcV := *fcV

	rand.Seed(time.Now().UnixNano())
	for i := 0; i < 2; i++ {
		if i > 0 {
			log.Warnf("final save flowchart content txn conflict, flowchart id: %v", fcV.ID)
			time.Sleep(time.Duration(rand.Intn(10)+1) * 100 * time.Millisecond) // rand sleep 0.1s~1s
		}

		tmp := tmpFcV
		fcV = &tmp
		suc, err = f.repoFlowchartVersion.SaveContent(ctx, fcV, unitModels, nodeCfgModels, taskCfg, hasImage)
		if err != nil {
			break
		}

		if suc {
			break
		}
	}

	if err == nil && !suc {
		err = fmt.Errorf("possible transaction conflict")
		log.WithContext(ctx).Errorf("failed to save flowchart, fid: %v, err: %v", fcV.FlowchartID, err)
		err = errorcode.Detail(errorcode.FlowchartAlreadyEdited, err)
	}

	return err
}

type FrontSourceTargetInfo struct {
	Cell string `json:"cell" binding:"TrimSpace,required,uuid"`
}

type FrontUnitDataInfo struct {
	Shape      constant.FlowchartShape `json:"shape" binding:"TrimSpace,required,oneof=stage input_node edge"`
	Name       string                  `json:"name" binding:"TrimSpace,required_unless=Shape edge,min=1,max=32,VerifyName"`
	NodeConfig *struct {
		StartMode      constant.FlowchartNodeStartModeString      `json:"start_mode" binding:"TrimSpace,required,oneof=any_node_completion all_node_completion"`
		CompletionMode constant.FlowchartNodeCompletionModeString `json:"completion_mode" binding:"TrimSpace,omitempty,eq=auto"`
	} `json:"node_config" binding:"required_if=Shape input_node,omitempty"`
	TaskConfig *struct {
		//ExecRoleID  string `json:"exec_role_id" binding:"TrimSpace,required,uuid"`
		TaskTypeStr string `json:"task_type" binding:"TrimSpace,omitempty,json"`
	} `json:"task_config" binding:"omitempty"`

	WorkOrderConfig *struct {
		//ExecRoleID  string `json:"exec_role_id" binding:"TrimSpace,required,uuid"`
		WorkOrderTypeStr string `json:"work_order_type" binding:"TrimSpace,omitempty,json"`
	} `json:"work_order_config" binding:"omitempty"`
}

type position struct {
	X *float64 `json:"x" binding:"required"`
	Y *float64 `json:"y" binding:"required"`
}

type FrontUnitInfo struct {
	ID       string                  `json:"id" binding:"TrimSpace,required,uuid"`
	Shape    constant.FlowchartShape `json:"shape" binding:"TrimSpace,required,oneof=stage input_node edge"`
	Parent   string                  `json:"parent,omitempty" binding:"TrimSpace,omitempty,uuid"`
	Source   *FrontSourceTargetInfo  `json:"source,omitempty" binding:"required_if=Shape edge,omitempty"`
	Target   *FrontSourceTargetInfo  `json:"target,omitempty" binding:"required_if=Shape edge,omitempty"`
	Position *position               `json:"position,omitempty" binding:"required_if=Shape stage,omitempty"`
	Data     *FrontUnitDataInfo      `json:"data" binding:"required_unless=Shape edge"`
}

type contentResolver struct {
	repoRole role.Repo
	repoTool tool.Repo
	content  []byte
	stageMap map[string]*model.FlowchartUnit
	nodeMap  map[string]*model.FlowchartUnit
	linkMap  map[string]*model.FlowchartUnit

	nodeCfgs []*model.FlowchartNodeConfig
	taskCfgs []*model.FlowchartNodeTask

	stageNameSet         map[string]struct{}
	nodeNameSet          map[string]struct{}
	nodeParentMap        map[string]string
	linkNodesMap         map[string]*linkNodes
	stageUnitPositionMap map[string]*position
}

type linkNodes struct {
	sourceUnitID string
	targetUnitID string
}

func (c *contentResolver) init() {
	if c.stageMap == nil {
		c.stageMap = make(map[string]*model.FlowchartUnit)
	}
	if c.nodeMap == nil {
		c.nodeMap = make(map[string]*model.FlowchartUnit)
	}
	if c.linkMap == nil {
		c.linkMap = make(map[string]*model.FlowchartUnit)
	}

	if c.nodeCfgs == nil {
		c.nodeCfgs = make([]*model.FlowchartNodeConfig, 0)
	}
	if c.taskCfgs == nil {
		c.taskCfgs = make([]*model.FlowchartNodeTask, 0)
	}

	if c.stageNameSet == nil {
		c.stageNameSet = map[string]struct{}{}
	}
	if c.nodeNameSet == nil {
		c.nodeNameSet = map[string]struct{}{}
	}
	if c.nodeParentMap == nil {
		c.nodeParentMap = make(map[string]string)
	}
	if c.linkNodesMap == nil {
		c.linkNodesMap = make(map[string]*linkNodes)
	}
	if c.stageUnitPositionMap == nil {
		c.stageUnitPositionMap = make(map[string]*position)
	}
}

func (c *contentResolver) Parse(ctx context.Context) (unitModels []*model.FlowchartUnit, nodeCfgModels []*model.FlowchartNodeConfig, taskCfgModes []*model.FlowchartNodeTask, err error) {
	if len(c.content) < 1 {
		log.Warnf("content is empty")
		return
	}

	c.init()

	units, err := c.binding(ctx)
	if err != nil {
		return
	}

	var unitModel *model.FlowchartUnit
	for _, unit := range units {
		unitModel = nil
		switch unit.Shape {
		case constant.FlowchartShapeStage:
			unitModel, err = c.stageParse(ctx, unit)

		case constant.FlowchartShapeNode:
			unitModel, err = c.nodeParse(ctx, unit)

		case constant.FlowchartShapeLink:
			unitModel, err = c.linkParse(ctx, unit)

		default:
			log.Warnf("unknown flowchart unit shape, shape: %v", unit.Shape)
			continue
		}

		if err != nil {
			return
		}

		if unitModel != nil {
			unitModels = append(unitModels, unitModel)
		}
	}

	err = c.verify(ctx)
	if err != nil {
		return
	}

	nodeCfgModels = c.nodeCfgs
	taskCfgModes = c.taskCfgs
	return
}

func (c *contentResolver) binding(ctx context.Context) ([]*FrontUnitInfo, error) {
	var units []*FrontUnitInfo
	err := json.Unmarshal(c.content, &units)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse flowchart content, unmarshal json err, content: %v, err: %v", c.content, err)
		return nil, errorcode.Desc(errorcode.FlowchartContentInvalid)
	}

	if len(units) < 1 {
		log.WithContext(ctx).Errorf("flowchart content is empty, content: %v", c.content)
		return nil, errorcode.Desc(errorcode.FlowchartContentIsEmpty)
	}

	for _, unit := range units {
		if unit.Data != nil {
			unit.Data.Shape = unit.Shape
		}
	}

	err = binding.Validator.ValidateStruct(units)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to validate flowchart content, content: %v, err: %v", c.content, err)
		return nil, err // no wrap
	}

	return units, nil
}

func (c *contentResolver) stageParse(ctx context.Context, unit *FrontUnitInfo) (*model.FlowchartUnit, error) {
	m := &model.FlowchartUnit{
		ID:       util.NewUUID(),
		UnitType: int32(constant.FlowchartUnitTypeStage),
		UnitID:   unit.ID,
		Name:     unit.Data.Name,
	}

	// 检验阶段id唯一性
	if _, ok := c.stageMap[m.UnitID]; ok {
		log.WithContext(ctx).Errorf("failed to parse flowchart stage, stage unit id non-unique, unit id: %v", m.UnitID)
		return nil, errorcode.WithDetail(errorcode.FlowchartStageUnitIDRepeat, map[string]any{"name": m.Name})
	}

	// 检验阶段名称唯一性
	if _, ok := c.stageNameSet[m.Name]; ok {
		log.WithContext(ctx).Errorf("failed to parse flowchart stage, stage unit name non-unique, unit id: %v, unit name: %v", m.UnitID, m.Name)
		return nil, errorcode.WithDetail(errorcode.FlowchartStageNameRepeat, map[string]any{"name": m.Name})
	}

	c.stageMap[m.UnitID] = m
	if len(c.stageMap) > defaultStageCount {
		log.WithContext(ctx).Errorf("failed to parse flowchart stage, stage unit count too much, stage count: %v", len(c.stageMap))
		return nil, errorcode.WithDetail(errorcode.FlowchartStageCountTooMuch, map[string]any{"count": defaultStageCount})
	}

	c.stageUnitPositionMap[m.UnitID] = unit.Position

	c.stageNameSet[m.Name] = struct{}{}

	return m, nil
}

func (c *contentResolver) bindTaskTypes(ctx context.Context, taskTypeStr string) (constant.TaskTypeStrings, error) {
	taskTypes := constant.TaskTypeStrings{}
	err := json.Unmarshal([]byte(taskTypeStr), &taskTypes)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse flowchart content, unmarshal json err, content: %v, err: %v", c.content, err)
		return nil, errorcode.Desc(errorcode.FlowchartContentInvalid)
	}

	err = binding.Validator.Engine().(*validator.Validate).Var(taskTypes,
		"required,unique,min=1,dive,oneof=normal fieldStandard dataCollecting dataProcessing modeling syncDataView indicatorProcessing dataModeling mainBusiness businessDiagnosis standardization")
	if err != nil {
		log.WithContext(ctx).Errorf("failed to validate task types, task types: %v, err: %v", taskTypeStr, err)
		return nil, err // no wrap
	}

	return taskTypes, nil
}

func (c *contentResolver) bindWorkOrderTypes(ctx context.Context, workOrderTypeStr string) (constant.WorkOrderTypeStrings, error) {
	workOrderTypes := constant.WorkOrderTypeStrings{}

	err := json.Unmarshal([]byte(workOrderTypeStr), &workOrderTypes)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse flowchart content, unmarshal json err, content: %v, err: %v", c.content, err)
		return nil, errorcode.Desc(errorcode.FlowchartContentInvalid)
	}

	err = binding.Validator.Engine().(*validator.Validate).Var(workOrderTypes,
		"required,unique,min=1,dive,oneof=data_comprehension data_aggregation data_standardization data_fusion data_quality_audit")
	if err != nil {
		log.WithContext(ctx).Errorf("failed to validate task types, task types: %v, err: %v", workOrderTypeStr, err)
		return nil, err // no wrap
	}

	return workOrderTypes, nil

}

func (c *contentResolver) nodeParse(ctx context.Context, unit *FrontUnitInfo) (*model.FlowchartUnit, error) {
	m := &model.FlowchartUnit{
		ID:           util.NewUUID(),
		UnitType:     int32(constant.FlowchartUnitTypeNode),
		UnitID:       unit.ID,
		Name:         unit.Data.Name,
		ParentUnitID: unit.Parent,
	}

	// taskTypes, _ := c.bindTaskTypes(ctx, unit.Data.TaskConfig.TaskTypeStr)
	var taskTypes int32
	if unit.Data.TaskConfig != nil && unit.Data.TaskConfig.TaskTypeStr != "" {
		types, err := c.bindTaskTypes(ctx, unit.Data.TaskConfig.TaskTypeStr)
		if err != nil {
			return nil, err
		}
		taskTypes = types.ToInt32()
	}

	var workOrderTypes int32
	if unit.Data.WorkOrderConfig != nil && unit.Data.WorkOrderConfig.WorkOrderTypeStr != "" {
		types, err := c.bindWorkOrderTypes(ctx, unit.Data.WorkOrderConfig.WorkOrderTypeStr)
		if err != nil {
			return nil, err
		}
		workOrderTypes = types.ToInt32()
	}

	// 检验节点id唯一性
	if _, ok := c.nodeMap[m.UnitID]; ok {
		log.WithContext(ctx).Errorf("failed to parse flowchart node, node unit id non-unique, unit id: %v", m.UnitID)
		return nil, errorcode.WithDetail(errorcode.FlowchartNodeUnitIDRepeat, map[string]any{"name": m.Name})
	}

	// 检验节点名称唯一性
	if _, ok := c.nodeNameSet[m.Name]; ok {
		log.WithContext(ctx).Errorf("failed to parse flowchart node, node unit name non-unique, unit id: %v, unit name: %v", m.UnitID, m.Name)
		return nil, errorcode.WithDetail(errorcode.FlowchartNodeNameRepeat, map[string]any{"name": m.Name})
	}

	c.nodeNameSet[m.Name] = struct{}{}
	c.nodeMap[m.UnitID] = m
	if len(c.nodeMap) > defaultNodeCount {
		log.WithContext(ctx).Errorf("failed to parse flowchart node, node unit count too much, stage count: %v", len(c.nodeMap))
		return nil, errorcode.WithDetail(errorcode.FlowchartNodeCountTooMuch, map[string]any{"count": defaultNodeCount})
	}

	if len(m.ParentUnitID) > 0 {
		c.nodeParentMap[m.UnitID] = m.ParentUnitID
	}

	// 解析节点配置和任务配置
	nodeCfg := &model.FlowchartNodeConfig{
		ID:             util.NewUUID(),
		StartMode:      unit.Data.NodeConfig.StartMode.ToInt32(),
		CompletionMode: int32(constant.FlowchartNodeCompletionModeAuto), // 限制只能自动
		NodeID:         m.ID,
	}

	taskCfg := &model.FlowchartNodeTask{
		ID:             util.NewUUID(),
		Name:           m.Name,
		CompletionMode: int32(constant.FlowchartTaskCompletionModeManual),
		//ExecRoleID:     unit.Data.TaskConfig.ExecRoleID,
		NodeID:        m.ID,
		NodeUnitID:    m.UnitID,
		TaskType:      taskTypes,
		WorkOrderType: workOrderTypes,
	}
	// 检测角色是否存在
	//systemInfo, err := c.repoRole.Get(context.Background(), taskCfg.ExecRoleID)
	//if err != nil {
	//	return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	//}
	////被废除的角色不能保存
	//if systemInfo.DeletedAt != 0 {
	//	return nil, errorcode.Desc(errorcode.FlowchartNodeExecutorRoleNotExist)
	//}

	c.nodeCfgs = append(c.nodeCfgs, nodeCfg)
	c.taskCfgs = append(c.taskCfgs, taskCfg)

	return m, nil
}

func (c *contentResolver) linkParse(ctx context.Context, unit *FrontUnitInfo) (*model.FlowchartUnit, error) {
	m := &model.FlowchartUnit{
		ID:           util.NewUUID(),
		UnitType:     int32(constant.FlowchartUnitTypeConnector),
		UnitID:       unit.ID,
		SourceID:     "",
		SourceUnitID: unit.Source.Cell,
		TargetID:     "",
		TargetUnitID: unit.Target.Cell,
	}

	// 检验连接线id唯一性
	if _, ok := c.linkMap[m.UnitID]; ok {
		log.WithContext(ctx).Errorf("failed to parse flowchart link, link unit id non-unique, unit id: %v", m.UnitID)
		return nil, errorcode.WithDetail(errorcode.FlowchartConnectorUnitIDRepeat, map[string]any{"id": m.UnitID})
	}

	c.linkMap[m.UnitID] = m

	c.linkNodesMap[m.UnitID] = &linkNodes{
		sourceUnitID: m.SourceUnitID,
		targetUnitID: m.TargetUnitID,
	}

	return m, nil
}

type graphNode struct {
	unitId string
	prevs  []*graphNode
	nexts  []*graphNode
}

func (c *contentResolver) verify(ctx context.Context) error {
	var err error
	// 如果有阶段，则每个阶段必须都有阶段
	if len(c.stageMap) > 0 && len(c.nodeParentMap) != len(c.nodeMap) {
		log.WithContext(ctx).Errorf("failed to parse flowchart content, node has not stage")
		return errorcode.Desc(errorcode.FlowchartNodeNotStage)
	}

	// 阶段排序
	err = c.stageSore(ctx)
	if err != nil {
		return err
	}

	// 验证parent与source&target是否存在
	for nodeUnitId, stageUnitId := range c.nodeParentMap {
		stageM := c.stageMap[stageUnitId]
		if stageM == nil {
			log.WithContext(ctx).Errorf("failed to parse flowchart node, parent stage unit not found, node unit id: %v, parent unit id: %v", nodeUnitId, stageUnitId)
			return errorcode.WithDetail(errorcode.FlowchartNodeStageNotFound, map[string]any{"name": c.nodeMap[nodeUnitId].Name})
		}

		c.nodeMap[nodeUnitId].ParentID = stageM.ID
	}

	for linkUnitId, nodes := range c.linkNodesMap {
		sourceNode := c.nodeMap[nodes.sourceUnitID]
		targetNode := c.nodeMap[nodes.targetUnitID]
		if sourceNode == nil || targetNode == nil {
			log.WithContext(ctx).Errorf("failed to parse flowchart link, source/target node unit not found, link unit id: %v, source node unit id: %v, target node unit id: %v", linkUnitId, nodes.sourceUnitID, nodes.targetUnitID)
			return errorcode.Desc(errorcode.FlowchartNodeNotExist)
		}

		link := c.linkMap[linkUnitId]
		link.SourceID = sourceNode.ID
		link.TargetID = targetNode.ID
	}

	// 验证运营流程是否满足条件--无环、无游离、一个起点、一个终点
	nodeIdx := make(map[string]int, len(c.nodeMap))
	nodes := make([]*graphNode, len(c.nodeMap))
	idx := 0
	for _, nodeUnit := range c.nodeMap {
		nodes[idx] = &graphNode{unitId: nodeUnit.UnitID}
		nodeIdx[nodeUnit.ID] = idx
		idx += 1
	}

	for _, linkUnit := range c.linkMap {
		sourceNodeId := linkUnit.SourceID
		targetNodeId := linkUnit.TargetID

		sourceNode := nodes[nodeIdx[sourceNodeId]]
		targetNode := nodes[nodeIdx[targetNodeId]]

		sourceNode.nexts = append(sourceNode.nexts, targetNode)
		targetNode.prevs = append(targetNode.prevs, sourceNode)
	}

	startNodeIdx := -1
	endNodeIdx := -1
	for i, node := range nodes {
		if len(node.prevs) == 0 {
			if startNodeIdx > -1 {
				// 有多个开始节点
				log.WithContext(ctx).Errorf("failed to parse flowchart content, multiple start nodes exist, node unit ids: %v", []string{nodes[startNodeIdx].unitId, node.unitId})
				return errorcode.Desc(errorcode.FlowchartNodeMultiStart)
			}
			//第一个节点，如果没有业务建模任务，就抛出错误
			// for _, nodeTaskConfig := range c.taskCfgs {
			// 	if nodeTaskConfig.NodeUnitID == node.unitId && nodeTaskConfig.TaskType&int32(constant.TaskTypeModeling) == 0 {
			// 		return errorcode.Desc(errorcode.FlowchartNodeTaskTypeNotMatched)
			// 	}
			// }

			startNodeIdx = i
		}

		if len(node.nexts) == 0 {
			if endNodeIdx > -1 {
				// 有多个结束节点
				log.WithContext(ctx).Errorf("failed to parse flowchart content, multiple end nodes exist, node unit ids: %v", []string{nodes[endNodeIdx].unitId, node.unitId})
				err = errors.New("failed to parse flowchart content, multiple end nodes exist")
				return errorcode.Desc(errorcode.FlowchartNodeMultiEnd)
			}

			endNodeIdx = i
		}
	}

	if startNodeIdx < 0 || endNodeIdx < 0 {
		// 存在环
		log.WithContext(ctx).Errorf("failed to parse flowchart content, nodes has loop")
		return errorcode.Desc(errorcode.FlowchartNodeHasLoop)
	}

	traversedNodeSet := make(map[string]struct{}, len(nodes))
	err = loopFn(ctx, nodes[startNodeIdx], map[string]struct{}{}, nodes, endNodeIdx, traversedNodeSet)
	if err != nil {
		return err
	}

	for _, node := range nodes {
		if _, ok := traversedNodeSet[node.unitId]; ok {
			continue
		}

		// 这个节点没有遍历到，该节点为游离节点
		log.WithContext(ctx).Errorf("failed to parse flowchart content, nodes has loop, node unit id: %v", node.unitId)
		return errorcode.Desc(errorcode.FlowchartNodeExistFree)
	}

	return nil
}

func (c *contentResolver) stageSore(ctx context.Context) error {
	if len(c.stageMap) < 1 {
		return nil
	}

	stages := make([]*model.FlowchartUnit, 0, len(c.stageMap))
	for _, stage := range c.stageMap {
		stages = append(stages, stage)
	}

	conflict := false
	sort.SliceStable(stages, func(i, j int) bool {
		x1 := c.stageUnitPositionMap[stages[i].UnitID].X
		x2 := c.stageUnitPositionMap[stages[j].UnitID].X
		if x1 == x2 && !conflict {
			conflict = true
		}

		return *x1 < *x2
	})
	if conflict {
		log.WithContext(ctx).Errorf("failed to parse flowchart content, stage position overlap")
		return errorcode.Desc(errorcode.FlowchartStagePositionOverlap)
	}

	for i, stageUnitInfo := range stages {
		c.stageMap[stageUnitInfo.UnitID].UnitOrder = int32(i) + 1
	}

	return nil
}

func loopFn(ctx context.Context, curNode *graphNode, beforeNodeUnitIds map[string]struct{}, nodes []*graphNode, endNodeIdx int, traversedNodeSet map[string]struct{}) error {
	if _, ok := beforeNodeUnitIds[curNode.unitId]; ok {
		// 这个节点之前已经遍历过，存在环
		log.WithContext(ctx).Errorf("failed to parse flowchart content, nodes has loop, node unit id: %v", curNode.unitId)
		return errorcode.Desc(errorcode.FlowchartNodeHasLoop)
	}

	beforeNodeUnitIds[curNode.unitId] = struct{}{}
	if _, ok := traversedNodeSet[curNode.unitId]; !ok {
		traversedNodeSet[curNode.unitId] = struct{}{}
	}

	if len(curNode.nexts) < 1 {
		if curNode.unitId != nodes[endNodeIdx].unitId {
			// 有多个结束节点
			log.WithContext(ctx).Errorf("failed to parse flowchart content, multiple end nodes exist, node unit ids: %v", []string{nodes[endNodeIdx].unitId, curNode.unitId})
			return errorcode.Desc(errorcode.FlowchartNodeMultiEnd)
		}

		return nil
	}

	for _, nextNode := range curNode.nexts {
		err := loopFn(ctx, nextNode, util.CopyMap(beforeNodeUnitIds), nodes, endNodeIdx, traversedNodeSet)
		if err != nil {
			return err
		}
	}

	return nil
}
