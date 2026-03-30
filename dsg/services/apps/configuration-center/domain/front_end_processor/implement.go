package front_end_processor

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/front_end_processor"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/info_system"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	wf "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/workflow"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/middleware"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	v1 "github.com/kweaver-ai/idrm-go-common/api/doc_audit_rest/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/interception"
	doc_audit_rest_v1 "github.com/kweaver-ai/idrm-go-common/rest/doc_audit_rest/v1"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type useCase struct {
	// 数据库 audit_process_bind
	auditProcessBind audit_process_bind.AuditProcessBindRepo
	// 数据库 business_structure
	businessStructure business_structure.Repo
	// 数据库 front_end_processor
	frontEndProcessor front_end_processor.Repository
	// 信息系统
	repo info_system.Repo
	// 数据库 user
	user user2.IUserRepo
	u    domain.UseCase

	// doc-audit-rest biz
	biz doc_audit_rest_v1.BizInterface
	// Workflow
	workflow workflow.WorkflowInterface
	wf       wf.Workflow
}

func New(
	// 数据库 audit_process_bind
	auditProcessBind audit_process_bind.AuditProcessBindRepo,
	// 数据库 business_structure
	businessStructure business_structure.Repo,
	// 数据库 front_end_processor
	frontEndProcessor front_end_processor.Repository,
	// 数据库 user
	user user2.IUserRepo,
	// doc-audit-rest
	docAuditREST doc_audit_rest_v1.DocAuditRestV1Interface,
	// Workflow
	workflow workflow.WorkflowInterface,
	repo info_system.Repo,
	wf wf.Workflow,
	u domain.UseCase,
) UseCase {
	uc := &useCase{
		auditProcessBind:  auditProcessBind,
		businessStructure: businessStructure,
		frontEndProcessor: frontEndProcessor,
		user:              user,
		biz:               docAuditREST.DocAudit().Biz(),
		workflow:          workflow,
		repo:              repo,
		wf:                wf,
		u:                 u,
	}
	uc.RegisterConsumeHandlers(workflow)
	return uc
}

// Create implements UseCase.
func (uc *useCase) Create(ctx context.Context, p *configuration_center_v1.FrontEndProcessor) error {
	// 存入数据库
	if err := uc.frontEndProcessor.Create(ctx, p); err != nil {
		// TODO: 区分主键冲突、订单号冲突
		return err
	}

	// 草稿、暂存不需要发起 workflow 审核
	if p.Request.IsDraft {
		return nil
	}

	// 遍历每个 processor请求，数据保存到front_end_processor_request表中
	// 遍历每个 processor
	// 转换 p.Request.Processor 为 []*configuration_center_v1.FrontEnd
	var frontEnds []*configuration_center_v1.FrontEnd
	for _, processor := range p.Request.Processor {
		frontEnd := &configuration_center_v1.FrontEnd{
			ID:               uuid.Must(uuid.NewV7()).String(),
			FrontEndID:       p.ID,
			OperatorSystem:   processor.OS,
			ComputerResource: processor.Spec,
			DiskSpace:        processor.BusinessDiskSpace,
			LibraryNumber:    processor.LibraryCount,
			LibraryList:      processor.LibraryList,
		}
		frontEnds = append(frontEnds, frontEnd)
	}
	if err := uc.frontEndProcessor.CreateList(ctx, frontEnds); err != nil {
		// TODO: 批量创建失败，需要回滚
		return err
	}
	// 发起 workflow 审核
	if err := uc.auditApply(ctx, p); err != nil {
		return err
	}

	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	p.UpdateTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	p.RequestTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	// 更新记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 id 不存在
		return err
	}

	return nil
}

// 实现创建前置机列表接口
func (uc *useCase) CreateList(ctx context.Context, ps []*configuration_center_v1.FrontEnd) error {
	if err := uc.frontEndProcessor.CreateList(ctx, ps); err != nil {
		return err
	}
	return nil
}

