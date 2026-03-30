package impl

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/label"

	"github.com/Shopify/sarama"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type esRepo struct {
	kafkaPub            sarama.SyncProducer
	dataViewDriven      data_view.Driven
	configurationCenter configuration_center.Driven
	label               label.Driven
}

func NewESRepo(
	kafkaPub sarama.SyncProducer,
	dataViewDriven data_view.Driven,
	config configuration_center.Driven,
	label label.Driven,
) es.ESRepo {
	return &esRepo{
		kafkaPub:            kafkaPub,
		dataViewDriven:      dataViewDriven,
		configurationCenter: config,
		label:               label,
	}
}

const TOPIC_PUB_KAFKA_ES_INDEX_ASYNC = "af.data-catalog.es-index"

// const TOPIC_ElecLicence_PUB_KAFKA_ES_INDEX_ASYNC = "af.elec-licence.es-index"
const TOPIC_ElecLicence_PUB_KAFKA_ES_INDEX_ASYNC = "af.elec-license.es-index"

func (l *esRepo) PubApplyNumToES(ctx context.Context, catalogId uint64, applyNum int64) error {
	esIndexMsgEntity := es.ESIndexMsgEntity{
		Type: "apply",
		Body: &es.ESIndexMsgBody{
			DocID:    strconv.FormatUint(catalogId, 10),
			ApplyNum: applyNum,
		},
	}

	//序列化发送
	esIndexMsgEntityByte, err := json.Marshal(esIndexMsgEntity)
	if err != nil {
		log.WithContext(ctx).Error("catalog Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	}
	log.WithContext(ctx).Info("catalogRepo PubToES " + string(esIndexMsgEntityByte))
	if _, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
		Topic: TOPIC_PUB_KAFKA_ES_INDEX_ASYNC,
		Key:   sarama.ByteEncoder(strconv.FormatUint(catalogId, 10)),
		Value: sarama.ByteEncoder(esIndexMsgEntityByte),
	}); err != nil {
		log.WithContext(ctx).Error("catalog Public To ES Error", zap.Error(err))
	}
	return nil
}
func (l *esRepo) PubToES(ctx context.Context, catalog *model.TDataCatalog, mountResources []*es.MountResources, businessObjects []*es.BusinessObject, cateInfos []*es.CateInfo, columns []*model.TDataCatalogColumn) (err error) {
	// var businessUpdateTime string
	// for _, resource := range mountResources {
	// 	if resource.Type == "data_view" && len(resource.IDs) > 0 {
	// 		updateTimeRes, err := l.dataViewDriven.GetViewBusinessUpdateTime(ctx, resource.IDs[0])
	// 		if err != nil && !(err.Error() == "未标记业务更新时间字段" || err.Error() == "DataView.FormView.BusinessTimestampNotFound") {
	// 			log.WithContext(ctx).Error("【PubToES】 GetViewBusinessUpdateTime error", zap.Error(err))
	// 		}
	// 		if updateTimeRes != nil {
	// 			businessUpdateTime = updateTimeRes.BusinessUpdateTime
	// 		}
	// 	}

	// }
	fieldObjs := make([]*es.Field, len(columns))
	for i, column := range columns {
		fieldObjs[i] = &es.Field{
			FieldNameZH: column.BusinessName,
			FieldNameEN: column.TechnicalName,
		}
	}
	var sourceDepartment string
	if catalog.SourceDepartmentID != "" {
		department, err := l.configurationCenter.GetDepartmentPrecision(ctx, []string{catalog.SourceDepartmentID})
		if err != nil {
			return err
		}
		if len(department.Departments) > 0 {
			sourceDepartment = department.Departments[0].Name
		}
	}
	esIndexMsgEntity := es.ESIndexMsgEntity{
		Type: "create",
		Body: &es.ESIndexMsgBody{
			DocID:            strconv.FormatUint(catalog.ID, 10),
			ID:               strconv.FormatUint(catalog.ID, 10),
			Name:             catalog.Title,
			Code:             catalog.Code,
			Description:      catalog.Description,
			SharedType:       catalog.SharedType,
			DataRange:        catalog.DataRange,
			UpdateCycle:      catalog.UpdateCycle,
			UpdatedAt:        catalog.UpdatedAt.UnixMilli(),
			PublishedStatus:  catalog.PublishStatus,
			IsPublish:        util.CE(catalog.PublishStatus == constant.PublishStatusPublished || catalog.PublishStatus == constant.PublishStatusChAuditing || catalog.PublishStatus == constant.PublishStatusChReject, true, false).(bool),
			OnlineStatus:     catalog.OnlineStatus,
			IsOnline:         util.CE(catalog.OnlineStatus == constant.LineStatusOnLine || catalog.OnlineStatus == constant.LineStatusDownAuditing || catalog.OnlineStatus == constant.LineStatusDownReject, true, false).(bool),
			SourceDepartment: sourceDepartment,
			DataUpdatedAt:    0, // businessUpdateTime,
			ApplyNum:         catalog.ApplyNum,
			MountResources:   mountResources,
			BusinessObjects:  businessObjects,
			CateInfos:        cateInfos,
			Fields:           fieldObjs,
		},
	}
	if catalog.PublishedAt != nil {
		esIndexMsgEntity.Body.PublishedAt = catalog.PublishedAt.UnixMilli()
	}
	if catalog.OnlineTime != nil {
		esIndexMsgEntity.Body.OnlineAt = catalog.OnlineTime.UnixMilli()
	}

	//序列化发送
	esIndexMsgEntityByte, err := json.Marshal(esIndexMsgEntity)
	if err != nil {
		log.WithContext(ctx).Error("catalog Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	}
	log.WithContext(ctx).Info("catalogRepo PubToES " + string(esIndexMsgEntityByte))
	if _, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
		Topic: TOPIC_PUB_KAFKA_ES_INDEX_ASYNC,
		Key:   sarama.ByteEncoder(strconv.FormatUint(catalog.ID, 10)),
		Value: sarama.ByteEncoder(esIndexMsgEntityByte),
	}); err != nil {
		log.WithContext(ctx).Error("catalog Public To ES Error", zap.Error(err))
	}
	return nil
}
func (l *esRepo) DeletePubES(ctx context.Context, id string) (err error) {
	var esIndexMsgEntityByte []byte
	esIndexMsgEntity := es.ESIndexMsgEntity{
		Type: "delete",
		Body: &es.ESIndexMsgBody{
			DocID: id,
		},
	}
	esIndexMsgEntityByte, err = json.Marshal(esIndexMsgEntity)
	if err != nil {
		log.WithContext(ctx).Error("catalog Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	} else {
		if _, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
			Topic: TOPIC_PUB_KAFKA_ES_INDEX_ASYNC,
			Key:   sarama.ByteEncoder(util.StringToBytes(id)),
			Value: sarama.ByteEncoder(esIndexMsgEntityByte),
		}); err != nil {
			log.WithContext(ctx).Error("catalog Public To ES Error", zap.Error(err))
		}
	}
	return nil
}

