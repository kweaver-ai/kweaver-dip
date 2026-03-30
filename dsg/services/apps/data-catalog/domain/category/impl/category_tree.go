package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	MaxLayers = 5
)

type useTreeCase struct {
	repo  category.TreeRepo
	crepo category.Repo
}

func NewUseTreeCase(repo category.TreeRepo, crepo category.Repo) domain.UseCaseTree {
	return &useTreeCase{repo: repo, crepo: crepo}
}

// Add 在父节点的子节点列表的首部添加新的子节点
func (u *useTreeCase) Add(ctx context.Context, req *domain.AddTreeReqParama) (*domain.TreeRespParam, error) {

	// 类目的存在性检测
	if err := u.existByCategoryIDDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	// 类目树节点存在性检测
	if err := u.existByNodeIDDie(ctx, req.CategoryID, req.ParentID); err != nil {
		return nil, err
	}

	// name重复检测
	if err := u.existByNameDie(ctx, req.Name, req.ParentID, "", req.CategoryID); err != nil {
		return nil, err
	}

	userInfo := request.GetUserInfo(ctx)
	m := req.ToModel(userInfo)
	m.CategoryNodeID = genCategoryNum()
	if err := u.repo.Create(ctx, m, MaxLayers); err != nil {
		return nil, err
	}

	return &domain.TreeRespParam{
		ID: m.CategoryNodeID,
	}, nil
}

// Delete 删除一类目树节点
func (u *useTreeCase) Delete(ctx context.Context, req *domain.DeleteTreeReqParam) (*domain.TreeRespParam, error) {

	// 系统类目不可以修改
	for _, categoryID := range SystemCategorysId {
		if categoryID == req.CategoryID {
			return nil, errorcode.Desc(errorcode.CategorySystemEdit)
		}
	}

	// 类目的存在性检测
	if err := u.existByCategoryIDDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	// 类目树节点存在性检测
	if err := u.existByNodeIDDie(ctx, req.CategoryID, req.NodeID); err != nil {
		return nil, err
	}

	userInfo := request.GetUserInfo(ctx)
	updaterUID := userInfo.ID
	updaterName := userInfo.Name

	exist, err := u.repo.Delete(ctx, req.CategoryID, req.NodeID, updaterUID, updaterName)
	if err != nil {
		return nil, err
	}

	resp := &domain.TreeRespParam{}
	if exist {
		resp.ID = req.NodeID
	}

	return resp, nil
}

// Edit 编辑类目树节点基本信息(名称和owner)
func (u *useTreeCase) Edit(ctx context.Context, req *domain.EditTreeReqParam) (*domain.TreeRespParam, error) {
	// 系统类目不可以修改
	for _, categoryID := range SystemCategorysId {
		if categoryID == req.CategoryID {
			return nil, errorcode.Desc(errorcode.CategorySystemEdit)
		}
	}

	// 类目的存在性检测
	if err := u.existByCategoryIDDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	// 类目树节点存在性检测
	if err := u.existByNodeIDDie(ctx, req.CategoryID, req.NodeID); err != nil {
		return nil, err
	}

	// 检查名称是否同名
	parentId, err := u.repo.GetParentID(ctx, req.NodeID)
	if err != nil {
		return nil, err
	}

	if err := u.existByNameDie(ctx, req.Name, parentId, req.NodeID, req.CategoryID); err != nil {
		return nil, err
	}

	userInfo := request.GetUserInfo(ctx)
	m := req.ToModel(userInfo)
	if err := u.repo.UpdateByEdit(ctx, m); err != nil {
		return nil, err
	}

	// 根节点（nodeID == categoryID）允许设置 required；非根节点允许设置 required/selected（若传入）
	if req.NodeID == req.CategoryID {
		if req.Required != nil {
			reqVal := 0
			if *req.Required {
				reqVal = 1
			}
			if err := u.repo.UpdateNodeRequired(ctx, req.CategoryID, req.NodeID, reqVal, userInfo.ID, userInfo.Name); err != nil {
				return nil, err
			}
		}
	} else {
		if req.Required != nil {
			reqVal := 0
			if *req.Required {
				reqVal = 1
			}
			if err := u.repo.UpdateNodeRequired(ctx, req.CategoryID, req.NodeID, reqVal, userInfo.ID, userInfo.Name); err != nil {
				return nil, err
			}
		}
		if req.Selected != nil {
			selectedVal := 0
			if *req.Selected {
				selectedVal = 1
			}
			if err := u.repo.UpdateNodeSelected(ctx, req.NodeID, selectedVal, userInfo.ID, userInfo.Name); err != nil {
				return nil, err
			}
		}
	}

	return &domain.TreeRespParam{
		ID: req.NodeID,
	}, nil
}

