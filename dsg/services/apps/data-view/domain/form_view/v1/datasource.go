package v1

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"

	api_audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/metadata"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/avast/retry-go"
	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"go.uber.org/zap"
)

func (f *formViewUseCase) FixDatasourceStatus(ctx context.Context) {
	defer func() {
		if r := recover(); r != nil {
			log.Error("【FixDatasourceStatus】 panic", zap.Any("recover", r))
		}
	}()
	if runtime.GOOS == "windows" { //本地调试不修复数据
		return
	}
	allDatasource, err := f.datasourceRepo.GetAll(ctx)
	if err != nil {
		log.WithContext(ctx).Error("【FixDatasourceStatus】get allDatasource Error", zap.Error(err))
		return
	}
	terminationDatasource := make([]*model.Datasource, 0)
	for _, datasource := range allDatasource {
		if datasource.MetadataTaskId != "" {
			log.WithContext(ctx).Infof("【FixDatasourceStatus】DatasourceStatus task not finish", zap.String("id", datasource.ID), zap.String("name", datasource.Name))
			terminationDatasource = append(terminationDatasource, datasource)
		}
		if datasource.MetadataTaskId == "" && datasource.Status == constant.DataSourceScanning {
			log.WithContext(ctx).Infof("【FixDatasourceStatus】 errDatasource task can not found ", zap.String("id", datasource.ID))
			datasource.Status = constant.DataSourceAvailable
			if err = f.datasourceRepo.UpdateDataSourceStatus(ctx, datasource); err != nil {
				log.WithContext(ctx).Error("【FixDatasourceStatus】fix errDatasource Error", zap.Error(err))
			}
		}
	}
	if len(terminationDatasource) == 0 {
		log.WithContext(ctx).Infof("【FixDatasourceStatus】no DatasourceStatus task ")
		return
	}

	var waitGroup sync.WaitGroup
	for i, datasource := range terminationDatasource {
		waitGroup.Add(1)
		go func(d *model.Datasource) {
			_ = f.Fix(ctx, d)
			waitGroup.Done()
		}(datasource)
		if i%100 == 0 {
			waitGroup.Wait()
		}
	}
	waitGroup.Wait()

}
func (f *formViewUseCase) Fix(ctx context.Context, datasource *model.Datasource) (err error) {
	if err = f.PollingCollectTask2(ctx, datasource); err != nil {
		log.WithContext(ctx).Error("【FixDatasourceStatus】PollingCollectTask Error", zap.Error(err))
		return err
	}
	datasource.Status = constant.DataSourceAvailable
	datasource.MetadataTaskId = ""
	if err = f.datasourceRepo.UpdateDataSourceStatusAndMetadataTaskId(ctx, datasource); err != nil {
		log.WithContext(ctx).Error("【FixDatasourceStatus】update DataSourceStatus and MetadataTaskId database Error", zap.Error(err))
		return err
	}
	return nil
}

func (f *formViewUseCase) GetDataSources(ctx context.Context, req *form_view.GetDatasourceListReq) (*form_view.GetDatasourceListRes, error) {
	// if req.Type != "" {
	// 	// 检查虚拟化引擎是否支持数据库类型
	// 	connectors, err := f.DrivenVirtualizationEngine.GetConnectors(ctx)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// 	// 支持的数据源类型的名称列表
	// 	connectorNames := make(map[string]bool)
	// 	for _, c := range connectors.ConnectorNames {
	// 		connectorNames[c.OLKConnectorName] = true
	// 	}
	// 	if !connectorNames[req.Type] {
	// 		return nil, errorcode.Desc(errorcode.PublicInvalidParameter, "datasource_type")
	// 	}
	// }
	if req.SourceTypes != "" {
		req.SourceTypeList = make([]int32, 0)
		split := strings.Split(req.SourceTypes, ",")
		for _, s := range split {
			st := enum.ToInteger[constant.SourceType](s).Int32()
			if st != 0 {
				req.SourceTypeList = append(req.SourceTypeList, st)
			}
		}
	}

	sources, err := f.datasourceRepo.GetDataSources(ctx, req)
	if err != nil {
		return nil, err
	}
	datasourceRes := make([]*form_view.Datasource, len(sources))
	for i, source := range sources {
		datasourceRes[i] = &form_view.Datasource{
			DataSourceID: source.DataSourceID,
			ID:           source.ID,
			InfoSystemID: source.InfoSystemID,
			Name:         source.Name,
			CatalogName:  source.CatalogName,
			Type:         source.TypeName,
			DatabaseName: source.DatabaseName,
			Schema:       source.Schema,
			CreatedAt:    source.CreatedAt.UnixMilli(),
			UpdatedAt:    source.UpdatedAt.UnixMilli(),
			Status:       source.Status,
		}
	}
	return &form_view.GetDatasourceListRes{
		Datasource: datasourceRes,
	}, nil

}

/*
func (f *formViewUseCase) ScanDataSources(ctx context.Context, ids []string) (*form_view.ScansResp, error) {
	f.SyncCCDataSourceOnce()

	dataSources, err := f.datasourceRepo.GetByIds(ctx, ids)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	var count = 0
	for _, dataSource := range dataSources {
		if err = f.Scan(ctx, dataSource.ID); err != nil {
			log.WithContext(ctx).Error("ScanDataSource", zap.Error(err), zap.String("datasource_id", dataSource.ID))
		} else {
			count++
		}
	}
	return &form_view.ScansResp{Count: count}, nil
}
*/

var CodeGenerationRuleUUIDDataView = uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")

func (f *formViewUseCase) Scan(ctx context.Context, req *form_view.ScanReq) (*form_view.ScanRes, error) {
	if startConcurrentScan, _ := f.configurationCenterDriven.GetGlobalSwitch(ctx, "StartConcurrentScan"); startConcurrentScan {
		return f.ConcurrentScan(ctx, req)
	}
	return f.SerialScan(ctx, req)
}
func (f *formViewUseCase) ConcurrentScan(ctx context.Context, req *form_view.ScanReq) (*form_view.ScanRes, error) {
	logger := audit.FromContextOrDiscard(ctx)
	res := &form_view.ScanRes{}
	//获取数据源信息
	dataSource, err := f.datasourceRepo.GetByIdWithCode(ctx, req.DatasourceID)
	if err != nil {
		return res, err
	}
	if dataSource.Status == constant.DataSourceScanning {
		return res, errorcode.Desc(my_errorcode.DataSourceIsScanning)
	}

	//设置数据源扫描中
	dataSource.Status = constant.DataSourceScanning
	if err = f.datasourceRepo.UpdateDataSourceStatus(ctx, dataSource); err != nil {
		return res, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	defer func() {
		//设置数据源可用
		dataSource.Status = constant.DataSourceAvailable
		if err = f.datasourceRepo.UpdateDataSourceStatus(ctx, dataSource); err != nil {
			log.WithContext(ctx).Error("【ScanDataSource】UpdateDataSource DataSourceAvailable Error", zap.Error(err))
		}
	}()

	//采集元数据
	if err = f.Collect(ctx, dataSource); err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】Scan Collect Error", zap.Error(err))
		return res, err
	}

	//创建虚拟视图
	if dataSource.DataViewSource == "" {
		if err = f.genDataViewSource(ctx, dataSource); err != nil {
			return res, err
		}
	}

	//对比采集元数据
	err = f.GetMetadataAndCompare(ctx, req, dataSource, res)
	if err != nil {
		return res, err
	}
	go logger.Info(api_audit_v1.OperationScanDataSource,
		&form_view.DataSourceSimpleResourceObject{
			DataSourceID: dataSource.ID,
			Name:         dataSource.Name,
		})
	return res, nil
}

