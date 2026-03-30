package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
)

func (f *flowchartUseCase) Get(ctx context.Context, fId string) (*domain.GetResp, error) {
	fc, err := f.FlowchartExistCheckDie(ctx, fId)
	if err != nil {
		return nil, err
	}

	getUsernameOP := common.NewGetUsernameOp(f.repoUser)
	getUsernameOP.AddUserId(fc.CreatedByUID, fc.UpdatedByUID)

	err = getUsernameOP.GetUser(ctx)
	if err != nil {
		return nil, err
	}

	createUserName := getUsernameOP.GetUsername(fc.CreatedByUID)
	updateUserName := getUsernameOP.GetUsername(fc.UpdatedByUID)

	return (&domain.GetResp{}).ToHttp(fc, createUserName, updateUserName), nil
}
