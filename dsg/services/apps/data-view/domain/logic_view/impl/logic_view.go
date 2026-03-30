package impl

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/mdl_data_model"
	"github.com/kweaver-ai/idrm-go-common/util/clock"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_rule_config"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/common"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"

	"github.com/go-redis/redis/v8"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"
	redisson "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/redis"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/sailor_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/cache"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"

	"github.com/google/uuid"
	"go.uber.org/zap"

	datasourceRpoo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	formViewRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	fieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	logicViewRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/logic_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	configuration_center_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/configuration_center"
	data_subject "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/metadata"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/scene_analysis"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	formViewDomain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/logic_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	api_audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	data_subject_common "github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type logicViewUseCase struct {
	clock                       clock.PassiveClock
	conf                        *my_config.Bootstrap
	formViewRepo                formViewRepo.FormViewRepo
	formViewUseCase             formViewDomain.FormViewUseCase
	logicViewRepo               logicViewRepo.LogicViewRepo
	fieldRepo                   fieldRepo.FormViewFieldRepo
	userRepo                    user.UserRepo
	datasourceRepo              datasourceRpoo.DatasourceRepo
	configurationCenterDriven   configuration_center.Driven
	configurationCenterDrivenNG configuration_center_local.ConfigurationCenterDrivenNG
	DrivenVirtualizationEngine  virtualization_engine.DrivenVirtualizationEngine
	DrivenMetadata              metadata.DrivenMetadata
	DrivenAuthService           auth_service.DrivenAuthService
	DrivenDataSubject           data_subject.DrivenDataSubject
	DrivenDSceneAnalysis        scene_analysis.SceneAnalysisDriven
	//DrivenDSceneAnalysis        common_scene_analysis.SceneAnalysisDriven
	DrivenSailor sailor_service.GraphSearch
	kafkaPub     kafka_pub.KafkaPub
	workflow     workflow.WorkflowInterface
	esRepo       es.ESRepo
	redis        *cache.Redis
	redissonLock redisson.RedissonInterface
	*common.CommonUseCase
	exploreRuleConfigRepo explore_rule_config.ExploreRuleConfigRepo
	subViewRepo           sub_view.SubViewRepo
	DrivenMdlDataModel    mdl_data_model.DrivenMdlDataModel
}

func NewLogicViewUseCase(
	conf *my_config.Bootstrap,
	formViewRepo formViewRepo.FormViewRepo,
	formViewUseCase formViewDomain.FormViewUseCase,
	logicViewRepo logicViewRepo.LogicViewRepo,
	userRepo user.UserRepo,
	fieldRepo fieldRepo.FormViewFieldRepo,
	datasourceRepo datasourceRpoo.DatasourceRepo,
	configurationCenterDriven configuration_center.Driven,
	configurationCenterDrivenNG configuration_center_local.ConfigurationCenterDrivenNG,
	drivenVirtualizationEngine virtualization_engine.DrivenVirtualizationEngine,
	drivenMetadata metadata.DrivenMetadata,
	drivenAuthService auth_service.DrivenAuthService,
	drivenDataSubject data_subject.DrivenDataSubject,
	drivenDSceneAnalysis scene_analysis.SceneAnalysisDriven,
	//drivenDSceneAnalysis common_scene_analysis.SceneAnalysisDriven,
	drivenSailor sailor_service.GraphSearch,
	kafkaPub kafka_pub.KafkaPub,
	workflow workflow.WorkflowInterface,
	esRepo es.ESRepo,
	redis *cache.Redis,
	redissonLock redisson.RedissonInterface,
	commonUseCase *common.CommonUseCase,
	exploreRuleConfigRepo explore_rule_config.ExploreRuleConfigRepo,
	subViewRepo sub_view.SubViewRepo,
	DrivenMdlDataModel mdl_data_model.DrivenMdlDataModel,
) logic_view.LogicViewUseCase {
	useCase := &logicViewUseCase{
		conf:                        conf,
		formViewRepo:                formViewRepo,
		formViewUseCase:             formViewUseCase,
		logicViewRepo:               logicViewRepo,
		fieldRepo:                   fieldRepo,
		userRepo:                    userRepo,
		datasourceRepo:              datasourceRepo,
		configurationCenterDriven:   configurationCenterDriven,
		configurationCenterDrivenNG: configurationCenterDrivenNG,
		DrivenVirtualizationEngine:  drivenVirtualizationEngine,
		DrivenMetadata:              drivenMetadata,
		DrivenAuthService:           drivenAuthService,
		DrivenDataSubject:           drivenDataSubject,
		DrivenDSceneAnalysis:        drivenDSceneAnalysis,
		//DrivenDSceneAnalysis:        drivenDSceneAnalysis,
		DrivenSailor:          drivenSailor,
		kafkaPub:              kafkaPub,
		workflow:              workflow,
		esRepo:                esRepo,
		redis:                 redis,
		redissonLock:          redissonLock,
		CommonUseCase:         commonUseCase,
		exploreRuleConfigRepo: exploreRuleConfigRepo,
		subViewRepo:           subViewRepo,
		clock:                 clock.RealClock{},
		DrivenMdlDataModel:    DrivenMdlDataModel,
	}
	useCase.workflow.RegistConusmeHandlers(constant.AuditTypePublish,
		useCase.logicViewRepo.ConsumerWorkflowAuditMsg,
		constant.HandlerFunc[wf_common.AuditResultMsg](constant.AuditTypePublish, useCase.logicViewRepo.ConsumerWorkflowAuditResult),
		constant.HandlerFunc[wf_common.AuditProcDefDelMsg](constant.AuditTypePublish, useCase.logicViewRepo.ConsumerWorkflowAuditProcDelete))
	useCase.workflow.RegistConusmeHandlers(constant.AuditTypeOnline,
		useCase.logicViewRepo.ConsumerWorkflowAuditMsg,
		constant.HandlerFunc[wf_common.AuditResultMsg](constant.AuditTypeOnline, useCase.logicViewRepo.ConsumerWorkflowAuditResult),
		constant.HandlerFunc[wf_common.AuditProcDefDelMsg](constant.AuditTypeOnline, useCase.logicViewRepo.ConsumerWorkflowAuditProcDelete))
	useCase.workflow.RegistConusmeHandlers(constant.AuditTypeOffline,
		useCase.logicViewRepo.ConsumerWorkflowAuditMsg,
		constant.HandlerFunc[wf_common.AuditResultMsg](constant.AuditTypeOffline, useCase.logicViewRepo.ConsumerWorkflowAuditResult),
		constant.HandlerFunc[wf_common.AuditProcDefDelMsg](constant.AuditTypeOffline, useCase.logicViewRepo.ConsumerWorkflowAuditProcDelete))

	return useCase
}

