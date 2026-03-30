package impl

import (
	"context"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/res_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback_op_log"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/res_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"gopkg.in/fatih/set.v0"
)

type useCase struct {
	cRepo             data_catalog.RepoOp
	fRepo             res_feedback.Repo
	fLogRepo          catalog_feedback_op_log.Repo
	basicSearchDriven basic_search.Repo
	data              *db.Data
	cc                configuration_center.Driven
}

func NewUseCase(
	cRepo data_catalog.RepoOp,
	fRepo res_feedback.Repo,
	fLogRepo catalog_feedback_op_log.Repo,
	basicSearchDriven basic_search.Repo,
	data *db.Data,
	cc configuration_center.Driven) domain.UseCase {
	return &useCase{
		cRepo:             cRepo,
		fRepo:             fRepo,
		fLogRepo:          fLogRepo,
		basicSearchDriven: basicSearchDriven,
		data:              data,
		cc:                cc,
	}
}

func (uc *useCase) Create(ctx context.Context, req *domain.CreateReq) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	uInfo := request.GetUserInfo(ctx)
	/*var catalog *model.TDataCatalog
	if catalog, err = uc.cRepo.Get(nil, ctx, req.ResID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.CatalogNotFound)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if !(catalog.OnlineStatus == string(common.DROS_ONLINE) ||
		catalog.OnlineStatus == string(common.DROS_DOWN_AUDITING) ||
		catalog.OnlineStatus == string(common.DROS_DOWN_REJECT)) {
		log.WithContext(ctx).Errorf("catalog: %s feedback create not allowed", req.ResID)
		return nil, errorcode.Detail(errorcode.CatalogFeedbackCreateNotAllowedErr, "资源不是上线状态")
	}*/

	tx := uc.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)
	timeNow := time.Now()
	cf := &model.TResFeedback{
		ResID:        req.ResID,
		ResType:      int(domain.ResType2Enum(req.ResType)),
		FeedbackType: req.FeedbackType,
		FeedbackDesc: req.FeedbackDesc,
		Status:       domain.CFB_STATUS_PENDING,
		CreatedAt:    timeNow,
		CreatedBy:    uInfo.ID,
		UpdatedAt:    timeNow,
	}
	if err = uc.fRepo.Create(tx, ctx, cf); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.Create catalog feedback failed: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	l := &model.TCatalogFeedbackOpLog{
		FeedbackID: cf.ID,
		UID:        uInfo.ID,
		OpType:     domain.CFB_OP_TYPE_SUBMIT,
		ExtendInfo: "{}",
		CreatedAt:  timeNow,
	}
	if err = uc.fLogRepo.Create(tx, ctx, l); err != nil {
		log.WithContext(ctx).Errorf("create catalog feedback submit/create log failed: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	resp = &domain.IDResp{ID: models.NewModelID(cf.ID)}
	return resp, err
}

func (uc *useCase) Reply(ctx context.Context, feedbackID uint64, req *domain.ReplyReq) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	var (
		cfs []*model.TResFeedback
		//roleIDs []string
		bRet bool
	)
	uInfo := request.GetUserInfo(ctx)
	//if roleIDs, err = uc.cc.GetRoleIDs(ctx, uInfo.ID); err != nil {
	//	return nil, err
	//}
	//roles := set.New(set.NonThreadSafe)
	//roles.Add(lo.ToAnySlice[string](roleIDs)...)
	//if !roles.Has(common.USER_ROLE_OPERATOR) {
	//	log.WithContext(ctx).
	//		Errorf("user (id: %s name: %s) has no authorization to reply catalog feedback",
	//			uInfo.ID, uInfo.Name)
	//	return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无目录反馈回复权限")
	//}

	if cfs, err = uc.fRepo.GetByID(nil, ctx, []uint64{feedbackID}); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetByID failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(cfs) == 0 {
		log.WithContext(ctx).Errorf("catalog feedback: %d not existed", feedbackID)
		return nil, errorcode.Desc(errorcode.CatalogFeedbackNotExistedErr)
	}

	if cfs[0].Status == domain.CFB_STATUS_REPLIED {
		log.WithContext(ctx).Errorf("catalog feedback: %d reply not allowed", feedbackID)
		return nil, errorcode.Detail(errorcode.CatalogFeedbackOpNotAllowedErr, "目录反馈已回复")
	}

	tx := uc.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)
	timeNow := time.Now()
	cfs[0].Status = domain.CFB_STATUS_REPLIED
	cfs[0].UpdatedAt = timeNow
	cfs[0].RepliedAt = &timeNow
	if bRet, err = uc.fRepo.Update(tx, ctx, cfs[0], []int{domain.CFB_STATUS_PENDING}); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.Update catalog feedback: %d replied failed: %v", feedbackID, err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	if !bRet {
		log.WithContext(ctx).Errorf("catalog feedback: %d reply op not allowed", feedbackID)
		panic(errorcode.Detail(errorcode.CatalogFeedbackOpNotAllowedErr, "目录反馈已回复"))
	}
	l := &model.TCatalogFeedbackOpLog{
		FeedbackID: feedbackID,
		UID:        uInfo.ID,
		OpType:     domain.CFB_OP_TYPE_REPLY,
		ExtendInfo: fmt.Sprintf("{\"reply_content\":\"%s\"}", req.ReplyContent),
		CreatedAt:  timeNow,
	}
	if err = uc.fLogRepo.Create(tx, ctx, l); err != nil {
		log.WithContext(ctx).Errorf("create catalog feedback reply log failed: %v", feedbackID, err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	resp = &domain.IDResp{ID: models.NewModelID(feedbackID)}
	return resp, err
}

func (uc *useCase) GetList(ctx context.Context, req *domain.ListReq) (resp *domain.ListResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	var (
		cfs   []*res_feedback.CatalogFeedbackDetail
		depts []*configuration_center.DepartmentObject
		idxs  []int
		//roleIDs []string
	)
	uInfo := request.GetUserInfo(ctx)
	params := domain.ListReqParam2Map(req)

	uid := uInfo.ID

	resp = &domain.ListResp{}
	if resp.TotalCount, cfs, err = uc.fRepo.GetList(nil, ctx, uid, 0, params, req.ResType); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	// 调试：打印查询结果
	log.WithContext(ctx).Infof("查询结果: 总数=%d, 记录数=%d", resp.TotalCount, len(cfs))
	if len(cfs) > 0 {
		log.WithContext(ctx).Infof("第一条记录: ID=%d, ResID=%s, OrgCode=%s", cfs[0].ID, cfs[0].ResID, cfs[0].OrgCode)
	}

	s := set.New(set.NonThreadSafe)
	orgCode2idxMap := make(map[string][]int)
	resp.Entries = make([]*domain.ListItem, 0, len(cfs))
	for i := range cfs {
		resp.Entries = append(resp.Entries,
			&domain.ListItem{
				DetailBasicInfo: domain.DetailBasicInfo{
					ID:            cfs[i].ID,
					CatalogID:     cfs[i].ResID,
					CatalogCode:   cfs[i].CatalogCode,
					CatalogTitle:  cfs[i].CatalogTitle,
					Status:        domain.Status2Str(cfs[i].Status),
					OrgCode:       cfs[i].OrgCode,
					FeedbackType:  cfs[i].FeedbackType,
					FeedbackDesc:  cfs[i].FeedbackDesc,
					CreatedAt:     cfs[i].CreatedAt.UnixMilli(),
					CreatedBy:     cfs[i].CreatedBy,
					IndicatorType: cfs[i].IndicatorType,
					ResType:       domain.ResType2Str(cfs[i].ResType),
				},
			},
		)
		if cfs[i].RepliedAt != nil {
			repliedAt := cfs[i].RepliedAt.UnixMilli()
			resp.Entries[i].RepliedAt = &repliedAt
		}
		if len(resp.Entries[i].OrgCode) > 0 {
			if s.Has(resp.Entries[i].OrgCode) {
				idxs = orgCode2idxMap[resp.Entries[i].OrgCode]
			} else {
				idxs = make([]int, 0)
			}
			idxs = append(idxs, i)
			orgCode2idxMap[resp.Entries[i].OrgCode] = idxs
			s.Add(resp.Entries[i].OrgCode)
		}
	}

	if s.Size() > 0 {
		log.WithContext(ctx).Infof("需要查询部门信息: 部门代码数量=%d", s.Size())
		if depts, err = uc.cc.GetDepartments(ctx, set.StringSlice(s)); err != nil {
			log.WithContext(ctx).Warnf("获取部门信息失败: %v，继续执行", err)
			// 不抛异常，继续执行，部门信息保持为空
		} else {
			log.WithContext(ctx).Infof("获取到部门信息: 部门数量=%d", len(depts))
			for i := range depts {
				log.WithContext(ctx).Infof("部门信息: ID=%s, Name=%s, Path=%s", depts[i].ID, depts[i].Name, depts[i].Path)
				// 使用部门ID作为key来查找对应的索引
				idxs = orgCode2idxMap[depts[i].ID]
				log.WithContext(ctx).Infof("部门ID=%s对应的索引数量=%d", depts[i].ID, len(idxs))
				for j := range idxs {
					resp.Entries[idxs[j]].OrgName = depts[i].Name
					resp.Entries[idxs[j]].OrgPath = depts[i].Path
					log.WithContext(ctx).Infof("设置索引[%d]的OrgName=%s, OrgPath=%s", idxs[j], depts[i].Name, depts[i].Path)
				}
			}
		}
	} else {
		log.WithContext(ctx).Infof("没有需要查询的部门信息")
	}

	// 获取上线状态信息
	if len(resp.Entries) > 0 {
		if err = uc.updateOnlineStatus(ctx, resp.Entries, req.ResType); err != nil {
			log.WithContext(ctx).Warnf("获取上线状态信息失败: %v，继续执行", err)
			// 不抛异常，继续执行，上线状态保持为空
		}
	}

	return resp, nil
}

func (uc *useCase) GetDetail(ctx context.Context, feedbackID uint64, resType string) (resp *domain.DetailResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	var (
		cfs   []*res_feedback.CatalogFeedbackDetail
		logs  []*model.TCatalogFeedbackOpLog
		depts []*configuration_center.DepartmentObject
		users []*common.UserInfo
		idxs  []int
	)
	if _, cfs, err = uc.fRepo.GetList(nil, ctx, "", feedbackID, nil, resType); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(cfs) == 0 {
		log.WithContext(ctx).Errorf("catalog feedback: %d not existed")
		return nil, errorcode.Desc(errorcode.CatalogFeedbackNotExistedErr)
	}
	if logs, err = uc.fLogRepo.GetListByFeedbackID(nil, ctx, feedbackID); err != nil {
		log.WithContext(ctx).Errorf("uc.fLogRepo.GetListByFeedbackID failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(logs) == 0 {
		log.WithContext(ctx).Errorf("catalog feedback: %d process log not existed")
		return nil, errorcode.Desc(errorcode.CatalogFeedbackLogNotExistedErr)
	}
	resp = &domain.DetailResp{
		BasicInfo: &domain.DetailBasicInfo{
			ID:            cfs[0].ID,
			CatalogID:     cfs[0].ResID,
			CatalogCode:   cfs[0].CatalogCode,
			CatalogTitle:  cfs[0].CatalogTitle,
			Status:        domain.Status2Str(cfs[0].Status),
			OrgCode:       cfs[0].OrgCode,
			FeedbackType:  cfs[0].FeedbackType,
			FeedbackDesc:  cfs[0].FeedbackDesc,
			CreatedAt:     cfs[0].CreatedAt.UnixMilli(),
			CreatedBy:     cfs[0].CreatedBy,
			IndicatorType: cfs[0].IndicatorType,
			ResType:       domain.ResType2Str(cfs[0].ResType),
		},
		ProcessLog: make([]*domain.LogEntry, 0, len(logs)),
	}
	s := set.New(set.NonThreadSafe)
	uid2idxMap := make(map[string][]int)
	for i := range logs {
		if s.Has(logs[i].UID) {
			idxs = uid2idxMap[logs[i].UID]
		} else {
			idxs = make([]int, 0)
		}
		idxs = append(idxs, i)
		uid2idxMap[logs[i].UID] = idxs
		s.Add(logs[i].UID)
		resp.ProcessLog = append(resp.ProcessLog,
			&domain.LogEntry{
				OpType:     domain.OpType2Str(logs[i].OpType),
				OpUserID:   logs[i].UID,
				ExtendInfo: logs[i].ExtendInfo,
				CreatedAt:  logs[i].CreatedAt.UnixMilli(),
			},
		)
	}
	if len(resp.BasicInfo.OrgCode) > 0 {
		if depts, err = uc.cc.GetDepartments(ctx, []string{resp.BasicInfo.OrgCode}); err != nil {
			log.WithContext(ctx).Warnf("获取部门信息失败: %v，继续执行", err)
			// 不抛异常，继续执行，部门信息保持为空
		} else if len(depts) > 0 {
			resp.BasicInfo.OrgName = depts[0].Name
			resp.BasicInfo.OrgPath = depts[0].Path
		}
	}
	if s.Size() > 0 {
		if users, err = common.GetUserInfoByUserIDs(ctx, uc.cc, false, set.StringSlice(s)); err != nil {
			return nil, err
		}
		for i := range users {
			idxs = uid2idxMap[users[i].ID]
			for j := range idxs {
				resp.ProcessLog[idxs[j]].OpUserName = users[i].Name
			}
		}
	}
	return resp, nil
}

func (uc *useCase) GetCount(ctx context.Context, uid string) (resp *domain.CountResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	// 如果没有传入uid，则从context中获取当前登录用户信息
	if uid == "" {
		uInfo := request.GetUserInfo(ctx)
		uid = uInfo.ID
	}

	var countInfo *res_feedback.CountInfo
	if countInfo, err = uc.fRepo.GetCount(nil, ctx, uid); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetCount failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &domain.CountResp{
		CountInfo: countInfo,
	}
	return resp, nil
}

// updateOnlineStatus 更新上线状态信息
func (uc *useCase) updateOnlineStatus(ctx context.Context, entries []*domain.ListItem, resType string) error {
	if len(entries) == 0 {
		return nil
	}

	// 检查 basicSearchDriven 是否为空
	if uc.basicSearchDriven == nil {
		log.WithContext(ctx).Warnf("basicSearchDriven is nil, 跳过上线状态更新")
		return nil
	}

	// 如果resType为空，需要根据数据库中的res_type字段分组处理
	if resType == "" {
		return uc.updateOnlineStatusByResType(ctx, entries)
	}

	// 收集所有资源ID（去重）
	resIDSet := make(map[string]bool)
	resIDs := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !resIDSet[entry.CatalogID] {
			resIDSet[entry.CatalogID] = true
			resIDs = append(resIDs, entry.CatalogID)
		}
	}

	log.WithContext(ctx).Infof("收集到的资源ID（去重后）: %v", resIDs)

	// 根据资源类型调用不同的搜索接口
	switch resType {
	case domain.S_RES_TYPE_DATA_VIEW:
		return uc.updateDataViewOnlineStatus(ctx, entries, resIDs)
	case domain.S_RES_TYPE_INTERFACE_SVC:
		return uc.updateInterfaceSvcOnlineStatus(ctx, entries, resIDs)
	case domain.S_RES_TYPE_INDICATOR:
		return uc.updateIndicatorOnlineStatus(ctx, entries, resIDs)
	default:
		log.WithContext(ctx).Infof("未知的资源类型: %s，跳过上线状态更新", resType)
		return nil
	}
}

// updateOnlineStatusByResType 根据数据库中的res_type字段分组更新上线状态
func (uc *useCase) updateOnlineStatusByResType(ctx context.Context, entries []*domain.ListItem) error {
	// 按资源类型分组
	dataViewEntries := make([]*domain.ListItem, 0)
	interfaceSvcEntries := make([]*domain.ListItem, 0)
	indicatorEntries := make([]*domain.ListItem, 0)
	unknownEntries := make([]*domain.ListItem, 0)

	for _, entry := range entries {
		// 根据数据库中的res_type字段分组
		switch entry.ResType {
		case domain.S_RES_TYPE_DATA_VIEW:
			dataViewEntries = append(dataViewEntries, entry)
		case domain.S_RES_TYPE_INTERFACE_SVC:
			interfaceSvcEntries = append(interfaceSvcEntries, entry)
		case domain.S_RES_TYPE_INDICATOR:
			indicatorEntries = append(indicatorEntries, entry)
		default:
			unknownEntries = append(unknownEntries, entry)
			log.WithContext(ctx).Warnf("未知的资源类型: %s，资源ID: %s", entry.ResType, entry.CatalogID)
		}
	}

	log.WithContext(ctx).Infof("按资源类型分组结果: data-view=%d, interface-svc=%d, indicator=%d, unknown=%d",
		len(dataViewEntries), len(interfaceSvcEntries), len(indicatorEntries), len(unknownEntries))

	// 分别处理每种资源类型
	var err error

	// 处理data-view类型
	if len(dataViewEntries) > 0 {
		resIDs := uc.extractResIDs(dataViewEntries)
		if updateErr := uc.updateDataViewOnlineStatus(ctx, dataViewEntries, resIDs); updateErr != nil {
			log.WithContext(ctx).Warnf("更新data-view上线状态失败: %v", updateErr)
			err = updateErr
		}
	}

	// 处理interface-svc类型
	if len(interfaceSvcEntries) > 0 {
		resIDs := uc.extractResIDs(interfaceSvcEntries)
		if updateErr := uc.updateInterfaceSvcOnlineStatus(ctx, interfaceSvcEntries, resIDs); updateErr != nil {
			log.WithContext(ctx).Warnf("更新interface-svc上线状态失败: %v", updateErr)
			err = updateErr
		}
	}

	// 处理indicator类型
	if len(indicatorEntries) > 0 {
		resIDs := uc.extractResIDs(indicatorEntries)
		if updateErr := uc.updateIndicatorOnlineStatus(ctx, indicatorEntries, resIDs); updateErr != nil {
			log.WithContext(ctx).Warnf("更新indicator上线状态失败: %v", updateErr)
			err = updateErr
		}
	}

	// 处理未知类型
	if len(unknownEntries) > 0 {
		log.WithContext(ctx).Warnf("跳过%d个未知资源类型的上线状态更新", len(unknownEntries))
	}

	return err
}

// extractResIDs 从entries中提取资源ID（去重）
func (uc *useCase) extractResIDs(entries []*domain.ListItem) []string {
	resIDSet := make(map[string]bool)
	resIDs := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !resIDSet[entry.CatalogID] {
			resIDSet[entry.CatalogID] = true
			resIDs = append(resIDs, entry.CatalogID)
		}
	}
	return resIDs
}

