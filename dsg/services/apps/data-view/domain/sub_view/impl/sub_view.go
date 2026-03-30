package impl

import (
	"context"
	datasourceRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	logicViewRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/logic_view"
	subViewRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	goCommon_auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"
	"github.com/kweaver-ai/idrm-go-common/util"
)

type subViewUseCase struct {
	// repositories
	datasourceRepo     datasourceRepo.DatasourceRepo
	logicViewRepo      logicViewRepo.LogicViewRepo
	logicViewFieldRepo form_view_field.FormViewFieldRepo
	subViewRepo        subViewRepo.SubViewRepo

	// microservices
	drivenAuthService   auth_service.DrivenAuthService
	internalAuthService goCommon_auth_service.AuthServiceInternalV1Interface

	// message queue
	kafkaPub kafka_pub.KafkaPub
}

func NewSubViewUseCase(
	datasourceRepo datasourceRepo.DatasourceRepo,
	logicViewRepo logicViewRepo.LogicViewRepo,
	logicViewFieldRepo form_view_field.FormViewFieldRepo,
	subViewRepo subViewRepo.SubViewRepo,
	drivenAuthService auth_service.DrivenAuthService,
	kafkaPub kafka_pub.KafkaPub,
	internalAuthService goCommon_auth_service.AuthServiceInternalV1Interface,
) sub_view.SubViewUseCase {
	return &subViewUseCase{
		datasourceRepo:      datasourceRepo,
		logicViewRepo:       logicViewRepo,
		subViewRepo:         subViewRepo,
		drivenAuthService:   drivenAuthService,
		kafkaPub:            kafkaPub,
		internalAuthService: internalAuthService,
		logicViewFieldRepo:  logicViewFieldRepo,
	}
}

const (
	AuthAction   = string(authServiceV1.ActionAuth)     //授权
	AuthAllocate = string(authServiceV1.ActionAllocate) //授权仅分配
)

func (s *subViewUseCase) checkPermission(ctx context.Context, objectID string, objectType authServiceV1.ObjectType, actions ...string) error {
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
			return errorcode.AuthServiceError.Detail(err.Error())
		}
		if effectResp.Effect == auth_service.Effect_Allow {
			return nil
		}
	}
	return errorcode.SubViewPermissionNotAuthorized.Err()
}