// UpdateList implements UseCase.
func (uc *useCase) UpdateList(ctx context.Context, ps []*configuration_center_v1.FrontEnd, id string) error {
	if err := uc.frontEndProcessor.UpdateList(ctx, ps, id); err != nil {
		return err
	}
	return nil
}

// Delete implements UseCase.
func (uc *useCase) Delete(ctx context.Context, id string) error {
	// 从数据库删除
	if err := uc.frontEndProcessor.Delete(ctx, id); err != nil {
		// TODO: 区分 id 不存在，Phase 不是 Pending
		return err
	}
	return nil
}

// Get implements UseCase.
func (uc *useCase) Get(ctx context.Context, id string) (*configuration_center_v1.AggregatedFrontEndProcessor, error) {
	// 从数据库获取
	p, err := uc.frontEndProcessor.Get(ctx, id)
	if err != nil {
		// TODO: 区分 id 不存在
		return nil, err
	}
	return uc.aggregateFrontEndProcessor(ctx, p), nil
}

// UpdateRequest implements UseCase.
func (uc *useCase) UpdateRequest(ctx context.Context, id string, request *configuration_center_v1.FrontEndProcessor) error {
	// 获取记录
	p, err := uc.frontEndProcessor.Get(ctx, id)
	if err != nil {
		return err
	}

	p.UpdaterID = middleware.UserFromContextOrEmpty(ctx).ID
	// TODO: Use clock instead
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	p.UpdateTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")

	p.Request.Deployment.DeployArea = request.Request.Deployment.DeployArea
	p.Request.Deployment.RunBusinessSystem = request.Request.Deployment.RunBusinessSystem
	p.Request.Deployment.BusinessSystemLevel = request.Request.Deployment.BusinessSystemLevel
	p.Request.ApplyType = request.Request.ApplyType
	p.Request.IsDraft = request.Request.IsDraft
	p.Request.Comment = request.Request.Comment
	p.Request.Processor = request.Request.Processor
	p.Request.Contact = request.Request.Contact
	p.Request.Department = request.Request.Department
	// 更新数据库记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Pending
		return err
	}
	//更新front_end_item表数据
	var frontEnds []*configuration_center_v1.FrontEnd
	for _, processor := range request.Request.Processor {
		frontEnd := &configuration_center_v1.FrontEnd{
			ID:               processor.ID,
			FrontEndID:       processor.FrontEndID,
			OperatorSystem:   processor.OS,
			ComputerResource: processor.Spec,
			DiskSpace:        processor.BusinessDiskSpace,
			LibraryNumber:    processor.LibraryCount,
			LibraryList:      processor.LibraryList,
		}
		frontEnds = append(frontEnds, frontEnd)
	}
	if err := uc.frontEndProcessor.UpdateList(ctx, frontEnds, id); err != nil {
		return err
	}

	// 草稿、暂存不需要发起 workflow 审核
	if request.Request.IsDraft {
		return nil
	}

	// 发起 workflow 审核
	if err := uc.auditApply(ctx, p); err != nil {
		return err
	}

	// 更新记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 id 不存在
		return err
	}

	return nil
}

// AllocateNode implements UseCase.
func (uc *useCase) AllocateNode(ctx context.Context, id string, node *configuration_center_v1.FrontEndProcessorNode) error {
	// 获取记录
	p, err := uc.frontEndProcessor.Get(ctx, id)
	if err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}

	// TODO: Use clock instead
	p.AllocationTimestamp = meta_v1.Now().Format("2006-01-02 15:04:05.000")
	p.Node = node
	p.Status.Phase = configuration_center_v1.FrontEndProcessorAllocated

	// 更新数据库记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}
	return nil
}