func (f *formViewUseCase) GetMetadataAndCompare(ctx context.Context, req *form_view.ScanReq, dataSource *model.Datasource, res *form_view.ScanRes) error {
	formViews, err := f.repo.GetFormViewList(ctx, dataSource.ID)
	if err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	formViewsMap := make(map[string]*FormViewFlag)
	for _, formView := range formViews {
		formViewsMap[formView.TechnicalName] = &FormViewFlag{FormView: formView, flag: 1}
	}
	allTable, err := f.GetDataSourceAllTableInfo(ctx, dataSource)
	if err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】Scan Collect Error", zap.Error(err))
		return err
	}
	log.WithContext(ctx).Infof("【DrivenMetadata】 get table count %d ", len(allTable))
	if len(allTable) == 0 || dataSource.DataViewSource == "" {
		return errorcode.Desc(my_errorcode.DatasourceEmpty)
	}

	//增加扫描记录
	if err = f.updateScanRecord(ctx, dataSource.ID, req.TaskID, req.ProjectID); err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}

	allCount := len(allTable)
	wg := &sync.WaitGroup{}
	//统计失败视图
	createViewErrorCh := make(chan *form_view.ErrorView)
	createViewError := make([]*form_view.ErrorView, 0)
	//统计撤回审核的视图
	revokeAuditViewCh := make(chan *form_view.View)
	revokeAuditView := make([]*form_view.View, 0)
	go f.Receive(ctx, createViewErrorCh, &createViewError, revokeAuditViewCh, &revokeAuditView)

	//计算ve耗时
	costCh := make(chan *VETimeCost)
	cost := &VETimeCost{}
	go f.CostCalculate(costCh, cost)

	if allCount/constant.GoroutineMinTableCount >= constant.ConcurrentCount { //最大并发度
		wg.Add(constant.ConcurrentCount)
		singleGoroutineDealTableCount := allCount / constant.ConcurrentCount
		for i := 0; i < constant.ConcurrentCount; i++ {
			start := i * singleGoroutineDealTableCount
			end := (i + 1) * singleGoroutineDealTableCount                                                                 //end := (i+1)*singleGoroutineDealTableCount -1 不包含end
			go f.CompareView(ctx, wg, createViewErrorCh, revokeAuditViewCh, dataSource, formViewsMap, allTable[start:end]) //dataSource 只读不写; formViewsMap;
		}
		doneTable := singleGoroutineDealTableCount * constant.ConcurrentCount
		if remain := allCount - doneTable; remain > 0 {
			f.CompareView(ctx, nil, createViewErrorCh, revokeAuditViewCh, dataSource, formViewsMap, allTable[doneTable:])
		}

	} else if allCount > constant.GoroutineMinTableCount && allCount/constant.GoroutineMinTableCount <= constant.ConcurrentCount { //适时并发度
		count := allCount / constant.GoroutineMinTableCount
		wg.Add(count)
		singleGoroutineDealTableCount := allCount / count
		for i := 0; i < count; i++ {
			start := i * singleGoroutineDealTableCount
			end := (i + 1) * singleGoroutineDealTableCount
			go f.CompareView(ctx, wg, createViewErrorCh, revokeAuditViewCh, dataSource, formViewsMap, allTable[start:end])
		}
		doneTable := singleGoroutineDealTableCount * count
		if remain := allCount - doneTable; remain > 0 {
			f.CompareView(ctx, nil, createViewErrorCh, revokeAuditViewCh, dataSource, formViewsMap, allTable[doneTable:])
		}

	} else if allCount <= constant.GoroutineMinTableCount { //零并发度
		f.CompareView(ctx, nil, createViewErrorCh, revokeAuditViewCh, dataSource, formViewsMap, allTable)
	}

	wg.Wait()
	close(createViewErrorCh)
	close(revokeAuditViewCh)
	close(costCh)
	res.ErrorView = createViewError
	res.ErrorViewCount = len(createViewError)
	res.ScanViewCount = len(allTable)

	res.DeleteRevokeAuditViewList, err = f.deleteView(ctx, formViewsMap)
	if err != nil {
		return err
	}
	log.WithContext(ctx).Infof("createViewCost time %d ,createViewCount %d, createViewMax time %d", cost.createViewCost.Milliseconds(), cost.createViewCount, cost.createViewMax.Milliseconds())
	log.WithContext(ctx).Infof("updateViewCost time %d ,updateViewCount %d, updateViewMax time %d", cost.updateViewCost.Milliseconds(), cost.updateViewCount, cost.updateViewMax.Milliseconds())
	return nil
}
func (f *formViewUseCase) ReceiveErrorView(ctx context.Context, ch chan *form_view.ErrorView, createViewError *[]*form_view.ErrorView) {
	for re := range ch {
		*createViewError = append(*createViewError, re)
	}
}

func (f *formViewUseCase) Receive(ctx context.Context, createViewErrorCh chan *form_view.ErrorView, createViewError *[]*form_view.ErrorView, revokeAuditViewCh chan *form_view.View, revokeAuditView *[]*form_view.View) {
	for {
		select {
		case re, ok := <-createViewErrorCh:
			if !ok {
				return
			}
			*createViewError = append(*createViewError, re)
		case re2, ok := <-revokeAuditViewCh:
			if !ok {
				return
			}
			*revokeAuditView = append(*revokeAuditView, re2)
		}
	}
}

type VETimeCost struct {
	createViewCost  time.Duration
	createViewMax   time.Duration
	createViewCount int
	updateViewCost  time.Duration
	updateViewMax   time.Duration
	updateViewCount int
}

func (f *formViewUseCase) CostCalculate(costCh chan *VETimeCost, cost *VETimeCost) {
	for onePageCost := range costCh {
		cost.createViewCost += onePageCost.createViewCost
		cost.createViewCount += onePageCost.createViewCount
		cost.updateViewCost += onePageCost.updateViewCost
		cost.updateViewCount += onePageCost.updateViewCount
		if cost.createViewMax < onePageCost.createViewMax {
			cost.createViewMax = onePageCost.createViewMax
		}
		if cost.updateViewMax < onePageCost.updateViewMax {
			cost.updateViewMax = onePageCost.updateViewMax
		}
	}
}

