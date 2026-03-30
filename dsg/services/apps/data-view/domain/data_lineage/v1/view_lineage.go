package v1

import (
	"context"
	code "github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	fieldRepo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/sailor_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_lineage"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_lineage/processor"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/cache"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"encoding/json"
	"fmt"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"strings"
	"time"
)

const (
	afCatalogKeyPrefix = "af_data_view"
	moduleName         = "lineage"
)

type ViewLineageUseCase struct {
	config           *my_config.Bootstrap
	repo             repo.FormViewRepo
	fieldRepo        fieldRepo.FormViewFieldRepo
	datasourceRepo   datasource.DatasourceRepo
	graphSearchCall  sailor_service.GraphSearch
	objectSearchCall configuration_center.ObjectSearch
	redisClient      *cache.Redis
	process          *processor.FormViewInfoFetcher
}

func NewViewLineageUseCase(repo repo.FormViewRepo,
	config *my_config.Bootstrap,
	fieldRepo fieldRepo.FormViewFieldRepo,
	datasource datasource.DatasourceRepo,
	graphSearchCall sailor_service.GraphSearch,
	objectSearchCall configuration_center.ObjectSearch,
	redisClient *cache.Redis,
	process *processor.FormViewInfoFetcher,
) domain.UseCase {
	return &ViewLineageUseCase{
		config:           config,
		repo:             repo,
		fieldRepo:        fieldRepo,
		datasourceRepo:   datasource,
		graphSearchCall:  graphSearchCall,
		objectSearchCall: objectSearchCall,
		redisClient:      redisClient,
		process:          process,
	}
}

func (v ViewLineageUseCase) ParserLineage(ctx context.Context, req *domain.ParseLineageParamReq) (any, error) {
	data := map[string]interface{}{
		"id": req.ID,
	}
	return v.process.HandlerCallback(ctx, data, req.TableName, "insert")
}

func (v ViewLineageUseCase) GetBase(ctx context.Context, req *domain.GetBaseReqParam) (*domain.GetBaseResp, error) {
	var err error
	defer func() {
		if r := recover(); r != nil {
			if er, ok := r.(error); ok {
				log.WithContext(ctx).Error("GetBase panic ", zap.Error(er))
				err = er
			}
			log.WithContext(ctx).Error(fmt.Sprintf("GetBase panic %v", err))
		}
	}()
	//获取视图详情
	viewDetail, err := v.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//获取字段信息
	fieldsList, err := v.fieldRepo.GetFormViewFieldList(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get table fields list, err info: %v", err.Error())
		return nil, code.Detail(errorcode.GetTableFailed, err.Error())
	}
	//获取数据源信息

	graphResp := &sailor_service.FulltextVertexesFuncResp{
		TableName: viewDetail.TechnicalName,
	}
	if viewDetail.DatasourceID != "" {
		graphResp, err = v.QueryGraph(ctx, viewDetail.DatasourceID, viewDetail.TechnicalName)
		if err != nil {
			return nil, err
		}
	}

	// vid := fulltextSearch.Res.Result[0].Vertexes[0].ID
	var vid string
	var neighborsResp *sailor_service.ADLineageNeighborsResp
	if graphResp.GraphSearchResp != nil {
		vid = graphResp.GraphSearchResp.ID
		neighborsResp, err = v.graphSearchCall.NeighborSearch(ctx, vid, 1)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to request neighbor search, err info: %v", err.Error())
			neighborsResp = nil
		}
	} else {
		log.WithContext(ctx).Errorf("no matched jdbc_url")
	}

	expansionFlag, baseFields := domain.GetFields(neighborsResp, fieldsList)
	return domain.NewGetBaseResp(viewDetail.BusinessName, graphResp.TableName, graphResp.DBName, vid, graphResp.InfoSysName, expansionFlag, baseFields), nil
}

