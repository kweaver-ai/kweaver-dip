package impl

import (
	"context"
	"sort"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	Idata_grade "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/data_grade"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/data_subject"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/standardization"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/trace_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	data_grade "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/data_grade"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

const (
	MaxLayers = 3
)

const spanNamePre = "repo TreeNodeRepo "
const TreeID = "1"

type DataGrade struct {
	dataGrade         Idata_grade.IDataGradeRepo
	configurationRepo configuration.Repo
	standardization   standardization.Standardization
	dataSubject       data_subject.DataSubject
}

func NewDataGrade(dataGrade Idata_grade.IDataGradeRepo, configurationRepo configuration.Repo, standardizationRepo standardization.Standardization, dataSubjectRepo data_subject.DataSubject) data_grade.DataGradeCase {
	return &DataGrade{
		dataGrade:         dataGrade,
		configurationRepo: configurationRepo,
		standardization:   standardizationRepo,
		dataSubject:       dataSubjectRepo,
	}
}
func (u *DataGrade) Add(ctx context.Context, req data_grade.AddReqParam) (*data_grade.AddRespParam, error) {
	userId := ctx.Value(interception.InfoName).(*model.User).ID
	//userId := "111111"

	if req.ID == "" {
		count, errCount := u.dataGrade.GetCountByNodeType(ctx, "1")
		if errCount != nil {
			return nil, errCount
		}
		if count > 12 {
			return nil, errorcode.Desc(errorcode.LabelCount)
		}
	}

	err := u.existByName(ctx, req.Name, req.ID, req.NodeType)
	if err != nil {
		return nil, err
	}

	if req.Icon != "" && req.NodeType == 1 {
		errIcon := u.existByIcon(ctx, req.Icon, req.ID)
		if errIcon != nil {
			return nil, errIcon
		}
	}

	errParent := u.isGroup(ctx, req.ParentID)
	if errParent != nil {
		return nil, errParent
	}
	m := req.ToModel(userId)
	if err := u.dataGrade.InsertWithMaxLayer(ctx, m, MaxLayers); err != nil {
		return nil, err
	}
	return &data_grade.AddRespParam{
		IDResp: response.IDResp{
			ID: m.ID,
		},
	}, nil
}

// Reorder 将指定的节点移动到指定的父节点下的指定子节点前
// 删除指定的节点，将其插入到指定父节点下的指定子节点前
func (u *DataGrade) Reorder(ctx context.Context, req data_grade.ReorderReqParam) (*data_grade.ReorderRespParam, error) {
	//if err := u.treeExistCheckDie(ctx, req.TreeID, req.ID); err != nil {
	//	return nil, err
	//}

	_, err := u.dataGrade.GetNameById(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if err = u.parentNodeExistCheckDie(ctx, &req.DestParentID, TreeID); err != nil {
		return nil, err
	}

	if req.ID == req.DestParentID {
		// 将自身移动自身下，不支持的操作
		log.WithContext(ctx).Errorf("move to self, unsupported, id: %v, dest parent id: %v", req.ID, req.NextID)
		return nil, errorcode.Desc(errorcode.TreeNodeMoveToSubErr)
	}

	if req.NextID.Uint64() > 0 {
		if err = u.nodeExistCheckWithParentIDDie(ctx, req.NextID, req.DestParentID, TreeID); err != nil {
			return nil, err
		}

		if req.NextID == req.ID {
			// 将自身移动到自身之上，不需要操作
			return data_grade.NewReorderRespParam(req.ID), nil
		}
	}

	//if err = u.existByNameDie(ctx, name, req.DestParentID, TreeID, req.ID); err != nil {
	//	return nil, err
	//}

	if err = trace_util.TraceA5R1(ctx, spanNamePre+"Reorder", req.ID, req.DestParentID, req.NextID, TreeID, MaxLayers, u.dataGrade.Reorder); err != nil {
		return nil, err
	}
	//if err = u.repo.Reorder(ctx, req.ID, req.DestParentID, req.NextID, req.TreeID, MaxLayers); err != nil {
	//	return nil, err
	//}

	return data_grade.NewReorderRespParam(req.ID), nil
}

func (u *DataGrade) existByName(ctx context.Context, name string, id models.ModelID, nodeType int) error {
	exit, err := u.dataGrade.ExistByName(ctx, name, id, nodeType)
	if err != nil {
		return err
	}

	if exit {
		log.WithContext(ctx).Errorf("tree node name repeat")
		return errorcode.Desc(errorcode.TreeNodeNameRepeat)
	}

	return nil
}

func (u *DataGrade) existByIcon(ctx context.Context, icon string, id models.ModelID) error {
	exit, err := u.dataGrade.ExistByIcon(ctx, icon, id)
	if err != nil {
		return err
	}

	if exit {
		log.WithContext(ctx).Errorf("icon repeat")
		return errorcode.Desc(errorcode.IconNameRepeat)
	}

	return nil
}

func (u *DataGrade) isGroup(ctx context.Context, id models.ModelID) error {
	exit, err := u.dataGrade.IsGroup(ctx, id)
	if err != nil {
		return err
	}

	if !exit {
		log.WithContext(ctx).Errorf("parent_id must group")
		return errorcode.Desc(errorcode.ParentMustGroup)
	}

	return nil
}

func (u *DataGrade) treeExistCheckDie(ctx context.Context, treeId models.ModelID, checkedRootNodeId ...models.ModelID) error {
	rootNodeId, err := u.dataGrade.GetRootNodeId(ctx, treeId)
	if err != nil {
		return err
	}

	if len(checkedRootNodeId) > 0 && rootNodeId == checkedRootNodeId[0] {
		// root节点不允许被操作
		log.WithContext(ctx).Errorf("root node not allowed operator, tree id: %v", treeId)
		return errorcode.Desc(errorcode.TreeNodeRootNotAllowedOperate)
	}

	return nil
}

func (u *DataGrade) parentNodeExistCheckDie(ctx context.Context, nodeId *models.ModelID, treeId models.ModelID) error {
	rootNodeId, err := u.dataGrade.GetRootNodeId(ctx, treeId)
	if err != nil {
		return err
	}

	// 若没有父节点，则默认为根节点
	if len(*nodeId) < 1 || nodeId.Uint64() < 1 {
		*nodeId = rootNodeId
	}

	return u._nodeExistCheckDie(ctx, *nodeId, treeId)
}

func (u *DataGrade) _nodeExistCheckDie(ctx context.Context, nodeId, treeId models.ModelID) error {
	exist, err := u.dataGrade.ExistByIdAndTreeId(ctx, nodeId, treeId)
	if err != nil {
		return err
	}

	if !exist {
		log.WithContext(ctx).Errorf("tree node id not found, node id: %v, tree id: %v", nodeId, treeId)
		return errorcode.Desc(errorcode.TreeNodeNotExist)
	}

	return nil
}

func (u *DataGrade) nodeExistCheckWithParentIDDie(ctx context.Context, nodeId, parentId, treeId models.ModelID) error {
	if err := u.treeExistCheckDie(ctx, treeId, nodeId); err != nil {
		return err
	}

	exist, err := u.dataGrade.ExistByIdAndParentIdTreeId(ctx, nodeId, parentId, treeId)
	if err != nil {
		return err
	}

	if !exist {
		log.WithContext(ctx).Errorf("tree node id not found, node id: %v, tree id: %v", nodeId, treeId)
		return errorcode.Desc(errorcode.NextIdMustDestParentIdChild)
	}

	return nil
}

func (u *DataGrade) List(ctx context.Context, req data_grade.ListReqParam) (*data_grade.ListRespParam, error) {

	//var result []*data_grade.TreeNodeExt
	//if len(req.Keyword) > 0 {
	//	nodes, err := u.dataGrade.ListByKeyword(ctx, req.Keyword)
	//	if err != nil {
	//		return nil, err
	//	}
	//	newNodes := convertToNewItem(nodes)
	//	result = newNodes
	//
	//} else {
	//	nodes, err := u.dataGrade.GetList(ctx, req.Keyword)
	//	if err != nil {
	//		return nil, err
	//	}
	//	newNodes := convertToNewItem(nodes)
	//	result = buildTree(newNodes, "1")
	//}

	//nodes, err := u.dataGrade.GetList(ctx, req.Keyword)
	//if err != nil {
	//	return nil, err
	//}
	//if len(req.Keyword) > 0 {
	//
	//} else {
	//	newNodes := convertToNewItem(nodes)
	//	result = buildTree(newNodes, "1")
	//}
	//return &data_grade.ListRespParam{
	//	Entries: result,
	//}, nil

	//nodes, err := u.dataGrade.ListByKeyword(ctx, req.Keyword)
	//if err != nil {
	//	return nil, err
	//}
	//newNodes := convertToNewItem(nodes)
	//resp := &data_grade.ListRespParam{
	//	PageResultArray: response.PageResultArray[data_grade.SubNode]{
	//		Entries: lo.Map(newNodes, func(item *data_grade.TreeNodeExt, _ int) *data_grade.SubNode {
	//			return &data_grade.SubNode{IDResp: response.IDResp{ID: item.ID}, Name: item.Name, Expansion: true}
	//		}),
	//		TotalCount: int64(len(nodes)),
	//	},
	//}
	//
	//return resp, nil
	return nil, nil
}

//func convertToNewItem(oldItems []*model.DataGrade) []*data_grade.TreeNodeExt {
//	var newItems []*data_grade.TreeNodeExt
//
//	for _, oldItem := range oldItems {
//		newItem := &data_grade.TreeNodeExt{
//			ID:          oldItem.ID,
//			ParentID:    oldItem.ParentID,
//			Icon:        oldItem.Icon,
//			Name:        oldItem.Name,
//			Description: oldItem.Description,
//			NodeType:    oldItem.NodeType,
//			SortWeight:  oldItem.SortWeight,
//		}
//		newItems = append(newItems, newItem)
//	}
//
//	return newItems
//}

func buildTree(nodes []*data_grade.TreeNodeExt, parentID models.ModelID) []*data_grade.TreeNodeExt {
	var result []*data_grade.TreeNodeExt
	for _, n := range nodes {
		if n.ParentID == parentID {
			child := buildTree(nodes, n.ID)
			n.Children = child
			result = append(result, n)
		}
	}
	return result
}

func (u *DataGrade) StatusOpen(ctx context.Context) (bool, error) {
	err := u.configurationRepo.Update(ctx, &model.Configuration{
		Key:   constant.DataGradeLabel,
		Value: "open",
	})
	if err != nil {
		log.WithContext(ctx).Error("SetDataGradeLabel Update ", zap.Error(err))
		return false, nil
	}
	return true, nil
}

func (u *DataGrade) StatusCheckOpen(ctx context.Context) (string, error) {
	config, err := u.configurationRepo.GetByNameAndType(ctx, constant.DataGradeLabel, 7)

	if err != nil {
		log.WithContext(ctx).Error("StatusCheckOpen check ", zap.Error(err))
		return "close", nil
	}

	return config.Value, nil
}

func (u *DataGrade) Delete(ctx context.Context, req *data_grade.DeleteReqParam) (*data_grade.DeleteRespParam, error) {
	//if err := u.treeExistCheckDie(ctx, TreeID, req.ID); err != nil {
	//	return nil, err
	//}

	idParam := data_grade.GetInfoByIDReqParam{
		ID: req.ID,
	}
	res, err := u.GetInfoByID(ctx, &idParam)
	if err != nil {
		return nil, err
	}
	if res == nil {
		return nil, errorcode.Desc(errorcode.LabelNotExist)
	}

	ids, exist, err := u.dataGrade.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	strSlice := make([]string, len(ids))
	for i, num := range ids {
		strSlice[i] = strconv.FormatUint(num, 10)
	}
	resultIds := strings.Join(strSlice, ",")
	_, err1 := u.standardization.DeleteLabelIds(ctx, resultIds)
	if err1 != nil {
		return nil, err1
	}

	_, err3 := u.dataSubject.DeleteLabelIds(ctx, resultIds)
	if err3 != nil {
		return nil, err3
	}

	resp := &data_grade.DeleteRespParam{}
	if exist {
		resp.ID = req.ID
	}
	return resp, nil
}

func (u *DataGrade) ListByParentID(ctx context.Context, parentID string) (*data_grade.ListRespParam, error) {
	nodes, err := u.dataGrade.GetListByParentId(ctx, parentID)
	if err != nil {
		return nil, err
	}
	if len(nodes) <= 0 {
		return nil, errorcode.Desc(errorcode.ParentIdNotExist)
	}
	return &data_grade.ListRespParam{
		Entries: nodes,
	}, nil
}

func filterDataByLabel(nodes []*data_grade.TreeNodeExt) []*data_grade.TreeNodeExt {
	var result []*data_grade.TreeNodeExt

	for _, node := range nodes {
		if node.NodeType == 2 {
			result = append(result, node)
		}
	}

	return result
}

const rootNodeParentID models.ModelID = "0"

func (u *DataGrade) ListTree(ctx context.Context, req *data_grade.ListTreeReqParam) (*data_grade.ListTreeRespParam, error) {
	if err := u.treeExistCheckDie(ctx, TreeID); err != nil {
		return nil, err
	}

	if len(req.Keyword) > 0 && !util.CheckKeyword(&req.Keyword) {
		log.WithContext(ctx).Errorf("keyword is invalid, keyword: %s", req.Keyword)
		return data_grade.NewListTreeRespParam(nil, "", false), nil
	}

	var nodeMs []*data_grade.TreeNodeExt
	var err error
	var defaultExpansion bool
	if len(req.Keyword) < 1 {
		defaultExpansion = false
		nodeMs, err = u.dataGrade.ListTree(ctx, TreeID)
	} else {
		defaultExpansion = true
		nodeMs, err = u.dataGrade.ListTreeAndKeyword(ctx, TreeID, req.Keyword)
	}

	if err != nil {
		return nil, err
	}

	if !req.IsShowLabel {
		nodeMs = filterDataByLabel(nodeMs)
	}

	nodes := parentIdToTreeNodeRecursiveSlice(rootNodeParentID, nodeMs)
	return data_grade.NewListTreeRespParam(nodes, req.Keyword, defaultExpansion), nil
}

func parentIdToTreeNodeRecursiveSlice(parentId models.ModelID, nodes []*data_grade.TreeNodeExt) []*data_grade.TreeNodeExt {
	if len(nodes) < 1 {
		return nil
	}

	// sort
	sort.Slice(nodes, func(i, j int) bool {
		return nodes[i].SortWeight < nodes[j].SortWeight
	})

	parentSubMap := lo.GroupBy(nodes, func(item *data_grade.TreeNodeExt) models.ModelID {
		return item.ParentID
	})

	parentNodeR := &data_grade.TreeNodeExt{DataGrade: &model.DataGrade{ID: parentId}, Expansion: true}
	tmpQueue := make([]*data_grade.TreeNodeExt, 0, 5)
	tmpQueue = append(tmpQueue, parentNodeR)
	var curNodeRec *data_grade.TreeNodeExt
	for len(tmpQueue) > 0 {
		curNodeRec = tmpQueue[0]
		curNodeRec.Children = parentSubMap[curNodeRec.ID]
		if len(curNodeRec.Children) > 0 {
			curNodeRec.Expansion = true
			tmpQueue = append(tmpQueue, curNodeRec.Children...)
		}
		tmpQueue = tmpQueue[1:]
	}

	if parentId == rootNodeParentID && len(parentNodeR.Children) > 0 {
		// root节点不需要返回
		return parentNodeR.Children[0].Children
	}

	return parentNodeR.Children
}

func (u *DataGrade) GetInfoByID(ctx context.Context, req *data_grade.GetInfoByIDReqParam) (*data_grade.TreeNodeExtInfo, error) {
	data, err := u.dataGrade.GetInfoByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if data == nil {
		return nil, nil
	}
	dataResult := data
	var resultStr []string
	resultStr = append(resultStr, data.Name)
	for data.ID != "1" {
		dataTemp, err := u.dataGrade.GetInfoByID(ctx, data.ParentID)
		if err != nil {
			return nil, err
		}
		if dataTemp.Name == "top" {
			data = dataTemp
			continue
		}
		resultStr = append(resultStr, dataTemp.Name)
		data = dataTemp
	}

	resultNameDisplay := reverseJoinWithSeparator(resultStr, "/")
	result := convertToNewItem(dataResult)
	result.NameDisplay = resultNameDisplay
	return result, nil
}

func convertToNewItem(oldItems *model.DataGrade) *data_grade.TreeNodeExtInfo {
	newItems := &data_grade.TreeNodeExtInfo{
		DataGrade: &model.DataGrade{},
	}
	newItems.DataGrade.ID = oldItems.ID
	newItems.ParentID = oldItems.ParentID
	newItems.Icon = oldItems.Icon
	newItems.Name = oldItems.Name
	newItems.Description = oldItems.Description
	newItems.NodeType = oldItems.NodeType
	newItems.SortWeight = oldItems.SortWeight
	newItems.CreatedAt = oldItems.CreatedAt
	newItems.CreatedByUID = oldItems.CreatedByUID
	newItems.UpdatedAt = oldItems.UpdatedAt
	newItems.UpdatedByUID = oldItems.UpdatedByUID
	newItems.SensitiveAttri = oldItems.SensitiveAttri
	newItems.SecretAttri = oldItems.SecretAttri
	newItems.ShareCondition = oldItems.ShareCondition
	newItems.DataProtectionQuery = oldItems.DataProtectionQuery
	return newItems
}

func reverseJoinWithSeparator(slice []string, separator string) string {
	var reversedString string

	for i := len(slice) - 1; i >= 0; i-- {
		reversedString += slice[i]

		if i > 0 {
			reversedString += separator
		}
	}

	return reversedString
}

func (u *DataGrade) GetInfoByName(ctx context.Context, req *data_grade.GetInfoByNameReqParam) (*model.DataGrade, error) {
	data, err := u.dataGrade.GetInfoByName(ctx, req.Name)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (u *DataGrade) ExistByName(ctx context.Context, name string, id models.ModelID, nodeType int) (bool, error) {
	return u.dataGrade.ExistByName(ctx, name, id, nodeType)
}

func (u *DataGrade) ListIcon(ctx context.Context) ([]string, error) {
	data, err := u.dataGrade.ListIcon(ctx)
	if err != nil {
		return nil, err
	}
	result := convertDataGradeToIconList(data)
	return result, nil
}

func convertDataGradeToIconList(nodes []*model.DataGrade) []string {
	var result []string
	for _, node := range nodes {
		if node.Icon == "" {
			continue
		}
		result = append(result, node.Icon)
	}

	return result
}

func (u *DataGrade) GetListByIds(ctx context.Context, ids string) (*data_grade.TreeNodeExtInfoList, error) {
	nodes, err := u.dataGrade.GetListByIds(ctx, ids)
	if err != nil {
		return nil, err
	}
	var resultData []*data_grade.TreeNodeExtInfo
	for _, data := range nodes {
		var resultStr []string
		resultStr = append(resultStr, data.Name)
		dataResult := data
		for data.ID != "1" {
			dataTemp, err := u.dataGrade.GetInfoByID(ctx, data.ParentID)
			if err != nil {
				return nil, err
			}
			if dataTemp.Name == "top" {
				data = dataTemp
				continue
			}
			resultStr = append(resultStr, dataTemp.Name)
			data = dataTemp
		}

		resultNameDisplay := reverseJoinWithSeparator(resultStr, "/")
		result := convertToNewItem(dataResult)
		result.NameDisplay = resultNameDisplay
		resultData = append(resultData, result)
	}

	return &data_grade.TreeNodeExtInfoList{
		Entries: resultData,
	}, nil
}

func (u *DataGrade) GetBindObjects(ctx context.Context, labelID string) (listBindObjects *data_grade.ListBindObjects, err error) {
	var DataStandardization, BusinessAttri, DataView, DataCatalog []data_grade.EntrieObj
	DataStandardization, BusinessAttri, DataView, DataCatalog, err = u.dataGrade.GetBindObjects(ctx, labelID)
	if err != nil {
		return
	}
	listBindObjects = &data_grade.ListBindObjects{
		DataStandardization: data_grade.BindObjects{
			Entries:    DataStandardization,
			TotalCount: int64(len(DataStandardization)),
		},
		BusinessAttri: data_grade.BindObjects{
			Entries:    BusinessAttri,
			TotalCount: int64(len(BusinessAttri)),
		},
		DataView: data_grade.BindObjects{
			Entries:    DataView,
			TotalCount: int64(len(DataView)),
		},
		BusinessFormField: data_grade.BindObjects{
			Entries:    make([]data_grade.EntrieObj, 0),
			TotalCount: 0,
		},
		DataCatalog: data_grade.BindObjects{
			Entries:    DataCatalog,
			TotalCount: int64(len(DataCatalog)),
		},
	}
	return
}
