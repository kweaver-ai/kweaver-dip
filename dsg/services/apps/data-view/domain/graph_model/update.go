package graph_model

import (
	"context"
	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/samber/lo"
	"strings"
)

type UpdateModelReqParam struct {
	request.IDReq  `param_type:"path"`
	UpdateModelReq `param_type:"body"`
}

type UpdateTopicModelMjReqParam struct {
	request.IDReq         `param_type:"path"`
	UpdateTopicModelMjReq `param_type:"body"`
}
type UpdateTopicModelMjReq struct {
	ID           string `json:"id" binding:"omitempty"`            // 模型ID
	GradeLabelId string `json:"grade_label_id" binding:"required"` //密级ID
}

type UpdateModelReq struct {
	ID            string                    `json:"id" binding:"omitempty"`                             // 模型ID
	BusinessName  string                    `json:"business_name" binding:"omitempty,VerifyName50d"`    // 模型名称，业务名称
	Description   string                    `json:"description"  binding:"TrimSpace,omitempty,lte=255"` // 描述
	TechnicalName string                    `json:"technical_name" binding:"omitempty,VerifyNameEN255"` // 模型技术名称
	Fields        []*model.TModelField      `json:"fields" binding:"omitempty"`                         // 元模型字段
	Relations     []*Relation               `json:"relations" binding:"omitempty,dive"`                 // 模型关系
	AllNodes      []*model.TModelSingleNode `json:"all_nodes" binding:"omitempty"`                      // 所有的节点
	SingleNodes   []*model.TModelSingleNode `json:"-"`                                                  // 孤立节点
}

type Relation struct {
	ID                  string          `json:"id" binding:"omitempty,uuid"`                        // 关系ID
	BusinessName        string          `json:"business_name" binding:"required,VerifyName50d"`     // 业务名称
	TechnicalName       string          `json:"technical_name" binding:"required,VerifyNameEN255"`  // 模型技术名称
	StartDisplayFieldID string          `json:"start_display_field_id" binding:"omitempty,uuid"`    // 起点显示属性
	EndDisplayFieldID   string          `json:"end_display_field_id" binding:"omitempty,uuid"`      // 终点显示属性
	Description         string          `json:"description"  binding:"TrimSpace,omitempty,lte=255"` // 描述
	Links               []*RelationLink `json:"links" binding:"required,gt=0,dive"`                 // 关联关系匹配的字段
}

type RelationLink struct {
	RelationID         string `json:"relation_id"  binding:"omitempty,uuid"`   // 模型关系ID
	StartModelID       string `json:"start_model_id"  binding:"required,uuid"` // 起点元模型ID
	StartModelName     string `json:"start_model_name"`                        // 起点模型名称
	StartModelTechName string `json:"start_model_tech_name"`                   // 起点模型技术名称
	StartFieldID       string `json:"start_field_id"  binding:"required,uuid"` // 起点字段ID
	StartFieldName     string `json:"start_field_name"`                        // 开始字段名称
	StartFieldTechName string `json:"start_field_tech_name"`                   // 开始字段名称
	EndModelID         string `json:"end_model_id"  binding:"required,uuid"`   // 终点元模型ID
	EndModelName       string `json:"end_model_name"`                          // 终点模型名称
	EndModelTechName   string `json:"end_model_tech_name"`                     // 终点模型技术名称
	EndFieldID         string `json:"end_field_id"  binding:"required,uuid"`   // 终点字段ID
	EndFieldName       string `json:"end_field_name"`                          // 终点字段名称
	EndFieldTechName   string `json:"end_field_tech_name"`                     // 终点字段技术名称
}

func (r *RelationLink) UniqueUID() string {
	ids := []string{r.StartModelID, r.StartFieldID, r.EndModelID, r.EndFieldID}
	return util.MD5(strings.Join(ids, ""))
}

func (m *UpdateModelReq) MetaModel(ctx context.Context) *model.TGraphModel {
	userInfo := util.ObtainUserInfo(ctx)
	obj := &model.TGraphModel{
		ID:            m.ID,
		BusinessName:  m.BusinessName,
		TechnicalName: m.TechnicalName,
		Description:   m.Description,
		UpdaterUID:    userInfo.ID,
		UpdaterName:   userInfo.Name,
	}
	for i := range m.Fields {
		m.Fields[i].ModelID = obj.ID
	}
	return obj
}