func (v ViewLineageUseCase) QueryGraph(ctx context.Context, datasourceID, technicalName string) (*sailor_service.FulltextVertexesFuncResp, error) {
	dataSource, err := v.datasourceRepo.GetById(ctx, datasourceID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get metadata source info, err info: %v", err.Error())
		return nil, code.Desc(errorcode.GetTableFailed)
	}
	//查询信息系统的名称, 为空就算了
	infoSysName := ""
	if dataSource.InfoSystemID != "" {
		infoSysResp, err := v.objectSearchCall.GetInfoSystemDetail(ctx, dataSource.InfoSystemID)
		if err != nil {
			log.Warnf("InfoSystem not found %v", dataSource.InfoSystemID)
		} else {
			infoSysName = infoSysResp.InfoSystemName
		}
	}
	dbType := strings.ToLower(dataSource.TypeName)
	dbName := strings.ToLower(dataSource.Name)
	dbSchema := strings.ToLower(dataSource.Schema)
	tbName := technicalName
	dbAddr := fmt.Sprintf("%s:%v", dataSource.Host, dataSource.Port)
	// 配置全文检索搜索条件
	searchConfig := []*sailor_service.SearchConfig{
		{
			Tag: "t_lineage_tag_table",
			Properties: []*sailor_service.SearchProp{
				{Name: "f_db_type", Operation: "eq", OpValue: strings.ToLower(dbType)},
				{Name: "f_db_name", Operation: "eq", OpValue: strings.ToLower(dbName)},
				{Name: "f_tb_name", Operation: "eq", OpValue: strings.ToLower(tbName)},
				{Name: "f_db_schema", Operation: "eq", OpValue: strings.ToLower(dbSchema)},
			},
		},
	}
	fulltextSearch, err := v.graphSearchCall.FulltextSearch(ctx, sailor_service.LineageKgID, tbName, searchConfig)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to request fulltext search, err info: %v", err.Error())
	}
	log.WithContext(ctx).Infof("fulltextSearch result: %+v", fulltextSearch)
	// 根据 jdbc url 过滤唯一的base
	var base *sailor_service.FulltextVertexes
	if fulltextSearch == nil || len(fulltextSearch.Res.Result) == 0 || len(fulltextSearch.Res.Result[0].Vertexes) == 0 {
		log.WithContext(ctx).Errorf("fulltext search result not found, query: %s, tbName: %s, "+
			"dbType: %s, dbName: %s, dbSchema: %s", tbName, tbName, dbType, dbName, dbSchema)
	} else {
	Loop:
		for i, result := range fulltextSearch.Res.Result {
			for j, vertex := range result.Vertexes {
				for _, property := range vertex.Properties {
					for _, prop := range property.Props {
						if prop.Name == "f_jdbc_url" && strings.Contains(prop.Value, dbAddr) {
							base = fulltextSearch.Res.Result[i].Vertexes[j]
							break Loop
						}
					}
				}
			}
		}
	}
	return &sailor_service.FulltextVertexesFuncResp{
		GraphSearchResp: base,
		InfoSysName:     infoSysName,
		TableName:       tbName,
		DBName:          dbName,
	}, nil
}

func (v ViewLineageUseCase) ListLineage(ctx context.Context, req *domain.ListLineageReqParam) (resp *domain.ListLineageResp, err error) {
	defer func() {
		if r := recover(); r != nil {
			if er, ok := r.(error); ok {
				log.WithContext(ctx).Error("GetBase panic ", zap.Error(er))
				err = er
			}
			log.WithContext(ctx).Error(fmt.Sprintf("GetBase panic %v", err))
		}
	}()

	key := fmt.Sprintf("%s:%s:%s", afCatalogKeyPrefix, moduleName, req.VID)

	cacheLength, err := v.redisClient.LLen(ctx, key)
	if err != nil {
		return nil, code.Desc(errorcode.RedisOpeFailed)
	}

	limit, offset := *req.Limit, *req.Offset
	start := int64((offset - 1) * limit)
	stop := int64(offset*limit - 1)

	if cacheLength == 0 {
		// key 不存在，去 ad 查找
		neighborsResp, err := v.graphSearchCall.NeighborSearch(ctx, req.VID, 2)
		if err != nil {
			return nil, code.Desc(errorcode.LineageReqFailed)
		}

		list := domain.NewSummaryInfoList(req.VID, neighborsResp)

		fieldsReq := make([]*domain.FormViewFieldQueryArg, 0)
		dataSourceIDs := make([]string, 0)
		for _, base := range list {
			if base.DSID != "" {
				fieldsReq = append(fieldsReq, &domain.FormViewFieldQueryArg{
					DSID:   base.DSID,
					DBName: base.Name})
				dataSourceIDs = append(dataSourceIDs, base.DSID)
			}
		}
		if len(fieldsReq) > 0 {
			fieldsList, err := v.getFieldsInGroup(ctx, fieldsReq)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to get table fields list, err info: %v", err.Error())
				return nil, code.Desc(errorcode.GetTableFailed)
			}
			if fieldsList != nil && len(fieldsList) > 0 {
				domain.AddFieldsType(list, fieldsList)
			}
		}
		//添加名称
		if len(dataSourceIDs) > 0 {
			infoSystemNames, err := v.getDataSourceInfoSystemName(ctx, dataSourceIDs)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to get info system name, err info: %v", err.Error())
			}
			if len(infoSystemNames) > 0 {
				domain.AddInfoSysName(list, infoSystemNames)
			}
		}

		// rpush
		if len(list) > 0 {
			go v.rPushList(context.Background(), key, list)
		}

		return domain.NewListLineageResp(lo.Slice(list, int(start), int(stop)+1), int64(len(list))), nil
	} else {

		if cacheLength < start-1 {
			return domain.NewListLineageResp(nil, 0), nil
		}

		results, err := v.redisClient.LRange(ctx, key, start, stop)
		if err != nil {
			log.WithContext(ctx).Errorf("u.redisClient.LRange exec failed, err info: %v", err.Error())
			return nil, code.Desc(errorcode.RedisOpeFailed)
		}

		summary := make([]*domain.SummaryInfoBase, 0)
		for _, result := range results {
			r := &domain.SummaryInfoBase{}
			if err := json.Unmarshal([]byte(result), &r); err != nil {
				log.WithContext(ctx).Errorf("failed to unmarshall from redis, result: %v", result)
				continue
			}
			summary = append(summary, r)
		}
		return domain.NewListLineageResp(summary, cacheLength), nil
	}
}