func (uc *useCase) AllocateNodeNew(ctx context.Context, id string, node *configuration_center_v1.FrontEndProcessorAllocationRequest) error {
	// 获取记录
	p, err := uc.frontEndProcessor.Get(ctx, id)
	if err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}

	// TODO: Use clock instead
	p.AllocationTimestamp = meta_v1.Now().Format("2006-01-02 15:04:05.000")
	p.Status.Phase = configuration_center_v1.FrontEndProcessorAllocated
	p.UpdaterID = middleware.UserFromContextOrEmpty(ctx).ID
	// 更新数据库记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}
	if err := uc.frontEndProcessor.AllocateNodeNew(ctx, node, id); err != nil {
		return err
	}
	return nil
}

// Receipt implements UseCase.
func (uc *useCase) Receipt(ctx context.Context, id string) error {
	// 获取记录
	p, err := uc.frontEndProcessor.Get(ctx, id)
	if err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}

	p.RecipientID = middleware.UserFromContextOrEmpty(ctx).ID
	// TODO: Use clock instead
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	p.ReceiptTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	p.Status.Phase = configuration_center_v1.FrontEndProcessorInCompleted

	// 更新数据库记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}
	//更新前置机项状态
	err = uc.frontEndProcessor.UpdateRequest(ctx, id, "InUse")
	if err != nil {
		return err
	}
	return nil
}

func (uc *useCase) Reject(ctx context.Context, id string, comment string) error {
	// 获取记录
	p, err := uc.frontEndProcessor.Get(ctx, id)
	if err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Rejected
		return err
	}

	p.RecipientID = middleware.UserFromContextOrEmpty(ctx).ID
	// TODO: Use clock instead
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	p.ReceiptTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	p.Status.Phase = configuration_center_v1.FrontEndProcessorRejected
	p.Status.RejectReason = comment
	// 更新数据库记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}
	return nil
}

// Reclaim implements UseCase.
func (uc *useCase) Reclaim(ctx context.Context, id string) error {
	// 获取记录
	p, err := uc.frontEndProcessor.Get(ctx, id)
	if err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}

	// TODO: Use clock instead
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	p.ReclaimTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	p.Status.Phase = configuration_center_v1.FrontEndProcessorInCompleted

	// 更新数据库记录
	if err := uc.frontEndProcessor.Update(ctx, p); err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}
	//更新前置机项状态
	err = uc.frontEndProcessor.UpdateRequest(ctx, id, "Reclaimed")
	if err != nil {
		return err
	}
	return nil
}

// List implements UseCase.
func (uc *useCase) List(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorListOptions) (*configuration_center_v1.AggregatedFrontEndProcessorList, error) {
	// 从数据库获取记录
	list, err := uc.frontEndProcessor.List(ctx, opts)
	if err != nil {
		return nil, err
	}

	// 使用公共函数进行筛选
	filteredEntries, err := FilterByUserDepartment(ctx, uc.u, list.Entries)
	if err != nil {
		return nil, err
	}

	// 构造返回对象
	newList := &configuration_center_v1.FrontEndProcessorList{
		Entries: filteredEntries,
	}

	return uc.aggregateFrontEndProcessorList(ctx, newList), nil

}

