package impl

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	audit_policy_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/audit_policy"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_policy"
	user_domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type appsUseCase struct {
	auditPolicyRepo audit_policy_repo.AuditPolicyRepo
	user            user_domain.UseCase
}

func NewAuditPolicyUseCase(
	auditPolicyRepo audit_policy_repo.AuditPolicyRepo,
	user user_domain.UseCase,
) audit_policy.AppsUseCase {
	useCase := &appsUseCase{
		auditPolicyRepo: auditPolicyRepo,
		user:            user,
	}

	return useCase
}

func (u appsUseCase) Create(ctx context.Context, req *audit_policy.CreateReqBody, userInfo *model.User) (*audit_policy.CreateOrUpdateResBody, error) {
	// 流程：
	// 1、检查：
	//  a. 检查审核策略名称是否重复
	// 	b. 检查资源是否存在， 检查资源是否已经绑定
	// 	c. 检查资源梳理是否大于1000
	// 2、构造数据（审核策略、审核流程绑定关系）入库
	//  a. 创建时候流程为空
	//  b. 类型为自定义（不可改）
	//  a. 策略状态为未启用（待配置审核流程）
	// 3、返回结果(审核策略id)

	var resourceIds []string

	//  检查同名冲突
	err := u.IsNameRepeat(ctx, &audit_policy.NameRepeatReq{Name: req.Name})
	if err != nil {
		return nil, err
	}
	// 最多添加1000个资源
	if len(req.Resources) > 1000 {
		return nil, errorcode.Desc(errorcode.AuditPolicyResourceOver)
	}

	for _, resource := range req.Resources {
		resourceIds = append(resourceIds, resource.ID)
	}
	policyResources, err := u.auditPolicyRepo.GetAuditPolicyByResourceIds(ctx, resourceIds)
	if err != nil {
		return nil, err
	}
	if len(policyResources) > 0 {
		return nil, errorcode.Desc(errorcode.ResourceHasBind)
	}

	id := uuid.NewString()
	auditPolicy, auditPolicyResources := req.ToModel(userInfo.ID, id)
	err = u.auditPolicyRepo.Create(ctx, auditPolicy, auditPolicyResources)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	// 响应
	return &audit_policy.CreateOrUpdateResBody{ID: id}, nil
}

