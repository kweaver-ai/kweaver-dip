package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	errorcode2 "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/graph_model"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"errors"
	"fmt"
	"github.com/jinzhu/copier"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) graph_model.Repo {
	return &repo{db: db}
}

func (r *repo) DB(ctx context.Context) *gorm.DB {
	return r.db.WithContext(ctx)
}

// CreateModel 创建元模型
func (r *repo) CreateModel(ctx context.Context, obj *model.TGraphModel, fields []*model.TModelField) error {
	return r.DB(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(obj).Error; err != nil {
			return err
		}
		if len(fields) <= 0 {
			return nil
		}
		return tx.Create(fields).Error
	})
}

// UpdateMetaGraph 更新元模型及其字段
func (r *repo) UpdateMetaGraph(ctx context.Context, obj *model.TGraphModel, fields []*model.TModelField) error {
	return r.DB(ctx).Transaction(func(tx *gorm.DB) error {
		//更新模型
		canUpdateColumns := []string{"business_name", "technical_name", "description", "updater_uid", "updater_name"}
		if err := tx.Where("id=?", obj.ID).Select(canUpdateColumns).Updates(obj).Error; err != nil {
			return err
		}
		//不修改fields， 元模型必须要有字段
		if len(fields) <= 0 {
			return nil
		}
		//查询字段
		existFields := make([]*model.TModelField, 0)
		if err := tx.Where("model_id=?", obj.ID).Find(&existFields).Error; err != nil {
			return err
		}
		existFieldDict := lo.SliceToMap(existFields, func(item *model.TModelField) (string, *model.TModelField) {
			return item.FieldID, item
		})
		for i := range fields {
			existField, ok := existFieldDict[fields[i].FieldID]
			if ok {
				fields[i].ID = existField.ID
			}
		}
		//删除
		if err := tx.Where("model_id=?", obj.ID).Delete(&model.TModelField{}).Error; err != nil {
			return err
		}
		//插入
		return tx.Create(fields).Error
	})
}

func (r *repo) GetModel(ctx context.Context, id string) (obj *model.TGraphModel, err error) {
	err = r.DB(ctx).Where("id=?", id).First(&obj).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode2.PublicResourceNotFoundError.Err()
		}
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return obj, err
}

func (r *repo) UpdateModel(ctx context.Context, obj *model.TGraphModel) (err error) {
	return r.DB(ctx).Where("id = ?", obj.ID).Updates(obj).Error
}