// FilterByUserDepartment 根据用户所有部门筛选记录
func FilterByUserDepartment(ctx context.Context, userUseCase domain.UseCase, entries []configuration_center_v1.FrontEndProcessor) ([]configuration_center_v1.FrontEndProcessor, error) {
	// 获取当前用户 ID
	user := ctx.Value(interception.InfoName).(*model.User)
	userID := user.ID
	log.WithContext(ctx).Info("当前用户 ID", zap.String("userID", userID))

	// 获取用户所属部门列表
	req := &domain.GetUserPathParameters{ID: userID}
	res, err := userUseCase.GetUserIdDirectDepart(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Warn("获取用户部门失败", zap.Error(err), zap.String("userID", userID))
		return nil, err
	}

	// 获取所有部门 ID
	var deptIDs []string
	for _, dept := range res {
		deptIDs = append(deptIDs, dept.ID)
	}
	log.WithContext(ctx).Info("获取用户所属所有部门 ID", zap.Strings("deptIDs", deptIDs))

	// 获取每个部门下的所有用户 ID
	var allUserIDs []string
	for _, deptID := range deptIDs {
		req1 := &domain.GetDepartUsersReq{DepartId: deptID}
		res1, err := userUseCase.GetDepartUsers(ctx, req1)
		if err != nil {
			log.WithContext(ctx).Warn("获取部门用户失败", zap.Error(err), zap.String("deptID", deptID))
			continue
		}

		for _, user := range res1 {
			allUserIDs = append(allUserIDs, user.ID)
		}
	}

	// 去重用户 ID
	userIDMap := make(map[string]struct{})
	for _, id := range allUserIDs {
		userIDMap[id] = struct{}{}
	}

	// 筛选符合用户 ID 的记录
	var filteredEntries []configuration_center_v1.FrontEndProcessor
	for _, item := range entries {
		_, exists := userIDMap[item.CreatorID]
		log.WithContext(ctx).Info("筛选记录", zap.String("creatorID", item.CreatorID), zap.Bool("匹配", exists))

		if exists {
			filteredEntries = append(filteredEntries, item)
		}
	}

	return filteredEntries, nil
}

// GetOverView implements UseCase.
func (uc *useCase) GetOverView(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorsOverviewGetOptions) (*configuration_center_v1.FrontEndProcessorsOverview, error) {
	return uc.frontEndProcessor.Overview(ctx, opts)
}

// GetApplyDetails implements UseCase.
func (uc *useCase) GetApplyDetails(ctx context.Context, id string) (*configuration_center_v1.FrontEndProcessorDetail, error) {
	// 从数据库获取记录
	p, err := uc.frontEndProcessor.GetByApplyID(ctx, id)
	if err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return nil, err
	}

	// 查询 frontEnd 表
	a, err := uc.frontEndProcessor.GetFrontEndsByFrontEndProcessorID(ctx, p.ID)
	if err != nil {
		return nil, err
	}

	// 为每个 frontEnd 查询对应的 frontLibrary，同时传入 processorID 和 frontEndID
	var allLibraries []*configuration_center_v1.FrontEndLibrary
	for _, fe := range a {
		libs, err := uc.frontEndProcessor.GetFrontEndLibrariesByFrontEndID(ctx, p.ID, fe.ID)
		if err != nil {
			return nil, err
		}
		allLibraries = append(allLibraries, libs...)
	}

	// 调用聚合函数，传入完整的数据
	return uc.aggregateFrontEndProcessorDetail(ctx, p, a, allLibraries)
}

