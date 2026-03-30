package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/rest/af_sailor_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/jinzhu/copier"
	"github.com/samber/lo"
)

// updateMetaModel 更新元模型
func (u *useCase) updateMetaModel(ctx context.Context, req *domain.UpdateModelReq) (*response.IDResp, error) {
	//检查模型是否存在
	modelInfo, err := u.repo.GetModel(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//如果有关系，那就不能修改
	relations, err := u.repo.GetModelRelations(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if len(relations) > 0 {
		return nil, errorcode.GraphModelCannotModifyError.Err()
	}
	//检查字段
	if len(req.Fields) > 0 {
		_, tableFields, err := u.queryCatalogMountedTableFields(ctx, modelInfo.CatalogID)
		if err != nil {
			return nil, err
		}
		tableViewDict := lo.SliceToMap(tableFields, func(item *model.TModelField) (string, *model.TModelField) {
			return item.FieldID, item
		})
		for _, field := range req.Fields {
			tableField, ok := tableViewDict[field.FieldID]
			if !ok {
				return nil, errorcode.GraphModelFieldError.Err()
			}
			//对比逻辑, 这个基本没用了
			if err = compareModelField(field, tableField); err != nil {
				return nil, err
			}
			//给请求的字段赋值
			field.TechnicalName = tableField.TechnicalName
			field.DataType = tableField.DataType
			field.DataLength = tableField.DataLength
			field.DataAccuracy = tableField.DataAccuracy
			field.IsNullable = tableField.IsNullable
			field.Comment = tableField.Comment
		}
	}
	//检查技术名称是否重复
	if req.TechnicalName != "" {
		if err = u.repo.ExistsTechnicalName(ctx, req.ID, req.TechnicalName); err != nil {
			return nil, err
		}
	}
	//检查业务名称是否重复
	if req.BusinessName != "" {
		if err = u.repo.ExistsBusinessName(ctx, req.ID, req.BusinessName); err != nil {
			return nil, err
		}
	}
	//插入
	obj := req.MetaModel(ctx)
	if err := u.repo.UpdateMetaGraph(ctx, obj, req.Fields); err != nil {
		return nil, errorcode.Detail(errorcode.DatabaseError, err.Error())
	}
	return response.ID(obj.ID), nil
}

// updateCompositeModel 更新复合模型
func (u *useCase) updateCompositeModel(ctx context.Context, req *domain.UpdateModelReq) (*response.IDResp, error) {
	//检查模型是否存在
	if _, err := u.repo.GetModel(ctx, req.ID); err != nil {
		return nil, err
	}
	//检查业务名称是否重复
	if req.BusinessName != "" {
		if err := u.repo.ExistsBusinessName(ctx, req.ID, req.BusinessName); err != nil {
			return nil, err
		}
	}
	//检查起点终点的数据是否存在
	if len(req.Relations) > 0 {
		if err := u.checkRelations(ctx, req.Relations); err != nil {
			return nil, err
		}
	}
	//去除模型中的有关系的孤立节点
	if len(req.AllNodes) > 0 {
		req.UniqSingleNodes()
	}
	//插入
	obj := req.CompositeModel(ctx)
	relations, links := req.CompositeRelations(ctx)
	if err := u.repo.UpdateRelations(ctx, obj, req.SingleNodes, relations, links); err != nil {
		return nil, errorcode.Detail(errorcode.DatabaseError, err.Error())
	}
	//尝试构建, 仅尝试
	detail, err := u.Get(ctx, request.NewIDReq(obj.ID))
	if err != nil {
		return nil, errorcode.Detail(errorcode.DatabaseError, err.Error())
	}
	if err = u.updateGraph(ctx, detail); err != nil {
		log.Warnf("build graph failed %v", err)
	} else {
		if err = u.repo.UpdateModelGraphID(ctx, obj.ID, detail.GraphID); err != nil {
			return nil, errorcode.Detail(errorcode.DatabaseError, err.Error())
		}
	}
	return response.ID(obj.ID), nil
}

func (u *useCase) updateGraph(ctx context.Context, detail *domain.ModelDetail) error {
	graphModelDetail := &af_sailor_service.ModelDetail{}
	copier.Copy(graphModelDetail, detail)
	graphIDResp, err := u.service.SailService.UpdateGraph(ctx, graphModelDetail)
	if err != nil {
		return err
	}
	detail.GraphID = graphIDResp.ID
	taskReq := &af_sailor_service.GraphBuildTaskReq{
		GraphID:  graphIDResp.ID,
		TaskType: "full",
	}
	if _, err = u.service.SailService.GraphBuildTask(ctx, taskReq); err != nil {
		return err
	}
	return nil
}

// checkRelations 检查关系是否合法
// 1. 所有的起点和终点都要存在
// 2. 多个链接不能重复
// 3. 关系不能重
// 4. 不能链接到自己
func (u *useCase) checkRelations(ctx context.Context, relations []*domain.Relation) error {
	//检查是否存在
	if err := u.checkRelationExist(ctx, relations); err != nil {
		return err
	}
	//检查链接重复
	if err := checkRelationRepeat(relations); err != nil {
		return err
	}
	return nil
}

func checkRelationRepeat(relations []*domain.Relation) error {
	//关系ID需要不一样
	uniqueRelationIDSlice := lo.Uniq(lo.Times(len(relations), func(index int) string {
		return relations[index].ID
	}))
	if len(uniqueRelationIDSlice) < len(relations) {
		return errorcode.GraphModelRelationRepeatError.Err()
	}
	//同一个关系里面不应该存在相同的link
	for _, relation := range relations {
		linkUniqueIDSlice := lo.Times(len(relation.Links), func(index int) string {
			return relation.Links[index].UniqueUID()
		})
		if len(linkUniqueIDSlice) > len(lo.Uniq(linkUniqueIDSlice)) {
			return errorcode.GraphModelRelationLinkRepeatError.Err()
		}
	}
	return nil
}

func (u *useCase) checkRelationExist(ctx context.Context, relations []*domain.Relation) error {
	//查询模型
	modelIDSlice, modelInfoDict, err := u.getRelationModelDict(ctx, relations)
	if err != nil {
		return err
	}
	if len(modelInfoDict) != len(modelIDSlice) {
		return errorcode.GraphModelNotExistError.Err()
	}
	//查询字段
	fieldInfoDict, err := u.getRelationFieldDict(ctx, relations)
	if err != nil {
		return err
	}
	//检查模型
	invalidModelIDSlice := lo.Uniq(lo.FlatMap(relations, func(item *domain.Relation, index int) []string {
		return lo.FlatMap(item.Links, func(link *domain.RelationLink, i int) (ids []string) {
			if _, ok := modelInfoDict[link.StartModelID]; !ok {
				ids = append(ids, link.StartModelID)
			}
			if _, ok := modelInfoDict[link.EndModelID]; !ok {
				ids = append(ids, link.EndModelID)
			}
			return ids
		})
	}))
	if len(invalidModelIDSlice) > 0 {
		return errorcode.GraphModelNotExistError.Detail(invalidModelIDSlice)
	}
	//检查字段
	invalidFieldIDSlice := lo.Uniq(lo.FlatMap(relations, func(item *domain.Relation, index int) []string {
		return lo.FlatMap(item.Links, func(link *domain.RelationLink, i int) (ids []string) {
			if _, ok := fieldInfoDict[link.StartFieldID]; !ok {
				ids = append(ids, link.StartFieldID)
			}
			if _, ok := fieldInfoDict[link.EndFieldID]; !ok {
				ids = append(ids, link.EndFieldID)
			}
			return ids
		})
	}))
	if len(invalidFieldIDSlice) > 0 {
		return errorcode.GraphModelFieldError.Detail(invalidFieldIDSlice)
	}
	//检查显示字段
	invalidDisplayFieldIDSlice := lo.Uniq(lo.FlatMap(relations, func(relation *domain.Relation, index int) (ids []string) {
		if _, ok := fieldInfoDict[relation.StartDisplayFieldID]; !ok && relation.StartDisplayFieldID != "" {
			ids = append(ids, relation.StartDisplayFieldID)
		}
		if _, ok := fieldInfoDict[relation.EndDisplayFieldID]; !ok && relation.EndDisplayFieldID != "" {
			ids = append(ids, relation.EndDisplayFieldID)
		}
		return ids
	}))
	if len(invalidDisplayFieldIDSlice) > 0 {
		return errorcode.GraphModelDisplayFieldNotExistError.Detail(invalidDisplayFieldIDSlice)
	}
	return nil
}
