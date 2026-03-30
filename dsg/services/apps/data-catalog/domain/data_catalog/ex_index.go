package data_catalog

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

	"github.com/samber/lo"

	mq_common "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (d *DataCatalogDomain) CreateESIndex() {
	ctx := context.Background()
	catalogs, err := d.catalogRepo.GetEXUnindexList(nil, ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to CreateESIndex, err: %v", err)
		return
	}

	codes := make([]string, 0, len(catalogs))
	catalogIDs := make([]uint64, 0, len(catalogs))
	code2IdxMap := make(map[string]int, len(catalogs))
	updateMsgs := make([]*ESIndexMsgEntity, 0, len(catalogs))
	delMsgs := make([]*ESIndexMsgEntity, 0)
	for i := range catalogs {
		catalogIDs = append(catalogIDs, catalogs[i].ID)
		if _, isExisted := code2IdxMap[catalogs[i].Code]; !isExisted { // 未来变更功能上了以后，code不唯一，取最新的一条记录
			msg := packExIndexMsg(genMsgType(catalogs[i]), catalogs[i], nil)
			switch {
			case msg.Type == MQ_MSG_TYPE_DELETE:
				delMsgs = append(delMsgs, msg)
			case msg.Type == MQ_MSG_TYPE_UPDATE:
				code2IdxMap[msg.Body.Code] = len(updateMsgs)
				updateMsgs = append(updateMsgs, msg)
				codes = append(codes, msg.Body.Code)
			}
		}
	}

	resourceMount, err := d.resRepo.GetByCodes(nil, ctx, codes, 0)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetByCatalogIDs, err: %v", err)
		return
	}

	tidMap := make(map[string]string, len(codes))
	ids := make([]string, len(codes))
	for i := range resourceMount {
		ids[i] = resourceMount[i].ResID
		tidMap[ids[i]] = resourceMount[i].Code
	}

	//for _, mount := range resourceMount {
	//	if updateMsgs[code2IdxMap[mount.Code]].Body.MountResources == nil {
	//		updateMsgs[code2IdxMap[mount.Code]].Body.MountResources = make([]*MountResources, 0)
	//	}
	//	updateMsgs[code2IdxMap[mount.Code]].Body.MountResources = append(updateMsgs[code2IdxMap[mount.Code]].Body.MountResources, &MountResources{ID: mount.ID, ResID: mount.ResID, ResName: mount.ResName, ResType: mount.ResType})
	//}

	fieldsMap, err := d.getFieldsFromDB(ctx, catalogIDs)
	if err != nil {
		log.Errorf("failed to get data-catalog fields from db, err info: %v", err.Error())
		return
	}

	// 关联的业务对象及信息系统
	objMap, infoSysMap, err := d.getInfosFromDB(ctx, catalogIDs)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get data-catalog info from db, err info: %v", err.Error())
		return
	}

	for i, msg := range updateMsgs {

		if res, ok := objMap[msg.Body.ID]; ok {
			msg.Body.BusinessObjects = res
		}
		if res, ok := infoSysMap[msg.Body.ID]; ok {
			msg.Body.InfoSystems = res
		}

		if res, ok := fieldsMap[msg.Body.ID]; ok {
			msg.Body.Fields = res
		}

		// 提交给发布缓冲进行异步发送
		produceMsg(d, updateMsgs[i])
	}

	for i := range delMsgs {
		// 提交给发布缓冲进行异步发送
		produceMsg(d, delMsgs[i])
	}
}

