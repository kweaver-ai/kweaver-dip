package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/api/data_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	errorcode2 "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"fmt"
	"github.com/jinzhu/copier"
	"github.com/samber/lo"
)

// compareModelField 比较下用户输入的字段是否复合要求
func compareModelField(modelField, tableField *model.TModelField) error {
	if modelField == nil || tableField == nil {
		return errorcode2.GraphModelFieldError.Err()
	}
	if modelField.FieldID != tableField.FieldID {
		return errorcode2.GraphModelFieldError.Err()
	}
	return nil
}

// queryCatalogMountedTableFields  查询目录挂载的表
func (u *useCase) queryCatalogMountedTableFields(ctx context.Context, catalogID uint64) (string, []*model.TModelField, error) {
	catalogMountRes, err := u.service.DataCatalog.GetDataCatalogMountList(ctx, fmt.Sprintf("%v", catalogID))
	if err != nil {
		log.Errorf("PublicQueryDataCatalogError:%v", err.Error())
		return "", nil, errorcode2.PublicQueryDataCatalogError.Err()
	}
	formViewID := ""
	for _, mount := range catalogMountRes.MountResource {
		if mount.ResourceType == data_catalog.MountView {
			formViewID = mount.ResourceID
		}
	}
	//查询视图字段
	viewFields, err := u.fieldRepo.GetFormViewFieldList(ctx, formViewID)
	if err != nil {
		log.Errorf("PublicQueryDataViewError:%v", err.Error())
		return "", nil, errorcode2.PublicQueryDataViewError.Err()
	}
	fields := make([]*model.TModelField, 0)
	for _, viewField := range viewFields {
		modelField := &model.TModelField{
			FieldID:       viewField.ID,
			TechnicalName: viewField.TechnicalName,
			BusinessName:  viewField.BusinessName,
			DataType:      viewField.DataType,
			DataLength:    viewField.DataLength,
			DataAccuracy:  viewField.DataAccuracy.Int32,
			PrimaryKey:    viewField.PrimaryKey.Bool,
			IsNullable:    viewField.IsNullable,
			Comment:       viewField.Comment.String,
		}
		copier.Copy(modelField, viewField)
		fields = append(fields, modelField)
	}
	return formViewID, fields, nil
}

// queryCatalogName  查询目录的名称
func (u *useCase) queryCatalogName(ctx context.Context, catalogID uint64) (string, error) {
	catalogDetail, err := u.service.DataCatalog.GetDataCatalogDetail(ctx, fmt.Sprintf("%v", catalogID))
	if err != nil {
		log.Errorf("PublicQueryDataCatalogError:%v", err.Error())
		return "", errorcode2.PublicQueryDataCatalogError.Err()
	}
	return catalogDetail.Name, nil
}

// queryDataViewBusinessName  查询目录挂载的表的名称
func (u *useCase) queryDataViewBusinessName(ctx context.Context, dataViewID string) (string, error) {
	viewObj, err := u.viewRepo.GetById(ctx, dataViewID, nil)
	if err != nil {
		log.Errorf("dataViewID:%v", err.Error())
		return "", errorcode2.PublicQueryDataCatalogError.Err()
	}
	return viewObj.BusinessName, nil
}

// querySubjectName  查询业务对象的名称
func (u *useCase) querySubjectName(ctx context.Context, dataSubjectID string) (string, error) {
	subjectInfo, err := u.service.DataSubject.GetDataSubjectByID(ctx, []string{dataSubjectID})
	if err != nil {
		log.Errorf("querySubjectName:%v", err.Error())
		return "", errorcode2.PublicQueryDataSubjectError.Err()
	}
	if subjectInfo == nil || len(subjectInfo.Objects) <= 0 {
		return "", errorcode2.GraphModelSubjectNotExistError.Err()
	}
	return subjectInfo.Objects[0].Name, nil
}

