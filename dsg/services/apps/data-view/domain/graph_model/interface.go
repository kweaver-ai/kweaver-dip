package graph_model

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/samber/lo"
)

type UseCase interface {
	GraphModel
	Canvas
}
type GraphModel interface {
	CheckNameExist(ctx context.Context, req *ModelNameCheckReq) error
	Create(ctx context.Context, req *CreateModelReq) (*response.IDResp, error)
	Update(ctx context.Context, req *UpdateModelReq) (*response.IDResp, error)
	Get(ctx context.Context, req *request.IDReq) (*ModelDetail, error)
	List(ctx context.Context, req *ModelListReq) (*response.PageResult[ModeListItem], error)
	Delete(ctx context.Context, req *request.IDReq) (*response.IDResp, error)
	UpdateTopicModelMj(ctx context.Context, req *UpdateTopicModelMjReq) (*response.IDResp, error)
	QueryTopicModelLabelRecList(ctx context.Context, req *request.PageSortKeyword3) (*response.PageResult[ModelLabelRecRelResp], error)
	CreateTopicModelLabelRec(ctx context.Context, req *CreateModelLabelRecRelReq) (*response.IDResp, error)
	UpdateTopicModelLabelRec(ctx context.Context, req *UpdateModelLabelRecRelReq) (*response.IDResp, error)
	GetTopicModelLabelRec(ctx context.Context, req *request.IDReq) (*ModelLabelRecRelResp, error)
	DeleteTopicModelLabelRec(ctx context.Context, req *request.IDReq) (*response.IDResp, error)
}

type ModelDetail struct {
	ID              string               `json:"id"`                          // 主键ID，uuid
	BusinessName    string               `json:"business_name"`               // 模型名称，业务名称
	TechnicalName   string               `json:"technical_name,omitempty"`    // 模型技术名称
	CatalogID       string               `json:"catalog_id"`                  // 目录的主键ID
	CatalogName     string               `json:"catalog_name"`                // 目录的名称
	DataViewID      string               `json:"data_view_id"`                // 目录带的元数据视图ID
	DataViewName    string               `json:"data_view_name"`              // 视图名称
	SubjectID       string               `json:"subject_id"`                  // 业务对象ID
	SubjectName     string               `json:"subject_name"`                // 业务对象名称
	Description     string               `json:"description"`                 // 描述
	UsedCount       *int64               `json:"used_count,omitempty"`        // 被其他复合模型引用的次数
	GraphID         int                  `json:"graph_id"`                    //  图谱ID
	DisplayFieldKey string               `json:"display_field_key,omitempty"` // 显示属性, 只有在MetaModelSlice里面才会有
	MetaModelSlice  []*ModelDetail       `json:"meta_model_slice,omitempty"`  // 元模型
	CreatedAt       common.Time          `json:"created_at"`                  // 创建时间
	UpdatedAt       common.Time          `json:"updated_at"`                  // 更新时间
	Fields          []*model.TModelField `json:"fields,omitempty"`            // 元模型字段
	Relations       []*Relation          `json:"relations,omitempty"`         // 复合模型的关系
	GradeLabelName  string               ` json:"grade_label_Name"`           //密级名称
	GradeLabelId    string               `json:"grade_label_id"`              //密级ID
	GradeLabelIcon  string               `json:"grade_label_icon"`            //密级icon
}

