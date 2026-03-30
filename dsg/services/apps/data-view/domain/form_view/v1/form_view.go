package v1

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"path"
	"regexp"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/department_explore_report"

	"github.com/kweaver-ai/idrm-go-common/rest/authorization"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/mdl_data_model"

	"github.com/avast/retry-go"
	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/samber/lo"
	"github.com/xuri/excelize/v2"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"gorm.io/gorm"

	dataClassifyAttrBlacklistRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_classify_attribute_blacklist"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_preview_config"
	dataPrivacyPolicyRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy"
	dataPrivacyPolicyFieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy_field"
	datasourceRpoo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	desensitizationRuleRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/desensitization_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_rule_config"
	exploreTaskRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_task"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_extend"
	fieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	logicViewRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/logic_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/scan_record"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/t_data_download_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_completion"
	tmpExploreSubTaskRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_explore_sub_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	whiteListPolicyRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/white_list_policy"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	redisson "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/redis"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	configuration_center_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/configuration_center"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data_exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/metadata"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/oss_gateway"
	standardizationbackend "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/standardization_backend"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/sailor_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driver/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/cache"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	api_audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	common_middleware "github.com/kweaver-ai/idrm-go-common/middleware"
	common_auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	configuration_center_gocommon "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	commonUtil "github.com/kweaver-ai/idrm-go-common/util"
	common_util "github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var SourceTypeMap = map[string]int32{
	"records":    int32(1),
	"analytical": int32(2),
	"sandbox":    int32(3),
}

type formViewUseCase struct {
	// 时钟，便于测试
	clock clock.PassiveClock

	repo                          repo.FormViewRepo
	logicViewRepo                 logicViewRepo.LogicViewRepo
	fieldRepo                     fieldRepo.FormViewFieldRepo
	scanRecordRepo                scan_record.ScanRecordRepo
	userRepo                      user.UserRepo
	datasourceRepo                datasourceRpoo.DatasourceRepo
	dataClassifyAttrBlacklistRepo dataClassifyAttrBlacklistRepo.DataClassifyAttrBlacklistRepo
	userMgr                       user_management.DrivenUserMgnt
	configurationCenterDriven     configuration_center.Driven
	configurationCenterDrivenNG   configuration_center_local.ConfigurationCenterDrivenNG
	DrivenVirtualizationEngine    virtualization_engine.DrivenVirtualizationEngine
	DrivenMetadata                metadata.DrivenMetadata
	DrivenAuthService             auth_service.DrivenAuthService
	redis                         *cache.Redis
	DrivenDataSubject             data_subject.Driven
	DrivenDataSubjectNG           data_subject_local.DrivenDataSubject
	kafkaPub                      kafka_pub.KafkaPub
	standardRepo                  standardizationbackend.DrivenStandardizationRepo
	standardDriven                standardization.Driven
	dataExploration               data_exploration.DrivenDataExploration
	tmpExploreSubTaskRepo         tmpExploreSubTaskRepo.TmpExploreSubTaskRepo
	ossGateway                    oss_gateway.CephClient
	redissonLock                  redisson.RedissonInterface
	downloadTaskRepo              t_data_download_task.TDataDownloadTaskRepo
	subViewRepo                   sub_view.SubViewRepo
	mqProducer                    *kafka.KafkaProducer
	exploreTaskRepo               exploreTaskRepo.ExploreTaskRepo
	workflow                      workflow.WorkflowInterface
	esRepo                        es.ESRepo
	tmpCompletionRepo             tmp_completion.TmpCompletionRepo
	afSailorServiceDriven         sailor_service.GraphSearch
	exploreRuleConfigRepo         explore_rule_config.ExploreRuleConfigRepo
	*common.CommonUseCase
	whiteListPolicyRepo         whiteListPolicyRepo.WhiteListPolicyRepo
	desensitizationRuleRepo     desensitizationRuleRepo.DesensitizationRuleRepo
	dataPreviewConfigRepo       data_preview_config.DataPreviewConfigRepo
	businessGroomingDriven      business_grooming.Driven
	dataPrivacyPolicyRepo       dataPrivacyPolicyRepo.DataPrivacyPolicyRepo
	dataPrivacyPolicyFieldRepo  dataPrivacyPolicyFieldRepo.DataPrivacyPolicyFieldRepo
	formViewExtendRepo          form_view_extend.FormViewExtendRepo
	GradeLabel                  configuration_center_gocommon.LabelService
	dataCatalogV1               data_catalog.Driven
	commonAuthService           common_auth_service.AuthServiceInternalV1Interface
	authorizationDriven         authorization.Driven
	DrivenMdlDataModel          mdl_data_model.DrivenMdlDataModel
	departmentExploreReportRepo department_explore_report.DepartmentExploreReportRepo
}

func NewFormViewUseCase(
	repo repo.FormViewRepo,
	logicViewRepo logicViewRepo.LogicViewRepo,
	userRepo user.UserRepo,
	fieldRepo fieldRepo.FormViewFieldRepo,
	scanRecordRepo scan_record.ScanRecordRepo,
	datasourceRepo datasourceRpoo.DatasourceRepo,
	dataClassifyAttrBlacklistRepo dataClassifyAttrBlacklistRepo.DataClassifyAttrBlacklistRepo,
	userMgr user_management.DrivenUserMgnt,
	configurationCenterDriven configuration_center.Driven,
	configurationCenterDrivenNG configuration_center_local.ConfigurationCenterDrivenNG,
	drivenVirtualizationEngine virtualization_engine.DrivenVirtualizationEngine,
	drivenMetadata metadata.DrivenMetadata,
	drivenAuthService auth_service.DrivenAuthService,
	kafkaPub kafka_pub.KafkaPub,
	drivenDataSubject data_subject.Driven,
	drivenDataSubjectNG data_subject_local.DrivenDataSubject,
	redis *cache.Redis,
	standardRepo standardizationbackend.DrivenStandardizationRepo,
	standardDriven standardization.Driven,
	ossGateway oss_gateway.CephClient,
	redissonLock redisson.RedissonInterface,
	downloadTaskRepo t_data_download_task.TDataDownloadTaskRepo,
	subViewRepo sub_view.SubViewRepo,
	dataExploration data_exploration.DrivenDataExploration,
	tmpExploreSubTaskRepo tmpExploreSubTaskRepo.TmpExploreSubTaskRepo,
	exploreTaskRepo exploreTaskRepo.ExploreTaskRepo,
	mqProducer *kafka.KafkaProducer,
	workflow workflow.WorkflowInterface,
	esRepo es.ESRepo,
	tmpCompletionRepo tmp_completion.TmpCompletionRepo,
	afSailorServiceDriven sailor_service.GraphSearch,
	exploreRuleConfigRepo explore_rule_config.ExploreRuleConfigRepo,
	commonUseCase *common.CommonUseCase,
	dataPreviewConfigRepo data_preview_config.DataPreviewConfigRepo,
	whiteListPolicyRepo whiteListPolicyRepo.WhiteListPolicyRepo,
	desensitizationRuleRepo desensitizationRuleRepo.DesensitizationRuleRepo,
	businessGroomingDriven business_grooming.Driven,
	dataPrivacyPolicyRepo dataPrivacyPolicyRepo.DataPrivacyPolicyRepo,
	dataPrivacyPolicyFieldRepo dataPrivacyPolicyFieldRepo.DataPrivacyPolicyFieldRepo,
	formViewExtendRepo form_view_extend.FormViewExtendRepo,
	gradeLabel configuration_center_gocommon.LabelService,
	dataCatalogV1 data_catalog.Driven,
	commonAuthService common_auth_service.AuthServiceInternalV1Interface,
	authorizationDriven authorization.Driven,
	drivenMdlDataModel mdl_data_model.DrivenMdlDataModel,
	departmentExploreReportRepo department_explore_report.DepartmentExploreReportRepo,
) form_view.FormViewUseCase {
	useCase := &formViewUseCase{
		repo:                          repo,
		logicViewRepo:                 logicViewRepo,
		fieldRepo:                     fieldRepo,
		scanRecordRepo:                scanRecordRepo,
		userRepo:                      userRepo,
		datasourceRepo:                datasourceRepo,
		dataClassifyAttrBlacklistRepo: dataClassifyAttrBlacklistRepo,
		userMgr:                       userMgr,
		configurationCenterDriven:     configurationCenterDriven,
		configurationCenterDrivenNG:   configurationCenterDrivenNG,
		DrivenVirtualizationEngine:    drivenVirtualizationEngine,
		DrivenMetadata:                drivenMetadata,
		DrivenAuthService:             drivenAuthService,
		redis:                         redis,
		DrivenDataSubject:             drivenDataSubject,
		DrivenDataSubjectNG:           drivenDataSubjectNG,
		kafkaPub:                      kafkaPub,
		standardRepo:                  standardRepo,
		standardDriven:                standardDriven,
		dataExploration:               dataExploration,
		tmpExploreSubTaskRepo:         tmpExploreSubTaskRepo,
		ossGateway:                    ossGateway,
		redissonLock:                  redissonLock,
		downloadTaskRepo:              downloadTaskRepo,
		subViewRepo:                   subViewRepo,
		exploreTaskRepo:               exploreTaskRepo,
		mqProducer:                    mqProducer,
		workflow:                      workflow,
		esRepo:                        esRepo,
		tmpCompletionRepo:             tmpCompletionRepo,
		afSailorServiceDriven:         afSailorServiceDriven,
		exploreRuleConfigRepo:         exploreRuleConfigRepo,
		CommonUseCase:                 commonUseCase,
		dataPreviewConfigRepo:         dataPreviewConfigRepo,
		whiteListPolicyRepo:           whiteListPolicyRepo,
		desensitizationRuleRepo:       desensitizationRuleRepo,
		businessGroomingDriven:        businessGroomingDriven,
		dataPrivacyPolicyRepo:         dataPrivacyPolicyRepo,
		dataPrivacyPolicyFieldRepo:    dataPrivacyPolicyFieldRepo,
		formViewExtendRepo:            formViewExtendRepo,
		GradeLabel:                    gradeLabel,
		dataCatalogV1:                 dataCatalogV1,
		commonAuthService:             commonAuthService,
		authorizationDriven:           authorizationDriven,
		DrivenMdlDataModel:            drivenMdlDataModel,
		departmentExploreReportRepo:   departmentExploreReportRepo,
	}
	useCase.clock = clock.RealClock{}
	//go useCase.FixDatasourceStatus(context.Background())
	func() {
		fn := func() {
			ctx, span := af_trace.StartInternalSpan(context.Background())
			defer func() { af_trace.TelemetrySpanEnd(span, nil) }()
			useCase.taskProcess(ctx)
		}
		go func() {
			for {
				fn()
				time.Sleep(5 * time.Second)
			}
		}()
	}()
	return useCase
}

var once = sync.Once{}

func (f *formViewUseCase) SyncCCDataSourceOnce() {
	if runtime.GOOS == "windows" { //本地调试不同步数据
		return
	}
	once.Do(func() {
		go func() {
			ctx := context.Background()
			log.Info("SyncCCDataSourceOnce")
			_ = retry.Do(
				func() error {
					localDatasource, err := f.datasourceRepo.GetAll(ctx)
					if err != nil {
						log.Error("【SyncCCDataSourceOnce】Get local Datasource", zap.Error(err))
						return err
					}
					localDatasourceMap := make(map[string]bool)
					for _, datasource := range localDatasource {
						localDatasourceMap[datasource.ID] = true
					}
					remoteDatasource, err := f.configurationCenterDriven.GetAllDataSources(ctx)
					if err != nil {
						log.Error("【SyncCCDataSourceOnce】Get remote Datasource", zap.Error(err))
						return err
					}
					createDatasource := make([]*model.Datasource, 0)
					for _, datasource := range remoteDatasource {
						if !localDatasourceMap[datasource.ID] {
							ds := &model.Datasource{}
							if err = copier.Copy(ds, datasource); err != nil {
								log.Error("【SyncCCDataSourceOnce】create Datasource copier.Copy", zap.Error(err))
								return err
							}
							createDatasource = append(createDatasource, ds)
						}
					}
					if len(createDatasource) == 0 {
						log.Info("【SyncCCDataSourceOnce】CreateDataSources empty")
						return nil
					}
					log.Infof("【SyncCCDataSourceOnce】 %+v", createDatasource)
					if err = f.datasourceRepo.CreateDataSources(ctx, createDatasource); err != nil {
						log.Error("【SyncCCDataSourceOnce】CreateDataSources", zap.Error(err))
						return err

					}
					log.Info("【SyncCCDataSourceOnce】CreateDataSources finish")
					return nil
				},
				retry.OnRetry(func(n uint, err error) {
					log.Warnf("【RetryObtainDataSource】#%d: %s\n", n, err)
				}),
				retry.Attempts(15),
			)
		}()

	})
}

func (f *formViewUseCase) PageList(ctx context.Context, req *form_view.PageListFormViewReq) (*form_view.PageListFormViewResp, error) {
	//f.SyncCCDataSourceOnce()
	if len(req.DatasourceIds) == 0 {
		req.DatasourceIds = make([]string, 0)
	}
	var exploreTime int64
	if req.InfoSystemID != nil {
		if *req.InfoSystemID != "" {
			// datasource, err := f.datasourceRepo.GetDataSourcesByInfoSystemID(ctx, *req.InfoSystemID)
			// if err != nil {
			// 	return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
			// }
			// if len(datasource) > 0 {
			// 	//datasourceIds = make([]string, len(datasource))
			// 	for _, ds := range datasource {
			// 		req.DatasourceIds = append(req.DatasourceIds, ds.ID)
			// 	}
			// } else {
			// 	return &form_view.PageListFormViewResp{
			// 		PageResultNew: form_view.PageResultNew[form_view.FormView]{
			// 			Entries:    []*form_view.FormView{},
			// 			TotalCount: 0,
			// 		},
			// 	}, nil
			// }
		} else {
			datasource, err := f.datasourceRepo.GetDataSourcesByInfoSystemIDISNull(ctx)
			if err != nil {
				return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
			}
			if len(datasource) > 0 {
				//datasourceIds = make([]string, len(datasource))
				for _, ds := range datasource {
					req.DatasourceIds = append(req.DatasourceIds, ds.ID)
				}
			} else {
				return &form_view.PageListFormViewResp{
					PageResultNew: form_view.PageResultNew[form_view.FormView]{
						Entries:    []*form_view.FormView{},
						TotalCount: 0,
					},
				}, nil
			}
		}
	}

	//if len(req.DatasourceType) != 0 && req.DatasourceId == "" {
	if req.DatasourceType != "" && req.DatasourceId == "" {
		// // 检查虚拟化引擎是否支持数据库类型
		// connectors, err := f.DrivenVirtualizationEngine.GetConnectors(ctx)
		// if err != nil {
		// 	return nil, err
		// }
		// // 支持的数据源类型的名称列表
		// connectorNames := make(map[string]bool)
		// for _, c := range connectors.ConnectorNames {
		// 	connectorNames[c.OLKConnectorName] = true
		// }
		// //for _, t := range req.DatasourceType {
		// //	if !connectorNames[t] {
		// //		return nil, errorcode.Desc(errorcode.PublicInvalidParameter, "datasource_type")
		// //	}
		// //}
		// if !connectorNames[req.DatasourceType] {
		// 	return nil, errorcode.Desc(errorcode.PublicInvalidParameter, "datasource_type")
		// }

		datasource, err := f.datasourceRepo.GetDataSourcesByType(ctx, []string{req.DatasourceType})
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}

		//做数据源类型过滤
		newDatasource := []*model.Datasource{}
		if req.DataSourceSourceType != "" {
			if dataSourceSourceType, exist := SourceTypeMap[req.DataSourceSourceType]; exist {
				for _, ds := range datasource {
					if ds.SourceType == dataSourceSourceType {
						newDatasource = append(newDatasource, ds)
					}
				}
			}
			datasource = newDatasource
		}
		/*		datasource, err := f.configurationCenterDriven.GetDataSourcesByType(ctx, req.DatasourceType)
				if err != nil {
					return nil, err
				}*/
		if len(datasource) > 0 {
			//datasourceIds = make([]string, len(datasource))
			for _, ds := range datasource {
				req.DatasourceIds = append(req.DatasourceIds, ds.ID)
			}
		} else {
			return &form_view.PageListFormViewResp{
				PageResultNew: form_view.PageResultNew[form_view.FormView]{
					Entries:    []*form_view.FormView{},
					TotalCount: 0,
				},
			}, nil
		}
		//} else if len(req.DatasourceType) == 0 && req.DatasourceId != "" {
	} else if req.DatasourceType == "" && req.DatasourceId != "" {
		// 获取探查时间
		exploreTime, _ = f.exploreTaskRepo.GetExploreTime(ctx, req.DatasourceId)
	} else if req.DataSourceSourceType != "" {
		dataSourceSourceType := SourceTypeMap[req.DataSourceSourceType]
		datasource, err := f.datasourceRepo.GetDataSourcesBySourceType(ctx, []int32{dataSourceSourceType})
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		for _, ds := range datasource {
			req.DatasourceIds = append(req.DatasourceIds, ds.ID)
		}
	}
	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId && req.IncludeSubDepartment {
		req.SubDepartmentIDs = []string{req.DepartmentID}
		departmentList, err := f.configurationCenterDriven.GetDepartmentList(ctx, configuration_center.QueryPageReqParam{Offset: 1, Limit: 0, ID: req.DepartmentID}) //limit 0 Offset 1 not available
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			req.SubDepartmentIDs = append(req.SubDepartmentIDs, entry.ID)
		}
	}
	if req.MyDepartmentResource {
		userInfo, err := common_util.GetUserInfo(ctx)
		if err != nil {
			return nil, err
		}
		depart, err := f.configurationCenterDriven.GetMainDepartIdsByUserID(ctx, userInfo.ID)
		if err != nil {
			return nil, err
		}
		if req.SubDepartmentIDs == nil {
			req.SubDepartmentIDs = []string{}
		}
		req.SubDepartmentIDs = append(req.SubDepartmentIDs, depart...)
	}
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId && req.IncludeSubSubject {
		req.SubSubSubjectIDs = []string{req.SubjectID}
		subjectList, err := f.DrivenDataSubjectNG.GetSubjectList(ctx, req.SubjectID, "subject_domain,business_object,business_activity,logic_entity")
		if err != nil {
			return nil, err
		}
		for _, entry := range subjectList.Entries {
			req.SubSubSubjectIDs = append(req.SubSubSubjectIDs, entry.Id)
		}
	}

	total, formViews, err := f.repo.PageList(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("FormViewRepo.List", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	formViewIds := make([]string, 0)
	for _, formView := range formViews {
		formViewIds = append(formViewIds, formView.ID)
	}
	exploredDataMap := make(map[string]int)
	exploredTimestampMap := make(map[string]int)
	exploredClassificationMap := make(map[string]int)
	if len(formViewIds) > 0 {
		// 获取数据探查、时间戳探查状态
		rBuf, _ := f.dataExploration.GetFormStatus(ctx, &data_exploration.TableTaskStatusReq{TableIds: formViewIds})
		if rBuf != nil {
			ret := &form_view.JobStatusList{}
			if err = json.Unmarshal(rBuf, ret); err != nil {
				log.WithContext(ctx).Errorf("解析获取探查作业状态失败 ids:%s，err is %v", formViewIds, err)
				return nil, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
			}
			if len(ret.Entries) > 0 {
				for i := range ret.Entries {
					if ret.Entries[i].ExploreType == explore_task.TaskExploreData.Integer.Int32() {
						exploredDataMap[ret.Entries[i].TableId] = 1
					}
					if ret.Entries[i].ExploreType == explore_task.TaskExploreTimestamp.Integer.Int32() {
						exploredTimestampMap[ret.Entries[i].TableId] = 1
					}
				}
			}
		}
		// 获取分类探查状态
		ids, err := f.tmpExploreSubTaskRepo.GetByFormIds(ctx, formViewIds, []int32{explore_task.TaskStatusFinished.Integer.Int32()})
		if err != nil {
			log.WithContext(ctx).Error("tmpExploreSubTaskRepo.GetByFormIds", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		for i := range ids {
			exploredClassificationMap[ids[i]] = 1
		}
	}
	var viewFiledCountMap map[string]int
	var viewsCatalogMaps map[string]ViewsCatalogs
	if req.MyDepartmentResource {
		viewFiledCountMap, viewsCatalogMaps, err = f.GetViewFiledCount(ctx, formViews)
		if err != nil {
			return nil, err
		}
	}

	//获取用户名 及数据源名
	uids, dids, subjectIds, departIds := f.LoopId(formViews)
	if req.MyDepartmentResource && len(viewsCatalogMaps) > 0 {
		extraDepartIDs := make([]string, 0, len(viewsCatalogMaps))
		for _, vc := range viewsCatalogMaps {
			if vc.DepartmentID != "" {
				extraDepartIDs = append(extraDepartIDs, vc.DepartmentID)
			}
		}
		if len(extraDepartIDs) > 0 {
			departIds = util.DuplicateStringRemoval(append(departIds, extraDepartIDs...))
		}
	}
	//userIdNameMap, err := f.userRepo.GetByUserMapByIds(ctx, uids)
	userIdNameMap, err := f.GetByUserMapByIds(ctx, uids)
	if err != nil {
		return nil, err
	}

	datasourceMap, err := f.GetDatasourceMap(ctx, dids)
	if err != nil {
		return nil, err
	}

	//获取所属主题map
	subjectNameMap, subjectPathIdMap, subjectPathMap, err := f.GetSubjectNameAndPathMap(ctx, subjectIds)
	if err != nil {
		return nil, err
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := f.GetDepartmentNameAndPathMap(ctx, departIds)
	if err != nil {
		return nil, err
	}

	res := make([]*form_view.FormView, len(formViews), len(formViews))
	for i, view := range formViews {
		res[i] = &form_view.FormView{}
		res[i].Assemble(view, userIdNameMap, datasourceMap, subjectNameMap, subjectPathIdMap, subjectPathMap, departmentNameMap, departmentPathMap)
		if _, ok := exploredDataMap[view.ID]; ok {
			res[i].ExploredData = 1
		}
		if _, ok := exploredTimestampMap[view.ID]; ok {
			res[i].ExploredTimestamp = 1
		}
		if _, ok := exploredClassificationMap[view.ID]; ok {
			res[i].ExploredClassification = 1
		}
		if req.MyDepartmentResource {
			res[i].FieldCount = viewFiledCountMap[view.ID]
			// 目录提供方按数据目录来源部门路径返回：通过 t_data_resource -> t_data_catalog.department_id -> 部门 Path
			// 若 department_id 为空，则返回空（不做回退）
			if vc, ok := viewsCatalogMaps[view.ID]; ok && vc.DepartmentID != "" {
				res[i].CatalogProvider = departmentPathMap[vc.DepartmentID]
			}
			if _, exist := viewsCatalogMaps[view.ID]; exist {
				res[i].ApplyNum = viewsCatalogMaps[view.ID].ApplyNum
				res[i].DataCatalogID = viewsCatalogMaps[view.ID].ID
				res[i].DataCatalogName = viewsCatalogMaps[view.ID].Name
			}
		}
	}

	f.addFormViewBusinessTableID(ctx, req.BusinessModelID, res)

	//数仓数据权限申请，给出当前用户是否有申请单
	if req.IncludeDWHDataAuthRequest {
		userInfo, err := common_util.GetUserInfo(ctx)
		if err != nil {
			return nil, err
		}
		ids := lo.Times(len(res), func(i int) string {
			return res[i].ID
		})
		hasReqFormDict, err := f.commonAuthService.QueryViewHasDWHDataAuthRequestForm(ctx, userInfo.ID, ids)
		if err != nil {
			return nil, err
		}
		for i := range res {
			res[i].HasDWHDataAuthReqForm = hasReqFormDict[res[i].ID] > 0
		}
	}

	return &form_view.PageListFormViewResp{
		PageResultNew: form_view.PageResultNew[form_view.FormView]{
			Entries:    res,
			TotalCount: total,
		},
		ExploreTime: exploreTime,
	}, nil
}

func (f *formViewUseCase) LoopId(formViews []*model.FormView) (uids []string, dids []string, subjectIds []string, departIds []string) {
	for _, formView := range formViews {
		uids = append(uids, formView.CreatedByUID, formView.UpdatedByUID)
		for _, ownerId := range strings.Split(formView.OwnerId.String, constant.OwnerIdSep) {
			uids = append(uids, ownerId)
		}
		dids = append(dids, formView.DatasourceID)
		subjectIds = append(subjectIds, formView.SubjectId.String)
		departIds = append(departIds, formView.DepartmentId.String)
	}
	uids = util.DuplicateStringRemoval(uids)
	dids = util.DuplicateStringRemoval(dids)
	subjectIds = util.DuplicateStringRemoval(subjectIds)
	departIds = util.DuplicateStringRemoval(departIds)
	return
}

func (f *formViewUseCase) GetViewFiledCount(ctx context.Context, formViews []*model.FormView) (countMap map[string]int, viewsCatalogMaps map[string]ViewsCatalogs, err error) {
	vids := make([]string, len(formViews))
	for i, formView := range formViews {
		vids[i] = formView.ID

	}
	vids = util.DuplicateStringRemoval(vids)
	count, err := f.fieldRepo.ViewFieldCount(ctx, vids)
	if err != nil {
		return
	}
	countMap = make(map[string]int)
	for _, c := range count {
		countMap[c.FormViewID] = c.Count
	}
	viewsCatalogs, err := f.logicViewRepo.ViewsCatalogs(ctx, vids)
	if err != nil {
		return
	}

	viewsCatalogMaps = make(map[string]ViewsCatalogs)
	for _, c := range viewsCatalogs {
		viewsCatalogMaps[c.ResourceID] = ViewsCatalogs{
			ID:           strconv.FormatUint(c.ID, 10),
			Name:         c.Name,
			ApplyNum:     c.ApplyNum,
			DepartmentID: c.DepartmentID,
		}
	}
	return
}

type ViewsCatalogs struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	ApplyNum     int    `json:"apply_num"`
	DepartmentID string `json:"department_id"`
}

func (f *formViewUseCase) GetByUserMapByIds(ctx context.Context, ids []string) (map[string]string, error) {
	usersMap := make(map[string]string)
	if len(ids) == 0 {
		return usersMap, nil
	}
	users, err := f.configurationCenterDriven.GetBaseUserByIds(ctx, ids)
	if err != nil {
		return usersMap, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	for _, u := range users {
		if u.Status == constant.UserDelete {
			usersMap[u.ID] = u.Name + "#用户已删除#"
		} else {
			usersMap[u.ID] = u.Name
		}
	}
	return usersMap, nil
}

func (f *formViewUseCase) GetDatasourceMap(ctx context.Context, ids []string) (map[string]*model.Datasource, error) {
	datasourceMap := make(map[string]*model.Datasource)
	if len(ids) == 0 {
		return datasourceMap, nil
	}
	datasourceList, err := f.datasourceRepo.GetByIds(ctx, ids)
	if err != nil {
		return datasourceMap, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	for _, datasource := range datasourceList {
		datasourceMap[datasource.ID] = datasource
	}
	return datasourceMap, nil
}

func (f *formViewUseCase) UpdateFormView(ctx context.Context, req *form_view.UpdateReq) error {
	//f.SyncCCDataSourceOnce()

	formView, err := f.repo.GetById(ctx, req.ID) //form id验证
	if err != nil {
		return err
	}
	if formView.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return errorcode.Desc(my_errorcode.MustDatasourceFormView)
	}
	if formView.Status == constant.FormViewDelete.Integer.Int32() {
		return errorcode.Desc(my_errorcode.FormViewDeleteCannotUpdate)
	}
	exist, err := f.repo.DataSourceViewNameExist(ctx, formView, req.BusinessName)
	if err != nil {
		return errorcode.Desc(my_errorcode.DatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(my_errorcode.FormViewNameExist)
	}
	fieldMap := make(map[string]string, 0)     //用于 Fields id验证，及获取业务名称
	fieldNameMap := make(map[string]string, 0) //用于业务名称验证
	for _, field := range req.Fields {
		fieldMap[field.Id] = field.BusinessName
	}
	args := &repo.UpdateTransactionArgs{
		FormView: formView,
		Fields:   fieldMap,
	}
	formViewFields, err := f.fieldRepo.GetFormViewFieldList(ctx, req.ID)
	if err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	// 根据请求中的字段信息更新字段的业务名称
	for i := range formViewFields {
		for _, f := range req.Fields {
			if f.Id != formViewFields[i].ID {
				continue
			}
			formViewFields[i].BusinessName = f.BusinessName
			break
		}
	}

	fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
	for _, formViewField := range formViewFields {
		fieldObj := &es.FieldObj{
			FieldNameZH: formViewField.BusinessName,
			FieldNameEN: formViewField.TechnicalName,
		}
		fieldObjs = append(fieldObjs, fieldObj)
		if _, exist = fieldMap[formViewField.ID]; !exist {
			return errorcode.Desc(my_errorcode.FormViewFieldIDNotComplete) //req Fields id不完整
		}
		if _, exist = fieldNameMap[fieldMap[formViewField.ID]]; formViewField.Status != constant.FormViewFieldDelete.Integer.Int32() && exist {
			return errorcode.WithDetail(my_errorcode.FieldsBusinessNameRepeat, map[string]any{"form_view_field_id": formViewField.ID, "form_view_field_name": fieldMap[formViewField.ID]}) //req Fields中业务名重复
		}
		if formViewField.Status != constant.FormViewFieldDelete.Integer.Int32() {
			fieldNameMap[fieldMap[formViewField.ID]] = formViewField.ID
		}
		/*		if fieldNameMap[formViewField.BusinessName] != "" && fieldNameMap[formViewField.BusinessName] != formViewField.ID && isFinal {
				return errorcode.Desc(my_errorcode.FieldsBusinessNameRepeat) //req Fields中业务名与原有业务名称重复
			}*/
	}

	/*	datasource, err := f.datasourceRepo.GetById(ctx, formView.DatasourceID)
		if err != nil {
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}*/

	//发布检查业务表名称是否全都覆盖
	if true {
		publishAt := time.Now()
		args.FormView.EditStatus = constant.FormViewLatest.Integer.Int32()
		args.FormView.BusinessName = req.BusinessName
		args.FormView.PublishAt = &publishAt
	}
	if err = f.repo.UpdateTransaction(ctx, args); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if err = f.esRepo.PubToES(ctx, formView, fieldObjs); err != nil { // 编辑元数据视图
		return err
	}

	return nil
}
func (f *formViewUseCase) UpdateDatasourceView(ctx context.Context, req *form_view.UpdateReq) error {
	logger := audit.FromContextOrDiscard(ctx)
	formView, err := f.repo.GetById(ctx, req.ID) //form id验证
	if err != nil {
		return err
	}
	isPublish := formView.PublishAt == nil || formView.PublishAt.IsZero()
	if formView.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return errorcode.Desc(my_errorcode.MustDatasourceFormView)
	}
	if formView.Status == constant.FormViewDelete.Integer.Int32() {
		return errorcode.Desc(my_errorcode.FormViewDeleteCannotUpdate)
	}
	exist, err := f.repo.DataSourceViewNameExist(ctx, formView, req.BusinessName)
	if err != nil {
		return errorcode.Desc(my_errorcode.DatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(my_errorcode.FormViewNameExist)
	}
	//校验时间戳id
	if req.BusinessTimestampID != "" {
		if _, err = f.fieldRepo.GetField(ctx, req.BusinessTimestampID); err != nil {
			return err
		}
	}

	fieldReqMap := make(map[string]*form_view.Fields)
	CodeTableIDs := make([]string, 0)
	StandardCodes := make([]string, 0)
	SubjectIDs := make([]string, 0)
	for _, field := range req.Fields {
		fieldReqMap[field.Id] = field
		if field.CodeTableID != "" {
			CodeTableIDs = append(CodeTableIDs, field.CodeTableID)
		}
		if field.StandardCode != "" {
			StandardCodes = append(StandardCodes, field.StandardCode)
		}
		if field.ClearLableID != "" {
			SubjectIDs = append(SubjectIDs, field.AttributeID)
		}
	}
	if err = f.VerifyStandard(ctx, CodeTableIDs, StandardCodes); err != nil {
		return err
	}

	SubjectIDs = util.DuplicateStringRemoval(SubjectIDs)
	subjects, err := f.DrivenDataSubjectNG.GetAttributeByIds(ctx, SubjectIDs)
	if err != nil {
		return err
	}
	for _, subject := range subjects.Attributes {
		if subject.LabelId != "" {
			return errorcode.Detail(my_errorcode.SubjectHasLabel, fmt.Sprintf("subject %s has label", subject.ID))
		}
	}

	/*	//for Rollback
		viewSQL, err := f.logicViewRepo.GetLogicViewSQL(ctx, req.ID)
		if err != nil {
			return err
		}
		datasource, err := f.datasourceRepo.GetById(ctx, formView.DatasourceID)
		if err != nil {
			return err
		}
	*/
	formView.BusinessName = req.BusinessName

	// 更新统一视图服务视图信息
	updateViewReq := &mdl_data_model.UpdateDataView{
		Name:    req.BusinessName,
		Comment: formView.Comment.String,
	}
	formViewFields, err := f.fieldRepo.GetFormViewFieldList(ctx, req.ID)
	if err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	fields := make([]mdl_data_model.FieldInfo, 0)
	for i := range formViewFields {
		for _, field := range req.Fields {
			if field.Id != formViewFields[i].ID {
				continue
			}
			updateField := mdl_data_model.FieldInfo{
				OriginalName: formViewFields[i].TechnicalName,
				Name:         formViewFields[i].TechnicalName,
				DisplayName:  field.BusinessName,
				Type:         formViewFields[i].DataType,
				// Comment:      formViewFields[i].Comment.String,
				// DataLength:   formViewFields[i].DataLength,
				// DataAccuracy: formViewFields[i].DataAccuracy.Int32,
				// Status:       enum.ToString[constant.FormViewFieldScanStatus](formViewFields[i].Status),
				// IsNullable:   formViewFields[i].IsNullable,
			}
			// if req.BusinessTimestampID == "" {
			// 	updateField.BusinessTimestamp = formViewFields[i].BusinessTimestamp
			// } else if req.BusinessTimestampID == field.Id {
			// 	updateField.BusinessTimestamp = true
			// }
			fields = append(fields, updateField)
		}
	}
	updateViewReq.Fields = fields
	_, err = f.DrivenMdlDataModel.UpdateDataView(ctx, formView.MdlID, updateViewReq)
	if err != nil {
		log.WithContext(ctx).Warnf("【formViewUseCase】UpdateDatasourceView  UpdateDataView fail %s", err.Error())
		return err
	}

	formView.InfoSystemID = req.InfoSystemID
	clearSyntheticData, err := f.repo.UpdateDatasourceViewTransaction(ctx, formView, req.BusinessTimestampID, fieldReqMap)
	if err != nil {
		//f.RollbackModifyView(ctx, datasource, formView, viewSQL)
		return err
	}
	if clearSyntheticData {
		result, err := f.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, formView.ID)).Result()
		if err != nil {
			log.WithContext(ctx).Error("【formViewUseCase】UpdateDatasourceView  clear synthetic-data fail ", zap.Error(err))
		}
		log.WithContext(ctx).Infof("【formViewUseCase】UpdateDatasourceView  clear synthetic-data result %d", result)
	}
	// [元数据视图更新前发布时间戳为0则此次更新为发布]
	if isPublish {
		go logger.Info(api_audit_v1.OperationPublishLogicView,
			&form_view.LogicViewSimpleResourceObject{
				Name:       formView.BusinessName,
				FormViewID: formView.ID,
			})
	} // [/]
	return nil
}

func (f *formViewUseCase) RollbackModifyView(ctx context.Context, datasource *model.Datasource, formView *model.FormView, viewSQL []*model.FormViewSql) {
	var sql string
	if len(viewSQL) == 0 { //适配原始sql场景
		sql = fmt.Sprintf("select * from %s.%s.%s", datasource.CatalogName, util.QuotationMark(datasource.Schema), util.QuotationMark(formView.TechnicalName))
	} else {
		sql = viewSQL[0].Sql
	}
	if errRollback := f.DrivenVirtualizationEngine.ModifyView(ctx, &virtualization_engine.ModifyViewReq{
		CatalogName: datasource.DataViewSource,
		Query:       sql,
		ViewName:    formView.TechnicalName,
	}); errRollback != nil {
		log.WithContext(ctx).Error("UpdateLogicViewAndField rollback ModifyView error", zap.Error(errRollback))
	}
}

func (f *formViewUseCase) ExcelBatchPublish(ctx context.Context, req *form_view.ExcelBatchPublishReq, fileHeader *multipart.FileHeader) (*form_view.ExcelBatchPublishRes, error) {
	reader, err := fileHeader.Open()
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return nil, errorcode.Desc(my_errorcode.FormOpenExcelFileError)
	}
	defer func() {
		if err := reader.Close(); err != nil {
			log.WithContext(ctx).Error("reader.Close " + err.Error())
		}
	}()
	xlsxFile, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, err
	}
	sheetList := xlsxFile.GetSheetList()

	rows, err := xlsxFile.GetRows(sheetList[0], excelize.Options{RawCellValue: true})
	if err != nil {
		return nil, err
	}

	datasourceMaps := make(map[string][][]string)
	//techNames := make([]string, 0)
	//ownerNames := make([]string, 0)
	//departmentPaths := make([]string, 0)
	//subjectPaths := make([]string, 0)

	for i, row := range rows {
		if len(row) < 4 {
			return nil, errorcode.Desc(my_errorcode.ExcelContentError)
		}

		if i > 0 {
			num := i - 1
			if datasourceMaps[row[0]] == nil {
				datasourceMaps[row[0]] = make([][]string, 5)
				for j := 0; j < 5; j++ {
					datasourceMaps[row[0]][j] = make([]string, len(rows)-1)
				}
			}
			datasourceMaps[row[0]][0][num] = row[1]
			//techNames = append(techNames, row[1])
			datasourceMaps[row[0]][1][num] = row[2]

			datasourceMaps[row[0]][2][num] = row[3]
			//ownerNames = append(ownerNames, row[3])

			if len(row) >= 5 {
				datasourceMaps[row[0]][3][num] = row[4]
				//departmentPaths = append(departmentPaths, row[4])
			}

			if len(row) >= 8 {
				subjectPath := path.Join(row[5], row[6], row[7])
				//subjectPaths = append(subjectPaths, subjectPath)
				datasourceMaps[row[0]][4][num] = subjectPath
			} else if len(row) >= 7 {
				subjectPath := path.Join(row[5], row[6])
				//subjectPaths = append(subjectPaths, subjectPath)
				datasourceMaps[row[0]][4][num] = subjectPath
			}
		}
	}

	formViews := make([]*model.FormView, 0)
	for k, v := range datasourceMaps {
		datasource, err := f.datasourceRepo.GetByName(ctx, k)
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		views, err := f.repo.GetViewsByDIdName(ctx, datasource.ID, v[0])
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		if len(v[0]) != len(views) {
			return nil, errorcode.Desc(my_errorcode.TechNameNotFound)
		}

		//find  owner name id
		ownerNames := util.DuplicateStringRemoval(v[2])
		userNameIdMap, err := f.userRepo.GetByUserMapByNames(ctx, ownerNames)
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}

		//verify owner
		if len(ownerNames) != len(userNameIdMap) {
			return nil, errorcode.Detail(my_errorcode.OwnerInfoError, "has owner not exist")
		}
		//for _, v2 := range userNameIdMap {
		//	if is, err := f.commonAuthService.MenuResourceActions(ctx, v2, common_middleware.DatasheetView); err != nil {
		//		return nil, err
		//	} else if !is.HasManageAction() {
		//		return nil, errorcode.Detail(my_errorcode.OwnerInfoError, fmt.Sprintf("%s not owner", v2))
		//	}
		//}

		//find  DepartmentPath  id
		departmentSlice := util.DuplicateStringRemoval(v[3])
		departmentPathIdMap, err := f.configurationCenterDriven.GetDepartmentByPath(ctx, &configuration_center.GetDepartmentByPathReq{
			Paths: departmentSlice,
		})
		if err != nil {
			return nil, err
		}
		//verify DepartmentPath
		if (len(departmentSlice) != 0 && departmentPathIdMap == nil) || len(departmentPathIdMap.Departments) != len(departmentSlice) {
			return nil, errorcode.Detail(my_errorcode.DepartmentPathError, "has Departments not exist")
		}

		//find  subjectPath  id
		subjectSlice := util.DuplicateStringRemoval(v[4])
		subjectPathIdMap, err := f.DrivenDataSubject.GetDataSubjectByPath(ctx, &data_subject.GetDataSubjectByPathReq{
			Paths: subjectSlice,
		})
		if err != nil {
			return nil, err
		}
		//verify subjectPath
		if (len(subjectSlice) != 0 && subjectPathIdMap == nil) || len(subjectPathIdMap.DataSubjects) != len(subjectSlice) {
			return nil, errorcode.Detail(my_errorcode.SubjectPathError, "has subject not exist")
		}

		//每个TechnicalName对应的属性
		businessNameMap := make(map[string]string)
		ownerMap := make(map[string]string)
		departmentMap := make(map[string]string)
		subjectMap := make(map[string]string)
		for i := 0; i < len(v[0]); i++ {
			businessNameMap[v[0][i]] = v[1][i]
			ownerMap[v[0][i]] = userNameIdMap[v[2][i]]
			if department := departmentPathIdMap.Departments[v[3][i]]; department != nil {
				departmentMap[v[0][i]] = department.ID
			}
			if subject := subjectPathIdMap.DataSubjects[v[4][i]]; subject != nil {
				subjectMap[v[0][i]] = subject.ID
			}
		}

		//赋值
		for _, view := range views {
			view.BusinessName = businessNameMap[view.TechnicalName]
			view.OwnerId = sql.NullString{String: ownerMap[view.TechnicalName], Valid: true}
			view.SubjectId.String = subjectMap[view.TechnicalName]
			view.SubjectId.Valid = true
			view.DepartmentId.String = departmentMap[view.TechnicalName]
			view.DepartmentId.Valid = true
		}
		formViews = append(formViews, views...)
	}

	res := &form_view.ExcelBatchPublishRes{
		SuccessUpdateView: make([]*form_view.SuccessView, 0),
		FailUpdateView:    make([]*form_view.FailView, 0),
	}

	//编辑基本信息
	f.BatchUpdateFormViewDetails(ctx, formViews, res)

	//发布
	publishRes := &form_view.BatchPublishRes{
		SuccessPublishView: make([]*form_view.SuccessView, 0),
		FailPublishView:    make([]*form_view.FailView, 0),
	}
	f.PublishViews(ctx, formViews, publishRes)
	res.BatchPublishRes = publishRes

	return res, nil
}

