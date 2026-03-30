package impl

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func (c *ComprehensionDomainImpl) begin(ctx context.Context) *gorm.DB {
	return c.data.DB.WithContext(ctx).Begin()
}

func (c *ComprehensionDomainImpl) Commit(tx *gorm.DB, err *error) {
	if e := recover(); e != nil {
		*err = e.(error)
		tx.Rollback()
	} else if e = tx.Commit().Error; e != nil {
		*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
		tx.Rollback()
	}
}

// save  保存理解数据
func (c *ComprehensionDomainImpl) save(ctx context.Context, req *domain.ComprehensionUpsertReq) error {
	detailConfig, err := c.Check(ctx, req, false)
	if err != nil {
		return err
	}
	bts, _ := json.Marshal(detailConfig)
	detail := req.Comprehension(string(bts))
	//bind, err := c.configurationCenterCommonDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{
	//	AuditType: domain.ComprehensionReportAuditType,
	//})
	//if err != nil {
	//	return err
	//}
	//catalog, err := c.catalogRepo.Get(nil, ctx, req.CatalogID.Uint64())
	//if err != nil {
	//	return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	//}

	return c.repo.Upsert(ctx, detail)
}

// upsert 插入或者更新理解
func (c *ComprehensionDomainImpl) upsert(ctx context.Context, req *domain.ComprehensionUpsertReq) (*domain.ComprehensionDetail, error) {
	detailConfig, err := c.Check(ctx, req, true)
	if err != nil {
		return detailConfig, err
	}
	bts, _ := json.Marshal(detailConfig)
	detail := req.Comprehension(string(bts))
	detail.Status = domain.Comprehended
	//开启事务
	tx := c.begin(ctx)
	//插入理解详情
	//if req.TemplateID != "" { //目录创建默认理解报告不需要审核，和上线一起
	if err = c.Audit(ctx, detail, req.CatalogID); err != nil {
		tx.Rollback()
		return nil, err
	}
	//} else {
	//	detail.Status = domain.WaitOnline
	//}
	err = c.repo.TransactionUpsert(ctx, tx, detail)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		tx.Rollback()
		return detailConfig, err
	}
	//更新信息项
	err = c.UpdateCatalogColumnDesc(ctx, tx, detailConfig.ColumnComments, req.CatalogID.Uint64())
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		tx.Rollback()
		return detailConfig, err
	}
	c.Commit(tx, &err)
	return detailConfig, err
}
func (c *ComprehensionDomainImpl) Audit(ctx context.Context, detail *model.DataComprehensionDetail, catalogID models.ModelID) error {
	bind, err := c.configurationCenterCommonDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{
		AuditType: domain.ComprehensionReportAuditType,
	})
	if err != nil {
		return err
	}
	catalog, err := c.catalogRepo.Get(nil, ctx, catalogID.Uint64())
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if err = c.repo.Audit(ctx, detail, bind, catalog.Title); err != nil {
		return err
	}
	return nil
}

// UpdateCatalogColumnDesc  更新目录信息项备注
func (c *ComprehensionDomainImpl) UpdateCatalogColumnDesc(ctx context.Context, tx *gorm.DB, columnComments []domain.ColumnComment, catalogId uint64) error {
	columns, err := c.ColumnInfos(ctx, catalogId)
	if err != nil {
		return err
	}

	updatedIds := make(map[uint64]struct{})
	columnInfos := make([]*model.TDataCatalogColumn, 0)
	for _, cc := range columnComments {
		if !cc.Sync {
			continue
		}
		columnInfos = append(columnInfos, &model.TDataCatalogColumn{
			ID:            cc.ID.Uint64(),
			AIDescription: cc.AIComment,
		})

		updatedIds[cc.ID.Uint64()] = struct{}{}
	}
	if len(columnInfos) <= 0 {
		return nil
	}

	for id := range columns {
		if _, ok := updatedIds[id]; ok {
			continue
		}

		columnInfos = append(columnInfos, &model.TDataCatalogColumn{
			ID:            id,
			AIDescription: "",
		})
	}

	_, err = c.catalogColumnRepo.UpdateAIDescBatch(tx, ctx, columnInfos)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return err
}

