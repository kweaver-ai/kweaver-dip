package classify

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/models/request"
)

type Repo interface {
	QueryGroupClassify(ctx context.Context, isOperator, openHierarchy bool, rootId ...string) ([]SubjectClassify, error)
	QueryGroupClassifyViews(ctx context.Context, subjectID string, isOperator bool, page request.PageInfo) (int64, []*FormViewSubjectField, error)
	QueryGroupClassifyFields(ctx context.Context, subjectID, formViewID string, isOperator bool, page request.PageInfo) (int64, []*FormViewSubjectField, error)
	QueryInterfaceCount(ctx context.Context, isOperator bool) (total int64, err error)
	QueryIndicatorCount(ctx context.Context) (total int64, err error)
}

//region  QueryRootClassify

// SubjectClassify 主题对象分类分级信息
type SubjectClassify struct {
	ID              string `json:"id" gorm:"column:id"`
	Name            string `json:"name" gorm:"column:name"`
	RootId          string `json:"root_id" gorm:"column:root_id"` //分级的标签ID
	ParentID        string `json:"-"`
	PathID          string `json:"path_id" gorm:"column:path_id"`               //分级的
	PathName        string `json:"path_name" gorm:"column:path_name"`           //分级的
	ClassifiedNum   int64  `json:"classified_num" gorm:"column:classified_num"` //业务域分组下字段总数
	LabelID         string `json:"label_id" gorm:"column:label_id"`             //分级标签ID
	LabelName       string `json:"-"`
	LabelSortWeight int    `json:"-"`
	LabelColor      string `json:"-"`
}

//endregion

type FormViewSubjectField struct {
	ID            string `json:"id" gorm:"column:id"`
	BusinessName  string `json:"business_name" gorm:"column:business_name"`
	TechnicalName string `json:"technical_name" gorm:"column:technical_name"`
	DataType      string `json:"data_type" gorm:"column:data_type"`   //字段的数据类型
	IsPrimary     bool   `json:"is_primary" gorm:"column:is_primary"` //是否是主键

	Schema      string `gorm:"column:schema" json:"schema"`             //数据库模式
	CatalogName string `gorm:"column:catalog_name" json:"catalog_name"` //数据源catalog名称

	ViewID            string `gorm:"column:view_id" json:"view_id"`                         //视图的ID，分组用
	ViewType          int32  `gorm:"column:view_type" json:"view_type"`                     //视图来源 1：元数据视图、2：自定义视图、3：逻辑实体视图
	ViewTechnicalName string `gorm:"column:view_technical_name" json:"view_technical_name"` //视图列技术名称
	ViewBusinessName  string `gorm:"column:view_business_name" json:"view_business_name"`   //视图列业务名称

	SubjectID   string `json:"subject_id" gorm:"column:subject_id"`     //属性ID
	SubjectName string `json:"subject_name" gorm:"column:subject_name"` //属性的名称
	PathID      string `json:"path_id" gorm:"column:path_id"`           //ID的路径
	PathName    string `json:"path_name" gorm:"column:path_name"`       //属性的名称路径

	LabelID string `json:"label_id" gorm:"column:label_id"` //分级标签ID
}

func (f *FormViewSubjectField) FixCatalog() {
	if f.ViewType == constant.LogicViewType {
		f.CatalogName = constant.LogicViewSourceCatalogName
		f.Schema = constant.CommonViewSchema
	}
	if f.ViewType == constant.CustomViewType {
		f.CatalogName = constant.CustomViewSourceCatalogName
		f.Schema = constant.CommonViewSchema
	}
}