func (f *formViewUseCase) BatchUpdateFormViewDetails(ctx context.Context, views []*model.FormView, res *form_view.ExcelBatchPublishRes) {
	for _, view := range views {
		subjectId := view.SubjectId.String
		Owners := make([]*form_view.Owner, 0)
		for _, s := range strings.Split(view.OwnerId.String, constant.OwnerIdSep) {
			Owners = append(Owners, &form_view.Owner{OwnerID: s})
		}
		if err := f.UpdateFormViewDetails(ctx, &form_view.UpdateFormViewDetailsReq{
			IDReqParamPath: form_view.IDReqParamPath{
				ID: view.ID,
			},
			UpdateFormViewDetailsParamPath: form_view.UpdateFormViewDetailsParamPath{
				BusinessName: view.BusinessName,
				SubjectID:    subjectId,
				DepartmentID: view.DepartmentId.String,
				OwnerID:      strings.Split(view.OwnerId.String, constant.OwnerIdSep),
				Owners:       Owners,
			},
		}); err != nil {
			res.FailUpdateView = append(res.FailUpdateView, &form_view.FailView{ViewID: view.ID, TechnicalName: view.TechnicalName, Error: err.Error()})
			log.WithContext(ctx).Error("UpdateFormViewDetails Error", zap.Error(err))
			continue
		}
		res.SuccessUpdateView = append(res.SuccessUpdateView, &form_view.SuccessView{ViewID: view.ID, TechnicalName: view.TechnicalName, Id: view.ID})
	}
	res.SuccessUpdateViewCount = len(res.SuccessUpdateView)
	res.FailUpdateViewount = len(res.FailUpdateView)
}
func (f *formViewUseCase) BatchPublish(ctx context.Context, req *form_view.BatchPublishReq) (*form_view.BatchPublishRes, error) {
	res := &form_view.BatchPublishRes{
		SuccessPublishView: make([]*form_view.SuccessView, 0),
		FailPublishView:    make([]*form_view.FailView, 0),
	}
	for _, filter := range req.DatasourceFilter {
		datasource, err := f.datasourceRepo.GetByName(ctx, filter.DatasourceName)
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		views := make([]*model.FormView, 0)
		if len(filter.TechnicalName) != 0 {
			views, err = f.repo.GetViewsByDIdName(ctx, datasource.ID, filter.TechnicalName)
			if err != nil {
				return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
			}
			if len(filter.TechnicalName) != len(views) {
				return nil, errorcode.Desc(my_errorcode.TechNameNotFound)
			}
		} else {
			views, err = f.repo.GetViewsByDIdAndFilter(ctx, datasource.ID, filter)
			if err != nil {
				return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
			}
		}
		f.PublishViews(ctx, views, res)
	}
	return res, nil
}

func (f *formViewUseCase) PublishViews(ctx context.Context, views []*model.FormView, res *form_view.BatchPublishRes) {
	for _, view := range views {
		fieldList, err := f.fieldRepo.GetFormViewFieldList(ctx, view.ID)
		if err != nil {
			res.FailPublishView = append(res.FailPublishView, &form_view.FailView{ViewID: view.ID, TechnicalName: view.TechnicalName, Error: err.Error()})
			log.WithContext(ctx).Error("GetFormViewFieldList Error", zap.Error(err))
			continue
		}
		fields := make([]*form_view.Fields, len(fieldList))
		for i, field := range fieldList {
			fields[i] = &form_view.Fields{
				Id:           field.ID,
				BusinessName: field.BusinessName,
			}
		}

		publishReq := &form_view.UpdateReq{
			IDReqParamPath: form_view.IDReqParamPath{
				ID: view.ID,
			},
			UpdateReqParamBody: form_view.UpdateReqParamBody{
				BusinessName: view.BusinessName,
				Fields:       fields,
			},
		}

		if err = f.UpdateFormView(ctx, publishReq); err != nil {
			if err.Error() == my_errorcode.FormViewErrorMap[my_errorcode.FieldsBusinessNameRepeat].Description {
				f.FieldNameRepeatReplaceAll(ctx, view, fieldList, res) //retry
				continue
			}
			res.FailPublishView = append(res.FailPublishView, &form_view.FailView{ViewID: view.ID, TechnicalName: view.TechnicalName, Error: err.Error()})
			log.WithContext(ctx).Error("UpdateFormView Error", zap.Error(err))
			continue
		}
		res.SuccessPublishView = append(res.SuccessPublishView, &form_view.SuccessView{ViewID: view.ID, TechnicalName: view.TechnicalName, Id: view.ID})
	}
	res.SuccessPublishViewCount = len(res.SuccessPublishView)
	res.FailPublishViewCount = len(res.FailPublishView)
}

func (f *formViewUseCase) FieldNameRepeatReplaceAll(ctx context.Context, view *model.FormView, fieldList []*model.FormViewField, res *form_view.BatchPublishRes) {
	fields := make([]*form_view.Fields, len(fieldList))
	for i, field := range fieldList {
		fields[i] = &form_view.Fields{
			Id:           field.ID,
			BusinessName: util.CutStringByCharCount(field.BusinessName+field.TechnicalName, constant.BusinessNameCharCountLimit),
		}
	}
	publishReq := &form_view.UpdateReq{
		IDReqParamPath: form_view.IDReqParamPath{
			ID: view.ID,
		},
		UpdateReqParamBody: form_view.UpdateReqParamBody{
			BusinessName: view.BusinessName,
			Fields:       fields,
		},
	}
	if err := f.UpdateFormView(ctx, publishReq); err != nil {
		res.FailPublishView = append(res.FailPublishView, &form_view.FailView{ViewID: view.ID, TechnicalName: view.TechnicalName, Error: err.Error()})
		log.WithContext(ctx).Error("UpdateFormView Error", zap.Error(err))
		return
	}
	res.SuccessPublishView = append(res.SuccessPublishView, &form_view.SuccessView{ViewID: view.ID, TechnicalName: view.TechnicalName, Id: view.ID})
}
func (f *formViewUseCase) FieldNameRepeatReplace(ctx context.Context, err error, view *model.FormView, publishReq *form_view.UpdateReq, res *form_view.BatchPublishRes) {
	if value, ok := agerrors.Code(err).GetErrorDetails().(map[string]any); ok {
		if id, exist := value["form_view_field_id"]; exist {
			for i, field := range publishReq.Fields {
				if field.Id == id.(string) {
					publishReq.Fields[i].BusinessName = publishReq.Fields[i].BusinessName + "" //todo  field.BusinessName + field.TechnicalName
				}
				if err = f.UpdateFormView(ctx, publishReq); err == nil {
					res.SuccessPublishView = append(res.SuccessPublishView, &form_view.SuccessView{ViewID: view.ID, TechnicalName: view.TechnicalName, Id: view.ID})
					continue
				}
			}
		}

	}
	res.FailPublishView = append(res.FailPublishView, &form_view.FailView{ViewID: view.ID, TechnicalName: view.TechnicalName, Error: err.Error()})
	log.WithContext(ctx).Error("UpdateFormView Error", zap.Error(err))
}

// Deprecated: use formViewRepo
func (f *formViewUseCase) FormViewCreatePubES(ctx context.Context, id string, formViewESIndex es.FormViewESIndex) (err error) {
	var formViewESIndexByte []byte
	formViewESIndexByte, err = json.Marshal(formViewESIndex)
	if err != nil {
		log.WithContext(ctx).Error("FormView Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	} else {
		if err = f.kafkaPub.SyncProduce(constant.FormViewPublicTopic, util.StringToBytes(id), formViewESIndexByte); err != nil {
			log.WithContext(ctx).Error("FormView Public To ES Error", zap.Error(err))
		}
	}
	return nil
}

// Deprecated: use formViewRepo
func (f *formViewUseCase) FormViewDeletePubES(ctx context.Context, id string) (err error) {
	var formViewESIndexByte []byte
	formViewESIndex := es.FormViewESIndex{
		Type: "delete",
		Body: es.FormViewESIndexBody{
			DocID: id,
		},
	}
	formViewESIndexByte, err = json.Marshal(formViewESIndex)
	if err != nil {
		log.WithContext(ctx).Error("FormView Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	} else {
		if err = f.kafkaPub.SyncProduce(constant.FormViewPublicTopic, util.StringToBytes(id), formViewESIndexByte); err != nil {
			log.WithContext(ctx).Error("FormView Public To ES Error", zap.Error(err))
		}
	}
	return nil
}

func (f *formViewUseCase) CheckFinal(ctx context.Context, req *form_view.UpdateReq, fieldMap map[string]string) error {
	if req.BusinessName == "" {
		return errorcode.Desc(my_errorcode.FormViewBusinessNameEmpty)
	} /*
		formViewFields, err := f.repo.GetFormViewFieldListBusinessNameEmpty(ctx, req.ID)
		if err != nil {
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		for _, field := range formViewFields {
			if _, exist := fieldMap[field.ID]; !exist {
				return errorcode.Desc(my_errorcode.FormViewFieldBusinessNameEmpty)
			}
		}*/

	return nil
}
func (f *formViewUseCase) DeleteFormView(ctx context.Context, req *form_view.DeleteReq) error {
	logger := audit.FromContextOrDiscard(ctx)
	//f.SyncCCDataSourceOnce()
	formView, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return err
	}
	if formView.AuditStatus == constant.AuditStatusAuditing {
		return errorcode.Desc(my_errorcode.AuditStatusAuditingCannotDelete)
	}
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		err = f.DeleteDatasourceView(ctx, formView)
	case constant.FormViewTypeCustom.Integer.Int32():
		err = f.DeleteCustomAndLogicEntityView(ctx, constant.CustomViewSource+constant.CustomAndLogicEntityViewSourceSchema, formView)
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		err = f.DeleteCustomAndLogicEntityView(ctx, constant.LogicEntityViewSource+constant.CustomAndLogicEntityViewSourceSchema, formView)
	}
	if err != nil {

		return err
	}
	if err = f.esRepo.DeletePubES(ctx, formView.ID); err != nil { //视图删除
		return err
	}

	//删除可能存在关联的数据隐私策略
	dataPrivacyPolicy, err := f.dataPrivacyPolicyRepo.GetByFormViewId(ctx, formView.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
		} else {
			return errorcode.Detail(my_errorcode.DataPrivacyPolicyDatabaseError, err.Error())
		}
	}
	if dataPrivacyPolicy != nil {
		err = f.dataPrivacyPolicyRepo.Delete(ctx, dataPrivacyPolicy.ID)
		if err != nil {
			return err
		}
		err = f.dataPrivacyPolicyFieldRepo.DeleteByPolicyID(ctx, dataPrivacyPolicy.ID)
		if err != nil {
			return err
		}
	}

	go logger.Warn(api_audit_v1.OperationDeleteLogicView,
		&form_view.LogicViewSimpleResourceObject{
			Name:       formView.BusinessName,
			FormViewID: formView.ID,
		})
	return nil
}
func (f *formViewUseCase) DeleteCustomAndLogicEntityView(ctx context.Context, catalogName string, formView *model.FormView) error {
	var err error
	if err = f.DrivenVirtualizationEngine.DeleteView(ctx, &virtualization_engine.DeleteViewReq{
		CatalogName: catalogName,
		ViewName:    formView.TechnicalName,
	}); err != nil {
		if err.Error() != "视图表不存在" && !strings.Contains(err.Error(), "视图不存在") && agerrors.Code(err).GetErrorCode() != "VirtualizationEngine.ViewNotExist." {
			return err
		}
		log.WithContext(ctx).Error("DeleteCustomAndLogicEntityView error : VirtualizationEngine.NotExist. 视图表不存在", zap.Error(err))
	}
	if err = f.repo.DeleteCustomOrLogicEntityViewTransaction(ctx, formView.ID); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}
func (f *formViewUseCase) DeleteDatasourceView(ctx context.Context, formView *model.FormView) error {
	//dataSource, err := f.configurationCenterDriven.GetDataSourcePrecision(ctx, []string{formView.DatasourceID})
	dataSource, err := f.datasourceRepo.GetByIdWithCode(ctx, formView.DatasourceID)
	if err != nil {
		return err
	}

	switch dataSource.TypeName {
	case constant.ExcelTypeName:
		_, err = f.DrivenVirtualizationEngine.DeleteExcelView(ctx, &virtualization_engine.DeleteExcelViewReq{
			VdmCatalog: strings.TrimSuffix(dataSource.DataViewSource, constant.DefaultViewSourceSchema),
			Schema:     constant.ViewSourceSchema,
			View:       formView.TechnicalName,
		})
	default:
		//err = f.DrivenVirtualizationEngine.DeleteView(ctx, &virtualization_engine.DeleteViewReq{
		//	CatalogName: dataSource.DataViewSource,
		//	ViewName:    formView.TechnicalName,
		//})
		err = f.DrivenMdlDataModel.DeleteDataView(ctx, formView.MdlID)
	}
	if err != nil {
		if err.Error() != "视图表不存在" && !strings.Contains(err.Error(), "视图不存在") && agerrors.Code(err).GetErrorCode() != "VirtualizationEngine.ViewNotExist." {
			return err
		}
		log.WithContext(ctx).Error("DeleteDatasourceView error : VirtualizationEngine.NotExist. VirtualizationEngine.ViewNotExist  视图表不存在 视图不存在", zap.Error(err))
	}

	if err = f.repo.DeleteDatasourceViewTransaction(ctx, formView.ID, formView.DatasourceID); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}
func (f *formViewUseCase) DeleteDatasourceClearFormView(ctx context.Context, datasourceId string) error {
	log.WithContext(ctx).Infof("【MQ Datasource】 DeleteDatasourceClearFormView: %v", datasourceId)
	dataSource, err := f.datasourceRepo.GetById(ctx, datasourceId)
	if err != nil {
		log.WithContext(ctx).Errorf("mq delete datasource datasource GetById error: %s ,datasource id: %s", err.Error(), datasourceId)
		return err
	}
	formViews, err := f.repo.GetFormViewList(ctx, datasourceId)
	if err != nil {
		log.WithContext(ctx).Errorf("mq delete datasource GetFormViewList error: %s,datasource id: %s", err.Error(), datasourceId)
	}

	for _, formView := range formViews {
		if err = f.DrivenVirtualizationEngine.DeleteView(ctx, &virtualization_engine.DeleteViewReq{
			CatalogName: dataSource.DataViewSource,
			ViewName:    formView.TechnicalName,
		}); err != nil {
			if err.Error() != "视图表不存在" && !strings.Contains(err.Error(), "视图不存在") && agerrors.Code(err).GetErrorCode() != "VirtualizationEngine.ViewNotExist." {
				log.WithContext(ctx).Errorf("mq delete datasource DrivenVirtualizationEngine DeleteView error: %s", err.Error())
				continue
			}
			log.WithContext(ctx).Error("DeleteDatasourceView error : VirtualizationEngine.NotExist. VirtualizationEngine.ViewNotExist  视图表不存在 视图不存在", zap.Error(err))
		}
		if err = f.repo.DeleteDatasourceViewTransaction(ctx, formView.ID, formView.DatasourceID); err != nil {
			log.WithContext(ctx).Errorf("mq delete datasource DeleteTransaction error: %s", err.Error())
			continue
		}
		err = f.esRepo.DeletePubES(ctx, formView.ID) //数据源删除
		if err != nil {
			log.Error("logicViewRepo PubToES failed,err:", zap.Error(err))
		}
	}

	if dataSource.DataViewSource != "" {
		if err = f.DrivenVirtualizationEngine.DeleteDataSource(ctx, &virtualization_engine.DeleteDataSourceReq{
			CatalogName: strings.TrimSuffix(dataSource.DataViewSource, constant.DefaultViewSourceSchema),
		}); err != nil {
			log.WithContext(ctx).Errorf("mq delete datasource DrivenVirtualizationEngine DeleteDataSource error: %s", err.Error())
			return err
		}
	}

	if err = f.datasourceRepo.DeleteDataSource(ctx, datasourceId); err != nil {
		log.WithContext(ctx).Errorf("mq delete datasource DeleteDataSource error: %s", err.Error())
		return err
	}
	if err = f.scanRecordRepo.DeleteByDataSourceId(ctx, datasourceId); err != nil {
		log.WithContext(ctx).Errorf("mq delete datasource scanRecord error: %s", err.Error())
		return err
	}

	return nil
}

func (f *formViewUseCase) GetMultiViewsFields(ctx context.Context, ids []string) (*form_view.GetMultiViewsFieldsRes, error) {
	views, err := f.repo.GetByIds(ctx, ids)
	if err != nil {
		return nil, err
	}
	if len(views) != len(ids) {
		return nil, errorcode.Desc(my_errorcode.LogicViewNotFound)
	}
	res := make([]*form_view.LogicViewFields, len(ids), len(ids))
	for i, view := range views {
		source, err := f.GetViewSource(ctx, view.Type, view.DatasourceID)
		if err != nil {
			return nil, err
		}
		res[i] = &form_view.LogicViewFields{
			ID:                    view.ID,
			TechnicalName:         view.TechnicalName,
			BusinessName:          view.BusinessName,
			UniformCatalogCode:    view.UniformCatalogCode,
			ViewSourceCatalogName: source,
		}
		fields, err := f.fieldRepo.GetFields(ctx, &form_view.GetFieldsReq{
			IDReqParamPath: form_view.IDReqParamPath{
				ID: view.ID,
			},
		})
		if err != nil {
			return nil, err
		}
		// 批量获取属性信息
		attributeInfoMap, err := f.GetAttributInfos(ctx, fields)
		if err != nil {
			return nil, err
		}

		codeTableSlice := make([]string, 0)
		standardCodeSlice := make([]string, 0)
		fieldList := make([]*form_view.FieldsRes, len(fields))
		for j, field := range fields {
			fieldList[j] = f.AssignField(ctx, field, &codeTableSlice, &standardCodeSlice)
			if field.SubjectID != nil && *field.SubjectID != "" {
				attributeId := *field.SubjectID
				_, ok := attributeInfoMap[attributeId]
				if ok {
					fieldList[j].AttributeName = attributeInfoMap[attributeId].Name
					fieldList[j].AttributePath = attributeInfoMap[attributeId].PathName
					fieldList[j].LabelID = attributeInfoMap[attributeId].LabelId
					fieldList[j].LabelName = attributeInfoMap[attributeId].LabelName
					fieldList[j].LabelIcon = attributeInfoMap[attributeId].LabelIcon
					fieldList[j].LabelPath = attributeInfoMap[attributeId].LabelPath
					fieldList[j].AttributeID = field.SubjectID
					fieldList[j].ClassfityType = field.ClassifyType
				}
			}
		}
		if err = f.AssignStandard(ctx, &fieldList, standardCodeSlice); err != nil {
			return nil, err
		}
		if err = f.AssignCodeTable(ctx, &fieldList, codeTableSlice); err != nil {
			return nil, err
		}
		res[i].Fields = fieldList
	}

	return &form_view.GetMultiViewsFieldsRes{
		LogicViews: res,
	}, nil
}

func (f *formViewUseCase) GetViewSource(ctx context.Context, viewType int32, datasourceId string) (viewSource string, err error) {
	switch viewType {
	case constant.FormViewTypeDatasource.Integer.Int32():
		var datasource *model.Datasource
		datasource, err = f.datasourceRepo.GetByIdWithCode(ctx, datasourceId)
		if err != nil {
			return "", err
		}
		viewSource = datasource.DataViewSource
	case constant.FormViewTypeCustom.Integer.Int32():
		viewSource = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		viewSource = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	}
	return
}

