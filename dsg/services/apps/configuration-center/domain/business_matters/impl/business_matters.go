package impl

import (
	"context"
	"strings"

	business_matters_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_matters"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	configuration_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/dict"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/hydra"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_matters"
	user_domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type businessMattersUseCase struct {
	businessMattersRepo     business_matters_repo.BusinessMattersRepo
	user                    user_domain.UseCase
	business_structure_repo business_structure.Repo
	configurationRepo       configuration_repo.Repo
	dictRepo                dict.Repo
}

func NewBusinessMattersUseCase(
	businessMattersRepo business_matters_repo.BusinessMattersRepo,
	hydra hydra.Hydra,
	user user_domain.UseCase,
	business_structure_repo business_structure.Repo,
	configurationRepo configuration_repo.Repo,
	dictRepo dict.Repo,
) business_matters.BusinessMattersUseCase {
	return &businessMattersUseCase{
		businessMattersRepo:     businessMattersRepo,
		user:                    user,
		business_structure_repo: business_structure_repo,
		configurationRepo:       configurationRepo,
		dictRepo:                dictRepo,
	}
}
func (u *businessMattersUseCase) CreateBusinessMatters(ctx context.Context, req *business_matters.CreateReqBody, userInfo *model.User) (*business_matters.ID, error) {
	// 1、检查：名称是否重复、部门是否存在、事务项是否存在
	// 2、入库
	err := u.NameRepeat(ctx, &business_matters.NameRepeatReq{Name: req.Name})
	if err != nil {
		return nil, err
	}

	businessMatter := req.ToModel(*userInfo)
	err = u.businessMattersRepo.Create(ctx, businessMatter)
	if err != nil {
		return nil, err
	}
	return &business_matters.ID{
		Id: businessMatter.BusinessMattersID,
	}, nil
}

func (u *businessMattersUseCase) UpdateBusinessMatters(ctx context.Context, req *business_matters.UpdateReq, userInfo *model.User) (*business_matters.ID, error) {
	// 1、检查：业务事项是否存在、名称是否重复、部门是否存在、事务项是否存在
	// 2、入库
	err := u.NameRepeat(ctx, &business_matters.NameRepeatReq{Name: req.Name, Id: req.Id})
	if err != nil {
		return nil, err
	}
	businessMatterModel, err := u.businessMattersRepo.GetByBusinessMattersId(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	businessMatter := req.ToModel(*userInfo)
	err = u.businessMattersRepo.Update(ctx, req.Id, businessMatter)
	if err != nil {
		return nil, err
	}

	return &business_matters.ID{
		Id: businessMatterModel.BusinessMattersID,
	}, nil
}

func (u *businessMattersUseCase) DeleteBusinessMatters(ctx context.Context, id string) error {
	// 1、检查：业务事项是否存在
	// 2、库删除
	_, err := u.businessMattersRepo.GetByBusinessMattersId(ctx, id)
	if err != nil {
		return err
	}

	err = u.businessMattersRepo.Delete(ctx, id)
	if err != nil {
		return err
	}
	return nil
}

func (u *businessMattersUseCase) NameRepeat(ctx context.Context, req *business_matters.NameRepeatReq) error {
	exist, err := u.businessMattersRepo.NameRepeat(ctx, req.Name, req.Id)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.BusinessMattersExist)
	}
	return nil
}

