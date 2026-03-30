package impl

import (
	"context"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	object_main_business "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/object_main_business"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/object_main_business"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type objectMainBusinessUseCase struct {
	objectMainBusinessRepo object_main_business.Repo
	businessStructureRepo  business_structure.Repo
}

func NewUseCase(
	objectMainBusinessRepo object_main_business.Repo,
	businessStructureRepo business_structure.Repo,
) domain.UseCase {
	return &objectMainBusinessUseCase{
		objectMainBusinessRepo: objectMainBusinessRepo,
		businessStructureRepo:  businessStructureRepo,
	}
}

func (uc objectMainBusinessUseCase) GetObjectMainBusinessList(ctx context.Context, objectId string, req *domain.QueryPageReq) (resp *domain.QueryPageResp, err error) {
	object, err := uc.businessStructureRepo.GetObject(ctx, objectId)
	if err != nil {
		log.WithContext(ctx).Error("object not found", zap.String("object id", objectId), zap.Error(err))
		return nil, err
	}
	resp = &domain.QueryPageResp{}
	if object.Type == int32(constant.ObjectTypeDepartment) {
		totalCount, mainBusinessList, err := uc.objectMainBusinessRepo.GetListByObjectId(ctx, objectId, req)
		if err != nil {
			log.WithContext(ctx).Error("failed to get main business from db", zap.Error(err))
			return nil, err
		}
		mainBusinessResp := make([]*domain.MainBusiness, len(mainBusinessList))
		for i, business := range mainBusinessList {
			mainBusinessResp[i] = &domain.MainBusiness{
				ID:               strconv.FormatUint(business.ID, 10),
				ObjectId:         business.ObjectId,
				Name:             business.Name,
				AbbreviationName: business.AbbreviationName,
			}
		}
		resp.TotalCount = totalCount
		resp.Entries = mainBusinessResp
	} else {
		resp.Entries = make([]*domain.MainBusiness, 0)
	}

	return resp, nil
}

func (uc objectMainBusinessUseCase) AddObjectMainBusiness(ctx context.Context, objectId string, nameVos []*domain.AddObjectMainBusinessInfo, uid string) (resp *domain.CountResp, err error) {
	models := make([]model.TObjectMainBusiness, len(nameVos))
	addTime := time.Now()
	for i, nameVo := range nameVos {
		models[i] = model.TObjectMainBusiness{
			ObjectId:         objectId,
			Name:             nameVo.Name,
			AbbreviationName: nameVo.AbbreviationName,
			CreatedAt:        addTime,
			CreatedBy:        uid}
	}
	count, err := uc.objectMainBusinessRepo.AddObjectMainBusiness(ctx, models)
	if err != nil {
		log.WithContext(ctx).Error("failed to add main business", zap.Error(err))
		return nil, err
	}
	return &domain.CountResp{Count: count}, nil
}

func (uc objectMainBusinessUseCase) UpdateObjectMainBusiness(ctx context.Context, req []*domain.UpdateObjectMainBusinessInfo, uid string) (resp *domain.CountResp, err error) {
	models := make([]*model.TObjectMainBusiness, 0)
	updateTime := time.Now()
	for _, record := range req {
		id, err := strconv.ParseUint(record.Id, 10, 64)
		if err != nil {
			log.WithContext(ctx).Error("failed to update main business", zap.Error(err))
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
		newModel := &model.TObjectMainBusiness{ID: id, Name: record.Name, AbbreviationName: record.AbbreviationName, UpdatedBy: &uid, UpdatedAt: &updateTime}
		models = append(models, newModel)
	}
	count, err := uc.objectMainBusinessRepo.UpdateObjectMainBusiness(ctx, models)
	if err != nil {
		log.WithContext(ctx).Error("failed to update main business", zap.Error(err))
		return nil, err
	}
	return &domain.CountResp{Count: count}, nil
}

func (uc objectMainBusinessUseCase) DeleteObjectMainBusiness(ctx context.Context, req *domain.IdsReq, uid string) (resp *domain.CountResp, err error) {
	count, err := uc.objectMainBusinessRepo.DeleteObjectMainBusiness(ctx, req.IDs, uid)
	if err != nil {
		log.WithContext(ctx).Error("failed to delete main business", zap.Error(err))
		return nil, err
	}
	return &domain.CountResp{Count: count}, nil
}