func (f *formViewUseCase) GetViewBasicInfoByName(ctx context.Context, req *form_view.GetViewBasicInfoByNameReqParam) (*form_view.GetViewFieldsResp, error) {
	//step1: 查逻辑视图
	formViewList, err := f.repo.GetViewsByDIdName(ctx, req.DatasourceID, []string{req.Name})
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(formViewList) <= 0 {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	formView := formViewList[0]
	//step2: 查字段
	fields, err := f.fieldRepo.GetFormViewFields(ctx, formView.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//step3: 组装
	viewResult := &form_view.GetViewFieldsResp{
		FormViewID:    formView.ID,
		TechnicalName: formView.TechnicalName,
		BusinessName:  formView.BusinessName,
	}
	for _, field := range fields {
		//组合字段信息
		fieldResult := &form_view.SimpleViewField{
			ID:               field.ID,
			BusinessName:     field.BusinessName,
			TechnicalName:    field.TechnicalName,
			PrimaryKey:       field.PrimaryKey.Bool,
			Comment:          field.Comment.String,
			DataType:         field.DataType,
			DataLength:       field.DataLength,
			OriginalDataType: field.OriginalDataType,
			DataAccuracy:     field.DataAccuracy.Int32,
			IsNullable:       field.IsNullable,
			StandardCode:     field.StandardCode.String,
			StandardName:     field.StandardName.String,
			CodeTableID:      field.CodeTableID.String,
			Index:            field.Index,
		}
		viewResult.Fields = append(viewResult.Fields, fieldResult)
	}
	return viewResult, nil
}

func (f *formViewUseCase) GetViewsFields(ctx context.Context, req *form_view.GetViewsFieldsReqParameter) ([]*form_view.GetViewFieldsResp, error) {
	views, err := f.repo.GetByIds(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	viewDict := lo.SliceToMap(views, func(item *model.FormView) (string, *model.FormView) {
		return item.ID, item
	})
	fields, err := f.fieldRepo.GetFieldsByFormViewIds(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	results := make([]*form_view.GetViewFieldsResp, 0, len(views))
	indexDict := make(map[string]int)
	for _, field := range fields {
		view, ok := viewDict[field.FormViewID]
		if !ok {
			continue
		}
		index, recorded := indexDict[field.FormViewID]
		if !recorded {
			viewResult := &form_view.GetViewFieldsResp{
				FormViewID:    view.ID,
				TechnicalName: view.TechnicalName,
				BusinessName:  view.BusinessName,
			}
			results = append(results, viewResult)
			indexDict[view.ID] = len(results) - 1
			index = len(results) - 1
		}
		viewResult := results[index]
		//组合字段信息
		fieldResult := &form_view.SimpleViewField{
			ID:               field.ID,
			BusinessName:     field.BusinessName,
			TechnicalName:    field.TechnicalName,
			PrimaryKey:       field.PrimaryKey.Bool,
			Comment:          field.Comment.String,
			DataType:         field.DataType,
			DataLength:       field.DataLength,
			OriginalDataType: field.OriginalDataType,
			DataAccuracy:     field.DataAccuracy.Int32,
			IsNullable:       field.IsNullable,
			StandardCode:     field.StandardCode.String,
			StandardName:     field.StandardName.String,
			CodeTableID:      field.CodeTableID.String,
			Index:            field.Index,
		}
		viewResult.Fields = append(viewResult.Fields, fieldResult)
	}
	return results, nil
}

func (f *formViewUseCase) GetFields(ctx context.Context, req *form_view.GetFieldsReq) (*form_view.GetFieldsRes, error) {
	//f.SyncCCDataSourceOnce()

	formView, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	totalRes, err := f.AssembleTotalRes(ctx, formView)
	if err != nil {
		return nil, err
	}

	fields, err := f.fieldRepo.GetFields(ctx, req)
	if err != nil {
		return nil, err
	}

	// 批量获取字段级探查规则
	fieldIds := make([]string, 0, len(fields))
	for _, field := range fields {
		fieldIds = append(fieldIds, field.ID)
	}
	rules, err := f.exploreRuleConfigRepo.GetByFieldIds(ctx, fieldIds)
	if err != nil {
		return nil, err
	}
	type ruleStat struct {
		total   int
		enabled int
	}
	fieldRuleStatMap := make(map[string]*ruleStat, len(fieldIds))
	for _, rule := range rules {
		if rule.FieldID == "" {
			continue
		}
		stat, ok := fieldRuleStatMap[rule.FieldID]
		if !ok {
			stat = &ruleStat{}
			fieldRuleStatMap[rule.FieldID] = stat
		}
		stat.total++
		if rule.Enable == 1 {
			stat.enabled++
		}
	}

	// 批量获取属性信息
	attributeInfoMap, err := f.GetAttributInfos(ctx, fields)
	if err != nil {
		return nil, err
	}

	// 批量获取标签
	labelIds := make([]string, 0)
	for _, field := range fields {
		if field.GradeID.Valid && field.GradeID.Int64 > 0 {
			labelIds = append(labelIds, strconv.Itoa(int(field.GradeID.Int64)))
		}
	}
	labelIds = util.DuplicateStringRemoval(labelIds)
	labelInfoMap := make(map[string]*configuration_center.GetLabelByIdRes)
	if len(labelIds) > 0 {
		labelInfos, err := f.configurationCenterDriven.GetLabelByIds(ctx, strings.Join(labelIds, ","))
		if err != nil {
			return nil, err
		}
		for _, label := range labelInfos.Entries {
			labelInfoMap[label.ID] = label
		}
	}

	res := make([]*form_view.FieldsRes, len(fields), len(fields))
	codeTableSlice := make([]string, 0)
	standardCodeSlice := make([]string, 0)
	for i, field := range fields {
		res[i] = f.AssignField(ctx, field, &codeTableSlice, &standardCodeSlice)
		// 获取字段已启用的探查规则条数和字段级规则总数（使用批量查询结果）
		if stat, ok := fieldRuleStatMap[field.ID]; ok {
			res[i].EnableRules = stat.enabled
			res[i].TotalRules = stat.total
		}

		if field.SubjectID != nil && *field.SubjectID != "" {
			attributeId := *field.SubjectID
			_, ok := attributeInfoMap[attributeId]
			if ok {
				res[i].AttributeName = attributeInfoMap[attributeId].Name
				res[i].AttributePath = attributeInfoMap[attributeId].PathName
				// res[i].LabelID = attributeInfoMap[attributeId].LabelId
				// res[i].LabelName = attributeInfoMap[attributeId].LabelName
				// res[i].LabelIcon = attributeInfoMap[attributeId].LabelIcon
				// res[i].LabelPath = attributeInfoMap[attributeId].LabelPath
				res[i].AttributeID = field.SubjectID
				res[i].ClassfityType = field.ClassifyType
				if field.GradeType.Valid {
					gradeVal := int(field.GradeType.Int32)
					res[i].GradeType = &gradeVal
				}
				res[i].Comment = field.Comment.String
			}
		}

		if field.GradeID.Valid && field.GradeID.Int64 > 0 {
			labelId := strconv.Itoa(int(field.GradeID.Int64))
			labelInfo, ok := labelInfoMap[labelId]
			if ok {
				res[i].LabelID = labelInfo.ID
				res[i].LabelName = labelInfo.Name
				res[i].LabelIcon = labelInfo.LabelIcon
				res[i].LabelPath = labelInfo.LabelPath
			}
		}

		if formView.Type == constant.FormViewTypeDatasource.Integer.Int32() {
			res[i].Status = enum.ToString[constant.FormViewFieldScanStatus](field.Status)
		}
	}
	if err = f.AssignStandard(ctx, &res, standardCodeSlice); err != nil {
		return nil, err
	}
	if err = f.AssignCodeTable(ctx, &res, codeTableSlice); err != nil {
		return nil, err
	}

	// 过滤开启数据保护查询字段
	res, err = f.filterDataProtectionFields(ctx, res, req.EnableDataProtection)
	if err != nil {
		return nil, err
	}

	// 补全当前用户是否拥有逻辑视图各字段的权限
	if err := f.completeFormViewFieldPermissions(ctx, formView, res); err != nil {
		log.Warn("complete from view field permission failed", zap.Error(err))
	}
	// 补全用户的视图权限action
	totalRes.CanAuth, err = f.youCanAuth(ctx, formView)
	if err != nil {
		log.Warn("get data view actions failed", zap.Error(err))
	}

	if formView.ExploreJobId != nil {
		totalRes.ExploreJobId = *formView.ExploreJobId
	}
	if formView.ExploreJobVer != nil {
		totalRes.ExploreJobVer = *formView.ExploreJobVer
	}
	// 检查是否收藏
	err1, resp := f.CheckFavorite(ctx, formView)
	if err1 != nil {
		return nil, err1
	}
	if resp != nil {
		if resp.FavorID == 0 {
			totalRes.IsFavored = false
		} else {
			totalRes.IsFavored = true
			totalRes.FavorID = resp.FavorID
		}
	} else {
		totalRes.IsFavored = false
	}

	// 获取目录提供方路径：根据 department_id 查询部门接口获取 path（与 logic_view 保持一致的取数方式）
	if formView.DepartmentId.String != "" {
		res, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{formView.DepartmentId.String})
		if err != nil {
			log.WithContext(ctx).Warn("get department path failed", zap.Error(err))
		} else if res != nil && len(res.Departments) > 0 {
			totalRes.CatalogProviderPath = res.Departments[0].Path
		}
	}

	sort.Sort(form_view.ByIndex(res))
	totalRes.FieldsRes = res
	return totalRes, nil
}

func (f *formViewUseCase) AssembleTotalRes(ctx context.Context, formView *model.FormView) (*form_view.GetFieldsRes, error) {
	var lastPublishTime int64
	if formView.PublishAt != nil {
		lastPublishTime = formView.PublishAt.UnixMilli()
	}
	totalRes := &form_view.GetFieldsRes{
		LastPublishTime:    lastPublishTime,
		UniformCatalogCode: formView.UniformCatalogCode,
		TechnicalName:      formView.TechnicalName,
		BusinessName:       formView.BusinessName,
		OriginalName:       formView.OriginalName,
		Status:             enum.ToString[constant.FormViewScanStatus](formView.Status),
		EditStatus:         enum.ToString[constant.FormViewEditStatus](formView.EditStatus),
		Type:               enum.ToString[constant.FormViewType](formView.Type),
		UpdateCycle:        formView.UpdateCycle,
		SharedType:         formView.SharedType,
		OpenType:           formView.OpenType,
	}
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, formView.DatasourceID)
		if err != nil {
			log.WithContext(ctx).Warn("AssembleTotalRes etByIdWithCode failed", zap.Error(err))
			return totalRes, nil
		}
		totalRes.DatasourceId = datasource.ID
		totalRes.DatasourceType = datasource.TypeName
		totalRes.ViewSourceCatalogName = datasource.DataViewSource
		totalRes.DatabaseName = datasource.DatabaseName
	case constant.FormViewTypeCustom.Integer.Int32():
		totalRes.ViewSourceCatalogName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		totalRes.ViewSourceCatalogName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	}
	return totalRes, nil
}

func (f *formViewUseCase) AssignField(ctx context.Context, field *model.FormViewField, codeTableSlice *[]string, standardCodeSlice *[]string) *form_view.FieldsRes {
	res := &form_view.FieldsRes{
		ID:                  field.ID,
		TechnicalName:       field.TechnicalName,
		BusinessName:        field.BusinessName,
		OriginalName:        field.OriginalName,
		Comment:             field.Comment.String,
		PrimaryKey:          field.PrimaryKey.Bool,
		DataType:            field.DataType,
		DataLength:          field.DataLength,
		DataAccuracy:        field.DataAccuracy.Int32,
		OriginalDataType:    field.OriginalDataType,
		IsNullable:          field.IsNullable,
		BusinessTimestamp:   field.BusinessTimestamp,
		StandardCode:        field.StandardCode.String,
		CodeTableID:         field.CodeTableID.String,
		ResetBeforeDataType: field.ResetBeforeDataType.String,
		ResetConvertRules:   field.ResetConvertRules.String,
		ResetDataLength:     field.ResetDataLength.Int32,
		ResetDataAccuracy:   field.ResetDataAccuracy.Int32,
		SimpleType:          constant.SimpleTypeMapping[field.DataType],
		SharedType:          field.SharedType,
		OpenType:            field.OpenType,
		SensitiveType:       field.SensitiveType,
		SecretType:          field.SecretType,
	}
	if field.GradeID.Valid && field.GradeID.Int64 > 0 {
		res.LabelID = strconv.Itoa(int(field.GradeID.Int64))
	}
	if field.CodeTableID.String != "" && res.CodeTable == "" { //使用非标准带的码表
		*codeTableSlice = append(*codeTableSlice, field.CodeTableID.String)
	}
	if field.StandardCode.String != "" {
		*standardCodeSlice = append(*standardCodeSlice, field.StandardCode.String)
	}
	return res
}
func (f *formViewUseCase) AssignCodeTable(ctx context.Context, res *[]*form_view.FieldsRes, fieldSlice []string) (err error) {
	data := make(map[string]standardization.DictResp)
	if len(fieldSlice) > 0 {
		if data, err = f.standardDriven.GetStandardDict(ctx, fieldSlice); err != nil {
			return err
		}
	}
	for _, fieldsRes := range *res {
		if fieldsRes.CodeTableID != "" && fieldsRes.CodeTable == "" { //使用非标准带的码表
			if value, ok := data[fieldsRes.CodeTableID]; ok {
				fieldsRes.CodeTable = value.NameZh
				fieldsRes.CodeTableStatus = util.CE(value.Deleted, "deleted", value.State).(string)
			}
		}
	}
	return
}

func (f *formViewUseCase) AssignStandard(ctx context.Context, res *[]*form_view.FieldsRes, fieldSlice []string) (err error) {
	data := make(map[string]*standardization.DataResp)
	if len(fieldSlice) > 0 {
		if data, err = f.standardDriven.GetStandardMapByCode(ctx, fieldSlice...); err != nil {
			return err
		}
	}
	for _, fieldsRes := range *res {
		if standardInfo, exist := data[fieldsRes.StandardCode]; exist {
			fieldsRes.Standard = standardInfo.NameCn
			fieldsRes.StandardType = strconv.Itoa(standardInfo.DataType) //0也是一种类型，故用字符串区分 "0" 和 ""
			fieldsRes.StandardTypeName = standardInfo.DataTypeName
			fieldsRes.StandardStatus = util.CE(standardInfo.Deleted, "deleted", standardInfo.State).(string)
			if standardInfo.DictID != "" {
				fieldsRes.CodeTableID = standardInfo.DictID
				fieldsRes.CodeTable = standardInfo.DictNameCN
				fieldsRes.CodeTableStatus = util.CE(standardInfo.DictDeleted, "deleted", standardInfo.DictState).(string)
			}
		}

	}
	return
}

func (f *formViewUseCase) GetAttributInfos(ctx context.Context, fields []*model.FormViewField) (map[string]form_view.AttributeInfo, error) {
	var labelIds []string
	for _, field := range fields {
		if field.SubjectID != nil && *field.SubjectID != "" {
			labelIds = append(labelIds, *field.SubjectID)
		}
	}

	labelIds = util.DuplicateRemoval(labelIds)
	attributeInfoMap := make(map[string]form_view.AttributeInfo, 0)
	if len(labelIds) > 0 {
		attributeInfos, err := f.DrivenDataSubjectNG.GetAttributeByIds(ctx, labelIds)
		if err != nil {
			return nil, err
		}
		for _, tempAttributeInfo := range attributeInfos.Attributes {
			attributeInfoMap[tempAttributeInfo.ID] = form_view.AttributeInfo{
				AttributeID: tempAttributeInfo.ID,
				Name:        tempAttributeInfo.Name,
				PathName:    tempAttributeInfo.PathName,
				LabelName:   tempAttributeInfo.LabelName,
				LabelId:     tempAttributeInfo.LabelId,
				LabelIcon:   tempAttributeInfo.LabelIcon,
				LabelPath:   tempAttributeInfo.LabelPath,
			}
		}
	}
	return attributeInfoMap, nil
}

func (f *formViewUseCase) GetAttributeInfos(ctx context.Context, labelIds []string) (map[string]form_view.AttributeInfo, error) {
	labelIds = util.DuplicateRemoval(labelIds)
	attributeInfoMap := make(map[string]form_view.AttributeInfo, 0)
	if len(labelIds) > 0 {
		attributeInfos, err := f.DrivenDataSubjectNG.GetAttributeByIds(ctx, labelIds)
		if err != nil {
			return nil, err
		}
		for _, tempAttributeInfo := range attributeInfos.Attributes {
			attributeInfoMap[tempAttributeInfo.ID] = form_view.AttributeInfo{
				AttributeID: tempAttributeInfo.ID,
				Name:        tempAttributeInfo.Name,
				PathName:    tempAttributeInfo.PathName,
				LabelName:   tempAttributeInfo.LabelName,
				LabelId:     tempAttributeInfo.LabelId,
				LabelIcon:   tempAttributeInfo.LabelIcon,
				LabelPath:   tempAttributeInfo.LabelPath,
			}
		}
	}
	return attributeInfoMap, nil
}

func (f *formViewUseCase) NameRepeat(ctx context.Context, req *form_view.NameRepeatReq) (exist bool, err error) {
	switch req.Type {
	case constant.FormViewTypeDatasource.String:
		if req.DatasourceID == "" {
			return false, errorcode.Desc(my_errorcode.DatasourceViewNameRepeatDatasourceRequire)
		}
		exist, err = f.repo.DataSourceViewNameExist(ctx, &model.FormView{
			ID:           req.FormID,
			DatasourceID: req.DatasourceID,
		}, req.Name)
		if err != nil {
			return false, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
	case constant.FormViewTypeCustom.String, constant.FormViewTypeLogicEntity.String:
		if req.NameType == "" {
			return false, errorcode.Desc(my_errorcode.CustomAndLogicEntityViewNameRepeatNameTypeRequire)
		}
		exist, err = f.repo.CustomLogicEntityViewNameExist(ctx, req.Type, req.FormID, req.Name, req.NameType)
		if err != nil {
			return false, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
	}
	return
}

func (f *formViewUseCase) GetUserAuthedViews(ctx context.Context, req *form_view.GetUsersFormViewsReq) (map[string]sets.Set[string], map[string][]*auth_service.Entries, error) {
	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, nil, err
	}
	// 访问者，用于鉴权
	subject, err := interception.AuthServiceSubjectFromContext(ctx)
	if err != nil {
		return nil, nil, err
	}
	switch userInfo.UserType {
	case interception.TokenTypeUser:
		if req.AppId != "" {
			// 校验user是否拥有app权限
			var appList *configuration_center.AppList
			if appList, err = f.configurationCenterDriven.HasAccessPermissionApps(ctx); err != nil {
				return nil, nil, err
			}
			if !appList.CheckAppIDExists(req.AppId) {
				return nil, nil, errorcode.Desc(my_errorcode.UserGetAppsNotAllowed)
			}
			subject = &auth_service_v1.Subject{
				Type: auth_service_v1.SubjectAPP,
				ID:   req.AppId,
			}
		}
	case interception.TokenTypeClient:
		req.AppId = userInfo.ID
	}
	req.OwnerId = userInfo.ID

	// 访问者可以对逻辑视图执行的动作，包括已经过期的权限。Key 是逻辑视图的
	// ID，Value 是可以执行的动作的集合。
	//  1. 访问者可以对逻辑视图整表的动作
	//  2. 访问者对逻辑视图至少一个子视图（行列规则）执行的动作
	var formViewActions = make(map[string]sets.Set[string])
	// 访问者对逻辑视图及其子视图的权限是否过期
	var formViewIsExpired = make(map[string]bool)
	// 访问者对逻辑视图及其子视图（行列规则）的权限规则，根据逻辑视图、子视图
	// （行列规则）所属逻辑视图分组
	var objectsGroupedByFormView = make(map[string][]*auth_service.Entries)

	// 获取访问者对逻辑视图、子视图（行列规则）的权限规则列表。列表包括已经
	// 过期的权限规则。
	res, err := f.DrivenAuthService.GetUsersObjects(ctx, &auth_service.GetUsersObjectsReq{
		ObjectType:  strings.Join([]string{auth_service.ObjectTypeDataView, auth_service.ObjectTypeSubView}, ","),
		SubjectId:   subject.ID,
		SubjectType: string(subject.Type),
	})
	if err != nil {
		return nil, nil, err
	}
	// 根据所属逻辑视图分组，非逻辑视图、子视图（行列规则）或获取子视图（行
	// 列规则）所属逻辑视图失败，所属逻辑视图 ID 视为 ""
	objectsGroupedByFormView = lo.GroupBy(res.EntriesList, func(item *auth_service.Entries) string {
		switch item.ObjectType {
		// 逻辑视图，返回 ID
		case auth_service.ObjectTypeDataView:
			return item.ObjectId
		// 子视图，返回所属逻辑视图的 ID
		case auth_service.ObjectTypeSubView:
			id, err := uuid.Parse(item.ObjectId)
			if err != nil {
				return ""
			}
			// 获取子视图（行列规则）所属逻辑视图的 ID
			logicViewID, err := f.subViewRepo.GetLogicViewID(ctx, id)
			if err != nil {
				return ""
			}
			return logicViewID.String()
		default:
			return ""
		}
	})

	totalObjectIDSlice := make([]string, 0)
	for formViewID, objects := range objectsGroupedByFormView {
		if formViewID == "" {
			continue
		}
		for _, o := range objects {
			if o.ObjectType != auth_service.ObjectTypeDataView && o.ObjectType != auth_service.ObjectTypeSubView {
				continue
			}
			totalObjectIDSlice = append(totalObjectIDSlice, o.ObjectId)
		}
	}
	ownedIDSlice, err := f.repo.GetFormViewIDByOwnerID(ctx, req.OwnerId)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	totalObjectIDSlice = append(totalObjectIDSlice, ownedIDSlice...)
	//查询是否过期
	expiredDict := make(map[string]bool)
	if len(totalObjectIDSlice) > 0 {
		expiredViewSlice, err := f.commonAuthService.FilterPolicyHasExpiredObjects(ctx, totalObjectIDSlice...)
		if err != nil {
			return nil, nil, err
		}
		expiredDict = lo.SliceToMap(expiredViewSlice, func(item string) (string, bool) {
			return item, true
		})
	}

	expiredViewDict := make(map[string]bool)
	for _, id := range ownedIDSlice {
		expiredViewDict[id] = expiredDict[id]
	}
	for formViewID, objects := range objectsGroupedByFormView {
		// 忽略逻辑视图 ID 为空
		if formViewID == "" {
			continue
		}
		for _, o := range objects {
			// 忽略非逻辑视图或子视图（行列规则）
			if o.ObjectType != auth_service.ObjectTypeDataView && o.ObjectType != auth_service.ObjectTypeSubView {
				continue
			}
			if expiredDict[formViewID] {
				expiredViewDict[formViewID] = true
			}
			if expiredDict[o.ObjectId] {
				expiredViewDict[formViewID] = true
			}
			for _, p := range o.PermissionsList {
				// 忽略非“允许”的规则
				if p.Effect != auth_service.Effect_Allow {
					continue
				}
				if formViewActions[formViewID] == nil {
					formViewActions[formViewID] = make(sets.Set[string])
				}
				formViewActions[formViewID].Insert(p.Action)
			}
			// 存在过期时间，且早于当前时间，视为已过期
			formViewIsExpired[formViewID] = formViewIsExpired[formViewID] || (o.ExpiredAt != nil && f.clock.Now().After(o.ExpiredAt.Time))
		}
	}

	// 页面显示的逻辑视图 ID 列表。用户拥有这些逻辑视图或其至少一个子视图
	// （行列规则）的 download 或 read 权限。
	allowActions := []string{auth_service.Action_Download, auth_service.Action_Read, auth_service.Action_Auth, auth_service.Action_Allocate}
	if req.Owner {
		allowActions = []string{auth_service.Action_Auth, auth_service.Action_Allocate}
	}
	req.ViewIds = lo.Filter(lo.Keys(formViewActions), func(id string, _ int) bool {
		return formViewActions[id].HasAny(allowActions...)
	})
	if req.Owner {
		req.ViewIds = append(req.ViewIds, ownedIDSlice...)
	}

	// 根据权限规则的过期时间过滤
	if req.PolicyStatus != "" {
		req.ViewIds = lo.Filter(req.ViewIds, func(id string, _ int) bool {
			switch req.PolicyStatus {
			case form_view.PolicyActive:
				return !expiredViewDict[id]
			case form_view.PolicyExpired:
				return expiredViewDict[id]
			default:
				return false
			}
		})
	}
	// 为了分页查询结果稳定，对 req.ViewIds 排序
	sort.Strings(req.ViewIds)
	return formViewActions, objectsGroupedByFormView, nil
}

func (f *formViewUseCase) GetUsersFormViews(ctx context.Context, req *form_view.GetUsersFormViewsReq) (*form_view.GetUsersFormViewsPageRes, error) {
	if req.OrgCode != "" && req.OrgCode != constant.UnallocatedId {
		req.SubDepartmentIDs = []string{req.OrgCode}
		departmentList, err := f.configurationCenterDriven.GetDepartmentList(ctx, configuration_center.QueryPageReqParam{Offset: 1, Limit: 0, ID: req.OrgCode}) //limit 0 Offset 1 not available
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			req.SubDepartmentIDs = append(req.SubDepartmentIDs, entry.ID)
		}
	}
	usingType, err := f.configurationCenterDriven.GetUsingType(ctx)
	if err != nil {
		return nil, err
	}
	if usingType == 2 { //数据资源模式 仅显示已上线的资源
		req.LineStatus = []string{constant.LineStatusOnLine, constant.LineStatusDownAuditing, constant.LineStatusDownReject}
	}

	var formViews []*model.FormView
	var total int64

	//查询用户可授权的视图ID
	formViewActions, objectsGroupedByFormView, err := f.GetUserAuthedViews(ctx, req)
	if err != nil {
		return nil, err
	}

	total, formViews, err = f.repo.GetByOwnerOrIdsPages(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	//获取用户名 及数据源名
	uids, dids, subjectIds, departIds := f.LoopId(formViews)
	//usersMap, err := f.userRepo.GetByUserMapByIds(ctx, util.DuplicateStringRemoval(uids))
	usersMap, err := f.GetByUserMapByIds(ctx, uids)
	if err != nil {
		return nil, err
	}
	datasourceMap, err := f.GetDatasourceMap(ctx, dids)
	if err != nil {
		return nil, err
	}
	//获取所属主题map
	subjectNameMap, subjectPathIdMap, subjectPathMap, err := f.GetSubjectNameAndPathMap(ctx, subjectIds)
	if err != nil {
		return nil, err
	}
	//获取所属主题map
	departmentNameMap, departmentPathMap, err := f.GetDepartmentNameAndPathMap(ctx, departIds)
	if err != nil {
		return nil, err
	}

	userFormViews := make([]*form_view.UsersFormView, len(formViews), len(formViews))
	for i, formView := range formViews {
		userFormViews[i] = &form_view.UsersFormView{
			FormView:      &form_view.FormView{},
			AllowDownload: req.Owner || formViewActions[formView.ID].Has(auth_service.Action_Download),
		}
		userFormViews[i].FormView.Assemble(formView, usersMap, datasourceMap, subjectNameMap, subjectPathIdMap, subjectPathMap, departmentNameMap, departmentPathMap)
		userFormViews[i].Policies = objectsGroupedByFormView[formView.ID]
	}

	return &form_view.GetUsersFormViewsPageRes{
		PageResultNew: form_view.PageResultNew[form_view.UsersFormView]{
			Entries:    userFormViews,
			TotalCount: total,
		},
	}, nil
}
func (f *formViewUseCase) GetUsersAllFormViews(ctx context.Context, req *form_view.GetUsersFormViewsReq) (*form_view.GetUsersFormViewsPageRes, error) {
	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	if req.OrgCode != "" && req.OrgCode != constant.UnallocatedId {
		req.SubDepartmentIDs = []string{req.OrgCode}
		departmentList, err := f.configurationCenterDriven.GetDepartmentList(ctx, configuration_center.QueryPageReqParam{Offset: 1, Limit: 0, ID: req.OrgCode})
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			req.SubDepartmentIDs = append(req.SubDepartmentIDs, entry.ID)
		}
	}
	usingType, err := f.configurationCenterDriven.GetUsingType(ctx)
	if err != nil {
		return nil, err
	}
	if usingType == 2 {
		req.LineStatus = []string{constant.LineStatusOnLine, constant.LineStatusDownAuditing, constant.LineStatusDownReject}
	}

	// 访问者，用于鉴权
	subject, err := interception.AuthServiceSubjectFromContext(ctx)
	if err != nil {
		return nil, err
	}

	switch userInfo.UserType {
	case interception.TokenTypeUser:
		if req.AppId != "" {
			var appList *configuration_center.AppList
			if appList, err = f.configurationCenterDriven.HasAccessPermissionApps(ctx); err != nil {
				return nil, err
			}
			if !appList.CheckAppIDExists(req.AppId) {
				return nil, errorcode.Desc(my_errorcode.UserGetAppsNotAllowed)
			}
			subject = &auth_service_v1.Subject{
				Type: auth_service_v1.SubjectAPP,
				ID:   req.AppId,
			}
		}
	case interception.TokenTypeClient:
		req.AppId = userInfo.ID
	}
	// 1. owner查询（查全部）
	req.OwnerId = userInfo.ID
	ownerReq := *req
	ownerReq.Owner = true
	ownerReq.Limit = 0
	ownerReq.Offset = 0
	total1, formViews1, err := f.repo.GetByOwnerOrIdsPages(ctx, &ownerReq)
	//日志打印total1的值
	log.Infof("------------------>total1----------------------->: %d", total1)

	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	// 2. 权限查询（查全部）
	req.OwnerId = userInfo.ID
	permReq := *req
	permReq.Owner = false
	permReq.Limit = 0
	permReq.Offset = 0
	// 权限相关逻辑
	var formViewActions = make(map[string]sets.Set[string])
	var formViewIsExpired = make(map[string]bool)
	var objectsGroupedByFormView = make(map[string][]*auth_service.Entries)
	res, err := f.DrivenAuthService.GetUsersObjects(ctx, &auth_service.GetUsersObjectsReq{
		ObjectType:  strings.Join([]string{auth_service.ObjectTypeDataView, auth_service.ObjectTypeSubView}, ","),
		SubjectId:   subject.ID,
		SubjectType: string(subject.Type),
	})
	if err != nil {
		return nil, err
	}
	objectsGroupedByFormView = lo.GroupBy(res.EntriesList, func(item *auth_service.Entries) string {
		switch item.ObjectType {
		case auth_service.ObjectTypeDataView:
			return item.ObjectId
		case auth_service.ObjectTypeSubView:
			id, err := uuid.Parse(item.ObjectId)
			if err != nil {
				return ""
			}
			logicViewID, err := f.subViewRepo.GetLogicViewID(ctx, id)
			if err != nil {
				return ""
			}
			return logicViewID.String()
		default:
			return ""
		}
	})
	for formViewID, objects := range objectsGroupedByFormView {
		if formViewID == "" {
			continue
		}
		for _, o := range objects {
			if o.ObjectType != auth_service.ObjectTypeDataView && o.ObjectType != auth_service.ObjectTypeSubView {
				continue
			}
			for _, p := range o.PermissionsList {
				if p.Effect != auth_service.Effect_Allow {
					continue
				}
				if formViewActions[formViewID] == nil {
					formViewActions[formViewID] = make(sets.Set[string])
				}
				formViewActions[formViewID].Insert(p.Action)
			}
			formViewIsExpired[formViewID] = formViewIsExpired[formViewID] || (o.ExpiredAt != nil && f.clock.Now().After(o.ExpiredAt.Time))
		}
	}
	permReq.ViewIds = lo.Filter(lo.Keys(formViewActions), func(id string, _ int) bool {
		return formViewActions[id].HasAny(auth_service.Action_Download, auth_service.Action_Read)
	})
	if req.PolicyStatus != "" {
		permReq.ViewIds = lo.Filter(permReq.ViewIds, func(id string, _ int) bool {
			var isExpired bool
			for _, o := range objectsGroupedByFormView[id] {
				if isExpired {
					break
				}
				if o.ExpiredAt == nil {
					continue
				}
				isExpired = f.clock.Now().After(o.ExpiredAt.Time)
			}
			switch req.PolicyStatus {
			case form_view.PolicyActive:
				return !isExpired
			case form_view.PolicyExpired:
				return isExpired
			default:
				return false
			}
		})
	}
	sort.Strings(permReq.ViewIds)
	total2, formViews2, err := f.repo.GetByOwnerOrIdsPages(ctx, &permReq)
	log.Infof("------------------>total2----------------------->: %d", total2)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	// 3. 合并去重
	formViewMap := make(map[string]*model.FormView)
	for _, v := range formViews1 {
		formViewMap[v.ID] = v
	}
	for _, v := range formViews2 {
		formViewMap[v.ID] = v
	}
	allFormViews := make([]*model.FormView, 0, len(formViewMap))
	for _, v := range formViewMap {
		allFormViews = append(allFormViews, v)
	}

	// 4. 排序（以ID排序）
	sort.Slice(allFormViews, func(i, j int) bool {
		return allFormViews[i].ID < allFormViews[j].ID
	})

	// 5. 分页
	total := int64(len(allFormViews))
	limit := req.Limit
	offset := req.Offset
	start := limit * (offset - 1)
	end := start + limit
	if start > len(allFormViews) {
		start = len(allFormViews)
	}
	if end > len(allFormViews) {
		end = len(allFormViews)
	}
	pagedFormViews := allFormViews[start:end]

	//获取用户名 及数据源名
	uids, dids, subjectIds, departIds := f.LoopId(pagedFormViews)
	usersMap, err := f.GetByUserMapByIds(ctx, uids)
	if err != nil {
		return nil, err
	}
	datasourceMap, err := f.GetDatasourceMap(ctx, dids)
	if err != nil {
		return nil, err
	}
	subjectNameMap, subjectPathIdMap, subjectPathMap, err := f.GetSubjectNameAndPathMap(ctx, subjectIds)
	if err != nil {
		return nil, err
	}
	departmentNameMap, departmentPathMap, err := f.GetDepartmentNameAndPathMap(ctx, departIds)
	if err != nil {
		return nil, err
	}

	rest := make([]*form_view.UsersFormView, len(pagedFormViews), len(pagedFormViews))
	for i, formView := range pagedFormViews {
		rest[i] = &form_view.UsersFormView{
			FormView:      &form_view.FormView{},
			AllowDownload: true, // 只要能查出来就有权限
		}
		rest[i].FormView.Assemble(formView, usersMap, datasourceMap, subjectNameMap, subjectPathIdMap, subjectPathMap, departmentNameMap, departmentPathMap)
		rest[i].Policies = objectsGroupedByFormView[formView.ID]
	}

	return &form_view.GetUsersFormViewsPageRes{
		PageResultNew: form_view.PageResultNew[form_view.UsersFormView]{
			Entries:    rest,
			TotalCount: total,
		},
	}, nil
}
func (f *formViewUseCase) GetUsersMultiFormViewsFields(ctx context.Context, req *form_view.GetUsersMultiFormViewsFieldsReq) (*form_view.GetUsersMultiFormViewsFieldsRes, error) {
	list := make([]*form_view.GetFieldsResWithId, len(req.IDs))
	for i, id := range req.IDs {
		get, err := f.GetUsersFormViewsFields(ctx, &form_view.GetUsersFormViewsFieldsReq{
			IDReqParamPath: form_view.IDReqParamPath{
				ID: id,
			},
		})
		list[i] = &form_view.GetFieldsResWithId{
			GetFieldsRes: get,
			ID:           id,
		}
		if err != nil {
			return nil, err
		}
	}
	return &form_view.GetUsersMultiFormViewsFieldsRes{LogicViews: list}, nil
}

func (f *formViewUseCase) GetUsersFormViewsFields(ctx context.Context, req *form_view.GetUsersFormViewsFieldsReq) (*form_view.GetFieldsRes, error) {
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	formView, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	var (
		// 当前用户是否是逻辑视图的 Owner或被授权逻辑视图的任意权限
		isOwnerOrFormViewAuthorized bool
		// 当前用户是否被授权逻辑视图的任意行列规则（子视图）的任意权限
		isAnySubViewAuthorized bool
	)

	//检查
	/*	_, views, err := f.repo.GetByOwnerOrIdsPages(ctx, &form_view.GetUsersFormViewsReq{
			GetUsersFormViewsReqParamPath: form_view.GetUsersFormViewsReqParamPath{
				Owner:   true,
				OwnerId: userInfo.ID,
			},
		})
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		for _, view := range views {
			if view.ID == req.ID {
				allow = true
				break
			}
		}*/

	// 检查当前用户是否是逻辑视图的 Owner
	count, err := f.repo.GetOwnerViewCount(ctx, req.ID, userInfo.ID)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if count > 0 {
		isOwnerOrFormViewAuthorized = true
	}

	// 当前用户不是逻辑视图的 Owner 时需要向 auth-service 鉴权
	if !isOwnerOrFormViewAuthorized {
		for _, action := range []string{
			auth_service.Action_Download,
			auth_service.Action_Read,
		} {
			isOwnerOrFormViewAuthorized, err = f.DrivenAuthService.VerifyUserPermissionObject(ctx, action, auth_service.ObjectTypeDataView, formView.ID)
			if err != nil {
				return nil, err
			}
			// 拥有任意一个 action 的权限即可，不需要再检查是否拥有其他 action 的权限
			if isOwnerOrFormViewAuthorized {
				break
			}
		}
	}

	// 获取逻辑视图的行列规则（子视图）
	subViews, _, err := f.subViewRepo.List(ctx, sub_view.ListOptions{LogicViewID: uuid.MustParse(req.ID)})
	if err != nil {
		return nil, err
	}
	// 当前用户既不是逻辑视图的 Owner 也未被授权下载逻辑视图时，需要进一步判断是
	// 否拥有行列规则（子视图）的任意权限。
	if !isOwnerOrFormViewAuthorized {
		// 过滤当前用户有下载权限的行列规则（子视图）
		subViews, err = f.filteringSubViewUserAuthorized(ctx, subViews)
		if err != nil {
			return nil, err
		}
		// 当前用户拥有逻辑视图的至少一个行列规则（子视图）的任意权限，即认为有逻辑视图的权限
		isAnySubViewAuthorized = subViews != nil
	}

	// 当前用户既不是逻辑视图的 Owner，也未被授权下载逻辑视图，也未被授权下载任
	// 意逻辑视图的子视图（行列规则）时，认为当前用户不可以下载此逻辑视图。
	if !(isOwnerOrFormViewAuthorized || isAnySubViewAuthorized) {
		return nil, errorcode.Desc(my_errorcode.UserNotHaveThisViewPermissions)
	}
	fields, err := f.fieldRepo.GetFormViewFieldList(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	// 当前用户有下载权限的字段。
	var downloadableFields []*model.FormViewField
	// 当前用户是逻辑视图的 Owner 或被授权下载逻辑视图时，用户可以下载所有字段。
	// 否则用户只能下载属于有下载权限的子视图（行列规则）的字段。
	if isOwnerOrFormViewAuthorized {
		downloadableFields = fields
	} else if isAnySubViewAuthorized {
		ids := getFieldIDsFromSubViews(subViews)
		for _, f := range fields {
			if !slices.Contains(ids, f.ID) {
				continue
			}
			downloadableFields = append(downloadableFields, f)
		}
	}

	totalRes, err := f.AssembleTotalRes(ctx, formView)
	if err != nil {
		return nil, err
	}
	res := make([]*form_view.FieldsRes, len(downloadableFields), len(downloadableFields))
	codeTableSlice := make([]string, 0)
	standardCodeSlice := make([]string, 0)
	for i, field := range downloadableFields {
		res[i] = f.AssignField(ctx, field, &codeTableSlice, &standardCodeSlice)
	}
	if err = f.AssignStandard(ctx, &res, codeTableSlice); err != nil {
		return nil, err
	}
	if err = f.AssignCodeTable(ctx, &res, codeTableSlice); err != nil {
		return nil, err
	}
	// 过滤开启数据保护查询字段
	res, err = f.filterDataProtectionFields(ctx, res, req.EnableDataProtection)
	if err != nil {
		return nil, err
	}
	totalRes.FieldsRes = res

	// 补全当前用户是否拥有逻辑视图各字段的权限
	if err := f.completeFormViewFieldPermissions(ctx, formView, res); err != nil {
		log.Error("complete from view field permission failed", zap.Error(err))
	}

	return totalRes, nil
}

func (f *formViewUseCase) filterDataProtectionFields(ctx context.Context, fields []*form_view.FieldsRes, isFilterProtected *bool) ([]*form_view.FieldsRes, error) {
	var err error
	newFields := make([]*form_view.FieldsRes, 0)
	// map[字段ID]是否开启查询保护
	fieldIDGradeIDMap := make(map[string]string)
	fieldProtectionQueryMap := make(map[string]bool)
	uniqueGradeIDMap := make(map[string]string)
	uniqueGradeIDSlice := []string{}
	for _, field := range fields {
		if field.LabelID != "" {
			fieldIDGradeIDMap[field.ID] = field.LabelID
			if _, exist := uniqueGradeIDMap[field.LabelID]; !exist {
				uniqueGradeIDMap[field.LabelID] = ""
				uniqueGradeIDSlice = append(uniqueGradeIDSlice, field.LabelID)
			}
		}
	}
	// 获取标签详情
	var labelByIdsRes *configuration_center_gocommon.GetLabelByIdsRes
	if len(uniqueGradeIDSlice) > 0 {
		labelByIdsRes, err = f.GradeLabel.GetLabelByIds(ctx, strings.Join(uniqueGradeIDSlice, ","))
		if err != nil {
			return nil, err
		}
		for _, v := range labelByIdsRes.Entries {
			fieldProtectionQueryMap[v.ID] = v.DataProtectionQuery
		}
	} else {
		return fields, nil
	}
	for _, field := range fields {
		if gradeID, exist := fieldIDGradeIDMap[field.ID]; exist {
			field.LabelIsProtected = fieldProtectionQueryMap[gradeID]
			if isFilterProtected != nil {
				if *isFilterProtected {
					if isProtecdtion, valid := fieldProtectionQueryMap[gradeID]; valid && isProtecdtion {
						continue
					}
				}
			}
		}
		newFields = append(newFields, field)
	}
	return newFields, nil
}

// Deprecated: use GetByUserMapByIds instead.
func (f *formViewUseCase) GetUserNameMap(ctx context.Context, uids []string) (userIdNameMap map[string]string, err error) {
	userIdNameMap = make(map[string]string)
	uids = util.DuplicateStringRemoval(uids)
	if len(uids) == 0 {
		return
	}
	userInfoMap, err := f.userMgr.BatchGetUserInfoByID(ctx, uids)
	if err != nil {
		return userIdNameMap, errorcode.Detail(my_errorcode.GetUsersNameError, err.Error())
	}
	for uid, userInfo := range userInfoMap {
		userIdNameMap[uid] = userInfo.VisionName
	}
	return userIdNameMap, nil
}
func (f *formViewUseCase) GetSubjectNameAndPathMap(ctx context.Context, subjectIds []string) (nameMap map[string]string, pathIdMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathIdMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(subjectIds) == 0 {
		return
	}
	objects, err := f.DrivenDataSubjectNG.GetObjectPrecision(ctx, subjectIds)
	if err != nil {
		return
	}
	for _, object := range objects.Object {
		nameMap[object.ID] = object.Name
		pathIdMap[object.ID] = object.PathID
		pathMap[object.ID] = object.PathName
	}
	return nameMap, pathIdMap, pathMap, nil
}

// Deprecated
func (f *formViewUseCase) GetDepartmentNameAndPathMapDeprecated(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	/*
		ids := strings.Join(departmentIds, ",")
		departmentInfos, err := f.userMgr.GetDepartmentParentInfo(ctx, ids, "name,parent_deps")
		if err != nil {
			return nameMap, pathMap, errorcode.Detail(my_errorcode.UserMgmGetDepartmentNameParentInfoError, err.Error())
		}
	*/
	departmentPrecision, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		return nil, nil, err
	}

	for _, departmentInfo := range departmentPrecision.Departments {
		nameMap[departmentInfo.ID] = departmentInfo.Name
		pathMap[departmentInfo.ID] = departmentInfo.Path
	}
	return nameMap, pathMap, nil
}

func (f *formViewUseCase) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		log.WithContext(ctx).Error("configurationCenterDriven.GetDepartmentPrecision", zap.Error(err))
		return nameMap, pathMap, err
	}

	for _, departmentInfo := range departmentInfos.Departments {
		nameMap[departmentInfo.ID] = ""
		pathMap[departmentInfo.ID] = ""
		if departmentInfo.DeletedAt == 0 {
			nameMap[departmentInfo.ID] = departmentInfo.Name
			pathMap[departmentInfo.ID] = departmentInfo.Path
		}
	}
	return nameMap, pathMap, nil
}

