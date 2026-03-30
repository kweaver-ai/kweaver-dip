package v1

import (
	"context"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// AutoUpdateTargetStatus 定时任务：自动更新考核目标状态
// 将已到期但状态仍为"未到期"的目标更新为"待评价"
func (ctl *Controller) AutoUpdateTargetStatus() {
	log.Info("开始执行考核目标状态自动更新任务")

	ctx := context.Background()
	if err := ctl.TargetDomain.AutoUpdateStatusByDate(ctx); err != nil {
		log.Errorf("自动更新考核目标状态失败: %v", err)
		return
	}

	log.Info("考核目标状态自动更新任务执行完成")
}

// 使用示例：
// 在定时任务调度器中注册此方法，例如每天凌晨1点执行：
// cron.AddFunc("0 1 * * *", controller.AutoUpdateTargetStatus)
