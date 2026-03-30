package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

//消费MQ消息的解决方法

func (u *useCase) HandlerDataPushMsg(ctx context.Context, dataSetInfo *domain.SandboxDataSetInfo) error {
	if err := u.repo.UpdateSpaceDataSet(ctx, dataSetInfo); err != nil {
		log.Warnf("UpdateSandboxDataSet eror %v", err.Error())
	}
	return nil
}
