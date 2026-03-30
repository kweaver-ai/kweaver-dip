package subject_domain

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
)

type SubjectDomainRepo interface {
	GetObjectByID(ctx context.Context, id string) (*model.SubjectDomain, error)
	GetObjectAndChildByIDSlice(ctx context.Context, ids ...string) (objects []*model.SubjectDomainWithRelation, err error)
	GetObjectByIDNative(ctx context.Context, id string) (object *model.SubjectDomain, err error)
	GetBusinessObjectByIDS(ctx context.Context, ids []string) ([]*model.SubjectDomain, error)
	GetBusinessObjectAndLogicEntityByIDS(ctx context.Context, ids []string) ([]*model.SubjectDomain, error)
	GetObjectsByParentID(ctx context.Context, pathID string, objectType int8) ([]*model.SubjectDomain, error)
	GetByParentID(ctx context.Context, pathID string) ([]*model.SubjectDomain, error)
	Insert(ctx context.Context, m *model.SubjectDomain) error
	InsertBatch(ctx context.Context, subjectDomains []*model.SubjectDomain) error
	Delete(ctx context.Context, pathID string) error
	Update(ctx context.Context, m *model.SubjectDomain, objects []*model.SubjectDomain) error
	NameExistCheck(ctx context.Context, parentId, id, name string) (bool, error)
	UpdateBusinessObject(ctx context.Context, id, refID, updatedBy string, logicEntities []*model.SubjectDomain, attrs []*model.SubjectDomain) error
	GetDeleteEntityID(ctx context.Context, pathID string, updateID []string) ([]*data_view.MoveDelete, error)
	GetBatchDeleteEntityID(ctx context.Context, objectID []string, updateID []string) ([]*data_view.MoveDelete, error)
	BatchUpdateBusinessObject(ctx context.Context, formEntitiesID, objectIds []string, updatedBy string, entities []*model.SubjectDomain, deleteAttrs []string, updateAttrs []*model.SubjectDomain, addAttrs []*model.SubjectDomain) error
	CreateOrUpdateBusinessObject(ctx context.Context, isNew bool, businessObject *model.SubjectDomain, updatedBy string, logicEntities, attrs []*model.SubjectDomain) error
	GetByBusinessObjectId(ctx context.Context, objectId string) ([]*model.SubjectDomain, error)
	GetLevelCount(ctx context.Context, parentID string) (*model.SubjectDomainCount, []*SubjectDomainGroupCount, error)
	List(ctx context.Context, parentID string, isAll bool, req request.PageInfoWithKeyword, objectType string, needCount bool) ([]*model.SubjectDomain, int64, error)
	ListChild(ctx context.Context, parentID string, secondChild bool) ([]*model.SubjectDomain, error)
	GroupHasChild(ctx context.Context) (models map[string]bool, err error)
	GetAttributeByObject(ctx context.Context, id string) ([]string, error)
	GetFormAttributeByObject(ctx context.Context, id string, logicalEntityID []string) ([]string, error)
	GetAttributeByID(ctx context.Context, id string) ([]*model.SubjectDomain, error)
	GetSpecialChildByID(ctx context.Context, id string, childType int8) (child []*model.SubjectDomain, err error)
	GetBusinessObjectInfoByNames(ctx context.Context, names []string) ([]*model.SubjectDomain, error)
	GetDeletedSubjectDomains(ctx context.Context) ([]string, error)
	GetObjectByIDS(ctx context.Context, ids []string, objectType int8) ([]*model.SubjectDomain, error)
	NameExist(ctx context.Context, parentId string, name []string) error
	GetByIDS(ctx context.Context, ids []string) ([]*model.SubjectDomain, error)
	DeleteLabels(ctx context.Context, labelIDS []string) error
	GetAttribute(ctx context.Context, id, parent_id, keyword string, recommendAttributes []string) ([]*model.SubjectDomain, error)
	GetSubOrTopByID(ctx context.Context, id string) (objects []*model.SubjectDomain, err error)
	GetRootRelation(ctx context.Context) (map[string]string, error)
	GetSubjectByPathName(ctx context.Context, paths []string) (map[string]*CommonRest.DataSubjectInternal, error)
	GetAttribuitByPath(ctx context.Context, path string) (*model.SubjectDomain, error)
	GetObjectsByLogicEntityID(ctx context.Context, id string) (objects []*model.SubjectDomain, err error)
	ImportSubDomainsBatch(ctx context.Context, subjectDomains []*model.SubjectDomain) error
}

type SubjectDomainGroupCount struct {
	ID      string `gorm:"column:id" json:"id" binding:"required,uuid" example:"065dd8cb-d3bc-4cc1-b7ae-245d29d1682d"` //业务域分组的ID
	GroupId string `gorm:"column:name" json:"name" binding:"required" maxlength:"300" example:"业务域分组名称"`               //业务域分组名称
	Count   int64  `gorm:"column:count" json:"count" binding:"required,gte=0"  example:"3"`                            //逻辑实体数量
}
