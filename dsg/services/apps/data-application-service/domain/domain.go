package domain

import (
	"github.com/google/wire"
	sub_service "github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service/impl"
)

// ProviderSet is biz providers.
var ProviderSet = wire.NewSet(
	NewDeveloperDomain,
	NewServiceDomain,
	NewFileDomain,
	NewAuditProcessBindDomain,
	NewServiceStatsDomain,
	NewServiceApplyDomain,
	NewSubjectDomain,
	NewServiceDailyRecordDomain,
	sub_service.NewSubServiceUseCase,
	NewServiceCallRecordDomain,
)

// NewDataApplicationServiceCallbackFromInterface 从callback.Interface创建DataApplicationServiceCallback
// func NewDataApplicationServiceCallbackFromInterface(callbackInterface callback.Interface) *DataApplicationServiceCallback {
// 	client := callbackInterface.DataApplicationServiceV1().DataApplicationService()
// 	return NewDataApplicationServiceCallback(client)
// }
