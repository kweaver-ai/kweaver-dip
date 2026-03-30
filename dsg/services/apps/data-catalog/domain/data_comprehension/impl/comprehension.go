package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/ad"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/openai"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/task_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_column"
	catalog_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension_template"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	task_center_common "github.com/kweaver-ai/idrm-go-common/rest/task_center"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

type ComprehensionDomainImpl struct {
	repo                            data_comprehension.RepoOp
	templateRepo                    data_comprehension_template.Repo
	catalogRepo                     data_catalog.RepoOp
	catalogColumnRepo               data_catalog_column.RepoOp
	dataResourceRepo                data_resource.DataResourceRepo
	catalogInfo                     catalog_info.RepoOp
	ad                              ad.AD
	openai                          openai.OpenAI
	engine                          virtualization_engine.VirtualizationEngine
	data                            *db.Data
	taskCenterDriven                task_center.Driven
	taskCenterCommonDriven          task_center_common.Driven
	configurationCenterCommonDriven configuration_center.Driven
	wf                              workflow.WorkflowInterface
	departmentDomain                *common.DepartmentDomain
}

func NewComprehensionDomain(repo data_comprehension.RepoOp,
	templateRepo data_comprehension_template.Repo,
	catalogRepo data_catalog.RepoOp,
	catalogColumnRepo data_catalog_column.RepoOp,
	dataResourceRepo data_resource.DataResourceRepo,
	catalogInfo catalog_info.RepoOp,
	ad ad.AD,
	openai openai.OpenAI,
	engine virtualization_engine.VirtualizationEngine,
	data *db.Data,
	taskCenterDriven task_center.Driven,
	taskCenterCommonDriven task_center_common.Driven,
	configurationCenterCommonDriven configuration_center.Driven,
	wf workflow.WorkflowInterface,
	departmentDomain *common.DepartmentDomain,
) domain.ComprehensionDomain {
	cd := &ComprehensionDomainImpl{
		repo:                            repo,
		templateRepo:                    templateRepo,
		catalogRepo:                     catalogRepo,
		catalogColumnRepo:               catalogColumnRepo,
		dataResourceRepo:                dataResourceRepo,
		catalogInfo:                     catalogInfo,
		ad:                              ad,
		openai:                          openai,
		engine:                          engine,
		data:                            data,
		taskCenterDriven:                taskCenterDriven,
		taskCenterCommonDriven:          taskCenterCommonDriven,
		configurationCenterCommonDriven: configurationCenterCommonDriven,
		wf:                              wf,
		departmentDomain:                departmentDomain,
	}

	cd.wf.RegistConusmeHandlers(domain.ComprehensionReportAuditType, cd.AuditProcessMsgProc,
		common.HandlerFunc[wf_common.AuditResultMsg](domain.ComprehensionReportAuditType, cd.AuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](domain.ComprehensionReportAuditType, cd.AuditProcessDelMsgProc))
	return cd
}

//func (c *ComprehensionDomainImpl) Config(ctx context.Context) *domain.Configuration {
//	return domain.Config()
//}

func (c *ComprehensionDomainImpl) Upsert(ctx context.Context, req *domain.ComprehensionUpsertReq) (*domain.ComprehensionDetail, error) {
	dc, err := c.catalogRepo.Get(nil, ctx, req.CatalogID.Uint64())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.DataComprehensionCatalogOfflineDeleted, "not exist")
		}
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	if req.CatalogCreate {
		if _, exist := constant.PublishedMap[dc.PublishStatus]; !exist {
			log.WithContext(ctx).Infof("data catalog no online, id: %v, title: %v", dc.ID, dc.Title)
			return nil, errorcode.Detail(errorcode.DataComprehensionCatalogOfflineDeleted, "not publish")
		}

	} /* else {
		if _, exist := constant.OnLineMap[dc.OnlineStatus]; !exist {
			log.WithContext(ctx).Infof("data catalog no online, id: %v, title: %v", dc.ID, dc.Title)
			return nil, errorcode.Detail(errorcode.DataComprehensionCatalogOfflineDeleted, "not online")
		}
	}*/

	modelDetail, err := c.repo.GetCatalogId(ctx, req.CatalogID.Uint64())
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if modelDetail.Status == domain.Auditing {
		return nil, errorcode.Desc(errorcode.DataComprehensionAuditing)
	}
	//小红点
	if modelDetail.CatalogID == 0 {
		req.Mark = domain.Mark(domain.AllNoChange, req.TaskId)
	} else {
		req.Mark = domain.Mark(modelDetail.Mark, req.TaskId)
	}
	req.Configuration = domain.WireDefaultConfig()
	if req.TemplateID != "" {
		template, err := c.templateRepo.GetById(ctx, req.TemplateID)
		if err != nil {
			return nil, err
		}
		req.Configuration = domain.WireConfig(template)
	}

	if req.Operation == "save" {
		return nil, c.save(ctx, req)
	}
	return c.upsert(ctx, req)
}