const TOPIC_PUB_KAFKA_ES_INFO_CATALOG_INDEX = "af.info-catalog.es-index"

func (l *esRepo) CreateInfoCatalog(ctx context.Context, msgBody *info_resource_catalog.EsIndexCreateMsgBody) (err error) {
	if msgBody.LabelIds != "" && len(msgBody.LabelIds) > 0 {
		labelList, err := l.label.GetLabelByIds(ctx, strings.Split(msgBody.LabelIds, ","))
		if err == nil {
			msgBody.LabelListResp = labelList.LabelResp
		}
	}

	// [组装消息]
	entity := map[string]any{
		"type": "create",
		"body": msgBody,
	}
	value, err := json.Marshal(entity)
	if err != nil {
		return
	} // [/]
	// [发送消息]
	_, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
		Topic: TOPIC_PUB_KAFKA_ES_INFO_CATALOG_INDEX,
		Value: sarama.ByteEncoder(value),
	}) // [/]
	return
}

func (l *esRepo) UpdateInfoCatalog(ctx context.Context, msgBody *info_resource_catalog.EsIndexUpdateMsgBody) (err error) {

	// [组装消息]
	entity := map[string]any{
		"type": "update",
		"body": msgBody,
	}
	value, err := json.Marshal(entity)
	if err != nil {
		return
	} // [/]
	// [发送消息]
	_, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
		Topic: TOPIC_PUB_KAFKA_ES_INFO_CATALOG_INDEX,
		Value: sarama.ByteEncoder(value),
	}) // [/]
	return
}

