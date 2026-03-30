/*
 * @Author: David.chen David.chen02@KweaverAI.cn
 * @Date: 2023-06-12 10:08:46
 * @LastEditors: David.chen David.chen02@KweaverAI.cn
 * @LastEditTime: 2023-08-18 16:25:44
 * @FilePath: /data-catalog/common/models/request/request.go
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package request

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"

	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
)

type PageInfo struct {
	PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc" example:"desc"`                      // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at" default:"created_at" example:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type BOPageInfo struct {
	PageBaseInfo
	Direction *string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`     // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=updated_at" binding:"oneof=updated_at" default:"updated_at"` // 排序类型，枚举：updated_at：按更新时间排序。默认按创建时间排序
}

type PageBaseInfo struct {
	Offset *int `json:"offset" form:"offset,default=1" binding:"min=1" default:"1" example:"1"`          // 页码，默认1
	Limit  *int `json:"limit" form:"limit,default=10" binding:"min=0,max=2000" default:"10" example:"2"` // 每页大小，默认10 limit=0不分页
}

func (p PageBaseInfo) OffsetNumber() int {
	return *p.Limit * (*p.Offset - 1)
}

type KeywordInfo struct {
	Keyword string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=255" example:"keyword"` // 关键字查询
}

type PageInfoWithKeyword struct {
	PageInfo
	KeywordInfo
}

// CatalogColumnsQueryReq 请求字段列表入参
type CatalogColumnsQueryReq struct {
	KeywordInfo
	PageBaseInfo
}

type VerifyNameRepeatReq struct {
	Code string `json:"code" form:"code" binding:"omitempty,min=1"`
	Name string `json:"name" form:"name" binding:"required,VerifyNameStandard"`
}

type CatalogListReqBase struct {
	Keyword          string `form:"keyword" binding:"omitempty,TrimSpace"`
	State            int8   `form:"state" binding:"omitempty,oneof=1 3 5 8"` // 目录状态，1 草稿  3 已发布  5 已上线  8 已下线
	ResType          int8   `form:"res_type" binding:"omitempty,min=1,max=2"`
	DataKind         int32  `form:"data_kind" binding:"omitempty,min=1,max=32"`
	SharedType       int8   `form:"shared_type" binding:"omitempty,oneof=1 2 3"`    // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	OrgCode          string `form:"orgcode" binding:"omitempty,uuid"`               // 所属部门ID
	CategoryID       string `form:"categoryID" binding:"omitempty,min=1"`           // 目录分类ID
	BusinessDomainID string `form:"business_domain_id" binding:"omitempty,uuid"`    // 业务域ID
	OwnerID          string `form:"owner_id" binding:"omitempty,uuid"`              // 目录数据owner的用户ID
	FlowType         int8   `form:"flow_type" binding:"omitempty,oneof=-1 1 3 4"`   // 审批流程类型，-1 无审核类型  1 上线  2 变更  3 下线  4 发布
	AuditState       int8   `form:"audit_state" binding:"omitempty,oneof=-1 1 2 3"` // 审核状态，-1 无审核状态  1 审核中  2 通过  3 驳回

	ComprehensionStatus     string `form:"comprehension_status" binding:"omitempty"`       // 理解状态,逗号分隔，支持多个状态查询
	TaskId                  string `form:"task_id"  binding:"omitempty"`                   // 根据方法查询方法内的数据编目
	NeedOrgPaths            bool   `form:"need_org_paths" binding:"omitempty"`             // 是否需要部门路径列表
	NeedBusinessObjectPaths bool   `form:"need_business_object_paths" binding:"omitempty"` // 是否需要业务对象路径列表

	ExcludeIds []models.ModelID `form:"exclude_ids[]" binding:"omitempty"` // 被排除的目录id
}

type BusinessObjectListReqBase struct {
	Keyword          string `form:"keyword" binding:"TrimSpace,omitempty,min=1,max=255"`
	OrgCode          string `form:"department_id" binding:"omitempty,uuid"` // 所属部门ID
	SystemID         string `form:"system_id" binding:"omitempty,uuid"`     // 关联系统ID
	BusinessDomainID string `form:"business_id" binding:"omitempty,uuid"`   // 业务域ID
}

type DepInfo struct {
	OrgCode string `json:"org_code"`
	OrgName string `json:"org_name"`
}

type UserInfo struct {
	Uid      string     `json:"uid"`
	UserName string     `json:"user_name"`
	OrgInfos []*DepInfo `json:"org_info"`
}

func (u *UserInfo) GetUId() models.UserID {
	if u == nil {
		return ""
	}

	return models.NewUserID(u.Uid)
}

func GetUserInfo(ctx context.Context) *middleware.User {
	if val := ctx.Value(interception.InfoName); val != nil {
		if ret, ok := val.(*middleware.User); ok {
			return ret
		}
	}
	return nil
}
