package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/http_client/user_management"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/tree_node"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (u *useCase) Get(ctx context.Context, req *domain.GetReqParam) (*domain.GetRespParam, error) {
	if err := u.treeExistCheckDie(ctx, req.TreeID, req.ID); err != nil {
		return nil, err
	}

	nodeM, err := u.repo.GetByIdAndTreeId(ctx, req.ID, req.TreeID)
	if err != nil {
		return nil, err
	}

	token, ok := ctx.Value(interception.Token).(string)
	if !ok {
		log.WithContext(ctx).Warnf("context no token")
		return domain.NewGetRespParam(nodeM, "", ""), nil
	}

	var createUserName, updateUserName string
	if len(nodeM.CreatedByUID) > 0 {
		createUserInfo, err := user_management.GetUserInfoByUserID2(ctx, token, nodeM.CreatedByUID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get user info by user id, err: %v", err)
			return nil, err
		}

		createUserName = createUserInfo.UserName
	}

	if nodeM.CreatedByUID != nodeM.UpdatedByUID && len(nodeM.UpdatedByUID) > 0 {
		updateUserInfo, err := user_management.GetUserInfoByUserID2(ctx, token, nodeM.UpdatedByUID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get user info by user id, err: %v", err)
			return nil, err
		}

		updateUserName = updateUserInfo.UserName
	} else {
		updateUserName = createUserName
	}

	return domain.NewGetRespParam(nodeM, createUserName, updateUserName), nil
}