// NameExistCheck 类目树名称是否存在检查
func (u *useTreeCase) NameExistCheck(ctx context.Context, req *domain.NameTreeExistReqParam) (*domain.NameExistRespParam, error) {

	// 系统类目不可以修改
	for _, categoryID := range SystemCategorysId {
		if categoryID == req.CategoryID {
			return nil, errorcode.Desc(errorcode.CategorySystemEdit)
		}
	}

	// 类目的存在性检测
	if err := u.existByCategoryIDDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	// 类目树节点存在性检测
	if err := u.existByNodeIDDie(ctx, req.CategoryID, req.ParentID); err != nil {
		return nil, err
	}
	if req.NodeID != "" {
		if err := u.existByNodeIDDie(ctx, req.CategoryID, req.NodeID); err != nil {
			return nil, err
		}
	}

	exist, err := u.repo.ExistByName(ctx, req.Name, req.ParentID, req.NodeID, req.CategoryID)
	if err != nil {
		return nil, err
	}

	return &domain.NameExistRespParam{
		CheckRepeatResp: response.CheckRepeatResp{
			Name:   req.Name,
			Repeat: exist,
		},
	}, nil
}

// Reorder 将指定的节点移动到指定的父节点下的指定子节点前
func (u *useTreeCase) Reorder(ctx context.Context, req *domain.RecoderReqParam) (*domain.CategorRespParam, error) {

	// 类目的存在性检测
	if err := u.existByCategoryIDDie(ctx, req.CategoryID); err != nil {
		return nil, err
	}

	// 类目树节点存在性检测
	if err := u.existByNodeIDDie(ctx, req.CategoryID, req.ID); err != nil {
		return nil, err
	}
	if err := u.existByNodeIDDie(ctx, req.CategoryID, req.DestParentID); err != nil {
		return nil, err
	}
	if req.NextID != "" {
		if err := u.existByNodeIDDie(ctx, req.CategoryID, req.NextID); err != nil {
			return nil, err
		}
	}

	// name重复检测
	nodeInfo, err := u.repo.GetNodeInfoById(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if err := u.existByNameDie(ctx, nodeInfo.Name, req.DestParentID, req.ID, req.CategoryID); err != nil {
		return nil, err
	}

	userInfo := request.GetUserInfo(ctx)
	updaterUID := userInfo.ID
	updaterName := userInfo.Name
	if err := u.repo.Reorder(ctx, models.ModelID(req.ID), models.ModelID(req.DestParentID), models.ModelID(req.NextID), models.ModelID(req.CategoryID), MaxLayers, updaterUID, updaterName); err != nil {
		return nil, err
	}

	return &domain.CategorRespParam{
		ID: req.CategoryID,
	}, nil
}

func (u *useTreeCase) existByNameDie(ctx context.Context, name, parentID, nodeID, categoryID string) error {
	exit, err := u.repo.ExistByName(ctx, name, parentID, nodeID, categoryID)
	if err != nil {
		return err
	}

	if exit {
		log.WithContext(ctx).Errorf("category tree name repeat")
		return errorcode.Desc(errorcode.CategoryNodeNameRepeat)
	}

	return nil
}

func (u *useTreeCase) existByCategoryIDDie(ctx context.Context, categoryID string) error {
	exit, err := u.crepo.ExistByID(ctx, categoryID)
	if err != nil {
		return err
	}

	if !exit {
		log.WithContext(ctx).Errorf("category not exist")
		return errorcode.Desc(errorcode.CategoryNotExist)
	}

	return nil
}

func (u *useTreeCase) existByNodeIDDie(ctx context.Context, categoryID, CategoryNodeID string) error {
	exit, err := u.repo.ExistByID(ctx, CategoryNodeID, categoryID)
	if err != nil {
		return err
	}

	if !exit {
		log.WithContext(ctx).Errorf("category NODE not exist")
		return errorcode.Desc(errorcode.CategoryNodeNotExist)
	}

	return nil
}
