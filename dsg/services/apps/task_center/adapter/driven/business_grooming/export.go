package business_grooming

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
)

var Service Call

func GetRemoteDomainInfo(ctx context.Context, subjectDomainId string) (*BusinessDomainInfo, error) {
	return Service.GetRemoteDomainInfo(ctx, subjectDomainId)
}
func GetRemoteBusinessModelInfo(ctx context.Context, businessModelId string) (*BriefModelInfo, error) {
	return Service.GetRemoteBusinessModelInfo(ctx, businessModelId)
}

// CheckFormIdBrief 检查表单和主干业务，返回主干业务信息
// 1,检查主干业务，业务域是否存在
// 2,检查表单和主干业务是否一致
// 3,检查表单是否存在
func CheckFormIdBrief(ctx context.Context, modelId string, formIds ...string) (*RelationDataList, error) {
	relationDataList, err := Service.QueryFormInfoWithModel(ctx, modelId, formIds...)
	if err != nil {
		return nil, err
	}
	if len(relationDataList.Data) != len(formIds) {
		return nil, errorcode.Desc(errorcode.RelationDataInvalidIdExists)
	}
	return relationDataList, nil
}

func QueryFormIdBrief(ctx context.Context, modelId string, formIds ...string) (*RelationDataList, error) {
	return Service.QueryFormInfoWithModel(ctx, modelId, formIds...)
}
