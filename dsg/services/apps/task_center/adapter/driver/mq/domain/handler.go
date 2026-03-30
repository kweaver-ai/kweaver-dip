package domain

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/role"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type BusinessDomainHandler struct {
	projectUseCase tc_project.UserCase
	taskUseCase    tc_task.UserCase
}

func NewBusinessDomainHandler(projectUseCase tc_project.UserCase, taskUseCase tc_task.UserCase) *BusinessDomainHandler {
	return &BusinessDomainHandler{
		projectUseCase: projectUseCase,
		taskUseCase:    taskUseCase,
	}
}

// DeleteRoleHandler  a
func (m *BusinessDomainHandler) DeleteRoleHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(role.DeleteRoleMessage)
	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteRoleHandler Unmarshal", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("consumer receive roleId:%v", msg.Payload.RoleId)

	return nil
}

// DeleteUserRoleRelationHandler  a
func (m *BusinessDomainHandler) DeleteUserRoleRelationHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(role.DeleteUserRoleRelationMessage)
	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteUserRoleRelationHandler Unmarshal", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("consumer receive roleId:%v, userId:%v ", msg.Payload.RoleId, msg.Payload.UserId)

	/*	if err := m.taskUseCase.DeleteTaskExecutorsUseRole(context.Background(), msg.Payload.RoleId, msg.Payload.UserId); err != nil {
		return err
	}*/
	log.WithContext(ctx).Info("删除未完成的项目中涉及到该角色用户的成员")
	if err := m.projectUseCase.DeleteMemberByUsedRoleUserProject(context.Background(), msg.Payload.RoleId, msg.Payload.UserId); err != nil {
		return err
	}
	return nil
}

func (m *BusinessDomainHandler) DeleteMainBusinessHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(role.DeleteMainBusinessMessage)
	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteMainBusinessHandler Unmarshal error", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("DeleteMainBusinessHandler receive message:%v", string(message.Value))
	if err := m.taskUseCase.HandleDeleteMainBusinessMessage(context.Background(), msg.Payload.ExecutorID, msg.Payload.BusinessModelID); err != nil {
		log.WithContext(ctx).Error("HandleDeleteMainBusinessMessage error", zap.Error(err))
		return err
	}
	return nil
}

func (m *BusinessDomainHandler) DeleteBusinessDomainHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(role.DeleteBusinessDomainMessage)
	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteBusinessDomainHandler Unmarshal error", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("DeleteBusinessDomainHandler receive message:%v", string(message.Value))
	if err := m.taskUseCase.HandleDeleteBusinessDomainMessage(context.Background(), msg.Payload.ExecutorID, msg.Payload.SubjectDomainId); err != nil {
		log.WithContext(ctx).Error("HandleDeleteBusinessDomainMessage error", zap.Error(err))
		return err
	}
	return nil
}

func (m *BusinessDomainHandler) ModifyBusinessDomainHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(role.DeleteMainBusinessMessage)

	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer ModifyBusinessDomainHandler Unmarshal error", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("HandleModifyBusinessDomainMessage receive message:%v", string(message.Value))
	if err := m.taskUseCase.HandleModifyBusinessDomainMessage(context.Background(), msg.Payload.SubjectDomainId, msg.Payload.BusinessModelID); err != nil {
		log.WithContext(ctx).Error("HandleModifyBusinessDomainMessage error", zap.Error(err))
		return err
	}
	return nil
}

func (m *BusinessDomainHandler) DeletedBusinessFormHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(role.DeleteBusinessFormMessage)

	if err := json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer ModifyBusinessDomainHandler Unmarshal error", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("HandleDeletedBusinessFormHandler receive message:%v", string(message.Value))
	if err := m.taskUseCase.HandleDeletedBusinessFormMessage(context.Background(), msg.Payload.BusinessModelId, msg.Payload.Id); err != nil {
		log.WithContext(ctx).Error("HandleModifyBusinessDomainMessage error", zap.Error(err))
		return err
	}
	return nil
}
