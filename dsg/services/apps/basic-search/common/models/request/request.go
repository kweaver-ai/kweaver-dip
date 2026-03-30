package request

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/constant"
)

type PageInfo struct {
	Offset    *int    `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`                                     // 页码，默认1
	Limit     *int    `json:"limit" form:"limit,default=15" binding:"omitempty,min=1,max=100" default:"15"`                             // 每页大小，默认15
	Direction *string `json:"direction" form:"direction,default=desc" binding:"omitempty,oneof=asc desc" default:"desc"`                // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      *string `json:"sort" form:"sort,default=created_at" binding:"omitempty,oneof=created_at updated_at" default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
}

type KeywordInfo struct {
	Keyword string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"` // 关键字查询，字符无限制
}

type PageInfoWithKeyword struct {
	PageInfo
	KeywordInfo
}

type VerifyNameRepeatReq struct {
	Code string `json:"code" form:"code" binding:"omitempty,min=1"`
	Name string `json:"name" form:"name" binding:"required,VerifyNameStandard"`
}

type CatalogListReqBase struct {
	Keyword    string `form:"keyword" binding:"omitempty,TrimSpace"`
	State      int8   `form:"state" binding:"omitempty,min=1,max=5"`
	ResType    int8   `form:"res_type" binding:"omitempty,min=1,max=2"`
	DataKind   int32  `form:"data_kind" binding:"omitempty,min=1,max=32"`
	SharedType int8   `form:"shared_type" binding:"omitempty,oneof=1 2 3"` // 共享属性 1 无条件共享 2 有条件共享 3 不予共享
	OrgCode    string `form:"orgcode" binding:"omitempty,min=1"`           // 所属部门ID
	CategoryID string `form:"categoryID" binding:"omitempty,min=1"`        // 目录分类ID
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

func GetUserInfo(ctx context.Context) *UserInfo {
	if val := ctx.Value(constant.UserInfoContextKey); val != nil {
		if ret, ok := val.(*UserInfo); ok {
			return ret
		}
	}
	return nil
}
