package driver

import (
	"github.com/gin-gonic/gin"
	"github.com/google/wire"
	role_v2 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/role/v2"

	address_book "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/address_book/v1"
	alarm_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/alarm_rule/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/apps/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/audit_policy/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/audit_process_bind/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/business_matters/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/business_structure/v1"
	carousels "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/carousels/v1"
	code_generation_rule "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/code_generation_rule/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/configuration/v1"
	data_grade "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/data_grade/v1"
	data_masking "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/data_masking/v1"
	datasource "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/datasource/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/dict/v1"
	firm "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/firm/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/flowchart/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/front_end_processor/v1"
	info_system "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/info_system/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/menu"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/middleware"
	news_policy "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/news_policy/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/object_main_business/v1"
	permission "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/permission/v1"
	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/register/v1"
	sms_conf "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/sms_conf/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/tool/v1"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/user/v1"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

var _ IRouter = (*Router)(nil)

var RouterSet = wire.NewSet(wire.Struct(new(Router), "*"), wire.Bind(new(IRouter), new(*Router)))

type IRouter interface {
	Register(r *gin.Engine) error
}

type Router struct {
	BusinessStructureApi  *business_structure.Service
	CodeGenerationRuleApi *code_generation_rule.Service
	FlowchartApi          *flowchart.Service
	//RoleApi               *role.Service
	RoleApiV2           *role_v2.Service
	ToolApi             *tool.Service
	UserApi             *user.Service
	Middleware          middleware.Middleware
	DataSource          *datasource.Service
	ConfigurationApi    *configuration.Service
	InfoSystemApi       *info_system.Service
	DataGrade           *data_grade.Service
	DataMasking         *data_masking.Service
	AuditProcessBindApi *audit_process_bind.Service
	AppsApi             *apps.Service
	BusinessMattersApi  *business_matters.Service
	DictApi             *dict.Service
	FirmApi             *firm.Service
	// 前置机
	FrontEndProcessor     *front_end_processor.Service
	MenuApi               *menu.Service
	AddressBookApi        *address_book.Service
	ObjectMainBusinessApi *object_main_business.Service
	AlarmRuleApi          *alarm_rule.Service
	PermissionApi         *permission.Service
	//RoleGroupApi          *role_group.Service
	//PlatformZoneApi  *platform_zone.Service
	CarouselsApi     *carousels.Service // 添加轮播图API接口
	NewsPolicyApi    *news_policy.Service
	AuditPolicysApi  *audit_policy.Service
	RegistrationsApi *register.Service
	SMSConfApi       *sms_conf.Service
}

func (r *Router) Register(engine *gin.Engine) error {
	r.RegisterApi(engine)
	return nil
}

func (r *Router) RegisterApi(engine *gin.Engine) {
	middlewareTraceEngine := engine.Group("")
	middlewareTraceEngine.Use(trace.MiddlewareTrace())
	configurationCenterRouter := middlewareTraceEngine.Group("/api/configuration-center/v1", r.Middleware.TokenInterception())
	configurationCenterInternalRouter := middlewareTraceEngine.Group("/api/internal/configuration-center/v1")
	configurationCenterNoOauthRouter := engine.Group("/api/configuration-center/v1") //内部调用，属于一个链路不加trace.MiddlewareTrace()
	//对接ISF的v2
	configurationCenterRouterV2 := middlewareTraceEngine.Group("/api/configuration-center/v2", r.Middleware.TokenInterception())
	{
		// flowchart
		{
			flowchartRouter := configurationCenterRouter.Group("/flowchart-configurations")

			flowchartRouter.POST("", r.FlowchartApi.PreCreate)           // 预新建运营流程
			flowchartRouter.PUT("/:fid", r.FlowchartApi.Edit)            // 编辑运营流程基本信息
			flowchartRouter.DELETE("/:fid", r.FlowchartApi.Delete)       // 删除指定运营流
			flowchartRouter.GET("", r.FlowchartApi.QueryPage)            // 查看运营流程列表，不返回正在新建的运营流程
			flowchartRouter.GET("/:fid", r.FlowchartApi.Get)             // 获取指定运营流程基本信息
			flowchartRouter.GET("/check", r.FlowchartApi.NameExistCheck) // 运营流程名称唯一性校验

			flowchartRouter.POST("/:fid/content", r.FlowchartApi.SaveContent) // 运营流程保存&定时保存
			flowchartRouter.GET("/:fid/content", r.FlowchartApi.GetContent)   // 获取指定运营流程的图形/草稿
			flowchartRouter.GET("/:fid/nodes", r.FlowchartApi.GetNodesInfo)   // 获取运营流程节点信息

		}
		// 角色
		//{
		//	roleRouter := configurationCenterRouter.Group("/roles")
		//
		//	roleRouter.POST("", r.RoleApi.New)                   //新建角色
		//	roleRouter.PUT("/:rid", r.RoleApi.Modify)            //更新角色
		//	roleRouter.GET("/:rid", r.RoleApi.Detail)            //角色详情
		//	roleRouter.DELETE("/:rid", r.RoleApi.Delete)         //废弃角色
		//	roleRouter.GET("", r.RoleApi.ListPage)               //查询角色
		//	roleRouter.GET("/info", r.RoleApi.RoleInfoQuery)     //查询角色基本信息
		//	roleRouter.GET("/icons", r.RoleApi.GetAllRoleIcons)  //获取所有角色的icon
		//	roleRouter.GET("/duplicated", r.RoleApi.CheckRepeat) //查询角色名称是否重复
		//	// 更新指定角色的权限
		//	roleRouter.PUT("/:rid/scope-and-permission", r.RoleApi.UpdateScopeAndPermissions)
		//	// 获取指定角色的权限
		//	roleRouter.GET("/:rid/scope-and-permission", r.RoleApi.GetScopeAndPermissions)
		//	// 获取指定角色，及其关联的数据，例如：更新人、权限
		//	configurationCenterRouter.GET("/frontend/roles/:rid", r.RoleApi.FrontGet)
		//	// 获取角色列表，及其关联的数据，例如：更新人、权限
		//	configurationCenterRouter.GET("/frontend/roles", r.RoleApi.FrontList)
		//	// 检查角色名称是否可以使用
		//	configurationCenterRouter.GET("/frontend/role-name-check", r.RoleApi.FrontRoleNameCheck)
		//}
		//{
		//	roleRelationsRouter := configurationCenterRouter.Group("/roles/:rid")
		//
		//	roleRelationsRouter.POST("/relations", r.RoleApi.AddUsersToRole)                  // 添加角色用户关系// TODO 废弃待注释
		//	roleRelationsRouter.DELETE("/relations", r.RoleApi.DeleteRoleRelation)            // 删除角色下的用户关系
		//	roleRelationsRouter.GET("/candidate", r.RoleApi.GetUserListCanAddToRole)          // 角色可添加的用户列表
		//	roleRelationsRouter.GET("/relations", r.RoleApi.RoleUserInPage)                   // 获取角色下的用户列表
		//	roleRelationsRouter.GET("/:uid", r.RoleApi.UserIsInRole)                          // 该用户是否在该角色下
		//	configurationCenterInternalRouter.GET("/roles/:rid/:uid", r.RoleApi.UserIsInRole) // 该用户是否在该角色下
		//	configurationCenterInternalRouter.GET("/role-ids", r.RoleApi.GetRoleIDs)          // 获取角色 ID 列表
		//}
		//角色V2
		{
			roleRouterV2 := configurationCenterRouterV2.Group("/roles")
			roleRouterV2.GET("/:rid", r.RoleApiV2.Detail)                   //角色详情
			roleRouterV2.GET("", r.RoleApiV2.ListPage)                      //查询角色列表
			roleRouterV2.GET("/:rid/relations", r.RoleApiV2.RoleUserInPage) //获取角色下的用户列表
		}
		// 角色组, 废弃
		{
			//g := configurationCenterRouter.Group("/role-groups")
			//// 创建角色组
			//g.POST("", r.RoleGroupApi.Create)
			//// 删除指定角色组
			//g.DELETE("/:id", r.RoleGroupApi.Delete)
			//// 更新指定角色组
			//g.PUT("/:id", r.RoleGroupApi.Update)
			//// 获取指定角色组
			//g.GET("/:id", r.RoleGroupApi.Get)
			//// 获取角色组列表
			//g.GET("", r.RoleGroupApi.List)
			//// 更新角色组、角色绑定，批处理
			//configurationCenterRouter.PUT("/role-group-role-bindings", r.RoleGroupApi.RoleGroupRoleBindingBatchProcessing)
			//// 获取指定角色组，及其关联的数据，例如：角色、更新人、所属部门
			//configurationCenterRouter.GET("/frontend/role-groups/:id", r.RoleGroupApi.FrontGet)
			//// 获取角色组列表，及其关联的数据，例如：角色、更新人、所属部门
			//configurationCenterRouter.GET("/frontend/role-groups", r.RoleGroupApi.FrontList)
			//// 检查角色组名称是否可以使用
			//configurationCenterRouter.GET("/frontend/role-group-name-check", r.RoleGroupApi.FrontNameCheck)
		}

		// tool mgr
		configurationCenterRouter.GET("tools", r.ToolApi.List) // 获取工具列表

		// business structure
		{
			businessStructureRouter := configurationCenterRouter.Group("/objects")
			businessStructureNoAccessControlRouter := configurationCenterRouter.Group("/objects")
			businessStructureNoOauthRouter := configurationCenterNoOauthRouter.Group("/objects")

			//businessStructureRouter.POST("/batch", r.BusinessStructureApi.DeleteObjects)          // batch delete objects
			//businessStructureRouter.POST("", r.BusinessStructureApi.Create)                       // create object
			//businessStructureRouter.GET("/check", r.BusinessStructureApi.CheckRepeat)             // name repeat check
			businessStructureRouter.PUT("/:id", r.BusinessStructureApi.Update)                                          // 修改部门信息
			businessStructureNoAccessControlRouter.GET("", r.BusinessStructureApi.GetObjects)                           // 获取部门列表
			businessStructureNoAccessControlRouter.GET("/organization", r.BusinessStructureApi.GetObjectsOraganization) // 获取部门机构列表
			businessStructureNoOauthRouter.GET("/internal", r.BusinessStructureApi.GetObjectList)                       // 获取部门列表
			businessStructureRouter.GET("/:id", r.BusinessStructureApi.GetObjectById)                                   // 查看部门详情
			configurationCenterInternalRouter.GET("/objects/:id", r.BusinessStructureApi.GetObjectById)                 // 查看部门详情内部接口
			businessStructureRouter.POST("/:id/upload", r.BusinessStructureApi.Upload)                                  // 上传文件
			businessStructureRouter.POST("/:id/download", r.BusinessStructureApi.Download)                              // 下载文件
			configurationCenterInternalRouter.GET("/department/precision", r.BusinessStructureApi.GetDepartmentPrecision)
			//configurationCenterInternalRouter.GET("/department/path", r.BusinessStructureApi.GetDepartmentByPath)
			configurationCenterInternalRouter.POST("/department/paths", r.BusinessStructureApi.GetDepartsByPaths) //查询路径下的部门
			configurationCenterInternalRouter.PUT("/objects/file/:id", r.BusinessStructureApi.UpdateFileById)     // 修改组织架构文件信息
			//businessStructureRouter.GET("/names", r.BusinessStructureApi.GetObjectNames)          // 获取对象名

			businessStructureNoAccessControlRouter.GET("/tree", r.BusinessStructureApi.GetObjectsPathTree) // 获取树形结构对象列表
			//businessStructureRouter.PUT("/:id/move", r.BusinessStructureApi.Move)                       // 移动对象
			//businessStructureRouter.GET("/:id/path", r.BusinessStructureApi.GetObjectPathInfo)          // 获取对象路径信息
			//businessStructureRouter.GET("/:id/suggested-name", r.BusinessStructureApi.GetSuggestedName) // 获取对象建议名
			configurationCenterInternalRouter.GET("/objects/department/:id", r.BusinessStructureApi.GetDepartmentByIdOrThirdId)  // 内部接口，根据部门ID或第三方部门ID查询部门对象
			configurationCenterInternalRouter.GET("/objects/departments/batchByIds", r.BusinessStructureApi.GetDepartmentsByIds) // 获取部门基本信息
			businessStructureRouter.POST("/sync", r.BusinessStructureApi.SyncStructure)                                          // 同步组织架构
			businessStructureNoAccessControlRouter.GET("/sync/time", r.BusinessStructureApi.GetSyncTime)                         // 获取组织架构同步时间
			businessStructureNoAccessControlRouter.GET("/:id/main-business", r.ObjectMainBusinessApi.GetObjectMainBusinessList)  // 获取对象主干业务列表
			businessStructureRouter.POST("/:id/main-business", r.ObjectMainBusinessApi.AddObjectMainBusiness)                    // 添加对象主干业务
			businessStructureRouter.PUT("/main-business", r.ObjectMainBusinessApi.UpdateObjectMainBusiness)                      // 修改对象主干业务
			businessStructureRouter.DELETE("/main-business", r.ObjectMainBusinessApi.DeleteObjectMainBusiness)                   // 删除对象主干业务
			businessStructureRouter.GET("/first_level_department", r.BusinessStructureApi.FirstLevelDepartment)                  //查询一级部门

		}
		// 权限
		//{
		//	g := configurationCenterRouter.Group("permission")
		//	// 获取指定权限
		//	g.GET("/:id", r.PermissionApi.Get)
		//	// 获取权限列表
		//	g.GET("", r.PermissionApi.List)
		//
		//	g.POST("/query-permission-user-list", r.PermissionApi.QueryBatchPermissionUserList)            //批量根据权限ids查询用户列表
		//	g.GET("/query-permission-user-list/:id", r.PermissionApi.QueryPermissionUserList)              // 单个根据权限id查询用户列表
		//	g.GET("/query-permission-user-list/:id/search", r.PermissionApi.QueryPermissionSearchUserList) // 单个根据权限ID和用户名称及第三方ID查询用户列表
		//	g.GET("/user-permission-scope-list", r.PermissionApi.GetUserPermissionScopeList)               //根据用户获取权限列表
		//	//configurationCenterInternalRouter.GET("/permission/check/:permissionId/:uid", r.PermissionApi.UserCheckPermission) // 该用户是否在该权限下
		//}
		// 用户
		{
			//without AccessControl interface // TODO 废弃待注释
			configurationCenterRouter.GET("/users/roles", r.UserApi.GetUserRoles) // 用户添加的角色列表
			//configurationCenterRouter.GET("/users/access-control", r.UserApi.AccessControl)                     // 用户-角色-权限值
			configurationCenterRouter.GET("/access-control", r.UserApi.HasAccessPermission) // 角色-资源 访问许可
			//configurationCenterRouter.GET("/users/access-control/manager", r.UserApi.HasManageAccessPermission) // 角色-资源 访问许可
			//configurationCenterRouter.POST("/users/access-control", r.UserApi.AddAccessControl) // 添加用户角色的权限值
			configurationCenterRouter.GET("/users/depart", r.UserApi.GetUserDepart)                  // 登录用户所属部门
			configurationCenterRouter.GET("/users/name", r.UserApi.ListUserNames)                    // 获取用户名称
			configurationCenterInternalRouter.GET("/:id/depart", r.UserApi.GetUserIdDepart)          // 用户所属部门
			configurationCenterRouter.GET("/users/filter", r.UserApi.GetUserByDepartAndRole)         // 查询用户列表(部门角色)
			configurationCenterInternalRouter.GET("/users/filter", r.UserApi.GetUserByDepartAndRole) // 内部接口查询用户列表(部门角色)
			configurationCenterRouter.GET("/depart/users", r.UserApi.GetDepartUsers)                 // 部门下的用户
			configurationCenterRouter.GET("/depart-users", r.UserApi.GetDepartAndUsersPage)          // 查询部门和用户列表
			configurationCenterRouter.GET("/users/:id", r.UserApi.GetUser)                           // 获取指定用户，登录名称、显示名称、所属部门、邮箱等
			configurationCenterInternalRouter.GET("/users/:ids", r.UserApi.GetUserByIds)             // 内部接口，根据用户ID获取用户名称和类型
			// 路由 /users/:id 已经被占用所以使用 /user/:id
			configurationCenterInternalRouter.GET("/user/:id/departs", r.UserApi.GetUserDeparts) // 获取指定用户，登录名称、显示名称、所属部门、邮箱等
			configurationCenterRouter.GET("/user/:id", r.UserApi.GetUserDetail)                  // 获取指定用户详情
			configurationCenterRouter.GET("/users", r.UserApi.GetUserList)                       // 获取用户列表
			configurationCenterInternalRouter.GET("/user/:id", r.UserApi.GetUserDetail)          // 获取指定用户详情
			configurationCenterInternalRouter.GET("/users", r.UserApi.GetUserList)               // 获取用户列表
			configurationCenterInternalRouter.GET("/users/batchByIds", r.UserApi.QueryUserByIds) // 根据用户ID批量获取基本信息
			// 更新指定用户的权限
			//configurationCenterRouter.PUT("/users/:id/scope-and-permission", r.UserApi.UpdateScopeAndPermissions)
			// 获取指定用户的权限
			//configurationCenterRouter.GET("/users/:id/scope-and-permission", r.UserApi.GetScopeAndPermissions)
			// 更新用户角色或角色组绑定，批处理
			//configurationCenterRouter.PUT("/user-role-or-role-group-bindings", r.UserApi.UserRoleOrRoleGroupBindingBatchProcessing)
			// 获取指定用户及其相关数据
			configurationCenterRouter.GET("/frontend/users/:id", r.UserApi.FrontGet)
			// 获取用户列表及其相关数据
			configurationCenterRouter.GET("/frontend/users", r.UserApi.FrontList)
			configurationCenterInternalRouter.GET("/user/:id/main-depart-ids", r.UserApi.GetUserIdByMainDeptIds) // 根据用户id查询部门及主部门及子部门的ID
			configurationCenterRouter.GET("/user/:id/main-depart-ids", r.UserApi.GetUserIdByMainDeptIds)
			configurationCenterRouter.GET("/frontend/user/main-depart-id", r.UserApi.GetFrontendUserMainDept) // 获取用户的默认主部门信息（一个）
		}
		{
			configurationCenterRouter.GET("/third_party_addr", r.ConfigurationApi.GetThirdPartyAddrWithOutPath) // 获取第三方平台访问地址
			configurationCenterRouter.GET("/config-value", r.ConfigurationApi.GetConfigValueByKey)              // 通用方法，用于配置表中key对应值value的获取
			configurationCenterRouter.GET("/config-values", r.ConfigurationApi.GetConfigValueByKeys)            // 通用方法，用于配置表中key对应值value的获取(批量)
			configurationCenterRouter.PUT("/config-value", r.ConfigurationApi.PutConfigValueByKey)              // 通用方法，用于配置表中key对应值value
			configurationCenterRouter.GET("/project-provider", r.ConfigurationApi.GetProjectProvider)
			configurationCenterRouter.GET("/byType-list/:resType", r.ConfigurationApi.GetByTypeList)               // 根据类型获取配置集合
			configurationCenterInternalRouter.GET("/config-value", r.ConfigurationApi.GetConfigValueByKey)         // 内部接口，用于配置表中key对应值value的获取
			configurationCenterInternalRouter.GET("/byType-list/:resType", r.ConfigurationApi.GetByTypeList)       // 根据类型获取配置集合
			configurationCenterNoOauthRouter.GET("/application/version", r.ConfigurationApi.GetApplicationVersion) // 获取版本号
			configurationCenterRouter.GET("/enum-config", r.ConfigurationApi.GetEnumConfig)                        // get enum config
		}

		{
			dataSourceRouter := configurationCenterRouter.Group("/datasource")
			//dataSourceRouter := configurationCenterRouter.Group("/datasource")
			configurationCenterRouter.GET("/datasource",
				r.Middleware.MultipleAccessControl(access_control.DataSource, access_control.ShareApplication),
				r.DataSource.PageDataSource) //查询数据源列表
			dataSourceRouter.GET("/:id", r.DataSource.GetDataSourceDetail) //查询数据源详情
			//dataSourceRouter.GET("/repeat", r.DataSource.NameRepeat)                                                       //查询数据源名称是否重复
			//dataSourceRouter.POST("", r.DataSource.CreateDataSource)                                                       //新建数据源
			//dataSourceRouter.POST("/batch", r.DataSource.CreateDataSourceBatch)                                            //批量新建数据源
			dataSourceRouter.PUT("/:id", r.DataSource.ModifyDataSource)        //修改数据源
			dataSourceRouter.PUT("/batch", r.DataSource.ModifyDataSourceBatch) //修改数据源
			//dataSourceRouter.DELETE("/:id", r.DataSource.DeleteDataSource)                                                 //删除数据源
			//dataSourceRouter.DELETE("/batch", r.DataSource.DeleteDataSourceBatch)                                          //批量删除数据源
			//dataSourceRouter.PUT("/connect-status", r.DataSource.UpdateConnectStatus)                                      //查询数据源组
			configurationCenterRouter.GET("/datasource/precision", r.DataSource.GetDataSourcePrecision)                    //查询数据源
			configurationCenterInternalRouter.GET("/datasource/precision", r.DataSource.GetDataSourcePrecision)            //查询数据源
			configurationCenterInternalRouter.GET("/datasource/all", r.DataSource.GetAll)                                  //查询所有数据源
			configurationCenterRouter.GET("/datasource/group-by-source-type", r.DataSource.GetDataSourceGroupBySourceType) //查询数据源组
			configurationCenterRouter.GET("/datasource/group-by-type", r.DataSource.GetDataSourceGroupByType)              //查询数据源组
		}

		{
			infoSystemRouter := configurationCenterRouter.Group("/info-system")
			infoSystemRouterInternal := configurationCenterInternalRouter.Group("info-system")
			infoSystemRouter.GET("", r.InfoSystemApi.PageInfoSystem)                                                //查询信息系统列表
			configurationCenterRouter.GET("/info-system/:id", r.InfoSystemApi.GetInfoSystem)                        //查询单个信息系统
			infoSystemRouterInternal.GET("/:id", r.InfoSystemApi.GetInfoSystem)                                     //查询单个信息系统（内部）
			infoSystemRouter.GET("/repeat", r.InfoSystemApi.NameRepeat)                                             //查询信息系统名称是否重复
			infoSystemRouter.POST("", r.InfoSystemApi.CreateInfoSystem)                                             //新建信息系统
			infoSystemRouter.PUT("/:id", r.InfoSystemApi.ModifyInfoSystem)                                          //修改信息系统
			infoSystemRouterInternal.POST(":id/enqueue", r.InfoSystemApi.EnqueueInfoSystem)                         //入队信息系统
			infoSystemRouterInternal.POST("enqueue", r.InfoSystemApi.EnqueueInfoSystems)                            //入队信息系统，批量
			infoSystemRouter.DELETE("/:id", r.InfoSystemApi.DeleteInfoSystem)                                       //删除信息系统
			configurationCenterRouter.GET("/info-system/precision", r.InfoSystemApi.GetInfoSystemPrecision)         //查询信息系统列表
			configurationCenterInternalRouter.GET("/info-system/precision", r.InfoSystemApi.GetInfoSystemPrecision) //查询信息系统列表
			// 信息系统注册
			infoSystemRouter.PUT("/:id/register", r.InfoSystemApi.RegisterInfoSystem)                 // 注册信息系统
			infoSystemRouter.GET("/system_identifier/repeat", r.InfoSystemApi.SystemIdentifierRepeat) // 检查系统标识是否重复
		}
		//configurationCenterNoOauthRouter.POST("/datasource/system-info", r.DataSource.GetDataSourceSystemInfos) //批量获取信息系统信息

		{
			businessDomainLevelRouter := configurationCenterRouter.Group("/business-domain-level")
			businessDomainLevelRouter.GET("", r.ConfigurationApi.GetBusinessDomainLevel) // 查询业务域层级
			businessDomainLevelRouter.PUT("", r.ConfigurationApi.PutBusinessDomainLevel) // 修改业务域层级
		}

		// 编码生成规则
		{
			// 访问控制中间件：CRUD 编码生成规则
			accessControlCodeGenerationRule := r.Middleware.AccessControl(access_control.CodeGenerationRule)
			// 更新指定编码生成规则
			configurationCenterRouter.PATCH("code-generation-rules/:id", accessControlCodeGenerationRule, r.CodeGenerationRuleApi.PatchCodeGenerationRule)
			// 获取所有编码生成规则的列表
			configurationCenterRouter.GET("code-generation-rules", accessControlCodeGenerationRule, r.CodeGenerationRuleApi.ListCodeGenerationRules)
			// 获取指定编码生成规则
			configurationCenterRouter.GET("code-generation-rules/:id", accessControlCodeGenerationRule, r.CodeGenerationRuleApi.GetCodeGenerationRule)
			// 存在性检查：前缀
			configurationCenterRouter.POST("code-generation-rules/existence-check/prefix", accessControlCodeGenerationRule, r.CodeGenerationRuleApi.ExistenceCheckPrefix)

			// 访问控制中间件：创建编码
			accessControlCode := r.Middleware.AccessControl(access_control.Code)
			// 根据编码生成规则生成编码
			configurationCenterRouter.POST("code-generation-rules/:id/generation", accessControlCode, r.CodeGenerationRuleApi.GenerateCodes)
			configurationCenterInternalRouter.POST("code-generation-rules/:id/generation", r.CodeGenerationRuleApi.GenerateCodes)
		}

		//资源配置开关 (通用配置)
		{
			ResourceTypeRouter := configurationCenterRouter.Group("/data/using")
			ResourceTypeRouter.PUT("", r.ConfigurationApi.PutDataUsingType) // 设置资产或目录类型
			GetResourceTypeRouter := configurationCenterRouter.Group("/data/using")
			GetResourceTypeRouter.GET("", r.ConfigurationApi.GetDataUsingType)                        // 查询资产或目录类型
			configurationCenterInternalRouter.GET("/data/using", r.ConfigurationApi.GetDataUsingType) // 查询资产或目录类型（内部接口给认知助手使用）

		}

		//共享配置开关 (通用配置)
		{
			GovernmentDataShareRouter := configurationCenterRouter.Group("/government-data-share")
			GovernmentDataShareRouter.PUT("", r.ConfigurationApi.PutGovernmentDataShare) // 设置共享配置
			GetGovernmentDataShareRouter := configurationCenterRouter.Group("/government-data-share")
			GetGovernmentDataShareRouter.GET("", r.ConfigurationApi.GetGovernmentDataShare)                            // 查询共享配置
			configurationCenterInternalRouter.GET("/government-data-share", r.ConfigurationApi.GetGovernmentDataShare) // 查询共享配置(内部接口使用)
		}

		//cssjj配置开关 (通用配置)
		{
			configurationCenterInternalRouter.GET("/cssjj/status", r.ConfigurationApi.GetCssjjStatus) // 查询cssjj配置状态（内部接口使用）
		}

		{
			//分级标签
			configurationCenterRouter.POST("/grade-label/", r.DataGrade.Add)                          // 新增/编辑分级标签
			configurationCenterRouter.POST("/grade-label/reorder", r.DataGrade.Reorder)               // 分级标签重新排序
			configurationCenterRouter.GET("/grade-label", r.DataGrade.ListTree)                       //查询分级标签/分组列表
			configurationCenterRouter.GET("/grade-label/binding/:id", r.DataGrade.GetBindObjectsByID) //通过ID查询标签绑定信息
			configurationCenterRouter.GET("/grade-label/:parentID", r.DataGrade.ListByParentID)       //查询分级标签通过parentID
			configurationCenterRouter.DELETE("/grade-label/:id", r.DataGrade.Delete)                  // 删除
			configurationCenterRouter.POST("/grade-label/status", r.DataGrade.StatusOpen)             //分级标签开启
			configurationCenterRouter.GET("/grade-label/status", r.DataGrade.StatusCheck)             //分级标签开启状态检查
			configurationCenterRouter.GET("/grade-label/id/:id", r.DataGrade.GetInfoByID)             // 通过ID查询标签信息
			configurationCenterRouter.GET("/grade-label/name/:name", r.DataGrade.GetInfoByName)       // 通过ID查询标签信息
			configurationCenterRouter.GET("/grade-label/check-name", r.DataGrade.CheckNameRepeat)     // 检查名称是否重名
			configurationCenterRouter.GET("/grade-label/list_icon", r.DataGrade.ListIcon)             //icon列表查询
			configurationCenterInternalRouter.GET("/grade-label/list/:ids", r.DataGrade.GetListByIds)
			configurationCenterInternalRouter.GET("/grade-label", r.DataGrade.ListTree) //查询分级标签/分组列表
		}
		{
			TimestampBlacklistRouter := configurationCenterRouter.Group("/timestamp-blacklist")
			TimestampBlacklistRouter.PUT("", r.ConfigurationApi.PutTimestampBlacklist)                              // 修改业务更新时间黑名单
			TimestampBlacklistRouter.GET("", r.ConfigurationApi.GetTimestampBlacklist)                              // 查询业务更新时间黑名单
			configurationCenterInternalRouter.GET("/timestamp-blacklist", r.ConfigurationApi.GetTimestampBlacklist) // 查询业务更新时间黑名单
		}
		// 审核流程
		{
			//审核流程绑定
			auditProcessBindRouter := configurationCenterRouter.Group("audit-process")
			auditProcessBindRouter.POST("", r.AuditProcessBindApi.AuditProcessBindCreate)                                                   //审核流程绑定创建
			auditProcessBindRouter.GET("", r.AuditProcessBindApi.AuditProcessBindList)                                                      //审核流程绑定列表
			auditProcessBindRouter.PUT("/:id", r.AuditProcessBindApi.AuditProcessBindUpdate)                                                //审核流程绑定更新
			auditProcessBindRouter.DELETE("/:id", r.AuditProcessBindApi.AuditProcessBindDelete)                                             //审核流程绑定删除
			auditProcessBindRouter.GET("/:id", r.AuditProcessBindApi.AuditProcessBindGet)                                                   //审核流程详情
			configurationCenterInternalRouter.GET("/audit-process/:audit_type", r.AuditProcessBindApi.AuditProcessBindGetByAuditType)       //内部接口，获取绑定详情
			configurationCenterInternalRouter.DELETE("/audit-process/:audit_type", r.AuditProcessBindApi.AuditProcessBindDeleteByAuditType) //内部接口，删除绑定

		}
		//data_masking
		{
			configurationCenterRouter.POST("/data-security/sql-masking", r.DataMasking.DoMasking)
		}
		// 应用授权管理
		{
			appsRouter := configurationCenterRouter.Group("/apps")
			appsRouter.POST("", r.AppsApi.AppsCreate)                                 //应用授权创建
			appsRouter.PUT("/:id", r.AppsApi.AppsUpdate)                              //应用授权更新
			appsRouter.DELETE("/:id", r.AppsApi.AppsDelete)                           //应用授权删除
			appsRouter.GET("/:id", r.AppsApi.AppsGetById)                             //应用授权详情
			configurationCenterInternalRouter.GET("/apps/:id", r.AppsApi.AppsGetById) //内部接口，应用授权详情
			appsRouter.GET("", r.AppsApi.AppsList)                                    //应用授权查询
			appsRouter.PUT("/:id/app-audit/cancel", r.AppsApi.AppCancel)              //撤回创建或者更新应用系统
			appsRouter.GET("/apply-audit", r.AppsApi.GetApplyAuditList)               // 审核列表查询接口
			appsRouter.GET("/all-brief", r.AppsApi.AppsAllListBrief)                  //应用授权查询(获取所有)
			appsRouter.GET("/repeat", r.AppsApi.NameRepeat)                           //应用授权名称是否重复检查
			// appsRouter.GET("/account_name/repeat", r.AppsApi.AccountNameRepeat) //应用账号名称是否重复检查
			appsRouter.GET("/enum-config", r.AppsApi.GetEnumConfig) //获取省直达应用领域和应用范围
			// configurationCenterInternalRouter.GET("/apps/access-control", r.AppsApi.HasAccessPermission)                    // 内部接口，检查应用账号是否有权限
			configurationCenterInternalRouter.GET("/apps/account/:id", r.AppsApi.AppByAccountId)                            // 内部接口，根据账户ID获取应用信息
			configurationCenterInternalRouter.GET("/apps/application-developer/:id", r.AppsApi.AppByApplicationDeveloperId) // 内部接口，根据应用开发者角色ID获取应用信息
			// 应用注册相关
			appsRouter.PUT("/:id/register", r.AppsApi.AppsRegister)   // 应用注册
			appsRouter.GET("/register", r.AppsApi.AppsRegisterList)   // 应用注册列表
			appsRouter.GET("/pass-id/repeat", r.AppsApi.PassIDRepeat) // 检查系统标识是否重复
		}
		// 省直达上报
		{
			appsRouter := configurationCenterRouter.Group("/province-apps")
			appsRouter.GET("", r.AppsApi.ReportAppsList)                  // 获取上报列表
			appsRouter.PUT("/report", r.AppsApi.Report)                   // 上报应用系统
			appsRouter.PUT("/:id/report-audit/cancel", r.AppsApi.Cancel)  // 上报撤回
			appsRouter.GET("/report-audit", r.AppsApi.GetReportAuditList) // 查询审核列表接口
		}
		//proton 应用
		{
			userManagementApps := configurationCenterRouter.Group("/user-management/apps")
			userManagementApps.GET("", r.AppsApi.UserManagementAppsList) // 获取proton应用列表
		}

		{
			dictRouter := configurationCenterRouter.Group("/dict")
			dictRouter.POST("/update-dict-item", r.DictApi.UpdateDictAndItem)                                         //编辑数据字典和字典值
			dictRouter.POST("/create-dict-item", r.DictApi.CreateDictAndItem)                                         //新增数据字典和字典值
			dictRouter.DELETE("/delete-dict-item/:id", r.DictApi.DeleteDictAndItem)                                   // 删除数据字典和字典值
			configurationCenterRouter.GET("/dict/detail/:id", r.DictApi.GetDictDetail)                                //查询字典详情及字典项列表（编辑前查询）
			configurationCenterRouter.GET("/dict/page", r.DictApi.QueryDictPage)                                      //查询字典分页
			configurationCenterRouter.GET("/dict/get-dict-item-type-list", r.DictApi.GetDictItemTypeList)             //查询字典值的类型和值列表
			configurationCenterRouter.GET("/dict/list", r.DictApi.GetDictList)                                        //查询字典列表
			configurationCenterRouter.GET("/dict/get-dict-item-type", r.DictApi.GetDictItemByType)                    //根据字典类型查询字典值列表
			configurationCenterRouter.GET("/dict/getId/:id", r.DictApi.GetDictById)                                   //查询字典详情
			configurationCenterRouter.GET("/dict/dict-item-page", r.DictApi.QueryDictItemPage)                        //查询字典项分页
			configurationCenterInternalRouter.GET("/dict/get-dict-item-type", r.DictApi.GetDictItemByType)            // 内部接口，根据字典类型查询字典值列表
			configurationCenterInternalRouter.POST("/dict/batch-check-type-key", r.DictApi.BatchCheckNotExistTypeKey) // 内部接口，校验不存在的类型
		}

		// 厂商管理
		{
			firmRouter := configurationCenterRouter.Group("/firm")
			firmRouter.POST("", r.FirmApi.Create)                     // 厂商创建接口
			firmRouter.POST("/import", r.FirmApi.Import)              // 厂商导入接口
			firmRouter.PUT("/:firm_id", r.FirmApi.Update)             // 厂商编辑接口
			firmRouter.DELETE("", r.FirmApi.Delete)                   // 厂商删除接口
			configurationCenterRouter.GET("/firm", r.FirmApi.GetList) // 厂商列表接口
			firmRouter.GET("/uniqueCheck", r.FirmApi.UniqueCheck)     // 厂商管理唯一性校验接口
		}
		// 前置机
		{
			g := configurationCenterRouter.Group("/front-end-processors")
			// 创建前置机
			g.POST("", r.Middleware.AccessControl(access_control.FrontEndProcessor), r.FrontEndProcessor.Create)
			// 查看申请的前置机详情
			g.GET("/:id/detail", r.FrontEndProcessor.GetDetails)
			// 获取前置机列表，前置机申请的审核员需要获取前置机，而审核员所拥有
			// 的角色没有保证，所以允许任意角色获取前置机。
			g.GET("", r.FrontEndProcessor.List)
			// 删除前置机
			g.DELETE("/:id", r.Middleware.AccessControl(access_control.FrontEndProcessor), r.FrontEndProcessor.Delete)
			// 更新前置机申请
			g.PUT("/:id/request", r.Middleware.AccessControl(access_control.FrontEndProcessorRequest), r.FrontEndProcessor.UpdateRequest)
			// 分配前置机节点
			g.PUT("/:id/node", r.Middleware.AccessControl(access_control.FrontEndProcessorNode), r.FrontEndProcessor.AllocateNodeNew)
			// 签收前置机
			g.PUT("/:id/receipt", r.Middleware.AccessControl(access_control.FrontEndProcessorReceipt), r.FrontEndProcessor.Receipt)
			//签收驳回
			g.PUT("/:id/reject", r.Middleware.AccessControl(access_control.FrontEndProcessorReceipt), r.FrontEndProcessor.Reject)
			// 回收前置机
			g.PUT("/:id/reclaim", r.Middleware.AccessControl(access_control.FrontEndProcessorReclaim), r.FrontEndProcessor.Reclaim)
			// 撤销审核
			g.PUT("/:id/cancel-audit", r.FrontEndProcessor.Cancel)

			// 获取前置机，前置机申请的审核员需要获取前置机，而审核员所拥有的角
			// 色没有保证，所以允许任意角色获取前置机。
			g.GET("/:id", r.FrontEndProcessor.Get)
			// 审核列表查询接口
			g.GET("/apply-audit", r.FrontEndProcessor.GetApplyAuditList)
			// 获取前置机申请列表
			g.GET("/front-end-item-list", r.FrontEndProcessor.GetApplyList)
			// 获取前置机概览
			configurationCenterRouter.GET("front-end-processors-overview", r.FrontEndProcessor.GetOverView)
		}

		{
			//configurationCenterRouter.GET("/login/menus", r.MenuApi.GetMenus)                  //登录获取菜单
			configurationCenterRouter.GET("/menus", r.MenuApi.GetMenus)                        //获取菜单
			configurationCenterNoOauthRouter.GET("/resource/menus", r.MenuApi.PermissionMenus) //获取菜单
			configurationCenterRouter.POST("/menus", r.MenuApi.SetMenus)                       //设置菜单
			configurationCenterInternalRouter.GET("/menus", r.MenuApi.GetAllMenus)             //获取菜单
		}

		// 通讯录管理
		{
			addressBookRouter := configurationCenterRouter.Group("/address-book")
			addressBookRouter.POST("", r.AddressBookApi.Create)        // 新建人员信息
			addressBookRouter.POST("/import", r.AddressBookApi.Import) // 导入人员信息
			addressBookRouter.PUT("/:id", r.AddressBookApi.Update)     // 编辑人员信息
			addressBookRouter.DELETE("/:id", r.AddressBookApi.Delete)  // 删除人员信息
			addressBookRouter.GET("", r.AddressBookApi.GetList)        // 人员信息列表
		}

		// 告警规则
		{
			alarmRuleRouter := configurationCenterRouter.Group("/alarm-rule")
			alarmRuleRouter.GET("", r.AlarmRuleApi.GetList)                                      // 告警规则列表
			alarmRuleRouter.PUT("", r.AlarmRuleApi.Update)                                       // 编辑告警规则
			configurationCenterInternalRouter.GET("/alarm-rule", r.AlarmRuleApi.InternalGetList) // 告警规则列表
		}
		// 轮播图管理
		{
			carouselsRouter := configurationCenterRouter.Group("/carousels")
			carouselsRouter.POST("", r.CarouselsApi.Upload)
			carouselsRouter.DELETE("/:id", r.CarouselsApi.Delete)
			carouselsRouter.GET("", r.CarouselsApi.Get)
			carouselsRouter.PUT("/interval", r.CarouselsApi.UpdateInterval)
			carouselsRouter.GET("/oss/:id", r.CarouselsApi.GetOSSFile)
			carouselsRouter.PUT("/:id/replace", r.CarouselsApi.Replace)
			carouselsRouter.GET("/preview/:id", r.CarouselsApi.Preview)
			carouselsRouter.POST("/:id/:type/upload-case", r.CarouselsApi.UploadCase)
			carouselsRouter.PUT("/:id/:application_example_id/:type/update-case", r.CarouselsApi.UpdateCase)
			carouselsRouter.PUT("/update-case-state", r.CarouselsApi.UpdateCaseState)
			carouselsRouter.GET("/get-by-case-name", r.CarouselsApi.GetByCaseName)
			carouselsRouter.DELETE("/delete-case/:id", r.CarouselsApi.DeleteCase)
			carouselsRouter.PUT("/update-top", r.CarouselsApi.UpdateTop)
			carouselsRouter.PUT("/update-sort", r.CarouselsApi.UpdateSort)
		}
		// 新闻动态与政策依据
		{
			newsPolicyRouter := configurationCenterRouter.Group("/news-policy")
			newsPolicyRouter.POST("", r.NewsPolicyApi.Create)
			newsPolicyRouter.PUT("/:id", r.NewsPolicyApi.Update)
			newsPolicyRouter.DELETE("/:id", r.NewsPolicyApi.Delete)
			newsPolicyRouter.GET("", r.NewsPolicyApi.List)
			newsPolicyRouter.GET("/oss/:id", r.NewsPolicyApi.GetOSSFile)
			newsPolicyRouter.POST("/detail", r.NewsPolicyApi.Detail)
			newsPolicyRouter.PUT("/state", r.NewsPolicyApi.UpdateStatus)

			newsPolicyRouter.GET("/list", r.NewsPolicyApi.HelpDocumentList)
			newsPolicyRouter.POST("/create", r.NewsPolicyApi.CreateHelpDocument)
			newsPolicyRouter.PUT("/update/:id", r.NewsPolicyApi.UpdateHelpDocument)
			newsPolicyRouter.DELETE("/delete/:id", r.NewsPolicyApi.DeleteHelpDocument)
			newsPolicyRouter.GET("/document/detail", r.NewsPolicyApi.GetHelpDocumentDetail)
			newsPolicyRouter.GET("/preview/:id", r.NewsPolicyApi.Preview)
			newsPolicyRouter.PUT("/update", r.NewsPolicyApi.UpdateHelpDocumentStatus)
			newsPolicyRouter.GET("/file/:id", r.NewsPolicyApi.GetOSSPreviewFile)
		}

		// 负责人注册
		{
			registerRouter := configurationCenterRouter.Group("/user/register")
			registerRouter.POST("/create", r.RegistrationsApi.RegisterUser)
			registerRouter.GET("/list", r.RegistrationsApi.GetRegisterInfo)
			registerRouter.GET("/user-list", r.RegistrationsApi.GetUserInfo)
			registerRouter.GET("/unique", r.RegistrationsApi.UserUnique)
			registerRouter.GET("/:id/detail", r.RegistrationsApi.GetUserDetail)
		}
		//机构注册
		{
			registerRouter := configurationCenterRouter.Group("/organization/register")
			registerRouter.POST("/create", r.RegistrationsApi.OrganizationRegister)
			registerRouter.PUT("/update/:id", r.RegistrationsApi.EditRegister)
			registerRouter.GET("/list", r.RegistrationsApi.OrganizationList)
			registerRouter.GET("/unique", r.RegistrationsApi.IsOrganizationRegistered)
			registerRouter.GET("/:id/detail", r.RegistrationsApi.GetOrganizationInfo)
		}
		// 业务事项管理
		{
			businessMattersRouter := configurationCenterRouter.Group("/business_matters")
			businessMattersRouter.POST("", r.BusinessMattersApi.CreateBusinessMatters)                              //创建业务事项
			businessMattersRouter.PUT("/:id", r.BusinessMattersApi.UpdateBusinessMatters)                           //更新业务事项
			businessMattersRouter.DELETE("/:id", r.BusinessMattersApi.DeleteBusinessMatters)                        //删除业务事项
			businessMattersRouter.GET("", r.BusinessMattersApi.GetBusinessMattersList)                              //查询业务事项列表
			businessMattersRouter.GET("/name-check", r.BusinessMattersApi.GetBusinessMattersNameRepeat)             //查询业务事项列名称是否重复
			configurationCenterInternalRouter.GET("/business_matters/list/:ids", r.BusinessMattersApi.GetListByIds) // 内部接口，根据id批量查查询业务事项基本信息
		}
		// 审核策略
		{
			auditPolicyRouter := configurationCenterRouter.Group("/audit_policy")
			auditPolicyRouter.POST("", r.AuditPolicysApi.Create)                                                                        // 创建审核策略
			auditPolicyRouter.PUT("/:id", r.AuditPolicysApi.Update)                                                                     // 更新审核策略
			auditPolicyRouter.PUT("/:id/status", r.AuditPolicysApi.UpdateStatus)                                                        // 更新审核策略状态
			auditPolicyRouter.DELETE("/:id", r.AuditPolicysApi.Delete)                                                                  // 删除审核策略
			auditPolicyRouter.GET("/:id", r.AuditPolicysApi.GetById)                                                                    // 查看审核策略详情
			auditPolicyRouter.GET("", r.AuditPolicysApi.List)                                                                           // 查看审核策略列表
			auditPolicyRouter.GET("/name-check", r.AuditPolicysApi.IsNameRepeat)                                                        // 检查审核策略名称是否重复
			auditPolicyRouter.GET("/resources/:ids", r.AuditPolicysApi.GetAuditPolicyByResourceIds)                                     // 根据资源id合集批量获取是否有审核策略（前端适配显示申请权限按钮）
			configurationCenterInternalRouter.GET("/audit_policy/resource/:id/audit-process", r.AuditPolicysApi.GetResourceAuditPolicy) // 根据资源id获取审核策略信息（内部接口auth-service适配）
		}

		// 短信推送配置
		{
			smsConfRouter := configurationCenterRouter.Group("/sms-conf")
			smsConfRouter.GET("", r.SMSConfApi.GetSMSConf)    // 短信推送配置查询
			smsConfRouter.PUT("", r.SMSConfApi.UpdateSMSConf) // 编辑短信推送配置
		}
	}
}
