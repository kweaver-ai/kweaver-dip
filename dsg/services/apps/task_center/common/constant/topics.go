package constant

// 发送的消息
const (
	FinishProjectTopic = "af.task-center.finish_project"
	DeleteProjectTopic = "af.task-center.delete_project"
	DeleteTaskTopic    = "af.task-center.delete_task"
	FinishTaskTopic    = "af.task-center.finish_task"
	// 工单
	TopicAFTaskCenterV1WorkOrders = "af.task-center.v1.work-orders"
	// 质量报告
	TopicAFTaskCenterV1QualityReports = "af.task-center.v1.quality-reports"
)

// 消费的消息
const (
	//DeleteRoleTopic             = "task-center.roles.delete_system_role"        //删除角色消息
	//DeleteUserRoleRelationTopic = "task-center.roles.delete_user_role_relation" //删除用户角色关系
	//DeleteRoleTopic             = "af.configuration-center.delete_role"                                 //删除角色消息

	DeleteUserRoleRelationTopic = "af.configuration-center.delete_user_role"    //删除用户角色关系
	DeleteMainBusinessTopic     = "af.business-grooming.delete_main_business"   //删除主干业务
	DeleteBusinessDomainTopic   = "af.business-grooming.delete_business_domain" //删除业务域
	ModifyBusinessDomainTopic   = "af.business-grooming.modify_business_domain" //主干业务修改业务域
	DeleteBusinessFormTopic     = "af.business-grooming.delete_business_form"   //删除业务表

	//proton用户消息，由configuration-center的kafka转发

	ProtonUserCreatedTopic = "af.core.user_management.user.created"
	ProtonUserUpdatedTopic = "af.core.org.name.modify"
	ProtonUserDeleteTopic  = "af.core.user.delete"

	// App消息
	AppsCreateTopic     = "af.configuration-center.appsuser.created" // 添加应用
	AppsNameModifyTopic = "af.configuration-center.appsname.modify"  //修改应用
	DeleteAppsFormTopic = "af.configuration-center.appsuser.delete"  //删除应用

	// 积分事件
	PointsEventTopic = "af.points.event" // 发布积分事件

	//数据推送

	DataPushTaskExecutingTopic = "af.data-catalog.data-push-task-executing" //数据推送任务执行
)
