package gorm

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/util/clock"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ServiceApplyRepo interface {
	List(ctx context.Context, req *dto.ServiceApplyListReq) (res []*model.ServiceApplyAssociations, count int64, err error)
	Get(ctx context.Context, applyId string) (res *model.ServiceApplyAssociations, err error)
	GetByServiceID(ctx context.Context, uid string, serviceID string) (res *model.ServiceApplyAssociations, err error)
	AuthInfo(ctx context.Context, uid string, serviceID string) (res *model.ServiceApplyAssociations, err error)
	CountByServiceID(ctx context.Context, uid string, serviceID string) (count int64, err error)
	IsExist(ctx context.Context, applyId string) (exist bool, err error)
	Create(ctx context.Context, apply *model.ServiceApply) (err error)
	IsAuditing(ctx context.Context, serviceID string, uid string) (exist bool, err error)
	IsAvailable(ctx context.Context, serviceID string, uid string) (exist bool, err error)
	AuditStatus(ctx context.Context, uid string, serviceIDs []string) (auditStatusMap map[string]string, err error)
	Available(ctx context.Context, req *dto.AvailableAssetsListReq) (res []*model.ServiceAssociations, count int64, err error)
	ConsumerWorkflowAuditResultRequest(ctx context.Context, msg *common.AuditResultMsg) (err error)
	ConsumerWorkflowAuditProcDeleteRequest(ctx context.Context, msg *common.AuditProcDefDelMsg) (err error)
	AvailableServiceIDs(ctx context.Context, AppID string) (serviceIDs []string, err error)
}

func NewServiceApplyRepo(
	data *db.Data,
	mq *mq.MQ,
	serviceRepo ServiceRepo,
	appRepo AppRepo,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	authServiceRepo microservice.AuthServiceRepo,
	dataSubjectRepo microservice.DataSubjectRepo,
	wf workflow.WorkflowInterface,
) ServiceApplyRepo {
	return &serviceApplyRepo{
		clock:                   clock.RealClock{},
		data:                    data,
		mq:                      mq,
		serviceRepo:             serviceRepo,
		appRepo:                 appRepo,
		configurationCenterRepo: configurationCenterRepo,
		authServiceRepo:         authServiceRepo,
		dataSubjectRepo:         dataSubjectRepo,
		wf:                      wf,
	}
}

type serviceApplyRepo struct {
	// 时钟，便于测试
	clock clock.PassiveClock

	data                    *db.Data
	mq                      *mq.MQ
	serviceRepo             ServiceRepo
	appRepo                 AppRepo
	configurationCenterRepo microservice.ConfigurationCenterRepo
	authServiceRepo         microservice.AuthServiceRepo
	dataSubjectRepo         microservice.DataSubjectRepo
	wf                      workflow.WorkflowInterface
}

func (r *serviceApplyRepo) List(ctx context.Context, req *dto.ServiceApplyListReq) (res []*model.ServiceApplyAssociations, count int64, err error) {
	user := util.GetUser(ctx)
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Preload("Service").
		Where(&model.ServiceApply{UID: user.Id})

	if req.Keyword != "" {
		var serviceIDs []string
		serviceTx := r.data.DB.WithContext(ctx).Model(&model.Service{}).Scopes(Undeleted())
		serviceTx = serviceTx.Select([]string{"service_id"}).
			Where("(service_name like ? or service_id like ?)", EscapeLike("%", req.Keyword, "%"), EscapeLike("%", req.Keyword, "%")).
			Pluck("service_id", &serviceIDs)
		if serviceTx.Error != nil {
			log.WithContext(ctx).Error("ServiceApplyRepo List", zap.Error(serviceTx.Error))
			return nil, 0, serviceTx.Error
		}
		tx = tx.Where("service_id in ?", serviceIDs)
	}

	if len(req.AuditStatus) > 0 {
		auditStatus := strings.Split(req.AuditStatus, ",")
		for _, status := range auditStatus {
			if _, ok := enum.AuditStatusMap[status]; !ok {
				return nil, 0, errorcode.Desc(errorcode.PublicInvalidParameter, "audit_status 参数错误")
			}
		}
		tx = tx.Where("audit_status in ?", auditStatus)
	}

	if req.StartTime != "" {
		tx = tx.Where("create_time >= ?", req.StartTime)
	}

	if req.EndTime != "" {
		tx = tx.Where("create_time <= ?", req.EndTime)
	}

	if req.Sort != "" {
		tx = tx.Order(req.Sort + " " + req.Direction)
	}

	tx = tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceApplyRepo Count", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	tx = tx.Scopes(Paginate(req.Offset, req.Limit)).Find(&res)
	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceApplyRepo Find", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	return
}