func (m *UpdateModelReq) CompositeModel(ctx context.Context) *model.TGraphModel {
	userInfo := util.ObtainUserInfo(ctx)
	return &model.TGraphModel{
		ID:           m.ID,
		BusinessName: m.BusinessName,
		Description:  m.Description,
		UpdaterUID:   userInfo.ID,
		UpdaterName:  userInfo.Name,
	}
}

// UniqSingleNodes 检查更新参数，将有关系的踢出去
func (m *UpdateModelReq) UniqSingleNodes() {
	relationModeDict := lo.SliceToMap(lo.FlatMap(m.Relations, func(relation *Relation, index int) []string {
		return lo.FlatMap(relation.Links, func(item *RelationLink, index int) []string {
			return []string{item.StartModelID, item.EndModelID}
		})
	}), func(item string) (string, int) {
		return item, 1
	})
	m.SingleNodes = lo.UniqBy(lo.Filter(m.AllNodes, func(item *model.TModelSingleNode, index int) bool {
		item.ModelID = m.ID
		return relationModeDict[item.MetaModelID] == 0
	}), func(node *model.TModelSingleNode) string {
		return node.MetaModelID
	})
}

func (m *UpdateModelReq) CompositeRelations(ctx context.Context) (relations []*model.TModelRelation, links []*model.TModelRelationLink) {
	relations = make([]*model.TModelRelation, 0)
	links = make([]*model.TModelRelationLink, 0)

	for _, relation := range m.Relations {
		//relations
		userInfo := util.ObtainUserInfo(ctx)
		relationObj := &model.TModelRelation{
			ID:                  relation.ID,
			BusinessName:        relation.BusinessName,
			TechnicalName:       relation.TechnicalName,
			ModelID:             m.ID,
			StartDisplayFieldID: relation.StartDisplayFieldID,
			EndDisplayFieldID:   relation.EndDisplayFieldID,
			Description:         relation.Description,
			UpdaterUID:          userInfo.ID,
			UpdaterName:         userInfo.Name,
		}
		if relationObj.ID == "" {
			relationObj.ID = uuid.NewString()
		}
		relations = append(relations, relationObj)
		//links
		for _, obj := range relation.Links {
			link := &model.TModelRelationLink{}
			copier.Copy(link, obj)
			link.UniqueID = obj.UniqueUID()
			link.ModelID = m.ID
			if link.RelationID == "" || link.RelationID != relationObj.ID {
				link.RelationID = relationObj.ID
			}
			links = append(links, link)
		}
	}
	return relations, links
}

// GenRelations 生成关系
func GenRelations(objs []*model.TModelRelation, links []*model.TModelRelationLink) (relations []*Relation) {
	linkGroup := lo.GroupBy(links, func(item *model.TModelRelationLink) string {
		return item.RelationID
	})
	for _, obj := range objs {
		relation := &Relation{Links: make([]*RelationLink, 0)}
		copier.Copy(relation, obj)
		//接上link
		dbLinks := linkGroup[obj.ID]
		if len(dbLinks) > 0 {
			copier.Copy(&relation.Links, dbLinks)
		}
		relations = append(relations, relation)
	}
	return relations
}

type UpdateModelLabelRecRelReqParam struct {
	request.IDReq             `param_type:"path"`
	UpdateModelLabelRecRelReq `param_type:"body"`
}

type UpdateModelLabelRecRelReq struct {
	ID               string   `json:"id" binding:"omitempty"`                                                                                                                                       // 推荐标签ID
	Name             string   `json:"name" binding:"required,VerifyName50d"`                                                                                                                        // 标签名称
	Description      string   `json:"description"  binding:"TrimSpace,omitempty,lte=300"`                                                                                                           // 描述
	RelatedModelsIds []string `json:"related_models" binding:"required,omitempty,min=1,max=10,dive" example:"[\"1e90d213-bed5-40ee-b897-b406b0374768\", \"2e90d213-bed5-40ee-b897-b406b0374769\"]"` //关联模型ID
}
