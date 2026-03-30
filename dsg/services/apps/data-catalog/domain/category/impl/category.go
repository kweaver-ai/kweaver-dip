package impl

import (
	"context"
	"sort"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category"
	apply_scope "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/apply-scope"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category_apply_scope_relation"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

const MaxCategoryNum = 23

const MaxUsingCategoryNum = 5

var SystemCategorysId = []string{
	"00000000-0000-0000-0000-000000000001",
	"00000000-0000-0000-0000-000000000002",
	"00000000-0000-0000-0000-000000000003",
}

type useCase struct {
	repo                   category.Repo
	cfgRepo                configuration_center.Repo
	applyScopeRepo         apply_scope.Repo
	categoryApplyScopeRepo category_apply_scope_relation.Repo
}

func NewUseCase(repo category.Repo, cfgRepo configuration_center.Repo, applyScopeRepo apply_scope.Repo, categoryApplyScopeRepo category_apply_scope_relation.Repo) domain.UseCase {
	return &useCase{
		repo:                   repo,
		cfgRepo:                cfgRepo,
		applyScopeRepo:         applyScopeRepo,
		categoryApplyScopeRepo: categoryApplyScopeRepo,
	}
}

// Add 添加一个类目
func (u *useCase) Add(ctx context.Context, req *domain.AddReqParama) (*domain.CategorRespParam, error) {
	userInfo := request.GetUserInfo(ctx)

	// name重复检测
	category_id := ""
	err := u.existByNameDie(ctx, req.Name, category_id)
	if err != nil {
		return nil, err
	}

	// 查询自定义类目个数,不能超过20个
	count, err := u.repo.GetAllCategory(ctx, "")
	if err != nil {
		return nil, err
	}
	if len(count) >= MaxCategoryNum {
		log.WithContext(ctx).Errorf("category num over 20")
		return nil, errorcode.Desc(errorcode.CategoryOverflowMaxLayer)
	}

	categoryId := genCategoryNum()
	nodes := buildDefaultCategoryNodes(categoryId, req.Name, userInfo)

	m := req.ToModel(userInfo)
	m.CategoryID = categoryId
	n := &model.CategoryNode{
		CategoryNodeID: categoryId,
		CategoryID:     categoryId,
		Name:           req.Name,
		ParentID:       "0",
		CreatorUID:     userInfo.ID,
		CreatorName:    userInfo.Name,
	}
	if err := u.repo.CreateCategory(ctx, m, nodes, n); err != nil {
		return nil, err
	}

	return &domain.CategorRespParam{
		ID: m.CategoryID,
	}, nil
}

// Delete 删除一个类目
func (u *useCase) Delete(ctx context.Context, req *domain.DeleteReqParam) (*domain.CategorRespParam, error) {
	// 检查类目是否存在
	if err := u.existByIdDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	// 系统类目不可以删除
	for _, categoryID := range SystemCategorysId {
		if categoryID == req.CategoryID {
			return nil, errorcode.Desc(errorcode.CategorySystemDelete)
		}
	}

	exist, err := u.repo.Delete(ctx, req.CategoryID)
	if err != nil {
		return nil, err
	}

	resp := &domain.CategorRespParam{}
	if exist {
		resp.ID = req.CategoryID
	}

	return resp, nil
}

// Edit 编辑类目基本信息(名称和描述)
func (u *useCase) Edit(ctx context.Context, req *domain.EditReqParam) (*domain.CategorRespParam, error) {
	// 检查类目是否存在
	if err := u.existByIdDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	// 系统类目不可以修改
	for _, categoryID := range SystemCategorysId {
		if categoryID == req.CategoryID {
			return nil, errorcode.Desc(errorcode.CategorySystemEdit)
		}
	}

	userInfo := request.GetUserInfo(ctx)

	m := req.ToModel(userInfo)
	if err := u.repo.UpdateByEdit(ctx, m); err != nil {
		return nil, err
	}

	return &domain.CategorRespParam{
		ID: m.CategoryID,
	}, nil
}

// EditUsing 启动、停用类目
func (u *useCase) EditUsing(ctx context.Context, req *domain.EditUsingReqParam) (*domain.CategorRespParam, error) {
	for _, categoryID := range SystemCategorysId {
		if categoryID == req.CategoryID && req.CategoryID != "00000000-0000-0000-0000-000000000002" {
			return nil, errorcode.Desc(errorcode.CategorySystemEdit)
		}
	}
	// 检查类目是否存在
	if err := u.existByIdDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	if req.Using {
		// 启动时候判断类目树结构是否为空
		categoryNode, err := u.repo.ListTree(ctx, req.CategoryID)
		if err != nil {
			return nil, err
		}
		if len(categoryNode) == 1 {
			return nil, errorcode.Desc(errorcode.CategoryTreeNotExist)
		}
		// 如果是信息系统类别类目，为空不允许启动
		if req.CategoryID == "00000000-0000-0000-0000-000000000002" {
			infos, err := u.cfgRepo.GetInfoSysList(ctx)
			if err != nil {
				return nil, err
			}
			if infos.TotalCount == 0 {
				return nil, errorcode.Desc(errorcode.CategoryTreeNotExist)
			}
		}

		// 判断自定义的类目是否超过10个
		if req.CategoryID != "00000000-0000-0000-0000-000000000002" {
			usingCategory, err := u.repo.GetCategoryByUsing(ctx, 1)
			if err != nil {
				return nil, err
			}
			if len(usingCategory) >= 10 {
				return nil, errorcode.Desc(errorcode.CategoryUsingOverMax)
			}
		}
	}

	userInfo := request.GetUserInfo(ctx)
	m := req.ToModel(userInfo)
	if err := u.repo.EditUsing(ctx, m); err != nil {
		return nil, err
	}

	return &domain.CategorRespParam{
		ID: m.CategoryID,
	}, nil
}

// NameExistCheck 类目名称检查
func (u *useCase) NameExistCheck(ctx context.Context, req *domain.NameExistReqParam) (*domain.NameExistRespParam, error) {
	if req.ID != "" {
		if err := u.existByIdDie(ctx, req.ID); err != nil {
			return nil, err
		}
	}
	exist, err := u.repo.ExistByName(ctx, req.Name, req.ID)
	if err != nil {
		return nil, err
	}

	return &domain.NameExistRespParam{
		CheckRepeatResp: response.CheckRepeatResp{
			Name:   req.Name,
			Repeat: exist,
		},
	}, nil
}

// BatchEdit 批量修改指定类目排序（仅排序）
func (u *useCase) BatchEdit(ctx context.Context, reqs []domain.BatchEditReqParam) ([]domain.CategorRespParam, error) {
	userInfo := request.GetUserInfo(ctx)

	// 检查类目是否存在
	for _, req := range reqs {
		if err := u.existByIdDie(ctx, req.ID); err != nil {
			return nil, err
		}
	}
	var bb []model.Category
	for _, req := range reqs {
		m := req.ToModel(userInfo)
		bb = append(bb, m)
	}
	err := u.repo.BatchEdit(ctx, bb)
	if err != nil {
		return nil, err
	}

	// 仅排序，不更新是否必填与应用范围

	var cc []domain.CategorRespParam
	for _, b := range bb {
		cc = append(cc, domain.CategorRespParam{ID: b.CategoryID})
	}

	return cc, nil
}

// updateCategoryApplyScopeRelations 更新类目的应用范围关联关系
func (u *useCase) updateCategoryApplyScopeRelations(ctx context.Context, categoryID string, newApplyScopes []model.ApplyScope) error {
	// 1. 根据category_id查询旧的CategoryApplyScopeRelation数组
	oldRelations, err := u.categoryApplyScopeRepo.ListByCategory(ctx, categoryID)
	if err != nil {
		return err
	}

	// 2. 根据ApplyScopeInfo的id集合构建新的CategoryApplyScopeRelation数组
	var newRelations []*model.CategoryApplyScopeRelation
	for _, scope := range newApplyScopes {
		newRelations = append(newRelations, &model.CategoryApplyScopeRelation{
			CategoryID:   categoryID,
			ApplyScopeID: scope.ID,
		})
	}

	// 3. 构建新旧关系的映射，用于快速查找
	oldRelationMap := make(map[string]*model.CategoryApplyScopeRelation)
	for _, relation := range oldRelations {
		key := relation.ApplyScopeID
		oldRelationMap[key] = relation
	}

	newRelationMap := make(map[string]*model.CategoryApplyScopeRelation)
	for _, relation := range newRelations {
		key := relation.ApplyScopeID
		newRelationMap[key] = relation
	}

	// 4. 找出需要新增的关系（新的关系中的id不存在于旧关系中）
	var relationsToInsert []*model.CategoryApplyScopeRelation
	for _, newRelation := range newRelations {
		if _, exists := oldRelationMap[newRelation.ApplyScopeID]; !exists {
			relationsToInsert = append(relationsToInsert, newRelation)
		}
	}

	// 5. 找出需要删除的关系（旧关系中的id不存在于新关系中）
	var relationsToDelete []*model.CategoryApplyScopeRelation
	for _, oldRelation := range oldRelations {
		if _, exists := newRelationMap[oldRelation.ApplyScopeID]; !exists {
			relationsToDelete = append(relationsToDelete, oldRelation)
		}
	}

	// 6. 执行批量插入
	if len(relationsToInsert) > 0 {
		if err := u.categoryApplyScopeRepo.BatchInsert(ctx, relationsToInsert); err != nil {
			return err
		}
	}

	// 7. 执行批量删除
	if len(relationsToDelete) > 0 {
		if err := u.categoryApplyScopeRepo.BatchDelete(ctx, relationsToDelete); err != nil {
			return err
		}
	}

	return nil
}

func (u *useCase) GET(ctx context.Context, req *domain.GetReqParam) (*domain.CategoryInfo, error) {

	// 检查类目是否存在
	if err := u.existByIdDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	var nodeMs []*model.CategoryNodeExt
	var err error
	var defaultExpansion bool

	categoryRet, err := u.repo.GetCategory(ctx, req.CategoryID)
	if err != nil {
		return nil, err
	}

	nodeMs, err = u.repo.ListTree(ctx, req.CategoryID)
	if err != nil {
		return nil, err
	}
	nodes := parentIdToTreeNodeRecursiveSlice(nodeMs)
	ret := domain.NewListTreeRespParam(nodes, defaultExpansion)

	b := &domain.CategoryInfo{
		ID:               categoryRet.CategoryID,
		Name:             categoryRet.Name,
		Describe:         categoryRet.Description,
		Using:            (categoryRet.Using & 1) == 1,
		Required:         (categoryRet.Required & 1) == 1,
		Type:             categoryRet.Type,
		CreateUpdateTime: response.NewCreateUpdateTime(&categoryRet.CreatedAt, &categoryRet.UpdatedAt),
		CreateUpdateUser: response.NewCreateUpdateUser(categoryRet.CreatorName, categoryRet.UpdaterName),
		TreeNode:         ret,
	}
	return b, nil
}

func (u *useCase) GetAll(ctx context.Context, req *domain.ListReqParam) (*domain.ListCategoryRespParam, error) {
	req.Keyword = strings.Replace(req.Keyword, "_", "\\_", -1)
	req.Keyword = strings.Replace(req.Keyword, "%", "\\%", -1)

	nodeMs, err := u.repo.GetAllCategory(ctx, req.Keyword)
	if err != nil {
		return nil, err
	}

	var c []*domain.CategoryInfo
	for _, node := range nodeMs {
		var req domain.GetReqParam
		req.CategoryPathParam.CategoryID = node.CategoryID
		a, err := u.GET(ctx, &req)
		if err != nil {
			return nil, err
		}

		// 获取 ApplyScopeInfo
		applyScopeInfo, err := u.getApplyScopeInfo(ctx, node.CategoryID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get apply scope info for category %s: %v", node.CategoryID, err)
			// 不返回错误，继续处理其他类目
			applyScopeInfo = []model.ApplyScope{}
		}
		a.ApplyScopeInfo = applyScopeInfo

		c = append(c, a)
	}

	result := &domain.ListCategoryRespParam{
		PageResult: response.PageResult[domain.CategoryInfo]{
			Entries:    c,
			TotalCount: int64(len(c)),
		},
	}

	return result, nil
}

// getApplyScopeInfo 获取类目的应用范围信息
func (u *useCase) getApplyScopeInfo(ctx context.Context, categoryID string) ([]model.ApplyScope, error) {
	// 1. 根据 ListByCategory 查询 CategoryApplyScopeRelation 的数组
	relations, err := u.categoryApplyScopeRepo.ListByCategory(ctx, categoryID)
	if err != nil {
		return nil, err
	}

	if len(relations) == 0 {
		return []model.ApplyScope{}, nil
	}

	// 2. 根据 CategoryApplyScopeRelation 的数组中，构建 ApplyScopeID 的数组
	var applyScopeIDs []string
	for _, relation := range relations {
		applyScopeIDs = append(applyScopeIDs, relation.ApplyScopeID)
	}

	// 3. 根据 ApplyScopeID 的数组和 ListByUUIDs 方法查询 ApplyScope 数组
	applyScopes, err := u.applyScopeRepo.ListByUUIDs(ctx, applyScopeIDs)
	if err != nil {
		return nil, err
	}

	// 转换为 model.ApplyScope 数组
	var result []model.ApplyScope
	for _, scope := range applyScopes {
		result = append(result, *scope)
	}

	return result, nil
}

func parentIdToTreeNodeRecursiveSlice(nodes []*model.CategoryNodeExt) []*model.CategoryNodeExt {
	if len(nodes) < 1 {
		return nil
	}

	// sort
	sort.Slice(nodes, func(i, j int) bool {
		return nodes[i].SortWeight < nodes[j].SortWeight
	})

	parentSubMap := lo.GroupBy(nodes, func(item *model.CategoryNodeExt) string {
		return item.ParentID
	})

	parentNodeR := &model.CategoryNodeExt{CategoryNode: &model.CategoryNode{CategoryNodeID: "0"}, Expansion: true}
	tmpQueue := make([]*model.CategoryNodeExt, 0, 5)
	tmpQueue = append(tmpQueue, parentNodeR)
	var curNodeRec *model.CategoryNodeExt
	for len(tmpQueue) > 0 {
		curNodeRec = tmpQueue[0]
		curNodeRec.Children = parentSubMap[curNodeRec.CategoryNodeID]
		if len(curNodeRec.Children) > 0 {
			curNodeRec.Expansion = true
			tmpQueue = append(tmpQueue, curNodeRec.Children...)
		}
		tmpQueue = tmpQueue[1:]
	}

	if len(parentNodeR.Children) > 0 {
		// root节点不需要返回
		return parentNodeR.Children[0].Children
	}

	return parentNodeR.Children
}

func (u *useCase) existByNameDie(ctx context.Context, name string, id string) error {
	exit, err := u.repo.ExistByName(ctx, name, id)
	if err != nil {
		return err
	}

	if exit {
		log.WithContext(ctx).Errorf("category name repeat")
		return errorcode.Desc(errorcode.CategoryNameRepeat)
	}

	return nil
}

func (u *useCase) existByIdDie(ctx context.Context, id string) error {
	exit, err := u.repo.ExistByID(ctx, id)
	if err != nil {
		return err
	}

	if !exit {
		log.WithContext(ctx).Errorf("category name repeat")
		return errorcode.Desc(errorcode.CategoryNotExist)
	}

	return nil
}

func buildDefaultCategoryNodes(categoryID, categoryName string, user *middleware.User) []*model.CategoryNode {
	creatorUID, creatorName := "", ""
	if user != nil {
		creatorUID = user.ID
		creatorName = user.Name
	}

	nodes := make([]*model.CategoryNode, 0, 9)
	root := &model.CategoryNode{
		CategoryNodeID: categoryID,
		CategoryID:     categoryID,
		ParentID:       "0",
		Name:           categoryName,
		Required:       0,
		Selected:       0,
		SortWeight:     0,
		CreatorUID:     creatorUID,
		CreatorName:    creatorName,
		UpdaterUID:     creatorUID,
		UpdaterName:    creatorName,
	}
	nodes = append(nodes, root)

	moduleDefs := []struct {
		name     string
		weight   uint64
		children []struct {
			name   string
			weight uint64
		}
	}{
		{
			name:   "接口服务管理",
			weight: 10,
			children: []struct {
				name   string
				weight uint64
			}{
				{name: "接口列表左侧树", weight: 10},
				{name: "数据服务超市左侧树", weight: 20},
			},
		},
		{
			name:   "数据资源目录",
			weight: 20,
			children: []struct {
				name   string
				weight uint64
			}{
				{name: "数据资源目录左侧树", weight: 10},
				{name: "数据服务超市左侧树", weight: 20},
			},
		},
		{
			name:   "信息资源目录",
			weight: 30,
			children: []struct {
				name   string
				weight uint64
			}{
				{name: "信息资源目录左侧树", weight: 10},
			},
		},
	}

	for _, mod := range moduleDefs {
		moduleID := genCategoryNum()
		moduleNode := &model.CategoryNode{
			CategoryNodeID: moduleID,
			CategoryID:     categoryID,
			ParentID:       categoryID,
			Name:           mod.name,
			Required:       0,
			Selected:       0,
			SortWeight:     mod.weight,
			CreatorUID:     creatorUID,
			CreatorName:    creatorName,
			UpdaterUID:     creatorUID,
			UpdaterName:    creatorName,
		}
		nodes = append(nodes, moduleNode)

		for _, child := range mod.children {
			childNode := &model.CategoryNode{
				CategoryNodeID: genCategoryNum(),
				CategoryID:     categoryID,
				ParentID:       moduleID,
				Name:           child.name,
				Required:       0,
				Selected:       0,
				SortWeight:     child.weight,
				CreatorUID:     creatorUID,
				CreatorName:    creatorName,
				UpdaterUID:     creatorUID,
				UpdaterName:    creatorName,
			}
			nodes = append(nodes, childNode)
		}
	}

	return nodes
}

func genCategoryNum() string {
	return util.NewUUID()
}