func (c *ComprehensionDomainImpl) Detail(ctx context.Context, catalogId uint64, queryReq *domain.ReqQueryParams) (*domain.ComprehensionDetail, error) {
	var err error
	detail := new(model.DataComprehensionDetail)
	detail, err = c.repo.GetCatalogId(ctx, catalogId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			//if queryReq.TemplateID == "" {
			//	return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
			//}
			return c.emptyDetail(ctx, catalogId, queryReq.TemplateID)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//解开得到详情
	comprehensionDetail := new(domain.ComprehensionDetail)
	if err = json.Unmarshal([]byte(detail.Details), comprehensionDetail); err != nil {
		return nil, errorcode.Desc(errorcode.DataComprehensionUnmarshalJsonError)
	}
	comprehensionDetail.Status = detail.Status
	comprehensionDetail.AuditAdvice = detail.AuditAdvice
	comprehensionDetail.UpdatedAt = detail.UpdatedAt.UnixMilli()
	//获取编目详情
	catalogDetailInfo, err := c.CatalogDetailInfo(ctx, catalogId)
	if err != nil {
		return nil, err
	}
	//更新编目详情
	comprehensionDetail.CatalogInfo = catalogDetailInfo
	//更新下详情中的字段数据, 关联目录详情
	if err := comprehensionDetail.CheckAndMerge(ctx, c); err != nil {
		return nil, err
	}
	//检查字段注解
	comprehensionDetail.RemoveDeletedColumnComments(ctx, c)

	configuration := domain.WireDefaultConfig()
	fn := getIcons
	if detail.TemplateID != "" {
		template, err := c.templateRepo.GetById(ctx, detail.TemplateID)
		if err != nil {
			return nil, err
		}
		configuration = domain.WireConfig(template)
		fn = getTemplateIcons
	}
	if len(comprehensionDetail.Choices) < 1 {
		comprehensionDetail.Choices = configuration.Choices
	}
	comprehensionDetail.Icons = fn(comprehensionDetail.GetDimensionConfigIds(comprehensionDetail.ComprehensionDimensions))
	return comprehensionDetail, nil
}

func (c *ComprehensionDomainImpl) emptyDetail(ctx context.Context, catalogId uint64, templateRepoID string) (*domain.ComprehensionDetail, error) {
	comprehensionDetail := &domain.ComprehensionDetail{}
	dataCatalogs, err := c.catalogRepo.GetDetailByIds(nil, ctx, nil, catalogId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(dataCatalogs) < 1 {
		return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	}

	dataCatalog := dataCatalogs[0]
	comprehensionDetail.CatalogID = models.NewModelID(dataCatalog.ID)
	comprehensionDetail.CatalogCode = dataCatalog.Code
	//获取编目详情
	catalogDetailInfo, err := c.CatalogDetailInfo(ctx, catalogId)
	if err != nil {
		return nil, err
	}
	comprehensionDetail.CatalogInfo = catalogDetailInfo

	//更新编目详情
	var fn func(ids []string) map[string]string
	var configuration *domain.Configuration
	if templateRepoID != "" {
		template, err := c.templateRepo.GetById(ctx, templateRepoID)
		if err != nil {
			return nil, err
		}
		configuration = domain.WireConfig(template)
		fn = getTemplateIcons
	} else {
		configuration = domain.WireDefaultConfig()
		fn = getIcons
	}
	comprehensionDetail.Note = configuration.Note
	comprehensionDetail.Choices = configuration.Choices
	comprehensionDetail.ComprehensionDimensions = configuration.DimensionConfig
	comprehensionDetail.Status = domain.NotComprehend
	comprehensionDetail.Icons = fn(comprehensionDetail.GetDimensionConfigIds(comprehensionDetail.ComprehensionDimensions))
	return comprehensionDetail, nil
}

func (c *ComprehensionDomainImpl) Delete(ctx context.Context, catalogId uint64) (err error) {
	//删除理解
	if err := c.repo.Delete(ctx, catalogId); err != nil {
		log.WithContext(ctx).Error(err.Error())
		return errorcode.Detail(errorcode.DataComprehensionDeleteFailed, err.Error())
	}
	return
}

// GetCatalogListInfo  获取编目信息
func (c *ComprehensionDomainImpl) GetCatalogListInfo(ctx context.Context, catalogIds []uint64) (map[uint64]domain.CatalogListInfo, error) {
	briefInfos, err := c.repo.List(ctx, catalogIds...)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	detailModelMap := domain.GenComprehensionDetail(briefInfos)
	if len(detailModelMap) <= 0 && len(briefInfos) > 0 {
		return nil, errorcode.Desc(errorcode.DataComprehensionUnmarshalJsonError)
	}
	fmt.Printf("catalog ID: %v", catalogIds)
	//查询资源，将视图的技术名称拿出来
	resourceInfos, err := c.dataResourceRepo.GetByCatalogIds(ctx, catalogIds...)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//过滤出只有逻辑视图的
	resourceInfos = lo.Filter(resourceInfos, func(item *model.TDataResource, _ int) bool {
		return item.Type == constant.MountView
	})
	resourceInfoMap := lo.SliceToMap(resourceInfos, func(item *model.TDataResource) (uint64, *model.TDataResource) {
		return item.CatalogID, item
	})

	results := make(map[uint64]domain.CatalogListInfo, 0)
	for _, id := range catalogIds {
		listInfo := domain.CatalogListInfo{ID: models.NewModelID(id), Status: 1}
		detailModel, ok := detailModelMap[id]
		if ok {
			listInfo = domain.CatalogListInfo{
				ID:               models.NewModelID(id),
				Code:             detailModel.Code,
				MountSourceName:  detailModel.Details.CatalogInfo.TableName,
				ExceptionMessage: detailModel.Details.GetExceptionMsg(ctx, c),
				Mark:             detailModel.Mark,
				Status:           detailModel.Status,
				Creator:          detailModel.CreatorName,
				CreatorUID:       detailModel.CreatorUID,
				CreatedTime:      detailModel.CreatedAt.UnixMilli(),
				UpdateBy:         detailModel.UpdaterName,
				UpdateByUID:      detailModel.UpdaterUID,
				UpdateTime:       detailModel.UpdatedAt.UnixMilli(),
			}
		}
		resourceInfo, ok := resourceInfoMap[id]
		if ok {
			listInfo.MountSourceName = resourceInfo.Name
		}
		results[listInfo.ID.Uint64()] = listInfo
	}
	return results, nil
}

func (c *ComprehensionDomainImpl) UpdateMark(ctx context.Context, catalogId uint64, taskId string) error {
	detail, err := c.repo.GetCatalogId(ctx, catalogId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Detail(errorcode.PublicResourceNotExisted, err.Error())
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//消除任务更新
	detail.Mark = domain.CancelMark(detail.Mark, taskId)
	return c.repo.Update(ctx, detail)
}

func (c *ComprehensionDomainImpl) UpsertResults(ctx context.Context, ds []*domain.ComprehensionResult) (*domain.ComprehensionDetail, error) {
	for _, d := range ds {
		if detailConfig, err := c.upsertResult(ctx, d); err != nil {
			return detailConfig, err
		}
	}
	return nil, nil
}

func (c *ComprehensionDomainImpl) upsertResult(ctx context.Context, data *domain.ComprehensionResult) (*domain.ComprehensionDetail, error) {
	comprehension, err := c.repo.GetCatalogId(ctx, data.CatalogId.Uint64())
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	dc, err := c.catalogRepo.Get(nil, ctx, data.CatalogId.Uint64())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.DataComprehensionCatalogOfflineDeleted)
		}
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if dc.OnlineStatus != constant.LineStatusOnLine {
		log.WithContext(ctx).Infof("data catalog no online, id: %v, title: %v", dc.ID, dc.Title)
		return nil, errorcode.Desc(errorcode.DataComprehensionCatalogOfflineDeleted)
	}
	//config_content 维度理解
	configSlice := domain.WireDefaultConfig().DimensionConfig
	if comprehension.TemplateID != "" {
		template, err := c.templateRepo.GetById(ctx, comprehension.TemplateID)
		if err != nil {
			return nil, err
		}
		configSlice = domain.WireConfig(template).DimensionConfig
	}
	comprehensionDict := lo.SliceToMap(data.Comprehension,
		func(item *domain.ComprehensionObject) (string, *domain.ComprehensionObject) {
			return item.Dimension, item
		})
	configContents := make([]*domain.ConfigContent, 0)
	for _, config := range configSlice {
		configContents = append(configContents, genConfigContent(comprehensionDict, config))
	}
	//字段理解
	columns, err := c.catalogColumnRepo.Get(nil, ctx, data.CatalogId.Uint64())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TableOrColumnNotExisted)
		}
	}
	fieldComments := comprehensionDict["字段注释"]
	columnComments := genColumnComments(fieldComments, columns)

	//获取导入用户信息
	uInfo := request.GetUserInfo(ctx)
	req := &domain.ComprehensionUpsertReq{
		ReqPathParams: domain.ReqPathParams{
			CatalogID: data.CatalogId,
		},
		DimensionConfigs: configContents,
		ColumnComments:   columnComments,
		CatalogCode:      dc.Code,
		Operation:        "upsert",
		Updater:          uInfo.Name,
		UpdaterId:        uInfo.ID,
	}
	detailConfig, err := c.Check(ctx, req, true)
	if err != nil {
		return nil, err
	}
	bts, _ := json.Marshal(detailConfig)
	detail := req.Comprehension(string(bts))
	detail.Status = domain.Comprehended

	//开启事务
	tx := c.begin(ctx)
	defer c.Commit(tx, &err)
	//插入理解详情
	err = c.repo.TransactionUpsert(ctx, tx, detail)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		panic(err)
	}
	//更新信息项
	err = c.UpdateCatalogColumnDesc(ctx, tx, detailConfig.ColumnComments, data.CatalogId.Uint64())
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		panic(err)
	}
	return detailConfig, nil
}

