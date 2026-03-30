package auth_service

import "context"

type Repo interface {
	// 策略验证
	Enforce(ctx context.Context, policyEnforces []PolicyEnforce) ([]PolicyEnforceEffect, error)
	// 获取操作者拥有的资源
	GetSubjectObjects(ctx context.Context, opts GetObjectsOptions) (*ObjectWithPermissionsList, error)
}

type DrivenAuthService interface {
	// GetDownloadPolicyEnforce 下载策略验证
	GetDownloadPolicyEnforce(ctx context.Context, objectId string) (*PolicyEnforceRespItem, error)

	// GetPolicyAvailableAssets 访问者拥有的资源
	GetPolicyAvailableAssets(ctx context.Context) (availableRespItems []*PolicyAvailableRespItem, err error)
}
