package impl

import (
	"context"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	callback_v1 "github.com/kweaver-ai/idrm-go-common/callback/data_catalog/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DataPushCallback struct {
	Client  callback_v1.DataPushCallbackServiceClient
	cfgRepo configuration_center.Repo
}

func NewDataPushCallback(client callback_v1.DataPushCallbackServiceClient, cfgRepo configuration_center.Repo) *DataPushCallback {
	return &DataPushCallback{
		Client:  client,
		cfgRepo: cfgRepo,
	}
}

func (c *DataPushCallback) OnCompleteTask(ctx context.Context, dataPushModel *model.TDataPushModel, taskLogInfo *domain.TaskLogInfo) error {
	taskInfo, err := c.genCallbackEvent(ctx, dataPushModel, taskLogInfo)
	log.Infof("genCallbackEvent, taskInfo: %v, err: %v", taskInfo, err)
	if err != nil {
		return err
	}
	if _, err := c.Client.CompleteTask(ctx, taskInfo); err != nil {
		log.Errorf("completeTask, err: %v", err)
		return err
	}
	// TODO: 记录回调是否结果：是否成功
	log.Infof("completeTask success, taskInfo: %v", taskInfo)
	return nil
}

// 生成回调事件
func (c *DataPushCallback) genCallbackEvent(ctx context.Context, dataPushModel *model.TDataPushModel, taskLogInfo *domain.TaskLogInfo) (*callback_v1.CompleteTaskRequest, error) {

	//dataPushModel.CreatedAt进行yyyy-MM-dd HH:mm:ss格式化
	taskCreateTime := dataPushModel.CreatedAt.Format("2006-01-02 15:04:05")
	stepId, _ := strconv.ParseInt(taskLogInfo.StepId, 10, 64)
	totalAmount, _ := strconv.ParseInt(taskLogInfo.SyncCount, 10, 64)
	sourceHuaAoId, _ := strconv.ParseInt(dataPushModel.SourceHuaAoId, 10, 64)
	targetHuaAoId, _ := strconv.ParseInt(dataPushModel.TargetHuaAoId, 10, 64)
	var transmitMode string
	if dataPushModel.TransmitMode == 1 {
		transmitMode = "增量"
	} else if dataPushModel.TransmitMode == 2 {
		transmitMode = "全量"
	}

	//创建sourceStatistics
	sourceStatistics := &callback_v1.Statistics{
		DatabaseId:   sourceHuaAoId, //todo 需要修改成华傲的id，位于配置中心
		DatasourceId: int64(dataPushModel.SourceDatasourceID),
		TableName:    dataPushModel.SourceTableName,
		TotalAmount:  totalAmount,
		Type:         transmitMode,
	}

	//创建targetStatistics
	targetStatistics := &callback_v1.Statistics{
		DatabaseId:   targetHuaAoId, //todo 需要修改成华傲的id，位于配置中心
		DatasourceId: int64(dataPushModel.TargetDatasourceID),
		TableName:    dataPushModel.TargetTableName,
		TotalAmount:  totalAmount,
		Type:         transmitMode,
	}
	// 生成TaskInfo，修改genCallbackEvent，通过dataPushModel.ThirdDeptId获取第三方部门ID作为deptCode
	deptCode := dataPushModel.ThirdDeptId
	tenantIdStr := settings.GetConfig().Tenant.TenantId
	var tenantId int64 = 10015 // 默认值
	if tenantIdStr != "" {
		if parsedTenantId, err := strconv.ParseInt(tenantIdStr, 10, 64); err == nil {
			tenantId = parsedTenantId
		}
	}

	taskInfo := &callback_v1.TaskInfo{
		TenantId:           tenantId, //todo 需要修改成从配置中心获取的id，暂时赋值为1
		TaskName:           dataPushModel.Name,
		TaskType:           callback_v1.TaskTypeEnum_push,
		TaskStatus:         callback_v1.TaskStatusEnum_completed,
		DeptCode:           deptCode,
		TaskCreateUser:     dataPushModel.CreatorName,
		TaskCreateTime:     taskCreateTime,
		ExecutionId:        stepId,
		ExecutionName:      taskLogInfo.StepName,
		ExecutionStartTime: taskLogInfo.StartTime,
		ExecutionEndTime:   &taskLogInfo.EndTime,
		ExecutionStatus:    callback_v1.ExecutionStatusEnum_execution_success,
		SourceStatistics:   sourceStatistics,
		TargetStatistics:   targetStatistics,
	}
	completeTaskRequest := &callback_v1.CompleteTaskRequest{
		Tasks: []*callback_v1.TaskInfo{taskInfo},
	}
	return completeTaskRequest, nil
}
