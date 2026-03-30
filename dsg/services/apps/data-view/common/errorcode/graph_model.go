package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx"
)

var (
	publicModule     = errorx.New(constant.ServiceName + ".Public.")
	graphModelModule = errorx.New(constant.ServiceName + ".GraphModel.")
)
var (
	PublicQueryProjectError     = publicModule.Description("QueryProjectError", "项目不存在或查询项目信息错误")
	PublicQueryDepartmentError  = publicModule.Description("QueryDepartmentErrors", "部门不存在或查询部门信息错误")
	PublicQueryRoleError        = publicModule.Description("QueryRoleError", "查询用户角色服务错误")
	PublicQueryDataCatalogError = publicModule.Description("QueryDataCatalogError", "查询目录服务错误")
	PublicQueryDataViewError    = publicModule.Description("QueryDataViewError", "查询视图服务错误")
	PublicQueryDataSubjectError = publicModule.Description("QueryDataSubjectError", "查询业务对象服务错误")
	PublicDatabaseErr           = publicModule.Description("DatabaseError", "数据库异常")
	PublicQueryUserInfoError    = publicModule.Description("QueryUserInfoError", "查询用户信息错误")
	PublicInternalError         = publicModule.Description("InternalError", "内部错误")
	PublicResourceNotFoundError = publicModule.Description("ResourceNotFound", "资源不存在")
)

var (
	GraphModelFieldError                 = graphModelModule.Description("FieldError", "元模型字段不存在或不匹配")
	GraphModelBusinessNameExistError     = graphModelModule.Description("BusinessNameExistError", "业务名称已经存在")
	GraphModelTechnicalNameExistError    = graphModelModule.Description("TechnicalNameExistError", "技术名称已经存在")
	GraphModelSubjectNotExistError       = graphModelModule.Description("SubjectNotExistError", "业务对象不存在")
	GraphModelCannotModifyError          = graphModelModule.Description("ModelCannotModifyError", "模型不能修改")
	GraphModelRelationLinkRepeatError    = graphModelModule.Description("RelationLinkRepeatError", "模型关系中存在重复的起点和终点")
	GraphModelRelationRepeatError        = graphModelModule.Description("RelationRepeatError", "模型中存在重复关系")
	GraphModelNotExistError              = graphModelModule.Description("ModelNotExistError", "模型关系中起点或终点不存在")
	GraphModelDisplayFieldNotExistError  = graphModelModule.Description("DisplayFieldNotExistError", "模型显示字段不存在")
	GraphModelRelationFieldNotExistError = graphModelModule.Description("RelationFieldNotExistError", "模型关系字段不存在")
	GraphModelModelFieldNotExistError    = graphModelModule.Description("ModelFieldNotExistError", "存在模型中字段为空")
	GraphModelModeMissingPrimaryKeyError = graphModelModule.Description("MissingPrimaryKeyError", "元模型字段缺少主键")
	GraphModelDeleteGraphError           = graphModelModule.Description("DeleteGraphError", "删除模型错误")
	GraphModelCannotDeletedError         = graphModelModule.Description("CannotDeletedError", "该元模型已经被引用，不能删除")
)