func (f *formViewUseCase) CompareView(ctx context.Context, wg *sync.WaitGroup, createViewErrorCh chan *form_view.ErrorView, revokeAuditViewCh chan *form_view.View, dataSource *model.Datasource, formViewsMap map[string]*FormViewFlag, tables []*metadata.GetDataTableDetailDataBatchRes) {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("【ConcurrentCompareView panic】", zap.Any("error", err))
		}
	}()

	// 需要的逻辑视图编码的数量
	var uniformCatalogCodeCount int
	for _, table := range tables {
		if flag := formViewsMap[table.Name]; flag != nil && flag.UniformCatalogCode != "" {
			continue
		}
		uniformCatalogCodeCount++
	}

	// 生成逻辑视图的编码
	codeList, err := f.configurationCenterDrivenNG.Generate(ctx, CodeGenerationRuleUUIDDataView, uniformCatalogCodeCount)
	if agerrors.Code(err).GetErrorCode() == "ConfigurationCenter.CodeGenerationRule.NotFound" {
		// 找不到对应编码生成规则，说明 configuration-center 可能没有升级，兼容
		// 处理，逻辑视图的编码设置为空。当 configuration-center 完成升级后可再
		// 次设置编码
		//
		// 兼容处理仅限于 2.0.0.1 一个版本，2.0.0.2 时移除这此兼容处理
		log.WithContext(ctx).Warn("generate code for data view fail", zap.Error(err), zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", len(tables)))
		codeList = &configuration_center.CodeList{Entries: make([]string, len(tables))}
	} else if err != nil {
		log.WithContext(ctx).Error("generate code for data view fail", zap.Error(err), zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", len(tables)))
		return
	}
	cssjj, err := f.configurationCenterDriven.GetGlobalSwitch(ctx, "cssjj")
	if err != nil {
		log.WithContext(ctx).Error("SerialCompareView GetGlobalSwitch Error", zap.Error(err))
		cssjj = false
	}

	var codeListIndex int
	for _, table := range tables {
		findView := formViewsMap[table.Name]
		if findView == nil {
			if err = f.createView(ctx, createViewErrorCh, codeList.Entries[codeListIndex], dataSource, table); err != nil {
				return
			}
			codeListIndex++
		} else {
			//exist , form update or not form update (by field)
			var newUniformCatalogCode bool
			if newUniformCatalogCode = findView.FormView.UniformCatalogCode == ""; newUniformCatalogCode {
				findView.FormView.UniformCatalogCode = codeList.Entries[codeListIndex]
				codeListIndex++
			}
			if err = f.updateView(ctx, createViewErrorCh, revokeAuditViewCh, dataSource, findView.FormView, table, newUniformCatalogCode, nil, cssjj); err != nil {
				return
			}
			findView.mu.Lock()
			findView.flag = 2
			findView.mu.Unlock()
		}
	}
	if wg != nil {
		wg.Done()
	}
}

func (f *formViewUseCase) SerialScan(ctx context.Context, req *form_view.ScanReq) (*form_view.ScanRes, error) {
	//f.SyncCCDataSourceOnce()
	logger := audit.FromContextOrDiscard(ctx)
	res := &form_view.ScanRes{}
	//获取数据源信息
	dataSource, err := f.datasourceRepo.GetByIdWithCode(ctx, req.DatasourceID)
	if err != nil {
		return res, err
	}
	if dataSource.Status == constant.DataSourceScanning {
		return res, errorcode.Desc(my_errorcode.DataSourceIsScanning)
	}

	//设置数据源扫描中
	dataSource.Status = constant.DataSourceScanning
	if err = f.datasourceRepo.UpdateDataSourceStatus(ctx, dataSource); err != nil {
		return res, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	defer func() {
		//设置数据源可用
		dataSource.Status = constant.DataSourceAvailable
		if err = f.datasourceRepo.UpdateDataSourceStatus(ctx, dataSource); err != nil {
			log.WithContext(ctx).Error("【ScanDataSource】UpdateDataSource DataSourceAvailable Error", zap.Error(err))
		}
	}()

	//采集元数据
	if err = f.Collect(ctx, dataSource); err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】Scan Collect Error", zap.Error(err))
		return res, err
	}
	data, err := f.GetDataSourceAllTableInfo(ctx, dataSource)
	if err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】Scan Collect Error", zap.Error(err))
		return res, err
	}
	log.WithContext(ctx).Infof("【DrivenMetadata】 get table count %d ", len(data))
	if len(data) == 0 && dataSource.DataViewSource == "" {
		return res, errorcode.Desc(my_errorcode.DatasourceEmpty)
	}

	//创建虚拟视图
	if dataSource.DataViewSource == "" {
		if err = f.genDataViewSource(ctx, dataSource); err != nil {
			return res, err
		}
	}
	err = f.SerialCompareView(ctx, dataSource, data, res)
	if err != nil {
		return res, err
	}
	//扫描成功，增加扫描记录
	if err = f.updateScanRecord(ctx, dataSource.ID, req.TaskID, req.ProjectID); err != nil {
		return res, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	go logger.Info(api_audit_v1.OperationScanDataSource,
		&form_view.DataSourceSimpleResourceObject{
			DataSourceID: dataSource.ID,
			Name:         dataSource.Name,
		})
	return res, nil
}

var TaskRunning = errors.New("collect task running")
var TaskFail = errors.New("collect task fail")

func (f *formViewUseCase) Collect(ctx context.Context, datasource *model.Datasource) error {
	collectRes, err := f.DrivenMetadata.DoCollect(ctx, &metadata.DoCollectReq{DataSourceId: datasource.DataSourceID})
	if err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】Scan Collect DoCollect Error", zap.Error(err))
		return err
	}
	var taskId string
	split := strings.Split(collectRes.Data, "任务ID:")
	if len(split) == 2 {
		split2 := strings.Split(split[1], "}")
		if len(split2) > 0 {
			taskId = split2[0]
		}
	}
	if taskId == "" || len(taskId) != 19 {
		return errorcode.Detail(my_errorcode.MetaGetTaskIdFailure, collectRes.Data)
	}
	log.WithContext(ctx).Infof("DoCollect taskId :%s", taskId)
	datasource.MetadataTaskId = taskId
	if err = f.datasourceRepo.MetadataTaskId(ctx, datasource); err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】 DatabaseError update MetadataTaskId fail", zap.Error(err))
	}
	defer func() {
		datasource.MetadataTaskId = ""
		if err = f.datasourceRepo.MetadataTaskId(ctx, datasource); err != nil {
			log.WithContext(ctx).Error("【ScanDataSource】 DatabaseError update MetadataTaskId fail", zap.Error(err))
		}
	}()

	if err = f.PollingCollectTask2(ctx, datasource); err != nil {
		return err
	}
	return nil
}

func (f *formViewUseCase) PollingCollectTask(ctx context.Context, datasource *model.Datasource) error {
	taskId := datasource.MetadataTaskId
	var tmpErr error
	_ = retry.Do(
		func() error {
			tasks, taskErr := f.DrivenMetadata.GetTasks(ctx, &metadata.GetTasksReq{Keyword: taskId})
			if taskErr != nil {
				tmpErr = taskErr
				log.Errorf("【Scan Collect】GetTasks error :%s\n", taskErr)
				return nil
			}
			if len(tasks.Data) == 1 && tasks.Data[0].Status == 2 {
				//log.Infof("【Scan Collect】TaskRunning, taskId :%s， status :%d", taskId, tasks.Data[0].Status)
				return TaskRunning
			}
			if len(tasks.Data) == 1 && tasks.Data[0].Status == 1 {
				tmpErr = errorcode.Desc(my_errorcode.MetadataCollectTaskFail)
				log.Infof("【Scan Collect】TaskFail, taskId :%s， status :%d", taskId, tasks.Data[0].Status)
				return nil
			}
			log.Infof("【Scan Collect】TaskFinish, taskId :%s， status :%d", taskId, tasks.Data[0].Status)
			return nil
		},
		retry.OnRetry(func(n uint, err error) {
			log.Infof("【Scan Collect】 retry datasource: %d,times: #%d: %s\n", datasource.DataSourceID, n, err)
		}),
		retry.Attempts(15),
	)
	return tmpErr
}

func (f *formViewUseCase) PollingCollectTask2(ctx context.Context, datasource *model.Datasource) error {
	taskId := datasource.MetadataTaskId
	for i := 1; true; i++ {
		tasks, taskErr := f.DrivenMetadata.GetTasks(ctx, &metadata.GetTasksReq{Keyword: taskId})
		if taskErr != nil {
			log.Errorf("【Scan Collect】GetTasks error :%s\n", taskErr)
			return taskErr
		}
		if len(tasks.Data) == 1 && tasks.Data[0].Status == 2 {
			log.Infof("【Scan Collect】 retry datasource: %d,times: #%d\n", datasource.DataSourceID, i)
			time.Sleep(time.Second * time.Duration(i*10))
			continue
		}
		if len(tasks.Data) == 1 && tasks.Data[0].Status == 1 {
			log.Infof("【Scan Collect】TaskFail, taskId :%s， status :%d", taskId, tasks.Data[0].Status)
			return errorcode.Desc(my_errorcode.MetadataCollectTaskFail)
		}
		log.Infof("【Scan Collect】TaskFinish, taskId :%s", taskId)
		return nil
	}
	return nil
}