func (f *formViewUseCase) GetFormViewDetails(ctx context.Context, req *form_view.GetFormViewDetailsReq) (*form_view.GetFormViewDetailsRes, error) {
	formView, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	ownerIds := strings.Split(formView.OwnerId.String, constant.OwnerIdSep)
	res := &form_view.GetFormViewDetailsRes{
		TechnicalName:      formView.TechnicalName,
		BusinessName:       formView.BusinessName,
		OriginalName:       formView.OriginalName,
		Type:               enum.ToString[constant.FormViewType](formView.Type),
		UniformCatalogCode: formView.UniformCatalogCode,
		Description:        formView.Description.String,
		Comment:            formView.Comment.String,
		SubjectID:          formView.SubjectId.String,
		DepartmentID:       formView.DepartmentId.String,
		Owners:             make([]*form_view.Owner, 0),
		SceneAnalysisId:    formView.SceneAnalysisId,
		OnlineStatus:       formView.OnlineStatus,
		CreatedAt:          formView.CreatedAt.UnixMilli(),
		UpdatedAt:          formView.UpdatedAt.UnixMilli(),
		Sheet:              formView.ExcelSheet,
		StartCell:          formView.StartCell,
		EndCell:            formView.EndCell,
		HasHeaders:         formView.HasHeaders,
		SheetAsNewColumn:   formView.SheetAsNewColumn,
		ExcelFileName:      formView.ExcelFileName,
		SourceSign:         formView.SourceSign.Int32,
		InfoSystemID:       formView.InfoSystemID,
		UpdateCycle:        formView.UpdateCycle,
		SharedType:         formView.SharedType,
		OpenType:           formView.OpenType,
	}

	// 添加发布状态字段，根据 PublishAt 判断是否已发布
	if formView.PublishAt != nil && !formView.PublishAt.IsZero() {
		res.PublishStatus = "published"
	} else {
		res.PublishStatus = "unpublished"
	}

	if formView.PublishAt != nil {
		res.PublishAt = formView.PublishAt.UnixMilli()
	}
	if formView.OnlineTime != nil {
		res.OnlineTime = formView.OnlineTime.UnixMilli()
	}

	//	var subjectDomain, departmentName string

	//获取所属主题
	if formView.SubjectId.String != "" {
		object, err := f.DrivenDataSubjectNG.GetsObjectById(ctx, formView.SubjectId.String)
		if err != nil {
			log.WithContext(ctx).Error("GetFormViewDetails GetsObjectById error", zap.Error(err))
		} else {
			res.Subject = object.Name
			res.SubjectPathID = object.PathID
		}
	}
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		//获取所属数据源 库名称
		datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, formView.DatasourceID)
		if err != nil {
			log.WithContext(ctx).Error("GetFormViewDetails GetByIdWithCode error", zap.Error(err))
		}
		if datasource != nil {
			res.DatasourceID = formView.DatasourceID
			res.DatasourceName = datasource.Name
			res.DatasourceDepartmentID = datasource.DepartmentId
			res.Schema = datasource.Schema
			res.ViewSourceCatalogName = datasource.DataViewSource
			if datasource.TypeName == constant.ExcelTypeName {
				res.Schema = constant.ViewSourceSchema
			}
			//获取关联信息系统名称
			if datasource.InfoSystemID != "" {
				infoSystems, err := f.configurationCenterDriven.GetInfoSystemsPrecision(ctx, []string{datasource.InfoSystemID}, nil)
				if err != nil {
					return nil, err
				}
				if len(infoSystems) > 0 {
					res.InfoSystem = infoSystems[0].Name
				}
			}

			//用户未关联信息系统，显示数据源自身信息系统
			if res.InfoSystemID == "" {
				res.InfoSystemID = datasource.InfoSystemID
			}
		}

		//获取关联信息系统名称
		if res.InfoSystemID != "" {
			infoSystems, err := f.configurationCenterDriven.GetInfoSystemsPrecision(ctx, []string{res.InfoSystemID}, nil)
			if err != nil {
				return nil, err
			}
			if len(infoSystems) > 0 {
				res.InfoSystem = infoSystems[0].Name
			}
		}
	case constant.FormViewTypeCustom.Integer.Int32():
		res.ViewSourceCatalogName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		res.ViewSourceCatalogName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	}

	//获取部门名称和目录提供方路径
	if formView.DepartmentId.String != "" {
		departmentInfos, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{formView.DepartmentId.String})
		if err != nil {
			log.WithContext(ctx).Warn("get department name and path failed", zap.Error(err))
		} else if departmentInfos != nil && len(departmentInfos.Departments) > 0 {
			res.Department = departmentInfos.Departments[0].Name
			res.CatalogProviderPath = departmentInfos.Departments[0].Path
		}
	}

	//获取用户名称
	uid := []string{formView.CreatedByUID, formView.UpdatedByUID}
	userIdNameMap, err := f.GetByUserMapByIds(ctx, util.DuplicateStringRemoval(append(uid, ownerIds...)))
	if err != nil {
		return nil, err
	}

	for _, ownerId := range ownerIds {
		if ownerId != "" {
			res.Owners = append(res.Owners, &form_view.Owner{
				OwnerID:   ownerId,
				OwnerName: userIdNameMap[ownerId],
			})
		}
	}
	res.CreatedByUser = userIdNameMap[formView.CreatedByUID]
	res.UpdatedByUser = userIdNameMap[formView.UpdatedByUID]
	// 获取收藏状态
	err1, resp := f.CheckFavorite(ctx, formView)
	if err1 != nil {
		return nil, err1
	}
	if resp != nil {
		if resp.FavorID == 0 {
			res.IsFavored = false
		} else {
			res.IsFavored = true
			res.FavorID = resp.FavorID
		}
	} else {
		res.IsFavored = false
	}
	return res, nil
}

func (f *formViewUseCase) UpdateFormViewDetails(ctx context.Context, req *form_view.UpdateFormViewDetailsReq) error {
	formView, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return err
	}
	formViewUpdate := &model.FormView{
		FormViewID: formView.FormViewID,
		ID:         req.ID,
	}
	if req.SourceSign != nil {
		formViewUpdate.SourceSign = sql.NullInt32{
			Int32: *req.SourceSign,
			Valid: true,
		}
	}
	//校验主题域 id及是否主题域
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32(), constant.FormViewTypeCustom.Integer.Int32():
		if err = f.VerifySubjectID(ctx, req.SubjectID); err != nil {
			return err
		}
		formViewUpdate.SubjectId = sql.NullString{
			String: req.SubjectID,
			Valid:  true,
		}
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		if req.SubjectID != "" {
			return errorcode.Desc(my_errorcode.LogicEntityCanNotChange)
		}
	}
	//校验部门id  校验OwnerID
	ownerIDs := make([]string, len(req.Owners))
	if len(req.Owners) > 0 {
		for i, owner := range req.Owners {
			ownerIDs[i] = owner.OwnerID
		}
	}
	if err = f.VerifyDepartmentIDSubjectIDOwnerID(ctx, formView, req.DepartmentID, "", ownerIDs); err != nil {
		return err
	}

	if req.TechnicalName != nil && *req.TechnicalName != formView.TechnicalName {
		var catalogName string
		switch formView.Type {
		case constant.FormViewTypeCustom.Integer.Int32():
			catalogName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
		case constant.FormViewTypeLogicEntity.Integer.Int32():
			catalogName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
		default:
			return errorcode.Desc(my_errorcode.NotToDatasourceFormView)
		}
		// 技术名称重名校验
		exist, err := f.NameRepeat(ctx, &form_view.NameRepeatReq{
			NameRepeatParam: form_view.NameRepeatParam{
				FormID:   req.ID,
				Name:     *req.TechnicalName,
				Type:     enum.ToString[constant.FormViewType](formView.Type),
				NameType: "technical_name",
			},
		})
		if err != nil {
			return err
		}
		if exist {
			return errorcode.Desc(my_errorcode.NameRepeat, "技术名称")
		}
		viewSQLs, err := f.logicViewRepo.GetLogicViewSQL(ctx, req.ID)
		if err != nil {
			return err
		}
		//名称不支持修改，需删除后新建
		if err = f.DrivenVirtualizationEngine.DeleteView(ctx, &virtualization_engine.DeleteViewReq{
			CatalogName: catalogName,
			ViewName:    formView.TechnicalName,
		}); err != nil {
			return err
		}
		if err = f.DrivenVirtualizationEngine.CreateView(ctx, &virtualization_engine.CreateViewReq{
			CatalogName: catalogName,
			Query:       viewSQLs[0].Sql,
			ViewName:    *req.TechnicalName,
		}); err != nil {
			return err
		}
		formViewUpdate.TechnicalName = *req.TechnicalName
	}

	formViewUpdate.Description = sql.NullString{
		String: req.Description,
		Valid:  true,
	}
	formViewUpdate.DepartmentId = sql.NullString{
		String: req.DepartmentID,
		Valid:  true,
	}

	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return err
	}

	// 业务名称重名校验
	if req.BusinessName != formView.BusinessName {
		exist, err := f.NameRepeat(ctx, &form_view.NameRepeatReq{
			NameRepeatParam: form_view.NameRepeatParam{
				DatasourceID: formView.DatasourceID,
				FormID:       req.ID,
				Name:         req.BusinessName,
				Type:         enum.ToString[constant.FormViewType](formView.Type),
				NameType:     "business_name",
			},
		})
		if err != nil {
			return err
		}
		if exist {
			return errorcode.Desc(my_errorcode.NameRepeat, "业务名称")
		}
	}
	formViewUpdate.BusinessName = req.BusinessName
	formViewUpdate.OwnerId = sql.NullString{String: strings.Join(ownerIDs, constant.OwnerIdSep), Valid: true}
	formViewUpdate.UpdatedByUID = userInfo.ID
	if req.UpdateCycle != nil {
		formViewUpdate.UpdateCycle = *req.UpdateCycle
	}
	if req.SharedType != nil {
		formViewUpdate.SharedType = *req.SharedType
	}
	if req.OpenType != nil {
		formViewUpdate.OpenType = *req.OpenType
	}
	// 更新统一视图服务视图信息
	updateViewReq := &mdl_data_model.UpdateDataView{
		Name:    req.BusinessName,
		Comment: req.Description,
	}
	formViewFields, err := f.fieldRepo.GetFormViewFieldList(ctx, req.ID)
	if err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	fields := make([]mdl_data_model.FieldInfo, 0)
	for _, field := range formViewFields {
		fields = append(fields, mdl_data_model.FieldInfo{
			OriginalName:      field.TechnicalName,
			Name:              field.TechnicalName,
			DisplayName:       field.BusinessName,
			Type:              field.DataType,
			Comment:           field.Comment.String,
			DataLength:        field.DataLength,
			DataAccuracy:      field.DataAccuracy.Int32,
			Status:            enum.ToString[constant.FormViewFieldScanStatus](field.Status),
			IsNullable:        field.IsNullable,
			BusinessTimestamp: field.BusinessTimestamp,
		})
	}
	updateViewReq.Fields = fields
	_, err = f.DrivenMdlDataModel.UpdateDataView(ctx, formView.MdlID, updateViewReq)
	if err != nil {
		return err
	}

	updateFields := []string{"business_name", "description", "subject_id", "department_id", "owner_id", "updated_by_uid"}
	if formViewUpdate.SourceSign.Valid {
		updateFields = append(updateFields, "source_sign")
	}

	if req.UpdateCycle != nil {
		updateFields = append(updateFields, "update_cycle")
	}
	if req.SharedType != nil {
		updateFields = append(updateFields, "shared_type")
	}
	if req.OpenType != nil {
		updateFields = append(updateFields, "open_type")
	}
	if err = f.repo.Db().WithContext(ctx).Where("id=?", formViewUpdate.ID).Select(updateFields).Updates(formViewUpdate).Error; err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	//auditType, err := f.configurationCenterDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: constant.AuditTypeOnline})
	//if err != nil {
	//	return err
	//}
	//if auditType.ProcDefKey == "" {
	fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
	viewFieldList, err := f.fieldRepo.GetFormViewFieldList(ctx, formView.ID)
	if err != nil {
		return err
	}
	for _, field := range viewFieldList {
		fieldObj := &es.FieldObj{
			FieldNameZH: field.BusinessName,
			FieldNameEN: field.TechnicalName,
		}
		fieldObjs = append(fieldObjs, fieldObj)
	}
	formViewPush, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return err
	}
	if err = f.esRepo.PubToES(ctx, formViewPush, fieldObjs); err != nil { //编辑视图详情
		return err
	}

	logger := audit.FromContextOrDiscard(ctx)
	logObject := &form_view.LogicViewResourceObject{
		FormViewID:    formViewPush.ID,
		TechnicalName: formViewPush.TechnicalName,
		BusinessName:  formViewPush.BusinessName,
		SubjectID:     formViewPush.SubjectId.String,
		DepartmentID:  formViewPush.DepartmentId.String,
		OwnerID:       formViewPush.OwnerId.String,
	}
	if formViewPush.SubjectId.String != "" {
		res, err := f.DrivenDataSubject.GetDataSubjectByID(ctx, []string{formViewPush.SubjectId.String})
		if err != nil {
			log.Error(err.Error())
		} else if res != nil && len(res.Objects) > 0 {
			logObject.SubjectPath = res.Objects[0].PathName
		}
	}
	if formViewPush.DepartmentId.String != "" {
		res, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{formViewPush.DepartmentId.String})
		if err != nil {
			log.Error(err.Error())
		} else if res != nil && len(res.Departments) > 0 {
			logObject.DepartmentPath = res.Departments[0].Path
		}
	}
	if formViewPush.OwnerId.String != "" {
		ownerInfos, err := f.userRepo.GetByUserIds(ctx, strings.Split(formViewPush.OwnerId.String, constant.OwnerIdSep))
		if err != nil {
			log.Error(err.Error())
		}
		ownerName := make([]string, len(ownerInfos))
		for i, m := range ownerInfos {
			ownerName[i] = m.Name
		}
		logObject.OwnerName = strings.Join(ownerName, constant.OwnerNameSep)
	}
	// [发送审计管理日志]
	logger.Info(api_audit_v1.OperationUpdateLogicView, logObject)
	return nil
}

// Deprecated: use formViewRepo
/*
func (f *formViewUseCase) LogicViewCreatePubES(ctx context.Context, logicView *model.FormView, FieldObjs []*es.FieldObj) error {
	cateInfos := make([]*es.CateInfo, 0)
	if logicView.SubjectId.String != "" {
		object, err := f.DrivenDataSubjectNG.GetsObjectById(ctx, logicView.SubjectId.String)
		if err != nil {
			return err
		}
		cateInfos = append(cateInfos, &es.CateInfo{
			CateId:   constant.SubjectCateId,
			NodeId:   logicView.SubjectId.String,
			NodeName: object.Name,
			NodePath: object.PathName,
		})
	}
	if logicView.DepartmentId.String != "" {
		departments, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{logicView.DepartmentId.String})
		if err != nil {
			return err
		}
		if departments == nil || len(departments.Departments) != 1 || departments.Departments[0].DeletedAt != 0 {
			return errorcode.Desc(my_errorcode.DepartmentIDNotExist)
		}
		cateInfos = append(cateInfos, &es.CateInfo{
			CateId:   constant.DepartmentCateId,
			NodeId:   logicView.DepartmentId.String,
			NodeName: departments.Departments[0].Name,
			NodePath: departments.Departments[0].Path,
		})
	}
	formViewESIndex := es.FormViewESIndex{
		Type: "create",
		Body: es.FormViewESIndexBody{
			ID:          logicView.ID,
			DocID:       logicView.ID,
			Code:        logicView.UniformCatalogCode,
			Name:        logicView.BusinessName,
			NameEn:      logicView.TechnicalName,
			Description: logicView.Description.String,
			OwnerID:     logicView.OwnerId.String,
			IsPublish:   true,
			PublishedAt: logicView.PublishAt.UnixMilli(),
			FieldCount:  len(FieldObjs),
			Fields:      FieldObjs,
			CateInfos:   cateInfos,
		},
	}
	if logicView.OwnerId.String != "" {
		ownerInfo, err := f.userRepo.GetByUserId(ctx, logicView.OwnerId.String)
		if err != nil {
			return errorcode.Detail(my_errorcode.UserIdNotExistError, err.Error())
		}
		formViewESIndex.Body.OwnerName = ownerInfo.Name
	}
	if err := f.FormViewCreatePubES(ctx, logicView.ID, formViewESIndex); err != nil {
		return err
	}
	return nil
}
*/

func (f *formViewUseCase) GetRelatedFieldInfo(ctx context.Context, req *form_view.GetRelatedFieldInfoReq) (resp *form_view.GetRelatedFieldInfoResp, err error) {
	ids := strings.Split(req.IDs, ",")
	fieldInfo, err := f.fieldRepo.GetFormViewRelatedFieldList(ctx, req.IsOperator, ids...)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	resp = &form_view.GetRelatedFieldInfoResp{}
	viewIndexDict := make(map[string]int)
	for _, field := range fieldInfo {
		viewField := &form_view.SubjectViewField{}
		copier.Copy(viewField, field)
		viewField.ID = field.ID
		viewIndex, ok := viewIndexDict[field.FormViewID]
		if !ok {
			obj := &form_view.SubjectFormViewInfo{
				FormViewID:    field.FormViewID,
				BusinessName:  field.ViewBusinessName,
				TechnicalName: field.ViewTechnicalName,
				Fields:        []*form_view.SubjectViewField{viewField},
			}
			//处理下catalog和schema
			switch field.FormViewType {
			case constant.FormViewTypeDatasource.Integer.Int32():
				index := strings.LastIndex(field.DataViewSource, ".")
				if index >= 0 {
					obj.CatalogName = field.DataViewSource[0:index]
					obj.Schema = field.DataViewSource[index+1:]
				} else {
					obj.CatalogName = field.DataViewSource
					obj.Schema = "default"
				}
			case constant.FormViewTypeCustom.Integer.Int32():
				obj.CatalogName = constant.CustomViewSource
				obj.Schema = constant.ViewSourceSchema
			case constant.FormViewTypeLogicEntity.Integer.Int32():
				obj.CatalogName = constant.LogicEntityViewSource
				obj.Schema = constant.ViewSourceSchema
			}
			resp.Data = append(resp.Data, obj)
			viewIndexDict[field.FormViewID] = len(resp.Data) - 1
		} else {
			formView := resp.Data[viewIndex]
			formView.Fields = append(formView.Fields, viewField)
		}
	}
	return resp, nil
}

func (f *formViewUseCase) DeleteRelated(ctx context.Context, req *form_view.DeleteRelatedReq) (err error) {
	if len(req.SubjectDomainIDs) == 0 && len(req.LogicEntityIDs) == 0 && len(req.MoveDeletes) == 0 {
		return nil
	}
	nameChangeView := make([]*model.FormView, 0)

	moveLogicEntityIDs := make([]string, len(req.MoveDeletes))
	if len(req.MoveDeletes) != 0 {
		for i, moveDelete := range req.MoveDeletes {
			moveLogicEntityIDs[i] = moveDelete.LogicEntityID
		}
	}
	if len(req.LogicEntityIDs) != 0 {
		moveLogicEntityIDs = append(moveLogicEntityIDs, req.LogicEntityIDs...)
	}
	if len(moveLogicEntityIDs) != 0 {
		logicEntityViews, err := f.repo.GetBySubjectId(ctx, moveLogicEntityIDs)
		if err != nil {
			return err
		}
		//获取创建sql
		logicEntityViewIds := make([]string, len(logicEntityViews), len(logicEntityViews))
		for i, logicEntityView := range logicEntityViews {
			logicEntityViewIds[i] = logicEntityView.ID
		}
		logicViewSQLs, err := f.logicViewRepo.GetLogicViewSQLs(ctx, logicEntityViewIds)
		if err != nil {
			return err
		}
		logicViewSQLMap := make(map[string]string)
		for _, logicViewSQL := range logicViewSQLs {
			logicViewSQLMap[logicViewSQL.FormViewID] = logicViewSQL.Sql
		}

		for _, logicEntityView := range logicEntityViews {
			if logicEntityView.Type != constant.FormViewTypeLogicEntity.Integer.Int32() {
				log.WithContext(ctx).Error("LogicEntityID not FormViewTypeLogicEntity type", zap.String("LogicEntityID", logicEntityView.SubjectId.String), zap.String("LogicEntityViewID", logicEntityView.ID))
				continue
			}
			technicalName, businessName, err := f.NameRepeatReName(ctx, logicEntityView.TechnicalName, logicEntityView.BusinessName)
			if err != nil {
				return err
			}
			if err = f.DrivenVirtualizationEngine.DeleteView(ctx, &virtualization_engine.DeleteViewReq{
				CatalogName: constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema,
				ViewName:    logicEntityView.TechnicalName,
			}); err != nil {
				return err
			}
			if err = f.DrivenVirtualizationEngine.CreateView(ctx, &virtualization_engine.CreateViewReq{
				CatalogName: constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema,
				Query:       logicViewSQLMap[logicEntityView.ID],
				ViewName:    technicalName,
			}); err != nil {
				//创建失败，回滚
				if err = f.DrivenVirtualizationEngine.CreateView(ctx, &virtualization_engine.CreateViewReq{
					CatalogName: constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema,
					Query:       logicViewSQLMap[logicEntityView.ID],
					ViewName:    logicEntityView.TechnicalName,
				}); err != nil {
					log.WithContext(ctx).Error("Create CustomViewSource Error RollBack err", zap.Error(err), zap.String("LogicEntityViewID", logicEntityView.ID))
				}
				return err
			}
			if logicEntityView.TechnicalName != technicalName || logicEntityView.BusinessName != businessName {
				logicEntityView.TechnicalName = technicalName
				logicEntityView.BusinessName = businessName
				nameChangeView = append(nameChangeView, logicEntityView)
			}
		}
	}
	err = f.repo.ClearSubjectIdRelated(ctx, req.SubjectDomainIDs, req.LogicEntityIDs, req.MoveDeletes, nameChangeView)
	if err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}

func (f *formViewUseCase) NameRepeatReName(ctx context.Context, technicalName string, businessName string) (string, string, error) {
	for {
		repeat, err := f.repo.CustomLogicEntityViewNameExist(ctx, constant.FormViewTypeCustom.String, "", technicalName, "technical_name")
		if err != nil {
			return "", "", err
		}
		if !repeat {
			break
		}
		technicalName = util.ReName(technicalName)
	}
	for {
		repeat, err := f.repo.CustomLogicEntityViewNameExist(ctx, constant.FormViewTypeCustom.String, "", businessName, "business_name")
		if err != nil {
			return "", "", err
		}
		if !repeat {
			break
		}
		businessName = util.ReName(businessName)
	}
	return technicalName, businessName, nil
}

func (f *formViewUseCase) FormViewFilter(ctx context.Context, req *form_view.FormViewFilterReq) (*form_view.FormViewFilterResp, error) {
	resp := &form_view.FormViewFilterResp{
		IDS: []string{},
	}
	if len(req.IDS) <= 0 {
		return resp, nil
	}
	viewInfos, err := f.repo.GetLogicalEntityByIds(ctx, req.IDS)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	resp.IDS = util.Gen[string](viewInfos, func(view *model.FormView) string {
		return view.ID
	})
	return resp, nil
}

// QueryRelatedLogicalEntityInfo 根据视图名称查询关联的ID
func (f *formViewUseCase) QueryRelatedLogicalEntityInfo(ctx context.Context, req *form_view.QueryLogicalEntityByViewReq) (*form_view.QueryLogicalEntityByViewResp, error) {
	//常规过滤
	req.Keyword = strings.Replace(req.Keyword, "_", "\\_", -1)
	req.Keyword = strings.Replace(req.Keyword, "%", "%%", -1)
	//查询关联的视图
	total, viewInfos, err := f.repo.QueryViewCreatedByLogicalEntity(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	//根据返回的subject_id 查询subject_domain的详细信息
	ids := util.Gen[string](viewInfos, func(view *model.FormView) string {
		return view.SubjectId.String
	})
	//查询逻辑实体的详情
	var detailInfo *data_subject_local.GetObjectPrecisionRes
	if len(ids) > 0 {
		detailInfo, err = f.DrivenDataSubjectNG.GetObjectPrecision(ctx, ids)
		if err != nil {
			log.Errorf("query business object failed: err: %v", err.Error())
		}
	}
	if detailInfo == nil || detailInfo.Object == nil {
		detailInfo = &data_subject_local.GetObjectPrecisionRes{Object: make([]*data_subject_local.GetObjectResp, 0)}
	}
	//组合数据
	entities := util.Combination[*form_view.QueryLogicalEntity](viewInfos, detailInfo.Object,
		func(view *model.FormView, resp *data_subject_local.GetObjectResp) *form_view.QueryLogicalEntity {
			if view.SubjectId.String != resp.ID {
				return nil
			}
			return &form_view.QueryLogicalEntity{
				ID:            view.ID,
				TechnicalName: view.TechnicalName,
				BusinessName:  view.BusinessName,
				SubjectID:     resp.ID,
				SubjectPath:   resp.PathName,
				SubjectIDPath: resp.PathID,
			}
		})
	pageResult := form_view.QueryLogicalEntityByViewResp(form_view.PageResultNew[form_view.QueryLogicalEntity]{
		TotalCount: total,
		Entries:    entities,
	})
	return &pageResult, nil
}

func (f *formViewUseCase) QueryViewDetail(ctx context.Context, req *form_view.QueryViewDetailBySubjectIDReq) (*form_view.QueryViewDetailBySubjectIDResp, error) {
	result := &form_view.QueryViewDetailBySubjectIDResp{}
	//如果只是查询总数
	if req.Flag == form_view.QueryFlagTotal {
		total, err := f.repo.TotalSubjectCount(ctx, req.IsOperator)
		if err != nil {
			log.Errorf("TotalSubjectCount database error %v ", err.Error())
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		result.Total = total
		return result, nil
	}
	var res []*model.SubjectRelation
	var err error
	if req.Flag == form_view.QueryFlagAll {
		res, err = f.repo.GetRelationCountBySubjectIds(ctx, req.IsOperator, []string{})
	} else {
		res, err = f.repo.GetRelationCountBySubjectIds(ctx, req.IsOperator, req.ID)
	}
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	//如果是查询分组数量
	return &form_view.QueryViewDetailBySubjectIDResp{
		RelationNum: util.Gen[form_view.DomainViewRelation](res, func(s *model.SubjectRelation) form_view.DomainViewRelation {
			return form_view.DomainViewRelation{
				SubjectDomainID: s.SubjectID,
				RelationViewNum: s.Num,
			}
		}),
	}, nil
}

func (f *formViewUseCase) GetExploreJobStatus(ctx context.Context, req *form_view.GetExploreJobStatusReq) ([]*form_view.ExploreJobStatusResp, error) {
	var err error
	if req.FormViewID != "" {
		_, err = f.repo.GetById(ctx, req.FormViewID)
		if err != nil {
			log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.FormViewID, err)
			return nil, err
		}
	} else if req.DatasourceID != "" {
		_, err := f.datasourceRepo.GetById(ctx, req.DatasourceID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.WithContext(ctx).Errorf("GetExploreStatus datasource GetById error: %s ,datasource id: %s", err.Error(), req.DatasourceID)
				return nil, errorcode.Desc(my_errorcode.DataSourceIDNotExist)
			}
			log.WithContext(ctx).Error("GetExploreStatus datasource GetById DatabaseError", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
	} else {
		return nil, errorcode.Desc(my_errorcode.FormViewIDAndDatasourceID)
	}
	resp := make([]*form_view.ExploreJobStatusResp, 0)
	tasks, err := f.exploreTaskRepo.GetStatus(ctx, req.FormViewID, req.DatasourceID)
	if err != nil {
		return nil, err
	}
	if tasks != nil {
		taskMap := make(map[int32]string)
		for _, task := range tasks {
			if _, ok := taskMap[task.Type]; !ok {
				taskMap[task.Type] = task.TaskID
			}
		}
		for _, task := range tasks {
			for _, value := range taskMap {
				if task.TaskID == value {
					if task.Status == explore_task.TaskStatusQueuing.Integer.Int32() || task.Status == explore_task.TaskStatusRunning.Integer.Int32() {
						status, remark, finishedTime, err := f.GetExploreStatus(ctx, task.TaskID)
						if err != nil {
							return nil, err
						}
						if status != task.Status {
							// 更新任务状态
							task.Status = status
							if finishedTime > 0 {
								finishedAt := time.UnixMilli(finishedTime)
								task.FinishedAt = &finishedAt
							}
							if remark != "" {
								task.Remark = remark
							}
							err = f.exploreTaskRepo.Update(ctx, task)
							if err != nil {
								return nil, err
							}
						}
						exploreJobInfo := &form_view.ExploreJobStatusResp{
							ExploreType: enum.ToString[explore_task.TaskType](task.Type),
							Status:      enum.ToString[explore_task.TaskStatus](status),
						}
						resp = append(resp, exploreJobInfo)
					} else {
						exploreJobInfo := &form_view.ExploreJobStatusResp{
							ExploreType: enum.ToString[explore_task.TaskType](task.Type),
							Status:      enum.ToString[explore_task.TaskStatus](task.Status),
						}
						resp = append(resp, exploreJobInfo)
					}
				}
			}
		}
	}
	return resp, err
}

func (f *formViewUseCase) GetExploreStatus(ctx context.Context, taskId string) (status int32, remark string, finishedTime int64, err error) {
	rBuf, _ := f.dataExploration.GetStatus(ctx, "", "", taskId)
	if rBuf != nil {
		ret := &form_view.JobStatusList{}
		if err = json.Unmarshal(rBuf, ret); err != nil {
			log.WithContext(ctx).Errorf("解析获取探查作业状态失败 task id:%s，err is %v", taskId, err)
			return status, remark, finishedTime, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
		}
		exceptionDetails := make([]*explore_task.TaskExceptionDetail, 0)
		failedViews := make([]*explore_task.ViewInfo, 0)
		timeoutViews := make([]*explore_task.ViewInfo, 0)
		invalidParameterViews := make([]*explore_task.ViewInfo, 0)
		badRequestViews := make([]*explore_task.ViewInfo, 0)
		otherViews := make([]*explore_task.ViewInfo, 0)
		totalCount := len(ret.Entries)
		if totalCount == 0 {
			status = explore_task.TaskStatusQueuing.Integer.Int32()
		} else {
			var queuingCount, runningCount, finishedCount, canceledCount, failedCount int
			var updatedTime int64
			for i := range ret.Entries {
				if ret.Entries[i].UpdatedAt > 0 {
					updatedTime = ret.Entries[i].UpdatedAt
				}
				switch ret.Entries[i].ExecStatus {
				case explore_task.TaskStatusQueuing.Integer.Int32():
					queuingCount++
				case explore_task.TaskStatusFinished.Integer.Int32():
					finishedCount++
				case explore_task.TaskStatusFailed.Integer.Int32():
					failedCount++
					if strings.HasPrefix(ret.Entries[i].Reason, "虚拟化引擎执行失败") {
						failedViews = append(failedViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
					} else if strings.HasPrefix(ret.Entries[i].Reason, "超过最长执行时长") {
						timeoutViews = append(timeoutViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
					} else if strings.HasPrefix(ret.Entries[i].Reason, "探查规则配置错误") {
						invalidParameterViews = append(invalidParameterViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
					} else if strings.HasPrefix(ret.Entries[i].Reason, "虚拟化引擎请求失败") {
						badRequestViews = append(badRequestViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
					} else {
						otherViews = append(otherViews, &explore_task.ViewInfo{ViewID: ret.Entries[i].TableId, ViewTechName: ret.Entries[i].Table, Reason: ret.Entries[i].Reason})
					}
				case explore_task.TaskStatusRunning.Integer.Int32():
					runningCount++
				case explore_task.TaskStatusCanceled.Integer.Int32():
					canceledCount++
				default:
					err = errorcode.Detail(my_errorcode.DataExploreJobStatusGetErr, "未知的质量检测作业执行状态")
				}
			}
			if queuingCount == totalCount {
				status = explore_task.TaskStatusQueuing.Integer.Int32()
			} else if finishedCount == totalCount {
				status = explore_task.TaskStatusFinished.Integer.Int32()
				finishedTime = updatedTime
			} else if canceledCount > 0 {
				status = explore_task.TaskStatusCanceled.Integer.Int32()
			} else if failedCount+finishedCount == totalCount {
				status = explore_task.TaskStatusFailed.Integer.Int32()
				finishedTime = updatedTime
			} else {
				status = explore_task.TaskStatusRunning.Integer.Int32()
			}
			if failedCount > 0 {
				if len(failedViews) > 0 {
					exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "虚拟化引擎执行失败", ViewInfo: failedViews})
				}
				if len(timeoutViews) > 0 {
					exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "任务超时", ViewInfo: failedViews})
				}
				if len(invalidParameterViews) > 0 {
					exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "探查规则配置错误", ViewInfo: invalidParameterViews})
				}
				if len(badRequestViews) > 0 {
					exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "虚拟化引擎请求失败", ViewInfo: badRequestViews})
				}
				if len(otherViews) > 0 {
					exceptionDetails = append(exceptionDetails, &explore_task.TaskExceptionDetail{ExceptionDesc: "内部错误", ViewInfo: otherViews})
				}
				remarkInfo := &explore_task.TaskRemark{
					Details:    exceptionDetails,
					TotalCount: failedCount,
				}
				buf, err := json.Marshal(remarkInfo)
				if err != nil {
					log.WithContext(ctx).Errorf("json.Marshal remarkInfo 失败，err is %v", err)
				}
				remark = string(buf)
			}
		}
	}
	return status, remark, finishedTime, err
}

