package operation_log

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type UserCase interface {
	Create(ctx context.Context, operationLog *model.OperationLog) error
	Query(ctx context.Context, query *OperationLogQueryParams) (*response.PageResult, error)
}

type OperationLogQueryParams struct {
	Obj       string `json:"obj" form:"obj" binding:"required,oneof=task project"`             // 操作对象名称
	ObjId     string `json:"obj_id" form:"obj_id" binding:"required,uuid"`                     // 操作对象ID
	Offset    int    `json:"offset" form:"offset,default=1" binding:"min=1"`                   // 页码
	Limit     int    `json:"limit" form:"limit,default=10" binding:"min=0,max=1000"`           // 每页大小，传0代表查询所有
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc"` // 排序方向
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at"`   // 排序类型
}

// OperationLogListModel mapped from table <operation_log>
type OperationLogListModel struct {
	ID            string ` json:"id"`             // 主键，uuid
	Name          string `json:"name"`            // 操作名
	Success       bool   `json:"success"`         // 是否成功，默认是成功的
	Result        string `json:"result"`          // 操作结果, 成功就是为空，否则显示失败的原因
	CreatedByUID  string `json:"created_by_uid"`  // 操作者的ID
	CreatedByName string `json:"created_by_name"` // 操作者的名称
	CreatedAt     int64  `json:"created_at"`      // 创建时间
}

func GenOperationLogListSlice(operationLogs []*model.OperationLog) []*OperationLogListModel {
	results := make([]*OperationLogListModel, 0)
	for _, log := range operationLogs {
		results = append(results, GenOperationLogList(log))
	}
	return results
}
func GenOperationLogList(operationLog *model.OperationLog) *OperationLogListModel {
	//userInfo := users.GetUser(operationLog.CreatedByUID)
	//name := ""
	//if userInfo != nil {
	//	name = userInfo.UserNameCn
	//}
	return &OperationLogListModel{
		ID:           operationLog.ID,
		Name:         operationLog.Name,
		Result:       operationLog.Result,
		CreatedByUID: operationLog.CreatedByUID,
		//CreatedByName: name,
		CreatedAt: operationLog.CreatedAt.UnixMilli(),
	}
}
