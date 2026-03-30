package impl

import (
	"context"
	"encoding/json"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"strings"
)

// Create 新建策略
func (a *auth) Create(ctx context.Context, req *dto.PolicyCreateReq) (*authorization.CreatePolicyResp, error) {
	args := lo.Times(len(req.Subjects), func(index int) *authorization.CreatePolicyReq {
		subject := req.Subjects[index]
		return &authorization.CreatePolicyReq{
			Accessor: authorization.Accessor{
				ID:   subject.SubjectId,
				Type: subject.SubjectType,
			},
			Resource: authorization.ResourceObject{
				ID:   req.Object.ObjectId,
				Type: dto.ObjectToResourceType(req.Object.ObjectType),
				Name: req.Object.ObjectName,
			},
			Operation: req.Subjects[index].Operations(),
			ExpiresAt: formatExpireTime(subject.ExpiredAt),
		}
	})
	resp, err := a.driven.CreatePolicy(ctx, args)
	if err != nil {
		log.Errorf("CreatePolicy Error %v", err.Error())
		return nil, err
	}
	return resp, nil
}

// Update  更新策略
func (a *auth) Update(ctx context.Context, req *dto.PolicyUpdateReq) error {
	//删除已有的
	policyDetail, err := a.Get(ctx, req.PolicyGetReq())
	if err != nil {
		return err
	}
	if len(policyDetail.Subjects) > 0 {
		reqSubjectDict := lo.SliceToMap(req.Subjects, func(item dto.Subject) (string, bool) {
			return item.SubjectId, true
		})
		deleteSubjects := lo.Filter(policyDetail.Subjects, func(item dto.Subject, index int) bool {
			return !reqSubjectDict[item.SubjectId]
		})
		if len(deleteSubjects) > 0 {
			ids := strings.Join(lo.Times(len(deleteSubjects), func(index int) string {
				return deleteSubjects[index].PolicyID
			}), ",")
			if err := a.driven.DeletePolicy(ctx, ids); err != nil {
				log.Errorf("DeletePolicy Error %v", err.Error())
				return err
			}
		}
	}
	//新增配置
	createSubjects := lo.Filter(req.Subjects, func(item dto.Subject, index int) bool {
		return item.PolicyID == ""
	})
	if len(createSubjects) > 0 {
		createArgs := lo.Times(len(createSubjects), func(index int) *authorization.CreatePolicyReq {
			subject := createSubjects[index]
			return &authorization.CreatePolicyReq{
				Accessor: authorization.Accessor{
					ID:   subject.SubjectId,
					Type: subject.SubjectType,
				},
				Resource: authorization.ResourceObject{
					ID:   req.Object.ObjectId,
					Type: dto.ObjectToResourceType(req.Object.ObjectType),
					Name: req.Object.ObjectName,
				},
				Operation: subject.Operations(),
				ExpiresAt: formatExpireTime(subject.ExpiredAt),
			}
		})
		if len(createArgs) > 0 {
			createResp, err := a.driven.CreatePolicy(ctx, createArgs)
			if err != nil {
				log.Errorf("CreatePolicy Error %v", err.Error())
				return err
			}
			log.Infof("CreatePolicy Success %s", string(lo.T2(json.Marshal(createResp)).A))
		}
	}
	//更新配置
	updateSubjects := lo.Filter(req.Subjects, func(item dto.Subject, index int) bool {
		return item.PolicyID != ""
	})
	if len(updateSubjects) <= 0 {
		return nil
	}
	ids := strings.Join(lo.Times(len(updateSubjects), func(index int) string {
		return updateSubjects[index].PolicyID
	}), ",")
	args := lo.Times(len(updateSubjects), func(index int) *authorization.UpdatePolicyReq {
		subject := updateSubjects[index]
		return &authorization.UpdatePolicyReq{
			Operation: subject.Operations(),
			ExpiresAt: formatExpireTime(subject.ExpiredAt),
		}
	})
	if err := a.driven.UpdatePolicy(ctx, ids, args); err != nil {
		log.Errorf("UpdatePolicy Error %v", err.Error())
		return err
	}
	return nil
}

