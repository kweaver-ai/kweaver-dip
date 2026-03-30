package mq

const (
	//DeleteRoleTopic = "delete_role"
	//CreateMainBusinessTopic = "af.business-grooming.create_main_business"
	//ModifyMainBusinessTopic = "af.business-grooming.modify_main_business"
	//MoveMainBusinessTopic   = "af.business-grooming.move_main_business"
	//DeleteMainBusinessTopic = "af.business-grooming.delete_main_business"
	//CreateBusinessFormTopic = "af.business-grooming.create_business_form"
	//RenameBusinessFormTopic = "af.business-grooming.rename_business_form"
	//DeleteBusinessFormTopic = "af.business-grooming.delete_business_form"

	UserCreateTopic         = "core.user_management.user.created"
	NameModifyTopic         = "core.org.name.modify"
	UserMobileMailTopic     = "user_management.user.modified"
	DeleteUserFormTopic     = "core.user.delete"
	AppsCreateTopic         = "af.configuration-center.appsuser.created"
	AppsNameModifyTopic     = "af.configuration-center.appsname.modify"
	DeleteAppsFormTopic     = "af.configuration-center.appsuser.delete"
	CreateDepartmentTopic   = "core.user_management.dept.created"
	DeleteDepartment        = "core.dept.delete"
	MoveDepartment          = "user_management.dept.moved"
	WorkflowApplyAppRsult   = "workflow.audit.result.af-sszd-app-apply-escalate"
	WorkflowReportAppRsult  = "workflow.audit.result.af-sszd-app-report-escalate"
	WorkflowAppProcessRsult = "workflow.audit.msg"
)
