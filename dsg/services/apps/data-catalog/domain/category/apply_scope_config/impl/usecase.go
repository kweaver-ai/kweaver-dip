package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category/apply_scope_config"
	catRepo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	relRepo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category_apply_scope_relation"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
)

type useCase struct {
	rel      relRepo.Repo
	cat      catRepo.Repo
	tree     catRepo.TreeRepo
	ccDriven configuration_center.Driven
}

func NewUseCase(rel relRepo.Repo, cat catRepo.Repo, tree catRepo.TreeRepo, ccDriven configuration_center.Driven) domain.UseCase {
	return &useCase{rel: rel, cat: cat, tree: tree, ccDriven: ccDriven}
}

func (u *useCase) Get(ctx context.Context, keyword string) (*domain.GetResp, error) {
	// 判断是否为xx环境
	isChangsha, err := u.ccDriven.GetCssjjSwitch(ctx)
	if err != nil {
		// 如果获取环境配置失败，记录错误但不影响主流程，默认展示所有模块
		isChangsha = false
	}

	// 左侧类目列表（按关键字过滤）
	cats, err := u.cat.GetAllCategory(ctx, keyword)
	if err != nil {
		return nil, err
	}
	summaries := make([]*domain.CategorySummary, 0, len(cats))
	for _, c := range cats {
		// 停用状态的类目不参与应用范围配置展示
		if c.Using != 1 {
			continue
		}
		// 关系：该类目的模块级配置（一次查询，后续复用）
		rels, err := u.rel.ListByCategory(ctx, c.CategoryID)
		if err != nil {
			return nil, err
		}
		relMap := map[string]*model.CategoryApplyScopeRelation{}
		for _, r := range rels {
			relMap[r.ApplyScopeID] = r
		}

		// 获取所有节点数据，用于判断模块是否被选中（特别是组织架构类目）
		allCategoryNodes, err := u.cat.ListTreeExt(ctx, c.CategoryID)
		if err != nil {
			return nil, err
		}

		modules := make([]*domain.Item, 0, len(domain.DefaultApplyScopes))
		for _, scope := range domain.DefaultApplyScopes {
			// 非xx环境：过滤掉"信息资源目录"模块
			if !isChangsha && scope.ID == domain.ScopeInfoResourceCatalog.ID {
				continue
			}

			var selected, required bool

			// 组织架构类目的特殊处理：所有模块默认都是必填和选中（固定值，不允许修改）
			if c.CategoryID == constant.DepartmentCateId {
				selected = true
				required = true
			} else {
				// 其他类目（自定义类目、信息系统等）：
				// 1. 默认值：selected=false（不勾选），required=false（非必填）
				// 2. 如果通过更新接口调整过，则从t_category_apply_scope_relation表中读取调整后的值
				// 3. 如果表中有记录：selected=true，required取决于Required字段（0=非必填，1=必填）
				// 4. 如果表中没有记录：返回默认值selected=false, required=false
				r := relMap[scope.ID]
				selected = r != nil
				required = r != nil && r.Required == 1
			}

			// 构建trees（使用已获取的节点数据，避免重复查询）
			trees := buildModuleTrees(allCategoryNodes, domain.ModuleTreeDefs[scope.ID])

			modules = append(modules, &domain.Item{ApplyScopeID: scope.ID, Name: scope.Name, Selected: selected, Required: required, Trees: trees})
		}

		summaries = append(summaries, &domain.CategorySummary{
			ID:       c.CategoryID,
			Name:     c.Name,
			Using:    c.Using == 1,
			Required: c.Required == 1,
			Modules:  modules,
		})
	}
	return &domain.GetResp{Categories: summaries, TotalCount: int64(len(summaries))}, nil
}

// 接口服务管理：根据 category_node 动态返回两个分组节点
func (u *useCase) buildInterfaceServiceTrees(ctx context.Context, categoryID string) ([]*domain.ModuleTree, error) {
	nodes, err := u.cat.ListTreeExt(ctx, categoryID)
	if err != nil {
		return nil, err
	}
	return buildModuleTrees(nodes, domain.ModuleTreeDefs[domain.ScopeInterfaceService.ID]), nil
}

// 数据资源目录
func (u *useCase) buildDataResourceTrees(ctx context.Context, categoryID string) ([]*domain.ModuleTree, error) {
	nodes, err := u.cat.ListTreeExt(ctx, categoryID)
	if err != nil {
		return nil, err
	}
	return buildModuleTrees(nodes, domain.ModuleTreeDefs[domain.ScopeDataResourceCatalog.ID]), nil
}