func (l *esRepo) DeleteInfoCatalog(ctx context.Context, docID string) (err error) {
	// [组装消息]
	entity := map[string]any{
		"type": "delete",
		"body": map[string]string{
			"docid": docID,
		},
	}
	value, err := json.Marshal(entity)
	if err != nil {
		return
	} // [/]
	// [发送消息]
	_, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
		Topic: TOPIC_PUB_KAFKA_ES_INFO_CATALOG_INDEX,
		Value: sarama.ByteEncoder(value),
	}) // [/]
	return
}

func (l *esRepo) PubElecLicenceToES(ctx context.Context, elec *model.ElecLicence, columns []*model.ElecLicenceColumn) (err error) {
	fieldObjs := make([]*es.Field, len(columns))
	for i, column := range columns {
		fieldObjs[i] = &es.Field{
			FieldNameZH: column.BusinessName,
			FieldNameEN: column.TechnicalName,
		}
	}
	//cateInfos := make([]*es.CateInfo, 0)

	esIndexMsgEntity := es.ElecLicenceESIndexMsgEntity{
		Type: "create",
		Body: &es.ElecLicenceESIndexMsgBody{
			DocID:                elec.ElecLicenceID,
			ID:                   elec.ElecLicenceID,
			Name:                 elec.LicenceName,
			Code:                 elec.LicenceBasicCode,
			UpdatedAt:            elec.UpdateTime.UnixMilli(),
			OnlineStatus:         elec.OnlineStatus,
			IsOnline:             util.CE(elec.OnlineStatus == constant.LineStatusOnLine || elec.OnlineStatus == constant.LineStatusDownAuditing || elec.OnlineStatus == constant.LineStatusDownReject, true, false).(bool),
			LicenceType:          elec.LicenceType,
			CertificationLevel:   elec.CertificationLevel,
			IndustryDepartmentID: elec.IndustryDepartmentID,
			IndustryDepartment:   elec.IndustryDepartment,
			HolderType:           elec.HolderType,
			Department:           elec.Department,
			Expire:               elec.Expire,
			Fields:               fieldObjs,
		},
	}

	if elec.OnlineTime != nil {
		esIndexMsgEntity.Body.OnlineAt = elec.OnlineTime.UnixMilli()
	}

	//序列化发送
	esIndexMsgEntityByte, err := json.Marshal(esIndexMsgEntity)
	if err != nil {
		log.WithContext(ctx).Error("ElecLicence Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	}
	//log.WithContext(ctx).Info("ElecLicence PubToES " + string(esIndexMsgEntityByte))
	if _, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
		Topic: TOPIC_ElecLicence_PUB_KAFKA_ES_INDEX_ASYNC,
		Key:   sarama.ByteEncoder(strconv.FormatUint(elec.ID, 10)),
		Value: sarama.ByteEncoder(esIndexMsgEntityByte),
	}); err != nil {
		log.WithContext(ctx).Error("ElecLicence Public To ES Error", zap.Error(err))
	}
	return nil
}

func (l *esRepo) DeleteElecLicencePubES(ctx context.Context, id string) (err error) {
	var esIndexMsgEntityByte []byte
	esIndexMsgEntity := es.ElecLicenceESIndexMsgEntity{
		Type: "delete",
		Body: &es.ElecLicenceESIndexMsgBody{
			DocID: id,
		},
	}
	esIndexMsgEntityByte, err = json.Marshal(esIndexMsgEntity)
	if err != nil {
		log.WithContext(ctx).Error("catalog Marshal Error", zap.Error(err))
		return errorcode.Detail(errorcode.PublicInvalidParameterJson, err.Error())
	} else {
		if _, _, err = l.kafkaPub.SendMessage(&sarama.ProducerMessage{
			Topic: TOPIC_ElecLicence_PUB_KAFKA_ES_INDEX_ASYNC,
			Key:   sarama.ByteEncoder(util.StringToBytes(id)),
			Value: sarama.ByteEncoder(esIndexMsgEntityByte),
		}); err != nil {
			log.WithContext(ctx).Error("catalog Public To ES Error", zap.Error(err))
		}
	}
	return nil
}
