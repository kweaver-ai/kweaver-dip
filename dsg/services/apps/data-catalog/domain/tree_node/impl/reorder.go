package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/trace_util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// Reorder 将指定的节点移动到指定的父节点下的指定子节点前
// 删除指定的节点，将其插入到指定父节点下的指定子节点前
func (u *useCase) Reorder(ctx context.Context, req *domain.ReorderReqParam) (*domain.ReorderRespParam, error) {
	if err := u.treeExistCheckDie(ctx, req.TreeID, req.ID); err != nil {
		return nil, err
	}

	name, err := u.repo.GetNameById(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if err = u.parentNodeExistCheckDie(ctx, &req.DestParentID, req.TreeID); err != nil {
		return nil, err
	}

	if req.ID == req.DestParentID {
		// 将自身移动自身下，不支持的操作
		log.WithContext(ctx).Errorf("move to self, unsupported, id: %v, dest parent id: %v", req.ID, req.NextID)
		return nil, errorcode.Desc(errorcode.TreeNodeMoveToSubErr)
	}

	if req.NextID.Uint64() > 0 {
		if err = u.nodeExistCheckWithParentIDDie(ctx, req.NextID, req.DestParentID, req.TreeID); err != nil {
			return nil, err
		}

		if req.NextID == req.ID {
			// 将自身移动到自身之上，不需要操作
			return domain.NewReorderRespParam(req.ID), nil
		}
	}

	if err = u.existByNameDie(ctx, name, req.DestParentID, req.TreeID, req.ID); err != nil {
		return nil, err
	}

	if err = trace_util.TraceA5R1(ctx, spanNamePre+"Reorder", req.ID, req.DestParentID, req.NextID, req.TreeID, MaxLayers, u.repo.Reorder); err != nil {
		return nil, err
	}
	//if err = u.repo.Reorder(ctx, req.ID, req.DestParentID, req.NextID, req.TreeID, MaxLayers); err != nil {
	//	return nil, err
	//}

	return domain.NewReorderRespParam(req.ID), nil
}
