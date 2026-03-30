package impl

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/catalog_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback_op_log"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"gopkg.in/fatih/set.v0"
	"gorm.io/gorm"
)

type useCase struct {
	cRepo    data_catalog.RepoOp
	fRepo    catalog_feedback.Repo
	fLogRepo catalog_feedback_op_log.Repo
	data     *db.Data
	cc       configuration_center.Driven
}

func NewUseCase(
	cRepo data_catalog.RepoOp,
	fRepo catalog_feedback.Repo,
	fLogRepo catalog_feedback_op_log.Repo,
	data *db.Data,
	cc configuration_center.Driven) domain.UseCase {
	return &useCase{
		cRepo:    cRepo,
		fRepo:    fRepo,
		fLogRepo: fLogRepo,
		data:     data,
		cc:       cc,
	}
}

func (uc *useCase) Create(ctx context.Context, req *domain.CreateReq) (resp *domain.IDResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	uInfo := request.GetUserInfo(ctx)
	var catalog *model.TDataCatalog
	if catalog, err = uc.cRepo.Get(nil, ctx, req.CatalogID.Uint64()); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.CatalogNotFound)
		}

		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if !(catalog.OnlineStatus == string(common.DROS_ONLINE) ||
		catalog.OnlineStatus == string(common.DROS_DOWN_AUDITING) ||
		catalog.OnlineStatus == string(common.DROS_DOWN_REJECT)) {
		log.WithContext(ctx).Errorf("catalog: %s feedback create not allowed", req.CatalogID)
		return nil, errorcode.Detail(errorcode.CatalogFeedbackCreateNotAllowedErr, "目录不是上线状态")
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
	cf := &model.TCatalogFeedback{
		CatalogID:    req.CatalogID.Uint64(),
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
		cfs []*model.TCatalogFeedback
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
		cfs   []*catalog_feedback.CatalogFeedbackDetail
		depts []*configuration_center.DepartmentObject
		idxs  []int
		//roleIDs []string
	)
	uInfo := request.GetUserInfo(ctx)
	params := domain.ListReqParam2Map(req)
	uid := ""
	if req.View == "applier" {
		uid = uInfo.ID
	} else {
		//if roleIDs, err = uc.cc.GetRoleIDs(ctx, uInfo.ID); err != nil {
		//	return nil, err
		//}
		//roles := set.New(set.NonThreadSafe)
		//roles.Add(lo.ToAnySlice[string](roleIDs)...)
		//if !roles.Has(common.USER_ROLE_OPERATOR) {
		//	log.WithContext(ctx).
		//		Errorf("user (id: %s name: %s) has no authorization to operator view catalog feedback list",
		//			uInfo.ID, uInfo.Name)
		//	return nil, errorcode.Detail(errorcode.PublicNoAuthorization, "无查看运营视角目录反馈列表权限")
		//}
	}
	resp = &domain.ListResp{}
	if resp.TotalCount, cfs, err = uc.fRepo.GetList(nil, ctx, uid, 0, params); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	s := set.New(set.NonThreadSafe)
	orgCode2idxMap := make(map[string][]int)
	resp.Entries = make([]*domain.ListItem, 0, len(cfs))
	for i := range cfs {
		resp.Entries = append(resp.Entries,
			&domain.ListItem{
				DetailBasicInfo: domain.DetailBasicInfo{
					ID:           cfs[i].ID,
					CatalogID:    cfs[i].CatalogID,
					CatalogCode:  cfs[i].CatalogCode,
					CatalogTitle: cfs[i].CatalogTitle,
					Status:       domain.Status2Str(cfs[i].Status),
					OrgCode:      cfs[i].OrgCode,
					FeedbackType: cfs[i].FeedbackType,
					FeedbackDesc: cfs[i].FeedbackDesc,
					CreatedAt:    cfs[i].CreatedAt.UnixMilli(),
					CreatedBy:    cfs[i].CreatedBy,
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
		if depts, err = uc.cc.GetDepartments(ctx, set.StringSlice(s)); err != nil {
			return nil, err
		}
		for i := range depts {
			idxs = orgCode2idxMap[depts[i].ID]
			for j := range idxs {
				resp.Entries[idxs[j]].OrgName = depts[i].Name
				resp.Entries[idxs[j]].OrgPath = depts[i].Path
			}
		}
	}
	return resp, nil
}

func (uc *useCase) GetDetail(ctx context.Context, feedbackID uint64) (resp *domain.DetailResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	var (
		cfs   []*catalog_feedback.CatalogFeedbackDetail
		logs  []*model.TCatalogFeedbackOpLog
		depts []*configuration_center.DepartmentObject
		users []*common.UserInfo
		idxs  []int
	)
	if _, cfs, err = uc.fRepo.GetList(nil, ctx, "", feedbackID, nil); err != nil {
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
			ID:           cfs[0].ID,
			CatalogID:    cfs[0].CatalogID,
			CatalogCode:  cfs[0].CatalogCode,
			CatalogTitle: cfs[0].CatalogTitle,
			Status:       domain.Status2Str(cfs[0].Status),
			OrgCode:      cfs[0].OrgCode,
			FeedbackType: cfs[0].FeedbackType,
			FeedbackDesc: cfs[0].FeedbackDesc,
			CreatedAt:    cfs[0].CreatedAt.UnixMilli(),
			CreatedBy:    cfs[0].CreatedBy,
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
			return nil, err
		}
		if len(depts) > 0 {
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

func (uc *useCase) GetCount(ctx context.Context) (resp *domain.CountResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	var countInfo *catalog_feedback.CountInfo
	if countInfo, err = uc.fRepo.GetCount(nil, ctx); err != nil {
		log.WithContext(ctx).Errorf("uc.fRepo.GetCount failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	resp = &domain.CountResp{
		CountInfo: countInfo,
	}
	return resp, nil
}