// 信息资源目录
func (u *useCase) buildInfoResourceTrees(ctx context.Context, categoryID string) ([]*domain.ModuleTree, error) {
	nodes, err := u.cat.ListTreeExt(ctx, categoryID)
	if err != nil {
		return nil, err
	}
	return buildModuleTrees(nodes, domain.ModuleTreeDefs[domain.ScopeInfoResourceCatalog.ID]), nil
}

func (u *useCase) Update(ctx context.Context, categoryID string, items []domain.Item) error {
	// 组织架构类目的模块配置不允许更新，其默认值（selected=true, required=true）是固定的
	if categoryID == constant.DepartmentCateId {
		return errors.New("组织架构类目的模块配置不允许更新，其默认值（必填、默认选中）是固定的")
	}

	if len(items) == 0 {
		return errors.New("items不能为空")
	}

	// 判断是否为xx环境
	isChangsha, err := u.ccDriven.GetCssjjSwitch(ctx)
	if err != nil {
		// 如果获取环境配置失败，记录错误但不影响主流程，默认展示所有模块
		isChangsha = false
	}

	// 验证必须包含的模块（根据环境动态调整）
	moduleMap := make(map[string]*domain.Item)
	for i := range items {
		if items[i].ApplyScopeID == "" {
			continue
		}
		// 非xx环境：过滤掉"信息资源目录"模块
		if !isChangsha && items[i].ApplyScopeID == domain.ScopeInfoResourceCatalog.ID {
			continue
		}
		moduleMap[items[i].ApplyScopeID] = &items[i]
	}

	// 根据环境确定期望的模块列表
	expectedModules := []string{
		domain.ScopeInterfaceService.ID,
		domain.ScopeDataResourceCatalog.ID,
	}
	if isChangsha {
		expectedModules = append(expectedModules, domain.ScopeInfoResourceCatalog.ID)
	}

	// 确保包含所有期望的模块
	for _, scopeID := range expectedModules {
		if _, ok := moduleMap[scopeID]; !ok {
			if isChangsha {
				return errors.New("items必须包含所有三个模块的配置: 接口服务管理、数据资源目录、信息资源目录")
			}
			return errors.New("items必须包含所有两个模块的配置: 接口服务管理、数据资源目录")
		}
	}

	// 循环处理每个模块的更新
	for _, item := range items {
		if item.ApplyScopeID == "" {
			continue
		}

		// 非xx环境：跳过"信息资源目录"模块的更新
		if !isChangsha && item.ApplyScopeID == domain.ScopeInfoResourceCatalog.ID {
			continue
		}

		if err := u.updateModuleRelation(ctx, categoryID, item); err != nil {
			return err
		}

		trees, err := u.buildTreesForScope(ctx, categoryID, item.ApplyScopeID)
		if err != nil {
			return err
		}

		nodeIDs := make(map[string]struct{})
		for _, tree := range trees {
			collectNodeIDs(tree.Nodes, nodeIDs)
		}
		if len(nodeIDs) == 0 {
			continue
		}

		// 先清零，再按请求写入
		for id := range nodeIDs {
			if err := u.tree.UpdateNodeSelectedExt(ctx, id, 0, "", ""); err != nil {
				return err
			}
			if err := u.tree.UpdateNodeRequiredExt(ctx, categoryID, id, 0, "", ""); err != nil {
				return err
			}
		}

		if !item.Selected {
			continue
		}

		desired := flattenRequestNodeStates(item)
		for id, state := range desired {
			if _, ok := nodeIDs[id]; !ok {
				continue
			}
			if err := u.tree.UpdateNodeSelectedExt(ctx, id, boolToInt(state.Selected), "", ""); err != nil {
				return err
			}
			if err := u.tree.UpdateNodeRequiredExt(ctx, categoryID, id, boolToInt(state.Required), "", ""); err != nil {
				return err
			}
		}
	}

	return nil
}

// updateModuleRelation 更新模块级配置（更新t_category_apply_scope_relation表）
// 逻辑：
// 1. 如果item.Selected=true：在表中创建或更新记录（Upsert），记录调整后的selected和required值
// 2. 如果item.Selected=false：删除表中的记录（BatchDelete），下次查询时会返回默认值selected=false, required=false
func (u *useCase) updateModuleRelation(ctx context.Context, categoryID string, item domain.Item) error {
	if item.Selected {
		// 选中：创建或更新记录，保存调整后的值
		req := 0
		if item.Required {
			req = 1
		}
		return u.rel.Upsert(ctx, &model.CategoryApplyScopeRelation{CategoryID: categoryID, ApplyScopeID: item.ApplyScopeID, Required: req})
	}

	// 未选中：删除记录，下次查询时返回默认值
	rels, err := u.rel.ListByCategory(ctx, categoryID)
	if err != nil {
		return err
	}
	var del []*model.CategoryApplyScopeRelation
	for _, r := range rels {
		if r.ApplyScopeID == item.ApplyScopeID {
			del = append(del, r)
		}
	}
	if len(del) == 0 {
		return nil
	}
	return u.rel.BatchDelete(ctx, del)
}