func (r *serviceApplyRepo) Get(ctx context.Context, applyId string) (res *model.ServiceApplyAssociations, err error) {
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Preload("Service").
		Preload("App").
		Where(&model.ServiceApply{ApplyID: applyId}).
		Find(&res)

	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo Get", zap.Error(tx.Error))
		return nil, err
	}

	return res, nil
}

func (r *serviceApplyRepo) GetByServiceID(ctx context.Context, uid string, serviceID string) (res *model.ServiceApplyAssociations, err error) {
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Where(&model.ServiceApply{
			UID:       uid,
			ServiceID: serviceID,
		}).
		Order("update_time desc").
		Limit(1).
		Find(&res)

	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo GetByServiceID", zap.Error(tx.Error))
		return nil, err
	}

	return res, nil
}

func (r *serviceApplyRepo) AuthInfo(ctx context.Context, uid string, serviceID string) (res *model.ServiceApplyAssociations, err error) {
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Preload("App").
		Where(&model.ServiceApply{
			UID:       uid,
			ServiceID: serviceID,
		}).
		Order("update_time desc").
		Limit(1).
		Find(&res)

	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo AuthInfo", zap.Error(tx.Error))
		return nil, err
	}

	return res, nil
}

func (r *serviceApplyRepo) CountByServiceID(ctx context.Context, uid string, serviceID string) (count int64, err error) {
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Where(&model.ServiceApply{
			UID:       uid,
			ServiceID: serviceID,
		}).
		Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo CountByServiceID", zap.Error(tx.Error))
		return 0, err
	}

	return count, nil
}

func (r *serviceApplyRepo) IsExist(ctx context.Context, applyId string) (exist bool, err error) {
	var count int64
	tx := r.data.DB.WithContext(ctx).Model(&model.ServiceApply{}).Where(&model.ServiceApply{ApplyID: applyId}).Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo IsExist", zap.Error(err))
		return false, tx.Error
	}

	return count > 0, nil
}

func (r *serviceApplyRepo) Create(ctx context.Context, apply *model.ServiceApply) (err error) {
	err = r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//创建申请记录
		tx = tx.Model(&model.ServiceApply{}).Create(apply)
		if tx.Error != nil {
			log.WithContext(ctx).Error("ServiceApplyRepo Create", zap.Error(tx.Error))
			return tx.Error
		}

		//创建app
		err := r.appRepo.Create(ctx, apply.UID)
		if err != nil {
			log.WithContext(ctx).Error("ServiceApplyRepo appRepo.Create", zap.Error(tx.Error))
			return err
		}

		//审核流程发送到 workflow
		return r.produceWorkflowAuditApply(ctx, apply)
	})

	return err
}

func (r *serviceApplyRepo) produceWorkflowAuditApply(ctx context.Context, apply *model.ServiceApply) (err error) {
	user := util.GetUser(ctx)
	t := time.Now()
	service, err := r.serviceRepo.ServiceGetFields(ctx, apply.ServiceID, []string{"service_name"})
	if err != nil {
		log.WithContext(ctx).Error("produceWorkflowAuditApply ServiceGetFields", zap.Error(err))
		return err
	}

	msg := &common.AuditApplyMsg{
		Process: common.AuditApplyProcessInfo{
			AuditType:  apply.AuditType,
			ApplyID:    apply.ApplyID,
			UserID:     user.Id,
			UserName:   user.Name,
			ProcDefKey: apply.ProcDefKey,
		},
		Data: map[string]any{
			"service_id":     apply.ServiceID,
			"service_name":   service.ServiceName,
			"submitter_id":   user.Id,
			"submitter_name": user.Name,
			"submit_time":    util.TimeFormat(&t),
			"apply_reason":   apply.ApplyReason,
		},
		Workflow: common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: common.AuditApplyAbstractInfo{
				Icon: enum.AuditIconBase64,
				Text: "接口名称：" + service.ServiceName,
			},
			Webhooks: []common.Webhook{
				{
					Webhook:     settings.Instance.Services.DataApplicationService + "/api/data-application-service/internal/v1/audits/" + apply.ApplyID + "/auditors",
					StrategyTag: enum.OwnerAuditStrategyTag,
				},
			},
		},
	}

	err = r.wf.AuditApply(msg)
	if err != nil {
		log.WithContext(ctx).Error("ProduceWorkflowAuditApply", zap.Error(err), zap.Any("msg", msg))
		return err
	}
	log.Info("producer workflow msg", zap.String("topic", mq.TopicWorkflowAuditApply), zap.Any("msg", msg))
	return nil
}