func (f *formViewUseCase) GetExploreReport(ctx context.Context, req *form_view.GetExploreReportReq) (resp *form_view.ExploreReportResp, err error) {
	var view *model.FormView
	view, err = f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}

	resp = &form_view.ExploreReportResp{}
	if view.ExploreJobId != nil && len(*view.ExploreJobId) > 0 || req.ThirdParty {
		var rBuf []byte
		if !req.ThirdParty {
			rBuf, err = f.dataExploration.GetReport(ctx, *view.ExploreJobId, req.Version)
		} else {
			rBuf, err = f.dataExploration.GetThirdReport(ctx, req.ID, req.Version)
		}

		if err != nil {
			return nil, err
		}
		srcData := &form_view.SrcReportData{}
		if err = json.Unmarshal(rBuf, srcData); err != nil {
			log.WithContext(ctx).Errorf("解析获取探查作业：%s 最新报告失败，err is %v", *view.ExploreJobId, err)
			return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err)
		}

		// 检查读取权限
		isFullReport, err := f.enforce(ctx, req.ID)
		if err != nil {
			log.WithContext(ctx).Errorf("enforce failed, err: %v", err)
			return nil, err
		}

		var scoreBuf []byte
		if req.ThirdParty {
			scoreBuf, err = f.dataExploration.GetThirdPartyScore(ctx, req.ID)
		} else {
			scoreBuf, err = f.dataExploration.GetScore(ctx, *view.ExploreJobId)
		}
		if err != nil {
			return nil, err
		}
		scoreTrends, err := f.getScoreTrends(ctx, scoreBuf)
		if err == nil {
			// 报告转换处理
			fields, err := f.fieldRepo.GetFormViewFieldList(ctx, req.ID)
			if err != nil {
				log.WithContext(ctx).Errorf("get field info for view: %v failed, err: %v", req.ID, err)
				return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
			}
			u, _ := util.GetUserInfo(ctx)
			//脱敏
			menuActions, err := f.commonAuthService.MenuResourceActions(ctx, u.ID, common_middleware.DatasheetView)
			if err != nil {
				return nil, err
			}
			hasManageAuth := menuActions.HasManageAction()
			fieldDesensitizationRuleMap := make(map[string]*model.DesensitizationRule)
			if !hasManageAuth {
				dataPrivacyPolicy, err := f.dataPrivacyPolicyRepo.GetByFormViewId(ctx, view.ID)
				if err != nil {
					return nil, err
				}
				dataPrivacyPolicyFields := make([]*model.DataPrivacyPolicyField, 0)
				if dataPrivacyPolicy != nil {
					dataPrivacyPolicyFields, err = f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyId(ctx, dataPrivacyPolicy.ID)
					if err != nil {
						return nil, err
					}
				}
				if len(dataPrivacyPolicyFields) > 0 {
					desensitizeRuleIds := make([]string, 0)
					for _, field := range dataPrivacyPolicyFields {
						desensitizeRuleIds = append(desensitizeRuleIds, field.DesensitizationRuleID)
					}
					desensitizationRuleMap := make(map[string]*model.DesensitizationRule)
					desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizeRuleIds)
					if err != nil {
						return nil, err
					}
					if len(desensitizationRules) > 0 {
						for _, desensitizationRule := range desensitizationRules {
							desensitizationRuleMap[desensitizationRule.ID] = desensitizationRule
						}
						for _, policyField := range dataPrivacyPolicyFields {
							fieldDesensitizationRuleMap[policyField.FormViewFieldID] = desensitizationRuleMap[policyField.DesensitizationRuleID]
						}
					}
				}
			}
			log.WithContext(ctx).Info("GetExploreReport,fieldDesensitizationRuleMap:", zap.Any("fieldDesensitizationRuleMap", fieldDesensitizationRuleMap))
			resp = reportConvert(ctx, isFullReport, len(fields), srcData, scoreTrends, hasManageAuth, fieldDesensitizationRuleMap, req.Version)
		}
	} else {
		return nil, errorcode.Desc(my_errorcode.DataExploreReportGetErr)
	}
	return resp, err
}

func (f *formViewUseCase) BatchGetExploreReport(ctx context.Context, req *form_view.BatchGetExploreReportReq) (*form_view.BatchGetExploreReportResp, error) {
	// 1. 构建视图ID到视图的映射
	viewMap, err := f.buildViewMapForBatch(ctx, req.IDs)
	if err != nil {
		return nil, err
	}

	// 2. 初始化响应结果
	resp := &form_view.BatchGetExploreReportResp{
		Reports: make([]*form_view.BatchExploreReportItem, 0, len(req.IDs)),
	}

	// 3. 遍历每个ID，处理单个视图的报告
	for _, id := range req.IDs {
		item := f.processSingleViewReport(ctx, id, viewMap, req)
		resp.Reports = append(resp.Reports, item)
	}

	return resp, nil
}

// buildViewMapForBatch 批量获取视图并构建ID到视图的映射
func (f *formViewUseCase) buildViewMapForBatch(ctx context.Context, ids []string) (map[string]*model.FormView, error) {
	views, err := f.repo.GetByIds(ctx, ids)
	if err != nil {
		log.WithContext(ctx).Errorf("batch get form views failed, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	viewMap := make(map[string]*model.FormView, len(views))
	for _, view := range views {
		viewMap[view.ID] = view
	}
	return viewMap, nil
}

// processSingleViewReport 处理单个视图的报告
func (f *formViewUseCase) processSingleViewReport(
	ctx context.Context,
	id string,
	viewMap map[string]*model.FormView,
	req *form_view.BatchGetExploreReportReq,
) *form_view.BatchExploreReportItem {
	item := &form_view.BatchExploreReportItem{
		FormViewID:       id,
		Success:          false,
		HasQualityReport: false,
	}

	// 1. 验证视图是否存在
	view, exists := viewMap[id]
	if !exists {
		item.Error = "视图不存在"
		return item
	}

	// 2. 验证并获取报告数据
	srcData, isFullReport, err := f.validateViewAndGetReportData(ctx, id, view, req)
	if err != nil {
		item.Error = err.Error()
		return item
	}

	// 3. 获取质量评分趋势数据
	scoreTrends, err := f.getQualityScoreTrendsForBatch(ctx, id, view, req)
	if err != nil {
		item.Error = err.Error()
		return item
	}

	// 4. 获取字段信息
	fields, err := f.fieldRepo.GetFormViewFieldList(ctx, id)
	if err != nil {
		log.WithContext(ctx).Errorf("get field info for view: %v failed, err: %v", id, err)
		item.Error = "获取字段信息失败"
		return item
	}

	// 5. 构建脱敏规则映射
	hasRole, fieldDesensitizationRuleMap, err := f.buildDesensitizationRuleMapForBatch(ctx, view.ID)
	if err != nil {
		item.Error = err.Error()
		return item
	}

	// 6. 报告转换处理
	report := reportConvert(ctx, isFullReport, len(fields), srcData, scoreTrends, hasRole, fieldDesensitizationRuleMap, req.Version)

	// 7. 依据当前报告内容判定是否存在质量评分
	item.HasQualityReport = hasQualityScoreInReport(report)
	item.Success = true
	item.Report = report

	return item
}

// validateViewAndGetReportData 验证视图并获取报告原始数据
func (f *formViewUseCase) validateViewAndGetReportData(
	ctx context.Context,
	id string,
	view *model.FormView,
	req *form_view.BatchGetExploreReportReq,
) (*form_view.SrcReportData, bool, error) {
	// 检查是否有探查作业ID或需要第三方报告
	if (view.ExploreJobId == nil || len(*view.ExploreJobId) == 0) && !req.ThirdParty {
		return nil, false, errors.New("视图没有探查报告")
	}

	// 获取报告数据
	var rBuf []byte
	var err error
	if !req.ThirdParty {
		rBuf, err = f.dataExploration.GetReport(ctx, *view.ExploreJobId, req.Version)
	} else {
		rBuf, err = f.dataExploration.GetThirdReport(ctx, id, req.Version)
	}
	if err != nil {
		log.WithContext(ctx).Errorf("get report for view %s failed, err: %v", id, err)
		return nil, false, fmt.Errorf("获取报告数据失败: %w", err)
	}

	// 解析报告数据
	srcData := &form_view.SrcReportData{}
	if err = json.Unmarshal(rBuf, srcData); err != nil {
		log.WithContext(ctx).Errorf("解析获取探查作业：%s 最新报告失败，err is %v", id, err)
		return nil, false, errors.New("解析报告数据失败")
	}

	// 检查读取权限
	isFullReport, err := f.enforce(ctx, id)
	if err != nil {
		log.WithContext(ctx).Errorf("enforce failed for view %s, err: %v", id, err)
		return nil, false, errors.New("权限检查失败")
	}

	return srcData, isFullReport, nil
}

// getQualityScoreTrendsForBatch 获取质量评分趋势数据（根据需求参数）
func (f *formViewUseCase) getQualityScoreTrendsForBatch(
	ctx context.Context,
	id string,
	view *model.FormView,
	req *form_view.BatchGetExploreReportReq,
) ([]*form_view.ScoreTrend, error) {
	// 与单个接口保持一致：始终获取评分数据用于填充 Overview
	var scoreBuf []byte
	var err error
	if req.ThirdParty {
		scoreBuf, err = f.dataExploration.GetThirdPartyScore(ctx, id)
	} else {
		scoreBuf, err = f.dataExploration.GetScore(ctx, *view.ExploreJobId)
	}
	if err != nil {
		log.WithContext(ctx).Errorf("get score for view %s failed, err: %v", id, err)
		return nil, errors.New("获取质量评分失败")
	}

	scoreTrends, err := f.getScoreTrends(ctx, scoreBuf)
	if err != nil {
		log.WithContext(ctx).Errorf("parse score trends for view %s failed, err: %v", id, err)
		return nil, errors.New("解析质量评分失败")
	}
	return scoreTrends, nil
}

// buildDesensitizationRuleMapForBatch 构建脱敏规则映射
func (f *formViewUseCase) buildDesensitizationRuleMapForBatch(
	ctx context.Context,
	viewID string,
) (bool, map[string]*model.DesensitizationRule, error) {
	u, _ := util.GetUserInfo(ctx)
	//脱敏
	//hasRole, err := f.authorizationDriven.HasInnerBusinessRoles(ctx, u.ID)
	hasRole, err := f.commonAuthService.MenuResourceActions(ctx, u.ID, common_middleware.DatasheetView)
	// 检查用户角色
	//hasRole, err := f.configurationCenterDriven.HasRoles(ctx, access_control.TCDataOperationEngineer, access_control.TCDataDevelopmentEngineer)
	if err != nil {
		log.WithContext(ctx).Errorf("check roles failed, err: %v", err)
		return false, nil, errors.New("检查角色权限失败")
	}

	fieldDesensitizationRuleMap := make(map[string]*model.DesensitizationRule)
	if hasRole.HasManageAction() {
		// 有角色权限，不需要脱敏
		return true, fieldDesensitizationRuleMap, nil
	}

	// 获取数据隐私策略
	dataPrivacyPolicy, err := f.dataPrivacyPolicyRepo.GetByFormViewId(ctx, viewID)
	if err != nil {
		log.WithContext(ctx).Errorf("get data privacy policy for view %s failed, err: %v", viewID, err)
		return false, nil, errors.New("获取数据隐私策略失败")
	}

	if dataPrivacyPolicy == nil {
		return false, fieldDesensitizationRuleMap, nil
	}

	// 获取数据隐私策略字段
	dataPrivacyPolicyFields, err := f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyId(ctx, dataPrivacyPolicy.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get data privacy policy fields failed, err: %v", err)
		return false, nil, errors.New("获取数据隐私策略字段失败")
	}

	if len(dataPrivacyPolicyFields) == 0 {
		return false, fieldDesensitizationRuleMap, nil
	}

	// 收集脱敏规则ID
	desensitizeRuleIds := make([]string, 0, len(dataPrivacyPolicyFields))
	for _, field := range dataPrivacyPolicyFields {
		desensitizeRuleIds = append(desensitizeRuleIds, field.DesensitizationRuleID)
	}

	// 获取脱敏规则
	desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizeRuleIds)
	if err != nil {
		log.WithContext(ctx).Errorf("get desensitization rules failed, err: %v", err)
		return false, nil, errors.New("获取脱敏规则失败")
	}

	// 构建规则ID到规则的映射
	desensitizationRuleMap := make(map[string]*model.DesensitizationRule, len(desensitizationRules))
	for _, rule := range desensitizationRules {
		desensitizationRuleMap[rule.ID] = rule
	}

	// 构建字段ID到脱敏规则的映射
	for _, policyField := range dataPrivacyPolicyFields {
		if rule, exists := desensitizationRuleMap[policyField.DesensitizationRuleID]; exists {
			fieldDesensitizationRuleMap[policyField.FormViewFieldID] = rule
		}
	}

	return false, fieldDesensitizationRuleMap, nil
}

// hasQualityScoreInReport 判定报告是否存在质量评分
// 判定规则：仅依据 overview 中的五个评分字段
func hasQualityScoreInReport(report *form_view.ExploreReportResp) bool {
	nonNil := func(ds form_view.DimensionScores) bool {
		return ds.CompletenessScore != nil || ds.UniquenessScore != nil || ds.StandardizationScore != nil ||
			ds.AccuracyScore != nil || ds.ConsistencyScore != nil
	}

	// Overview 中任一评分非空即判定为存在质量报告
	if report.Overview != nil && nonNil(report.Overview.DimensionScores) {
		return true
	}

	return false
}

func (f *formViewUseCase) enforce(ctx context.Context, formViewId string) (bool, error) {
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return false, err
	}

	// 读取策略验证的请求
	var requests []auth_service.EnforceRequest
	requests = append(requests, auth_service.EnforceRequest{SubjectType: auth_service.SubjectTypeUser, SubjectID: u.ID, ObjectType: auth_service.ObjectTypeDataView, ObjectID: formViewId, Action: auth_service.Action_Read})

	// 验证当前用户是否可以对资源执行指定动作
	responses, err := f.DrivenAuthService.Enforce(ctx, requests)
	if err != nil {
		return false, err
	}
	if responses[0] {
		return true, err
	}
	return false, err
}

func (f *formViewUseCase) getScoreTrends(ctx context.Context, rBuf []byte) ([]*form_view.ScoreTrend, error) {
	var scoreTrends []*form_view.ScoreTrend
	var err error
	rList := &form_view.ReportList{}
	if err = json.Unmarshal(rBuf, rList); err != nil {
		log.WithContext(ctx).Errorf("解析获取探查作业：%s 质量总评分趋势数据失败，err is %v", string(rBuf), err)
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetScoreError, err)
	}

	scoreTrends = make([]*form_view.ScoreTrend, len(rList.List))
	for i := len(rList.List) - 1; i >= 0; i-- {
		scoreTrends[len(rList.List)-i-1] = &form_view.ScoreTrend{
			TaskId:               rList.List[i].JobID,
			Version:              rList.List[i].Version,
			ExploreTime:          rList.List[i].FinishedAt,
			CompletenessScore:    rList.List[i].CompletenessScore,
			UniquenessScore:      rList.List[i].UniquenessScore,
			StandardizationScore: rList.List[i].StandardizationScore,
			AccuracyScore:        rList.List[i].AccuracyScore,
			ConsistencyScore:     rList.List[i].ConsistencyScore,
		}
	}
	return scoreTrends, err
}

func reportConvert(ctx context.Context, isFullReport bool, fieldCount int, srcData *form_view.SrcReportData, scoreTrends []*form_view.ScoreTrend, hasManageAuth bool, fieldDesensitizationRuleMap map[string]*model.DesensitizationRule, version *int32) *form_view.ExploreReportResp {
	resp := &form_view.ExploreReportResp{
		Code:                   srcData.Code,
		TaskId:                 srcData.TaskId,
		Version:                srcData.Version,
		ExploreTime:            srcData.FinishedAt,
		TotalSample:            srcData.TotalSample,
		ExploreMetadataDetails: srcData.MetadataExplore,
		ExploreRowDetails:      srcData.RowExplore,
		ExploreViewDetails:     srcData.ViewExplore,
	}
	idx := len(scoreTrends) - 1
	if version != nil {
		for i, score := range scoreTrends {
			if int(*version) == score.Version {
				idx = i
			}
		}
	}

	resp.Overview = &form_view.ReportOverview{
		ScoreTrends: scoreTrends,
		Fields: &form_view.ExploreFieldsInfo{
			TotalCount:   fieldCount,
			ExploreCount: len(srcData.FieldExplore),
		},
		DimensionScores: form_view.DimensionScores{
			CompletenessScore:    scoreTrends[idx].CompletenessScore,
			UniquenessScore:      scoreTrends[idx].UniquenessScore,
			StandardizationScore: scoreTrends[idx].StandardizationScore,
			AccuracyScore:        scoreTrends[idx].AccuracyScore,
			ConsistencyScore:     scoreTrends[idx].ConsistencyScore,
		},
	}

	fieldExplores := make([]*form_view.ExploreFieldDetail, 0)
	for _, fieldExplore := range srcData.FieldExplore {
		fieldDetail := &form_view.ExploreFieldDetail{
			FieldId:  fieldExplore.FieldId,
			CodeInfo: fieldExplore.CodeInfo,
		}
		fieldDetail.CompletenessScore = fieldExplore.CompletenessScore
		fieldDetail.UniquenessScore = fieldExplore.UniquenessScore
		fieldDetail.StandardizationScore = fieldExplore.StandardizationScore
		fieldDetail.AccuracyScore = fieldExplore.AccuracyScore
		fieldDetail.ConsistencyScore = fieldExplore.ConsistencyScore
		ruleResults := make([]*form_view.RuleResult, 0)
		for _, rule := range fieldExplore.Details {
			if !isFullReport {
				if rule.Dimension == explore_task.DimensionDataStatistics.String {
					continue
				}
			}

			if rule.RuleName == "枚举值分布" {
				if !hasManageAuth && rule.Result != nil {
					desensitizedRule := fieldDesensitizationRuleMap[fieldDetail.FieldId]

					var masked string
					// 定义枚举值分布项结构体，与rule.Result中JSON对象相对应
					type EnumItem struct {
						Key   any   `json:"key"`
						Value int64 `json:"value"`
					}
					type OutEnumItem struct {
						Key   string `json:"key"`
						Value int64  `json:"value"`
					}
					var enumItems []EnumItem
					var outEnumItems []OutEnumItem
					result := ""
					decoder := json.NewDecoder(bytes.NewReader([]byte(*rule.Result)))
					decoder.UseNumber()
					// 尝试将rule.Result中的JSON数据反序列化为枚举项切片
					if err := decoder.Decode(&enumItems); err != nil {
						log.WithContext(ctx).Error("failed to deserialize rule.Result", zap.String("ruleResult", *rule.Result), zap.Error(err))
					} else {
						for _, item := range enumItems {
							if desensitizedRule != nil {
								key := fmt.Sprintf("%v", item.Key)
								if desensitizedRule.Method == "all" {
									masked = strings.Repeat("*", len(key))
								} else if desensitizedRule.Method == "middle" {
									if int(desensitizedRule.MiddleBit) < len(key) {
										headLen := (len(key) - int(desensitizedRule.MiddleBit)) / 2
										tailLen := len(key) - int(desensitizedRule.MiddleBit) - headLen
										masked = key[:headLen] + strings.Repeat("*", int(desensitizedRule.MiddleBit)) + key[len(key)-tailLen:]
									} else {
										masked = strings.Repeat("*", len(key))
									}
								} else if desensitizedRule.Method == "head-tail" {
									if int(desensitizedRule.HeadBit)+int(desensitizedRule.TailBit) < len(key) {
										masked = strings.Repeat("*", int(desensitizedRule.HeadBit)) + key[int(desensitizedRule.HeadBit):len(key)-int(desensitizedRule.TailBit)] + strings.Repeat("*", int(desensitizedRule.TailBit))
									} else {
										masked = strings.Repeat("*", len(key))
									}
								}
							} else {
								if item.Key != nil {
									masked = fmt.Sprintf("%v", item.Key)
								} else {
									masked = "null"
								}
							}
							outEnumItems = append(outEnumItems, OutEnumItem{
								Key:   masked,
								Value: item.Value,
							})
						}
					}
					serializedData, err := json.Marshal(outEnumItems)
					if err != nil {
						log.WithContext(ctx).Error("failed to serialize outEnumItems", zap.Error(err))
					} else {
						result = util.BytesToString(serializedData)
					}
					rule.Result = &result
				}
			} else if rule.RuleName == "最大值" || rule.RuleName == "最小值" {
				if !hasManageAuth && rule.Result != nil {
					desensitizedRule := fieldDesensitizationRuleMap[fieldDetail.FieldId]
					var masked string
					type MaxValueItem struct {
						Result any `json:"result"`
					}
					type OutMaxValueItem struct {
						Result string `json:"result"`
					}
					var maxValueItems []MaxValueItem
					var outMaxValueItems []OutMaxValueItem
					result := ""
					decoder := json.NewDecoder(bytes.NewReader([]byte(*rule.Result)))
					decoder.UseNumber()
					// 尝试将rule.Result中的JSON数据反序列化为枚举项切片
					if err := decoder.Decode(&maxValueItems); err != nil {
						log.WithContext(ctx).Error("failed to deserialize rule.Result", zap.String("ruleResult", *rule.Result), zap.Error(err))
						rule.Result = &result
					} else {
						for _, item := range maxValueItems {
							if desensitizedRule != nil {
								key := fmt.Sprintf("%v", item.Result)
								if desensitizedRule.Method == "all" {
									masked = strings.Repeat("*", len(key))
								} else if desensitizedRule.Method == "middle" {
									if int(desensitizedRule.MiddleBit) < len(key) {
										headLen := (len(key) - int(desensitizedRule.MiddleBit)) / 2
										tailLen := len(key) - int(desensitizedRule.MiddleBit) - headLen
										masked = key[:headLen] + strings.Repeat("*", int(desensitizedRule.MiddleBit)) + key[len(key)-tailLen:]
									} else {
										masked = strings.Repeat("*", len(key))
									}
								} else if desensitizedRule.Method == "head-tail" {
									if int(desensitizedRule.HeadBit)+int(desensitizedRule.TailBit) < len(key) {
										masked = strings.Repeat("*", int(desensitizedRule.HeadBit)) + key[int(desensitizedRule.HeadBit):len(key)-int(desensitizedRule.TailBit)] + strings.Repeat("*", int(desensitizedRule.TailBit))
									} else {
										masked = strings.Repeat("*", len(key))
									}
								}
							} else {
								masked = fmt.Sprintf("%v", item.Result)
							}
							outMaxValueItems = append(outMaxValueItems, OutMaxValueItem{
								Result: masked,
							})
						}
					}
					serializedData, err := json.Marshal(outMaxValueItems)
					if err != nil {
						log.WithContext(ctx).Error("failed to serialize outMaxValueItems", zap.Error(err))
					} else {
						result = string(serializedData)
					}
					rule.Result = &result
				}
			}
			ruleResults = append(ruleResults, rule)
		}

		if len(ruleResults) > 0 {
			fieldDetail.Details = ruleResults
			fieldExplores = append(fieldExplores, fieldDetail)
		}
	}
	resp.ExploreFieldDetails = fieldExplores

	return resp
}

// 所有可以对逻辑视图执行的动作
var dataViewAllActions = sets.New(
	auth_service.Action_Read,
	auth_service.Action_Download,
)

// 所有可以对子视图视图执行的动作，与逻辑视图相同
var subViewAllActions = dataViewAllActions

// completeFormViewFieldsPermissions 补全当前用户对逻辑视图各个字段的权限，包括
// is_readable, is_downloadable
//
//  1. 判断当前用户是否是逻辑视图的 Owner
//  2. 判断当前用户是否拥有逻辑视图的权限
//  3. 判断当前用户是否拥有子视图的权限
func (f *formViewUseCase) completeFormViewFieldPermissions(ctx context.Context, formView *model.FormView, fields []*form_view.FieldsRes) error {
	// 从 context 获取访问者
	subject, err := interception.AuthServiceSubjectFromContext(ctx)
	if err != nil {
		return err
	}

	// 如果当前用户是逻辑视图的 Owner 则不需要再向 auth-service 鉴权。避免
	// auth-service 再向 data-view 判断当前用户是否是逻辑视图的 Owner。
	if subject.Type == auth_service_v1.SubjectUser && subject.ID == formView.OwnerId.String {
		for _, f := range fields {
			f.IsReadable = true
			f.IsDownloadable = true
		}
		return nil
	}

	// 获取逻辑视图的子视图
	subViews, _, err := f.subViewRepo.List(ctx, sub_view.ListOptions{LogicViewID: uuid.MustParse(formView.ID)})
	if err != nil {
		return err
	}

	// 构造鉴权请求
	var objects = []auth_service_v1.Object{}
	objects = append(objects, auth_service_v1.Object{Type: auth_service_v1.ObjectDataView, ID: formView.ID})
	for _, v := range subViews {
		objects = append(objects, auth_service_v1.Object{Type: auth_service_v1.ObjectSubView, ID: v.ID.String()})
	}
	var requests []auth_service.EnforceRequest
	for _, obj := range objects {
		for act := range dataViewAllActions {
			requests = append(requests, auth_service.EnforceRequest{
				SubjectType: string(subject.Type),
				SubjectID:   subject.ID,
				ObjectType:  string(obj.Type),
				ObjectID:    obj.ID,
				Action:      act,
			})
		}
	}

	// 向 auth-service 鉴权
	responses, err := f.DrivenAuthService.Enforce(ctx, requests)
	if err != nil {
		return err
	}

	// 当前用户可以对逻辑视图执行的动作
	var dataViewActions = sets.New[string]()
	for i, effect := range responses {
		req := requests[i]
		if req.SubjectType != string(subject.Type) {
			continue
		}
		if req.SubjectID != subject.ID {
			continue
		}
		if req.ObjectType != auth_service.ObjectTypeDataView {
			continue
		}
		if req.ObjectID != formView.ID {
			continue
		}
		if !effect {
			continue
		}
		action := requests[i].Action
		if !dataViewAllActions.Has(action) {
			continue
		}
	}
	for _, f := range fields {
		f.IsReadable = dataViewActions.Has(auth_service.Action_Read)
		f.IsDownloadable = dataViewActions.Has(auth_service.Action_Download)
	}
	// 如果可以对逻辑视图执行所有动作，不需要再检查子视图的权限
	if dataViewActions.Equal(dataViewAllActions) {
		return nil
	}

	// 当前用户可以对子视图执行的动作。KEY = 子视图 ID，VALUE = 动作
	var subViewActions = make(map[uuid.UUID]sets.Set[string])
	for i, effect := range responses {
		req := requests[i]
		if req.SubjectType != string(subject.Type) {
			continue
		}
		if req.SubjectID != subject.ID {
			continue
		}
		if req.ObjectType != auth_service.ObjectTypeSubView {
			continue
		}
		if !effect {
			continue
		}
		if !subViewAllActions.Has(req.Action) {
			continue
		}
		id, err := uuid.Parse(req.ObjectID)
		if err != nil {
			return err
		}
		if subViewActions[id] == nil {
			subViewActions[id] = make(sets.Set[string])
		}
		subViewActions[id].Insert(req.Action)
	}
	// 子视图拥有的列。KEY = 子视图 ID，VALUE = 列 ID
	var subViewFieldIDs = make(map[uuid.UUID]sets.Set[string])
	for _, v := range subViews {
		var d form_view.TaskDetail
		if err := json.Unmarshal([]byte(v.Detail), &d); err != nil {
			return err
		}
		subViewFieldIDs[v.ID] = make(sets.Set[string])
		for _, ff := range d.Fields {
			subViewFieldIDs[v.ID].Insert(ff.ID)
		}
	}
	// 当前用户可以对字段执行的动作。KEY = 字段 ID，VALUE = 动作
	var fieldActions = make(map[string]sets.Set[string])
	for _, f := range fields {
		fieldActions[f.ID] = sets.New[string]()
	}
	for _, v := range subViews {
		for id := range subViewFieldIDs[v.ID] {
			fieldActions[id] = fieldActions[id].Union(subViewActions[v.ID])
		}
	}

	for _, f := range fields {
		f.IsReadable = f.IsReadable || fieldActions[f.ID].Has(auth_service.Action_Read)
		f.IsDownloadable = f.IsDownloadable || fieldActions[f.ID].Has(auth_service.Action_Download)
	}

	return nil
}

// filteringSubViewUserAuthorized 过滤行列规则（子视图），返回当前用户拥有任意权限的行列规则（子视图）
func (f *formViewUseCase) filteringSubViewUserAuthorized(ctx context.Context, subViews []model.SubView) (result []model.SubView, err error) {
	// 获取当前用户信息
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return
	}

	// 获取用户有权限的子视图（行列规则）
	objects, err := f.DrivenAuthService.GetUsersObjects(ctx, &auth_service.GetUsersObjectsReq{
		ObjectType:  auth_service.ObjectTypeSubView,
		SubjectId:   userInfo.ID,
		SubjectType: auth_service.SubjectTypeUser,
	})
	if err != nil {
		return nil, err
	}

	// 有任意权限的行列规则 ID 列表
	var authorizedSubViewIDs []string
	for _, e := range objects.EntriesList {
		// 跳过不是子视图（行列规则）的鉴权结果
		if e.ObjectType != auth_service.ObjectTypeSubView {
			continue
		}

		for _, p := range e.PermissionsList {
			// 跳过不被允许的权限
			if p.Effect != auth_service.Effect_Allow {
				continue
			}
			// 存在一个允许的权限即可，不再检查其他权限
			authorizedSubViewIDs = append(authorizedSubViewIDs, e.ObjectId)
			break
		}
	}

	// 根据 ID 过滤 SubView 对象
	for _, sv := range subViews {
		if !slices.Contains(authorizedSubViewIDs, sv.ID.String()) {
			continue
		}
		result = append(result, sv)
	}

	return
}

// getFieldIDsFromSubViews 返回多个子视图（行列规则）所包含的列的 ID 列表
func getFieldIDsFromSubViews(subViews []model.SubView) (result []string) {
	// 子视图的行列规则定义，避免遍历子视图列表过程中重复创建变量。
	var td form_view.TaskDetail

	var idSet = make(map[string]struct{})
	for _, sv := range subViews {
		if err := json.Unmarshal([]byte(sv.Detail), &td); err != nil {
			log.Error("decode detail of sub view fail", zap.Error(err))
			continue
		}
		for _, f := range td.Fields {
			idSet[f.ID] = struct{}{}
		}
	}

	// 集合转列表
	for id := range idSet {
		result = append(result, id)
	}
	// 排序
	sort.Strings(result)

	return
}

// isFormViewDownloadable 判断当前用户是否可以下载指定的逻辑视图。满足下列任意条
// 件即可下载逻辑视图
//  1. 当前用户是逻辑视图的 Owner
//  2. 当前用户拥有逻辑视图的下载权限
//  3. 当前用户拥有逻辑视图任意一个子视图(行列规则)的下载权限
func (f *formViewUseCase) isFormViewDownloadable(ctx context.Context, fv *model.FormView) (ok bool, err error) {
	// 获取用户信息
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return
	}

	// 判断当前用户是否是逻辑视图的 Owner
	if ok = u.ID == fv.OwnerId.String; ok {
		return
	}

	// 判断当前用户是否拥有逻辑视图的下载权限
	if ok, err = f.DrivenAuthService.VerifyUserPermissionObject(ctx, auth_service.Action_Download, auth_service.ObjectTypeDataView, fv.ID); err != nil || ok {
		return
	}

	// 获取从属于逻辑视图的子视图（行列规则）
	subViews, _, err := f.subViewRepo.List(ctx, sub_view.ListOptions{LogicViewID: uuid.MustParse(fv.ID)})
	if err != nil {
		return
	}
	// 子视图的 ID 列表
	var subViewIDs []string
	for _, sv := range subViews {
		subViewIDs = append(subViewIDs, sv.ID.String())
	}
	// 判断当前用户是否拥有子视图（行列规则）的下载权限
	oks, err := f.DrivenAuthService.VerifyUserPermissionOnSameTypeObjects(ctx, auth_service.Action_Download, auth_service.ObjectTypeSubView, subViewIDs...)
	if err != nil {
		return
	}
	for _, ok = range oks {
		if ok {
			return
		}
	}

	return
}

func (f *formViewUseCase) isFormViewReadable(ctx context.Context, fv *model.FormView, fields []string) (ok bool, err error) {
	// 获取用户信息
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return
	}

	// 判断当前用户是否是逻辑视图的 Owner
	if ok = u.ID == fv.OwnerId.String; ok {
		return
	}

	// 判断当前用户是否拥有逻辑视图的读取权限
	if ok, err = f.DrivenAuthService.VerifyUserPermissionObject(ctx, auth_service.Action_Read, auth_service.ObjectTypeDataView, fv.ID); err != nil || ok {
		return
	}

	// 获取从属于逻辑视图的子视图（行列规则）
	subViews, _, err := f.subViewRepo.List(ctx, sub_view.ListOptions{LogicViewID: uuid.MustParse(fv.ID)})
	if err != nil {
		return
	}
	var verifySubViewReq []*auth_service.VerifyUserAuthorityReq
	for _, sv := range subViews {
		verifySubViewReq = append(verifySubViewReq, &auth_service.VerifyUserAuthorityReq{
			ObjectId: sv.ID.String(),
			Action:   auth_service.Action_Read,
			GetUsersObjectsReq: auth_service.GetUsersObjectsReq{
				ObjectType:  auth_service.ObjectTypeSubView,
				SubjectId:   u.ID,
				SubjectType: auth_service.SubjectTypeUser,
			},
		})
	}
	verifySubViewEntries, err := f.DrivenAuthService.VerifyUserAuthority(ctx, verifySubViewReq)
	if err != nil {
		return
	}

	// 有读取权限的子视图 ID 集合
	var readableSubViewIDSet = make(map[string]struct{})
	for _, e := range verifySubViewEntries {
		if e.Effect != auth_service.Effect_Allow {
			continue
		}
		readableSubViewIDSet[e.ObjectId] = struct{}{}
	}
	if len(readableSubViewIDSet) == 0 {
		return false, errorcode.Desc(my_errorcode.UserNotHaveThisFormViewPermissions)
	}
	// 有读取权限的字段 ID 集合
	var readableFieldIDSet = make(map[string]struct{})
	// 获取读取权限的子视图，解析 SubView.Detail.Fields 得到字段
	for id := range readableSubViewIDSet {
		sv, err := f.subViewRepo.Get(ctx, uuid.MustParse(id))
		if err != nil {
			return false, err
		}
		td := &form_view.TaskDetail{}
		if err := json.Unmarshal([]byte(sv.Detail), td); err != nil {
			return false, err
		}
		for _, field := range td.Fields {
			readableFieldIDSet[field.ID] = struct{}{}
		}
	}

	for _, field := range fields {
		if _, readable := readableFieldIDSet[field]; !readable {
			return false, errorcode.Detail(my_errorcode.UserNotHaveThisFieldPermissions, field)
		}
	}
	return true, nil
}