func (f *formViewUseCase) GetDataSourceAllTableInfo(ctx context.Context, dataSource *model.Datasource) ([]*metadata.GetDataTableDetailDataBatchRes, error) {
	tableDetail, err := f.DrivenMetadata.GetDataTableDetailBatch(ctx, &metadata.GetDataTableDetailBatchReq{
		Limit:        1000,
		Offset:       1,
		DataSourceId: dataSource.DataSourceID,
	})
	if err != nil {
		return nil, err
	}
	if tableDetail.TotalCount <= 1000 {
		return tableDetail.Data, nil
	}
	res := make([]*metadata.GetDataTableDetailDataBatchRes, 0)
	res = append(res, tableDetail.Data...)
	for i := 0; i < tableDetail.TotalCount/1000; i++ {
		nextTable, err := f.DrivenMetadata.GetDataTableDetailBatch(ctx, &metadata.GetDataTableDetailBatchReq{
			Limit:        1000,
			Offset:       i + 2,
			DataSourceId: dataSource.DataSourceID,
		})
		if err != nil {
			return nil, err
		}
		res = append(res, nextTable.Data...)
	}

	return res, nil
}

func (f *formViewUseCase) genDataViewSource(ctx context.Context, dataSource *model.Datasource) error {
	viewSource, err := f.DrivenVirtualizationEngine.CreateViewSource(ctx, &virtualization_engine.CreateViewSourceReq{
		//CatalogName:   strings.Replace(fmt.Sprintf("vdm_%s", dataSource.ID), "-", "", -1), //Not Available
		CatalogName:   fmt.Sprintf("vdm_%s", dataSource.CatalogName),
		ConnectorName: constant.VDMConnectorName,
	})
	if err != nil {
		return err
	}
	if len(viewSource) != 1 {
		log.WithContext(ctx).Error("genDataViewSource ve CreateViewSource name error", zap.Int("len(viewSource)", len(viewSource)))
		return errorcode.Desc(my_errorcode.CreateViewSourceError)
	}
	dataSource.DataViewSource = viewSource[0].Name
	if err = f.datasourceRepo.UpdateDataSourceView(ctx, dataSource); err != nil {
		if rollbackErr := f.DrivenVirtualizationEngine.DeleteDataSource(ctx, &virtualization_engine.DeleteDataSourceReq{
			CatalogName: strings.TrimSuffix(dataSource.DataViewSource, constant.DefaultViewSourceSchema),
		}); rollbackErr != nil {
			log.WithContext(ctx).Error("genDataViewSource DatabaseError and rollback  ve DeleteDataSource  Error", zap.Error(rollbackErr))
		}
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}
func (f *formViewUseCase) FirstScan(ctx context.Context, dataSource *model.Datasource, tables []*metadata.GetDataTableDetailDataBatchRes) (err error) {
	if err = f.genDataViewSource(ctx, dataSource); err != nil {
		return err
	}

	log.WithContext(ctx).Debug("generate code for data view", zap.Int("count", len(tables)))
	codeList, err := f.configurationCenterDrivenNG.Generate(ctx, CodeGenerationRuleUUIDDataView, len(tables))
	if agerrors.Code(err).GetErrorCode() == "ConfigurationCenter.CodeGenerationRule.NotFound" {
		// 找不到对应编码生成规则，说明 configuration-center 可能没有升级，兼容
		// 处理，逻辑视图的编码设置为空。当 configuration-center 完成升级后可再
		// 次设置编码
		//
		// 兼容处理仅限于 2.0.0.1 一个版本，2.0.0.2 时移除这此兼容处理
		log.WithContext(ctx).Warn("generate code for data view fail", zap.Error(err), zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", len(tables)))
		codeList = &configuration_center.CodeList{Entries: make([]string, len(tables))}
	} else if err != nil {
		log.WithContext(ctx).Error("generate code for data view fail", zap.Error(err), zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", len(tables)))
		return err
	}

	for i, table := range tables {
		if err = f.createView(ctx, nil, codeList.Entries[i], dataSource, table); err != nil {
			return err
		}
	}
	return nil
}

func (f *formViewUseCase) updateScanRecord(ctx context.Context, datasourceId string, taskId string, projectId string) error {
	log.WithContext(ctx).Info("updateScanRecord", zap.String("datasourceId", datasourceId), zap.String("taskId", taskId), zap.String("projectId", projectId))
	record, err := f.scanRecordRepo.GetByDatasourceIdAndScanner(ctx, datasourceId, taskId)
	if err != nil {
		log.WithContext(ctx).Error("updateScanRecord GetByDatasourceIdAndScanner Error", zap.Error(err))
		return err
	}
	if len(record) == 0 {
		err = f.scanRecordRepo.Create(ctx, &model.ScanRecord{
			DatasourceID: datasourceId,
			Scanner:      util.CE(taskId == "", constant.ManagementScanner, taskId).(string),
			ScanTime:     time.Now(),
		})
		if err != nil {
			log.WithContext(ctx).Error("updateScanRecord Create Error", zap.Error(err))
			return err
		}
	} else {
		record[0].ScanTime = time.Now()
		err = f.scanRecordRepo.Update(ctx, record[0])
		if err != nil {
			log.WithContext(ctx).Error("updateScanRecord Update Error", zap.Error(err))
			return err
		}
	}

	if projectId == "" && taskId != "" { //独立任务再增加管理者可见
		log.WithContext(ctx).Info("updateScanRecord independent task", zap.String("datasourceId", datasourceId))
		err = f.updateScanRecord(ctx, datasourceId, "", "")
		if err != nil {
			return err
		}
	}
	return nil
}
func (f *formViewUseCase) SerialCompareView(ctx context.Context, dataSource *model.Datasource, tables []*metadata.GetDataTableDetailDataBatchRes, res *form_view.ScanRes) error {
	formViews, err := f.repo.GetFormViewList(ctx, dataSource.ID)
	if err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	formViewsMap := make(map[string]*FormViewFlag)
	for _, formView := range formViews {
		formViewsMap[formView.TechnicalName] = &FormViewFlag{FormView: formView, flag: 1}
	}

	// 需要的逻辑视图编码的数量
	var uniformCatalogCodeCount int
	for _, table := range tables {
		if flag := formViewsMap[table.Name]; flag != nil && flag.UniformCatalogCode != "" {
			continue
		}
		uniformCatalogCodeCount++
	}

	// 生成逻辑视图的编码
	codeList, err := f.configurationCenterDrivenNG.Generate(ctx, CodeGenerationRuleUUIDDataView, uniformCatalogCodeCount)
	if agerrors.Code(err).GetErrorCode() == "ConfigurationCenter.CodeGenerationRule.NotFound" {
		// 找不到对应编码生成规则，说明 configuration-center 可能没有升级，兼容
		// 处理，逻辑视图的编码设置为空。当 configuration-center 完成升级后可再
		// 次设置编码
		//
		// 兼容处理仅限于 2.0.0.1 一个版本，2.0.0.2 时移除这此兼容处理
		log.WithContext(ctx).Warn("generate code for data view fail", zap.Error(err), zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", len(tables)))
		codeList = &configuration_center.CodeList{Entries: make([]string, len(tables))}
	} else if err != nil {
		log.WithContext(ctx).Error("generate code for data view fail", zap.Error(err), zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", len(tables)))
		return err
	}

	//统计失败视图
	createViewErrorCh := make(chan *form_view.ErrorView)
	createViewError := make([]*form_view.ErrorView, 0)
	go f.ReceiveErrorView(ctx, createViewErrorCh, &createViewError)

	cssjj, err := f.configurationCenterDriven.GetGlobalSwitch(ctx, "cssjj")
	if err != nil {
		log.WithContext(ctx).Error("SerialCompareView GetGlobalSwitch Error", zap.Error(err))
		cssjj = false
	}
	var codeListIndex int
	for _, table := range tables {
		if formViewsMap[table.Name] == nil {
			if err = f.createView(ctx, createViewErrorCh, codeList.Entries[codeListIndex], dataSource, table); err != nil {
				return err
			}
			codeListIndex++
		} else {
			//exist , form update or not form update (by field)
			var newUniformCatalogCode bool
			if newUniformCatalogCode = formViewsMap[table.Name].FormView.UniformCatalogCode == ""; newUniformCatalogCode {
				formViewsMap[table.Name].FormView.UniformCatalogCode = codeList.Entries[codeListIndex]
				codeListIndex++
			}
			if err = f.updateView(ctx, createViewErrorCh, nil, dataSource, formViewsMap[table.Name].FormView, table, newUniformCatalogCode, &res.UpdateRevokeAuditViewList, cssjj); err != nil {
				return err
			}
			formViewsMap[table.Name].flag = 2
		}
	}
	close(createViewErrorCh)
	res.ErrorView = createViewError
	res.ErrorViewCount = len(createViewError)
	res.ScanViewCount = len(tables)
	res.DeleteRevokeAuditViewList, err = f.deleteView(ctx, formViewsMap)
	if err != nil {
		return err
	}
	return nil
}

type FormViewFlag struct {
	*model.FormView
	flag int
	mu   sync.Mutex
}
type FormViewFieldFlag struct {
	*model.FormViewField
	flag int
}

func (f *formViewUseCase) createView(ctx context.Context, createViewErrorCh chan *form_view.ErrorView, uniformCatalogCode string, dataSource *model.Datasource, table *metadata.GetDataTableDetailDataBatchRes) (err error) {
	formViewId := uuid.New().String()
	fields := make([]*model.FormViewField, len(table.Fields))
	fieldObjs := make([]*es.FieldObj, len(table.Fields)) // 发送ES消息字段列表
	var selectField string
	for i, field := range table.Fields {
		fields[i] = &model.FormViewField{
			FormViewID:       formViewId,
			TechnicalName:    field.FieldName,
			BusinessName:     f.AutomaticallyField(ctx, field),
			OriginalName:     field.OrgFieldName,
			Comment:          sql.NullString{String: util.CutStringByCharCount(field.FieldComment, constant.CommentCharCountLimit), Valid: true},
			Status:           constant.FormViewNew.Integer.Int32(),
			PrimaryKey:       sql.NullBool{Bool: field.AdvancedParams.IsPrimaryKey(), Valid: true},
			DataType:         field.AdvancedParams.GetValue(constant.VirtualDataType),
			DataLength:       field.FieldLength,
			DataAccuracy:     ToDataAccuracy(field.FieldPrecision),
			OriginalDataType: field.FieldTypeName,
			IsNullable:       field.AdvancedParams.GetValue(constant.IsNullable),
			Index:            i + 1,
		}
		fieldObjs[i] = &es.FieldObj{
			FieldNameZH: fields[i].BusinessName,
			FieldNameEN: fields[i].TechnicalName,
		}
		if field.AdvancedParams.GetValue(constant.VirtualDataType) == "" { //不支持的类型设置状态，跳过创建
			fields[i].Status = constant.FormViewFieldNotSupport.Integer.Int32()
		} else {
			selectField = util.CE(selectField == "", util.QuotationMark(field.FieldName), fmt.Sprintf("%s,%s", selectField, util.QuotationMark(field.FieldName))).(string)
		}
	}
	formView := &model.FormView{
		ID:                 formViewId,
		UniformCatalogCode: uniformCatalogCode,
		TechnicalName:      table.Name,
		BusinessName:       f.AutomaticallyForm(ctx, table),
		OriginalName:       table.OrgName,
		Type:               constant.FormViewTypeDatasource.Integer.Int32(),
		DatasourceID:       dataSource.ID,
		Status:             constant.FormViewNew.Integer.Int32(),
		EditStatus:         constant.FormViewDraft.Integer.Int32(),
		Comment:            sql.NullString{String: util.CutStringByCharCount(table.Description, constant.CommentCharCountLimit), Valid: true},
		CreatedByUID:       ctx.Value(interception.InfoName).(*middleware.User).ID,
		UpdatedByUID:       ctx.Value(interception.InfoName).(*middleware.User).ID,
	}

	tx := f.repo.Db().WithContext(ctx).Begin()
	createSql := fmt.Sprintf("select %s from %s.%s.%s", selectField, dataSource.CatalogName, util.QuotationMark(dataSource.Schema), util.QuotationMark(table.Name))
	if err = f.repo.CreateFormAndField(ctx, formView, fields, createSql, tx); err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】createView  DatabaseError", zap.Error(err))
		tx.Rollback()
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if err = f.esRepo.PubToES(ctx, formView, fieldObjs); err != nil { //扫描创建元数据视图
		tx.Rollback()
		return err
	}
	if err = f.DrivenVirtualizationEngine.CreateView(ctx, &virtualization_engine.CreateViewReq{
		CatalogName: dataSource.DataViewSource, //虚拟数据源
		Query:       createSql,
		ViewName:    table.Name,
	}); err != nil {
		log.WithContext(ctx).Warn("【ScanDataSource】 DrivenVirtualizationEngine Error", zap.Error(err), zap.String("name", table.Name), zap.String("sql", createSql))
		code := agerrors.Code(err)
		createViewErrorCh <- &form_view.ErrorView{
			TechnicalName: table.Name,
			Error: &ginx.HttpError{
				Code:        code.GetErrorCode(),
				Description: code.GetDescription(),
				Solution:    code.GetSolution(),
				Cause:       code.GetCause(),
				Detail:      code.GetErrorDetails(),
			},
		}
		tx.Rollback()
		return nil
	}
	if err = tx.Commit().Error; err != nil {
		// rollback 回滚
		if rollbackErr := f.DrivenVirtualizationEngine.DeleteView(ctx, &virtualization_engine.DeleteViewReq{
			CatalogName: dataSource.DataViewSource,
			ViewName:    table.Name,
		}); rollbackErr != nil {
			log.WithContext(ctx).Error("【ScanDataSource】 DatabaseError and rollback DeleteView  Error", zap.Error(rollbackErr))
		}
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}
func (f *formViewUseCase) AutomaticallyForm(ctx context.Context, table *metadata.GetDataTableDetailDataBatchRes) (businessName string) {
	/*
		表业务名称按以下顺序自动生成：
		    来自加工模型关联的业务表名称
		    表注释
		    数据理解
		    表技术名称
	*/
	if businessName == "" {
		businessName = util.CutStringByCharCount(strings.TrimSpace(table.Description), constant.BusinessNameCharCountLimit)
	}
	if businessName == "" {
		businessName = util.CutStringByCharCount(strings.TrimSpace(table.Name), constant.BusinessNameCharCountLimit)
	}
	return
}

func (f *formViewUseCase) AutomaticallyField(ctx context.Context, field *metadata.FieldsBatch) (businessName string) {
	/*
		列业务名称按以下顺序自动生成：
		    来自加工模型关联的业务表“字段中文名称
		    字段注释
		    数据理解
		    列技术名称
	*/
	if businessName == "" {
		businessName = util.CutStringByCharCount(strings.TrimSpace(field.FieldComment), constant.BusinessNameCharCountLimit)
	}
	if businessName == "" {
		businessName = util.CutStringByCharCount(strings.TrimSpace(field.FieldName), constant.BusinessNameCharCountLimit)
	}
	return
}

// 更新 FormView
//
//   - newUniformCatalogCode 是否新分配了逻辑视图编码重复
func (f *formViewUseCase) updateView(ctx context.Context, createViewErrorCh chan *form_view.ErrorView, revokeAuditViewCh chan *form_view.View, dataSource *model.Datasource, formView *model.FormView, table *metadata.GetDataTableDetailDataBatchRes, newUniformCatalogCode bool, updateRevokeAuditViewList *[]*form_view.View, cssjj bool) (err error) {
	fieldList, err := f.fieldRepo.GetFormViewFieldList(ctx, formView.ID)
	if err != nil {
		return err
	}

	newFields := make([]*model.FormViewField, 0)
	updateFields := make([]*model.FormViewField, 0)
	deleteFields := make([]string, 0)

	fieldMap := make(map[string]*FormViewFieldFlag)
	for _, field := range fieldList {
		fieldMap[field.TechnicalName] = &FormViewFieldFlag{FormViewField: field, flag: 1}
	}
	formViewModify := false
	fieldNewOrDelete := false
	fieldObjs := make([]*es.FieldObj, len(table.Fields)) // 发送ES消息字段列表
	var selectFields string
	for i, field := range table.Fields {
		fieldObjs[i] = &es.FieldObj{
			FieldNameEN: field.FieldName,
		}
		if fieldMap[field.FieldName] == nil {
			//field new
			newField := &model.FormViewField{
				FormViewID:       formView.ID,
				TechnicalName:    field.FieldName,
				BusinessName:     f.AutomaticallyField(ctx, field),
				OriginalName:     field.OrgFieldName,
				Comment:          sql.NullString{String: util.CutStringByCharCount(field.FieldComment, constant.CommentCharCountLimit), Valid: true},
				Status:           constant.FormViewFieldNew.Integer.Int32(),
				PrimaryKey:       sql.NullBool{Bool: field.AdvancedParams.IsPrimaryKey(), Valid: true},
				DataType:         field.AdvancedParams.GetValue(constant.VirtualDataType),
				DataLength:       field.FieldLength,
				DataAccuracy:     ToDataAccuracy(field.FieldPrecision),
				OriginalDataType: field.FieldTypeName,
				IsNullable:       field.AdvancedParams.GetValue(constant.IsNullable),
				Index:            i + 1,
			}
			newFields = append(newFields, newField)
			formViewModify = true
			fieldNewOrDelete = true
			fieldObjs[i].FieldNameZH = newField.BusinessName
			if newField.DataType == "" { //不支持的类型设置状态，跳过创建
				newField.Status = constant.FormViewFieldNotSupport.Integer.Int32()
			} else {
				selectFields = util.CE(selectFields == "", util.QuotationMark(field.FieldName), fmt.Sprintf("%s,%s", selectFields, util.QuotationMark(field.FieldName))).(string)
			}
		} else {
			// field update
			oldField := fieldMap[field.FieldName]
			originalDataTypeChange := f.originalDataTypeChange(ctx, oldField, field)
			switch {
			case originalDataTypeChange: //字段类型变更
				//field  VirtualDataType  update
				updateFields = append(updateFields, f.updateFieldStruct(ctx, oldField, field, i+1))
				formViewModify = true
			case !originalDataTypeChange && oldField.Status == constant.FormViewFieldDelete.Integer.Int32(): //删除的反转为新增
				log.WithContext(ctx).Infof("FormViewFieldDelete status Reversal", zap.String("oldField ID", oldField.ID))
				updateFields = append(updateFields, &model.FormViewField{ID: oldField.ID, Status: constant.FormViewFieldNew.Integer.Int32(), Index: i + 1})
				formViewModify = true
			case oldField.Comment.String != field.FieldComment: //不变状态
				oldField.FormViewField.Index = i + 1
				oldField.FormViewField.Comment = sql.NullString{String: util.CutStringByCharCount(field.FieldComment, constant.CommentCharCountLimit), Valid: true}
				updateFields = append(updateFields, oldField.FormViewField)
			case oldField.Index != i+1:
				oldField.FormViewField.Index = i + 1
				updateFields = append(updateFields, oldField.FormViewField)
			case cssjj && field.FieldComment != "" && oldField.FormViewField.TechnicalName != field.FieldComment:
				updateFields = append(updateFields, oldField.FormViewField) //防止updateFields[len(updateFields)-1] 不存在
			default: //field not update
			}
			fieldMap[field.FieldName].flag = 2
			fieldObjs[i].FieldNameZH = oldField.BusinessName
			newDataType := field.AdvancedParams.GetValue(constant.VirtualDataType)
			selectField := f.genSelectSQL(originalDataTypeChange, newDataType, oldField, &updateFields)
			if originalDataTypeChange && field.AdvancedParams.GetValue(constant.VirtualDataType) == "" { //不支持的类型设置状态，跳过创建
				updateFields[len(updateFields)-1].Status = constant.FormViewFieldNotSupport.Integer.Int32()
			} else {
				selectFields = util.CE(selectFields == "", selectField, fmt.Sprintf("%s,%s", selectFields, selectField)).(string)
			}
			//长沙数据据局时 表字段描述变更同步到视图字段业务名称
			if cssjj && field.FieldComment != "" && oldField.FormViewField.TechnicalName != field.FieldComment {
				updateFields[len(updateFields)-1].BusinessName = field.FieldComment
			}
		}
	}
	for _, field := range fieldMap {
		if field.flag == 1 {
			//field delete
			deleteFields = append(deleteFields, field.ID)
			formViewModify = true
			fieldNewOrDelete = true
		}
	}
	//if taskId == "" && formView.TaskID.String != "" { //外部扫描过后，taskId制空
	//	formView.TaskID.String = ""
	//	formView.TaskID.Valid = true
	//	formViewUpdate = true
	//}
	formViewUpdate := formView.Comment.String != table.Description || formView.OriginalName != table.OrgName
	if formViewUpdate {
		formView.Comment = sql.NullString{String: util.CutStringByCharCount(table.Description, constant.CommentCharCountLimit), Valid: true}
		formView.OriginalName = table.OrgName
	}
	var query string
	if formViewModify { //表的字段有变化
		query = fmt.Sprintf("select %s from %s.%s.%s", selectFields, dataSource.CatalogName, util.QuotationMark(dataSource.Schema), util.QuotationMark(table.Name))
		if formView.FilterRule != "" {
			query = fmt.Sprintf(`%s where %s`, query, formView.FilterRule)
		}
		if err = f.DrivenVirtualizationEngine.ModifyView(ctx, &virtualization_engine.ModifyViewReq{
			CatalogName: dataSource.DataViewSource,
			Query:       query,
			ViewName:    table.Name,
		}); err != nil {
			log.WithContext(ctx).Error("【ScanDataSource】 DatabaseError ModifyView failed", zap.Error(err), zap.String("sql", query))
			code := agerrors.Code(err)
			createViewErrorCh <- &form_view.ErrorView{
				Id:            formView.ID,
				TechnicalName: table.Name,
				Error: &ginx.HttpError{
					Code:        code.GetErrorCode(),
					Description: code.GetDescription(),
					Solution:    code.GetSolution(),
					Cause:       code.GetCause(),
					Detail:      code.GetErrorDetails(),
				},
			}
			return nil
		}
		log.WithContext(ctx).Infof("formViewModify ", zap.String("table name", table.Name), zap.String("formView ID", formView.ID))
		if formView.EditStatus == constant.FormViewLatest.Integer.Int32() {
			formView.EditStatus = constant.FormViewDraft.Integer.Int32() //有修改，全部Draft
			if formView.Status == constant.FormViewNew.Integer.Int32() {
				formView.Status = constant.FormViewModify.Integer.Int32()
			}
			formViewUpdate = true
		}
		if formView.Status == constant.FormViewUniformity.Integer.Int32() || formView.Status == constant.FormViewNew.Integer.Int32() {
			formView.Status = constant.FormViewModify.Integer.Int32()
			formViewUpdate = true
		}
	} else { //表的字段无变化
		if formView.Status == constant.FormViewNew.Integer.Int32() || formView.Status == constant.FormViewModify.Integer.Int32() {
			formView.Status = constant.FormViewUniformity.Integer.Int32() //二次扫描无变化 视图状态变为无变化
			formViewUpdate = true
		}
		//草稿状态视图保持扫描状态
	}
	if formView.Status == constant.FormViewDelete.Integer.Int32() { //删除状态又找到
		log.WithContext(ctx).Infof("FormViewDelete status Reversal", zap.String("formView ID", formView.ID))
		formView.Status = constant.FormViewNew.Integer.Int32() //删除状态表反转为新建
		formView.EditStatus = constant.FormViewDraft.Integer.Int32()
		formViewUpdate = true
	}

	//长沙数据据局时 表描述变更同步到视图业务名称
	if cssjj && formView.BusinessName != table.Description {
		formView.BusinessName = table.Description
		formViewUpdate = true
	}

	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return err
	}
	if len(newFields) != 0 || len(updateFields) != 0 || len(deleteFields) != 0 { //字段及表都修改
		formView.UpdatedByUID = userInfo.ID
		if err = f.repo.UpdateViewTransaction(ctx, formView, newFields, updateFields, deleteFields, query); err != nil {
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		if err = f.esRepo.PubToES(ctx, formView, fieldObjs); err != nil { //扫描编辑元数据视图
			return err
		}
		f.RevokeAudit(ctx, formView, "原因：之前处于审核中时，有扫描到字段变更，因此撤销了当时的审核，需要重新进行提交")
		// 只有字段注释的值变化不会导致当前逻辑视图显示被更新
		if formViewModify {
			if updateRevokeAuditViewList != nil {
				*updateRevokeAuditViewList = append(*updateRevokeAuditViewList, &form_view.View{Id: formView.ID, BusinessName: formView.BusinessName})
			} else {
				revokeAuditViewCh <- &form_view.View{Id: formView.ID, BusinessName: formView.BusinessName}
			}
		}
	} else if formViewUpdate || newUniformCatalogCode { //只反转，字段不变更，或分配新的 UniformCatalogCode
		formView.UpdatedByUID = userInfo.ID
		if err = f.repo.Update(ctx, formView); err != nil {
			log.WithContext(ctx).Error("【formViewUseCase】updateView repo Update", zap.Error(err))
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
	}

	if fieldNewOrDelete {
		result, err := f.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, formView.ID)).Result()
		if err != nil {
			log.WithContext(ctx).Error("【formViewUseCase】updateView fieldNewOrDelete clear synthetic-data fail ", zap.Error(err))
		}
		log.WithContext(ctx).Infof("【formViewUseCase】updateView fieldNewOrDelete clear synthetic-data result %d", result)
	}

	return nil
}

func (f *formViewUseCase) genSelectSQL(originalDataTypeChange bool, scanNewDataType string, oldField *FormViewFieldFlag, updateFields *[]*model.FormViewField) string {
	technicalName := util.QuotationMark(oldField.TechnicalName)
	if originalDataTypeChange && oldField.ResetBeforeDataType.String != "" { //字段类型变更
		var updateField *model.FormViewField
		updateFieldsTmp := *updateFields
		if len(updateFieldsTmp) > 0 {
			updateField = updateFieldsTmp[len(*updateFields)-1]
		}
		if _, exist := constant.TypeConvertMap[scanNewDataType+oldField.DataType]; exist { //扫描新类型转为原来重置类型
			var selectField string
			switch oldField.DataType { //扫描转换
			case constant.DATE, constant.TIME, constant.TIME_WITH_TIME_ZONE, constant.DATETIME, constant.TIMESTAMP, constant.TIMESTAMP_WITH_TIME_ZONE:
				//扫描预设类型是scanNewDataType 不是beforeDataType:= util.CE(field.ResetBeforeDataType.String != "", field.ResetBeforeDataType.String, field.DataType).(string)
				if (scanNewDataType == constant.CHAR || scanNewDataType == constant.VARCHAR || scanNewDataType == constant.STRING) && oldField.ResetConvertRules.String != "" {
					selectField = fmt.Sprintf("try_cast(date_parse(%s,'%s') AS %s) %s", technicalName, oldField.ResetConvertRules.String, scanNewDataType, technicalName)
				} else {
					selectField = fmt.Sprintf("try_cast(%s AS %s) %s", technicalName, scanNewDataType, technicalName)
				}
			case constant.DECIMAL, constant.NUMERIC, constant.DEC:
				selectField = fmt.Sprintf("try_cast(%s AS %s(%d,%d)) %s", technicalName, scanNewDataType, oldField.DataLength, oldField.DataAccuracy.Int32, technicalName)
			default:
				selectField = fmt.Sprintf("try_cast(%s AS %s) %s", technicalName, scanNewDataType, technicalName)
			}
			updateField.DataType = oldField.DataType //当前数据类型改为非预设类型，重新扫描，预设类型属性值会自动更新，但不影响已选的类型（如：当前数据类型选项为A，预设类型为B，此时重新扫描预设类型变为C，当前类型选项仍然为A，但预设值会从B更新为C）
			updateField.ResetBeforeDataType = sql.NullString{String: scanNewDataType, Valid: true}
			return selectField
		} else { //其他情况改为预设
			updateField.DataType = scanNewDataType
			updateField.ResetBeforeDataType = sql.NullString{String: "", Valid: true}
			updateField.ResetConvertRules = sql.NullString{String: "", Valid: true}
			updateField.ResetDataLength = sql.NullInt32{Int32: 0, Valid: true}
			updateField.ResetDataAccuracy = sql.NullInt32{Int32: 0, Valid: true}
		}
	}
	if !originalDataTypeChange && oldField.ResetBeforeDataType.String != "" { //保持原有类型转换
		var selectField string
		switch oldField.DataType {
		case constant.DATE, constant.TIME, constant.TIME_WITH_TIME_ZONE, constant.DATETIME, constant.TIMESTAMP, constant.TIMESTAMP_WITH_TIME_ZONE:
			beforeDataType := util.CE(oldField.ResetBeforeDataType.String != "", oldField.ResetBeforeDataType.String, oldField.DataType).(string)
			if beforeDataType == constant.CHAR || beforeDataType == constant.VARCHAR || beforeDataType == constant.STRING {
				selectField = fmt.Sprintf("try_cast(date_parse(%s,'%s') AS %s) %s", technicalName, oldField.ResetConvertRules.String, scanNewDataType, technicalName)
			} else {
				selectField = fmt.Sprintf("try_cast(%s AS %s) %s", technicalName, scanNewDataType, technicalName)
			}
		case constant.DECIMAL, constant.NUMERIC, constant.DEC:
			selectField = fmt.Sprintf("try_cast(%s AS %s(%d,%d)) %s", technicalName, scanNewDataType, oldField.DataLength, oldField.DataAccuracy.Int32, technicalName)
		default:
			selectField = fmt.Sprintf("try_cast(%s AS %s) %s", technicalName, scanNewDataType, technicalName)
			return selectField
		}
	}
	return technicalName
}
func (f *formViewUseCase) updateFieldStruct(ctx context.Context, oldField *FormViewFieldFlag, field *metadata.FieldsBatch, i int) *model.FormViewField {
	updateField := &model.FormViewField{}
	if err := copier.Copy(updateField, oldField); err != nil {
		log.WithContext(ctx).Error("updateFieldStruct  copier.Copy err", zap.Error(err))
	}
	if oldField.Status != constant.FormViewNew.Integer.Int32() { //新建的修改还是新建
		updateField.Status = constant.FormViewFieldModify.Integer.Int32()
	}
	updateField.PrimaryKey = sql.NullBool{Bool: field.AdvancedParams.IsPrimaryKey(), Valid: true}
	updateField.DataType = field.AdvancedParams.GetValue(constant.VirtualDataType)
	updateField.DataLength = field.FieldLength
	updateField.DataAccuracy = ToDataAccuracy(field.FieldPrecision)
	updateField.OriginalDataType = field.FieldTypeName
	updateField.IsNullable = field.AdvancedParams.GetValue(constant.IsNullable)
	updateField.ResetBeforeDataType = sql.NullString{String: "", Valid: true}
	updateField.ResetConvertRules = sql.NullString{String: "", Valid: true}
	updateField.ResetDataLength = sql.NullInt32{Int32: 0, Valid: true}
	updateField.ResetDataAccuracy = sql.NullInt32{Int32: 0, Valid: true}
	updateField.Comment = sql.NullString{String: util.CutStringByCharCount(field.FieldComment, constant.CommentCharCountLimit), Valid: true}
	updateField.OriginalName = field.OrgFieldName
	updateField.Index = i
	return updateField
}
func ToDataAccuracy(FieldPrecision *int32) sql.NullInt32 {
	if FieldPrecision == nil {
		return sql.NullInt32{Int32: constant.DataAccuracyNULL, Valid: true}
	} else {
		return sql.NullInt32{Int32: *FieldPrecision, Valid: true}
	}
}
func (f *formViewUseCase) originalDataTypeChange(ctx context.Context, oldField *FormViewFieldFlag, field *metadata.FieldsBatch) bool {
	if oldField.ResetBeforeDataType.String != "" && oldField.OriginalDataType != field.FieldTypeName { //数据类型 被重置 对比 重置前数据类型
		return true
	}
	if oldField.ResetBeforeDataType.String == "" && oldField.OriginalDataType != field.FieldTypeName { //数据类型 未被重置 对比 数据类型
		return true
	}
	if oldField.IsNullable != field.AdvancedParams.GetValue(constant.IsNullable) {
		return true
	}
	if oldField.DataAccuracy.Int32 == constant.DataAccuracyNULL && field.FieldPrecision != nil {
		return true
	} else if field.FieldPrecision != nil && oldField.DataAccuracy.Int32 != *field.FieldPrecision {
		return true
	} else if field.FieldPrecision == nil && oldField.DataAccuracy.Int32 != constant.DataAccuracyNULL {
		return true
	}
	if oldField.DataLength != field.FieldLength {
		return true
	}
	if oldField.ResetBeforeDataType.String != "" && oldField.ResetBeforeDataType.String != field.AdvancedParams.GetValue(constant.VirtualDataType) { //数据类型 被重置 对比 重置前数据类型和扫描类型
		return true
	}
	if oldField.ResetBeforeDataType.String == "" && oldField.DataType != field.AdvancedParams.GetValue(constant.VirtualDataType) {
		return true
	}
	if oldField.PrimaryKey.Bool != field.AdvancedParams.IsPrimaryKey() {
		return true
	}
	if oldField.OriginalName != field.OrgFieldName {
		return true
	}
	//虚拟化数据类型 未处理
	//是否为空、comment、COLUMN_DEF、IS_NULLABLE，原因：不能显示
	return false
}

func (f *formViewUseCase) deleteView(ctx context.Context, formViewsMap map[string]*FormViewFlag) (deleteRevokeAuditViewList []*form_view.View, err error) {
	deleteIds := make([]string, 0)
	deleteRevokeAuditViewList = make([]*form_view.View, 0)
	for _, formView := range formViewsMap {
		if formView.flag == 1 {
			//delete
			deleteIds = append(deleteIds, formView.ID)

		}
	}
	log.WithContext(ctx).Infof("MultipleScan deleteView %+v", deleteIds)
	if len(deleteIds) == 0 {
		return
	}
	auditingLogicView, err := f.logicViewRepo.GetAuditingInIds(ctx, deleteIds)
	if err != nil {
		return deleteRevokeAuditViewList, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	for _, view := range auditingLogicView {
		f.RevokeAudit(ctx, view, "原因：之前处于审核中时，有扫描到视图删除，因此撤销了当时的审核，需要重新提交")
		deleteRevokeAuditViewList = append(deleteRevokeAuditViewList, &form_view.View{Id: view.ID, BusinessName: view.BusinessName})
	}
	auditAdvice := "之前有扫描到“源表删除”的结果，导致资源不可用并做了自动下线的处理。"
	if err = f.repo.UpdateViewStatusAndAdvice(ctx, auditAdvice, deleteIds); err != nil {
		return deleteRevokeAuditViewList, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return deleteRevokeAuditViewList, nil
}

func (f *formViewUseCase) RevokeAudit(ctx context.Context, logicView *model.FormView, auditAdvice string) {
	if logicView.OnlineStatus == constant.LineStatusUpAuditing {
		if err := f.UndoAudit(ctx, &form_view.UndoAuditReq{
			UndoAuditParam: form_view.UndoAuditParam{
				LogicViewID: logicView.ID,
				OperateType: constant.UndoUpAudit,
				AuditAdvice: "已自动撤销上线审核  " + auditAdvice,
			},
		}); err != nil {
			log.WithContext(ctx).Error("【ScanDataSource】MultipleScan UndoAudit OperateType up-audit Error", zap.Error(err), zap.String("LogicViewID", logicView.ID))
		}
	}
	/*	if logicView.OnlineStatus == constant.LineStatusDownAuditing {
		if err := f.UndoAudit(ctx, &form_view.UndoAuditReq{
			UndoAuditParam: form_view.UndoAuditParam{
				LogicViewID:    logicView.ID,
				OperateType:    constant.UndoDownAudit,
				AuditAdvice:    "已自动撤销下线审核  " + auditAdvice,
				ScanChangeUndo: true,
			},
		}); err != nil {
			log.WithContext(ctx).Error("【ScanDataSource】MultipleScan UndoAudit OperateType down-audit Error", zap.Error(err), zap.String("LogicViewID", logicView.ID))
		}
	}*/
}

func (f *formViewUseCase) FinishProject(ctx context.Context, req *form_view.FinishProjectReq) error {
	records, err := f.scanRecordRepo.GetByTaskIds(ctx, req.TaskIDs)
	if err != nil {
		log.WithContext(ctx).Error("FinishProject GetByScanner Error", zap.Error(err))
		return err
	}
	for _, record := range records {
		manageRecord, err := f.scanRecordRepo.GetByDatasourceIdAndScanner(ctx, record.DatasourceID, constant.ManagementScanner)
		if err != nil {
			log.WithContext(ctx).Error("FinishProject GetByDatasourceIdAndScanner Error", zap.Error(err))
			return err
		}
		if len(manageRecord) == 0 {
			err = f.scanRecordRepo.Create(ctx, &model.ScanRecord{
				DatasourceID: record.DatasourceID,
				Scanner:      constant.ManagementScanner,
				ScanTime:     time.Now(),
			})
			if err != nil {
				log.WithContext(ctx).Error("FinishProject Create Error", zap.Error(err))
				return err
			}
		}
	}
	return nil

}