// GetApplyList implements UseCase.
func (uc *useCase) GetApplyList(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorItemListOptions) (*configuration_center_v1.FrontEndProcessorItemList, error) {
	// Step 1: 调用 Repository 层获取基础数据
	list, err := uc.frontEndProcessor.GetApplyList(ctx, opts)
	if err != nil {
		return &configuration_center_v1.FrontEndProcessorItemList{
			Items: []*configuration_center_v1.FrontEndProcessorItem{},
			Total: 0,
		}, nil
	}

	itemList, err := FilterByUserDepartmentForItemList(ctx, uc.u, list.Items)
	if err != nil {
		return nil, err
	}

	// Step 2: 初始化聚合结构体切片
	aggregatedItems := make([]*configuration_center_v1.FrontEndProcessorItem, 0)

	// 如果 list.Items 为 nil 或者空切片，则直接返回空列表和 Total: 0
	if itemList == nil || itemList.Items == nil || len(itemList.Items) == 0 {
		return &configuration_center_v1.FrontEndProcessorItemList{
			Items: aggregatedItems,
			Total: 0,
		}, nil
	}

	// Step 3: 遍历原始数据，填充聚合结构体
	for _, item := range list.Items {
		// Step 5: 根据 department_id 查询部门信息
		department, err := uc.businessStructure.GetObjByID(ctx, item.DepartmentID)
		if err != nil {
			department = new(model.Object) // 默认空对象
		}

		// Step 6: 构造新的聚合对象，并设置部门名称
		aggregatedItems = append(aggregatedItems, &configuration_center_v1.FrontEndProcessorItem{
			ID:                  item.ID,
			FrontEndID:          item.FrontEndID,
			IP:                  item.IP,
			Name:                item.Name,
			DepartmentID:        item.DepartmentID,
			DepartmentName:      department.Name,
			Status:              item.Status,
			AdministratorPhone:  item.AdministratorPhone,
			AdministratorName:   item.AdministratorName,
			LibraryCount:        item.LibraryCount,
			LibraryType:         item.LibraryType,
			Address:             item.Address,
			OS:                  item.OS,
			Spec:                item.Spec,
			BusinessDiskSpace:   item.BusinessDiskSpace,
			Port:                item.Port,
			AllocationTimestamp: item.AllocationTimestamp,
			ReceiptTimestamp:    item.ReceiptTimestamp,
			ReclaimTimestamp:    item.ReclaimTimestamp,
			BusinessTime:        item.BusinessTime,
		})
	}

	// Step 7: 返回聚合后的结果
	return &configuration_center_v1.FrontEndProcessorItemList{
		Items: aggregatedItems,
		Total: list.Total,
	}, nil
}

// FilterByUserDepartmentForItemList 根据用户部门筛选 FrontEndProcessorItem 列表
func FilterByUserDepartmentForItemList(ctx context.Context, userUseCase domain.UseCase, entries []*configuration_center_v1.FrontEndProcessorItem) (*configuration_center_v1.FrontEndProcessorItemList, error) {
	// 获取当前用户 ID
	user := ctx.Value(interception.InfoName).(*model.User)
	userID := user.ID
	log.WithContext(ctx).Info("当前用户 ID", zap.String("userID", userID))

	// 获取用户所属部门列表
	req := &domain.GetUserPathParameters{ID: userID}
	res, err := userUseCase.GetUserIdDirectDepart(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Warn("获取用户部门失败", zap.Error(err), zap.String("userID", userID))
		return nil, err
	}

	// 获取所有部门 ID
	var deptIDs []string
	for _, dept := range res {
		deptIDs = append(deptIDs, dept.ID)
	}
	log.WithContext(ctx).Info("获取用户所属所有部门 ID", zap.Strings("deptIDs", deptIDs))

	// 获取每个部门下的所有用户 ID
	var allUserIDs []string
	for _, deptID := range deptIDs {
		req1 := &domain.GetDepartUsersReq{DepartId: deptID}
		res1, err := userUseCase.GetDepartUsers(ctx, req1)
		if err != nil {
			log.WithContext(ctx).Warn("获取部门用户失败", zap.Error(err), zap.String("deptID", deptID))
			continue
		}

		for _, user := range res1 {
			allUserIDs = append(allUserIDs, user.ID)
		}
	}

	// 去重用户 ID
	userIDMap := make(map[string]struct{})
	for _, id := range allUserIDs {
		userIDMap[id] = struct{}{}
	}

	// 筛选符合用户 ID 的记录
	var filteredEntries []*configuration_center_v1.FrontEndProcessorItem
	for _, item := range entries {
		_, exists := userIDMap[item.CreatorId]
		log.WithContext(ctx).Info("筛选记录", zap.String("creatorID", item.CreatorId), zap.Bool("匹配", exists))

		if exists {
			filteredEntries = append(filteredEntries, item)
		}
	}

	// 返回结构体
	return &configuration_center_v1.FrontEndProcessorItemList{
		Items: filteredEntries,
		Total: len(filteredEntries),
	}, nil
}

