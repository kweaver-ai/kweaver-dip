package impl

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jinzhu/copier"
	formViewRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	fieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	errorcode2 "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"
	"github.com/samber/lo"
)

type useCase struct {
	repo                      graph_model.Repo
	service                   *rest.Service
	fieldRepo                 fieldRepo.FormViewFieldRepo
	viewRepo                  formViewRepo.FormViewRepo
	configurationCenterDriven configuration_center.Driven
}

func NewUseCase(
	repo graph_model.Repo,
	service *rest.Service,
	fieldRepo fieldRepo.FormViewFieldRepo,
	viewRepo formViewRepo.FormViewRepo,
	configurationCenterDriven configuration_center.Driven,
) domain.UseCase {
	return &useCase{
		repo:                      repo,
		service:                   service,
		fieldRepo:                 fieldRepo,
		viewRepo:                  viewRepo,
		configurationCenterDriven: configurationCenterDriven,
	}
}

func (u *useCase) CheckNameExist(ctx context.Context, req *domain.ModelNameCheckReq) error {
	if req.BusinessName != "" {
		if err := u.repo.ExistsBusinessName(ctx, req.ID, req.BusinessName); err != nil {
			return err
		}
	}
	if req.TechnicalName != "" {
		if err := u.repo.ExistsTechnicalName(ctx, req.ID, req.TechnicalName); err != nil {
			return err
		}
	}
	return nil
}

func (u *useCase) Create(ctx context.Context, req *domain.CreateModelReq) (*response.IDResp, error) {
	if req.ModelType == constant.GraphModelTypeMeta.String {
		return u.createMetaModel(ctx, req)
	}
	return u.createCompositeModel(ctx, req)
}