func (l *logicViewUseCase) AuthorizableViewList(ctx context.Context, req *logic_view.AuthorizableViewListReq) (res *logic_view.AuthorizableViewListResp, err error) {
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	//isOwner, err := l.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.ManagerDataView, userInfo.ID)
	//if err != nil {
	//	return nil, err
	//}
	//if !isOwner {
	//	return nil, errorcode.Desc(my_errorcode.NotOwnerError)
	//}
	//查询用户可以授权的ID
	viewIDs, err := l.GetUserAuthedViews(ctx)
	if err != nil {
		return nil, err
	}

	var lineStatus []string
	usingType, err := l.configurationCenterDriven.GetUsingType(ctx)
	if err != nil {
		return nil, err
	}
	if usingType == 2 { //数据资源模式 仅显示已上线的资源
		lineStatus = []string{constant.LineStatusOnLine, constant.LineStatusDownAuditing, constant.LineStatusDownReject}
	}

	list, err := l.formViewUseCase.PageList(ctx, &form_view.PageListFormViewReq{
		PageListFormViewReqQueryParam: form_view.PageListFormViewReqQueryParam{
			PageInfo3:            req.PageSortKeyword2.PageInfo3,
			KeywordInfo:          req.PageSortKeyword2.KeywordInfo,
			Direction:            req.PageSortKeyword2.Direction,
			Sort:                 req.PageSortKeyword2.Sort,
			PublishStatus:        constant.FormViewReleased.String,
			SubjectID:            req.SubjectDomainID,
			IncludeSubSubject:    req.IncludeSubSubjectDomain,
			DepartmentID:         req.DepartmentID,
			IncludeSubDepartment: req.IncludeSubDepartment,
			OwnerID:              userInfo.ID,
			OnlineStatusList:     lineStatus,
			QueryAuthed:          true,
			AuthedViewID:         viewIDs,
		},
	})
	if err != nil {
		return nil, err
	}
	if len(list.Entries) == 0 {
		list.Entries = make([]*formViewDomain.FormView, 0)
	}
	res = &logic_view.AuthorizableViewListResp{
		PageResultNew: logic_view.PageResultNew[form_view.FormView]{
			Entries:    list.Entries,
			TotalCount: list.TotalCount,
		},
	}
	return
}

// SubjectDomainList 当前登录用户有权限的主题域列表
//
// 是主题域owner + 不是资源owner = 有权限，获取是owner的L2，记为 L2A
// 不是主题域owner + 是资源owner = 有权限，获取是owner的资源，获取这些资源所属的L2，记为 L2B
// 有权限的主题域树 = 按创建时间排序(去重(L2A + L2B))
func (l *logicViewUseCase) SubjectDomainList(ctx context.Context) (res *logic_view.SubjectDomainListRes, err error) {
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	//获取是owner的L2 L2A
	list, err := l.DrivenDataSubject.GetSubjectList(ctx, "", "subject_domain_group,subject_domain")
	if err != nil {
		return nil, err
	}

	var (
		l2a       []string
		paths     []string
		l2Idx     int
		l1Idx     int
		isExisted bool
	)
	l1ID2IdxMap := map[string]int{}
	l2ID2IdxMap := map[string]int{}
	for i := range list.Entries {
		//先把主题域分组保留
		if list.Entries[i].Type == "subject_domain_group" {
			l1ID2IdxMap[list.Entries[i].Id] = i
		} else { // L2主题域
			l2ID2IdxMap[list.Entries[i].Id] = i
			//判断是不是owner 是owner则保留
			if util.IsContain(list.Entries[i].Owners, userInfo.ID) {
				l2a = append(l2a, list.Entries[i].Id)
			}
		}
	}

	//获取是owner的资源，获取这些资源所属的L2 L2B
	l2b, err := l.logicViewRepo.GetSubjectDomainIdsByUserId(ctx, userInfo.ID)
	if err != nil {
		return nil, err
	}

	// 去重(L2A + L2B)
	l2Ids := append(l2a, l2b...)
	l2Ids = util.SliceUnique(l2Ids)

	// 填充为主题域对象数组
	var l2s []data_subject.DataSubject
	gidMap := map[string]bool{}
	for i := range l2Ids {
		if l2Idx, isExisted = l2ID2IdxMap[l2Ids[i]]; !isExisted {
			continue
		}
		// 判断主题域对应的主题域分组是否已经加入数组
		paths = strings.Split(list.Entries[l2Idx].PathId, "/")
		if !gidMap[paths[0]] {
			if l1Idx, isExisted = l1ID2IdxMap[paths[0]]; !isExisted {
				continue
			}
			l2s = append(l2s, list.Entries[l1Idx])
			gidMap[paths[0]] = true
		}
		// 主题域加入数组
		l2s = append(l2s, list.Entries[l2Idx])
	}

	//按创建时间从旧到新排序
	sort.SliceStable(l2s, func(i, j int) bool {
		return l2s[i].CreatedAt < l2s[j].CreatedAt
	})

	var entries []*logic_view.SubjectDomain
	for _, l2 := range l2s {
		entries = append(entries, &logic_view.SubjectDomain{
			Id:               l2.Id,
			Name:             l2.Name,
			Description:      l2.Description,
			Type:             l2.Type,
			PathId:           l2.PathId,
			PathName:         l2.PathName,
			Owners:           l2.Owners,
			CreatedBy:        l2.CreatedBy,
			CreatedAt:        l2.CreatedAt,
			UpdatedBy:        l2.UpdatedBy,
			UpdatedAt:        l2.UpdatedAt,
			ChildCount:       l2.ChildCount,
			SecondChildCount: l2.SecondChildCount,
		})
	}

	res = &logic_view.SubjectDomainListRes{
		PageResultNew: logic_view.PageResultNew[logic_view.SubjectDomain]{
			Entries:    entries,
			TotalCount: int64(len(entries)),
		},
	}

	return res, nil
}

