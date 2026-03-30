package af_tasks

type AFTasksInterface interface {
	// 工单
	WorkOrders() WorkOrderInterface
}