func (r *serviceApplyRepo) IsAuditing(ctx context.Context, serviceID string, uid string) (exist bool, err error) {
	if serviceID == "" {
		return false, nil
	}

	if uid == "" {
		return false, nil
	}

	var count int64
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Where(&model.ServiceApply{ServiceID: serviceID, UID: uid, AuditStatus: enum.AuditStatusAuditing}).
		Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo IsAuditing", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceApplyRepo) IsAvailable(ctx context.Context, serviceID string, uid string) (exist bool, err error) {
	if serviceID == "" {
		return false, nil
	}

	if uid == "" {
		return false, nil
	}

	where := &model.ServiceApply{
		UID:         uid,
		ServiceID:   serviceID,
		ApplyDays:   0,
		AuditStatus: enum.AuditStatusPass,
		ExpiredTime: nil,
	}

	var count int64
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceApply{}).
		Where(where).
		Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo IsAuditing", zap.Error(tx.Error))
		return false, tx.Error
	}

	if count > 0 {
		return true, nil
	}

	return false, nil
}

func (r *serviceApplyRepo) AuditStatus(ctx context.Context, uid string, serviceIDs []string) (auditStatusMap map[string]string, err error) {
	var data []*model.ServiceApply

	tx := r.data.DB.WithContext(ctx).Model(&model.ServiceApply{}).
		Where("uid = ?", uid).
		Where("service_id in ?", serviceIDs).
		Order("update_time desc").
		Find(&data)

	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo AuditStatus", zap.Error(tx.Error))
		return nil, tx.Error
	}

	// 接口ID:审核状态
	auditStatusMap = make(map[string]string)
	for _, datum := range data {
		//每个接口ID 只取最新一条申请记录的状态
		_, ok := auditStatusMap[datum.ServiceID]
		if !ok {
			auditStatusMap[datum.ServiceID] = datum.AuditStatus
		}
	}

	return auditStatusMap, nil
}

