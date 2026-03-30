package role_v2

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/kweaver-ai/idrm-go-common/rest/base"
)

type UseCase interface {
	//Detail 角色详情，不过也没多少东西
	Detail(ctx context.Context, rid string) (*authorization.RoleDetail, error)
	//Query  分页查询角色信息
	Query(ctx context.Context, args *ListArgs) (res *base.PageResult[authorization.RoleDetail], err error)
	//RoleUsers 查询角色下用户
	RoleUsers(ctx context.Context, args *UserRolePageArgs) (*base.PageResult[authorization.MemberInfo], error)
	//UserRoles  查询用户角色
	UserRoles(ctx context.Context) (roles []*authorization.RoleMetaInfo, err error)
}

type UriReqParamRId struct {
	RId *string `json:"rid,omitempty" uri:"rid" binding:"required,uuid" example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` // 角色ID，uuid
}

type ListArgs struct {
	Offset  *int   `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`          // 页码，默认1
	Limit   *int   `json:"limit" form:"limit,default=20" binding:"omitempty,min=1,max=2000" default:"20"` // 每页大小，默认20, 最大100
	Keyword string `json:"keyword"  form:"keyword" binding:"TrimSpace,omitempty,min=1"`                   //搜索内容, 即角色名
	//Source 角色来源:
	//- system 系统
	//- business 业务内置
	//- user 用户自定义
	//返回结果默认按照system、business、user 顺序排序
	//参数不传时默认返回business、user
	Source string `json:"source" form:"source,default=business" binding:"omitempty,oneof=system business user"`
}

type UserRolePageArgs struct {
	UriReqParamRId
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                             // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=20" binding:"omitempty,min=1,max=2000" default:"20"`                    // 每页大小，默认20, 最大100
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`        // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at" default:"created_at"`    // 排序类型，枚举：created_at：按创建时间排序;默认按创建时间排序
	Type      *string `json:"type" form:"type,default=user" binding:"omitempty,oneof=user department group app" default:"user"` // 成员类型
	Keyword   string  `json:"keyword"  form:"keyword" binding:"TrimSpace,omitempty,min=1"`                                      // 搜索内容，搜索内容, 即成员名称
}