func (u *businessMattersUseCase) GetBusinessMattersList(ctx context.Context, req *business_matters.ListReqQuery) (*business_matters.ListRes, error) {
	// 判断是不是xx数据局的，如果是从approval_items标准读取，不是从business_matters读取
	isCssjj, err := u.configurationRepo.GetByName(ctx, "cssjj")
	if err != nil {
		log.WithContext(ctx).Error("Get configuration DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if isCssjj[0].Value == "true" {
		return u.listThird(ctx, req)
	}
	return u.listLocal(ctx, req)
}

func (u *businessMattersUseCase) listLocal(ctx context.Context, req *business_matters.ListReqQuery) (*business_matters.ListRes, error) {
	// 判断是不是xx数据局的，如果是从approval_items标准读取，不是从business_matters读取
	var count int64
	var businessMatterses []*model.BusinessMatter
	businessMatterses, count, err := u.businessMattersRepo.List(ctx, req)
	if err != nil {
		return nil, err
	}

	var typeKeys []string
	var departmentIds []string
	for _, businessMatterses := range businessMatterses {
		typeKeys = append(typeKeys, businessMatterses.TypeKey)
		departmentIds = append(departmentIds, businessMatterses.DepartmentID)
	}
	// 获取字典
	TypeKeyMap := make(map[string]string)
	dictItems, err := u.dictRepo.GetDictItemByKeys(ctx, "business-matters-type", typeKeys...)
	if err != nil {
		return nil, err
	}
	for _, dictItem := range dictItems {
		TypeKeyMap[dictItem.FKey] = dictItem.FValue
	}
	// 获取部门
	departmentNameMap := make(map[string]string)
	departmentPathMap := make(map[string]string)
	departments, err := u.business_structure_repo.GetObjectsByIDs(ctx, departmentIds)
	if err != nil {
		return nil, err
	}
	for _, department := range departments {
		departmentNameMap[department.ID] = department.Name
		departmentPathMap[department.ID] = department.Path
	}

	// 响应
	entries := []*business_matters.BusinessMatterList{}
	for _, businessMatterses := range businessMatterses {
		entries = append(entries, &business_matters.BusinessMatterList{
			ID:              businessMatterses.BusinessMattersID,
			Name:            businessMatterses.Name,
			TypeKey:         businessMatterses.TypeKey,
			TypeValue:       TypeKeyMap[businessMatterses.TypeKey],
			DepartmentId:    businessMatterses.DepartmentID,
			DepartmentName:  departmentNameMap[businessMatterses.DepartmentID],
			DepartmentPath:  departmentPathMap[businessMatterses.DepartmentID],
			MaterialsNumber: uint64(businessMatterses.MaterialsNumber.Int64),
			// CreatedAt:       businessMatterses.CreatedAt.UnixMilli(),
			// CreatedName:     u.user.GetUserNameNoErr(ctx, businessMatterses.CreatorUID),
			// UpdatedAt:       businessMatterses.UpdatedAt.UnixMilli(),
			// UpdatedName:     u.user.GetUserNameNoErr(ctx, businessMatterses.UpdaterUID),
		})
	}

	res := &business_matters.ListRes{
		PageResults: response.PageResults[business_matters.BusinessMatterList]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u *businessMattersUseCase) listThird(ctx context.Context, req *business_matters.ListReqQuery) (*business_matters.ListRes, error) {
	// 判断是不是xx数据局的，如果是从approval_items标准读取，不是从business_matters读取
	var count int64
	var businessMatterses []*model.CssjjBusinessMatter
	businessMatterses, count, err := u.businessMattersRepo.ListThird(ctx, req)
	if err != nil {
		return nil, err
	}

	var typeKeys []string
	for _, businessMatterses := range businessMatterses {
		typeKeys = append(typeKeys, businessMatterses.TypeKey)
	}
	// 获取字典
	TypeKeyMap := make(map[string]string)
	dictItems, err := u.dictRepo.GetDictItemByKeys(ctx, "business-matters-type", typeKeys...)
	if err != nil {
		return nil, err
	}
	for _, dictItem := range dictItems {
		TypeKeyMap[dictItem.FKey] = dictItem.FValue
	}

	// 响应
	entries := []*business_matters.BusinessMatterList{}
	for _, businessMatterses := range businessMatterses {
		entries = append(entries, &business_matters.BusinessMatterList{
			ID:              businessMatterses.BusinessMattersID,
			Name:            businessMatterses.Name,
			TypeKey:         businessMatterses.TypeKey,
			TypeValue:       TypeKeyMap[businessMatterses.TypeKey],
			DepartmentId:    businessMatterses.DepartmentID,
			DepartmentName:  businessMatterses.DepartmentName,
			DepartmentPath:  businessMatterses.DepartmentName,
			MaterialsNumber: uint64(businessMatterses.MaterialsNumber.Int64),
			// CreatedAt:       businessMatterses.CreatedAt.UnixMilli(),
			// CreatedName:     u.user.GetUserNameNoErr(ctx, businessMatterses.CreatorUID),
			// UpdatedAt:       businessMatterses.UpdatedAt.UnixMilli(),
			// UpdatedName:     u.user.GetUserNameNoErr(ctx, businessMatterses.UpdaterUID),
		})
	}

	res := &business_matters.ListRes{
		PageResults: response.PageResults[business_matters.BusinessMatterList]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u *businessMattersUseCase) GetListByIds(ctx context.Context, ids string) ([]*business_matters.BusinessMatterBriefList, error) {
	// 判断是不是xx数据局的，如果是从approval_items标准读取，不是从business_matters读取
	var businessMatterses []*model.BusinessMatter
	isCssjj, err := u.configurationRepo.GetByName(ctx, "cssjj")
	if err != nil {
		log.WithContext(ctx).Error("Get configuration DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if isCssjj[0].Value == "true" {
		businessMatterses, err = u.businessMattersRepo.GetThirdByBusinessMattersIds(ctx, strings.Split(ids, ",")...)
		if err != nil {
			return nil, err
		}
	} else {
		businessMatterses, err = u.businessMattersRepo.GetByBusinessMattersIds(ctx, strings.Split(ids, ",")...)
		if err != nil {
			return nil, err
		}
	}

	// 响应
	entries := []*business_matters.BusinessMatterBriefList{}
	for _, businessMatters := range businessMatterses {
		entries = append(entries, &business_matters.BusinessMatterBriefList{
			ID:   businessMatters.BusinessMattersID,
			Name: businessMatters.Name,
		})
	}
	return entries, nil
}