func (l *logicViewUseCase) CreateLogicView(ctx context.Context, req *logic_view.CreateLogicViewReq) (string, error) {
	logger := audit.FromContextOrDiscard(ctx)
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return "", err
	}
	if err = l.logicViewRepo.CustomLogicEntityViewNameExist(ctx, req.BusinessName, req.TechnicalName); err != nil {
		return "", err
	}
	//校验owner
	ownerIDs := make([]string, len(req.Owners))
	if len(req.Owners) > 0 {
		for i, owner := range req.Owners {
			//exist, err := l.configurationCenterDriven.GetRolesInfo(ctx, access_control.TCDataOwner, owner.OwnerID)
			//exist, err := l.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.ManagerDataView, owner.OwnerID)
			//if err != nil {
			//	return "", err
			//}
			//if !exist {
			//	return "", errorcode.Desc(my_errorcode.OwnersIncorrect)
			//}
			ownerIDs[i] = owner.OwnerID
		}
	}

	if req.SceneAnalysisId != "" {
		if _, err = l.DrivenDSceneAnalysis.GetScene(ctx, req.SceneAnalysisId); err != nil {
			return "", err
		}
	}

	var formViewType int32
	var catalogName string
	switch req.Type {
	case constant.FormViewTypeCustom.String:
		catalogName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
		formViewType = constant.FormViewTypeCustom.Integer.Int32()

	case constant.FormViewTypeLogicEntity.String:
		catalogName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
		formViewType = constant.FormViewTypeLogicEntity.Integer.Int32()
		if req.SubjectId == "" {
			return "", errorcode.Desc(my_errorcode.CreateLogicEntityViewSubjectIdError)
		}
		object, err := l.DrivenDataSubject.GetsObjectById(ctx, req.SubjectId)
		if err != nil {
			return "", err
		}
		//逻辑实体
		if object.Type != string(data_subject_common.StringLogicEntity) {
			return "", errorcode.Desc(my_errorcode.CreateLogicEntityViewSubjectIdError)
		}
		//校验一个逻辑实体下只有一个逻辑视图
		logicViews, err := l.logicViewRepo.GetBySubjectId(ctx, req.SubjectId)
		if err != nil {
			return "", errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
		}
		if len(logicViews) != 0 {
			return "", errorcode.Desc(my_errorcode.LogicEntityOnlyHaveOneViewError)
		}
	default:
		return "", errorcode.Desc(my_errorcode.DatasourceViewCannotCreate)
	}

	// 生成逻辑视图的编码
	codeList, err := l.configurationCenterDrivenNG.Generate(ctx, constant.CodeGenerationRuleUUIDDataView, 1)
	if err != nil {
		log.WithContext(ctx).Error("generate code for data view fail", zap.Error(err), zap.Stringer("rule", constant.CodeGenerationRuleUUIDDataView), zap.Int("count", 1))
		return "", err
	}
	if codeList.TotalCount != 1 && len(codeList.Entries) != 1 {
		return "", errorcode.Desc(my_errorcode.GenerateCodeError)
	}

	logicViewId := uuid.New().String()
	fields := make([]*model.FormViewField, len(req.LogicViewField))
	fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
	standardCodes := []string{}
	codeTableIDs := []string{}
	for i, field := range req.LogicViewField {
		if field.StandardCode != "" {
			standardCodes = append(standardCodes, field.StandardCode)
		}
		if field.CodeTableID != "" {
			codeTableIDs = append(codeTableIDs, field.CodeTableID)
		}
		var classifyType int
		if field.AttributeID != "" {
			classifyType = 2
		}
		fields[i] = &model.FormViewField{
			ID:               field.ID,
			FormViewID:       logicViewId,
			TechnicalName:    field.TechnicalName,
			BusinessName:     field.BusinessName,
			PrimaryKey:       sql.NullBool{Bool: field.PrimaryKey, Valid: true},
			DataType:         field.DataType,
			DataLength:       field.DataLength,
			DataAccuracy:     sql.NullInt32{Int32: field.DataAccuracy, Valid: true},
			OriginalDataType: field.OriginalDataType,
			IsNullable:       field.IsNullable,
			SubjectID:        &field.AttributeID,
			ClassifyType:     &classifyType,
			StandardCode: sql.NullString{
				String: field.StandardCode,
				Valid:  true,
			},
			CodeTableID: sql.NullString{
				String: field.CodeTableID,
				Valid:  true,
			},
			Index: i + 1,
		}

		// 处理分级标签ID
		if field.GradeLabelID != "" {
			gradeID, err := strconv.ParseInt(field.GradeLabelID, 10, 64)
			if err != nil {
				return "", errorcode.Detail(my_errorcode.PublicInvalidParameter, "invalid grade_id format")
			}
			fields[i].GradeID = sql.NullInt64{Int64: gradeID, Valid: true}
		} else {
			fields[i].GradeID = sql.NullInt64{Valid: true}
		}

		// 处理分级标签类型
		if field.GradeType != "" {
			gradeType, err := strconv.ParseInt(field.GradeType, 10, 32)
			if err != nil {
				return "", errorcode.Detail(my_errorcode.PublicInvalidParameter, "invalid grade_type format")
			}
			fields[i].GradeType = sql.NullInt32{Int32: int32(gradeType), Valid: true}
		} else {
			fields[i].GradeType = sql.NullInt32{Valid: true}
		}

		fieldObj := &es.FieldObj{
			FieldNameZH: field.BusinessName,
			FieldNameEN: field.TechnicalName,
		}
		fieldObjs = append(fieldObjs, fieldObj)
	}

	if err = l.VerifyStandard(ctx, codeTableIDs, standardCodes); err != nil {
		return "", err
	}
	if err = l.DrivenVirtualizationEngine.CreateView(ctx, &virtualization_engine.CreateViewReq{
		CatalogName: catalogName,
		Query:       req.SQL,
		ViewName:    req.TechnicalName,
	}); err != nil {
		return "", err
	}

	publishAt := time.Now()
	logicView := &model.FormView{
		ID:                 logicViewId,
		UniformCatalogCode: codeList.Entries[0],
		TechnicalName:      req.TechnicalName,
		BusinessName:       req.BusinessName,
		Type:               formViewType,
		PublishAt:          &publishAt,
		EditStatus:         constant.FormViewLatest.Integer.Int32(),
		OwnerId:            sql.NullString{String: strings.Join(ownerIDs, constant.OwnerIdSep), Valid: true},
		SubjectId: sql.NullString{
			String: req.SubjectId,
			Valid:  true,
		},
		DepartmentId: sql.NullString{
			String: req.DepartmentID,
			Valid:  true,
		},
		SceneAnalysisId: req.SceneAnalysisId,
		Description: sql.NullString{
			String: req.Description,
			Valid:  true,
		},
		CreatedByUID: userInfo.ID,
		UpdatedByUID: userInfo.ID,
	}
	if err = l.formViewRepo.CreateFormAndField(ctx, logicView, fields, req.SQL); err != nil {
		//Rollback
		if errRollback := l.DrivenVirtualizationEngine.DeleteView(ctx, &virtualization_engine.DeleteViewReq{
			CatalogName: catalogName,
			ViewName:    req.TechnicalName,
		}); errRollback != nil {
			log.WithContext(ctx).Error("UpdateLogicViewAndField rollback ModifyView error", zap.Error(errRollback))
		}
		return "", errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}

	//auditType, err := l.configurationCenterDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: constant.AuditTypeOnline})
	//if err != nil {
	//	return "", err
	//}
	//if auditType.ProcDefKey == "" {
	if err = l.esRepo.PubToES(ctx, logicView, fieldObjs); err != nil { //创建自定义、逻辑实体视图
		return "", err
	}
	/*
		cateInfos := make([]*form_view.CateInfo, 0)
		if logicView.SubjectId.String != "" {
			cateInfos = append(cateInfos, &form_view.CateInfo{
				CateId:   constant.SubjectCateId,
				NodeId:   logicView.SubjectId.String,
				NodeName: subjectName,
				NodePath: subjectPath,
			})
		}
		if logicView.DepartmentId.String != "" {
			cateInfos = append(cateInfos, &form_view.CateInfo{
				CateId:   constant.DepartmentCateId,
				NodeId:   logicView.DepartmentId.String,
				NodeName: orgName,
				NodePath: orgPath,
			})
		}

		formViewESIndex := form_view.FormViewESIndex{
			Type: "create",
			Body: form_view.FormViewESIndexBody{
				ID:          logicViewId,
				DocID:       logicViewId,
				Code:        logicView.UniformCatalogCode,
				Name:        logicView.BusinessName,
				Description: logicView.Description.String,
				IsPublish:   true,
				PublishedAt: logicView.PublishAt.UnixMilli(),
				FieldCount:  len(FieldObjs),
				Fields:      FieldObjs,
				CateInfos:   cateInfos,
			},
		}
		if err = l.FormViewCreatePubES(ctx, logicViewId, formViewESIndex); err != nil {
			return "", err
		}
	*/
	//}

	//go func(logger audit.Logger, formViewID, technicalName, businessName, subjectID, departmentID, ownerID string) {
	publishView := &form_view.LogicViewResourceObject{
		FormViewID:    logicView.ID,
		TechnicalName: logicView.TechnicalName,
		BusinessName:  logicView.BusinessName,
		SubjectID:     logicView.SubjectId.String,
		DepartmentID:  logicView.DepartmentId.String,
		OwnerID:       logicView.OwnerId.String,
	}
	if logicView.SubjectId.String != "" {
		subject, err := l.DrivenDataSubject.GetsObjectById(ctx, logicView.SubjectId.String)
		if err != nil {
			log.Error(err.Error())
		} else if subject != nil {
			publishView.SubjectPath = subject.PathName
		}
	}
	if logicView.DepartmentId.String != "" {
		res, err := l.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{logicView.DepartmentId.String})
		if err != nil {
			log.Error(err.Error())
		} else if res != nil && len(res.Departments) > 0 {
			publishView.DepartmentPath = res.Departments[0].Path
		}
	}
	if logicView.OwnerId.String != "" {
		ownerInfos, err := l.userRepo.GetByUserIds(ctx, strings.Split(logicView.OwnerId.String, constant.OwnerIdSep))
		if err != nil {
			log.Error(err.Error())
		}
		ownerName := make([]string, len(ownerInfos))
		for i, m := range ownerInfos {
			ownerName[i] = m.Name
		}
		publishView.OwnerName = strings.Join(ownerName, constant.OwnerNameSep)
	}
	// [发送审计管理日志]
	logger.Info(api_audit_v1.OperationCreateLogicView, publishView)
	// [逻辑实体视图/自定义视图创建即发布]
	logger.Info(api_audit_v1.OperationPublishLogicView,
		&form_view.LogicViewSimpleResourceObject{
			Name:       logicView.BusinessName,
			FormViewID: logicView.ID,
		})
	return logicViewId, nil

}
func (l *logicViewUseCase) FormViewCreatePubES(ctx context.Context, id string, formViewESIndex es.FormViewESIndex) (err error) {
	var formViewESIndexByte []byte
	formViewESIndexByte, err = json.Marshal(formViewESIndex)
	if err != nil {
		log.WithContext(ctx).Error("FormView Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	} else {
		if err = l.kafkaPub.SyncProduce(constant.FormViewPublicTopic, util.StringToBytes(id), formViewESIndexByte); err != nil {
			log.WithContext(ctx).Error("FormView Public To ES Error", zap.Error(err))
		}
	}
	return nil
}

func (l *logicViewUseCase) UpdateLogicView(ctx context.Context, req *logic_view.UpdateLogicViewReq) error {
	if req.Type == constant.FormViewTypeDatasource.String {
		return errorcode.Desc(my_errorcode.DatasourceViewCannotCreate)
	}
	var catalogName string
	switch req.Type {
	case constant.FormViewTypeCustom.String:
		catalogName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.String:
		catalogName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	default:
		return errorcode.Desc(my_errorcode.DatasourceViewCannotUpdate)
	}
	logicView, err := l.formViewRepo.GetById(ctx, req.ID)
	if err != nil {
		return errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}
	//repeat,err = l.logicViewRepo.CustomLogicEntityViewNameExist(ctx, req.ID, req.Name)
	//if  err != nil {
	//	return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	//}
	// for Rollback
	viewSQLs, err := l.logicViewRepo.GetLogicViewSQL(ctx, req.ID)
	if err != nil {
		return err
	}

	if err = l.DrivenVirtualizationEngine.ModifyView(ctx, &virtualization_engine.ModifyViewReq{
		CatalogName: catalogName,
		Query:       req.SQL,
		ViewName:    logicView.TechnicalName,
	}); err != nil {
		return err
	}

	fields := make([]*model.FormViewField, len(req.LogicViewField))
	fieldReqMap := make(map[string]*form_view.StandardInfo)
	clearAttributeInfos := make([]*logicViewRepo.ClearAttributeInfo, len(req.LogicViewField))
	standardCodes := []string{}
	codeTableIDs := []string{}
	fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
	for i, field := range req.LogicViewField {
		if field.StandardCode != "" {
			standardCodes = append(standardCodes, field.StandardCode)
		}
		if field.CodeTableID != "" {
			codeTableIDs = append(codeTableIDs, field.CodeTableID)
		}

		classifyType := field.ClassifyType
		if field.AttributeID != "" && field.ClassifyType == 0 {
			classifyType = 2
		}

		fields[i] = &model.FormViewField{
			ID:               field.ID,
			FormViewID:       req.ID,
			TechnicalName:    field.TechnicalName,
			BusinessName:     field.BusinessName,
			PrimaryKey:       sql.NullBool{Bool: field.PrimaryKey, Valid: true},
			DataType:         field.DataType,
			DataLength:       field.DataLength,
			DataAccuracy:     sql.NullInt32{Int32: field.DataAccuracy, Valid: true},
			OriginalDataType: field.OriginalDataType,
			IsNullable:       field.IsNullable,
			SubjectID:        &field.AttributeID,
			ClassifyType:     &classifyType,
			StandardCode: sql.NullString{
				String: field.StandardCode,
				Valid:  true,
			},
			CodeTableID: sql.NullString{
				String: field.CodeTableID,
				Valid:  true,
			},
			Index: i + 1,
		}

		// 处理分级标签ID
		if field.GradeLabelID != "" {
			gradeID, err := strconv.ParseInt(field.GradeLabelID, 10, 64)
			if err != nil {
				return errorcode.Detail(my_errorcode.PublicInvalidParameter, "invalid grade_id format")
			}
			fields[i].GradeID = sql.NullInt64{Int64: gradeID, Valid: true}
		} else {
			fields[i].GradeID = sql.NullInt64{Valid: true}
		}

		// 处理分级标签类型
		if field.GradeType != "" {
			gradeType, err := strconv.ParseInt(field.GradeType, 10, 32)
			if err != nil {
				return errorcode.Detail(my_errorcode.PublicInvalidParameter, "invalid grade_type format")
			}
			fields[i].GradeType = sql.NullInt32{Int32: int32(gradeType), Valid: true}
		} else {
			fields[i].GradeType = sql.NullInt32{Valid: true}
		}

		if field.ClearGradeLabelID != "" {
			fields[i].GradeType = sql.NullInt32{Valid: true}
			fields[i].GradeID = sql.NullInt64{Valid: true}
		}

		fieldReqMap[field.ID] = &form_view.StandardInfo{StandardCode: field.StandardCode, CodeTableID: field.CodeTableID}
		clearAttributeInfos[i] = &logicViewRepo.ClearAttributeInfo{ID: field.ID, ClearAttributeID: field.ClearAttributeID}

		fieldObj := &es.FieldObj{
			FieldNameZH: field.BusinessName,
			FieldNameEN: field.TechnicalName,
		}
		fieldObjs = append(fieldObjs, fieldObj)
	}
	if err = l.VerifyStandard(ctx, codeTableIDs, standardCodes); err != nil {
		return err
	}
	//校验时间戳id
	if req.BusinessTimestampID != "" {
		if _, err = l.fieldRepo.GetField(ctx, req.BusinessTimestampID); err != nil {
			return err
		}
	}
	clearSyntheticData, err := l.ClearSyntheticData(ctx, req.ID, fieldReqMap)
	if err != nil {
		return err
	}

	if err = l.logicViewRepo.UpdateLogicViewAndField(ctx, logicView, fields, &logicViewRepo.UpdateLogicViewAndFieldReq{SQL: req.SQL, BusinessTimestampID: req.BusinessTimestampID, Infos: clearAttributeInfos}); err != nil {
		//Rollback
		if errRollback := l.DrivenVirtualizationEngine.ModifyView(ctx, &virtualization_engine.ModifyViewReq{
			CatalogName: catalogName,
			Query:       viewSQLs[0].Sql,
			ViewName:    logicView.TechnicalName,
		}); errRollback != nil {
			log.WithContext(ctx).Error("UpdateLogicViewAndField rollback ModifyView error", zap.Error(errRollback))
		}
		return errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}
	//if err = l.formViewUseCase.LogicViewCreatePubES(ctx, logicView, fieldObjs); err != nil {
	if err = l.esRepo.PubToES(ctx, logicView, fieldObjs); err != nil { //更新自定义、逻辑实体视图
		return err
	}

	if clearSyntheticData {
		result, err := l.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, req.ID)).Result()
		if err != nil {
			log.WithContext(ctx).Error("【logicViewUseCase】UpdateLogicView  clear synthetic-data fail ", zap.Error(err))
		}
		log.WithContext(ctx).Infof("【logicViewUseCase】UpdateLogicView  clear synthetic-data result %d", result)
	}
	return nil
}
func (l *logicViewUseCase) GetDraftReq(ctx context.Context, req *logic_view.GetDraftReq) (*logic_view.GetDraftRes, error) {
	return nil, nil
}
func (l *logicViewUseCase) DeleteDraft(ctx context.Context, req *logic_view.DeleteDraftReq) error {
	return nil

}

