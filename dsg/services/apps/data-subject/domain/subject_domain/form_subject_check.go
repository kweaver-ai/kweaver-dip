package subject_domain

import (
	"context"
	"encoding/json"

	proErrorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

// NewRelationChecker 组织数据，检查数据，并返回关系
func (c *SubjectDomainUsecase) NewRelationChecker(ctx context.Context, formID string, formRelevanceObjects []*FormRelevanceObject) (*RelationChecker, error) {
	r := &RelationChecker{
		formRelevanceObjects: make([]*FormRelevanceObject, 0),
		formID:               formID,
		fieldIDSlice:         make([]string, 0),
		fieldDict:            make(map[string]int),
		attributes:           make([]string, 0),
		attributesDict:       make(map[string]int),
		relations:            make([]*model.FormBusinessObjectRelation, 0),
		objectIDSlice:        make([]string, 0),
		subjectDict:          make(map[string]*model.SubjectDomainWithRelation),
	}
	//如果没有业务对象，直接返回空
	if len(formRelevanceObjects) <= 0 {
		return r, nil
	}
	for i := range formRelevanceObjects {
		obj := formRelevanceObjects[i]
		r.objectIDSlice = append(r.objectIDSlice, obj.ObjectId)
		//如果逻辑实体为空，那就只关联到业务对象
		if len(obj.UpdateLogicalEntities) <= 0 {
			r.relations = append(r.relations, &model.FormBusinessObjectRelation{
				FormID:           formID,
				BusinessObjectID: obj.ObjectId,
			})
			continue
		}
		for j := range obj.UpdateLogicalEntities {
			logicEntity := obj.UpdateLogicalEntities[j]
			for k := range logicEntity.Attributes {
				relation := logicEntity.Attributes[k]
				r.relations = append(r.relations, &model.FormBusinessObjectRelation{
					FormID:           formID,
					BusinessObjectID: obj.ObjectId,
					LogicalEntityID:  logicEntity.Id,
					AttributeID:      relation.Id,
					FieldID:          relation.FieldId,
				})
				//过滤掉没有关系的
				if relation.Id == "" || relation.FieldId == "" {
					continue
				}
				r.fieldIDSlice = append(r.fieldIDSlice, relation.FieldId)
				r.fieldDict[relation.FieldId] = 1
				r.attributes = append(r.attributes, relation.Id)
				r.attributesDict[relation.Id] = 1
			}
		}
	}
	subjects, err := c.repo.GetObjectAndChildByIDSlice(ctx, r.objectIDSlice...)
	if err != nil {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	for i := range subjects {
		r.subjectDict[subjects[i].ID] = subjects[i]
	}
	return r, nil
}

type RelationChecker struct {
	formRelevanceObjects []*FormRelevanceObject
	formID               string
	fieldIDSlice         []string
	fieldDict            map[string]int
	attributes           []string
	attributesDict       map[string]int
	relations            []*model.FormBusinessObjectRelation
	objectIDSlice        []string
	subjectDict          map[string]*model.SubjectDomainWithRelation
}

func (r *RelationChecker) Relations() []*model.FormBusinessObjectRelation {
	return r.relations
}

func (r *RelationChecker) Check(ctx context.Context) error {
	//检查业务对象和属性是否存在
	if err := r.checkAttribute(); err != nil {
		return err
	}
	//检查业务表和字段信息是否存在
	if err := r.checkFormAndField(ctx); err != nil {
		return err
	}
	//检查字段和属性的关系，在一个业务表内，一个字段只能被一个属性关联
	if err := r.checkFieldAndPair(); err != nil {
		return err
	}
	return nil
}

// checkFormAndField 检查业务对象和属性是否存在
func (r *RelationChecker) checkFormAndField(ctx context.Context) error {
	formID := r.formID
	fieldIDSlice := r.fieldIDSlice
	if len(fieldIDSlice) <= 0 {
		return nil
	}

	detail, err := GetFormAndFieldInfo(ctx, formID, fieldIDSlice, nil)
	if err != nil {
		log.Error("查询业务表和业务字段信息错误", zap.Error(err), zap.ByteString("req", lo.T2(json.Marshal(fieldIDSlice)).A))
		return err
	}
	filedIDDict := make(map[string]struct{})
	for i := range fieldIDSlice {
		filedIDDict[fieldIDSlice[i]] = struct{}{}
	}
	for i := range detail.FormFieldInfoSlice {
		field := detail.FormFieldInfoSlice[i]
		if _, exist := filedIDDict[field.FieldID]; !exist {
			return errorcode.Desc(proErrorcode.FieldNotInFormExistError)
		}
	}
	return nil
}

// checkAttribute 校验业务对象和属性
func (r *RelationChecker) checkAttribute() error {
	objectIDSlice := r.objectIDSlice
	attributes := r.attributes
	subjectDict := r.subjectDict

	//校验业务对象
	for i := range objectIDSlice {
		id := objectIDSlice[i]
		if _, ok := subjectDict[id]; !ok {
			return errorcode.Desc(proErrorcode.RefBusinessObjectNotExist)
		}
	}
	//校验属性
	for i := range attributes {
		id := attributes[i]
		if _, ok := subjectDict[id]; !ok {
			return errorcode.Desc(proErrorcode.RefAttributeNotExistError)
		}
	}
	return nil
}

// 检查字段和属性的关系，在一个业务表内，一个字段只能被一个属性关联
func (r *RelationChecker) checkFieldAndPair() error {
	if len(r.attributes) != len(r.fieldDict) {
		return errorcode.Desc(proErrorcode.FieldOnlyRelatedOneAttributeError)
	}
	if len(r.attributes) != len(r.attributesDict) {
		return errorcode.Desc(proErrorcode.AttributeOnlyRelatedOneFieldError)
	}
	return nil
}