func (r *repo) ExistsTechnicalName(ctx context.Context, modelID string, technicalName string) error {
	count := int64(0)
	db := r.DB(ctx).Model(new(model.TGraphModel)).Where("technical_name=?", technicalName)
	if modelID != "" {
		db = db.Where("id <> ? ", modelID)
	}
	if err := db.Count(&count).Error; err != nil {
		return errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	if count > 0 {
		return errorcode2.GraphModelTechnicalNameExistError.Err()
	}
	return nil
}

func (r *repo) ExistsBusinessName(ctx context.Context, modelID string, businessName string) error {
	count := int64(0)
	db := r.DB(ctx).Model(new(model.TGraphModel)).Where("business_name=?", businessName)
	if modelID != "" {
		db = db.Where("id <> ? ", modelID)
	}
	if err := db.Count(&count).Error; err != nil {
		return errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	if count > 0 {
		return errorcode2.GraphModelBusinessNameExistError.Err()
	}
	return nil
}

func (r *repo) GetModelSlice(ctx context.Context, ids ...string) (objs []*model.TGraphModel, err error) {
	err = r.DB(ctx).Where("id in ?", ids).Find(&objs).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return objs, err
}

func (r *repo) GetModelFieldSlice(ctx context.Context, modelID string) (fields []*model.TModelField, err error) {
	err = r.DB(ctx).Where("model_id=?", modelID).Find(&fields).Error
	return fields, err
}

func (r *repo) ListModel(ctx context.Context, req *domain.ModelListReq) (models []*model.TGraphModel, total int64, err error) {
	db := r.DB(ctx).Model(new(model.TGraphModel))
	if req.SubjectID != "" {
		db = db.Where("subject_id=?", req.SubjectID)
	}
	if req.UserID != "" {
		db = db.Where("creator_uid=?", req.UserID)
	}
	if req.Keyword != "" {
		keyword := "%" + req.Keyword + "%"
		db = db.Where(" business_name like ? ", keyword)
	}
	if req.ModelType != "" {
		db = db.Where("model_type=?", enum.ToInteger[constant.GraphModelType](req.ModelType).Int32())
	}
	//总数
	if err = db.Count(&total).Error; err != nil {
		return
	}
	limit := *req.PageInfo.Limit
	offset := limit * (*req.PageInfo.Offset - 1)
	db = db.Offset(offset).Limit(limit)
	if err = db.Order(req.Sort + " " + req.Direction).Find(&models).Error; err != nil {
		return nil, 0, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return
}

func (r *repo) DeleteModel(ctx context.Context, id string, txFunc func() error) (err error) {
	err = r.DB(ctx).Transaction(func(tx *gorm.DB) error {
		if err = tx.Where("id=?", id).Delete(&model.TGraphModel{}).Error; err != nil {
			return err
		}
		if err = tx.Where("model_id=?", id).Delete(&model.TModelSingleNode{}).Error; err != nil {
			return err
		}
		if err = tx.Where("model_id=?", id).Delete(&model.TModelField{}).Error; err != nil {
			return err
		}
		if err = tx.Where("model_id=?", id).Delete(&model.TModelRelation{}).Error; err != nil {
			return err
		}
		if err = tx.Where("model_id=?", id).Delete(&model.TModelRelationLink{}).Error; err != nil {
			return err
		}
		return txFunc()
	})
	if err != nil {
		return errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

func (r *repo) GetModelRelations(ctx context.Context, modelID string) (relations []*model.TModelRelation, err error) {
	err = r.DB(ctx).Where("model_id=?", modelID).Find(&relations).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return relations, nil
}

func (r *repo) GetModelRelationLinks(ctx context.Context, modelID string) (links []*model.TModelRelationLink, err error) {
	err = r.DB(ctx).Where("model_id=?", modelID).Find(&links).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return links, err
}

// UpdateModelGraphID 更新复合模型graphID
func (r *repo) UpdateModelGraphID(ctx context.Context, modeID string, graphID int) error {
	err := r.DB(ctx).Model(new(model.TGraphModel)).Where("id=?", modeID).UpdateColumn("graph_id", graphID).Error
	if err != nil {
		return errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

// UpdateRelations 更新复合模型
func (r *repo) UpdateRelations(ctx context.Context, obj *model.TGraphModel, singleNodes []*model.TModelSingleNode, relations []*model.TModelRelation, links []*model.TModelRelationLink) error {
	canUpdateColumns := []string{"updater_uid", "updater_name"}
	return r.DB(ctx).Transaction(func(tx *gorm.DB) error {
		if obj.BusinessName != "" {
			canUpdateColumns = append(canUpdateColumns, "business_name")
		}
		if obj.Description != "" {
			canUpdateColumns = append(canUpdateColumns, "description")
		}
		if obj.GraphID > 0 {
			canUpdateColumns = append(canUpdateColumns, "graph_id")
		}
		//更新模型
		if err := tx.Where("id=?", obj.ID).Select(canUpdateColumns).Updates(obj).Error; err != nil {
			return err
		}
		//更新孤立节点
		if err := r.updateSingleNodes(tx, obj.ID, singleNodes); err != nil {
			return err
		}
		//更新关系
		if err := r.updateRelations(tx, obj.ID, relations); err != nil {
			return err
		}
		//更新关系对
		return r.updateRelationLinks(tx, obj.ID, links)
	})
}

func (r *repo) updateSingleNodes(tx *gorm.DB, modelID string, singleNodes []*model.TModelSingleNode) error {
	if singleNodes == nil {
		return nil
	}
	//删除
	if err := tx.Where("model_id=?", modelID).Delete(&model.TModelSingleNode{}).Error; err != nil {
		return err
	}
	if len(singleNodes) <= 0 {
		return nil
	}
	//插入
	return tx.Create(singleNodes).Error
}

// updateRelations

func (r *repo) updateRelations(tx *gorm.DB, modelID string, relations []*model.TModelRelation) error {
	if relations == nil {
		return nil
	}
	//删除
	if err := tx.Where("model_id=?", modelID).Delete(&model.TModelRelation{}).Error; err != nil {
		return err
	}
	if len(relations) <= 0 {
		return nil
	}
	//插入
	return tx.Create(relations).Error
}

func (r *repo) updateRelationLinks(tx *gorm.DB, modelID string, links []*model.TModelRelationLink) error {
	if links == nil {
		return nil
	}
	//删除
	if err := tx.Where("model_id=?", modelID).Delete(&model.TModelRelationLink{}).Error; err != nil {
		return err
	}
	if len(links) <= 0 {
		return nil
	}
	//插入
	return tx.Create(links).Error
}

func (r *repo) ListCompositeMetas(ctx context.Context, id string) (models []*domain.ModelDetail, err error) {
	//查询出关系中的元模型ID
	links := make([]*model.TModelRelationLink, 0)
	err = r.DB(ctx).Where("model_id = ?", id).Find(&links).Error
	if err != nil {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	//查询孤立节点
	nodes := make([]*model.TModelSingleNode, 0)
	err = r.DB(ctx).Where("model_id=?", id).Find(&nodes).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	singleNodeIDSlice := lo.Times(len(nodes), func(index int) string {
		return nodes[index].MetaModelID
	})
	//合并两种元模型
	modelIDSlice := lo.FlatMap(links, func(item *model.TModelRelationLink, index int) []string {
		return []string{item.StartModelID, item.EndModelID}
	})
	modelIDSlice = append(modelIDSlice, singleNodeIDSlice...)
	//查询元模型
	metaModelSlice := make([]*model.TGraphModel, 0)
	err = r.DB(ctx).Where("id in ?", modelIDSlice).Find(&metaModelSlice).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	//查询字段
	fields := make([]*model.TModelField, 0)
	if err = r.DB(ctx).Where("model_id in ? ", modelIDSlice).Find(&fields).Error; err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	fieldGroup := lo.GroupBy(fields, func(item *model.TModelField) string {
		return item.ModelID
	})
	//孤立节点的显示key
	singleNodeDisplayKeyDict := lo.SliceToMap(nodes, func(item *model.TModelSingleNode) (string, string) {
		metaModelFields := fieldGroup[item.MetaModelID]
		for _, field := range metaModelFields {
			if item.DisplayFieldID != "" && item.DisplayFieldID == field.FieldID {
				return item.MetaModelID, field.TechnicalName
			}
		}
		return item.ModelID, ""
	})
	for _, metaModel := range metaModelSlice {
		detailMeta := &domain.ModelDetail{}
		copier.Copy(detailMeta, &metaModel)
		detailMeta.CatalogID = fmt.Sprintf("%v", metaModel.CatalogID)
		//设置显示key
		detailMeta.DisplayFieldKey = singleNodeDisplayKeyDict[metaModel.ID]
		models = append(models, detailMeta)
		modelFields, ok := fieldGroup[metaModel.ID]
		if !ok {
			return nil, errorcode2.GraphModelModelFieldNotExistError.Err()
		}
		detailMeta.Fields = modelFields
	}
	return models, err
}

func (r *repo) GetCompositeMetaNameDict(ctx context.Context, ids ...string) (res map[string][]string, err error) {
	//查询出关系中的元模型ID
	links := make([]*model.TModelRelationLink, 0)
	err = r.DB(ctx).Where("model_id in ?", ids).Find(&links).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	linkDict := make(map[string][]string)
	for _, link := range links {
		linkDict[link.ModelID] = append(linkDict[link.ModelID], link.StartModelID, link.EndModelID)
	}
	modelIDSlice := lo.FlatMap(links, func(item *model.TModelRelationLink, index int) []string {
		return []string{item.StartModelID, item.EndModelID}
	})
	//查询孤立节点
	nodes := make([]*model.TModelSingleNode, 0)
	err = r.DB(ctx).Where("model_id in ?", ids).Find(&nodes).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	singleNodeDict := lo.GroupBy(nodes, func(item *model.TModelSingleNode) string {
		return item.ModelID
	})
	singleNodeIDSlice := lo.Times(len(nodes), func(index int) string {
		return nodes[index].MetaModelID
	})
	//合并查询
	modelIDSlice = append(modelIDSlice, singleNodeIDSlice...)
	metaModels := make([]*model.TGraphModel, 0)
	err = r.DB(ctx).Where("id in ?", modelIDSlice).Find(&metaModels).Error
	if err != nil {
		return nil, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	modelDict := lo.SliceToMap(metaModels, func(item *model.TGraphModel) (string, *model.TGraphModel) {
		return item.ID, item
	})
	res = make(map[string][]string)
	for cid, mids := range linkDict {
		names := make([]string, 0)
		for _, mid := range mids {
			metaModel, ok := modelDict[mid]
			if !ok {
				continue
			}
			names = append(names, metaModel.BusinessName)
		}
		res[cid] = names
	}
	//循环处理下孤立节点
	for modelID, metaModelSlice := range singleNodeDict {
		names := res[modelID]
		names = append(names, lo.Times(len(metaModelSlice), func(index int) string {
			modelInfo, ok := modelDict[metaModelSlice[index].MetaModelID]
			if !ok {
				return ""
			}
			return modelInfo.BusinessName
		})...)
		res[modelID] = lo.Uniq(lo.Filter(names, func(item string, index int) bool {
			return item != ""
		}))
	}
	return res, err
}

func (r *repo) GetMetaUsedCount(ctx context.Context, metaModelID string) (count int64, err error) {
	//查询下有关系的ID
	relatedModels := make([]string, 0)
	db := r.DB(ctx).Model(new(model.TModelRelationLink)).Select("model_id").Distinct("model_id")
	if err = db.Where("start_model_id=? or end_model_id=?", metaModelID, metaModelID).Find(&relatedModels).Error; err != nil {
		return 0, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	//查询孤立节点
	singleModels := make([]string, 0)
	db = r.DB(ctx).Model(new(model.TModelSingleNode)).Select("model_id").Distinct("model_id")
	if err = db.Where("meta_model_id=?", metaModelID).Find(&singleModels).Error; err != nil {
		return 0, errorcode2.PublicDatabaseErr.Detail(err.Error())
	}
	return int64(len(lo.Uniq(append(relatedModels, singleModels...)))), err
}