func (l *logicViewUseCase) CreateAuditProcessInstance(ctx context.Context, req *logic_view.CreateAuditProcessInstanceReq) (err error) {
	// 上报业务审计日志
	logger := audit.FromContextOrDiscard(ctx)
	var name string
	defer func() {
		// 注意，这里利用了语言特性：对于err为nil但返回另一个非nil值的情况，此处逻辑仍能发挥期望的效果
		if err == nil {
			var operation api_audit_v1.Operation
			switch req.AuditType.AuditType {
			case constant.AuditTypePublish:
				operation = api_audit_v1.OperationPublishLogicView
			case constant.AuditTypeOnline:
				operation = api_audit_v1.OperationOnlineLogicView
			case constant.AuditTypeOffline:
				operation = api_audit_v1.OperationOfflineLogicView
			}
			obj := &form_view.LogicViewSimpleResourceObject{
				Name:       name,
				FormViewID: req.ID,
			}
			go logger.Info(operation, obj)
		}
	}()
	// 检查视图信息
	view, err := l.logicViewRepo.Get(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Error("AuditProcessInstanceCreate serviceRepo.ServiceGetFields", zap.Error(err))
		return err
	}
	name = view.BusinessName
	//检查是否有正在审核中的流程
	if view.AuditStatus == constant.AuditStatusAuditing {
		return errorcode.Desc(my_errorcode.AuditingExist)
	}
	//检查是否有绑定的审核流程
	process, err := l.configurationCenterDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: req.AuditType.AuditType})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to check audit process info (type: %s), err: %v", req.AuditType, err)
		return err
	}
	isAuditProcessExist := util.CE(process.ProcDefKey != "", true, false).(bool)

	//生成审核实例
	id, err := utilities.GetUniqueID()
	if err != nil {
		return errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	audit := &model.FormView{
		ApplyID:   id,
		AuditType: req.AuditType.AuditType,
		UpdatedAt: time.Now(),
	}
	t := time.Now()

	//根据是否绑定审核流程 判断是否直接通过
	switch req.AuditType.AuditType {
	case constant.AuditTypePublish:
		switch isAuditProcessExist {
		//发布 没有绑定审核流程 报错 没有可用的审核流程
		case false:
			return errorcode.Desc(my_errorcode.AuditProcessNotExist)
		//发布 有绑定审核流程 发起审核 不能直接通过
		case true:
			audit.AuditStatus = constant.AuditStatusAuditing
			audit.ProcDefKey = process.ProcDefKey
		}
	case constant.AuditTypeOnline:
		switch isAuditProcessExist {
		//上线 没有绑定上线审核流程 直接通过
		case false:
			view.OnlineStatus = constant.LineStatusOnLine
			view.OnlineTime = &t
			if err = l.logicViewRepo.Update(ctx, view); err != nil {
				return errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
			}
			fieldObjs, err := l.GenFieldObj(ctx, view.ID)
			if err != nil {
				return err
			}
			if err = l.esRepo.PubToES(ctx, view, fieldObjs); err != nil { //上线
				return err
			}
			return nil
		//上线 有绑定审核流程 发起审核 不能直接通过
		case true:
			audit.OnlineStatus = constant.LineStatusUpAuditing
			audit.AuditStatus = constant.AuditStatusAuditing
			audit.ProcDefKey = process.ProcDefKey
		}
	case constant.AuditTypeOffline:
		switch isAuditProcessExist {
		//下线 没有绑定下线审核流程 直接通过
		case false:
			view.OnlineStatus = constant.LineStatusOffLine
			view.OnlineTime = &t
			if err = l.logicViewRepo.Update(ctx, view); err != nil {
				return errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
			}
			fieldObjs, err := l.GenFieldObj(ctx, view.ID)
			if err != nil {
				return err
			}
			if err = l.esRepo.PubToES(ctx, view, fieldObjs); err != nil { //下线
				return err
			}
			return nil
		//下线 有绑定审核流程 发起审核 不能直接通过
		case true:
			audit.OnlineStatus = constant.LineStatusDownAuditing
			audit.AuditStatus = constant.AuditStatusAuditing
			audit.ProcDefKey = process.ProcDefKey
		}
	}

	err = l.logicViewRepo.AuditProcessInstanceCreate(ctx, req.ID, audit)
	if err != nil {
		return err
	}

	return nil
}