// queryUserNameDict  查询用户名称map
func (u *useCase) queryUserNameDict(ctx context.Context, userIDSlice ...string) (map[string]string, error) {
	userInfos, err := u.service.ConfigurationCenter.GetUsers(ctx, userIDSlice)
	if err != nil {
		log.Errorf("queryUserInfoDict:%v", err.Error())
		return nil, errorcode2.PublicQueryDataCatalogError.Err()
	}
	return lo.SliceToMap(userInfos, func(item *configuration_center.User) (string, string) {
		return item.ID, item.Name
	}), nil
}

// getRelationModelDict  查询关系中的模型dict
func (u *useCase) getRelationModelDict(ctx context.Context, relations []*domain.Relation) ([]string, map[string]*model.TGraphModel, error) {
	//查询模型
	modelIDSlice := lo.Uniq(lo.FlatMap(relations, func(item *domain.Relation, index int) []string {
		return lo.FlatMap(item.Links, func(link *domain.RelationLink, i int) []string {
			return []string{link.StartModelID, link.EndModelID}
		})
	}))
	modelInfoSlice, err := u.repo.GetModelSlice(ctx, modelIDSlice...)
	if err != nil {
		return nil, nil, err
	}
	modelInfoDict := lo.SliceToMap(modelInfoSlice, func(item *model.TGraphModel) (string, *model.TGraphModel) {
		return item.ID, item
	})
	return modelIDSlice, modelInfoDict, err
}

// getRelationFieldDict  获取关系中的字段信息
func (u *useCase) getRelationFieldDict(ctx context.Context, relations []*domain.Relation) (map[string]*model.FormViewField, error) {
	fieldIDSlice := lo.Uniq(lo.FlatMap(relations, func(item *domain.Relation, index int) []string {
		ids := lo.FlatMap(item.Links, func(link *domain.RelationLink, i int) []string {
			return []string{link.StartFieldID, link.EndFieldID}
		})
		if item.StartDisplayFieldID != "" {
			ids = append(ids, item.StartDisplayFieldID)
		}
		if item.EndDisplayFieldID != "" {
			ids = append(ids, item.EndDisplayFieldID)
		}
		return ids
	}))
	fieldInfoSlice, err := u.fieldRepo.GetByIds(ctx, fieldIDSlice)
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Err()
	}
	fieldInfoDict := lo.SliceToMap(fieldInfoSlice, func(item *model.FormViewField) (string, *model.FormViewField) {
		return item.ID, item
	})
	return fieldInfoDict, nil
}

func (u *useCase) fixRelationName(ctx context.Context, relations []*domain.Relation) {
	//查询模型信息
	_, modelInfoDict, err := u.getRelationModelDict(ctx, relations)
	if err != nil {
		log.Warnf("getRelationModelDict error %v", err.Error())
		modelInfoDict = make(map[string]*model.TGraphModel)
	}
	//查询字段信息
	fieldInfoDict, err := u.getRelationFieldDict(ctx, relations)
	if err != nil {
		log.Warnf("getRelationFieldDict error %v", err.Error())
		fieldInfoDict = make(map[string]*model.FormViewField)
	}
	for i := range relations {
		for j := range relations[i].Links {
			link := relations[i].Links[j]
			if info := modelInfoDict[link.StartModelID]; info != nil {
				link.StartModelName = info.BusinessName
				link.StartModelTechName = info.TechnicalName
			}
			if info := modelInfoDict[link.EndModelID]; info != nil {
				link.EndModelName = info.BusinessName
				link.EndModelTechName = info.TechnicalName
			}
			if info := fieldInfoDict[link.StartFieldID]; info != nil {
				link.StartFieldName = info.BusinessName
				link.StartFieldTechName = info.TechnicalName
			}
			if info := fieldInfoDict[link.EndFieldID]; info != nil {
				link.EndFieldName = info.BusinessName
				link.EndFieldTechName = info.TechnicalName
			}
		}
	}

}
