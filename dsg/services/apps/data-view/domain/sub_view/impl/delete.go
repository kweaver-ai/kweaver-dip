package impl

import (
	"context"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"

	"github.com/google/uuid"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Delete implements sub_view.SubViewUseCase.
func (s *subViewUseCase) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 获取指定子视图
	subView, err := s.subViewRepo.Get(ctx, id)
	if err != nil {
		return err
	}

	//检查当前用户是否有权限删除子视图
	if err = s.checkPermission(ctx, subView.ID.String(), authServiceV1.ObjectSubView, AuthAllocate, AuthAction); err != nil {
		return err
	}

	// 在 repository 中删除子视图
	if err := s.subViewRepo.Delete(ctx, id); err != nil {
		return err
	}

	// 生产消息
	s.produceMessageSubViewDeleted(id)

	return nil
}