func (l *logicViewUseCase) GenFieldObj(ctx context.Context, id string) ([]*es.FieldObj, error) {
	fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
	viewFieldList, err := l.fieldRepo.GetFormViewFieldList(ctx, id)
	if err != nil {
		return fieldObjs, err
	}
	for _, field := range viewFieldList {
		fieldObj := &es.FieldObj{
			FieldNameZH: field.BusinessName,
			FieldNameEN: field.TechnicalName,
		}
		fieldObjs = append(fieldObjs, fieldObj)
	}
	return fieldObjs, nil
}
func (l *logicViewUseCase) GetViewAuditors(ctx context.Context, req *logic_view.GetViewAuditorsReq) ([]*logic_view.AuditUser, error) {
	logicView, err := l.logicViewRepo.Get(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	res := make([]*logic_view.AuditUser, 0)
	for _, ownerId := range strings.Split(logicView.OwnerId.String, constant.OwnerIdSep) {
		res = append(res, &logic_view.AuditUser{
			UserId: ownerId,
		})
	}
	return res, nil
}
func (l *logicViewUseCase) GetViewBasicInfo(ctx context.Context, req *logic_view.GetViewBasicInfoReqParam) (*logic_view.GetViewBasicInfoResp, error) {
	logicView, err := l.logicViewRepo.GetBasicInfo(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	result := logic_view.GetViewBasicInfoResp(logicView)
	return &result, nil
}

func (l *logicViewUseCase) GetViewAuditorsByApplyId(ctx context.Context, req *logic_view.GetViewAuditorsByApplyIdReq) ([]*logic_view.AuditUser, error) {
	logicView, err := l.logicViewRepo.GetByApplyId(ctx, req.ApplyId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	res := make([]*logic_view.AuditUser, 0)
	for _, ownerId := range strings.Split(logicView.OwnerId.String, constant.OwnerIdSep) {
		res = append(res, &logic_view.AuditUser{
			UserId: ownerId,
		})
	}
	return res, nil
}

// UndoAudit 审核撤回
func (l *logicViewUseCase) UndoAudit(ctx context.Context, req *form_view.UndoAuditReq) error {
	return l.formViewUseCase.UndoAudit(ctx, req)
}

// PushViewToEs 2.0.0.5版本升级接口，发布后不可修改
func (l *logicViewUseCase) PushViewToEs(ctx context.Context) error {
	views, err := l.logicViewRepo.GetPushView(ctx)
	if err != nil {
		log.Error("logicViewRepo GetByOnline failed,err:", zap.Error(err))
		return err
	}
	for _, view := range views {
		fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
		viewFieldList, err := l.fieldRepo.GetFormViewFieldList(ctx, view.ID)
		if err != nil {
			log.Error("fieldRepo GetFormViewFieldList failed,err:", zap.Error(err))
			return err
		}
		for _, field := range viewFieldList {
			fieldObj := &es.FieldObj{
				FieldNameZH: field.BusinessName,
				FieldNameEN: field.TechnicalName,
			}
			fieldObjs = append(fieldObjs, fieldObj)
		}
		err = l.esRepo.PubToES(ctx, view, fieldObjs) //批量推送视图到es
		if err != nil {
			log.Error("logicViewRepo PubToES failed,err:", zap.Error(err))
			return err
		}
	}
	return nil
}
func (l *logicViewUseCase) GetViewQueryPath(ctx context.Context, logicView *model.FormView) (catalogName string, err error) {
	switch logicView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		datasource, err := l.datasourceRepo.GetByIdWithCode(ctx, logicView.DatasourceID)
		if err != nil {
			return "", err
		}
		catalogName = fmt.Sprintf("%s.%s", datasource.DataViewSource, util.QuotationMark(logicView.TechnicalName))
	case constant.FormViewTypeCustom.Integer.Int32():
		catalogName = fmt.Sprintf("%s.%s", constant.CustomViewSource+constant.CustomAndLogicEntityViewSourceSchema, util.QuotationMark(logicView.TechnicalName))
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		catalogName = fmt.Sprintf("%s.%s", constant.LogicEntityViewSource+constant.CustomAndLogicEntityViewSourceSchema, util.QuotationMark(logicView.TechnicalName))
	}
	return
}

func (l *logicViewUseCase) GetSyntheticDataCatalog(ctx context.Context, req *logic_view.GetSyntheticDataReq) (*virtualization_engine.FetchDataRes, error) {
	config, err := l.configurationCenterDriven.GetGlobalConfig(ctx, constant.SampleDataCount)
	if err != nil {
		return nil, err
	}
	sampleDataCount, err := strconv.Atoi(config)
	if err != nil || sampleDataCount < 1 || sampleDataCount > 50 {
		sampleDataCount = 5
	}
	req.SamplesSize = sampleDataCount
	return l.GetSyntheticData(ctx, req)
}

// GetSyntheticData 根据逻辑视图ID获取合成数据。
// 这个函数首先尝试从Redis缓存中获取合成数据；如果缓存中没有数据，则通过查询数据库获取视图路径，
// 并使用虚拟化引擎获取数据。如果数据条目不为0，则尝试生成新的合成数据并存储到Redis中。
// 参数:
//
//	ctx - 上下文对象，用于传递请求范围的数据和取消信号。
//	req - 请求对象，包含获取合成数据所需的逻辑视图ID。
//
// 返回值:
//
//	virtualization_engine.FetchDataRes - 合成数据的JSON字符串。
//	error - 如果在获取合成数据过程中发生错误，则返回相应的错误。
func (l *logicViewUseCase) GetSyntheticData(ctx context.Context, req *logic_view.GetSyntheticDataReq) (*virtualization_engine.FetchDataRes, error) {
	res := new(virtualization_engine.FetchDataRes)
	// 从数据库中获取逻辑视图对象
	logicView, err := l.logicViewRepo.Get(ctx, req.ID)
	if err != nil {
		return res, err
	}
	// 尝试从Redis中获取合成数据
	result, err := l.redis.GetClient().Get(ctx, fmt.Sprintf(constant.SyntheticDataKey, req.ID)).Result()
	if err == nil {
		if err = json.Unmarshal([]byte(result), res); err != nil {
			return nil, err
		}
		if len(res.Data) >= req.SamplesSize {
			res.Data = res.Data[:req.SamplesSize]
			return res, nil
		}
	} else if err != nil && !errors.Is(err, redis.Nil) {
		return res, errorcode.Desc(my_errorcode.SyntheticDataGetRedisKeyError)
	}

	_, err = l.QueryData(ctx, logicView, 1)
	if err != nil {
		return res, err
	}

	//生成合成数据
	if !l.redissonLock.TryLock(fmt.Sprintf(constant.SyntheticDataLock, req.ID)) {
		return res, errorcode.Desc(my_errorcode.ADGenerating)
	}
	fakeSamples, err := l.DrivenSailor.GenerateFakeSamples(ctx, &sailor_service.GenerateFakeSamplesReq{
		ViewID:      req.ID,
		SamplesSize: req.SamplesSize,
		MaxRetry:    2,
	})
	// 确保锁成功释放
	for l.redissonLock.Unlock(fmt.Sprintf(constant.SyntheticDataLock, req.ID)) != nil {
		log.WithContext(ctx).Error("【SyntheticDataLock】 Unlock error !")
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		return res, err
	}
	if len(fakeSamples.FakeSamples) == 0 {
		return res, errorcode.Desc(my_errorcode.GenerateFakeSamplesError)
	}

	// 获取视图字段信息
	viewFields, err := l.fieldRepo.GetFormViewFieldList(ctx, req.ID) //l.fieldRepo.GetFields()
	if err != nil {
		return res, errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}
	// 创建数据类型映射
	typeMap := make(map[string]string)
	for _, viewField := range viewFields {
		typeMap[viewField.TechnicalName] = viewField.DataType
	}
	// 处理生成的合成数据
	columnCount := len(fakeSamples.FakeSamples[0])
	columns := make([]*virtualization_engine.Column, columnCount)
	data := make([][]any, len(fakeSamples.FakeSamples))
	for i, fakeSampleSlice := range fakeSamples.FakeSamples {
		for j, fakeSample := range fakeSampleSlice {
			if i == 0 {
				columns[j] = &virtualization_engine.Column{
					Name: fakeSample.ColumnName,
					Type: typeMap[fakeSample.ColumnName],
				}
			}
			if j == 0 {
				data[i] = make([]any, columnCount)
			}
			data[i][j] = fakeSample
		}
	}
	res.TotalCount = columnCount
	res.Columns = columns
	res.Data = data
	// 将处理后的数据转换为JSON格式
	marshal, err := json.Marshal(res)
	if err != nil {
		return res, err
	}
	// 设置Redis缓存过期时间
	expiredTime := time.Duration(l.conf.Config.SyntheticDataCache.ExpirationTime) * time.Hour
	// 将合成数据保存到Redis
	if err = l.redis.GetClient().Set(ctx, fmt.Sprintf(constant.SyntheticDataKey, req.ID), string(marshal), expiredTime).Err(); err != nil {
		return res, errorcode.Desc(my_errorcode.SyntheticDataSetRedisKeyError)
	}
	return res, nil
}

func (l *logicViewUseCase) QueryData(ctx context.Context, logicView *model.FormView, limit int) (*virtualization_engine.FetchDataRes, error) {
	uInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	// 获取视图查询路径
	viewQueryPath, err := l.GetViewQueryPath(ctx, logicView)
	if err != nil {
		return nil, err
	}
	// 使用虚拟化引擎获取数据
	url := fmt.Sprintf("select * from %s limit %d", viewQueryPath, limit)
	res := new(virtualization_engine.FetchDataRes)
	retDatas := make([]map[string]any, 0)
	result, err := l.DrivenMdlDataModel.QueryData(ctx, uInfo.ID, logicView.MdlID, mdl_data_model.QueryDataBody{SQL: url, UseSearchAfter: true})
	if err != nil {
		return res, err
	}

	if len(result.Entries) > 0 {
		log.WithContext(ctx).Infof("get data for form view: %v, result: %#v", logicView.ID, result)
		for i := range result.Entries {
			if len(result.Entries[i]) > 0 {
				retDatas = append(retDatas, result.Entries[i])
			}
		}
	}

	for len(result.SearchAfter) > 0 {
		result, err = l.DrivenMdlDataModel.QueryData(ctx, uInfo.ID, logicView.MdlID, mdl_data_model.QueryDataBody{SearchAfter: result.SearchAfter, UseSearchAfter: true})
		if err != nil {
			return nil, err
		}
		if len(result.Entries) > 0 {
			log.WithContext(ctx).Infof("get data for form view: %v, result: %#v", logicView.ID, result)
			for i := range result.Entries {
				if len(result.Entries[i]) > 0 {
					retDatas = append(retDatas, result.Entries[i])
				}
			}
		}
	}

	if len(retDatas) == 0 {
		return res, errorcode.Desc(my_errorcode.ViewDataEntriesEmpty)
	}

	// 获取视图字段信息
	viewFields, err := l.fieldRepo.GetFormViewFieldList(ctx, logicView.ID) //l.fieldRepo.GetFields()
	if err != nil {
		return res, errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}
	// 创建数据类型映射
	typeMap := make(map[string]string)
	for _, viewField := range viewFields {
		typeMap[viewField.TechnicalName] = viewField.DataType
	}
	// 使用第一条记录获取字段名
	firstRecord := retDatas[0]
	var fieldNames []string
	for fieldName := range firstRecord {
		fieldNames = append(fieldNames, fieldName)
	}

	// 构建Columns
	columns := make([]*virtualization_engine.Column, 0, len(fieldNames))
	for _, fieldName := range fieldNames {
		columns = append(columns, &virtualization_engine.Column{
			Name: fieldName,
			Type: typeMap[fieldName],
		})
	}

	// 构建Data
	data := make([][]any, 0, len(retDatas))
	for _, record := range retDatas {
		dataRow := make([]any, 0, len(fieldNames))
		for _, fieldName := range fieldNames {
			if value, exists := record[fieldName]; exists {
				dataRow = append(dataRow, value)
			} else {
				dataRow = append(dataRow, "")
			}
		}
		data = append(data, dataRow)
	}

	res = &virtualization_engine.FetchDataRes{
		TotalCount: len(retDatas),
		Columns:    columns,
		Data:       data,
	}
	return res, nil
}

func (l *logicViewUseCase) ClearSyntheticDataCache(ctx context.Context, req *logic_view.GetSyntheticDataReq) error {
	_, err := l.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, req.ID)).Result()
	if err != nil {
		return err
	}
	return nil
}