func (u *useCase) buildTreesForScope(ctx context.Context, categoryID, scopeID string) ([]*domain.ModuleTree, error) {
	switch scopeID {
	case domain.ScopeInterfaceService.ID:
		return u.buildInterfaceServiceTrees(ctx, categoryID)
	case domain.ScopeDataResourceCatalog.ID:
		return u.buildDataResourceTrees(ctx, categoryID)
	case domain.ScopeInfoResourceCatalog.ID:
		return u.buildInfoResourceTrees(ctx, categoryID)
	default:
		return nil, nil
	}
}

type nodeState struct {
	Selected bool
	Required bool
}

func buildModuleTrees(all []*model.CategoryNodeExt, defs []domain.ModuleTreeDef) []*domain.ModuleTree {
	if len(defs) == 0 {
		return []*domain.ModuleTree{}
	}
	flat := flattenCategoryNodes(all)
	result := make([]*domain.ModuleTree, 0, len(defs))
	for _, def := range defs {
		nodes := collectNodesByNames(flat, def)
		if nodes == nil {
			nodes = make([]*domain.TreeNode, 0)
		}
		result = append(result, &domain.ModuleTree{
			Key:   def.Key,
			Name:  def.Name,
			Nodes: nodes,
		})
	}
	return result
}

func collectNodeIDs(nodes []*domain.TreeNode, set map[string]struct{}) {
	for _, n := range nodes {
		if n == nil {
			continue
		}
		if n.ID != "" {
			set[n.ID] = struct{}{}
		}
		if len(n.Children) > 0 {
			collectNodeIDs(n.Children, set)
		}
	}
}

func flattenRequestNodeStates(item domain.Item) map[string]nodeState {
	states := make(map[string]nodeState)
	for _, tree := range item.Trees {
		for _, n := range tree.Nodes {
			if n.ID == "" {
				continue
			}
			states[n.ID] = nodeState{Selected: n.Selected, Required: n.Required}
			if len(n.Children) > 0 {
				mergeChildStates(states, n.Children)
			}
		}
	}
	return states
}

func mergeChildStates(states map[string]nodeState, nodes []*domain.TreeNode) {
	for _, n := range nodes {
		if n.ID == "" {
			continue
		}
		states[n.ID] = nodeState{Selected: n.Selected, Required: n.Required}
		if len(n.Children) > 0 {
			mergeChildStates(states, n.Children)
		}
	}
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func collectNodesByNames(flat []flatNode, def domain.ModuleTreeDef) []*domain.TreeNode {
	if len(flat) == 0 || len(def.NodeNames) == 0 {
		return nil
	}
	nameTargets := make(map[string]struct{}, len(def.NodeNames))
	for _, name := range def.NodeNames {
		nameTargets[name] = struct{}{}
	}
	parentTargets := make(map[string]struct{}, len(def.ParentNames))
	for _, name := range def.ParentNames {
		parentTargets[name] = struct{}{}
	}
	nodes := make([]*domain.TreeNode, 0)
	for _, fn := range flat {
		if fn.node == nil {
			continue
		}
		if _, ok := nameTargets[fn.node.Name]; !ok {
			continue
		}
		if len(parentTargets) > 0 {
			if _, ok := parentTargets[fn.parentName]; !ok {
				continue
			}
		}
		nodes = append(nodes, &domain.TreeNode{
			ID:       fn.node.CategoryNodeID,
			ParentID: fn.node.ParentID,
			Name:     fn.node.Name,
			Selected: fn.node.Selected == 1,
			Required: fn.node.Required == 1,
			Children: nil, // 明确设置为nil，避免不必要的嵌套层级
		})
	}
	return nodes
}

type flatNode struct {
	node       *model.CategoryNodeExt
	parentName string
}

func flattenCategoryNodes(all []*model.CategoryNodeExt) []flatNode {
	if len(all) == 0 {
		return nil
	}
	idToNode := make(map[string]*model.CategoryNodeExt, len(all))
	for _, n := range all {
		if n != nil {
			idToNode[n.CategoryNodeID] = n
		}
	}
	result := make([]flatNode, 0, len(all))
	for _, n := range all {
		if n == nil {
			continue
		}
		parentName := ""
		if parent, ok := idToNode[n.ParentID]; ok {
			parentName = parent.Name
		}
		result = append(result, flatNode{node: n, parentName: parentName})
	}
	return result
}
