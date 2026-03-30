package subject_domain

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"

	bg "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/business-grooming"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/standard_info"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
)

// AttributeGrouper 逻辑实体属性分组工具
type AttributeGrouper struct {
	formInfo            *bg.FormInfo
	fieldInfoMap        map[string]*bg.FormFieldInfo
	pureLogicalEntities []*PureLogicalEntity
	tempAttributes      map[string][]*AttributeWithField
	standardInfoDict    map[uint64]*StandardInfo
	standard            standard_info.StandardInfoRepo
	ccDriven            configuration_center.Driven
}

type FormAndFieldInfo struct {
	bg.FormAndFieldInfoResp
	standard         standard_info.StandardInfoRepo
	formFieldInfoMap map[string]*bg.FormFieldInfo
	// standardDict                 map[string]*StandardInfo
	ccDriven configuration_center.Driven
}

func NewFormAndFieldInfo(standard standard_info.StandardInfoRepo, ccDriven configuration_center.Driven, formID string) *FormAndFieldInfo {
	return &FormAndFieldInfo{
		FormAndFieldInfoResp: bg.FormAndFieldInfoResp{
			FormInfo:           &bg.FormInfo{BusinessFormID: formID},
			FormFieldInfoSlice: make([]*bg.FormFieldInfo, 0),
		},
		standard: standard,
		ccDriven: ccDriven,
	}
}

func (f *FormAndFieldInfo) NewAttributeGrouper(standardInfoSlice []*model.StandardInfo) *AttributeGrouper {
	//字段是一个单独的map，所有业务对象共享的
	f.formFieldInfoMap = make(map[string]*bg.FormFieldInfo)
	for i := range f.FormFieldInfoSlice {
		f.formFieldInfoMap[f.FormFieldInfoSlice[i].FieldID] = f.FormFieldInfoSlice[i]
	}
	standardInfoDict := make(map[uint64]*StandardInfo)
	for i := range standardInfoSlice {
		standardInfoDict[standardInfoSlice[i].ID] = NewStandardInfo(standardInfoSlice[i])
	}
	return &AttributeGrouper{
		formInfo:         f.FormInfo,
		fieldInfoMap:     f.formFieldInfoMap,
		standard:         f.standard,
		standardInfoDict: standardInfoDict,
		ccDriven:         f.ccDriven,
	}
}

// Group 将业务表的几个业务对象分组
func (a *AttributeGrouper) Group(ctx context.Context, objects []*model.SubjectDomainWithRelation) *GetFormFiledRelevanceObjectRes {
	//按照每个业务对象，将逻辑实体和属性分组
	arrDict := make(map[string][]*model.SubjectDomainWithRelation)
	for i := range objects {
		obj := objects[i]
		arrDict[obj.RelatedObjectID] = append(arrDict[obj.RelatedObjectID], obj)
	}

	//构造返回体
	res := &GetFormFiledRelevanceObjectRes{
		FormID: a.formInfo.BusinessFormID,
	}
	//根据每一组中的值，再次按照逻辑实体和属性分组
	for _, arr := range arrDict {
		res.SubjectInfos = append(res.SubjectInfos, a.group(ctx, arr))
	}
	return res
}

// init 初始化临时空间
func (a *AttributeGrouper) init() {
	a.pureLogicalEntities = make([]*PureLogicalEntity, 0)
	a.tempAttributes = make(map[string][]*AttributeWithField)
}