func (v ViewLineageUseCase) rPushList(ctx context.Context, cacheKey string, list []*domain.SummaryInfoBase) {
	// 结果序列化成json存到redis
	bytes := make([]interface{}, 0)

	for _, group := range list {
		res, err := json.Marshal(group)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to json.Marshal response list, err: %v", err.Error())
			return
		}
		bytes = append(bytes, string(res))
	}

	_, err := v.redisClient.RPush(ctx, cacheKey, time.Duration(domain.LineageCacheExpireMinutes)*time.Minute, bytes...)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to rpush bytes to redis, err: %v", err.Error())
	}
}

func (v ViewLineageUseCase) getFieldsInGroup(ctx context.Context, reqs []*domain.FormViewFieldQueryArg) ([]*domain.FormViewFieldListDetail, error) {
	//查询数据源
	ids := make([]string, 0)
	for i := range reqs {
		ids = append(ids, reqs[i].DSID)
	}
	dataSourceList, err := v.datasourceRepo.GetByDataSourceIds(ctx, ids)
	if err != nil {
		return nil, code.Detail(code.PublicDatabaseError, err.Error())
	}
	dataSourceMap := make(map[string]*model.Datasource)
	dataSourceIDMap := make(map[string]*model.Datasource)
	for i := range dataSourceList {
		dataSourceMap[dataSourceList[i].ID] = dataSourceList[i]
		dataSourceIDMap[fmt.Sprintf("%v", dataSourceList[i].DataSourceID)] = dataSourceList[i]
	}
	args := make([][]string, 0)
	for i := range reqs {
		dataSourceInfo, ok := dataSourceIDMap[reqs[i].DSID]
		if !ok {
			continue
		}
		args = append(args, []string{
			fmt.Sprintf("%v", dataSourceInfo.ID), reqs[i].DBName,
		})
	}

	//查询视图字段
	fieldInfoList, err := v.fieldRepo.DataSourceTables(ctx, args)
	if err != nil {
		return nil, code.Detail(code.PublicDatabaseError, err.Error())
	}
	resp := make([]*domain.FormViewFieldListDetail, 0)
	respDict := make(map[string]*domain.FormViewFieldListDetail)
	for i := range fieldInfoList {
		field := fieldInfoList[i]
		datasource, has := dataSourceMap[field.ViewDatasourceID]
		if !has {
			continue
		}
		key := field.ID
		tableInfo, ok := respDict[key]
		if !ok {
			tableInfo = &domain.FormViewFieldListDetail{
				DatasourceID: field.ViewDatasourceID,
				DSID:         fmt.Sprintf("%v", datasource.DataSourceID),
				DBName:       datasource.Name,
				DBSchema:     datasource.Schema,
				TBName:       field.ViewBusinessName,
				InfoSystemID: datasource.InfoSystemID,
				Fields:       make([]*model.FormViewField, 0),
			}
			resp = append(resp, tableInfo)
		}
		tableInfo.Fields = append(tableInfo.Fields, &(field.FormViewField))
		respDict[key] = tableInfo
	}
	return resp, nil
}

func (v ViewLineageUseCase) getDataSourceInfoSystemName(ctx context.Context, dataSourceIDList []string) (map[string]string, error) {
	dataSourceList, err := v.datasourceRepo.GetByDataSourceIds(ctx, dataSourceIDList)
	if err != nil {
		return nil, code.Detail(code.PublicDatabaseError, err.Error())
	}
	infoSystemIDs := make([]string, 0)
	for i := range dataSourceList {
		if name := dataSourceList[i].InfoSystemID; name != "" {
			infoSystemIDs = append(infoSystemIDs)
		}
	}
	//查询信息系统名称
	return v.objectSearchCall.GetInfoSystemNameBatch(ctx, infoSystemIDs)
}
