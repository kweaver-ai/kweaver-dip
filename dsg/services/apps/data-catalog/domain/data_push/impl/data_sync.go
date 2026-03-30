package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/data_sync"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// CreateSyncModel 创建同步模型，然后根据配置建立工作流或者立即执行
func (u *useCase) CreateSyncModel(ctx context.Context, pushData *model.TDataPushModel) (err error) {
	collectingModel := processingModelReq(pushData)
	//建立同步模型
	defer func() {
		if err != nil {
			pushData.PushError = "创建推送模型失败"
		}
	}()
	modelID := fmt.Sprintf("%v", pushData.ID)
	if _, err = u.dataSyncDriven.CreateProcessingModel(ctx, modelID, collectingModel); err != nil {
		log.WithContext(ctx).Errorf("创建加工模型失败：%v", err.Error())
		return errorcode.Detail(errorcode.CreateDataSyncModelError, err.Error())
	}
	if isExecuteNow(pushData) {
		//立即执行任务
		if err = u.dataSyncDriven.Run(ctx, modelID); err != nil {
			log.WithContext(ctx).Errorf("立即执行失败：%v", err.Error())
			return errorcode.Detail(errorcode.DataSyncStartError, err.Error())
		}
	} else {
		//建立工作流，定时或者定期执行
		req := workflowReq(pushData)
		resp, err1 := u.dataSyncDriven.CreateWorkflow(ctx, pushData.DolphinWorkflowID, req)
		if err = SaveCallError(pushData, &resp, err1); err != nil {
			log.WithContext(ctx).Errorf("创建工作流失败：%v", err.Error())
			return errorcode.Detail(errorcode.DataSyncStartError, err.Error())
		}
	}
	//模型创建成功，修改状态
	pushData.PushStatus = JudgePushStatus(pushData)
	return nil
}

// UpdateSyncModel 更新同步模型
func (u *useCase) UpdateSyncModel(ctx context.Context, pushData *model.TDataPushModel) (err error) {
	collectingModel := processingModelReq(pushData)
	defer func() {
		if err != nil {
			pushData.PushError = "更新推送模型失败"
		}
	}()
	//建立同步模型
	modelID := fmt.Sprintf("%v", pushData.ID)
	if _, err = u.dataSyncDriven.UpdateProcessingModel(ctx, modelID, collectingModel); err != nil {
		return errorcode.Detail(errorcode.CreateDataSyncModelError, err.Error())
	}
	// if isExecuteNow(pushData) {
	// 	//立即执行任务
	// 	if err = u.dataSyncDriven.Run(ctx, modelID); err != nil {
	// 		log.WithContext(ctx).Errorf("立即执行失败：%v", err.Error())
	// 		return errorcode.Detail(errorcode.DataSyncStartError, err.Error())
	// 	}
	// } else {
	// 	//建立工作流，定时或者定期执行
	// 	req := workflowReq(pushData)
	// 	resp, err1 := u.dataSyncDriven.UpdateWorkflow(ctx, pushData.DolphinWorkflowID, req)
	// 	if err = SaveCallError(pushData, &resp, err1); err != nil {
	// 		log.WithContext(ctx).Errorf("创建工作流失败：%v", err.Error())
	// 		return errorcode.Detail(errorcode.DataSyncStartError, err.Error())
	// 	}
	// }
	// pushData.PushStatus = JudgePushStatus(pushData)
	return nil
}

// SwitchSyncModel  启用/停用 工作流
func (u *useCase) SwitchSyncModel(ctx context.Context, req *domain.SwitchReq) (err error) {
	wReq := &data_sync.WorkflowOnline{
		ID:           req.PushData.DolphinWorkflowID,
		OnlineStatus: int(req.ScheduleStatus),
	}
	resp, err1 := u.dataSyncDriven.UpdateWorkflowOnline(ctx, wReq)
	if err = SaveCallError(req.PushData, &resp, err1); err != nil {
		log.WithContext(ctx).Errorf("更新工作流状态失败：%v", err.Error())
	}
	req.PushData.PushStatus = constant.DataPushStatusStopped.Integer.Int32()
	if req.ScheduleStatus == constant.ScheduleStatusOn.Integer.Int32() {
		req.PushData.PushStatus = constant.DataPushStatusGoing.Integer.Int32()
	}
	return nil
}

// UpdateWorkflowSchedule  更新工作流
func (u *useCase) UpdateWorkflowSchedule(ctx context.Context, req *domain.SchedulePlanReq) error {
	//更新调度计划
	domain.UpdateSchedule(req.PushData)
	localModel := &updateCollectingModel{
		CommonModel: CommonModel{
			PushData: req.PushData,
		},
	}
	wReq := workflowReq(req.PushData)
	resp, err1 := u.dataSyncDriven.UpdateWorkflow(ctx, localModel.PushData.DolphinWorkflowID, wReq)
	if err := SaveCallError(req.PushData, &resp, err1); err != nil {
		log.WithContext(ctx).Errorf("更新工作流失败：%v", err.Error())
		req.PushData.PushError = "更新工作流失败"
		return errorcode.Detail(errorcode.DataSyncUpdateError, err.Error())
	}
	if isExecuteNow(req.PushData) {
		if err := u.dataSyncDriven.Run(ctx, fmt.Sprintf("%v", req.PushData.ID)); err != nil {
			log.WithContext(ctx).Errorf("立即执行失败：%v", err.Error())
			return errorcode.Detail(errorcode.DataSyncStartError, err.Error())
		}
	}
	return nil
}

// DeleteSyncModel 删除工作流，删除同步模型
func (u *useCase) DeleteSyncModel(ctx context.Context, dataPush *model.TDataPushModel) error {
	resp, err := u.dataSyncDriven.DeleteWorkflow(ctx, dataPush.DolphinWorkflowID)
	if err = SaveCallError(dataPush, &resp, err); err != nil {
		log.WithContext(ctx).Errorf("删除工作流失败：%v", err.Error())
		return errorcode.Detail(errorcode.DataSyncStartError, err.Error())
	}
	resp, err = u.dataSyncDriven.DeleteProcessingModel(ctx, fmt.Sprintf("%s", dataPush.ID))
	if err = SaveCallError(dataPush, &resp, err); err != nil {
		log.WithContext(ctx).Errorf("删除同步模型失败：%v", err.Error())
		return errorcode.Detail(errorcode.CreateDataSyncModelError, err.Error())
	}
	return nil
}

type T struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Detail      []struct {
		Key     string `json:"Key"`
		Message string `json:"Message"`
	} `json:"detail"`
	Solution string `json:"solution"`
}

//{"code":"DataSync.ResourceError.DataNotExist","description":"数据不存在","detail":[{"Key":"ResourceError.DataNotExist","Message":"工作流已删除或不存在"}],"solution":"请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档。"}