func genConfigContent(comprehensionDict map[string]*domain.ComprehensionObject, config *domain.DimensionConfig) *domain.ConfigContent {
	result := &domain.ConfigContent{}
	if len(config.Children) > 0 {
		result.Id = config.Id
		for _, child := range config.Children {
			result.Children = append(result.Children, genConfigContent(comprehensionDict, child))
		}
		return result
	}
	jsonComprehension, ok := comprehensionDict[config.Name]
	if !ok {
		return result
	}
	result.Id = config.Id
	result.Content = jsonComprehension.Answer
	result.AIContent = jsonComprehension.Answer
	return result
}

func genColumnComments(answer any, columns []*model.TDataCatalogColumn) []domain.ColumnComment {
	results := make([]domain.ColumnComment, 0)
	ds, err := domain.Recognize[domain.ColumnDetailInfos](answer)
	if err != nil {
		return results
	}
	columnComprehensionDict := lo.SliceToMap(ds, func(item domain.ColumnDetailInfo) (string, domain.ColumnDetailInfo) {
		return item.ColumnName, item
	})

	for _, column := range columns {
		comprehension, ok := columnComprehensionDict[column.TechnicalName]
		if !ok {
			continue
		}
		dataFormat := int32(0)
		if column.DataFormat != nil {
			dataFormat = *column.DataFormat
		}
		results = append(results, domain.ColumnComment{
			ID:         models.ModelID(column.ID),
			ColumnName: comprehension.ColumnName,
			NameCN:     comprehension.NameCn,
			DataFormat: dataFormat,
			Comment:    comprehension.AIComment,
			AIComment:  comprehension.AIComment,
		})
	}
	return results
}
