package v1

import (
	"context"

	gradeRuleRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule_group"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	gradeRuleDomain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule_group"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type gradeRuleGroupUseCase struct {
	repo          repo.GradeRuleGroupRepo
	gradeRuleRepo gradeRuleRepo.GradeRuleRepo
}

func NewGradeRuleGroupUseCase(
	repo repo.GradeRuleGroupRepo,
	gradeRuleRepo gradeRuleRepo.GradeRuleRepo,
) domain.GradeRuleGroupUseCase {
	return &gradeRuleGroupUseCase{
		repo:          repo,
		gradeRuleRepo: gradeRuleRepo,
	}
}

func (f *gradeRuleGroupUseCase) List(ctx context.Context, req *domain.GradeRuleGroupListReq) (*domain.GradeRuleGroupListResp, error) {
	list, err := f.repo.List(ctx, req.BusinessObjectID)
	if err != nil {
		return nil, err
	}

	res := make([]*domain.GradeRuleGroup, 0, len(list))
	for _, item := range list {
		res = append(res, &domain.GradeRuleGroup{
			ID:               item.ID,
			Name:             item.Name,
			Description:      item.Description,
			BusinessObjectID: item.BusinessObjectID,
			CreatedAt:        item.CreatedAt.Unix(),
			UpdatedAt:        item.UpdatedAt.Unix(),
		})
	}

	return &domain.GradeRuleGroupListResp{
		PageResultNew: domain.PageResultNew[domain.GradeRuleGroup]{
			Entries:    res,
			TotalCount: int64(len(res)),
		},
	}, nil
}

func (f *gradeRuleGroupUseCase) Create(ctx context.Context, req *domain.GradeRuleGroupCreateReq) (*domain.GradeRuleGroupCreateResp, error) {
	// 校验组名是否存在
	repeat, err := f.repo.Repeat(ctx, req.BusinessObjectID, "", req.Name)
	if err != nil {
		return nil, err
	}
	if repeat {
		return nil, errorcode.Detail(errorcode.GradeRuleGroupIsExist, "规则组名称已存在")
	}

	// 数量上限检查
	limited, err := f.repo.Limited(ctx, req.BusinessObjectID, 10)
	if err != nil {
		return nil, err
	}
	if limited {
		return nil, errorcode.Detail(errorcode.GradeRuleGroupCountLimit, "规则组数量超过上限")
	}

	data := &model.GradeRuleGroup{
		Name:             req.Name,
		BusinessObjectID: req.BusinessObjectID,
		Description:      req.Description,
	}

	id, err := f.repo.Create(ctx, data)
	if err != nil {
		return nil, err
	}

	return &domain.GradeRuleGroupCreateResp{
		ID: id,
	}, nil
}

func (f *gradeRuleGroupUseCase) Update(ctx context.Context, req *domain.GradeRuleGroupUpdateReq) (*domain.GradeRuleGroupUpdateResp, error) {
	// 校验组名是否存在
	details, err := f.repo.Details(ctx, []string{req.ID})
	if err != nil {
		return nil, err
	}
	if len(details) == 0 {
		return nil, errorcode.Detail(errorcode.GradeRuleGroupNotFound, "规则组不存在")
	}

	repeat, err := f.repo.Repeat(ctx, details[0].BusinessObjectID, req.ID, req.Name)
	if err != nil {
		return nil, err
	}
	if repeat {
		return nil, errorcode.Detail(errorcode.GradeRuleGroupIsExist, "规则组名称已存在")
	}

	data := &model.GradeRuleGroup{
		ID:          req.ID,
		Name:        req.Name,
		Description: req.Description,
	}

	err = f.repo.Update(ctx, data)
	if err != nil {
		return nil, err
	}

	return &domain.GradeRuleGroupUpdateResp{
		ID: req.ID,
	}, nil
}

func (f *gradeRuleGroupUseCase) Delete(ctx context.Context, req *domain.GradeRuleGroupDeleteReq) (*domain.GradeRuleGroupDeleteResp, error) {
	details, err := f.repo.Details(ctx, []string{req.ID})
	if err != nil {
		return nil, err
	}
	if len(details) == 0 {
		return nil, errorcode.Detail(errorcode.GradeRuleGroupNotFound, "规则组不存在")
	}

	// 检查当前规则组下是否有自定义规则，如果有不允许删除
	total, _, err := f.gradeRuleRepo.PageList(ctx, &gradeRuleDomain.PageListGradeRuleReq{
		PageListGradeRuleReqQueryParam: gradeRuleDomain.PageListGradeRuleReqQueryParam{
			SubjectID: details[0].BusinessObjectID,
			GroupID:   &req.ID,
		},
	})
	if err != nil {
		return nil, err
	}
	if total > 0 {
		return nil, errorcode.Detail(errorcode.GradeRuleGroupDeleteNotAllowed, "规则组存在规则，不允许删除")
	}

	err = f.repo.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &domain.GradeRuleGroupDeleteResp{
		ID: req.ID,
	}, nil
}

func (f *gradeRuleGroupUseCase) Repeat(ctx context.Context, req *domain.GradeRuleGroupRepeatReq) (*domain.GradeRuleGroupRepeatResp, error) {
	repeat, err := f.repo.Repeat(ctx, req.BusinessObjectID, req.ID, req.Name)
	if err != nil {
		return nil, err
	}
	return &domain.GradeRuleGroupRepeatResp{
		Repeat: repeat,
	}, nil
}

func (f *gradeRuleGroupUseCase) Limited(ctx context.Context, req *domain.GradeRuleGroupLimitedReq) (*domain.GradeRuleGroupLimitedResp, error) {
	limited, err := f.repo.Limited(ctx, req.BusinessObjectID, 10)
	if err != nil {
		return nil, err
	}
	return &domain.GradeRuleGroupLimitedResp{
		Limited: limited,
	}, nil
}