func (l *logicViewUseCase) StandardChange(ctx context.Context, standardCodes []string) error {
	viewIds := make([]string, 0)
	if len(standardCodes) != 0 {
		ids, err := l.fieldRepo.GetViewIdByFieldStandardCode(ctx, standardCodes)
		if err != nil {
			return err
		}
		viewIds = append(viewIds, ids...)
	}
	for _, viewId := range viewIds {
		_, err := l.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, viewId)).Result()
		if err != nil {
			return err
		}
	}
	return nil
}
func (l *logicViewUseCase) DictChange(ctx context.Context, req *logic_view.DictChangeReq) error {
	viewIds := make([]string, 0)
	switch req.Type {
	case 1:
		if len(req.DictRuleIds) != 0 {
			codeTableId := make([]string, len(req.DictRuleIds))
			for i, id := range req.DictRuleIds {
				codeTableId[i] = strconv.Itoa(id)
			}
			ids, err := l.fieldRepo.GetViewIdByFieldCodeTableId(ctx, codeTableId)
			if err != nil {
				return err
			}
			viewIds = append(viewIds, ids...)
		}
	}
	if len(req.DataCodes) != 0 {
		standardCode := make([]string, len(req.DataCodes))
		for i, id := range req.DataCodes {
			standardCode[i] = strconv.Itoa(id)
		}
		ids, err := l.fieldRepo.GetViewIdByFieldStandardCode(ctx, standardCode)
		if err != nil {
			return err
		}
		viewIds = append(viewIds, ids...)
	}
	for _, viewId := range viewIds {
		_, err := l.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, viewId)).Result()
		if err != nil {
			return err
		}
	}
	return nil
}

