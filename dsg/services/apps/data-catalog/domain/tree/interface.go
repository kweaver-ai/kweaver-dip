package tree

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type UseCase interface {
	Create(ctx context.Context, req *CreateReqParam) (*CreateRespParam, error)
	Delete(ctx context.Context, req *IDPathParam) (*DeleteRespParam, error)
	Edit(ctx context.Context, req *EditReqParam) (*EditRespParam, error)
	List(ctx context.Context, req *ListReqParam) (*ListRespParam, error)
	Get(ctx context.Context, req *IDPathParam) (*GetRespParam, error)
	NameExistCheck(ctx context.Context, req *NameExistReqParam) (*NameExistRespParam, error)
}

/////////////////// Common ///////////////////

type IDPathParam struct {
	ID models.ModelID `json:"id" uri:"tree_id" binding:"required,VerifyModelID" example:"1"` // Tree ID
}

/////////////////// Create ///////////////////

type CreateReqParam struct {
	Name *string `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"tree_name"` // Tree名称
}

func (c *CreateReqParam) ToModel(userId models.UserID) *model.TreeInfo {
	return &model.TreeInfo{
		Name:         *c.Name,
		CreatedByUID: userId,
		UpdatedByUID: userId,
	}
}

type CreateRespParam struct {
	response.IDResp
}

/////////////////// Delete ///////////////////

type DeleteRespParam struct {
	response.IDResp
}

/////////////////// Edit ///////////////////

type EditReqParam struct {
	IDPathParam
	EditReqBodyParam
}

func (e *EditReqParam) ToModel(userID models.UserID) *model.TreeInfo {
	return &model.TreeInfo{
		ID:           e.ID,
		Name:         *e.Name,
		UpdatedByUID: userID,
	}
}

type EditReqBodyParam struct {
	Name *string `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"tree_name"` // Tree名称
}

type EditRespParam struct {
	response.IDResp
}

/////////////////// List ///////////////////

type ListReqParam struct {
	request.PageInfoWithKeyword
}

type ListRespParam struct {
	response.PageResult[SummaryInfo]
}

func NewListRespParam(models []*model.TreeInfo, total int64) *ListRespParam {
	entries := make([]*SummaryInfo, 0, len(models))
	for _, m := range models {
		entries = append(entries, &SummaryInfo{
			IDResp: response.IDResp{
				ID: m.ID,
			},
			Name:       m.Name,
			RootNodeID: m.RootNodeID,
		})
	}

	return &ListRespParam{
		PageResult: response.PageResult[SummaryInfo]{
			Entries:    entries,
			TotalCount: total,
		},
	}
}

type SummaryInfo struct {
	response.IDResp
	Name       string         `json:"name" binding:"required,min=1,max=128" example:"tree_name"` // Tree名称
	RootNodeID models.ModelID `json:"root_node_id" binding:"required,VerifyModelID" example:"1"` // Tree根节点ID
}

/////////////////// Get ///////////////////

type GetRespParam struct {
	SummaryInfo
	response.CreateUpdateUserAndTime
}

func NewGetRespParam(m *model.TreeInfo, createUserName, updateUserName string) *GetRespParam {
	return &GetRespParam{
		SummaryInfo: SummaryInfo{
			IDResp: response.IDResp{
				ID: m.ID,
			},
			Name:       m.Name,
			RootNodeID: m.RootNodeID,
		},
		CreateUpdateUserAndTime: response.NewCreateUpdateUserAndTime(createUserName, updateUserName, m.CreatedAt, m.UpdatedAt),
	}
}

/////////////////// NameExistCheck ///////////////////

type NameExistReqParam struct {
	Name  *string         `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"tree_name"` // Tree名称
	CurID *models.ModelID `json:"cur_id" binding:"omitempty,VerifyModelID" example:"1"`                           // 当前在修改的TreeID
}

type NameExistRespParam struct {
	response.CheckRepeatResp
}