// Available 返回可用的接口服务，“可用”的定义：
//
//   - xx数据局：已上线
//   - 非xx数据局，数据资源模式：已上线
//   - 非xx数据局，数据目录模式：已发布
func (r *serviceApplyRepo) Available(ctx context.Context, req *dto.AvailableAssetsListReq) (res []*model.ServiceAssociations, count int64, err error) {
	subject, err := interception.AuthServiceSubjectFromContext(ctx)
	if err != nil {
		log.Error("get subject from context for authorizing fail", zap.Error(err))
		return nil, 0, err
	}

	if s, err := parseSubjectString(req.Subject); err == nil {
		*subject = *s
	}

	//查询有权限的接口
	objects, err := r.authServiceRepo.SubjectObjects(ctx, "api", subject.ID, string(subject.Type))
	if err != nil {
		return nil, 0, err
	}

	entires := objects.Entries
	// 根据权限规则是否过期过滤
	entires = lo.Filter(entires, func(item *dto.SubjectObjectsResEntity, _ int) bool {
		// 权限是否过期
		var isExpired bool = item.ExpiredAt != nil && r.clock.Now().After(*item.ExpiredAt)
		switch req.PolicyStatus {
		case dto.PolicyActive:
			return !isExpired
		case dto.PolicyExpired:
			return isExpired
		default:
			return true
		}
	})
	// 接口服务 ID 列表
	var serviceIDs = lo.Map(entires, func(item *dto.SubjectObjectsResEntity, _ int) string { return item.ObjectId })
	// 为了分页查询结果稳定，对 serviceIDs 排序
	sort.Strings(serviceIDs)

	if len(serviceIDs) == 0 {
		return nil, 0, nil
	}
	// 查询是否为xx数据局项目
	cssjj, err := r.configurationCenterRepo.GetConfigValue(ctx, microservice.ConfigValueKeyCSSJJ)
	if err != nil {
		log.Error("Available --> 查询xx数据局出错：", zap.Error(err))
		return nil, 0, err
	}

	config, err := r.configurationCenterRepo.GetDataResourceDirectoryConfigInfo(ctx)
	if err != nil {
		log.Error("Available --> 查询启用数据资源管理方式配置出错：", zap.Error(err))
		return nil, 0, err
	}
	isEnable := config.Using == 1
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Scopes(Undeleted()).
		Where("service_id in ?", serviceIDs)

	if cssjj.Value == microservice.ConfigValueValueTrue {
		// xx数据局项目，无论是否启用数据资源目录，都支持接口上下线
		tx = tx.Where("status in ?", enum.ConsideredAsOnlineStatuses)
	} else if isEnable {
		//启用数据资源目录
		tx = tx.Where("publish_status = ?", enum.PublishStatusPublished)
	} else {
		tx = tx.Where("status in ?", enum.ConsideredAsOnlineStatuses)
	}

	if req.Keyword != "" {
		tx = tx.Where("(service_name like ? or service_code like ?) ", EscapeLike("%", req.Keyword, "%"), EscapeLike("%", req.Keyword, "%"))
	}

	if req.OrgCode != "" {
		//查询部门下所有的子部门
		subDepartmentGetRes, err := r.configurationCenterRepo.SubDepartmentGet(ctx, req.OrgCode)
		//没有子部门 只查自己
		if err != nil || subDepartmentGetRes == nil || len(subDepartmentGetRes.Entries) == 0 {
			tx = tx.Where("department_id = ?", req.OrgCode)
		} else {
			// 有子部门 查自己和子部门
			var departmentIDs = []string{req.OrgCode}
			for _, d := range subDepartmentGetRes.Entries {
				departmentIDs = append(departmentIDs, d.Id)
			}
			tx = tx.Where("department_id in ?", departmentIDs)
		}
	}

	// 过滤属于指定主题域的接口服务
	if req.SubjectDomainID != "" {
		// 过滤条件：接口服务所属主题域的 ID
		var id string = req.SubjectDomainID
		// // 过滤主题域未分类的接口服务
		if id == enum.ServiceUncategory {
			id = ""
		}
		tx = tx.Where("subject_domain_id = ?", id)
	}

	if req.Sort != "" {
		tx = tx.Order(req.Sort + " " + req.Direction)
	}

	tx.Count(&count)
	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo Available", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	tx.Scopes(Paginate(req.Offset, req.Limit)).Find(&res)
	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo Available", zap.Error(tx.Error))
		return nil, 0, tx.Error
	}

	for i := range res {
		for j := range objects.Entries {
			if objects.Entries[j].ObjectType != "api" {
				continue
			}
			if res[i].ServiceID != objects.Entries[j].ObjectId {
				continue
			}
			res[i].Policies = append(res[i].Policies, objects.Entries[j])
			break
		}
	}

	return res, count, nil
}

func (r *serviceApplyRepo) ConsumerWorkflowAuditResultRequest(ctx context.Context, result *common.AuditResultMsg) (err error) {
	log.Info("consumer workflow audit result msg", zap.String("audit_type", enum.AuditTypeRequest), zap.Any("msg", fmt.Sprintf("%#v", result)))

	// var result dto.AuditResultMsg
	// if err := json.Unmarshal(msg, &result); err != nil {
	// 	log.Error("serviceApplyRepo ConsumerWorkflowAuditResultRequest json.Unmarshal", zap.Error(err))
	// 	return err
	// }

	t := time.Now()
	apply := &model.ServiceApply{}
	switch result.Result {
	case enum.AuditStatusPass: //审核通过
		apply.AuditStatus = enum.AuditStatusPass
		apply.AuthTime = &t
	case enum.AuditStatusReject: // 审核拒绝和撤销 都标记为拒绝
		apply.AuditStatus = enum.AuditStatusReject
	case enum.AuditStatusUndone:
		apply.AuditStatus = enum.AuditStatusReject
	}

	r.data.DB.Model(&model.ServiceApply{}).
		Where(&model.ServiceApply{ApplyID: result.ApplyID}).
		Updates(apply)

	return nil
}

