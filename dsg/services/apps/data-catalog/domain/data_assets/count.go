package data_assets

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	NodeTypeBusinessDomain = "business_domain"
	NodeTypeSubjectDomain  = "subject_domain"
	NodeTypeBusinessObject = "business_object"
)

func (d *DataAssetsDomain) DataAssetsCount(token string) {
	ctx := context.Background()
	counts, err := common.GetBusinessDomainCounts(ctx, token)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetGlossaryInfo, err: %v", err)
		return
	}
	info := &CountInfo{
		BusinessDomainCount: counts.BusinessDomainCount,
		SubjectDomainCount:  counts.SubjectDomainCount,
		BusinessObjectCount: counts.BusinessObjectCount,
	}

	offset := 1
	limit := 100
	baseInfo := request.PageBaseInfo{
		Offset: &offset,
		Limit:  &limit,
	}
	datas, totalCount, err := d.cataRepo.GetOnlineBusinessObjectList(nil, ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetBusinessObjectList, err: %v", err)
		return
	}

	var businessAttributeCount int32
	for _, data := range datas {
		_, count, err := d.colRepo.GetList(nil, ctx, data.ID, "", &baseInfo)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to GetCatalogColumnDetail, err: %v", err)
			return
		}
		businessAttributeCount += int32(count)
	}
	dataAssetsInfo := &model.TDataAssetsInfo{
		BusinessDomainCount:      info.BusinessDomainCount,
		SubjectDomainCount:       info.SubjectDomainCount,
		BusinessObjectCount:      info.BusinessObjectCount,
		BusinessLogicEntityCount: int32(totalCount),
		BusinessAttributesCount:  businessAttributeCount,
	}
	err = d.dataAssetsRepo.Update(ctx, dataAssetsInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update data_assets_info, err: %v", err)
		return
	}
}

func (d *DataAssetsDomain) BusinessLogicEntityInfo(token string) {
	ctx := context.Background()
	GlossaryInfos, _, err := common.GetGlossaryInfo(ctx, token)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetGlossaryInfo, err: %v", err)
		return
	}
	businessDomainSet := make(map[string]int, 0)
	for _, node := range GlossaryInfos {
		if strings.EqualFold(node.NodeType, NodeTypeBusinessDomain) {
			businessDomainSet[node.ID] = 0
		}
	}

	datas, _, err := d.cataRepo.GetOnlineBusinessObjectList(nil, ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetBusinessObjectList, err: %v", err)
		return
	}

	for _, data := range datas {
		res, err := d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_BUSINESS_DOMAIN}, []uint64{data.ID})
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get data_catalog_info, err: %v", err)
			return
		}
		var businessObjectIDs []string
		for i := range res {
			if res[i].InfoType == common.INFO_TYPE_BUSINESS_DOMAIN {
				businessObjectIDs = append(businessObjectIDs, res[i].InfoKey)
			}
		}
		if len(businessObjectIDs) > 0 {
			businessObjectPath, err := common.GetPath(ctx, businessObjectIDs, token)
			if err != nil {
				log.WithContext(ctx).Errorf("get business object path for catalog: %v failed, err: %v", data.ID, err)
				return
			}
			for _, object := range businessObjectPath {
				arr := strings.Split(object.PathID, "/")
				if _, ok := businessDomainSet[arr[0]]; ok {
					businessDomainSet[arr[0]]++
				}
			}
		}
	}
	businessLogicEntityInfos := make([]*model.TBusinessLogicEntityByBusinessDomain, 0)
	for _, node := range GlossaryInfos {
		//if node.Level == 1 {
		if strings.EqualFold(node.NodeType, NodeTypeBusinessDomain) {
			info := &model.TBusinessLogicEntityByBusinessDomain{
				BusinessDomainID:         node.ID,
				BusinessDomainName:       node.Name,
				BusinessLogicEntityCount: int32(businessDomainSet[node.ID]),
			}
			businessLogicEntityInfos = append(businessLogicEntityInfos, info)
		}
	}
	err = d.logicEntityRepo.Update(ctx, businessLogicEntityInfos)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update business_logic_entity_by_domain, err: %v", err)
		return
	}
}

func (d *DataAssetsDomain) DepartmentBusinessLogicEntityInfo(token string) {
	ctx := context.Background()
	departmentInfos, err := common.GetDepartmentInfo(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetGlossaryInfo, err: %v", err)
		return
	}

	departmentSet := make(map[string]int, 0)
	for _, department := range departmentInfos {
		if len(department.PathID) == 73 {
			departmentSet[department.ID] = 0
		}
	}
	datas, _, err := d.cataRepo.GetOnlineBusinessObjectList(nil, ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetBusinessObjectList, err: %v", err)
		return
	}

	businessLogicEntityInfos := make([]*model.TBusinessLogicEntityByDepartment, 0)
	var departmentID string
	for _, data := range datas {
		for _, departmentInfo := range departmentInfos {
			if data.DepartmentID == departmentInfo.ID {
				departmentID = departmentInfo.PathID[37:73]
				if _, ok := departmentSet[departmentID]; ok {
					departmentSet[departmentID]++
				}
			}
		}
	}
	for _, department := range departmentInfos {
		if _, ok := departmentSet[department.ID]; ok {
			info := &model.TBusinessLogicEntityByDepartment{
				DepartmentID:             department.ID,
				DepartmentName:           department.Name,
				BusinessLogicEntityCount: int32(departmentSet[department.ID]),
			}
			businessLogicEntityInfos = append(businessLogicEntityInfos, info)
		}
	}
	err = d.dLogicEntityRepo.Update(ctx, businessLogicEntityInfos)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update business_logic_entity_by_department, err: %v", err)
		return
	}
}

func (d *DataAssetsDomain) StandardizedRateInfo(token string) {
	ctx := context.Background()
	infos, _, err := common.GetDomain(ctx, token)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to GetGlossaryInfo, err: %v", err)
		return
	}
	standardizedRateInfos := make([]*model.TStandardizationInfo, 0)
	for _, node := range infos {
		standardizedRateInfo := new(model.TStandardizationInfo)
		models, err := common.GetModelInfo(ctx, node.ID, token)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get main_business info, err: %v", err)
			return
		}
		for _, m := range models {
			res, err := common.GetBusinessFormStandardizedRateInfo(ctx, m.ID, token)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to get business form info, err: %v", err)
				return
			}
			standardizedRateInfo.StandardizedFields += int32(res.StandardFieldsCount)
			standardizedRateInfo.TotalFields += int32(res.FieldsCount)
		}
		standardizedRateInfo.BusinessDomainID = node.ID
		standardizedRateInfo.BusinessDomainName = node.Name
		standardizedRateInfos = append(standardizedRateInfos, standardizedRateInfo)
	}
	err = d.standardizationRepo.Update(ctx, standardizedRateInfos)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update standardization_info, err: %v", err)
		return
	}
}
