package role

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type RoleHandler struct {
	projectUseCase tc_project.UserCase
	taskUseCase    tc_task.UserCase
}

func NewRoleHandler(projectUseCase tc_project.UserCase, taskUseCase tc_task.UserCase) *RoleHandler {
	return &RoleHandler{projectUseCase: projectUseCase, taskUseCase: taskUseCase}
}

// DeleteRoleHandler  a
func (r *RoleHandler) DeleteRoleHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(DeleteRoleMessage)
	if err = json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteRoleHandler Unmarshal", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("consumer receive roleId:%v", msg.Payload.RoleId)

	return nil
}

// DeleteUserRoleRelationHandler x
func (r *RoleHandler) DeleteUserRoleRelationHandler(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	msg := new(DeleteUserRoleRelationMessage)
	if err = json.Unmarshal(message.Value, msg); err != nil {
		log.WithContext(ctx).Error("consumer DeleteUserRoleRelationHandler Unmarshal", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("consumer receive roleId:%v, userId:%v ", msg.Payload.RoleId, msg.Payload.UserId)

	/*	if err := m.taskUseCase.DeleteTaskExecutorsUseRole(context.Background(), msg.Payload.RoleId, msg.Payload.UserId); err != nil {
		return err
	}*/
	log.WithContext(ctx).Info("删除未完成的项目中涉及到该角色用户的成员,删除未完成任务的执行人")
	if err := r.projectUseCase.DeleteMemberByUsedRoleUserProject(context.Background(), msg.Payload.RoleId, msg.Payload.UserId); err != nil {
		return err
	}
	return nil
}