// Delete 删除策略
func (a *auth) Delete(ctx context.Context, req *dto.PolicyDeleteReq) error {
	//查询所有的策略配置
	policyDetail, err := a.Get(ctx, req.PolicyGetReq())
	if err != nil {
		return err
	}
	if len(policyDetail.Subjects) <= 0 {
		return nil
	}
	ids := make([]string, 0)
	switch {
	case req.SubjectId == "": //删除所有
		ids = lo.Times(len(policyDetail.Subjects), func(index int) string {
			return policyDetail.Subjects[index].PolicyID
		})
	case req.SubjectType != "" && req.SubjectId == "": //删除某个种类
		ids = lo.FlatMap(policyDetail.Subjects, func(item dto.Subject, index int) []string {
			if item.SubjectType != req.SubjectType {
				return nil
			}
			return []string{item.PolicyID}
		})
	case req.SubjectType != "" && req.SubjectId != "": //删除某个
		ids = lo.FlatMap(policyDetail.Subjects, func(item dto.Subject, index int) []string {
			if item.SubjectType == req.SubjectType && item.SubjectId == req.SubjectId {
				return []string{item.PolicyID}
			}
			return nil
		})
	}
	if len(ids) <= 0 {
		return nil
	}
	if err = a.driven.DeletePolicy(ctx, strings.Join(ids, ",")); err != nil {
		log.Errorf("DeletePolicy Error %v", err.Error())
		return err
	}
	return nil
}

// Get  获取某个Object的策略配置
func (a *auth) Get(ctx context.Context, req *dto.PolicyGetReq) (*dto.Policy, error) {
	arg := &authorization.GetResourcePolicyReq{
		ResourceID:   req.ObjectId,
		ResourceType: dto.ObjectToResourceType(req.ObjectType),
		Offset:       0,
		Limit:        1000,
	}
	resourcePolicies, err := a.driven.GetResourcePolicy(ctx, arg)
	if err != nil {
		log.Errorf("Auth Get GetResourcePolicy Error %v", err.Error())
		return nil, err
	}
	//整理成想要的数据结构
	policy := &dto.Policy{
		Object: dto.Object{
			ObjectId:   req.ObjectId,
			ObjectType: req.ObjectType,
		},
		Subjects: make([]dto.Subject, 0),
	}
	//更新ObjectInfo
	objectInfo, err := a.helper.getObjectInfo(ctx, req.ObjectType, req.ObjectId)
	if err == nil {
		policy.Object = *objectInfo
	}
	//补充下部门信息
	accessorSlice := lo.Union(lo.Times(len(resourcePolicies.Entries), func(index int) string {
		accessor := resourcePolicies.Entries[index].Accessor
		return util.JoinField(accessor.Type, accessor.ID)
	}))
	subjectInfoDict, err := a.helper.getSubjectInfoDict(ctx, accessorSlice)
	if err != nil {
		log.Warnf("getSubjectKeyInfos error %v", err.Error())
	}
	for _, resourcePolicy := range resourcePolicies.Entries {
		subjectKey := util.JoinField(resourcePolicy.Accessor.Type, resourcePolicy.Accessor.ID)
		subject := dto.Subject{
			PolicyID:    resourcePolicy.ID,
			SubjectId:   resourcePolicy.Accessor.ID,
			SubjectType: resourcePolicy.Accessor.Type,
			SubjectName: resourcePolicy.Accessor.Name,
			Permissions: dto.OperationsToPermissions(resourcePolicy.Operation, resourcePolicy.ExpiresAt),
			Departments: subjectInfoDict[subjectKey].Departments,
			UserStatus:  dto.UserNormal,
			ExpiredAt:   convertExpireTime(resourcePolicy.ExpiresAt),
		}
		policy.Subjects = append(policy.Subjects, subject)
	}
	return policy, nil
}
