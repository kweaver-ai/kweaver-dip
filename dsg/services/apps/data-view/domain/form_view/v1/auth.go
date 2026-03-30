package v1

import (
	"context"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/util"
	"strings"
)

func (f *formViewUseCase) youCanAuth(ctx context.Context, viewDetail *model.FormView) (bool, error) {
	userInfo := util.ObtainUserInfo(ctx)
	if userInfo == nil {
		return false, fmt.Errorf(" dataViewID: %v, missing user info while add user auth actions", viewDetail.ID)
	}
	//owner 直接返回true
	if userInfo.ID != "" && strings.Contains(viewDetail.OwnerId.String, userInfo.ID) {
		return true, nil
	}
	dict, err := f.subViewRepo.ListSubViews(ctx, viewDetail.ID)
	if err != nil {
		return false, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	authReq := make([]auth_service.EnforceRequest, 0)
	for _, subViewIDSlice := range dict {
		for i := range subViewIDSlice {
			peAuth := auth_service.EnforceRequest{
				SubjectID:   userInfo.ID,
				SubjectType: auth_service.SubjectTypeUser,
				ObjectID:    subViewIDSlice[i],
				ObjectType:  auth_service.ObjectTypeSubView,
				Action:      auth_service.Action_Auth,
			}
			authReq = append(authReq, peAuth)
			peAllocate := auth_service.EnforceRequest{
				SubjectID:   userInfo.ID,
				SubjectType: auth_service.SubjectTypeUser,
				ObjectID:    subViewIDSlice[i],
				ObjectType:  auth_service.ObjectTypeSubView,
				Action:      auth_service.Action_Allocate,
			}
			authReq = append(authReq, peAllocate)
		}
	}
	policyEffects, err := f.DrivenAuthService.Enforce(ctx, authReq)
	if err != nil {
		return false, err
	}
	for _, effect := range policyEffects {
		if effect {
			return true, nil
		}
	}
	return false, nil
}