func (f *formViewUseCase) MarkFormViewBusinessTimestamp(ctx context.Context, msg []byte) error {
	if len(msg) == 0 {
		return nil
	}
	var data *form_view.ResultResp
	if err := json.Unmarshal(msg, &data); err != nil {
		log.WithContext(ctx).Errorf("explore result Unmarshal error: %s", err.Error())
		return err
	}
	var result []*form_view.FieldInfo
	if err := json.Unmarshal([]byte(data.Result), &result); err != nil {
		log.WithContext(ctx).Errorf("explore result Unmarshal error: %s", err.Error())
		return err
	}
	view, err := f.repo.GetById(ctx, data.ViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", data.ViewId, err)
		return err
	}
	// 已经标记过业务时间戳的不再标记
	models, err := f.fieldRepo.GetBusinessTimestamp(ctx, data.ViewId)
	if err != nil {
		log.WithContext(ctx).Errorf("get business timestamp for form view fiel: %v failed, err: %v", data.ViewId, err)
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	blacklistMap := make(map[string]int)
	blacklists, err := f.configurationCenterDrivenNG.GetTimestampBlacklist(ctx)
	if err != nil {
		log.WithContext(ctx).Error("get timestamp blacklist for data view fail")
	} else {
		for _, blacklist := range blacklists {
			if _, ok := blacklistMap[blacklist]; !ok {
				blacklistMap[blacklist] = 1
			}
		}
	}
	if len(models) > 0 {
		for _, field := range models {
			if _, ok := blacklistMap[field.TechnicalName]; !ok {
				return nil
			}
		}
	}

	if view.ExploreTimestampID != nil && *view.ExploreTimestampID == data.TaskId {
		columns, err := f.fieldRepo.GetFormViewFieldList(ctx, data.ViewId)
		if err != nil {
			log.WithContext(ctx).Errorf("get field info failed, err: %v", err)
			return errorcode.Detail(my_errorcode.GetDataTableDetailError, err)
		}
		var maxTime time.Time
		var fieldName string
		fieldInfoMap := make(map[string]string, 0)
		for _, column := range columns {
			fieldInfoMap[column.TechnicalName] = column.ID
		}
		fieldMap := make(map[string]time.Time, 0)
		formats := []string{
			"2006-01-02T15:04:05.000Z",
			"2006-01-02 15:04:05 MST",
			"02/Jan/2006:15:04:05 MST",
			"01/02/2006 15:04:05 PM",
			"2006-01-02T15:04:05",
			"01/02/2006 15:04:05",
			"02-01-2006 15:04:05",
			"2006年01月02日 15时04分05秒",
			"2006-01-02 15:04:05",
			"2006-1-2 15:04:05",
			"2006/01/02 15:04:05",
			"2006/1/2 15:04:05",
			"01/02/2006 15:04",
			"02-01-2006 15:04",
			"2006年01月02日 15时04分",
			"2006-01-02 15:04",
			"2006-1-2 15:04",
			"2006/01/02 15:04",
			"2006/1/2 15:04",
			"2006-01-02",
			"2006-1-2",
			"2006/01/02",
			"20060102",
			"2006/1/2",
			"2006.01.02",
			"2006.1.2",
			"01/02/2006",
			"02-01-2006",
			"2006年01月02日",
		}
		for i := range result {
			res := strings.TrimSpace(result[i].Value)
			for _, format := range formats {
				value, err := time.Parse(format, res)
				if err == nil {
					fieldMap[result[i].FieldName] = value
					break
				}
			}
		}
		for key, value := range fieldMap {
			if value.After(maxTime) {
				maxTime = value
				fieldName = key
			}
		}
		if fieldName != "" {
			if fieldID, exist := fieldInfoMap[fieldName]; exist {
				err = f.fieldRepo.UpdateBusinessTimestamp(ctx, data.ViewId, fieldID)
				if err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func (f *formViewUseCase) GetDatasourceOverview(ctx context.Context, req *form_view.GetDatasourceOverviewReq) (*form_view.DatasourceOverviewResp, error) {
	datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, req.DatasourceID)
	if err != nil {
		return nil, err
	}
	formViews, err := f.repo.GetFormViewList(ctx, req.DatasourceID)
	if err != nil {
		log.WithContext(ctx).Errorf("DatasourceExploreConfig GetFormViewList error: %s,datasource id: %s", err.Error(), req.DatasourceID)
		return nil, err
	}
	formViewInfoMap := make(map[string]int)
	for _, form := range formViews {
		formViewInfoMap[form.ID] = 1
	}
	var viewCount, exploredDataViewCount, exploredTimestampViewCount, exploredClassificationViewCount, publishedViewCount, configuredViewCount, fieldCount, associatedStandardFieldCount, associatedCodeFieldCount int64
	viewCount = int64(len(formViews))
	catalogName := strings.Split(datasource.DataViewSource, ".")[0]
	schema := strings.Split(datasource.DataViewSource, ".")[1]
	rBuf, err := f.dataExploration.GetStatus(ctx, catalogName, schema, "")
	if err != nil {
		return nil, err
	}
	if rBuf != nil {
		ret := &form_view.JobStatusList{}
		if err = json.Unmarshal(rBuf, ret); err != nil {
			log.WithContext(ctx).Errorf("解析获取探查作业状态失败 catalog:%s schema:%s，err is %v", datasource.CatalogName, datasource.Schema, err)
			return nil, errorcode.Detail(my_errorcode.DataExplorationGetTaskError, err)
		}
		exploreTimestampInfoMap := make(map[string]int)
		exploreDataInfoMap := make(map[string]int)
		for _, task := range ret.Entries {
			if _, ok := formViewInfoMap[task.TableId]; ok {
				if task.ExploreType == explore_task.TaskExploreTimestamp.Integer.Int32() {
					if _, exist := exploreTimestampInfoMap[task.TaskName]; !exist {
						exploreTimestampInfoMap[task.TaskName] = 1
					}
				}
				if task.ExploreType == explore_task.TaskExploreData.Integer.Int32() {
					if _, exist := exploreDataInfoMap[task.TaskName]; !exist {
						exploreDataInfoMap[task.TaskName] = 1
					}
				}
			}
		}
		exploredTimestampViewCount = int64(len(exploreTimestampInfoMap))
		exploredDataViewCount = int64(len(exploreDataInfoMap))
	}
	//
	exploredClassificationViews, err := f.tmpExploreSubTaskRepo.GetByStatus(ctx, []int32{explore_task.TaskStatusFinished.Integer.Int32()})
	if err != nil {
		return nil, err
	}
	for _, id := range exploredClassificationViews {
		if _, ok := formViewInfoMap[id]; ok {
			exploredClassificationViewCount++
		}
	}

	formViewIds := make([]string, 0)
	for _, formView := range formViews {
		if formView.PublishAt != nil {
			publishedViewCount++
		}
		formViewIds = append(formViewIds, formView.ID)
	}
	configuredViewCount, err = f.exploreRuleConfigRepo.GetConfiguredViewsByFormViewIds(ctx, formViewIds)
	if err != nil {
		return nil, err
	}
	formViewFields, _ := f.fieldRepo.GetFieldsByFormViewIds(ctx, formViewIds)
	fieldCount = int64(len(formViewFields))
	for _, formViewField := range formViewFields {
		if formViewField.StandardCode.String != "" {
			associatedStandardFieldCount++
		}
		if formViewField.CodeTableID.String != "" {
			associatedCodeFieldCount++
		}
	}

	return &form_view.DatasourceOverviewResp{
		ViewCount:                       viewCount,
		ExploredDataViewCount:           exploredDataViewCount,
		ExploredTimestampViewCount:      exploredTimestampViewCount,
		ExploredClassificationViewCount: exploredClassificationViewCount,
		PublishedViewCount:              publishedViewCount,
		ConfiguredViewCount:             configuredViewCount,
		FieldCount:                      fieldCount,
		AssociatedStandardFieldCount:    associatedStandardFieldCount,
		AssociatedCodeFieldCount:        associatedCodeFieldCount,
	}, nil
}

func (f *formViewUseCase) GetExploreConfig(ctx context.Context, req *form_view.GetExploreConfigReq) (*form_view.ExploreConfigResp, error) {
	if req.FormViewID != "" {
		view, err := f.repo.GetById(ctx, req.FormViewID)
		if err != nil {
			log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.FormViewID, err)
			return nil, err
		}
		if view.ExploreJobId != nil && *view.ExploreJobId != "" {
			task, _ := f.exploreTaskRepo.GetConfigByFormViewId(ctx, req.FormViewID)
			if task != nil {
				return &form_view.ExploreConfigResp{
					FormViewID: req.FormViewID,
					Config:     task.Config,
				}, nil
			}
		}
	} else if req.DatasourceID != "" {
		_, err := f.datasourceRepo.GetById(ctx, req.DatasourceID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.WithContext(ctx).Errorf("DataExplore datasource GetById error: %s ,datasource id: %s", err.Error(), req.DatasourceID)
				return nil, errorcode.Desc(my_errorcode.DataSourceIDNotExist)
			}
			log.WithContext(ctx).Error("DataExplore datasource GetById DatabaseError", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		task, _ := f.exploreTaskRepo.GetConfigByDatasourceId(ctx, req.DatasourceID)
		if task != nil {
			return &form_view.ExploreConfigResp{
				DatasourceID: req.DatasourceID,
				Config:       task.Config,
			}, nil
		}
	} else {
		return nil, errorcode.Desc(my_errorcode.FormViewIDAndDatasourceID)
	}
	return nil, nil
}

func (f *formViewUseCase) GetFieldExploreReport(ctx context.Context, req *form_view.GetFieldExploreReportReq) (*form_view.FieldExploreReportResp, error) {
	log.Info("GetFieldExploreReport,req:", zap.Any("req", req))
	formViewField, err := f.fieldRepo.GetField(ctx, req.FieldID)
	if err != nil {
		return nil, err
	}
	view, err := f.repo.GetById(ctx, formViewField.FormViewID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", formViewField.FormViewID, err)
		return nil, err
	}
	resp := &form_view.FieldExploreReportResp{}
	if view.ExploreJobId != nil && len(*view.ExploreJobId) > 0 {
		dataType := constant.SimpleTypeMapping[formViewField.DataType]
		rBuf, err := f.dataExploration.GetFieldReport(ctx, *view.ExploreJobId, formViewField.TechnicalName, dataType)
		if err != nil {
			return nil, err
		}
		if rBuf != nil {
			fieldReport := &form_view.FieldReport{}
			if err = json.Unmarshal(rBuf, fieldReport); err != nil {
				log.WithContext(ctx).Errorf("解析获取探查作业：%s 字段：%s 报告失败，err is %v", *view.ExploreJobId, formViewField.TechnicalName, err)
				return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err)
			}
			resp.TotalCount = fieldReport.TotalSample
			if dataType == constant.SimpleInt || dataType == constant.SimpleFloat || dataType == constant.SimpleDecimal || dataType == constant.SimpleChar {
				type DataItem struct {
					Key   interface{} `json:"key"`
					Value int         `json:"value"`
				}
				var data []DataItem
				if err = json.Unmarshal([]byte(fieldReport.Data), &data); err != nil {
					log.WithContext(ctx).Errorf("解析获取探查作业：%s 字段：%s 报告失败，err is %v", *view.ExploreJobId, formViewField.TechnicalName, err)
					return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err)
				}
				groupInfos := make([]*form_view.GroupInfo, 0)
				for _, item := range data {
					groupInfo := &form_view.GroupInfo{
						Count: item.Value,
					}
					var value string
					if item.Key == nil {
						groupInfo.Value = nil
					} else {
						if dataType == constant.SimpleChar || dataType == constant.SimpleDecimal {
							value = item.Key.(string)
						} else {
							value = strconv.FormatFloat(item.Key.(float64), 'f', -1, 64)
						}
						groupInfo.Value = &value
						//如果非管理员脱敏
						userInfo, _ := util.GetUserInfo(ctx)
						//hasRole1, err := f.authorizationDriven.HasInnerBusinessRoles(ctx, userInfo.ID)
						hasRole1, err := f.commonAuthService.MenuResourceActions(ctx, userInfo.ID, common_middleware.DatasheetView)
						if err != nil {
							return nil, err
						}
						//hasRole2, err := f.configurationCenterDriven.GetRolesInfo(ctx, access_control.TCDataOperationEngineer, userInfo.ID)
						//if err != nil {
						//	return nil, err
						//}
						if !hasRole1.HasManageAction() {
							dataPrivacyPolicy, err := f.dataPrivacyPolicyRepo.GetByFormViewId(ctx, formViewField.FormViewID)
							log.WithContext(ctx).Info("GetFieldExploreReport,dataPrivacyPolicy:", zap.Any("dataPrivacyPolicy", dataPrivacyPolicy))
							if err != nil {
								if errors.Is(err, gorm.ErrRecordNotFound) {
								}
								return nil, err
							}
							var dataPrivacyPolicyField *model.DataPrivacyPolicyField
							if dataPrivacyPolicy != nil {
								dataPrivacyPolicyField, err = f.dataPrivacyPolicyFieldRepo.GetFieldPolicyByFieldId(ctx, dataPrivacyPolicy.ID)
								if err != nil {
									return nil, err
								}
							}
							log.WithContext(ctx).Info("GetFieldExploreReport,dataPrivacyPolicyField:", zap.Any("dataPrivacyPolicyField", dataPrivacyPolicyField))
							if dataPrivacyPolicyField != nil {
								desensitizedRule, err := f.desensitizationRuleRepo.GetByID(ctx, dataPrivacyPolicyField.DesensitizationRuleID)
								if err != nil {
									return nil, err
								}
								log.WithContext(ctx).Info("GetFieldExploreReport,desensitizedRule:", zap.Any("desensitizedRule", desensitizedRule))
								if desensitizedRule != nil {
									if desensitizedRule.Method == "all" {
										masked := strings.Repeat("*", len(value))
										groupInfo.Value = &masked
									} else if desensitizedRule.Method == "middle" {
										if int(desensitizedRule.MiddleBit) < len(value) {
											headLen := (len(value) - int(desensitizedRule.MiddleBit)) / 2
											tailLen := len(value) - int(desensitizedRule.MiddleBit) - headLen
											masked := value[:headLen] + strings.Repeat("*", int(desensitizedRule.MiddleBit)) + value[len(value)-tailLen:]
											groupInfo.Value = &masked
										} else {
											masked := strings.Repeat("*", len(value))
											groupInfo.Value = &masked
										}
									} else if desensitizedRule.Method == "head-tail" {
										if int(desensitizedRule.HeadBit)+int(desensitizedRule.TailBit) < len(value) {
											masked := strings.Repeat("*", int(desensitizedRule.HeadBit)) + value[int(desensitizedRule.HeadBit):len(value)-int(desensitizedRule.TailBit)] + strings.Repeat("*", int(desensitizedRule.TailBit))
											groupInfo.Value = &masked
										} else {
											masked := strings.Repeat("*", len(value))
											groupInfo.Value = &masked
										}
									}
								}
								log.WithContext(ctx).Info("GetFieldExploreReport,groupInfo:", zap.Any("groupInfo", groupInfo))
							}
						}
					}
					groupInfos = append(groupInfos, groupInfo)
				}
				resp.Group = groupInfos
			} else if dataType == constant.SimpleDate || dataType == constant.SimpleDatetime {
				var data form_view.TimeRange
				if err = json.Unmarshal([]byte(fieldReport.Data), &data); err != nil {
					log.WithContext(ctx).Errorf("解析获取探查作业：%s 字段：%s 报告失败，err is %v", *view.ExploreJobId, formViewField.TechnicalName, err)
					return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err)
				}
				type Result struct {
					Result *string `json:"result"`
				}
				if data.Max != nil {
					var maxResult []Result
					if err := json.Unmarshal([]byte(*data.Max), &maxResult); err != nil {
						log.WithContext(ctx).Errorf("解析获取探查作业：%s 字段：%s 报告失败，err is %v", *view.ExploreJobId, formViewField.TechnicalName, err)
						return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err)
					}
					data.Max = maxResult[0].Result
				}
				if data.Min != nil {
					var minResult []Result
					if err := json.Unmarshal([]byte(*data.Min), &minResult); err != nil {
						log.WithContext(ctx).Errorf("解析获取探查作业：%s 字段：%s 报告失败，err is %v", *view.ExploreJobId, formViewField.TechnicalName, err)
						return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err)
					}
					data.Min = minResult[0].Result
				}
				resp.TimeRange = &data
			}
		}
	}
	return resp, nil
}

// UndoAudit 审核撤回
func (f *formViewUseCase) UndoAudit(ctx context.Context, req *form_view.UndoAuditReq) error {
	logicView, err := f.logicViewRepo.Get(ctx, req.LogicViewID)
	if err != nil {
		return err
	}
	switch req.OperateType {
	case constant.UndoPublishAudit:
		//状态校验
		//if logicView.PublishStatus != constant.PublishStatusPubAuditing || logicView.AuditType != constant.AuditTypePublish {
		if logicView.AuditType != constant.AuditTypePublish {
			return errorcode.Desc(my_errorcode.LogicViewAuditUndoError)
		}
		// logicView.PublishStatus = constant.PublishStatusUnPublished
		if req.AuditAdvice != "" {
			logicView.AuditAdvice = req.AuditAdvice
		}
	case constant.UndoUpAudit:
		//状态校验
		if logicView.AuditType != constant.AuditTypeOnline || logicView.OnlineStatus != constant.LineStatusUpAuditing {
			return errorcode.Desc(my_errorcode.LogicViewAuditUndoError)
		}
		logicView.OnlineStatus = constant.LineStatusNotLine
		if req.AuditAdvice != "" {
			logicView.AuditAdvice = req.AuditAdvice
		}
	case constant.UndoDownAudit:
		//状态校验
		if logicView.AuditType != constant.AuditTypeOffline || logicView.OnlineStatus != constant.LineStatusDownAuditing {
			return errorcode.Desc(my_errorcode.LogicViewAuditUndoError)
		}
		logicView.OnlineStatus = constant.LineStatusOnLine
		if req.AuditAdvice != "" {
			logicView.AuditAdvice = req.AuditAdvice
		}
		if req.ScanChangeUndo {
			logicView.OnlineStatus = constant.LineStatusNotLine
		}
	default:
		return errorcode.Desc(my_errorcode.LogicViewAuditUndoError)
	}

	//给wf发审核撤回的消息
	msg := &wf_common.AuditCancelMsg{ApplyIDs: []string{strconv.FormatUint(logicView.ApplyID, 10)}}
	msg.Cause.ZHCN = "revocation" //固定单词，否则审核结果不是undo，而是reject
	msg.Cause.ZHTW = "revocation"
	msg.Cause.ENUS = "revocation"
	err = f.workflow.AuditCancel(msg)
	if err != nil {
		log.WithContext(ctx).Error("logicViewUseCase UndoAudit  --> 审核撤回消息发送失败：", zap.Error(err), zap.Uint64("logicView.ApplyID", logicView.ApplyID), zap.String("req.OperateType", req.OperateType))
		return err
	}
	log.Info("producer workflow msg", zap.Uint64("logicView.ApplyID", logicView.ApplyID), zap.String("req.OperateType", req.OperateType))

	err = f.logicViewRepo.Update(ctx, logicView)
	if err != nil {
		log.Error("logicViewUseCase UndoAudit logicViewRepo Update logicView", zap.Error(err), zap.String("logicView.ID", logicView.ID))
	}
	return err
}

func (f *formViewUseCase) GetFilterRule(ctx context.Context, req *form_view.GetFilterRuleReq) (*form_view.GetFilterRuleResp, error) {
	view, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}
	return &form_view.GetFilterRuleResp{ID: req.ID, FilterRule: view.FilterRule}, nil
}

func (f *formViewUseCase) UpdateFilterRule(ctx context.Context, req *form_view.UpdateFilterRuleReq) error {
	view, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return err
	}
	if view.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return errorcode.Desc(my_errorcode.FormViewIdNotExist)
	}
	// 调用虚拟化引擎更新视图接口
	dataSource, err := f.datasourceRepo.GetByIdWithCode(ctx, view.DatasourceID)
	if err != nil {
		return err
	}
	GetViewSQL, err := f.logicViewRepo.GetLogicViewSQL(ctx, req.ID)
	if err != nil {
		return err
	}
	var viewSQL string
	if len(GetViewSQL) != 0 {
		viewSQL = GetViewSQL[0].Sql
		index := strings.LastIndex(viewSQL, " where ")
		if index != -1 { // 如果存在 "where" 关键字，则替换 "where" 后面的部分
			viewSQL = viewSQL[:index]
		}
		viewSQL = fmt.Sprintf("%s where %s", viewSQL, req.FilterRule)
	} else { //兼容
		viewSQL = fmt.Sprintf("select * from %s.%s.%s where %s", dataSource.CatalogName, util.QuotationMark(dataSource.Schema), util.QuotationMark(view.TechnicalName), req.FilterRule)
	}

	if err = f.DrivenVirtualizationEngine.ModifyView(ctx, &virtualization_engine.ModifyViewReq{
		CatalogName: dataSource.DataViewSource,
		Query:       viewSQL,
		ViewName:    view.TechnicalName,
	}); err != nil {
		return err
	}
	log.WithContext(ctx).Infof("formViewModify ", zap.String("formView name", view.TechnicalName), zap.String("formView ID", req.ID))
	view.FilterRule = req.FilterRule
	if err = f.repo.Update(ctx, view); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if err = f.repo.SaveFormViewSql(ctx, &model.FormViewSql{FormViewID: req.ID, Sql: viewSQL}, nil); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	return nil
}

func (f *formViewUseCase) DeleteFilterRule(ctx context.Context, req *form_view.DeleteFilterRuleReq) error {
	view, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return err
	}
	if view.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return errorcode.Desc(my_errorcode.FormViewIdNotExist)
	}
	if view.FilterRule == "" {
		return nil
	}
	// 调用虚拟化引擎更新视图接口
	datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, view.DatasourceID)
	if err != nil {
		return err
	}
	GetViewSQL, err := f.logicViewRepo.GetLogicViewSQL(ctx, req.ID)
	if err != nil {
		return err
	}
	var viewSQL string
	if len(GetViewSQL) != 0 {
		viewSQL = GetViewSQL[0].Sql
		index := strings.Index(viewSQL, " where ")
		if index != -1 { // 如果存在 "where" 关键字，则替换 "where" 后面的部分
			viewSQL = viewSQL[:index]
		}
	} else { //兼容
		viewSQL = fmt.Sprintf("select * from %s.%s.%s", datasource.CatalogName, util.QuotationMark(datasource.Schema), util.QuotationMark(view.TechnicalName))
	}
	if err = f.DrivenVirtualizationEngine.ModifyView(ctx, &virtualization_engine.ModifyViewReq{
		CatalogName: datasource.DataViewSource,
		Query:       viewSQL,
		ViewName:    view.TechnicalName,
	}); err != nil {
		return err
	}
	log.WithContext(ctx).Infof("formViewModify ", zap.String("formView name", view.TechnicalName), zap.String("formView ID", req.ID))
	view.FilterRule = ""
	if err = f.repo.Save(ctx, view); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if err = f.repo.SaveFormViewSql(ctx, &model.FormViewSql{FormViewID: req.ID, Sql: viewSQL}, nil); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}

func (f *formViewUseCase) ExecFilterRule(ctx context.Context, req *form_view.ExecFilterRuleReq) (*form_view.ExecFilterRuleResp, error) {
	view, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}
	if view.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return nil, errorcode.Desc(my_errorcode.FormViewIdNotExist)
	}
	datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, view.DatasourceID)
	if err != nil {
		return nil, err
	}
	data, err := f.DrivenVirtualizationEngine.FetchData(ctx,
		fmt.Sprintf(`select * from %s.%s.%s where %s limit 10`,
			datasource.CatalogName,
			util.QuotationMark(datasource.Schema),
			util.QuotationMark(view.TechnicalName),
			req.FilterRule))
	if err != nil {
		return nil, err
	}
	columns := make([]*virtualization_engine.Column, 0)
	for _, column := range data.Columns {
		columns = append(columns, column)
	}
	return &form_view.ExecFilterRuleResp{
		Data:    data.Data,
		Columns: data.Columns,
		Count:   data.TotalCount,
	}, nil
}

func (f *formViewUseCase) CreateCompletion(ctx context.Context, req *form_view.CreateCompletionReq) (*form_view.CreateCompletionResp, error) {
	if !*req.CompleteViewName && !*req.CompleteViewDescription && !*req.CompleteFieldName {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "complete_view_name,complete_view_description,complete_field_name 至少有一个为true")
	}
	requestType := 0
	if *req.CompleteViewName {
		requestType = 1
	}
	if *req.CompleteViewDescription {
		requestType += 2
	}
	if *req.CompleteFieldName {
		requestType += 4
	}
	view, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}
	if view.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return nil, errorcode.Desc(my_errorcode.FormViewIdNotExist)
	}
	completion, _ := f.tmpCompletionRepo.Get(ctx, req.ID)
	if completion != nil {
		log.WithContext(ctx).Errorf("the completion task  for form view: %v already exists", req.ID)
		return nil, errorcode.Desc(my_errorcode.CompletionRepeat)
	}
	fields, err := f.fieldRepo.GetFormViewFields(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	columns := make([]*sailor_service.Column, 0)
	for _, field := range fields {
		columns = append(columns, &sailor_service.Column{ID: field.ID, TechnicalName: field.TechnicalName, BusinessName: field.BusinessName, DataType: field.OriginalDataType, Comment: ""})
	}
	datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, view.DatasourceID)
	if err != nil {
		return nil, err
	}
	catalogName := strings.Split(datasource.DataViewSource, ".")[0]
	schema := strings.Split(datasource.DataViewSource, ".")[1]
	tableCompletionReq := &sailor_service.TableCompletionReq{
		ID:                    view.ID,
		TechnicalName:         view.TechnicalName,
		BusinessName:          view.BusinessName,
		Desc:                  view.Description.String,
		ViewSourceCatalogName: catalogName,
		Database:              schema,
		Subject:               view.SubjectId.String,
		RequestType:           requestType,
		Columns:               columns,
	}
	var res *sailor_service.TableCompletionTableInfoResp
	if !*req.CompleteFieldName {
		res, err = f.afSailorServiceDriven.TableCompletion(ctx, tableCompletionReq)
	} else {
		fieldCompletionReq := &sailor_service.FieldCompletionReq{TableCompletionReq: *tableCompletionReq, GenFieldIds: req.Ids}
		res, err = f.afSailorServiceDriven.FieldCompletion(ctx, fieldCompletionReq)
	}
	if err != nil {
		return nil, err
	}
	m := &model.TmpCompletion{FormViewID: req.ID, CompletionID: res.Res.TaskId, Status: form_view.CompletionStatusRunning.Integer.Int32()}
	err = f.tmpCompletionRepo.Create(ctx, m)
	if err != nil {
		return nil, err
	}
	return &form_view.CreateCompletionResp{
		ID: req.ID,
	}, nil
}

func (f *formViewUseCase) GetCompletion(ctx context.Context, req *form_view.GetCompletionReq) (*form_view.GetCompletionResp, error) {
	resp := &form_view.GetCompletionResp{ID: req.ID}
	view, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}
	if view.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return nil, errorcode.Desc(my_errorcode.FormViewIdNotExist)
	}
	m, err := f.tmpCompletionRepo.Get(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get completion for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}
	if m.Status == form_view.CompletionStatusFailed.Integer.Int32() {
		return nil, errorcode.Detail(my_errorcode.CompletionFailed, m.Reason)
	}
	if m.Result != "" {
		ret := &form_view.CompletionResult{}
		if err = json.Unmarshal([]byte(m.Result), ret); err != nil {
			log.WithContext(ctx).Errorf("解析补全结果失败 ids:%s，err is %v", m.Result, err)
			return nil, errorcode.Detail(my_errorcode.UnmarshalCompletionFailed, err)
		}
		resp.Result = ret
	}

	return resp, nil
}

func (f *formViewUseCase) UpdateCompletion(ctx context.Context, req *form_view.UpdateCompletionReq) (*form_view.UpdateCompletionResp, error) {
	view, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}
	if view.Type != constant.FormViewTypeDatasource.Integer.Int32() {
		return nil, errorcode.Desc(my_errorcode.FormViewIdNotExist)
	}
	m, err := f.tmpCompletionRepo.Get(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get completion for form view: %v failed, err: %v", req.ID, err)
		return nil, err
	}
	if req.Result == nil {
		err = f.tmpCompletionRepo.Delete(ctx, req.ID)
		if err != nil {
			return nil, err
		}
	} else {
		buf, err := json.Marshal(req.Result)
		if err != nil {
			log.WithContext(ctx).Errorf("json.Marshal completion result 失败，err is %v", err)
		}
		m.Result = util.BytesToString(buf)
		err = f.tmpCompletionRepo.Update(ctx, m)
		if err != nil {
			return nil, err
		}
	}
	return &form_view.UpdateCompletionResp{
		ID: req.ID,
	}, nil
}

func (f *formViewUseCase) Completion(ctx context.Context, msg []byte) error {
	if len(msg) == 0 {
		return nil
	}
	var data *form_view.CompletionResp
	if err := json.Unmarshal(msg, &data); err != nil {
		log.WithContext(ctx).Errorf("Completion result Unmarshal error: %s", err.Error())
		return err
	}
	m, err := f.tmpCompletionRepo.GetByCompletionId(ctx, data.Res.TaskId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		log.WithContext(ctx).Error("tmpCompletionRepo Get DatabaseError", zap.Error(err))
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if m.Status != form_view.CompletionStatusRunning.Integer.Int32() {
		return nil
	}
	completionResult := &form_view.CompletionResult{FormViewID: data.Res.Result.ID}
	if data.Res.Status == "Success" {
		if data.Res.RequestType&1 > 0 {
			completionResult.FormViewBusinessName = &data.Res.Result.AssistantName
		}
		if data.Res.RequestType&2 > 0 {
			completionResult.FormViewDescription = &data.Res.Result.AssistantDesc
		}
		fields := make([]*form_view.Field, 0)
		if data.Res.RequestType&4 > 0 {
			for _, column := range data.Res.Result.Columns {
				fields = append(fields, &form_view.Field{FieldID: column.ID, FieldBusinessName: column.AssistantNameCn})
			}
		}
		completionResult.Fields = fields
		m.Status = form_view.CompletionStatusFinished.Integer.Int32()
	} else if data.Res.Status == "Fail" {
		m.Status = form_view.CompletionStatusFailed.Integer.Int32()
		m.Reason = data.Res.Reason
	}
	buf, err := json.Marshal(completionResult)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal completion result 失败，err is %v", err)
	}
	m.Result = util.BytesToString(buf)
	err = f.tmpCompletionRepo.Update(ctx, m)
	if err != nil {
		return err
	}
	return nil
}

