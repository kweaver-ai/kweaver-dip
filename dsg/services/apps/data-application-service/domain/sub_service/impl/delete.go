package impl

import (
	"context"

	"github.com/google/uuid"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Delete implements sub_service.SubServiceUseCase.
func (s *subServiceUseCase) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	// 获取指定子视图
	//subService, err := s.subServiceRepo.Get(ctx, id)
	//if err != nil {
	//	return err
	//}

	////检查当前用户是否有权限
	//if err = s.checkPermission(ctx, subService.ID.String(), authServiceV1.ObjectSubService, AllocateAction, AuthAction); err != nil {
	//	return err
	//}

	// 在 repository 中删除子视图
	if err := s.subServiceRepo.Delete(ctx, id); err != nil {
		return err
	}

	return nil
}