func packAndProduceMsg(d *DataCatalogDomain, ctx context.Context, msgType string, catalog *model.TDataCatalog, infos []*InfoItem) {
	//if catalog.ViewCount == 0 {
	//	return
	//}

	isDeleteMsg := true
	if msgType != MQ_MSG_TYPE_DELETE {
		realMQType := genMsgType(catalog)
		if msgType == MQ_MSG_TYPE_CREATE && realMQType == MQ_MSG_TYPE_DELETE {
			log.WithContext(ctx).Infof("catalog: %d no need to produce", catalog.ID)
			return
		} else if msgType == MQ_MSG_TYPE_UPDATE {
			msgType = realMQType
		}
		if msgType != MQ_MSG_TYPE_DELETE {
			isDeleteMsg = false

		}
	}
	msg := packExIndexMsg(msgType, catalog, infos)
	if !isDeleteMsg {
		mounts, err := d.resRepo.GetByCodes(nil, ctx, []string{catalog.Code}, 0)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get mounted table of catalog: %d, err: %v", catalog.ID, err)
			return
		}
		if len(mounts) == 0 {
			log.WithContext(ctx).Errorf("there is no table resouce mounted by catalog: %d, err: %v", catalog.ID, err)
			return
		}

		columns, err := d.colRepo.Get(nil, ctx, catalog.ID)
		if err != nil {
			log.Errorf("failed to get columns of catalog: %d, err: %v", catalog.ID, err)
			return
		}
		for _, column := range columns {
			msg.Body.Fields = append(msg.Body.Fields, &Field{
				FieldNameZH: column.BusinessName,
				FieldNameEN: column.TechnicalName,
			})
		}
		//if msg.Body.MountResources == nil {
		//	msg.Body.MountResources = make([]*MountResources, 0)
		//}
		//for _, mount := range mounts {
		//	msg.Body.MountResources = append(msg.Body.MountResources, &MountResources{ID: mount.ID, ResID: mount.ResID, ResName: mount.ResName, ResType: mount.ResType})
		//
		//}
	}

	produceMsg(d, msg)
}

func (d *DataCatalogDomain) getFieldsFromDB(ctx context.Context, ids []uint64) (fieldsMap map[uint64][]*Field, err error) {
	field, err := d.colRepo.GetByCatalogIDs(nil, ctx, ids)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	fieldsMap = make(map[uint64][]*Field, 0)

	for _, f := range field {
		entity := &Field{
			FieldNameZH: f.BusinessName,
			FieldNameEN: f.TechnicalName,
		}
		fieldsMap[f.CatalogID] = append(fieldsMap[f.CatalogID], entity)
	}

	return fieldsMap, nil
}

func (d *DataCatalogDomain) getInfosFromDB(ctx context.Context, ids []uint64) (objMap map[uint64][]IDNameEntity, infoSysMap map[uint64][]IDNameEntity, err error) {
	infos, err := d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_BUSINESS_DOMAIN, common.INFO_TYPE_RELATED_SYSTEM}, ids)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	objMap = make(map[uint64][]IDNameEntity, 0)
	infoSysMap = make(map[uint64][]IDNameEntity, 0)

	for _, info := range infos {
		entity := IDNameEntity{
			ID:   info.InfoKey,
			Name: info.InfoValue,
		}
		switch info.InfoType {
		case common.INFO_TYPE_BUSINESS_DOMAIN:
			objMap[info.CatalogID] = append(objMap[info.CatalogID], entity)
		case common.INFO_TYPE_RELATED_SYSTEM:
			infoSysMap[info.CatalogID] = append(infoSysMap[info.CatalogID], entity)
		default:
		}
	}

	return objMap, infoSysMap, nil
}

/*
func getTableInfoFromMetadata(ctx context.Context, ids []string) [][]*common.TableInfo {
	reqTimes := int(math.Ceil(float64(len(ids)) / float64(common.DEFAULT_LIMIT)))
	batchTimes := int(math.Ceil(float64(reqTimes) / float64(common.DEFAULT_PARALLEL_NUM)))
	var wg sync.WaitGroup
	rets := make([][]*common.TableInfo, reqTimes)

	var base int
	wg.Add(reqTimes)
	for j := 0; j < batchTimes; j++ {
		base = j * common.DEFAULT_PARALLEL_NUM
		for i := 1; i <= common.DEFAULT_PARALLEL_NUM && base+i <= reqTimes; i++ {
			go func(idx int) {
				defer wg.Done()
				startIdx := (idx - 1) * common.DEFAULT_LIMIT
				length := common.DEFAULT_LIMIT
				if (len(ids)-startIdx)/common.DEFAULT_LIMIT == 0 {
					length = (len(ids) - startIdx) % common.DEFAULT_LIMIT
				}

				ts, err := common.GetTableInfo(ctx, ids[startIdx:startIdx+length])
				if err != nil {
					log.WithContext(ctx).Errorf("failed to GetTableInfo (ids: %v), err: %v", ids[startIdx:startIdx+length], err)
					return
				}
				rets[idx-1] = ts
			}(base + i)
		}
	}
	wg.Wait()
	return rets
}
*/