func (f *formViewUseCase) GetBusinessUpdateTime(ctx context.Context, req *form_view.GetBusinessUpdateTimeReq) (*form_view.GetBusinessUpdateTimeResp, error) {
	uInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	resp := &form_view.GetBusinessUpdateTimeResp{}
	formView, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	totalRes, err := f.AssembleTotalRes(ctx, formView)
	if err != nil {
		return nil, err
	}
	fields, err := f.fieldRepo.GetBusinessTimestamp(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("get business timestamp for form view fiel: %v failed, err: %v", req.ID, err)
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if len(fields) == 0 {
		return nil, errorcode.Desc(my_errorcode.BusinessTimestampNotFound)
	}
	field := fields[0]
	resp.FieldID = field.ID
	resp.FieldBusinessName = field.BusinessName
	url := fmt.Sprintf(`select MAX("%s") as update_time from %s."%s" where ("%s" is not null)`,
		field.TechnicalName,
		totalRes.ViewSourceCatalogName,
		formView.TechnicalName,
		field.TechnicalName)
	if field.DataType == "char" || field.DataType == "varchar" {
		url = fmt.Sprintf(`%s and (trim(cast("%s"as string)) != ' ')`, url, field.TechnicalName)
	}

	retDatas := make([]map[string]any, 0)
	result, err := f.DrivenMdlDataModel.QueryData(ctx, uInfo.ID, formView.MdlID, mdl_data_model.QueryDataBody{SQL: url, UseSearchAfter: true})
	if err != nil {
		return nil, err
	}

	if len(result.Entries) > 0 {
		log.WithContext(ctx).Infof("get business update time for form view: %v, result: %#v", req.ID, result)
		for i := range result.Entries {
			if len(result.Entries[i]) > 0 {
				retDatas = append(retDatas, result.Entries[i])
			}
		}
	}

	for len(result.SearchAfter) > 0 {
		result, err = f.DrivenMdlDataModel.QueryData(ctx, uInfo.ID, formView.MdlID, mdl_data_model.QueryDataBody{SearchAfter: result.SearchAfter, UseSearchAfter: true})
		if err != nil {
			return nil, err
		}
		if len(result.Entries) > 0 {
			log.WithContext(ctx).Infof("get business update time for form view: %v, result: %#v", req.ID, result)
			for i := range result.Entries {
				if len(result.Entries[i]) > 0 {
					retDatas = append(retDatas, result.Entries[i])
				}
			}
		}
	}

	for i := range retDatas {
		if retDatas[i]["update_time"] != nil {
			resp.BusinessUpdateTime = fmt.Sprintf("%v", retDatas[i]["update_time"])
			break
		}
	}
	return resp, nil
}
func (f *formViewUseCase) ConvertRulesVerify(ctx context.Context, req *form_view.ConvertRulesVerifyReq) (*form_view.ConvertRulesVerifyResp, error) {
	//获取字段
	field, err := f.fieldRepo.GetField(ctx, req.FieldID)
	if err != nil {
		return nil, err
	}
	//获取视图
	view, err := f.repo.GetById(ctx, field.FormViewID)
	if err != nil {
		return nil, err
	}
	datasource, err := f.datasourceRepo.GetById(ctx, view.DatasourceID)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	beforeDataType := util.CE(field.ResetBeforeDataType.String != "", field.ResetBeforeDataType.String, field.DataType).(string)
	verify := beforeDataType + req.ResetDataType

	if _, exist := constant.TypeConvertMap[verify]; !exist {
		return nil, errorcode.Detail(my_errorcode.DataTypeConversionError, fmt.Sprintf("Field TechnicalName:%s type: %s cant not Convert to :%s", field.TechnicalName, field.DataType, req.ResetDataType))
	}

	technicalName := util.QuotationMark(field.TechnicalName)
	originalQuerySql := fmt.Sprintf("select %s from %s.%s.%s limit 10", technicalName, datasource.CatalogName, util.QuotationMark(datasource.Schema), util.QuotationMark(view.TechnicalName))
	originalFetchData, err := f.DrivenVirtualizationEngine.FetchData(ctx, originalQuerySql)
	if err != nil {
		return nil, err
	}
	var data []any
	if len(originalFetchData.Data) > 0 {
		data = make([]any, len(originalFetchData.Data))
		for i, datum := range originalFetchData.Data {
			data[i] = datum[0]
		}
	}
	res := &form_view.ConvertRulesVerifyResp{
		OriginalData: form_view.FieldInfoWithData{
			Data:          data,
			DataType:      beforeDataType,
			TechnicalName: field.TechnicalName,
			BusinessName:  field.BusinessName,
		},
		ConvertData: form_view.FieldInfoWithData{
			DataType:      req.ResetDataType,
			TechnicalName: field.TechnicalName,
			BusinessName:  field.BusinessName,
		},
	}
	var selectSql string
	switch req.ResetDataType { //测试转换接口
	case constant.DATE, constant.TIME, constant.TIME_WITH_TIME_ZONE, constant.DATETIME, constant.TIMESTAMP, constant.TIMESTAMP_WITH_TIME_ZONE:
		if beforeDataType == constant.CHAR || beforeDataType == constant.VARCHAR || beforeDataType == constant.STRING {
			if req.ConvertRules == "" {
				return nil, errorcode.Detail(my_errorcode.PublicInvalidParameter, "reset_convert_rules is invalid")
			}
			selectSql = fmt.Sprintf("try_cast(date_parse(%s,'%s') AS %s) %s", technicalName, req.ConvertRules, req.ResetDataType, technicalName)
		} else {
			selectSql = fmt.Sprintf("try_cast(%s AS %s) %s", technicalName, req.ResetDataType, technicalName)
		}
	case constant.DECIMAL, constant.NUMERIC, constant.DEC:
		if req.DataLength <= 0 || req.DataAccuracy == nil || *req.DataAccuracy < 0 || req.DataLength < *req.DataAccuracy { //校验参数
			return nil, errorcode.Detail(my_errorcode.PublicInvalidParameter, "reset_data_length or reset_data_accuracy is invalid")
		}
		selectSql = fmt.Sprintf("try_cast(%s AS %s(%d,%d)) %s", technicalName, req.ResetDataType, req.DataLength, *req.DataAccuracy, technicalName)
	default:
		selectSql = fmt.Sprintf("try_cast(%s AS %s) %s", technicalName, req.ResetDataType, technicalName)
	}
	resetQuerySql := fmt.Sprintf("select %s from %s.%s.%s limit 10", selectSql, datasource.CatalogName, util.QuotationMark(datasource.Schema), util.QuotationMark(view.TechnicalName))
	resetFetchData, err := f.DrivenVirtualizationEngine.FetchData(ctx, resetQuerySql)
	if err != nil {
		code := agerrors.Code(err)
		if code.GetErrorCode() == my_errorcode.StructChangeNeedUpdate || code.GetErrorCode() == my_errorcode.DateTimeFormatError {
			return nil, err
		} else {
			return nil, errorcode.New(constant.ServiceName+".LogicView.ConvertFail", "类型转换失败", "", "", code.GetErrorDetails(), "")
		}
	}
	if len(resetFetchData.Data) > 0 {
		res.ConvertData.Data = make([]any, len(resetFetchData.Data))
		for i, datum := range resetFetchData.Data {
			res.ConvertData.Data[i] = datum[0]
		}
		if len(resetFetchData.Columns) != 0 && resetFetchData.Columns[0] != nil && resetFetchData.Columns[0].Type != "" {
			//res.ConvertData.DataType = resetFetchData.Columns[0].Type   会携带长度等其他信息 decimal(5,2) varchar(255)
			res.ConvertData.DataType = req.ResetDataType
		}
	}
	return res, nil
}

func (f *formViewUseCase) CreateExcelView(ctx context.Context, req *form_view.CreateExcelViewReq) (string, error) {
	logger := audit.FromContextOrDiscard(ctx)
	exist, err := f.repo.DataSourceViewNameExist(ctx, &model.FormView{
		DatasourceID: req.DatasourceId,
	}, req.BusinessName)
	if err != nil {
		return "", errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if exist {
		return "", errorcode.Desc(my_errorcode.FormViewNameExist)
	}
	// 生成逻辑视图的编码
	codeList, err := f.configurationCenterDrivenNG.Generate(ctx, constant.CodeGenerationRuleUUIDDataView, 1)
	if err != nil {
		log.WithContext(ctx).Error("generate code for data view fail", zap.Error(err), zap.Stringer("rule", constant.CodeGenerationRuleUUIDDataView), zap.Int("count", 1))
		return "", err
	}
	if codeList.TotalCount != 1 && len(codeList.Entries) != 1 {
		return "", errorcode.Desc(my_errorcode.GenerateCodeError)
	}

	viewId := uuid.New().String()

	logicView, fields, veReq, fieldObjs, err := f.genExcelViewStruct(ctx, req.DatasourceId, req.ExcelFileName, req.ExcelView, viewId, codeList.Entries[0], nil)
	if err != nil {
		return "", err
	}
	_, err = f.DrivenVirtualizationEngine.CreateExcelView(ctx, veReq)
	if err != nil {
		return "", err
	}

	if err = f.repo.CreateFormAndField(ctx, logicView, fields, ""); err != nil {
		//Rollback
		if _, errRollback := f.DrivenVirtualizationEngine.DeleteExcelView(ctx, &virtualization_engine.DeleteExcelViewReq{
			VdmCatalog: veReq.VDMCatalog,
			Schema:     constant.ViewSourceSchema,
			View:       req.TechnicalName,
		}); errRollback != nil {
			log.WithContext(ctx).Error("CreateExcelView rollback DeleteView error", zap.Error(errRollback))
		}
		return "", errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}

	if err = f.esRepo.PubToES(ctx, logicView, fieldObjs); err != nil { //创建excel视图
		return "", err
	}
	// 注意：此处通过值传递基本类型预防协程中解引用结构体指针可能遭遇的空指针问题
	//go func(logger audit.Logger, formViewID, technicalName, businessName, subjectID, departmentID, ownerID string) {
	createView := &form_view.LogicViewResourceObject{
		FormViewID:    logicView.ID,
		TechnicalName: logicView.TechnicalName,
		BusinessName:  logicView.BusinessName,
		SubjectID:     logicView.SubjectId.String,
		DepartmentID:  logicView.DepartmentId.String,
		OwnerID:       logicView.OwnerId.String,
	}
	if logicView.SubjectId.String != "" {
		res, err := f.DrivenDataSubject.GetDataSubjectByID(ctx, []string{logicView.SubjectId.String})
		if err != nil {
			log.Error(err.Error())
		} else if res != nil && len(res.Objects) > 0 {
			createView.SubjectPath = res.Objects[0].PathName
		}
	}
	if logicView.DepartmentId.String != "" {
		res, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{logicView.DepartmentId.String})
		if err != nil {
			log.Error(err.Error())
		} else if res != nil && len(res.Departments) > 0 {
			createView.DepartmentPath = res.Departments[0].Path
		}
	}
	if logicView.OwnerId.String != "" {
		ownerInfos, err := f.userRepo.GetByUserIds(ctx, strings.Split(logicView.OwnerId.String, constant.OwnerIdSep))
		if err != nil {
			log.Error(err.Error())
		}
		ownerName := make([]string, len(ownerInfos))
		for i, m := range ownerInfos {
			ownerName[i] = m.Name
		}
		createView.OwnerName = strings.Join(ownerName, constant.OwnerNameSep)
	}
	logger.Info(api_audit_v1.OperationCreateLogicView, createView)
	logger.Info(api_audit_v1.OperationPublishLogicView, &form_view.LogicViewSimpleResourceObject{
		Name:       logicView.BusinessName,
		FormViewID: logicView.ID,
	})

	return viewId, nil
}
func (f *formViewUseCase) genExcelViewStruct(ctx context.Context, datasourceId string, excelFileName string, req form_view.ExcelView, viewId string, code string, view *model.FormView) (*model.FormView, []*model.FormViewField, *virtualization_engine.CreateExcelViewReq, []*es.FieldObj, error) {
	datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, datasourceId)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	if datasource.DataViewSource == "" {
		if err = f.genDataViewSource(ctx, datasource); err != nil {
			return nil, nil, nil, nil, err
		}
	}

	//校验部门id 校验主题id  校验OwnerID
	err = f.VerifyDepartmentIDSubjectIDOwnerID(ctx, view, req.DepartmentID, req.SubjectID, req.OwnerID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	fields := make([]*model.FormViewField, len(req.ExcelFields))
	veColumns := make([]*virtualization_engine.ExcelColumn, len(req.ExcelFields))
	fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
	standardCodes := []string{}
	codeTableIDs := []string{}
	for i, field := range req.ExcelFields {
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
			ID:            uuid.New().String(),
			FormViewID:    viewId,
			TechnicalName: field.TechnicalName,
			BusinessName:  field.BusinessName,
			DataType:      field.DataType,
			SubjectID:     &field.AttributeID,
			ClassifyType:  &classifyType,
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
		veColumns[i] = &virtualization_engine.ExcelColumn{
			Column: field.TechnicalName,
			Type:   field.DataType,
		}

		fieldObj := &es.FieldObj{
			FieldNameZH: field.BusinessName,
			FieldNameEN: field.TechnicalName,
		}
		fieldObjs = append(fieldObjs, fieldObj)
	}
	if err = f.VerifyStandard(ctx, codeTableIDs, standardCodes); err != nil {
		return nil, nil, nil, nil, err
	}

	publishAt := time.Now()
	logicView := &model.FormView{
		ID:                 viewId,
		UniformCatalogCode: code,
		TechnicalName:      req.TechnicalName,
		BusinessName:       req.BusinessName,
		Type:               constant.FormViewTypeDatasource.Integer.Int32(),
		DatasourceID:       datasourceId,
		PublishAt:          &publishAt,
		EditStatus:         constant.FormViewLatest.Integer.Int32(),
		OwnerId:            sql.NullString{String: strings.Join(req.OwnerID, constant.OwnerIdSep), Valid: true},
		SubjectId: sql.NullString{
			String: req.SubjectID,
			Valid:  true,
		},
		DepartmentId: sql.NullString{
			String: req.DepartmentID,
			Valid:  true,
		},
		Description: sql.NullString{
			String: req.Description,
			Valid:  true,
		},
		CreatedByUID:     userInfo.ID,
		UpdatedByUID:     userInfo.ID,
		ExcelFileName:    excelFileName,
		ExcelSheet:       req.Sheet,
		StartCell:        req.StartCell,
		EndCell:          req.EndCell,
		HasHeaders:       req.HasHeaders,
		SheetAsNewColumn: req.SheetAsNewColumn,
	}

	//vdmCatalog := strings.Replace(datasource.DataViewSource, ".default", "", 1)
	veReq := &virtualization_engine.CreateExcelViewReq{
		Catalog:          datasource.CatalogName,
		FileName:         excelFileName,
		TableName:        req.TechnicalName,
		Columns:          veColumns,
		VDMCatalog:       strings.TrimSuffix(datasource.DataViewSource, constant.DefaultViewSourceSchema),
		StartCell:        req.StartCell,
		EndCell:          req.EndCell,
		Sheet:            req.Sheet,
		AllSheet:         false,
		SheetAsNewColumn: req.SheetAsNewColumn,
		HasHeaders:       req.HasHeaders,
	}

	return logicView, fields, veReq, fieldObjs, nil
}

func (f *formViewUseCase) UpdateExcelView(ctx context.Context, req *form_view.UpdateExcelViewReq) (string, error) {
	originalView, err := f.repo.GetById(ctx, req.ViewID)
	if err != nil {
		return "", err
	}
	exist, err := f.repo.DataSourceViewNameExist(ctx, &model.FormView{
		ID:           req.ViewID,
		DatasourceID: originalView.DatasourceID,
	}, req.BusinessName)
	if err != nil {
		return "", errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if exist {
		return "", errorcode.Desc(my_errorcode.FormViewNameExist)
	}
	//校验时间戳id
	if req.BusinessTimestampID != "" {
		if _, err = f.fieldRepo.GetField(ctx, req.BusinessTimestampID); err != nil {
			return "", err
		}
	}

	fieldReqMap := make(map[string]*form_view.StandardInfo)
	clearAttributeInfos := make([]*logicViewRepo.ClearAttributeInfo, len(req.ExcelFields))
	for i, field := range req.ExcelFields {
		fieldReqMap[field.ClearAttributeID] = &form_view.StandardInfo{StandardCode: field.StandardCode, CodeTableID: field.CodeTableID}
		clearAttributeInfos[i] = &logicViewRepo.ClearAttributeInfo{ID: field.ID, ClearAttributeID: field.ClearAttributeID}
	}
	clearSyntheticData, err := f.ClearSyntheticData(ctx, req.ViewID, fieldReqMap)
	if err != nil {
		return "", err
	}

	logicView, fields, veReq, fieldObjs, err := f.genExcelViewStruct(ctx, originalView.DatasourceID, originalView.ExcelFileName, req.ExcelView, req.ViewID, "", originalView)
	if err != nil {
		return "", err
	}
	if _, err = f.DrivenVirtualizationEngine.DeleteExcelView(ctx, &virtualization_engine.DeleteExcelViewReq{
		VdmCatalog: veReq.VDMCatalog,
		View:       originalView.TechnicalName,
		Schema:     constant.ViewSourceSchema,
	}); err != nil {
		return "", err
	}
	if _, err = f.DrivenVirtualizationEngine.CreateExcelView(ctx, veReq); err != nil {
		return "", err
	}

	if err = f.logicViewRepo.UpdateLogicViewAndField(ctx, logicView, fields, &logicViewRepo.UpdateLogicViewAndFieldReq{BusinessTimestampID: req.BusinessTimestampID, Infos: clearAttributeInfos}); err != nil {
		//Rollback
		f.RollbackUpdateExcelView(ctx, originalView, veReq)
		return "", errorcode.Detail(my_errorcode.LogicDatabaseError, err.Error())
	}

	if err = f.esRepo.PubToES(ctx, logicView, fieldObjs); err != nil { //更新自定义、逻辑实体视图
		return "", err
	}

	if clearSyntheticData {
		result, err := f.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, req.ViewID)).Result()
		if err != nil {
			log.WithContext(ctx).Error("【logicViewUseCase】UpdateExcelView  clear synthetic-data fail ", zap.Error(err))
		}
		log.WithContext(ctx).Infof("【logicViewUseCase】UpdateExcelView  clear synthetic-data result %d", result)
	}
	return logicView.ID, nil
}

func (f *formViewUseCase) RollbackUpdateExcelView(ctx context.Context, originalView *model.FormView, veReq *virtualization_engine.CreateExcelViewReq) {
	fields, err := f.fieldRepo.GetFormViewFields(ctx, originalView.ID)
	if err != nil {
		log.WithContext(ctx).Error("RollbackUpdateExcelView CreateExcelView", zap.Error(err))
		return
	}
	excelColumns := make([]*virtualization_engine.ExcelColumn, len(fields))
	for i, field := range fields {
		excelColumns[i] = &virtualization_engine.ExcelColumn{
			Column: field.TechnicalName,
			Type:   field.DataType,
		}
	}
	if _, err := f.DrivenVirtualizationEngine.DeleteExcelView(ctx, &virtualization_engine.DeleteExcelViewReq{
		VdmCatalog: veReq.VDMCatalog,
		View:       veReq.TableName,
		Schema:     constant.ViewSourceSchema,
	}); err != nil {
		log.WithContext(ctx).Error("UpdateLogicViewAndField DeleteExcelView error", zap.Error(err))
	}
	if _, err := f.DrivenVirtualizationEngine.CreateExcelView(ctx, &virtualization_engine.CreateExcelViewReq{
		Catalog:          veReq.Catalog,
		FileName:         originalView.ExcelFileName,
		TableName:        originalView.TechnicalName,
		Columns:          excelColumns,
		VDMCatalog:       veReq.VDMCatalog,
		StartCell:        originalView.StartCell,
		EndCell:          originalView.EndCell,
		Sheet:            originalView.ExcelSheet,
		AllSheet:         false,
		SheetAsNewColumn: originalView.SheetAsNewColumn,
		HasHeaders:       originalView.HasHeaders,
	}); err != nil {
		log.WithContext(ctx).Error("RollbackUpdateExcelView CreateExcelView", zap.Error(err))
	}
}

func (f *formViewUseCase) GetWhiteListPolicyList(ctx context.Context, req *form_view.GetWhiteListPolicyListReq) (*form_view.GetWhiteListPolicyListRes, error) {
	total, entities, err := f.whiteListPolicyRepo.GetWhiteListPolicyListByCondition(ctx, req)
	if err != nil {
		return nil, err
	}

	datasourceRes := make([]*form_view.WhiteListPolicy, len(entities))
	for i, entity := range entities {
		formInfo, err := f.repo.GetFormViewById(ctx, entity.FormViewID)
		if err != nil {
			return nil, err
		}
		data := form_view.WhiteListPolicy{
			//WhiteListPolicyID:  source.WhitePolicyID,
			ID:           entity.ID,
			FormViewID:   entity.FormViewID,
			FormViewName: formInfo.BusinessName,
			FormViewCode: formInfo.UniformCatalogCode,
			Description:  entity.Description,
			CreatedAt:    entity.CreatedAt.UnixMilli(),
			UpdatedAt:    entity.UpdatedAt.UnixMilli(),
			//Status:       source.Status,
		}
		subjectId := ""
		if formInfo.SubjectId.Valid {
			subjectId = formInfo.SubjectId.String
		}
		//fmt.Println(subjectId)

		if subjectId != "" {
			subjectInfo, err := f.DrivenDataSubject.GetDataSubjectByID(ctx, []string{subjectId})

			if err != nil {
				log.Error(err.Error())
			} else if subjectInfo != nil && len(subjectInfo.Objects) > 0 {
				data.FormViewSubject = subjectInfo.Objects[0].Name
			}

		}

		departmentId := ""
		if formInfo.DepartmentId.Valid {
			departmentId = formInfo.DepartmentId.String
		}

		if departmentId != "" {
			departmentInfo, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{departmentId})
			if err != nil {
				log.Error(err.Error())
			} else if departmentInfo != nil && len(departmentInfo.Departments) > 0 {
				//departmentPath = res.Departments[0].Path
				data.FormViewDepartment = departmentInfo.Departments[0].Name
			}
		}

		datasourceRes[i] = &data
	}
	return &form_view.GetWhiteListPolicyListRes{
		WhiteListPolicy: datasourceRes,
		TotalCount:      total,
	}, nil
}

func (f *formViewUseCase) GetWhiteListPolicyDetails(ctx context.Context, req *form_view.GetWhiteListPolicyDetailsReq) (*form_view.GetWhiteListPolicyDetailsRes, error) {
	policy, err := f.whiteListPolicyRepo.GetWhiteListPolicyDetail(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if err != nil {
		return nil, err
	}
	res := &form_view.GetWhiteListPolicyDetailsRes{
		//WhiteListPolicyID: sources.WhitePolicyID,
		ID:          req.ID,
		FormViewID:  policy.FormViewID,
		Description: policy.Description,
		Configs:     policy.Config,

		CreatedAt: policy.CreatedAt.UnixMilli(),
		UpdatedAt: policy.UpdatedAt.UnixMilli(),
	}

	formView, err := f.repo.GetFormViewById(ctx, policy.FormViewID)
	if err != nil {
		return nil, err
	}

	res.FormViewName = formView.BusinessName
	res.FormViewCode = formView.UniformCatalogCode

	if formView.SubjectId.String != "" {
		subjectInfo, err := f.DrivenDataSubject.GetDataSubjectByID(ctx, []string{formView.SubjectId.String})

		if err != nil {
			log.Error(err.Error())
		} else if subjectInfo != nil && len(subjectInfo.Objects) > 0 {
			res.FormViewSubject = subjectInfo.Objects[0].Name
		}
	}

	departmentId := ""
	if formView.DepartmentId.Valid {
		departmentId = formView.DepartmentId.String
	}

	if departmentId != "" {
		departmentInfo, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{departmentId})
		if err != nil {
			log.Error(err.Error())
		} else if departmentInfo != nil && len(departmentInfo.Departments) > 0 {
			//departmentPath = res.Departments[0].Path
			res.FormViewDepartment = departmentInfo.Departments[0].Name
		}

	}

	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		//获取所属数据源 库名称
		datasource, err := f.datasourceRepo.GetByIdWithCode(ctx, formView.DatasourceID)
		if err != nil {
			return nil, err
		}
		if datasource != nil {
			res.FormViewDatasource = datasource.Name

		}

	}

	userIdNameMap, err := f.GetByUserMapByIds(ctx, util.DuplicateStringRemoval([]string{policy.CreatedByUID, policy.UpdatedByUID}))
	if err != nil {
		return nil, err
	}

	res.CreatedByName = userIdNameMap[policy.CreatedByUID]
	res.UpdatedByName = userIdNameMap[policy.UpdatedByUID]

	return res, nil

}

func (f *formViewUseCase) CreateWhiteListPolicy(ctx context.Context, req *form_view.CreateWhiteListPolicyReq) (*form_view.CreateWhiteListPolicyRes, error) {
	formView, err := f.repo.GetFormViewById(ctx, req.FormViewID)
	if err != nil {
		return nil, err
	}

	//config, err := json.Marshal(req.Config)

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	whiteListPolicyStruct := model.WhiteListPolicy{
		ID:           uuid.New().String(),
		FormViewID:   formView.ID,
		Description:  req.Description,
		Config:       req.Configs,
		CreatedByUID: userInfo.ID,
		UpdatedByUID: userInfo.ID,
	}

	err = f.whiteListPolicyRepo.CreateWhiteListPolicy(ctx, &whiteListPolicyStruct)
	if err != nil {
		return nil, err
	}
	res := &form_view.CreateWhiteListPolicyRes{}

	return res, nil
}

func (f *formViewUseCase) UpdateWhiteListPolicy(ctx context.Context, req *form_view.UpdateWhiteListPolicyReq) (*form_view.UpdateWhiteListPolicyRes, error) {

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	whiteListPolicyStruct := model.WhiteListPolicy{
		ID:          req.ID,
		Description: req.Description,
		Config:      req.Configs,
		//CreatedByUID: userInfo.ID,
		UpdatedByUID: userInfo.ID,
	}

	err = f.whiteListPolicyRepo.UpdateWhiteListPolicy(ctx, &whiteListPolicyStruct)
	if err != nil {
		return nil, err
	}
	res := &form_view.UpdateWhiteListPolicyRes{}

	return res, nil
}

func (f *formViewUseCase) DeleteWhiteListPolicy(ctx context.Context, req *form_view.DeleteWhiteListPolicyReq) (*form_view.DeleteWhiteListPolicyRes, error) {
	//rules, err := json.Marshal(req.RuleCondition)

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	err = f.whiteListPolicyRepo.DeleteWhiteListPolicy(ctx, req.ID, userInfo.ID)
	if err != nil {
		return nil, err
	}
	res := &form_view.DeleteWhiteListPolicyRes{}

	return res, nil
}

func whereOPAndValueFormat(name, op, value, dataType string) (whereBackendSql string, err error) {
	special := strings.NewReplacer(`\`, `\\\\`, `'`, `\'`, `%`, `\%`, `_`, `\_`)
	switch op {
	case "<", "<=", ">", ">=":
		if _, err = strconv.ParseFloat(value, 64); err != nil {
			return whereBackendSql, errors.New("where conf invalid")
		}
		whereBackendSql = fmt.Sprintf("%s %s %s", name, op, value)

	case "=", "<>":
		if dataType == constant.SimpleInt || dataType == constant.SimpleFloat || dataType == constant.SimpleDecimal {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errors.New("where conf invalid")
			}
			whereBackendSql = fmt.Sprintf("%s %s %s", name, op, value)
		} else if dataType == constant.SimpleChar {
			whereBackendSql = fmt.Sprintf("%s %s '%s'", name, op, value)

		} else if dataType == constant.VARCHAR {
			whereBackendSql = fmt.Sprintf("%s %s '%s'", name, op, value)

		} else {
			return "", errors.New("523 where op not allowed")
		}

	case "include":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s LIKE '%s'", name, "%"+value+"%")
		} else {
			return "", errors.New("534 where op not allowed")
		}
	case "not include":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s NOT LIKE '%s'", name, "%"+value+"%")
		} else {
			return "", errors.New("541 where op not allowed")
		}
	case "prefix":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s LIKE '%s'", name, value+"%")
		} else {
			return "", errors.New("548 where op not allowed")
		}
	case "not prefix":
		if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s NOT LIKE '%s'", name, value+"%")
		} else {
			return "", errors.New("555 where op not allowed")
		}

	case "belong":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.SimpleChar || dataType == constant.VARCHAR {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf("%s IN %s", name, "("+value+")")
	case "null":
		whereBackendSql = fmt.Sprintf("%s IS NULL", name)
	case "not null":
		whereBackendSql = fmt.Sprintf("%s IS NOT NULL", name)
	default:
		return "", errors.New("592 where op not allowed")
	}
	return
}

func joinWithConjunction(strs []string, conjunction string) string {
	if len(strs) == 0 {
		return ""
	}
	if len(strs) == 1 {
		return strs[0]
	}
	nConjunction := " AND "
	if conjunction == "or" {
		nConjunction = " OR "
	}
	firstPart := strings.Join(strs, nConjunction)
	return firstPart
}

func generalWhiteListPolicySql(data form_view.RuleConditionTree, fieldMap map[string]*model.FormViewField) (whereSql string) {
	if len(data.Rules) == 0 {
		if data.Type == "condition" {
			fieldInfo := fieldMap[data.FieldId]
			nSql, err := whereOPAndValueFormat(fieldInfo.TechnicalName, data.Operate, data.OperateValue, fieldInfo.DataType)
			if err != nil {
				return ""
			}
			return nSql
		} else {
			return ""
		}
	} else {
		sqlList := []string{}
		for _, subRule := range data.Rules {

			sqlList = append(sqlList, generalWhiteListPolicySql(*subRule, fieldMap))
		}
		nSql := ""
		if data.TypeValue == "and" {
			nSql = joinWithConjunction(sqlList, "and")

		} else {
			nSql = joinWithConjunction(sqlList, "or")
		}

		return fmt.Sprintf("( %s )", nSql)
	}

}

func generalWhiteListPolicySqlV2(data *explore_task.RuleExpression, fieldMap map[string]*model.FormViewField) (whereSql string) {
	sqlList := []string{}
	for _, whereCondition := range data.Where {
		subSqlList := []string{}
		for _, member := range whereCondition.Member {
			fieldInfo := fieldMap[member.FieldId]
			nSql, _ := whereOPAndValueFormat(fieldInfo.TechnicalName, member.Operator, member.Value, fieldInfo.DataType)
			if nSql == "" {
				continue
			}
			subSqlList = append(subSqlList, nSql)
		}
		subSql := joinWithConjunction(subSqlList, whereCondition.Relation)
		sqlList = append(sqlList, subSql)
	}
	finalSql := joinWithConjunction(sqlList, data.WhereRelation)

	//去掉finalSql的首尾空格
	finalSql = strings.TrimSpace(finalSql)
	if finalSql != "" {
		finalSql = fmt.Sprintf(" ( %s ) ", finalSql)
	}
	return finalSql
}

func (f *formViewUseCase) ExecuteWhiteListPolicy(ctx context.Context, req *form_view.ExecuteWhiteListPolicyReq) (*form_view.ExecuteWhiteListPolicyRes, error) {
	formView, err := f.repo.GetById(ctx, req.FormViewID)
	if err != nil {
		log.WithContext(ctx).Errorf("f.repo.GetById error", zap.Error(err))
		return nil, err
	}

	configStr := req.Configs
	config := explore_task.RuleConfig{}
	if configStr != "" {
		err = json.Unmarshal([]byte(configStr), &config)
	}

	//
	fields, err := f.fieldRepo.GetFormViewFields(ctx, req.FormViewID)
	if err != nil {
		return nil, err
	}
	fieldsMap := map[string]*model.FormViewField{}
	for _, entity := range fields {
		fieldsMap[entity.ID] = entity
	}

	var dataViewSource string
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		datasourceInfo, err := f.datasourceRepo.GetById(ctx, formView.DatasourceID)
		if err != nil {
			log.WithContext(ctx).Errorf("f.datasourceRepo.GetById DatabaseError", zap.Error(err))
		}
		dataViewSource = datasourceInfo.DataViewSource
	case constant.FormViewTypeCustom.Integer.Int32():
		dataViewSource = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		dataViewSource = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	default:
		err = errors.New("unknown form view type")
		log.WithContext(ctx).Errorf("unknown form view type")
	}
	if err != nil {
		return nil, err
	}

	filterSql := fmt.Sprintf(`SELECT * FROM %s."%s"`, dataViewSource, formView.TechnicalName)

	whereSql := ""

	if config.RuleExpression.Sql != "" {
		whereSql = config.RuleExpression.Sql
	} else {
		whereSql = generalWhiteListPolicySqlV2(config.RuleExpression, fieldsMap)
	}

	if whereSql != "" {
		if req.Mode == "after_filter_data" {
			whereSql = invertCondition(whereSql)
		}

		filterSql = fmt.Sprintf(`%s WHERE %s`, filterSql, whereSql)
	}

	offset := 0
	limit := 10
	filterSql = fmt.Sprintf(`%s OFFSET %d LIMIT %d`, filterSql, offset, limit)

	log.Info(fmt.Sprintf("vitriEngine excute sql : %s", filterSql))
	fetchData, err := f.DrivenVirtualizationEngine.FetchAuthorizedData(ctx, filterSql, nil)
	if err != nil {
		return nil, err
	}

	return &form_view.ExecuteWhiteListPolicyRes{FetchDataRes: *fetchData}, nil
}

func (f *formViewUseCase) GetFormViewRelateWhiteListPolicy(ctx context.Context, req *form_view.GetFormViewRelateWhiteListPolicyReq) (*form_view.GetFormViewRelateWhiteListPolicyRes, error) {
	entities, err := f.whiteListPolicyRepo.GetWhiteListPolicyListByFormView(ctx, req.FormViewIds)
	if err != nil {
		return nil, err
	}

	res := form_view.GetFormViewRelateWhiteListPolicyRes{}
	if len(entities) == 0 {
		res.Entities = []form_view.FormViewRelateWhiteListPolicy{}
		return &res, nil
	}
	for _, entity := range entities {
		res.Entities = append(res.Entities,
			form_view.FormViewRelateWhiteListPolicy{
				FormViewId:        entity.FormViewID,
				WhiteListPolicyId: entity.ID})
	}

	return &res, nil

}

func (f *formViewUseCase) GetWhiteListPolicyWhereSql(ctx context.Context, req *form_view.GetWhiteListPolicyWhereSqlReq) (*form_view.GetWhiteListPolicyWhereSqlRes, error) {
	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	whereSql, err := f.GetWhiteListPolicySql(ctx, req.ID, userInfo.ID)

	if err != nil {
		return nil, err
	}

	res := form_view.GetWhiteListPolicyWhereSqlRes{}
	res.SQL = whereSql

	return &res, nil
}

func (f *formViewUseCase) GetDesensitizationFieldInfos(ctx context.Context, req *form_view.GetDesensitizationFieldInfosReq) (*form_view.GetDesensitizationFieldInfosRes, error) {
	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	fields, err := f.fieldRepo.GetFormViewFields(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	fieldMap := make(map[string]string)
	// map[字段ID]是否开启查询保护
	fieldIDGradeIDMap := make(map[string]string)
	fieldProtectionQueryMap := make(map[string]bool)
	uniqueGradeIDMap := make(map[int64]string)
	uniqueGradeIDSlice := []string{}
	for _, field := range fields {
		fieldMap[field.ID] = field.TechnicalName
		if field.GradeID.Valid {
			if _, exist := uniqueGradeIDMap[field.GradeID.Int64]; !exist {
				gradeID := strconv.FormatInt(field.GradeID.Int64, 10)
				fieldIDGradeIDMap[field.ID] = gradeID
				uniqueGradeIDMap[field.GradeID.Int64] = ""
				uniqueGradeIDSlice = append(uniqueGradeIDSlice, gradeID)
			}
		}
	}
	// 获取标签详情
	var labelByIdsRes *configuration_center_gocommon.GetLabelByIdsRes
	if len(uniqueGradeIDSlice) > 0 {
		labelByIdsRes, err = f.GradeLabel.GetLabelByIds(ctx, strings.Join(uniqueGradeIDSlice, ","))
		if err != nil {
			return nil, err
		}
		for _, v := range labelByIdsRes.Entries {
			fieldProtectionQueryMap[v.ID] = v.DataProtectionQuery
		}
	}

	hasRole1, err := f.commonAuthService.MenuResourceActions(ctx, userInfo.ID, common_middleware.DatasheetView)
	if err != nil {
		return nil, err
	}
	//hasRole2, err := f.configurationCenterDriven.GetRolesInfo(ctx, access_control.TCDataOperationEngineer, userInfo.ID)
	//if err != nil {
	//	return nil, err
	//}
	fieldDesensitizationRuleMap := make(map[string]*model.DesensitizationRule)
	if !hasRole1.HasManageAction() {
		dataPrivacyPolicy, err := f.dataPrivacyPolicyRepo.GetByFormViewId(ctx, req.ID)
		// 是否有记录状态
		dataPrivacyPolicyState := 1
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				dataPrivacyPolicyState = 0
			} else {
				return nil, err
			}

		}
		if dataPrivacyPolicyState == 1 {
			var dataPrivacyPolicyFields []*model.DataPrivacyPolicyField
			if dataPrivacyPolicy != nil {
				dataPrivacyPolicyFields, err = f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyId(ctx, dataPrivacyPolicy.ID)
				if err != nil {
					return nil, err
				}
			}
			if len(dataPrivacyPolicyFields) > 0 {
				desensitizeRuleIds := make([]string, 0)
				for _, field := range dataPrivacyPolicyFields {
					desensitizeRuleIds = append(desensitizeRuleIds, field.DesensitizationRuleID)
				}
				desensitizationRuleMap := make(map[string]*model.DesensitizationRule)
				desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizeRuleIds)
				if err != nil {
					return nil, err
				}
				if len(desensitizationRules) > 0 {
					for _, desensitizationRule := range desensitizationRules {
						desensitizationRuleMap[desensitizationRule.ID] = desensitizationRule
					}
					for _, policyField := range dataPrivacyPolicyFields {
						fieldDesensitizationRuleMap[policyField.FormViewFieldID] = desensitizationRuleMap[policyField.DesensitizationRuleID]
					}
				}
			}
		}
	}

	FieldList := make([]form_view.FieldItemInfo, 0)
	for _, field := range fields {
		fieldId := field.ID
		if fieldName, exist := fieldMap[fieldId]; exist {
			escapeFieldName := escape(fieldName)
			desensitizationMethod := ""
			desensitizationAlgorithm := ""
			desensitizationMiddleBit := int32(0)
			desensitizationHeadBit := int32(0)
			desensitizationTailBit := int32(0)

			if gradeID, exist := fieldIDGradeIDMap[fieldId]; exist {
				if isProtecdtion, valid := fieldProtectionQueryMap[gradeID]; valid && isProtecdtion {
					continue
				}
			}
			if desensitizationRule, exist := fieldDesensitizationRuleMap[fieldId]; exist {
				desensitizationMethod = desensitizationRule.Method
				desensitizationAlgorithm = desensitizationRule.Algorithm
				desensitizationMiddleBit = desensitizationRule.MiddleBit
				desensitizationHeadBit = desensitizationRule.HeadBit
				desensitizationTailBit = desensitizationRule.TailBit
				if desensitizationRule.Method == "all" {
					escapeFieldName = fmt.Sprintf("regexp_replace(CAST(%s AS VARCHAR), '.', '*') AS %s", escapeFieldName, escapeFieldName)
				} else if desensitizationRule.Method == "middle" {
					escapeFieldName = fmt.Sprintf(
						"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
							"substring(CAST(%s AS VARCHAR), 1, CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer)), '%s', "+
							"substring(CAST(%s AS VARCHAR), CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) + %d, "+
							"length(CAST(%s AS VARCHAR)) - CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) - %d)) END AS %s",
						escapeFieldName, desensitizationRule.MiddleBit, escapeFieldName,
						escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit, strings.Repeat("*", int(desensitizationRule.MiddleBit)),
						escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit,
						desensitizationRule.MiddleBit+1, escapeFieldName, escapeFieldName, desensitizationRule.MiddleBit, desensitizationRule.MiddleBit, escapeFieldName)
				} else if desensitizationRule.Method == "head-tail" {
					escapeFieldName = fmt.Sprintf(
						"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
							"'%s', substring(CAST(%s AS VARCHAR), %d, length(CAST(%s AS VARCHAR)) - %d), '%s') END AS %s",
						escapeFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, escapeFieldName,
						strings.Repeat("*", int(desensitizationRule.HeadBit)),
						escapeFieldName, desensitizationRule.HeadBit+1, escapeFieldName, desensitizationRule.HeadBit+desensitizationRule.TailBit, strings.Repeat("*", int(desensitizationRule.TailBit)), escapeFieldName)
				}
			}
			FieldList = append(FieldList, form_view.FieldItemInfo{
				FieldId:                       fieldId,
				FieldName:                     field.TechnicalName,
				FieldDesensitizationName:      escapeFieldName,
				FieldDesensitizationMethod:    desensitizationMethod,
				FieldDesensitizationAlgorithm: desensitizationAlgorithm,
				FieldDesensitizationMiddleBit: desensitizationMiddleBit,
				FieldDesensitizationHeadBit:   desensitizationHeadBit,
				FieldDesensitizationTailBit:   desensitizationTailBit,
			})
			continue
		}
		return nil, errorcode.Detail(my_errorcode.FormViewFieldIDNotExist, fmt.Sprintf("fields: %s", fieldId))
	}

	res := form_view.GetDesensitizationFieldInfosRes{}
	res.FieldList = FieldList

	return &res, nil
}