func (r *serviceApplyRepo) ConsumerWorkflowAuditProcDeleteRequest(_ context.Context, result *common.AuditProcDefDelMsg) error {
	// var result dto.AuditProcDefDelMsg
	// if err := json.Unmarshal(msg, &result); err != nil {
	// 	log.Error("serviceApplyRepo ConsumerWorkflowAuditProcDeleteRequest json.Unmarshal", zap.Any("msg", json.RawMessage(msg)))
	// 	return err
	// }

	if len(result.ProcDefKeys) == 0 {
		return nil
	}

	// 撤销正在进行中的审核
	tx := r.data.DB.Model(&model.ServiceApply{}).
		Where("audit_status = ?", enum.AuditStatusAuditing).
		Where("proc_def_key in ?", result.ProcDefKeys).
		Update("audit_status", enum.AuditStatusReject)
	if tx.Error != nil {
		log.Error("serviceApplyRepo ConsumerWorkflowAuditProcDeleteRequest Updates ServiceApply", zap.Error(tx.Error), zap.Any("msg", fmt.Sprintf("%#v", result)))
	}

	//删除审核流程绑定
	tx = r.data.DB.WithContext(context.Background()).
		Model(&model.AuditProcessBind{}).
		Where(&model.AuditProcessBind{AuditType: enum.AuditTypeRequest}).
		Delete(&model.AuditProcessBind{})
	if tx.Error != nil {
		log.Error("serviceApplyRepo ConsumerWorkflowAuditProcDeleteRequest Delete AuditProcessBind", zap.Error(tx.Error), zap.Any("msg", fmt.Sprintf("%#v", result)))
		return tx.Error
	}

	return nil
}

var supportedSubjectTypes = sets.New[string](
	string(v1.SubjectAPP),
	string(v1.SubjectUser),
)

func parseSubjectString(str string) (*v1.Subject, error) {
	t, id, found := strings.Cut(str, ":")
	if !found {
		return nil, fmt.Errorf("invalid subject string: %s", str)
	}

	if !supportedSubjectTypes.Has(t) {
		return nil, fmt.Errorf("invalid subject string: unsupported type: %s", t)
	}

	if _, err := uuid.Parse(id); err != nil {
		return nil, fmt.Errorf("invalid subject string: invalid id: %w", err)
	}

	return &v1.Subject{Type: v1.SubjectType(t), ID: id}, nil
}
func (r *serviceApplyRepo) AvailableServiceIDs(ctx context.Context, AppID string) (serviceIDs []string, err error) {
	subject, err := interception.AuthServiceSubjectFromContext(ctx)
	if err != nil {
		log.Error("get subject from context for authorizing fail", zap.Error(err))
		return nil, err
	}

	if s, err := parseSubjectString(fmt.Sprintf("app:%s", AppID)); err == nil {
		*subject = *s
	}

	//查询有权限的接口
	objects, err := r.authServiceRepo.SubjectObjects(ctx, "api", subject.ID, string(subject.Type))
	if err != nil {
		return nil, err
	}

	entires := objects.Entries
	// 根据权限规则是否过期过滤
	// entires = lo.Filter(entires, func(item *dto.SubjectObjectsResEntity, _ int) bool {
	// 权限是否过期
	// var isExpired bool = item.ExpiredAt != nil && r.clock.Now().After(*item.ExpiredAt)
	// switch req.PolicyStatus {
	// case dto.PolicyActive:
	// 	return !isExpired
	// case dto.PolicyExpired:
	// 	return isExpired
	// default:
	// 	return true
	// }
	// })
	// 接口服务 ID 列表
	serviceIDs = lo.Map(entires, func(item *dto.SubjectObjectsResEntity, _ int) string { return item.ObjectId })
	// 为了分页查询结果稳定，对 serviceIDs 排序
	sort.Strings(serviceIDs)

	if len(serviceIDs) == 0 {
		return nil, nil
	}

	config, err := r.configurationCenterRepo.GetDataResourceDirectoryConfigInfo(ctx)
	if err != nil {
		log.Error("Available --> 查询启用数据资源管理方式配置出错：", zap.Error(err))
		return nil, err
	}
	isEnable := config.Using == 1
	tx := r.data.DB.WithContext(ctx).
		Model(&model.Service{}).
		Select("service_id").
		Scopes(Undeleted()).
		Where("service_id in ?", serviceIDs)
	if isEnable {
		//启用数据资源目录
		tx = tx.Where("publish_status = ?", enum.PublishStatusPublished)
	} else {
		tx = tx.Where("status in ?", enum.ConsideredAsOnlineStatuses)
	}

	tx.Find(&serviceIDs)
	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceApplyRepo Available", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return
}