// group  对某个业务对象分组
func (a *AttributeGrouper) group(ctx context.Context, objects []*model.SubjectDomainWithRelation) FormSubjectDetail {
	a.init()
	formSubjectDetail := FormSubjectDetail{
		LogicalEntity: make([]*LogicalEntity, 0),
	}
	for _, object := range objects {
		switch object.Type {
		case constant.BusinessObject, constant.BusinessActivity: //业务对象/业务活动
			formSubjectDetail.ID = object.ID
			formSubjectDetail.Name = object.Name
			formSubjectDetail.Type = constant.SubjectDomainObjectIntToString(object.Type)
		case constant.LogicEntity: //逻辑实体
			a.pureLogicalEntities = append(a.pureLogicalEntities, &PureLogicalEntity{
				ID:   object.ID,
				Name: object.Name,
			})
		case constant.Attribute: //属性
			a.dealWithAttribute(ctx, object)
		}
	}
	logicalEntities := make([]*LogicalEntity, 0)
	for _, l := range a.pureLogicalEntities {
		if len(a.tempAttributes[l.ID]) != 0 {
			logicalEntity := &LogicalEntity{
				PureLogicalEntity: *l,
				Attributes:        a.tempAttributes[l.ID],
			}
			logicalEntities = append(logicalEntities, logicalEntity)
		}
	}
	formSubjectDetail.LogicalEntity = logicalEntities
	return formSubjectDetail
}

// dealWithAttribute  处理属性，将属性分组，区分：未关联，关联本表的，关联其他表的
func (a *AttributeGrouper) dealWithAttribute(ctx context.Context, subject *model.SubjectDomainWithRelation) {
	arr := strings.Split(subject.PathID, "/")
	parentID := arr[len(arr)-2]
	var unique bool
	if subject.Unique == 1 {
		unique = true
	}

	var labelName, labelIcon, labelPath, labelID string
	if subject.LabelID != 0 {
		labelID = strconv.Itoa(int(subject.LabelID))
		labelInfo, err := a.ccDriven.GetLabelById(ctx, labelID)
		if err != nil {
			labelName = ""
			labelIcon = ""
			labelPath = ""
		} else {
			labelName = labelInfo.Name
			labelIcon = labelInfo.LabelIcon
			labelPath = labelInfo.LabelPath
		}
	}
	fieldInfo, ok := a.fieldInfoMap[subject.RelatedFieldID]
	//如果未关联业务表属性, 或者关联的字段被删除了
	if subject.RelatedFieldID == "" || !ok {
		if a.tempAttributes[parentID] == nil {
			a.tempAttributes[parentID] = make([]*AttributeWithField, 0)
		}
		a.tempAttributes[parentID] = append(a.tempAttributes[parentID], &AttributeWithField{
			ID:           subject.ID,
			Name:         subject.Name,
			Unique:       unique,
			LabelID:      labelID,
			LabelName:    labelName,
			LabelIcon:    labelIcon,
			LabelPath:    labelPath,
			StandardInfo: a.getAttributeStandardInfo(subject.StandardID, labelID, labelName, labelIcon, labelPath),
		})
		return
	}
	//关联的是本表
	if a.tempAttributes[parentID] == nil {
		a.tempAttributes[parentID] = make([]*AttributeWithField, 0)
	}
	a.tempAttributes[parentID] = append(a.tempAttributes[parentID], &AttributeWithField{
		ID:                subject.ID,
		Name:              subject.Name,
		Unique:            unique,
		LabelID:           labelID,
		LabelName:         labelName,
		LabelIcon:         labelIcon,
		LabelPath:         labelPath,
		StandardInfo:      a.getAttributeStandardInfo(subject.StandardID, labelID, labelName, labelIcon, labelPath),
		FieldID:           subject.RelatedFieldID,
		FieldName:         fieldInfo.FieldName,
		FieldStandardInfo: NewStandardInfoFromBG(fieldInfo.StandardInfo),
	})
}

func (a *AttributeGrouper) getAttributeStandardInfo(standardID uint64, labelId, labelName, labelIcon, labelPath string) *StandardInfo {
	if standardID <= 0 {
		return nil
	}
	standardInfo := &StandardInfo{
		ID: fmt.Sprintf("%v", standardID),
	}
	stand, ok := a.standardInfoDict[standardID]
	stand.LabelID = labelId
	stand.LabelName = labelName
	stand.LabelIcon = labelIcon
	stand.LabelPath = labelPath
	if ok {
		standardInfo = stand
	}
	return standardInfo
}