func invertConditionItem(condition string) (string, error) {
	// 去除首尾空格
	condition = strings.TrimSpace(condition)
	if condition == "" {
		return "", errors.New("empty condition")
	}

	// 处理括号
	if strings.HasPrefix(condition, "(") && strings.HasSuffix(condition, ")") {
		innerCondition := strings.TrimSpace(condition[1 : len(condition)-1])
		invertedInner, err := invertConditionItem(innerCondition)
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("( %s )", invertedInner), nil
	}

	// 处理NOT条件
	if strings.HasPrefix(strings.ToUpper(condition), "NOT ") {
		return strings.TrimSpace(condition[4:]), nil
	}

	// 处理AND/OR连接的复合条件
	andRegex := regexp.MustCompile(`\s+AND\s+`)
	orRegex := regexp.MustCompile(`\s+OR\s+`)

	if andRegex.MatchString(condition) {
		parts := andRegex.Split(condition, -1)
		var invertedParts []string
		for _, part := range parts {
			inverted, err := invertConditionItem(strings.TrimSpace(part))
			if err != nil {
				return "", err
			}
			invertedParts = append(invertedParts, inverted)
		}
		return strings.Join(invertedParts, " OR "), nil
	}

	if orRegex.MatchString(condition) {
		parts := orRegex.Split(condition, -1)
		var invertedParts []string
		for _, part := range parts {
			inverted, err := invertConditionItem(strings.TrimSpace(part))
			if err != nil {
				return "", err
			}
			invertedParts = append(invertedParts, inverted)
		}
		return strings.Join(invertedParts, " AND "), nil
	}

	// 处理比较运算符
	comparisonRegex := regexp.MustCompile(`\s*(.+?)\s*(=|!=|<>|<|>|<=|>=|LIKE|NOT LIKE|IN|NOT IN|IS|IS NOT)\s*(.+?)\s*$`)
	matches := comparisonRegex.FindStringSubmatch(condition)
	if len(matches) == 4 {
		column := matches[1]
		operator := matches[2]
		value := matches[3]

		// 反转比较运算符
		invertedOperator := ""
		switch strings.ToUpper(operator) {
		case "=":
			invertedOperator = "!="
		case "!=", "<>":
			invertedOperator = "="
		case "<":
			invertedOperator = ">="
		case ">":
			invertedOperator = "<="
		case "<=":
			invertedOperator = ">"
		case ">=":
			invertedOperator = "<"
		case "LIKE":
			invertedOperator = "NOT LIKE"
		case "NOT LIKE":
			invertedOperator = "LIKE"
		case "IN":
			invertedOperator = "NOT IN"
		case "NOT IN":
			invertedOperator = "IN"
		case "IS":
			invertedOperator = "IS NOT"
		case "IS NOT":
			invertedOperator = "IS"
		default:
			return "", fmt.Errorf("unsupported operator: %s", operator)
		}

		return fmt.Sprintf("%s %s %s", column, invertedOperator, value), nil
	}

	// 无法识别的条件
	return "", fmt.Errorf("unrecognized condition format: %s", condition)
}

func invertCondition(condition string) string {

	invertedSQL, err := invertConditionItem(condition)
	if err != nil {
		invertedSQL = fmt.Sprintf(`NOT ( %s )`, condition)
	}
	return invertedSQL
}

func (f *formViewUseCase) GetWhiteListPolicySql(ctx context.Context, formViewId, userId string) (string, error) {

	// 基于白名单策略规则生成的条件, 先判断用户角色
	// roles, err := f.configurationCenterDrivenNG.GetUserInfos(ctx, userId)
	// if err != nil {
	// 	return "", err
	// }

	// for _, role := range roles.Roles {
	// 	if role.Id == access_control.TCDataDevelopmentEngineer || role.Id == access_control.TCDataOperationEngineer {
	// 		return "", nil
	// 	}
	// }

	//hasRole1, err := f.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.TCDataDevelopmentEngineer, userId)
	//if err != nil {
	//	return "", err
	//}
	//
	//hasRole2, err := f.configurationCenterDriven.GetCheckUserPermission(ctx, access_control.TCDataOperationEngineer, userId)
	//if err != nil {
	//	return "", err
	//}
	//
	//if hasRole1 || hasRole2 {
	//	return "", nil
	//}

	//
	//if is {
	//	return "", nil
	//}

	dataInfo, err := f.whiteListPolicyRepo.GetWhiteListPolicyByFormView(ctx, formViewId)

	if err == gorm.ErrRecordNotFound {
		return "", nil
	}
	if err != nil {
		return "", err
	}

	if dataInfo == nil {
		return "", nil
	}

	configStr := dataInfo.Config

	config := form_view.RuleConfig{}
	if configStr != "" {
		err = json.Unmarshal([]byte(configStr), &config)
	} else {
		return "", nil
	}

	//
	fields, err := f.fieldRepo.GetFormViewFields(ctx, dataInfo.FormViewID)
	if err != nil {
		return "", err
	}
	fieldsMap := map[string]*model.FormViewField{}
	for _, entity := range fields {
		fieldsMap[entity.ID] = entity
	}

	whereSql := ""
	if config.RuleExpression.Sql != "" {
		whereSql = config.RuleExpression.Sql
	} else {
		nWhereSql, err := generateWhereSQLByFix(ctx, config.RuleExpression)
		if err != nil {
			return "", err
		}
		whereSql = nWhereSql
	}

	whereSql = invertCondition(whereSql)

	return whereSql, nil
}

func (f *formViewUseCase) GetDesensitizationRuleList(ctx context.Context, req *form_view.GetDesensitizationRuleListReq) (*form_view.GetDesensitizationRuleListRes, error) {

	totalCount, entities, err := f.desensitizationRuleRepo.GetDesensitizationRuleListByCondition(ctx, req)
	if err != nil {
		return nil, err
	}

	datasourceRes := make([]*form_view.DesensitizationRule, len(entities))
	for i, entity := range entities {

		data := form_view.DesensitizationRule{
			//WhiteListPolicyID:  source.WhitePolicyID,
			ID:          entity.ID,
			Name:        entity.Name,
			Description: entity.Description,
			Algorithm:   entity.Algorithm,
			Type:        entity.Type,
			InnerType:   entity.InnerType,
			Method:      entity.Method,
			MiddleBit:   entity.MiddleBit,
			HeadBit:     entity.HeadBit,
			TailBit:     entity.TailBit,
			CreatedAt:   entity.CreatedAt.UnixMilli(),
			UpdatedAt:   entity.UpdatedAt.UnixMilli(),
			//Status:       source.Status,
		}

		datasourceRes[i] = &data
	}
	return &form_view.GetDesensitizationRuleListRes{
		Entities:   datasourceRes,
		TotalCount: totalCount,
	}, nil
}
func (f *formViewUseCase) GetDesensitizationRuleByIds(ctx context.Context, req *form_view.GetDesensitizationRuleByIdsReq) (*form_view.GetDesensitizationRuleByIdsRes, error) {
	entities, err := f.desensitizationRuleRepo.GetByIds(ctx, req.Ids)
	if err != nil {
		return nil, err
	}

	datasourceRes := make([]*form_view.DesensitizationRule, len(entities))
	for i, entity := range entities {
		data := form_view.DesensitizationRule{
			ID:          entity.ID,
			Name:        entity.Name,
			Description: entity.Description,
			Algorithm:   entity.Algorithm,
			Type:        entity.Type,
			InnerType:   entity.InnerType,
			Method:      entity.Method,
			MiddleBit:   entity.MiddleBit,
			HeadBit:     entity.HeadBit,
			TailBit:     entity.TailBit,
			CreatedAt:   entity.CreatedAt.UnixMilli(),
			UpdatedAt:   entity.UpdatedAt.UnixMilli(),
		}
		datasourceRes[i] = &data
	}

	return &form_view.GetDesensitizationRuleByIdsRes{
		Data: datasourceRes,
	}, nil
}

func (f *formViewUseCase) GetDesensitizationRuleDetails(ctx context.Context, req *form_view.GetDesensitizationRuleDetailsReq) (*form_view.GetDesensitizationRuleDetailsRes, error) {
	entity, err := f.desensitizationRuleRepo.GetDesensitizationRuleDetail(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if err != nil {
		return nil, err
	}
	res := &form_view.GetDesensitizationRuleDetailsRes{
		//WhiteListPolicyID: sources.WhitePolicyID,
		ID:          entity.ID,
		Name:        entity.Name,
		Description: entity.Description,
		Type:        entity.Type,
		InnerType:   entity.InnerType,
		Algorithm:   entity.Algorithm,
		Method:      entity.Method,
		MiddleBit:   entity.MiddleBit,
		HeadBit:     entity.HeadBit,
		TailBit:     entity.TailBit,
		CreatedAt:   entity.CreatedAt.UnixMilli(),
		UpdatedAt:   entity.UpdatedAt.UnixMilli(),
	}

	userIdNameMap, err := f.GetByUserMapByIds(ctx, util.DuplicateStringRemoval([]string{entity.CreatedByUID, entity.UpdatedByUID}))
	if err != nil {
		return nil, err
	}

	res.CreatedByName = userIdNameMap[entity.CreatedByUID]
	res.UpdatedByName = userIdNameMap[entity.UpdatedByUID]

	return res, nil
}

func (f *formViewUseCase) CreateDesensitizationRule(ctx context.Context, req *form_view.CreateDesensitizationRuleReq) (*form_view.CreateDesensitizationRuleRes, error) {

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	desensitizationRuleStruct := model.DesensitizationRule{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Description:  req.Description,
		Type:         req.Type,
		InnerType:    req.InnerType,
		Algorithm:    req.Algorithm,
		Method:       req.Method,
		MiddleBit:    req.MiddleBit,
		HeadBit:      req.HeadBit,
		TailBit:      req.TailBit,
		CreatedByUID: userInfo.ID,
		UpdatedByUID: userInfo.ID,
	}

	err = f.desensitizationRuleRepo.CreateDesensitizationRule(ctx, &desensitizationRuleStruct)
	if err != nil {
		return nil, err
	}
	res := &form_view.CreateDesensitizationRuleRes{}

	return res, nil
}

func (f *formViewUseCase) UpdateDesensitizationRule(ctx context.Context, req *form_view.UpdateDesensitizationRuleReq) (*form_view.UpdateDesensitizationRuleRes, error) {

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	desensitizationRuleStruct := model.DesensitizationRule{
		ID:          req.ID,
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		InnerType:   req.InnerType,
		Algorithm:   req.Algorithm,
		Method:      req.Method,
		MiddleBit:   req.MiddleBit,
		HeadBit:     req.HeadBit,
		TailBit:     req.TailBit,
		//CreatedByUID: userInfo.ID,
		UpdatedByUID: userInfo.ID,
	}

	err = f.desensitizationRuleRepo.UpdateDesensitizationRule(ctx, &desensitizationRuleStruct)
	if err != nil {
		return nil, err
	}
	res := &form_view.UpdateDesensitizationRuleRes{}

	return res, nil
}

func (f *formViewUseCase) DeleteDesensitizationRule(ctx context.Context, req *form_view.DeleteDesensitizationRuleReq) (*form_view.DeleteDesensitizationRuleRes, error) {
	if req.Mode != "force" {
		DesensitizationRuleInfo, _ := f.desensitizationRuleRepo.GetDesensitizationRuleListWithRelatePolicy(ctx, []string{req.ID})
		if len(DesensitizationRuleInfo) > 0 {
			return nil, errorcode.Desc(my_errorcode.DesensitizationRuleRelatePrivacy)
		}
	}

	userInfo, err := commonUtil.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}

	err = f.desensitizationRuleRepo.DeleteDesensitizationRule(ctx, req.ID, userInfo.ID)
	if err != nil {
		return nil, err
	}

	err = f.dataPrivacyPolicyFieldRepo.DeleteByRuleID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	res := &form_view.DeleteDesensitizationRuleRes{}

	return res, nil
}

func replaceCharAtPositionASCII(s string, index int, end int, newChar byte, replaceMethod string, middleBit int, startBit int, endBit int) string {
	// 将字符串转换为 []byte 类型
	bytes := []byte(s)

	switch replaceMethod {
	case "all":
		for i := index; i < end; i++ {
			bytes[i] = newChar
		}
	case "middle":
		dLen := end - index
		sIndex := 0
		if (dLen-middleBit)%2 == 0 {
			sIndex = (dLen - middleBit) / 2
		} else {
			sIndex = (dLen + 1 - middleBit) / 2
		}
		if sIndex < 0 {
			sIndex = 0
		}
		endIndex := sIndex + middleBit + index
		if endIndex > end {
			endIndex = end
		}
		for i := sIndex + index; i < endIndex; i++ {
			bytes[i] = newChar
		}
	case "head-tail":
		endIndex := index + startBit
		if endIndex > end {
			endIndex = end
		}
		for i := index; i < endIndex; i++ {
			bytes[i] = newChar
		}

		startIndex := end - endBit
		if startBit < index {
			startBit = index
		}
		for i := startIndex; i < end; i++ {
			bytes[i] = newChar
		}
	}

	// 将修改后的 []byte 转换回字符串
	return string(bytes)
}

func replaceCharAtPositionRune(s string, index int, end int, newRune string, replaceMethod string, middleBit int, startBit int, endBit int) string {
	// 将字符串转换为 []byte 类型
	runes := []rune(s)

	switch replaceMethod {
	case "all":
		for i := index; i < end; i++ {
			runes[i] = '*'
		}
	case "middle":
		dLen := end - index
		sIndex := 0
		if (dLen-middleBit)%2 == 0 {
			sIndex = (dLen - middleBit) / 2
		} else {
			sIndex = (dLen + 1 - middleBit) / 2
		}
		if sIndex < 0 {
			sIndex = 0
		}
		endIndex := sIndex + middleBit + index
		if endIndex > end {
			endIndex = end
		}
		for i := sIndex + index; i < endIndex; i++ {
			runes[i] = '*'
		}
	case "head-tail":
		endIndex := index + startBit
		if endIndex > end {
			endIndex = end
		}
		for i := index; i < endIndex; i++ {
			runes[i] = '*'
		}

		startIndex := end - endBit
		if startIndex < index {
			startIndex = index
		}
		for i := startIndex; i < end; i++ {
			runes[i] = '*'
		}
	}

	// 将修改后的 []byte 转换回字符串
	return string(runes)
}

func ByteIndexToRuneIndex(s string, byteIndex int) int {
	if byteIndex < 0 || byteIndex > len(s) {
		return -1 // 字节位置超出范围，返回 -1
	}
	return utf8.RuneCountInString(s[:byteIndex])
}

func UnescapeUnicode(s string) string {
	var result string
	for i := 0; i < len(s); {
		if i+1 < len(s) && s[i] == '\\' && s[i+1] == 'u' {
			// 提取 \u 后面的四位十六进制数
			if i+6 <= len(s) {
				hexStr := s[i+2 : i+6]
				if codePoint, err := strconv.ParseInt(hexStr, 16, 32); err == nil {
					result += string(rune(codePoint))
					i += 6
					continue
				}
			}
		}
		result += string(s[i])
		i++
	}
	return result
}

func (f *formViewUseCase) ExecuteDesensitizationRule(ctx context.Context, req *form_view.ExecuteDesensitizationRuleReq) (*form_view.ExecuteDesensitizationRuleRes, error) {
	//replacement := "***"

	regexAlgorithm := UnescapeUnicode(req.Algorithm)
	//req.Algorithm = strings.Replace(req.Algorithm, "\"", "\"\"", -1)
	// 编译正则表达式
	re, err := regexp.Compile(regexAlgorithm)
	if err != nil {
		return nil, err
	}
	res := form_view.ExecuteDesensitizationRuleRes{}
	nText := req.Text
	indices := re.FindAllStringIndex(nText, -1)

	//fmt.Println(len(nText), nText[0], nText[1], nText[2], "========", len([]rune(nText)))
	if len(indices) > 0 {
		var nIndices [][]int
		for _, index := range indices {

			startIndex := ByteIndexToRuneIndex(nText, index[0])
			endIndex := ByteIndexToRuneIndex(nText, index[1])

			nIndices = append(nIndices, []int{startIndex, endIndex})

		}
		for _, index := range nIndices {
			nText = replaceCharAtPositionRune(nText, index[0], index[1], "*", req.Method, int(req.MiddleBit), int(req.HeadBit), int(req.TailBit))
		}
		res.DesensitizationText = nText
	} else {
		res.DesensitizationText = req.Text
	}

	//result := re.ReplaceAllString(req.Text, replacement)

	//res.DesensitizationText = result
	return &res, nil
}

func (f *formViewUseCase) ExportDesensitizationRule(ctx context.Context, req *form_view.ExportDesensitizationRuleReq) (*form_view.ExportDesensitizationRuleRes, error) {

	datas, err := f.desensitizationRuleRepo.GetDesensitizationRuleListByIDs(ctx, req.IDs)
	if err != nil {
		return nil, err
	}
	nameMap := map[string]string{
		"all":       "全部脱敏",
		"middle":    "中间脱敏",
		"head-tail": "首尾脱敏",
	}

	res := form_view.ExportDesensitizationRuleRes{}
	for _, data := range datas {
		res.Entities = append(res.Entities,
			form_view.ExportSubEntity{
				Name:        data.Name,
				Description: data.Description,
				Algorithm:   data.Algorithm,
				Method:      nameMap[data.Method],
			})
	}
	return &res, nil
}

func (f *formViewUseCase) GetDesensitizationRuleRelatePolicy(ctx context.Context, req *form_view.GetDesensitizationRuleRelatePolicyReq) (*form_view.GetDesensitizationRuleRelatePolicyRes, error) {

	datas, err := f.desensitizationRuleRepo.GetDesensitizationRuleListWithRelatePolicy(ctx, req.IDs)
	if err != nil {
		return nil, err
	}

	res := form_view.GetDesensitizationRuleRelatePolicyRes{}
	if len(datas) == 0 {
		res.Entries = []form_view.DesensitizationRuleRelatePolicy{}
		return &res, nil
	}
	dMap := map[string][]form_view.RelatePrivicyPolicy{}
	drMap := map[string]form_view.DesensitizationRuleRelatePolicy{}
	for _, data := range datas {
		formView, err := f.repo.GetById(ctx, data.FormViewId)
		if err != nil {
			return nil, err
		}
		drMap[data.DesensitizationRuleId] = form_view.DesensitizationRuleRelatePolicy{data.DesensitizationRuleId, data.DesensitizationRuleName, data.Description, nil}
		if _, ok := dMap[data.DesensitizationRuleId]; ok {

			dMap[data.DesensitizationRuleId] = append(dMap[data.DesensitizationRuleId], form_view.RelatePrivicyPolicy{data.PrivacyPolicyId, data.FormViewId, formView.BusinessName})
		} else {
			subData := form_view.RelatePrivicyPolicy{data.PrivacyPolicyId, data.FormViewId, formView.BusinessName}
			dMap[data.DesensitizationRuleId] = []form_view.RelatePrivicyPolicy{subData}

		}

	}

	for k, v := range dMap {
		res.Entries = append(res.Entries, form_view.DesensitizationRuleRelatePolicy{
			ID:               k,
			Name:             drMap[k].Name,
			Description:      drMap[k].Description,
			RelatePolicyList: v,
		})
	}
	return &res, nil
}

func (f *formViewUseCase) GetDesensitizationRuleInternalAlgorithm(ctx context.Context, req *form_view.GetDesensitizationRuleInternalAlgorithmReq) (*form_view.GetDesensitizationRuleInternalAlgorithmRes, error) {

	datas := []form_view.DesensitizationRuleInternalAlgorithm{
		{ID: "0001", Name: "身份证号", InnerType: "IDNumber", Algorithm: "([1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx])|([1-9]\\d{5}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3})"},
		{ID: "0002", Name: "手机号", InnerType: "MobileNumber", Algorithm: "1[3-9]\\d{9}"},
		{ID: "0003", Name: "邮箱", InnerType: "Email", Algorithm: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"},
		{ID: "0003", Name: "银行卡号", InnerType: "BCCard", Algorithm: "[1-9]\\d{12,18}"},
	}
	res := form_view.GetDesensitizationRuleInternalAlgorithmRes{}
	for _, d := range datas {
		res.Entities = append(res.Entities, d)
	}

	return &res, nil
}

// addFormViewBusinessTableID  给逻辑视图添加业务表ID，这些业务表是根据逻辑视图生成的
func (f *formViewUseCase) addFormViewBusinessTableID(ctx context.Context, businessModelID string, formViews []*form_view.FormView) {
	if businessModelID == "" {
		return
	}
	vids := make([]string, 0, len(formViews))
	for _, viewInfo := range formViews {
		vids = append(vids, viewInfo.ID)
	}
	viewDict, err := f.businessGroomingDriven.GetFormViewTableDict(ctx, businessModelID, vids)
	if err != nil {
		log.Warnf("addFormViewBusinessTableID failed %v ", err.Error())
		return
	}
	for _, view := range formViews {
		view.DataOriginFormID = viewDict[view.ID]
	}
}

func (f *formViewUseCase) GetByAuditStatus(ctx context.Context, req *form_view.GetByAuditStatusReq) (*form_view.GetByAuditStatusResp, error) {
	res := form_view.GetByAuditStatusResp{
		PageResultNew: form_view.PageResultNew[form_view.FormViewInfo]{
			Entries:    []*form_view.FormViewInfo{},
			TotalCount: 0,
		},
	}
	if req.DatasourceType != "" && req.DatasourceId == "" {
		datasource, err := f.datasourceRepo.GetDataSourcesByType(ctx, []string{req.DatasourceType})
		if err != nil {
			return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		if len(datasource) > 0 {
			for _, ds := range datasource {
				req.DatasourceIds = append(req.DatasourceIds, ds.ID)
			}
		} else {
			return &res, nil
		}
	}
	total, formViews, err := f.repo.GetByAuditStatus(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("repo.GetByAuditStatus", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	for _, formView := range formViews {
		formViewInfo := &form_view.FormViewInfo{
			ID:                 formView.ID,
			UniformCatalogCode: formView.UniformCatalogCode,
			TechnicalName:      formView.TechnicalName,
			BusinessName:       formView.BusinessName,
			DepartmentID:       formView.DepartmentId.String,
		}
		if formView.DepartmentId.String != "" {
			departmentRes, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{formView.DepartmentId.String})
			if err != nil {
				log.Error(err.Error())
			} else if departmentRes != nil && len(departmentRes.Departments) > 0 {
				formViewInfo.DepartmentPath = departmentRes.Departments[0].Path
			}
		}
		res.Entries = append(res.Entries, formViewInfo)
	}
	res.TotalCount = total
	return &res, nil
}

func (f *formViewUseCase) SaveFormViewExtend(ctx context.Context, msg []byte) error {
	if len(msg) == 0 {
		return nil
	}
	var data *form_view.ExploreDataFinishedMsg
	if err := json.Unmarshal(msg, &data); err != nil {
		log.WithContext(ctx).Errorf("explore result Unmarshal error: %s", err.Error())
		return err
	}

	err := f.formViewExtendRepo.Save(ctx, &model.TFormViewExtend{
		ID:        data.TableId,
		IsAudited: true,
	})
	if err != nil {
		log.WithContext(ctx).Error("formViewExtendRepo.Save", zap.Error(err))
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}

func (f *formViewUseCase) GetBasicViewList(ctx context.Context, req *form_view.GetBasicViewListReqParam) (*form_view.GetBasicViewListResp, error) {
	logicView, err := f.repo.GetBasicViewList(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("repo.GetBasicViewList", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	dataSourceIds := make([]string, 0)
	departIds := make([]string, 0)
	for _, formView := range logicView {
		if formView.Type == constant.FormViewTypeDatasource.Integer.Int32() {
			dataSourceIds = append(dataSourceIds, formView.DatasourceID)
		}
		if formView.DepartmentId.String != "" {
			departIds = append(departIds, formView.DepartmentId.String)
		}
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := f.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	//获取数据源map
	dataSourceMap := make(map[string]*model.Datasource)
	dataSources, err := f.datasourceRepo.GetByIds(ctx, dataSourceIds)
	if err != nil {
		log.WithContext(ctx).Error("datasourceRepo.GetByIds", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	for _, dataSource := range dataSources {
		dataSourceMap[dataSource.ID] = dataSource
	}

	rules, err := f.exploreRuleConfigRepo.GetRulesByFormViewIds(ctx, req.IDs)
	if err != nil {
		log.WithContext(ctx).Error("exploreRuleConfigRepo.GetRulesByFormViewIds", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	viewRuleEnableMap := make(map[string]int)
	for _, rule := range rules {
		if rule.Enable == 1 {
			viewRuleEnableMap[rule.FormViewID] += 1
		}
	}

	viewInfos := make([]*form_view.ViewInfo, len(logicView))
	for i, formView := range logicView {
		viewInfos[i] = &form_view.ViewInfo{
			ID:                 formView.ID,
			UniformCatalogCode: formView.UniformCatalogCode,
			TechnicalName:      formView.TechnicalName,
			BusinessName:       formView.BusinessName,
			Type:               enum.ToString[constant.FormViewType](formView.Type),
			Description:        formView.Description.String,
			DepartmentID:       formView.DepartmentId.String,
			Status:             enum.ToString[constant.FormViewScanStatus](formView.Status),
		}

		//所属数据源
		switch formView.Type {
		case constant.FormViewTypeDatasource.Integer.Int32():
			viewInfos[i].DatasourceName = dataSourceMap[formView.DatasourceID].Name
		case constant.FormViewTypeCustom.Integer.Int32():
			viewInfos[i].DatasourceName = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
		case constant.FormViewTypeLogicEntity.Integer.Int32():
			viewInfos[i].DatasourceName = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
		}

		//所属部门
		if viewInfos[i].DepartmentID != "" {
			viewInfos[i].Department = departmentNameMap[formView.DepartmentId.String]
			viewInfos[i].DepartmentPath = departmentPathMap[formView.DepartmentId.String]
		}

		//存在已启用的规则
		if count, ok := viewRuleEnableMap[formView.ID]; ok && count > 0 {
			viewInfos[i].IsAuditRuleConfigured = true
		}

	}
	return &form_view.GetBasicViewListResp{Entries: viewInfos}, nil
}

func (f *formViewUseCase) IsAllowClearGrade(ctx context.Context, req *form_view.IsAllowClearGradeReq) (*form_view.IsAllowClearGradeResp, error) {
	//先找到字段
	formViewField, err := f.fieldRepo.GetField(ctx, req.FormViewFieldID)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	//再找到字段分类
	if formViewField.SubjectID != nil {
		subjects, err := f.DrivenDataSubjectNG.GetAttributeByIds(ctx, []string{*formViewField.SubjectID})
		if err != nil {
			log.Errorf("query business object failed: err: %v", err.Error())
		}
		if len(subjects.Attributes) > 0 {
			subject := subjects.Attributes[0]
			if subject.LabelId != "" {
				return &form_view.IsAllowClearGradeResp{IsAllow: false}, nil
			}
		}
	}

	return &form_view.IsAllowClearGradeResp{IsAllow: true}, nil
}

func (f *formViewUseCase) QueryStreamStart(ctx context.Context, req *form_view.QueryStreamStartReq) (*form_view.QueryStreamStartResp, error) {
	sql := req.Sql
	if sql == "" {
		return nil, nil
	}
	// 先查总条数
	totalSql := fmt.Sprintf("SELECT COUNT(*) FROM (%s) t", sql)
	totalRes, err := f.DrivenVirtualizationEngine.FetchData(ctx, totalSql)
	if err != nil {
		return nil, err
	}
	val, ok := totalRes.Data[0][0].(float64)
	if !ok {
		// 处理类型异常
		return nil, errorcode.Detail(my_errorcode.DatabaseError, "totalRes.Data[0][0] is not a float64")
	}
	total := int64(val)
	log.Info(fmt.Sprintf("total: %d", total))

	//再启动流式查询
	streamFetchDataRes, err := f.DrivenVirtualizationEngine.StreamDataFetch(ctx, "", sql)
	if err != nil {
		return nil, err
	}
	// log.Info(fmt.Sprintf("streamFetchDataRes: %+v", streamFetchDataRes))
	columns := make([]form_view.ColumnMeta, len(streamFetchDataRes.Columns))
	for i, col := range streamFetchDataRes.Columns {
		columns[i] = form_view.ColumnMeta{
			Name: col.Name,
			Type: col.Type,
		}
	}
	firstCount := int64(streamFetchDataRes.TotalCount)
	// 截取 NextURI 中 "/statement/executing/" 后的部分
	var nextURI string
	if parts := strings.SplitN(streamFetchDataRes.NextURI, "/statement/executing/", 2); len(parts) == 2 {
		nextURI = parts[1]
	} else {
		nextURI = streamFetchDataRes.NextURI
	}
	return &form_view.QueryStreamStartResp{
		TotalCount: total,
		Columns:    columns,
		Data:       streamFetchDataRes.Data,
		NextURI:    nextURI,
		FirstCount: firstCount,
	}, nil
}

func (f *formViewUseCase) QueryStreamNext(ctx context.Context, req *form_view.QueryStreamNextReq) (*form_view.QueryStreamNextResp, error) {
	uri := req.NextURI
	if uri == "" {
		return nil, nil
	}
	streamFetchDataRes, err := f.DrivenVirtualizationEngine.StreamDataFetch(ctx, uri, "")
	if err != nil {
		return nil, err
	}
	// 截取 NextURI 中 "/statement/executing/" 后的部分
	var nextURI string
	if parts := strings.SplitN(streamFetchDataRes.NextURI, "/statement/executing/", 2); len(parts) == 2 {
		nextURI = parts[1]
	} else {
		nextURI = streamFetchDataRes.NextURI
	}
	columns := make([]form_view.ColumnMeta, len(streamFetchDataRes.Columns))
	for i, col := range streamFetchDataRes.Columns {
		columns[i] = form_view.ColumnMeta{
			Name: col.Name,
			Type: col.Type,
		}
	}
	//
	return &form_view.QueryStreamNextResp{
		TotalCount: int64(streamFetchDataRes.TotalCount),
		Columns:    columns,
		Data:       streamFetchDataRes.Data,
		NextURI:    nextURI,
	}, nil
}

// 通过技术名称和华奥ID查询视图
func (f *formViewUseCase) GetViewByTechnicalNameAndHuaAoId(ctx context.Context, req *form_view.GetViewByTechnicalNameAndHuaAoIdReqParam) (*form_view.GetViewFieldsResp, error) {
	// 1. 查询FormView
	formView, err := f.repo.GetViewByTechnicalNameAndHuaAoId(ctx, req.TechnicalName, req.HuaAoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.FormViewTechnicalNameNotExist)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	// 2. 查询FormViewField
	fields, err := f.fieldRepo.GetFormViewFields(ctx, formView.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	// 3. 组装响应数据
	viewResult := &form_view.GetViewFieldsResp{
		FormViewID:    formView.ID,
		TechnicalName: formView.TechnicalName,
		BusinessName:  formView.BusinessName,
	}

	for _, field := range fields {
		fieldResult := &form_view.SimpleViewField{
			ID:               field.ID,
			BusinessName:     field.BusinessName,
			TechnicalName:    field.TechnicalName,
			PrimaryKey:       field.PrimaryKey.Bool,
			Comment:          field.Comment.String,
			DataType:         field.DataType,
			DataLength:       field.DataLength,
			OriginalDataType: field.OriginalDataType,
			DataAccuracy:     field.DataAccuracy.Int32,
			IsNullable:       field.IsNullable,
			StandardCode:     field.StandardCode.String,
			StandardName:     field.StandardName.String,
			CodeTableID:      field.CodeTableID.String,
			Index:            field.Index,
		}
		viewResult.Fields = append(viewResult.Fields, fieldResult)
	}

	return viewResult, nil
}

func (f *formViewUseCase) GetTableCount(ctx context.Context, req *form_view.GetViewCountReqParam) (int64, error) {
	departmentId := req.Id
	log.Info(fmt.Sprintf("departmentId: %s", departmentId))
	return f.repo.GetDatabaseTableCount(ctx, departmentId)
}

func (f *formViewUseCase) CheckFavorite(ctx context.Context, formView *model.FormView) (error, *data_catalog.CheckV1Resp) {
	// 获取当前登录 用户
	uid, _ := util.GetUserInfo(ctx)
	//后端调用状态，不需要该数据，有UID表示是登录用户
	if uid == nil {
		return nil, nil
	}
	// 打印当前登录账号
	log.Info("------------------------->current login user", zap.String("user", uid.ID))
	id := formView.ID
	result := &data_catalog.CheckV1Resp{
		IsFavored: false, // 明确设置默认值
	}
	req := &data_catalog.CheckV1Req{
		ResID:     id,
		ResType:   "data-view",
		CreatedBy: uid.ID,
	}
	fav, err := f.dataCatalogV1.GetResourceFavoriteByID(ctx, req)
	if err != nil {
		return err, nil
	}

	// 如果fav不为nil且包含有效的favorID，则设置为已收藏
	if fav != nil {
		for favorID := range fav {
			if favorID != 0 {
				result.IsFavored = true
				result.FavorID = favorID
				break
			}
		}
	}
	return nil, result
}