func (l *logicViewUseCase) GetSampleData(ctx context.Context, req *logic_view.GetSampleDataReq) (*logic_view.GetSampleDataRes, error) {
	// 从数据库中获取逻辑视图对象
	logicView, err := l.logicViewRepo.Get(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	sampleDataType, err := l.configurationCenterDriven.GetGlobalConfig(ctx, constant.SampleDataType)
	if err != nil {
		return nil, err
	}

	config, err := l.configurationCenterDriven.GetGlobalConfig(ctx, constant.SampleDataCount)
	if err != nil {
		return nil, err
	}
	sampleDataCount, err := strconv.Atoi(config)
	if err != nil || sampleDataCount < 1 || sampleDataCount > 50 {
		sampleDataCount = 5
	}

	var fetchDataRes *virtualization_engine.FetchDataRes
	switch sampleDataType {
	case constant.Synthetic:
		fetchDataRes, err = l.GetSyntheticData(ctx, &logic_view.GetSyntheticDataReq{
			GetSyntheticDataParam: logic_view.GetSyntheticDataParam{
				ID: req.ID,
			},
			GetSyntheticDataQuery: logic_view.GetSyntheticDataQuery{
				SamplesSize: sampleDataCount,
			},
		})
		if err != nil {
			return nil, err
		}
	case constant.Real:
		fetchDataRes, err = l.QueryData(ctx, logicView, sampleDataCount)
		if err != nil {
			return nil, err
		}
	default:
		return nil, errorcode.Desc(my_errorcode.SampleDataTypeError)
	}
	return &logic_view.GetSampleDataRes{
		Type:         sampleDataType,
		FetchDataRes: fetchDataRes,
	}, nil
}
