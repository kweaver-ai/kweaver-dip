package gorm

import (
	"context"
	gocommon "github.com/kweaver-ai/idrm-go-common/rest/configuration_center/impl"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	workflow_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"fmt"
	"net/http"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type ConsumeAuthRequestRepo interface {
	ConsumerWorkflowAuditMsg(ctx context.Context, msg *workflow_common.AuditProcessMsg) error
	ConsumerWorkflowAuditResultRequest(ctx context.Context, msg *workflow_common.AuditResultMsg) error
	ConsumerWorkflowAuditProcDeleteRequest(ctx context.Context, msg *workflow_common.AuditProcDefDelMsg) error
}

// implement ConsumeAuthRequestRepo interface
type consumeAuthRequestRepo struct {
	db     *gorm.DB
	client *http.Client
	// data-view client
	dataView microservice.DataViewRepo
}

func NewConsumeAuthRequestRepo(db *gorm.DB, client *http.Client) ConsumeAuthRequestRepo {
	return &consumeAuthRequestRepo{
		db:     db,
		client: client,
		// data-view client
		dataView: microservice.NewDataViewRepo(),
	}
}

func (r *consumeAuthRequestRepo) ConsumerWorkflowAuditMsg(ctx context.Context, result *workflow_common.AuditProcessMsg) error {
	_, ok := constant.AuditTypeMap[result.ProcessDef.Category]
	if !ok {
		return nil
	}
	log.Info("consumer workflow audit process msg", zap.String("audit_type", result.ProcessDef.Category), zap.Any("msg", fmt.Sprintf("%#v", result)))
	authRequest := &model.LogicViewAuthorizingRequest{
		ApplyID:   result.ProcessInputModel.Fields.ApplyID,
		UpdatedAt: time.Now(),
	}
	if result.CurrentActivity == nil {
		log.Info("audit result auto finished, do nothing", zap.String("apply_id", result.ProcessInputModel.Fields.ApplyID))
	} else if len(result.NextActivity) == 0 {
		if !result.ProcessInputModel.Fields.AuditIdea {
			authRequest.Phase = constant.WorkflowResultRejected
			authRequest.Message = r.getAuditAdvice(result.ProcessInputModel.WFCurComment, result.ProcessInputModel.Fields.AuditMsg)
		}
	} else {
		if result.ProcessInputModel.Fields.AuditIdea {
			//当前节点审核通过，暂不落库
			log.Info("current node audit pass: ", zap.String("apply_id", result.ProcessInputModel.Fields.ApplyID))
		} else {
			authRequest.Phase = constant.WorkflowResultRejected
			authRequest.Message = r.getAuditAdvice(result.ProcessInputModel.WFCurComment, result.ProcessInputModel.Fields.AuditMsg)
		}
	}

	tx := r.db.Model(authRequest).
		Where(&model.LogicViewAuthorizingRequest{ApplyID: result.ProcessInputModel.Fields.ApplyID}).
		Updates(authRequest)
	if tx.Error != nil {
		log.Error("ConsumerWorkflowAuditMsg error: ", zap.Error(tx.Error))
		return tx.Error
	}
	return nil
}

func (r *consumeAuthRequestRepo) getAuditAdvice(curComment, auditMsg string) string {
	auditAdvice := ""
	if len(curComment) > 0 {
		auditAdvice = curComment
	} else {
		auditAdvice = auditMsg
	}

	// workflow 里不填审核意见时默认是 default_comment, 排除这种情况
	if auditAdvice == "default_comment" {
		auditAdvice = ""
	}

	return auditAdvice
}

func (r *consumeAuthRequestRepo) ConsumerWorkflowAuditResultRequest(ctx context.Context, msg *workflow_common.AuditResultMsg) error {
	log.Info("consumer workflow audit result msg", zap.String("audit_type", constant.DataPermissionRequest), zap.Any("msg", fmt.Sprintf("%#v", msg)))
	return r.consumerWorkflowAuditResult(constant.DataPermissionRequest, msg)
}

func (r *consumeAuthRequestRepo) ConsumerWorkflowAuditProcDeleteRequest(ctx context.Context, msg *workflow_common.AuditProcDefDelMsg) error {
	log.Info("consumer workflow process def delete msg", zap.String("audit_type", constant.DataPermissionRequest), zap.Any("msg", fmt.Sprintf("%#v", msg)))
	return r.consumerWorkflowAuditProcDelete(constant.DataPermissionRequest, msg)
}

var UpdatePolicyForSubjectAndObject = func(permissions []dto.Permission, subject *dto.Subject, object *dto.Object) (err error) {
	panic("unimplemented")
}

// AuthorizeIndicatorFunc 在指标授权被允许后授权所申请的权限
var AuthorizeIndicatorFunc = func(ctx context.Context, req *v1.IndicatorAuthorizingRequest) error {
	panic("unimplemented")
}

// AuthorizeAPIFunc 在接口授权被允许后授权所申请的权限
var AuthorizeAPIFunc = func(ctx context.Context, req *v1.APIAuthorizingRequest) error {
	panic("unimplemented")
}

// TODO: 重构处理审批结果，区分逻辑视图、指标不同类型的处理流程
func (r *consumeAuthRequestRepo) consumerWorkflowAuditResult(auditType string, result *workflow_common.AuditResultMsg) error {
	authRequest := &model.LogicViewAuthorizingRequest{
		UpdatedAt: time.Now(),
	}
	switch auditType {
	case constant.DataPermissionRequest:
		switch result.Result {
		case workflow_common.AUDIT_RESULT_PASS:
			authRequest.Phase = string(dto.LogicViewAuthorizingRequestApproved)
		case workflow_common.AUDIT_RESULT_REJECT:
			authRequest.Phase = string(dto.LogicViewAuthorizingRequestRejected)
		case workflow_common.AUDIT_RESULT_UNDONE:
			authRequest.Phase = string(dto.LogicViewAuthorizingRequestUndone)
		}
	}

	// 如果是接口授权请求，处理并返回
	{
		// 接口授权申请发起审核时，使用 ID 作为 ApplyID，所以使用 ApplyID 作为指
		// 标授权申请 ID 获取指标授权申请
		tx := r.db.Debug()
		// 如果找到指标授权申请，则记录审批结果并返回
		m := &model.APIAuthorizingRequest{ID: result.ApplyID}
		if tx = tx.First(m); tx.Error == nil {
			m.Message = fmt.Sprintf("audit result: %s", result.Result)
			switch result.Result {
			case workflow_common.AUDIT_RESULT_PASS:
				m.Phase = string(v1.APIAuthorizingRequestApproved)
			case workflow_common.AUDIT_RESULT_REJECT:
				m.Phase = string(v1.APIAuthorizingRequestRejected)
			case workflow_common.AUDIT_RESULT_UNDONE:
				m.Phase = string(v1.APIAuthorizingRequestUndone)
			default:
				m.Phase = string(v1.APIAuthorizingRequestFailed)
				m.Message = fmt.Sprintf("unsupported audit result: %s", result.Result)
			}

			// 记录审批结果到数据库
			if err := tx.Model(m).Select("phase", "message").Updates(m).Error; err != nil {
				return err
			}

			// 仅审批通过的请求需要执行授权
			if m.Phase != string(v1.APIAuthorizingRequestApproved) {
				return nil
			}

			req, err := m.MarshalAPIObject()
			if err != nil {
				return err
			}

			log.Info("authorizing api request", zap.Any("request", req))
			return AuthorizeAPIFunc(context.Background(), req)
		}
	}

	// 如果是指标授权请求，处理并返回
	{
		// 指标授权申请发起审核时，使用 ID 作为 ApplyID，所以使用 ApplyID 作为指
		// 标授权申请 ID 获取指标授权申请
		tx := r.db.Debug()
		// 如果找到指标授权申请，则记录审批结果并返回
		m := &model.IndicatorAuthorizingRequest{ID: result.ApplyID}
		if tx = tx.First(m); tx.Error == nil {
			m.Message = fmt.Sprintf("audit result: %s", result.Result)
			switch result.Result {
			case workflow_common.AUDIT_RESULT_PASS:
				m.Phase = string(v1.IndicatorAuthorizingRequestApproved)
			case workflow_common.AUDIT_RESULT_REJECT:
				m.Phase = string(v1.IndicatorAuthorizingRequestRejected)
			case workflow_common.AUDIT_RESULT_UNDONE:
				m.Phase = string(v1.IndicatorAuthorizingRequestUndone)
			default:
				m.Phase = string(v1.IndicatorAuthorizingRequestFailed)
				m.Message = fmt.Sprintf("unsupported audit result: %s", result.Result)
			}

			// 记录审批结果到数据库
			if err := tx.Model(m).Select("phase", "message").Updates(m).Error; err != nil {
				return err
			}

			// 仅审批通过的请求需要执行授权
			if m.Phase != string(v1.IndicatorAuthorizingRequestApproved) {
				return nil
			}

			req, err := m.MarshalAPIObject()
			if err != nil {
				return err
			}

			log.Info("authorizing indicator request", zap.Any("request", req))
			return AuthorizeIndicatorFunc(context.Background(), req)
		}
	}

	tx := r.db.Model(authRequest).Debug().
		Where(&model.LogicViewAuthorizingRequest{ApplyID: result.ApplyID}).
		Updates(authRequest)
	if tx.Error != nil {
		log.Error("consumerWorkflowAuditResult error: ", zap.Error(tx.Error))
		return tx.Error
	}

	log.Info("check phase", zap.String("phase", authRequest.Phase))
	// 只需要处理 Approved 的 LogicViewAuthorizingRequest
	if authRequest.Phase != string(dto.LogicViewAuthorizingRequestApproved) {
		return nil
	}

	// 从数据库获取 LogicViewAuthorizingRequest
	log.Info("get logic view authorizing request from database")
	if err := r.db.Where(&model.LogicViewAuthorizingRequest{ApplyID: result.ApplyID}).First(authRequest).Error; err != nil {
		log.Error("get logic view authorizing request fail", zap.Error(err), zap.String("applyID", result.ApplyID))
		return err
	}
	request, err := dto.LogicViewAuthReqModelMarshalDTO(authRequest)
	if err != nil {
		return err
	}

	// 生成授权申请对应的权限策略列表。如果需要，创建新的子视图（行列规则）。
	policies, err := r.generateLogicViewPolicies(context.Background(), &request.Spec)
	if err != nil {
		if errDB := r.updateLogicViewAuthorizingRequestPhaseAndMessage(context.Background(), request.ID, dto.LogicViewAuthorizingRequestFailed, fmt.Sprintf("generate logic view policies fail: %v", err)); errDB != nil {
			return fmt.Errorf("%v: update database record fail: %w", err, errDB)
		}
		return err
	}

	// 权限策略写入 Casbin
	log.Info("update policies", zap.Int("count", len(policies)))
	for _, p := range policies {
		for _, s := range p.Subjects {
			log.Info("update policy for subject and object", zap.Any("object", p.Object), zap.Any("subject", s), zap.Any("permissions", s.Permissions))
			if err := UpdatePolicyForSubjectAndObject(s.Permissions, &s, &p.Object); err != nil {
				if errDB := r.updateLogicViewAuthorizingRequestPhaseAndMessage(context.Background(), request.ID, dto.LogicViewAuthorizingRequestFailed, fmt.Sprintf("update policy for subject and object fail: %v", err)); errDB != nil {
					return fmt.Errorf("%v: update database record fail: %w", err, errDB)
				}
				log.Error("update policy for subject and object fail", zap.Error(err), zap.Any("object", p.Object), zap.Any("subject", s), zap.Any("permissions", s.Permissions))
				return err
			}
		}
	}

	// 授权请求完成处理
	request.Status.Phase = dto.LogicViewAuthorizingRequestCompleted

	// 保存到数据库
	log.Info("save to database")
	if err := dto.LogicViewAuthReqModelUnmarshalDTO(authRequest, request); err != nil {
		log.Error("unmarshal dto.LogicViewAuthorizingRequest fail", zap.Error(err), zap.Any("logicViewAuthorizingRequest", request))
		return err
	}
	if err := r.db.Debug().Where(&model.LogicViewAuthorizingRequest{ID: request.ID}).Updates(authRequest).Error; err != nil {
		log.Error("update logic view authorizing request in database fail", zap.Error(err), zap.Any("request", request))
		return err
	}

	return nil
}

func (r *consumeAuthRequestRepo) consumerWorkflowAuditProcDelete(auditType string, result *workflow_common.AuditProcDefDelMsg) error {
	if len(result.ProcDefKeys) == 0 {
		return nil
	}
	// 撤销正在进行的审核
	authRequest := &model.LogicViewAuthorizingRequest{
		Phase:     constant.WorkflowResultRejected,
		Message:   "workflow审核流程被删除，审核撤销",
		UpdatedAt: time.Now(),
	}
	err := r.db.Transaction(func(tx *gorm.DB) error {
		t := r.db.Model(authRequest).
			Where("proc_def_key in ?", result.ProcDefKeys).
			Where("phase = ?", constant.WorkflowResultAuditing).
			Updates(authRequest)
		if t.Error != nil {
			log.Error("consumerWorkflowAuditProcDelete error: ", zap.Error(tx.Error))
			return t.Error
		}
		// 删除审核绑定
		auditTypeReq := &configuration_center.DeleteProcessBindByAuditTypeReq{AuditType: auditType}
		err := gocommon.NewConfigurationCenterDrivenByService(r.client).DeleteProcessBindByAuditType(context.Background(), auditTypeReq)
		if err != nil {
			log.Error("consumerWorkflowAuditProcDelete and request configuration-center-service error: ", zap.Error(err))
			return nil
		}
		return nil
	})
	if err != nil {
		log.Error("consumerWorkflowAuditProcDelete error: ", zap.Error(err))
		return err
	}
	return nil
}

// updateLogicViewAuthorizingRequestPhaseAndMessage 更新 LogicViewAuthorizingRequest 的 Status.Pase 和 Status.Message
func (r *consumeAuthRequestRepo) updateLogicViewAuthorizingRequestPhaseAndMessage(ctx context.Context, id string, phase dto.LogicViewAuthorizingRequestPhase, message string) error {
	tx := r.db.WithContext(ctx)

	tx = tx.Debug()

	tx = tx.
		Model(&model.LogicViewAuthorizingRequest{}).
		Where(&model.LogicViewAuthorizingRequest{ID: id}).
		Updates(&model.LogicViewAuthorizingRequest{Phase: string(phase), Message: message})

	return tx.Error
}

// generateLogicViewPolicies 生成逻辑视图及其子视图（行列规则）的权限策略列表。
// 创建新的子视图（行列规则）如果需要。
func (r *consumeAuthRequestRepo) generateLogicViewPolicies(ctx context.Context, spec *dto.LogicViewAuthorizingRequestSpec) (policies []dto.Policy, err error) {
	// 整表权限策略
	if spec.Policies != nil {
		policies = append(policies, generateLogicViewPolicy(spec.ID, spec.Policies))
	}
	// 行列权限策略
	subViewPolices, err := r.createSubViewsAndGeneratePolicies(ctx, spec.SubViews)
	if err != nil {
		return
	}
	policies = append(policies, subViewPolices...)
	return
}

// createSubViewsAndGeneratePolicies 创建子视图（行列规则）并生成权限策略列表
func (r *consumeAuthRequestRepo) createSubViewsAndGeneratePolicies(ctx context.Context, specs []dto.SubViewAuthorizingRequestSpec) ([]dto.Policy, error) {
	var policies []dto.Policy
	for i, s := range specs {
		switch {
		case s.ID != "":
			// 引用已存在的子视图（行列规则）
		case s.Spec != nil:
			// 创建新的子视图（行列规则）
			log.Info("create sub view", zap.Any("spec", s.Spec))
			sv, err := r.dataView.CreateSubViewInternally(ctx, s.Spec)
			if err != nil {
				log.Error("create sub view fail", zap.Error(err), zap.Any("spec", s.Spec))
				return nil, err
			}
			// 更新 Spec.ID 为新创建的子视图（行列规则）的 ID
			specs[i].ID = sv.ID
		default:
			// 不应该走到这里，因为 s.ID 与 s.Spec 有且只有一个非空
			continue
		}
		policies = append(policies, generateSubViewPolicy(specs[i].ID, s.Policies))
	}
	return policies, nil
}

// generateLogicViewPolicy 生成逻辑视图的权限策略
func generateLogicViewPolicy(id string, policies []dto.SubjectPolicy) dto.Policy {
	return generateObjectPolicies(id, enum.ObjectTypeDataView, policies)
}

// generateSubViewPolicy 生成子视图（行列规则）的权限策略
func generateSubViewPolicy(id string, policies []dto.SubjectPolicy) dto.Policy {
	return generateObjectPolicies(id, enum.ObjectTypeSubView, policies)
}

// generateObjectPolicies 生成通用 Object 权限策略
func generateObjectPolicies(ObjectID string, ObjectType string, policies []dto.SubjectPolicy) dto.Policy {
	return dto.Policy{
		Object: dto.Object{
			ObjectId:   ObjectID,
			ObjectType: ObjectType,
		},
		Subjects: subjectsFromSubjectPolicies(policies),
	}
}

// subjectsFromSubjectPolicies 转换 []dto.SubjectPolicy -> []dto.Subject
func subjectsFromSubjectPolicies(policies []dto.SubjectPolicy) (subjects []dto.Subject) {
	for _, p := range policies {
		subjects = append(subjects, dto.Subject{
			SubjectId:   p.SubjectID,
			SubjectType: string(p.SubjectType),
			Permissions: permissionsFromActions(p.Actions),
			ExpiredAt:   p.ExpiredAt,
		})
	}
	return
}

// permissionsFromActions 转换 []dto.Action -> []dto.Permission
func permissionsFromActions(actions []dto.Action) (permissions []dto.Permission) {
	for _, a := range actions {
		permissions = append(permissions, dto.Permission{
			Action: string(a),
			Effect: enum.EffectAllow,
		})
	}
	return
}
