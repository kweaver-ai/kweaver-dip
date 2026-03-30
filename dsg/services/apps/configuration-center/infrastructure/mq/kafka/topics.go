package kafka

const (
	DeleteRoleTopic            = "af.configuration-center.delete_role"
	DeleteUserRoleTopic        = "af.configuration-center.delete_user_role"
	RenameBusinessSystemTopic  = "af.configuration-center.rename_business_system"
	DeleteBusinessSystemTopic  = "af.configuration-center.delete_business_system"
	RenameBusinessMattersTopic = "af.configuration-center.rename_business_matters"
	DeleteBusinessMattersTopic = "af.configuration-center.delete_business_matters"
	RenameDepartmentTopic      = "af.configuration-center.rename_department"
	DeleteDepartmentTopic      = "af.configuration-center.delete_department"
	RenameOrganizationTopic    = "af.configuration-center.rename_organization"
	DeleteOrganizationTopic    = "af.configuration-center.delete_organization"
	DeleteMainBusinessTopic    = "af.configuration-center.delete_main_business"
	MoveOrganizationTopic      = "af.configuration-center.move_organization"
	MoveDepartmentTopic        = "af.configuration-center.move_department"
	MoveBusinessSystemTopic    = "af.configuration-center.move_business_system"
	MoveBusinessMattersTopic   = "af.configuration-center.move_business_matters"
	MoveMainBusinessTopic      = "af.configuration-center.move_main_business"
	EntityChangeTopic          = "af.business-grooming.entity_change"
	AppsCreateTopic            = "af.configuration-center.appsuser.created"
	AppsNameModifyTopic        = "af.configuration-center.appsname.modify"
	DeleteAppsFormTopic        = "af.configuration-center.appsuser.delete"
	AlarmRuleModifyTopic       = "af.configuration-center.alarm_rule.modify"
)

const (
	ProtonUserCreateTopic       = "af.core.user_management.user.created"
	ProtonNameModifyTopic       = "af.core.org.name.modify"
	ProtonDeleteUserFormTopic   = "af.core.user.delete"
	ProtonCreateDepartmentTopic = "af.core.user_management.dept.created"
	ProtonDeleteDepartment      = "af.core.dept.delete"
	ProtonMoveDepartment        = "af.user_management.dept.moved"
)