// updateDataViewOnlineStatus 更新数据视图的上线状态
func (uc *useCase) updateDataViewOnlineStatus(ctx context.Context, entries []*domain.ListItem, resIDs []string) error {
	searchReq := &basic_search.SearchDataResourceRequest{
		Size: len(resIDs),
		IDs:  resIDs,
		Type: []string{constant.DataView},
	}

	log.WithContext(ctx).Infof("--------------------------->updateDataViewOnlineStatus: searchReq: %v", searchReq)
	datas, err := uc.basicSearchDriven.SearchDataResource(ctx, searchReq)
	if err != nil {
		log.WithContext(ctx).Warnf("uc.basicSearchDriven.SearchDataResource failed: %v, 跳过上线状态更新", err)
		return nil // 不返回错误，避免影响主流程
	}

	log.WithContext(ctx).Infof("-------------------------->datas: %v", datas)
	// 直接设置上线状态
	for _, entry := range entries {
		for _, data := range datas.Entries {
			if entry.CatalogID == data.ID {
				entry.InOnline = data.IsOnline
				break
			}
		}
	}

	return nil
}

// updateInterfaceSvcOnlineStatus 更新接口服务的上线状态
func (uc *useCase) updateInterfaceSvcOnlineStatus(ctx context.Context, entries []*domain.ListItem, resIDs []string) error {
	searchReq := &basic_search.SearchDataResourceRequest{
		Size: len(resIDs),
		IDs:  resIDs,
		Type: []string{constant.InterfaceSvc},
	}

	datas, err := uc.basicSearchDriven.SearchDataResource(ctx, searchReq)
	if err != nil {
		log.WithContext(ctx).Warnf("uc.basicSearchDriven.SearchDataResource failed: %v, 跳过上线状态更新", err)
		return nil // 不返回错误，避免影响主流程
	}

	// 直接设置上线状态
	for _, entry := range entries {
		for _, data := range datas.Entries {
			if entry.CatalogID == data.ID {
				entry.InOnline = data.IsOnline
				break
			}
		}
	}

	return nil
}

// updateIndicatorOnlineStatus 更新指标的上线状态
func (uc *useCase) updateIndicatorOnlineStatus(ctx context.Context, entries []*domain.ListItem, resIDs []string) error {
	searchReq := &basic_search.SearchDataResourceRequest{
		Size: len(resIDs),
		IDs:  resIDs,
		Type: []string{constant.Indicator},
	}

	datas, err := uc.basicSearchDriven.SearchDataResource(ctx, searchReq)
	if err != nil {
		log.WithContext(ctx).Warnf("uc.basicSearchDriven.SearchDataResource failed: %v, 跳过上线状态更新", err)
		return nil // 不返回错误，避免影响主流程
	}

	// 直接设置上线状态
	for _, entry := range entries {
		for _, data := range datas.Entries {
			if entry.CatalogID == data.ID {
				entry.InOnline = data.IsOnline
				break
			}
		}
	}

	return nil
}