// CatalogDetailInfo  查询理解需要的所有编目信息
func (c *ComprehensionDomainImpl) CatalogDetailInfo(ctx context.Context, catalogId uint64) (*domain.CatalogInfo, error) {
	//查询基本的信息
	baseInfo, err := c.CatalogBaseInfos(ctx, catalogId)
	if err != nil {
		return nil, err
	}
	catalogBaseInfo, ok := baseInfo[catalogId]
	if !ok {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	detail := domain.GenCatalogInfo(catalogBaseInfo)

	//查挂接资源
	resourceInfo, err := c.dataResourceRepo.GetByCatalogId(ctx, catalogId)
	if err != nil {
		log.WithContext(ctx).Error("query catalog resource info error", zap.Error(err))
	} else {
		//将资源名称给出
		if len(resourceInfo) > 0 {
			detail.TableId = resourceInfo[0].ResourceId
			detail.TableName = resourceInfo[0].Name
		}
	}
	//查询部门业务职责等
	if err = FixCurrentAndTopObjects2(ctx, detail, catalogBaseInfo.DepartmentID); err != nil {
		log.WithContext(ctx).Errorf("err: %v", err)
		return nil, err
	}
	////查询标准表数据总量
	//resourceInfos, err := c.catalogResourceRepo.Get(tx, ctx, catalogBaseInfo.Code, 0)
	//if err != nil {
	//	log.WithContext(ctx).Errorf("err: %v", err)
	//	if errors.Is(err, gorm.ErrRecordNotFound) {
	//		return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	//	}
	//	return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	//}
	//if len(resourceInfos) <= 0 {
	//	return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	//}
	//resourceInfo := resourceInfos[0]
	//detail.TableName = resourceInfo.ResName //写入标名
	//detail.TableId = resourceInfo.ResID     // 标准表的ID
	//获取数据总量，没有就返回0
	//tableInfos, err := common.GetTableInfo(ctx, []uint64{resourceInfo.ResID})
	//if err != nil {
	//	log.WithContext(ctx).Errorf("err: %v", err)
	//}
	//if len(tableInfos) > 0 {
	//	detail.TotalData = tableInfos[0].RowNum
	//}
	return detail, nil
}

func FixCurrentAndTopObjects2(ctx context.Context, detail *domain.CatalogInfo, objId string) error {
	detail.DepartmentInfos = make([]*common.SummaryInfo, 0)
	objInfo, err := common.GetObjectInfo(ctx, objId)
	if err != nil {
		return nil
	}
	pathIds := strings.Split(objInfo.PathID, "/")
	for _, oId := range pathIds {
		curObjInfo, err := common.GetObjectInfo(ctx, oId)
		if err != nil {
			return err
		}
		detail.DepartmentInfos = append(detail.DepartmentInfos, curObjInfo)
	}
	return nil
}
func FixCurrentAndTopObjects(ctx context.Context, detail *domain.CatalogInfo, objId string) error {
	objInfo, err := common.GetObjectInfo(ctx, objId)
	if err != nil {
		errStr := err.Error()
		log.WithContext(ctx).Error(errStr)
		//如果没有查到，那么就返回空
		detail.DepartmentInfos = make([]*common.SummaryInfo, 0)
		//detail.BusinessDuties = make([]string, 0)
		//detail.BaseWorks = make([]string, 0)
		return nil
	}

	pathIds := strings.Split(objInfo.PathID, "/")
	curObjMap := make(map[string]*common.SummaryInfo)
	curObjMap[objInfo.ID] = objInfo

	var topId string
	for _, oId := range pathIds {
		curObjInfo, err := common.GetObjectInfo(ctx, oId)
		if err != nil {
			log.WithContext(ctx).Error(err.Error())
			return err
		}

		curObjMap[curObjInfo.ID] = curObjInfo

		if curObjInfo.Type == "department" {
			topId = oId
			break
		}
	}

	//开展工作， 当前部门和子部门的业务事项
	query := common.QueryParam{
		ObjectID: objId,
		IsAll:    true,
		Type:     "organization,department",
	}
	// subObjs, err := common.GetObjectsInfo(ctx, query)
	// if err != nil {
	// 	log.WithContext(ctx).Errorf("err: %v", err)
	// 	return err
	// }
	// for _, obj := range subObjs {
	// 	if obj.Time == "business_matters" {
	// 		detail.BaseWorks = append(detail.BaseWorks, obj.Name)
	// 	}
	// }

	//部门职责， 顶级部门下面的所有业务事项
	var topSubObjs []*common.SummaryInfo
	if topId != "" {
		query = common.QueryParam{
			ObjectID: topId,
			IsAll:    true,
			Type:     "organization,department",
		}
		topSubObjs, err = common.GetObjectsInfo(ctx, query)
		if err != nil {
			log.WithContext(ctx).Errorf("err: %v", err)
			return err
		}
		topObjInfo, err := common.GetObjectInfo(ctx, topId)
		if err != nil {
			log.WithContext(ctx).Error(err.Error())
			return err
		}

		topSubObjs = append(topSubObjs, topObjInfo)
	}

	for _, object := range topSubObjs {
		curObjMap[object.ID] = object
		// if object.Time == "business_matters" {
		// 	detail.BusinessDuties = append(detail.BusinessDuties, object.Name)
		// }
	}

	// detail.BusinessDuties = append(detail.BusinessDuties, detail.BaseWorks...)
	// detail.BusinessDuties = lo.Union(detail.BusinessDuties)
	//detail.BusinessDuties = make([]string, 0)
	//detail.BaseWorks = make([]string, 0)
	//部门结构列表信息
	for _, did := range pathIds {
		departmentInfo, ok := curObjMap[did]
		if !ok {
			continue
		}
		detail.DepartmentInfos = append(detail.DepartmentInfos, departmentInfo)
	}
	return nil
}
