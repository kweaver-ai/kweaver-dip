package impl

import (
	"context"

	repo "github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"
	"github.com/kweaver-ai/idrm-go-common/util"
)

type subServiceUseCase struct {
	serviceRepo         repo.ServiceRepo
	subServiceRepo      repo.SubServiceRepo
	internalAuthService auth_service.AuthServiceInternalV1Interface
	mq                  *mq.MQ
}

func NewSubServiceUseCase(
	serviceRepo repo.ServiceRepo,
	subServiceRepo repo.SubServiceRepo,
	mq *mq.MQ,
	internalAuthService auth_service.AuthServiceInternalV1Interface,
) sub_service.UseCase {
	return &subServiceUseCase{
		serviceRepo:         serviceRepo,
		subServiceRepo:      subServiceRepo,
		internalAuthService: internalAuthService,
		mq:                  mq,
	}
}

const (
	AuthAction     = string(authServiceV1.ActionAuth)     //授权
	AllocateAction = string(authServiceV1.ActionAllocate) //授权仅分配
)

func (s *subServiceUseCase) checkPermission(ctx context.Context, objectID string, objectType authServiceV1.ObjectType, actions ...string) error {
	userInfo := util.ObtainUserInfo(ctx)
	if userInfo == nil {
		return errorcode.PublicQueryUserInfoError.Err()
	}
	arg := &authServiceV1.RulePolicyEnforce{
		UserID:     userInfo.ID,
		ObjectType: string(objectType),
		ObjectId:   objectID,
	}
	for _, arg.Action = range actions {
		effectResp, err := s.internalAuthService.RuleEnforce(ctx, arg)
		if err != nil {
			return errorcode.AuthServiceError.Desc(err.Error())
		}
		if effectResp.Effect == string(authServiceV1.PolicyAllow) {
			return nil
		}
	}
	return errorcode.SubServicePermissionNotAuthorized.Err()
}