func (u appsUseCase) Update(ctx context.Context, req *audit_policy.UpdateReq, userInfo *model.User) (*audit_policy.CreateOrUpdateResBody, error) {
	// 流程：
	// 1、检查：
	//  a. 检查审核策略是否存在，如果改名，检查名称是否重复
	// 	b. 检查资源是否存在， 检查资源是否已经绑定
	// 	c. 检查资源梳理是否大于1000
	// 2、构造数据（审核策略、审核流程绑定关系）修改入库
	//  a. 修改时候可以修改流程（修改流程情况）
	//  b. 类型为自定义（不可改）
	//  a. 策略状态可以修改是否启动（走修改流程）
	// 3、返回结果(审核策略id)

	// 先检查数据库中是否存在策略
	policy, err := u.auditPolicyRepo.GetById(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	//  检查同名冲突
	err = u.IsNameRepeat(ctx, &audit_policy.NameRepeatReq{Name: req.Name, ID: req.Id})
	if err != nil {
		return nil, err
	}
	// 最多添加1000个资源
	if len(req.Resources) > 1000 {
		return nil, errorcode.Desc(errorcode.AuditPolicyResourceOver)
	}

	// 检查是否更新了审核状态
	if policy.Status != req.Status {
		// 检查是否能更新
		// 从未启用到启用, 从停用到启用，检查是否有审核流程
		if (policy.Status == audit_policy.AuditPolicyNotEnabledStatus || policy.Status == audit_policy.AuditPolicyDisEnabledInStatus) &&
			req.Status == audit_policy.AuditPolicyEnabledStatus {
			if req.ProcDefKey == "" {
				return nil, errorcode.Desc(errorcode.AuditPolicyNoAuditProcess)
			}
		}
	}

	// 检查是否绑定、解绑审核流程
	if policy.ProcDefKey.String != req.ProcDefKey {
		// 如果是解绑，设置状态为停用
		if req.ProcDefKey == "" {
			if req.Status == audit_policy.AuditPolicyEnabledStatus {
				return nil, errorcode.Desc(errorcode.AuditPolicyCantUnbind)
			}
			req.Status = audit_policy.AuditPolicyDisEnabledInStatus
		}
	}

	userId := userInfo.ID
	id := req.Id
	auditPolicy, auditPolicyResources := req.ToModel(userId, id, policy)
	err = u.auditPolicyRepo.Update(ctx, auditPolicy, auditPolicyResources)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	// 响应
	return &audit_policy.CreateOrUpdateResBody{ID: req.Id}, nil
}

func (u appsUseCase) UpdateStatus(ctx context.Context, req *audit_policy.UpdateStatusReq, userInfo *model.User) (*audit_policy.CreateOrUpdateResBody, error) {
	// 先检查数据库中是否存在策略
	policy, err := u.auditPolicyRepo.GetById(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	// 检查是否更新了审核状态
	if policy.Status != req.Status {
		// 检查是否能更新
		// 从未启用到启用, 从停用到启用，检查是否有审核流程
		if (policy.Status == audit_policy.AuditPolicyNotEnabledStatus || policy.Status == audit_policy.AuditPolicyDisEnabledInStatus) &&
			req.Status == audit_policy.AuditPolicyEnabledStatus {
			if policy.ProcDefKey.String == "" {
				return nil, errorcode.Desc(errorcode.AuditPolicyNoAuditProcess)
			}
		}
		policy.Status = req.Status
		policy.UpdatedByUID = userInfo.ID
	}
	err = u.auditPolicyRepo.Update(ctx, policy, nil)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	// 响应
	return &audit_policy.CreateOrUpdateResBody{ID: req.Id}, nil
}

func (u appsUseCase) Delete(ctx context.Context, req *audit_policy.DeleteReq) error {
	// 删除需要的操作：
	// 1, 检查审核策略是否存在
	// 2, 删除数据库
	_, err := u.auditPolicyRepo.GetById(ctx, req.Id)
	if err != nil {
		return err
	}
	err = u.auditPolicyRepo.Delete(ctx, req.Id)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	return nil
}

func (u appsUseCase) GetById(ctx context.Context, req *audit_policy.AuditPolicyReq) (*audit_policy.AuditPolicyRes, error) {
	// 根据审核策略ID获取信息
	// 1, 从审核策略表中查询基本信息
	// 2, 从审核策略表中查询资源列表
	// 3, 根据资源id批量获取资源组装·

	// 获取数据库中审核列表
	policy, err := u.auditPolicyRepo.GetById(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	resources := make([]*audit_policy.ResourcesDeatil, 0)
	policyResources, err := u.auditPolicyRepo.GetResourceByPolicyId(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	indicatorIds := make([]string, 0)
	dataViewIds := make([]string, 0)
	interfaceIds := make([]string, 0)

	for _, resource := range policyResources {
		if resource.Type == audit_policy.AssertIndicator {
			// id, _ := strconv.ParseUint(resource.ID, 10, 64)
			// indicatorIds = append(indicatorIds, id)
			indicatorIds = append(indicatorIds, resource.ID)
		}
		if resource.Type == audit_policy.AssertLogicalView {
			dataViewIds = append(dataViewIds, resource.ID)
		}
		if resource.Type == audit_policy.AssetInterfaceSvc {
			interfaceIds = append(interfaceIds, resource.ID)
		}
	}

	indicators, err := u.auditPolicyRepo.GetIndicatorByIds(ctx, indicatorIds)
	if err != nil {
		return nil, err
	}
	dataViews, err := u.auditPolicyRepo.GetFormViewByIds(ctx, dataViewIds)
	if err != nil {
		return nil, err
	}

	interfaces, err := u.auditPolicyRepo.GetServiceByIds(ctx, interfaceIds)
	if err != nil {
		return nil, err
	}

	indicatorIdMap := make(map[string]*audit_policy.ResourcesDeatil, 0)
	for _, indicator := range indicators {
		id := strconv.FormatUint(indicator.ID, 10)
		a := strings.Split(indicator.Path, "/")
		b := a[len(a)-1]
		indicatorIdMap[id] = &audit_policy.ResourcesDeatil{
			Name:               indicator.Name,
			UniformCatalogCode: indicator.Code,
			SubType:            indicator.IndicatorType,
			Subject:            indicator.SubjectDomainName,
			Department:         b,
		}
	}

	dataViewIdMap := make(map[string]*audit_policy.ResourcesDeatil, 0)
	for _, dataView := range dataViews {
		a := strings.Split(dataView.Path, "/")
		b := a[len(a)-1]
		dataViewIdMap[dataView.ID] = &audit_policy.ResourcesDeatil{
			Name:               dataView.BusinessName,
			UniformCatalogCode: dataView.UniformCatalogCode,
			Status:             dataView.OnlineStatus,
			TechnicalName:      dataView.TechnicalName,
			Subject:            dataView.SubjectDomainName,
			Department:         b,
		}
	}

	interfaceIdMap := make(map[string]*audit_policy.ResourcesDeatil, 0)
	for _, interfacea := range interfaces {
		a := strings.Split(interfacea.Path, "/")
		b := a[len(a)-1]
		interfaceIdMap[interfacea.ServiceID] = &audit_policy.ResourcesDeatil{
			Name:               interfacea.ServiceName,
			UniformCatalogCode: interfacea.ServiceCode,
			Status:             interfacea.Status,
			Subject:            interfacea.SubjectDomainName,
			Department:         b,
		}
	}

	for _, policyResource := range policyResources {
		if policyResource.Type == audit_policy.AssertIndicator {
			_, ok := indicatorIdMap[policyResource.ID]
			if !ok {
				resources = append(resources, &audit_policy.ResourcesDeatil{
					ID:     policyResource.ID,
					Status: "deleted",
					Type:   audit_policy.AssertIndicator,
				})
				continue
			}
			resources = append(resources, &audit_policy.ResourcesDeatil{
				ID:                 policyResource.ID,
				Name:               indicatorIdMap[policyResource.ID].Name,
				Status:             "",
				Type:               audit_policy.AssertIndicator,
				SubType:            indicatorIdMap[policyResource.ID].SubType,
				UniformCatalogCode: indicatorIdMap[policyResource.ID].UniformCatalogCode,
				TechnicalName:      "",
				Subject:            indicatorIdMap[policyResource.ID].Subject,
				Department:         indicatorIdMap[policyResource.ID].Department,
			})
		}
		if policyResource.Type == audit_policy.AssertLogicalView {
			_, ok := dataViewIdMap[policyResource.ID]
			if !ok {
				resources = append(resources, &audit_policy.ResourcesDeatil{
					ID:     policyResource.ID,
					Status: "deleted",
					Type:   audit_policy.AssertLogicalView,
				})
				continue
			}
			resources = append(resources, &audit_policy.ResourcesDeatil{
				ID:                 policyResource.ID,
				Name:               dataViewIdMap[policyResource.ID].Name,
				Status:             dataViewIdMap[policyResource.ID].Status,
				Type:               audit_policy.AssertLogicalView,
				UniformCatalogCode: dataViewIdMap[policyResource.ID].UniformCatalogCode,
				TechnicalName:      dataViewIdMap[policyResource.ID].TechnicalName,
				Subject:            dataViewIdMap[policyResource.ID].Subject,
				Department:         dataViewIdMap[policyResource.ID].Department,
			})
		}
		if policyResource.Type == audit_policy.AssetInterfaceSvc {
			_, ok := interfaceIdMap[policyResource.ID]
			if !ok {
				resources = append(resources, &audit_policy.ResourcesDeatil{
					ID:     policyResource.ID,
					Status: "deleted",
					Type:   audit_policy.AssetInterfaceSvc,
				})
				continue
			}
			resources = append(resources, &audit_policy.ResourcesDeatil{
				ID:                 policyResource.ID,
				Name:               interfaceIdMap[policyResource.ID].Name,
				Status:             interfaceIdMap[policyResource.ID].Status,
				Type:               audit_policy.AssetInterfaceSvc,
				UniformCatalogCode: interfaceIdMap[policyResource.ID].UniformCatalogCode,
				TechnicalName:      interfaceIdMap[policyResource.ID].TechnicalName,
				Subject:            interfaceIdMap[policyResource.ID].Subject,
				Department:         interfaceIdMap[policyResource.ID].Department,
			})
		}
	}

	res := &audit_policy.AuditPolicyRes{
		ID:             policy.ID,
		Name:           policy.Name,
		Type:           policy.Type,
		Description:    policy.Description.String,
		Status:         policy.Status,
		ResourcesCount: policy.ResourcesCount.Int64,
		AuditType:      policy.AuditType.String,
		ProcDefKey:     policy.ProcDefKey.String,
		ServiceType:    policy.ServiceType.String,
		CreatedAt:      policy.CreatedAt.UnixMilli(),
		CreatedName:    u.user.GetUserNameNoErr(ctx, policy.CreatedByUID),
		UpdatedAt:      policy.UpdatedAt.UnixMilli(),
		UpdatedName:    u.user.GetUserNameNoErr(ctx, policy.UpdatedByUID),
		Resources:      resources,
	}
	return res, nil
}
func (u appsUseCase) List(ctx context.Context, req *audit_policy.ListReqQuery, userInfo *model.User) (*audit_policy.ListRes, error) {
	// 获取审核策略的列表信息
	// 1, 从审核策略表中查询基本信息
	// 2, 从审核策略表中查询资源列表
	// 3, 根据资源id批量获取资源组装·

	// 获取数据库中审核列表
	audit_policys, count, err := u.auditPolicyRepo.List(ctx, req)
	if err != nil {
		return nil, err
	}

	entries := []*audit_policy.AuditPolicyList{}
	for _, policy := range audit_policys {
		entries = append(entries, &audit_policy.AuditPolicyList{
			ID:             policy.ID,
			Name:           policy.Name,
			Description:    policy.Description.String,
			Type:           policy.Type,
			Status:         policy.Status,
			ResourcesCount: policy.ResourcesCount.Int64,
			AuditType:      policy.AuditType.String,
			ProcDefKey:     policy.ProcDefKey.String,
			ServiceType:    policy.ServiceType.String,
			CreatedAt:      policy.CreatedAt.UnixMilli(),
			CreatedName:    u.user.GetUserNameNoErr(ctx, policy.CreatedByUID),
			UpdatedAt:      policy.UpdatedAt.UnixMilli(),
			UpdatedName:    u.user.GetUserNameNoErr(ctx, policy.UpdatedByUID),
		})
	}

	res := &audit_policy.ListRes{
		PageResults: response.PageResults[audit_policy.AuditPolicyList]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u appsUseCase) IsNameRepeat(ctx context.Context, req *audit_policy.NameRepeatReq) error {
	repeat, err := u.auditPolicyRepo.CheckNameRepeatWithId(ctx, req.Name, req.ID)
	if err != nil {
		return err
	}
	if repeat {
		return errorcode.Desc(errorcode.AuditPolicyNameExist)
	}
	return nil

}
func (u appsUseCase) GetAuditPolicyByResourceIds(ctx context.Context, ids string) (*audit_policy.ResourcePolicyRes, error) {
	f, ff, err := u.auditPolicyRepo.CheckPolicyEnabled(ctx, audit_policy.AssetInterfaceSvc)
	if err != nil {
		return nil, err
	}
	l, ll, err := u.auditPolicyRepo.CheckPolicyEnabled(ctx, audit_policy.AssertLogicalView)
	if err != nil {
		return nil, err
	}
	i, ii, err := u.auditPolicyRepo.CheckPolicyEnabled(ctx, audit_policy.AssertIndicator)
	if err != nil {
		return nil, err
	}

	resourceIds := strings.Split(ids, ",")
	policyResources, err := u.auditPolicyRepo.GetAuditPolicyByResourceIds(ctx, resourceIds)
	if err != nil {
		return nil, err
	}
	resources := make([]*audit_policy.ResourcesDeatils, 0)
	for _, policyResource := range policyResources {
		var hasAudit bool
		if policyResource.Type == audit_policy.AssetInterfaceSvc &&
			(f || (policyResource.Status == audit_policy.AuditPolicyEnabledStatus && !f)) {
			hasAudit = true
		}
		if policyResource.Type == audit_policy.AssertLogicalView &&
			(l || (policyResource.Status == audit_policy.AuditPolicyEnabledStatus && !l)) {
			hasAudit = true
		}
		if policyResource.Type == audit_policy.AssertIndicator &&
			(i || (policyResource.Status == audit_policy.AuditPolicyEnabledStatus && !i)) {
			hasAudit = true
		}

		resources = append(resources, &audit_policy.ResourcesDeatils{
			ID:       policyResource.ID,
			HasAudit: hasAudit,
		})
	}

	res := &audit_policy.ResourcePolicyRes{
		InterfaceSvcHasBuiltInAudit:   f,
		DataViewHasBuiltInAudit:       l,
		IndicatorHasBuiltInAudit:      i,
		InterfaceSvcHasCustomizeAudit: ff,
		DataViewHasCustomizeAudit:     ll,
		IndicatorHasCustomizeAudit:    ii,
		Resources:                     resources,
	}
	return res, nil
}

func (u appsUseCase) GetResourceAuditPolicy(ctx context.Context, id string) (*audit_policy.GetAuditProcessRes, error) {
	// 查询自定义的审核策略
	process, err := u.auditPolicyRepo.GetResourceAuditPolicyByResourceId(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			sourceType, err := u.checkResourceByID(ctx, id)
			if err != nil {
				return nil, err
			}
			policy, err := u.auditPolicyRepo.GetByType(ctx, "built-in-"+sourceType)
			if err != nil {
				return nil, err
			}
			if policy.Status == audit_policy.AuditPolicyEnabledStatus {
				process.AuditType = policy.AuditType.String
				process.ProcDefKey = policy.ProcDefKey.String
				process.ServiceType = policy.ServiceType.String
			}
			resp := &audit_policy.GetAuditProcessRes{
				ID:          id,
				AuditType:   process.AuditType,
				ProcDefKey:  process.ProcDefKey,
				ServiceType: process.ServiceType,
			}
			return resp, nil
		}
		return nil, err
	}

	// 如果自定义的审核策略不生效，则查询内置的审核策略
	if process.Status != audit_policy.AuditPolicyEnabledStatus {
		policy, err := u.auditPolicyRepo.GetByType(ctx, "built-in-"+process.Type)
		if err != nil {
			return nil, err
		}
		if policy.Status == audit_policy.AuditPolicyEnabledStatus {
			process.AuditType = policy.AuditType.String
			process.ProcDefKey = policy.ProcDefKey.String
			process.ServiceType = policy.ServiceType.String
		}
	}
	resp := &audit_policy.GetAuditProcessRes{
		ID:          id,
		AuditType:   process.AuditType,
		ProcDefKey:  process.ProcDefKey,
		ServiceType: process.ServiceType,
	}
	return resp, nil
}

func (u appsUseCase) checkResourceByID(ctx context.Context, id string) (string, error) {
	indicators, err := u.auditPolicyRepo.GetIndicatorByIds(ctx, []string{id})
	if err != nil {
		return "", err
	}
	if len(indicators) == 1 {
		return audit_policy.AssertIndicator, nil
	}
	dataViews, err := u.auditPolicyRepo.GetFormViewByIds(ctx, []string{id})
	if err != nil {
		return "", err
	}
	if len(dataViews) == 1 {
		return audit_policy.AssertLogicalView, nil
	}

	interfaces, err := u.auditPolicyRepo.GetServiceByIds(ctx, []string{id})
	if err != nil {
		return "", err
	}
	if len(interfaces) == 1 {
		return audit_policy.AssetInterfaceSvc, nil
	}
	return "", errorcode.Desc(errorcode.ResourceNotExist)
}
