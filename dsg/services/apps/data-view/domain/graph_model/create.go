package graph_model

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/google/uuid"
)

type ModelNameCheckReqParam struct {
	ModelNameCheckReq `param_type:"query"`
}

type ModelNameCheckReq struct {
	ID            string `json:"id" form:"id" binding:"omitempty"`                                       // 模型ID
	BusinessName  string `json:"business_name" form:"business_name"  binding:"omitempty,VerifyName"`     // 模型名称，业务名称
	TechnicalName string `json:"technical_name" form:"technical_name"  binding:"omitempty,VerifyNameEN"` // 模型技术名称
}

func (m *ModelNameCheckReq) Name() string {
	if m.BusinessName != "" {
		return m.BusinessName
	}
	return m.TechnicalName
}

type CreateModelReqParam struct {
	CreateModelReq `param_type:"body"`
}

type CreateModelReq struct {
	BusinessName  string               `json:"business_name" binding:"required,VerifyName50d"`                                // 模型名称，业务名称
	Description   string               `json:"description"  binding:"TrimSpace,omitempty,lte=255"`                            // 描述
	SubjectID     string               `json:"subject_id" binding:"TrimSpace,required,uuid"`                                  // 业务对象ID
	ModelType     string               `json:"model_type" binding:"required,oneof=meta topic thematic"`                       // 模型类型meta,topic,thematic
	TechnicalName string               `json:"technical_name" binding:"required_if=ModelType meta,omitempty,VerifyNameEN255"` // 模型技术名称
	CatalogID     constant.ModelID     `json:"catalog_id" binding:"required_if=ModelType meta"`                               // 目录的主键ID
	DataViewID    string               `json:"-"`                                                                             // 目录带的元数据视图ID
	Fields        []*model.TModelField `json:"fields" binding:"required_if=ModelType meta,omitempty,gt=0"`                    // 元模型字段
}

func (m *CreateModelReq) MetaModel(ctx context.Context) *model.TGraphModel {
	userInfo := util.ObtainUserInfo(ctx)
	obj := &model.TGraphModel{
		ID:            uuid.NewString(),
		BusinessName:  m.BusinessName,
		TechnicalName: m.TechnicalName,
		SubjectID:     m.SubjectID,
		CatalogID:     m.CatalogID.Uint64(),
		DataViewID:    m.DataViewID,
		Description:   m.Description,
		UpdaterUID:    userInfo.ID,
		UpdaterName:   userInfo.Name,
		CreatorUID:    userInfo.ID,
	}
	for i := range m.Fields {
		m.Fields[i].ModelID = obj.ID
	}
	return obj
}

func (m *CreateModelReq) CompositeModel(ctx context.Context) *model.TGraphModel {
	userInfo := util.ObtainUserInfo(ctx)
	return &model.TGraphModel{
		ID:           uuid.NewString(),
		BusinessName: m.BusinessName,
		SubjectID:    m.SubjectID,
		ModelType:    enum.ToInteger[constant.GraphModelType](m.ModelType).Int32(),
		Description:  m.Description,
		UpdaterUID:   userInfo.ID,
		UpdaterName:  userInfo.Name,
		CreatorUID:   userInfo.ID,
	}
}

type CreateModelLabelRecRelReqParam struct {
	CreateModelLabelRecRelReq `param_type:"body"`
}

type CreateModelLabelRecRelReq struct {
	Name             string   `json:"name" binding:"required,VerifyName50d"`                                                                                                                        // 标签名称
	Description      string   `json:"description"  binding:"TrimSpace,omitempty,lte=300"`                                                                                                           // 描述
	RelatedModelsIds []string `json:"related_models" binding:"required,omitempty,min=0,max=10,dive" example:"[\"1e90d213-bed5-40ee-b897-b406b0374768\", \"2e90d213-bed5-40ee-b897-b406b0374769\"]"` //关联模型ID
}