type ModeListItem struct {
	ID             string      `gorm:"column:id" json:"id"`                                    // 主键ID，uuid
	BusinessName   string      `gorm:"column:business_name" json:"business_name"`              // 模型名称，业务名称
	TechnicalName  string      `gorm:"column:technical_name" json:"technical_name"`            // 模型技术名称
	CatalogID      string      `gorm:"column:catalog_id" json:"catalog_id"`                    // 目录的主键ID
	DataViewID     string      `gorm:"column:data_view_id" json:"data_view_id"`                // 目录带的元数据视图ID
	DisplayFieldID string      `gorm:"column:display_field_id" json:"display_field_id"`        // 模型显示字段ID
	Description    string      `gorm:"column:description" json:"description"`                  // 描述
	CreatedAt      common.Time `gorm:"column:created_at" json:"created_at"`                    // 创建时间
	CreatorUID     string      `json:"creator_uid"`                                            // 创建用户ID
	CreatedName    string      `json:"created_name"`                                           // 创建人
	UpdatedAt      common.Time `gorm:"column:updated_at" json:"updated_at"`                    // 更新时间
	UpdaterUID     string      `gorm:"column:updater_uid;comment:更新用户ID" json:"updater_uid"`   // 更新用户ID
	UpdaterName    string      `gorm:"column:updater_name;comment:更新用户名称" json:"updater_name"` // 更新用户名称
	MetaModel      []string    `gorm:"-" json:"meta_model"`                                    // 关联的元模型名称
	GradeLabelName string      ` json:"grade_label_Name"`                                      //密级名称
	GradeLabelId   string      `json:"grade_label_id"`                                         //密级ID
	GradeLabelIcon string      `json:"grade_label_icon"`                                       //密级icon
}

type ModelListReqParam struct {
	ModelListReq `param_type:"query"`
}

type ModelListReq struct {
	ModelType string `json:"model_type" form:"model_type" binding:"required,oneof=meta topic thematic"` // 模型类型 meta元模型,topic专题模型,thematic主题模型
	SubjectID string `json:"subject_id" form:"subject_id" binding:"omitempty,uuid"`                     // 基础信息分类ID
	OnlySelf  bool   `json:"only_self" form:"only_self" binding:"omitempty"`                            // 是否只查询自己创建的
	UserID    string `json:"-"`                                                                         // 当前用户的ID
	request.KeywordInfo
	request.PageInfo
	Direction string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                                              // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at business_name technical_name"  default:"created_at"` // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序；name：按名称排序。默认按创建时间排序
}

type TopicModelLabelRecListReqParam struct {
	request.PageSortKeyword3 `param_type:"query"`
}

func AddRelationMetaDisplayKey(metaModelSlice []*ModelDetail, relations []*Relation) {
	modelDict := lo.SliceToMap(metaModelSlice, func(item *ModelDetail) (string, map[string]*model.TModelField) {
		return item.ID, lo.SliceToMap(item.Fields, func(data *model.TModelField) (string, *model.TModelField) {
			return data.FieldID, data
		})
	})
	displayKeyDict := make(map[string]string)
	for i := range relations {
		for j := range relations[i].Links {
			link := relations[i].Links[j]
			//开始节点
			startModelFieldDict, ok := modelDict[link.StartModelID]
			if !ok {
				continue
			}
			startDisplayField, ok := startModelFieldDict[relations[i].StartDisplayFieldID]
			if !ok {
				continue
			}
			displayKeyDict[link.StartModelID] = startDisplayField.TechnicalName
			//结束节点
			endModelFieldDict, ok := modelDict[link.EndModelID]
			if !ok {
				continue
			}
			endDisplayField, ok := endModelFieldDict[relations[i].EndDisplayFieldID]
			if !ok {
				continue
			}
			displayKeyDict[link.EndModelID] = endDisplayField.TechnicalName
		}
	}
	for i := range metaModelSlice {
		if metaModelSlice[i].DisplayFieldKey == "" {
			metaModelSlice[i].DisplayFieldKey = displayKeyDict[metaModelSlice[i].ID]
		}
	}
}

type TopicModelMJListReqParam struct {
	request.PageSortKeyword3 `param_type:"query"`
}

type ModelLabelRecRelResp struct {
	ID            string               `json:"id"`                       // 主键ID
	Name          string               `json:"name"`                     // 名称
	Description   string               `json:"description"`              // 描述
	RelatedModels []*RelatedModelsResp `json:"related_models,omitempty"` // 模型标签关联
	CreatedAt     common.Time          `json:"created_at"`               // 创建时间
	UpdatedAt     common.Time          `json:"updated_at"`               // 更新时间
	CreatedName   string               `json:"created_by"`               // 创建人
	UpdaterName   string               `json:"updated_by"`               // 更新人
}

type RelatedModelsResp struct {
	ID   string `json:"id" `  // 模型ID
	Name string `json:"name"` // 模型名称
}