// 撤销审核
func (uc *useCase) CancelAudit(ctx context.Context, id string) error {
	p, err := uc.frontEndProcessor.GetByApplyID(ctx, id)
	if err != nil {
		// TODO: 区分 ID 不存在，Phase 不是 Allocating
		return err
	}
	// 只有审核状态为审核中的可以撤回
	if p.Status.Phase != configuration_center_v1.FrontEndProcessorAuditing {
		return errorcode.Desc(errorcode.AuditProcessNotExist)
	}

	// 更新审核状态
	p.Status.Phase = "Pending"
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	p.UpdateTimestamp = beijingTime.Format("2006-01-02 15:04:05.000")
	err = uc.frontEndProcessor.Update(ctx, p)
	if err != nil {
		return err
	}

	// 构造取消审核消息
	msg := &wf_common.AuditCancelMsg{
		ApplyIDs: []string{id},
		Cause: struct {
			ZHCN string "json:\"zh-cn\""
			ZHTW string "json:\"zh-tw\""
			ENUS string "json:\"en-us\""
		}{
			ZHCN: "revocation",
			ZHTW: "revocation",
			ENUS: "revocation",
		},
	}

	// 发送取消审核消息
	if err := uc.workflow.AuditCancel(msg); err != nil {
		return errorcode.Desc(errorcode.UserCreateMessageSendError)
	}
	time.Sleep(2 * time.Second) // 休眠 2 秒
	return nil
}

func (uc *useCase) GetAuditList(ctx context.Context, req *configuration_center_v1.AuditListGetReq) (*configuration_center_v1.AuditListResp, error) {
	var (
		err    error
		audits *wf.AuditResponse
	)
	audits, err = uc.wf.GetList(ctx, wf.WorkflowListType(req.Target), []string{constant.FrontEndProcessorRequest}, req.Offset, req.Limit)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	resp := &configuration_center_v1.AuditListResp{}
	resp.Entries = make([]*configuration_center_v1.AuditListItem, 0, len(audits.Entries))
	for i := range audits.Entries {
		respa := configuration_center_v1.FrontEndData{}
		a := audits.Entries[i].ApplyDetail.Data
		if err = json.Unmarshal([]byte(a), &respa); err != nil {
			return nil, err
		}
		// 只有当 keyword 不为空时才进行过滤查询
		if req.Keyword != "" {
			// 如果 id 或 orderId 不包含 keyword，则跳过该项
			if !strings.Contains(respa.Id, req.Keyword) && !strings.Contains(respa.OrderId, req.Keyword) {
				continue
			}
		}
		processor, err := uc.frontEndProcessor.GetByID(ctx, respa.Id)
		if err != nil {
			log.WithContext(ctx).Errorf("uc.frontEndProcessor.GetByApplyID failed: %v", err)
		}

		var taskID string
		if processor != nil {
			var apply *v1.Apply
			var err error
			apply, err = uc.biz.Get(ctx, processor.Status.ApplyID)
			if err != nil {
				log.WithContext(ctx).Errorf("uc.biz.Get failed: %v", err)
			}
			if apply != nil {
				taskID = apply.TaskID
			}
		} else {
			taskID = ""
		}

		resp.Entries = append(resp.Entries,
			&configuration_center_v1.AuditListItem{
				ApplyTime:  audits.Entries[i].ApplyTime,
				Applyer:    audits.Entries[i].ApplyUserName,
				ProcInstID: audits.Entries[i].ID,
				TaskID:     taskID,
				OrderId:    respa.OrderId,
				ID:         respa.Id,
				ApplyType:  respa.AppleType,
				//AuditStatus: audits.Entries[i].AuditStatus,
				//AuditTime:   audits.Entries[i].EndTime,
			},
		)
	}
	// 如果 keyword 不为空，则 total 值只统计符合过滤条件的数据
	if req.Keyword != "" {
		resp.TotalCount = int64(len(resp.Entries))
	} else {
		resp.TotalCount = int64(audits.TotalCount)
	}
	return resp, nil
}
