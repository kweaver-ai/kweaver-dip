package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"
	kafka_pub "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/kafka"
	data_subject "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"encoding/json"
	"go.uber.org/zap"
	"strings"
)

type esRepo struct {
	configurationCenterDriven configuration_center.Driven
	kafkaPub                  kafka_pub.KafkaPub
	userRepo                  user.UserRepo
	DrivenDataSubject         data_subject.DrivenDataSubject
}

func NewESRepo(
	configurationCenterDriven configuration_center.Driven,
	kafkaPub kafka_pub.KafkaPub,
	userRepo user.UserRepo,
	DrivenDataSubject data_subject.DrivenDataSubject,
) es.ESRepo {
	return &esRepo{
		configurationCenterDriven: configurationCenterDriven,
		kafkaPub:                  kafkaPub,
		userRepo:                  userRepo,
		DrivenDataSubject:         DrivenDataSubject,
	}
}

func (l *esRepo) PubToES(ctx context.Context, logicView *model.FormView, fieldObjs []*es.FieldObj) (err error) {
	cateInfos := make([]*es.CateInfo, 0)
	if logicView.SubjectId.String != "" {
		object, err := l.DrivenDataSubject.GetsObjectById(ctx, logicView.SubjectId.String)
		if err != nil {
			log.WithContext(ctx).Error("PubToES GetsObjectById error", zap.Error(err))
		} else {
			cateInfos = append(cateInfos, &es.CateInfo{
				CateId:   constant.SubjectCateId,
				NodeId:   logicView.SubjectId.String,
				NodeName: object.Name,
				NodePath: object.PathName,
			})
		}
	}
	if logicView.DepartmentId.String != "" {
		departments, err := l.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{logicView.DepartmentId.String})
		if err != nil {
			log.WithContext(ctx).Error("PubToES GetDepartmentPrecision error", zap.Error(err))
		} else {
			if departments == nil || len(departments.Departments) != 1 || departments.Departments[0].DeletedAt != 0 {
				return errorcode.Desc(my_errorcode.DepartmentIDNotExist)
			}
			cateInfos = append(cateInfos, &es.CateInfo{
				CateId:   constant.DepartmentCateId,
				NodeId:   logicView.DepartmentId.String,
				NodeName: departments.Departments[0].Name,
				NodePath: departments.Departments[0].Path,
			})
		}
	}
	formViewESIndex := es.FormViewESIndex{
		Type: "create",
		Body: es.FormViewESIndexBody{
			ID:              logicView.ID,
			DocID:           logicView.ID,
			Code:            logicView.UniformCatalogCode,
			Name:            logicView.BusinessName,
			NameEn:          logicView.TechnicalName,
			Description:     logicView.Description.String,
			UpdatedAt:       logicView.UpdatedAt.UnixMilli(),
			IsPublish:       util.CE(logicView.PublishAt != nil, true, false).(bool),
			IsOnline:        util.CE(logicView.OnlineStatus == constant.LineStatusOnLine || logicView.OnlineStatus == constant.LineStatusDownReject, true, false).(bool),
			PublishedStatus: util.CE(logicView.PublishAt != nil, constant.PublishStatusPublished, constant.PublishStatusUnPublished).(string),
			OnlineStatus:    logicView.OnlineStatus,
			FieldCount:      len(fieldObjs),
			Fields:          fieldObjs,
			CateInfos:       cateInfos,
		},
	}
	if logicView.PublishAt != nil {
		formViewESIndex.Body.PublishedAt = logicView.PublishAt.UnixMilli()
	}
	if logicView.OnlineTime != nil {
		formViewESIndex.Body.OnlineAt = logicView.OnlineTime.UnixMilli()
	}
	if logicView.OwnerId.String != "" {
		ownerInfos, err := l.userRepo.GetByUserIds(ctx, strings.Split(logicView.OwnerId.String, constant.OwnerIdSep))
		if err != nil {
			log.Error(err.Error())
		}
		ownerName := make([]string, len(ownerInfos))
		for i, m := range ownerInfos {
			ownerName[i] = m.Name
		}
		formViewESIndex.Body.OwnerID = logicView.OwnerId.String
		formViewESIndex.Body.OwnerName = strings.Join(ownerName, constant.OwnerNameSep)
	}
	//序列化发送
	formViewESIndexByte, err := json.Marshal(formViewESIndex)
	if err != nil {
		log.WithContext(ctx).Error("FormView Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	}
	log.WithContext(ctx).Info("logicViewRepo PubToES " + string(formViewESIndexByte))
	if err = l.kafkaPub.SyncProduce(constant.FormViewPublicTopic, util.StringToBytes(logicView.ID), formViewESIndexByte); err != nil {
		log.WithContext(ctx).Error("FormView Public To ES Error", zap.Error(err))
	}
	return nil
}
func (l *esRepo) DeletePubES(ctx context.Context, id string) (err error) {
	var formViewESIndexByte []byte
	formViewESIndex := es.FormViewESIndex{
		Type: "delete",
		Body: es.FormViewESIndexBody{
			DocID: id,
		},
	}
	formViewESIndexByte, err = json.Marshal(formViewESIndex)
	if err != nil {
		log.WithContext(ctx).Error("FormView Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	} else {
		if err = l.kafkaPub.SyncProduce(constant.FormViewPublicTopic, util.StringToBytes(id), formViewESIndexByte); err != nil {
			log.WithContext(ctx).Error("FormView Public To ES Error", zap.Error(err))
		}
	}
	return nil
}