func (u *useCase) Update(ctx context.Context, req *domain.UpdateModelReq) (*response.IDResp, error) {
	modelInfo, err := u.repo.GetModel(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if modelInfo.ModelType == constant.GraphModelTypeMeta.Integer.Int32() {
		return u.updateMetaModel(ctx, req)
	}
	return u.updateCompositeModel(ctx, req)
}

// Get 查询详情
func (u *useCase) Get(ctx context.Context, req *request.IDReq) (*domain.ModelDetail, error) {
	modelInfo, err := u.repo.GetModel(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	detail := &domain.ModelDetail{}
	copier.Copy(detail, &modelInfo)
	detail.CatalogID = fmt.Sprintf("%v", modelInfo.CatalogID)
	//补充业务对象
	detail.SubjectName, _ = u.querySubjectName(ctx, modelInfo.SubjectID)
	if modelInfo.ModelType == constant.GraphModelTypeMeta.Integer.Int32() {
		//字段
		fields, err := u.repo.GetModelFieldSlice(ctx, req.ID)
		if err != nil {
			return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
		}
		usedCount, err := u.repo.GetMetaUsedCount(ctx, req.ID)
		if err != nil {
			return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
		}
		detail.UsedCount = &usedCount
		detail.CatalogName, _ = u.queryCatalogName(ctx, modelInfo.CatalogID)
		detail.DataViewName, _ = u.queryDataViewBusinessName(ctx, modelInfo.DataViewID)
		detail.Fields = fields
		return detail, nil
	}
	//处理复合模型
	//查询关系
	relations, err := u.repo.GetModelRelations(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	links, err := u.repo.GetModelRelationLinks(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//查询元模型
	metaModelSlice, err := u.repo.ListCompositeMetas(ctx, req.ID)
	if err != nil {
		return detail, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	detail.Relations = domain.GenRelations(relations, links)
	domain.AddRelationMetaDisplayKey(metaModelSlice, detail.Relations)
	detail.MetaModelSlice = metaModelSlice
	//添加字段和模型名称
	u.fixRelationName(ctx, detail.Relations)
	if detail.GradeLabelId != "" {
		dataGradeMap, _ := u.configurationCenterDriven.QueryDataGrade(ctx, detail.GradeLabelId)
		detail.GradeLabelName = dataGradeMap[detail.GradeLabelId].Name
		detail.GradeLabelIcon = dataGradeMap[detail.GradeLabelId].Icon
	}
	return detail, nil
}

func (u *useCase) List(ctx context.Context, req *domain.ModelListReq) (*response.PageResult[domain.ModeListItem], error) {
	if req.OnlySelf {
		userInfo := util.ObtainUserInfo(ctx)
		req.UserID = userInfo.ID
	}
	if req.ModelType == constant.GraphModelTypeMeta.String {
		models, total, err := u.repo.ListModel(ctx, req)
		if err != nil {
			return nil, err
		}
		userIDSlice := lo.Times(len(models), func(index int) string {
			return models[index].UpdaterUID
		})
		userNameDict, _ := u.queryUserNameDict(ctx, userIDSlice...)
		objs := make([]*domain.ModeListItem, 0)
		for _, model := range models {
			obj := &domain.ModeListItem{}
			copier.Copy(obj, &model)
			obj.CatalogID = fmt.Sprintf("%v", model.CatalogID)
			obj.UpdaterName = userNameDict[obj.UpdaterUID]
			objs = append(objs, obj)
		}
		return &response.PageResult[domain.ModeListItem]{
			TotalCount: total,
			Entries:    objs,
		}, nil
	}
	//处理复合模型
	models, total, err := u.repo.ListModel(ctx, req)
	if err != nil {
		return nil, err
	}
	//查询元模型信息
	compositeModelIDSlice := lo.Times(len(models), func(index int) string {
		return models[index].ID
	})
	modelDict := make(map[string][]string)
	if len(compositeModelIDSlice) > 0 {
		modelDict, err = u.repo.GetCompositeMetaNameDict(ctx, compositeModelIDSlice...)
		if err != nil {
			return nil, err
		}
	}
	gradeLabelIDSlice := lo.FilterMap(models, func(item *model.TGraphModel, index int) (string, bool) {
		if item.GradeLabelId != "" {
			return item.GradeLabelId, true
		}
		return "", false
	})
	dataGradeMap := make(map[string]*configuration_center.HierarchyTag)
	if len(gradeLabelIDSlice) > 0 {
		dataGradeMap, err = u.configurationCenterDriven.QueryDataGrade(ctx, gradeLabelIDSlice...)
		if err != nil {
			log.WithContext(ctx).Errorf("==========QueryDataGrade%v", err.Error())
		}
	}

	userIDSlice := lo.Times(len(models), func(index int) string {
		return models[index].CreatorUID
	})
	userNameDict, _ := u.queryUserNameDict(ctx, userIDSlice...)

	objs := make([]*domain.ModeListItem, 0)
	for _, model := range models {
		obj := &domain.ModeListItem{MetaModel: make([]string, 0)}
		copier.Copy(obj, &model)
		//查询元模型
		obj.MetaModel = lo.Uniq(modelDict[obj.ID])
		if obj.GradeLabelId != "" {
			obj.GradeLabelName = dataGradeMap[obj.GradeLabelId].Name
			obj.GradeLabelIcon = dataGradeMap[obj.GradeLabelId].Icon
		}
		obj.CreatedName = userNameDict[obj.CreatorUID]
		objs = append(objs, obj)
	}
	return &response.PageResult[domain.ModeListItem]{
		TotalCount: total,
		Entries:    objs,
	}, nil
}

func (u *useCase) Delete(ctx context.Context, req *request.IDReq) (*response.IDResp, error) {
	graphModel, err := u.repo.GetModel(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if graphModel.ModelType == constant.GraphModelTypeMeta.Integer.Int32() {
		usedCount, err := u.repo.GetMetaUsedCount(ctx, req.ID)
		if err != nil {
			return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
		}
		if usedCount > 0 {
			return nil, errorcode2.GraphModelCannotDeletedError.Err()
		}
	}
	//删除图谱
	txFunc := func() error {
		if graphModel.GraphID <= 0 {
			return nil
		}
		_, err := u.service.SailService.DeleteGraph(ctx, graphModel.GraphID)
		if err != nil {
			log.Errorf("删除模型错误%v", err.Error())
		}
		return err
	}
	//删除模型
	if err = u.repo.DeleteModel(ctx, req.ID, txFunc); err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}

	return &response.IDResp{
		ID: req.ID,
	}, err
}

func getMetaNames(dict map[string]*model.TGraphModel, ids ...string) (names []string) {
	for _, id := range ids {
		graphModel, ok := dict[id]
		if !ok {
			continue
		}
		names = append(names, graphModel.BusinessName)
	}
	return nil
}

func (u *useCase) UpdateTopicModelMj(ctx context.Context, req *domain.UpdateTopicModelMjReq) (*response.IDResp, error) {
	modelInfo, err := u.repo.GetModel(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	userInfo := util.ObtainUserInfo(ctx)
	modelInfo.GradeLabelId = req.GradeLabelId
	modelInfo.UpdatedAt = time.Now()
	modelInfo.UpdaterUID = userInfo.ID
	modelInfo.UpdaterName = userInfo.Name
	err = u.repo.UpdateModel(ctx, modelInfo)
	if err != nil {
		return nil, err
	}
	return response.ID(modelInfo.ID), nil
}

func (u *useCase) QueryTopicModelLabelRecList(ctx context.Context, req *request.PageSortKeyword3) (*response.PageResult[domain.ModelLabelRecRelResp], error) {

	//处理复合模型
	models, total, err := u.repo.ListTopicModelLabelRec(ctx, req)
	if err != nil {
		return nil, err
	}
	graphModelIds := make([]string, 0)
	// 查询分页后所有模型id
	for _, graphModel := range models {
		ids := strings.Split(graphModel.RelatedModelIDs, ",")
		graphModelIds = append(graphModelIds, ids...)
	}
	graphModels, _ := u.repo.GetModelSlice(ctx, graphModelIds...)
	graphModeMap := lo.Associate(graphModels, func(p *model.TGraphModel) (string, *domain.RelatedModelsResp) {
		return p.ID, &domain.RelatedModelsResp{ID: p.ID, Name: p.BusinessName}
	})

	objs := make([]*domain.ModelLabelRecRelResp, 0)
	for _, model := range models {
		obj := &domain.ModelLabelRecRelResp{}
		copier.Copy(obj, &model)
		obj.ID = strconv.FormatUint(model.ID, 10)
		// 查询关联模型
		relatedModelIds := strings.Split(model.RelatedModelIDs, ",")
		relatedModels := make([]*domain.RelatedModelsResp, 0)
		for _, id := range relatedModelIds {
			relatedModels = append(relatedModels, graphModeMap[id])
		}
		obj.RelatedModels = relatedModels
		objs = append(objs, obj)
	}
	return &response.PageResult[domain.ModelLabelRecRelResp]{
		TotalCount: total,
		Entries:    objs,
	}, nil
}

func (u *useCase) CreateTopicModelLabelRec(ctx context.Context, req *domain.CreateModelLabelRecRelReq) (*response.IDResp, error) {
	modelInfo := &model.TModelLabelRecRel{}
	userInfo := util.ObtainUserInfo(ctx)
	id, _ := utilities.GetUniqueID()
	modelInfo.ID = id
	modelInfo.RelatedModelIDs = strings.Join(req.RelatedModelsIds, ",")
	modelInfo.Name = req.Name
	modelInfo.Description = req.Description
	modelInfo.CreatorUID = userInfo.ID
	modelInfo.CreatedAt = time.Now()
	modelInfo.CreatedName = userInfo.Name
	modelInfo.UpdatedAt = time.Now()
	modelInfo.UpdaterUID = userInfo.ID
	modelInfo.UpdaterName = userInfo.Name
	err := u.repo.CreateTopicModelLabelRec(ctx, modelInfo)
	if err != nil {
		return nil, err
	}
	return response.ID(strconv.FormatUint(modelInfo.ID, 10)), nil
}

func (u *useCase) UpdateTopicModelLabelRec(ctx context.Context, req *domain.UpdateModelLabelRecRelReq) (*response.IDResp, error) {
	id, _ := strconv.ParseUint(req.ID, 10, 64)
	modelInfo, err := u.repo.GetTopicModelLabelRec(ctx, id)
	if err != nil {
		return nil, err
	}
	userInfo := util.ObtainUserInfo(ctx)
	modelInfo.RelatedModelIDs = strings.Join(req.RelatedModelsIds, ",")
	modelInfo.Name = req.Name
	modelInfo.Description = req.Description
	modelInfo.UpdatedAt = time.Now()
	modelInfo.UpdaterUID = userInfo.ID
	modelInfo.UpdaterName = userInfo.Name
	err = u.repo.UpdateTopicModelLabelRec(ctx, modelInfo)
	if err != nil {
		return nil, err
	}
	return response.ID(req.ID), nil
}

func (u *useCase) DeleteTopicModelLabelRec(ctx context.Context, req *request.IDReq) (*response.IDResp, error) {
	id, _ := strconv.ParseUint(req.ID, 10, 64)
	if err := u.repo.DeleteTopicModelLabelRec(ctx, id); err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return &response.IDResp{
		ID: req.ID,
	}, nil
}

func (u *useCase) GetTopicModelLabelRec(ctx context.Context, req *request.IDReq) (*domain.ModelLabelRecRelResp, error) {
	id, _ := strconv.ParseUint(req.ID, 10, 64)
	modelInfo, err := u.repo.GetTopicModelLabelRec(ctx, id)
	if err != nil {
		return nil, err
	}
	detail := &domain.ModelLabelRecRelResp{}
	copier.Copy(detail, &modelInfo)
	detail.ID = strconv.FormatUint(modelInfo.ID, 10)
	// 查询关联模型
	objs := make([]*domain.RelatedModelsResp, 0)
	relatedModels := strings.Split(modelInfo.RelatedModelIDs, ",")
	models, _ := u.repo.GetModelSlice(ctx, relatedModels...)
	for _, graphModel := range models {
		obj := &domain.RelatedModelsResp{}
		obj.ID = graphModel.ID
		obj.Name = graphModel.BusinessName
		objs = append(objs, obj)
	}
	detail.RelatedModels = objs
	return detail, nil
}