func produceMsg(d *DataCatalogDomain, msg *ESIndexMsgEntity) bool {
	buf, err := json.Marshal(msg)
	if err != nil {
		log.Errorf("produceMsg json.Marshal msg failed: %s", err.Error())
		return false
	}
	if err = d.esIndexProducer.Produce(mq_common.MQMsgBuilder(util.StringToBytes(msg.Body.DocID), buf)); err != nil {
		log.Errorf("produceMsg d.producer.Produce msg failed: %d", err.Error())
		return false
	}
	return true
}

func packExIndexMsg(msgType string, catalog *model.TDataCatalog, infos []*InfoItem) *ESIndexMsgEntity {
	return &ESIndexMsgEntity{
		Type:      msgType,
		Body:      catalogToESIndexMsgEntity(msgType, catalog, infos),
		UpdatedAt: catalog.UpdatedAt.UnixMilli(),
	}
}

func catalogToESIndexMsgEntity(msgType string, catalog *model.TDataCatalog, infos []*InfoItem) *ESIndexMsgBody {
	if msgType == MQ_MSG_TYPE_DELETE {
		return &ESIndexMsgBody{
			DocID: strings.ReplaceAll(catalog.Code, "/", "-"),
			Code:  catalog.Code,
			ID:    catalog.ID,
		}
	}

	publishedAt := catalog.UpdatedAt.UnixMilli()
	if catalog.PublishedAt != nil {
		publishedAt = catalog.PublishedAt.UnixMilli()
	}

	ret := &ESIndexMsgBody{
		DocID:       strings.ReplaceAll(catalog.Code, "/", "-"),
		Code:        catalog.Code,
		ID:          catalog.ID,
		Title:       catalog.Title,
		Description: catalog.Description,
		GroupID:     catalog.GroupID,
		SharedType:  catalog.SharedType,
		//DataKind:    common.DatakindToArray(catalog.DataKind),
		DataRange:   catalog.DataRange,
		UpdateCycle: catalog.UpdateCycle,
		PublishedAt: publishedAt,

		OwnerID:   catalog.OwnerId,
		OwnerName: catalog.OwnerName,
	}

	for _, info := range infos {

		entries := lo.Map(info.Entries, func(item *InfoBase, _ int) IDNameEntity {
			return IDNameEntity{ID: item.InfoKey, Name: item.InfoValue}
		})

		switch info.InfoType {
		case common.INFO_TYPE_RELATED_SYSTEM:
			ret.InfoSystems = entries
		case common.INFO_TYPE_BUSINESS_DOMAIN:
			ret.BusinessObjects = entries
		}
	}
	return ret
}

func genMsgType(catalog *model.TDataCatalog) string {
	msgType := MQ_MSG_TYPE_UPDATE
	if catalog.OnlineStatus != constant.LineStatusOnLine {
		msgType = MQ_MSG_TYPE_DELETE
	}
	return msgType
}

func (d *DataCatalogDomain) ListenProducerResult() {
	ctx := context.Background()
	for {
		result := d.esIndexProducer.Output()
		if result == nil {
			log.WithContext(ctx).Infof("program exit triggered, producer closed")
			return
		}

		if result.Error() != nil {
			log.WithContext(ctx).Warnf("failed to produce msg, err: %v", result.Error())
			continue
		}
		var sMsg ESIndexMsgEntity
		err := json.Unmarshal(result.SrcMsg().Value(), &sMsg)
		if err != nil {
			log.WithContext(ctx).Warnf("failed to decode src msg, err: %v", err)
			continue
		}

		_, err = d.catalogRepo.UpdateIndexFlag(nil, ctx, sMsg.Body.ID, &util.Time{Time: time.UnixMilli(sMsg.UpdatedAt)})
		if err != nil {
			log.WithContext(ctx).Warnf("failed to update catalog: %d is_indexed to 1, err: %s", sMsg.Body.ID, err)
		}
	}
}
