package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/tree"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/tree_node"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	MaxLayers = 4
)

const spanNamePre = "repo TreeNodeRepo "

type useCase struct {
	repo     tree_node.Repo
	treeRepo tree.Repo
}

func NewUseCase(repo tree_node.Repo, treeRepo tree.Repo) domain.UseCase {
	return &useCase{repo: repo, treeRepo: treeRepo}
}

func (u *useCase) treeExistCheckDie(ctx context.Context, treeId models.ModelID, checkedRootNodeId ...models.ModelID) error {
	rootNodeId, err := u.treeRepo.GetRootNodeId(ctx, treeId)
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

func (u *useCase) parentNodeExistCheckDie(ctx context.Context, nodeId *models.ModelID, treeId models.ModelID) error {
	rootNodeId, err := u.treeRepo.GetRootNodeId(ctx, treeId)
	if err != nil {
		return err
	}

	// 若没有父节点，则默认为根节点
	if len(*nodeId) < 1 || nodeId.Uint64() < 1 {
		*nodeId = rootNodeId
	}

	return u._nodeExistCheckDie(ctx, *nodeId, treeId)
}

func (u *useCase) nodeExistCheckDie(ctx context.Context, nodeId, treeId models.ModelID) error {
	if err := u.treeExistCheckDie(ctx, treeId, nodeId); err != nil {
		return err
	}

	return u._nodeExistCheckDie(ctx, nodeId, treeId)
}

func (u *useCase) _nodeExistCheckDie(ctx context.Context, nodeId, treeId models.ModelID) error {
	exist, err := u.repo.ExistByIdAndTreeId(ctx, nodeId, treeId)
	if err != nil {
		return err
	}

	if !exist {
		log.WithContext(ctx).Errorf("tree node id not found, node id: %v, tree id: %v", nodeId, treeId)
		return errorcode.Desc(errorcode.TreeNodeNotExist)
	}

	return nil
}

func (u *useCase) nodeExistCheckWithParentIDDie(ctx context.Context, nodeId, parentId, treeId models.ModelID) error {
	if err := u.treeExistCheckDie(ctx, treeId, nodeId); err != nil {
		return err
	}

	exist, err := u.repo.ExistByIdAndParentIdTreeId(ctx, nodeId, parentId, treeId)
	if err != nil {
		return err
	}

	if !exist {
		log.WithContext(ctx).Errorf("tree node id not found, node id: %v, tree id: %v", nodeId, treeId)
		return errorcode.Desc(errorcode.TreeNodeNotExist)
	}

	return nil
}

func (u *useCase) existByName(ctx context.Context, name string, parentId, treeId /*treeId纯粹为了使用到索引*/ models.ModelID, excludedIds ...models.ModelID) (bool, error) {
	return u.repo.ExistByName(ctx, name, parentId, treeId, excludedIds...)
}

func (u *useCase) existByNameDie(ctx context.Context, name string, parentId, treeId /*treeId纯粹为了使用到索引*/ models.ModelID, excludedIds ...models.ModelID) error {
	exit, err := u.repo.ExistByName(ctx, name, parentId, treeId, excludedIds...)
	if err != nil {
		return err
	}

	if exit {
		log.WithContext(ctx).Errorf("tree node name repeat")
		return errorcode.Desc(errorcode.TreeNodeNameRepeat)
	}

	return nil
}
