package impl

const (
	afCatalogKeyPrefix = "af_data_catalog"
	moduleName         = "lineage"
)

// type useCase struct {
// 	redisClient *repository.Redis
// 	adRepo      anydata_search.AnyDataSearch
// 	metaRepo    metadata.Repo
// 	resRepo     data_catalog_mount_resource.RepoOp
// 	cataRepo    catalog.RepoOp
// 	colRepo     catalog_column.RepoOp
// 	ccRepo      configuration_center.Repo
// 	virProxy    virtualization_engine.VirtualizationEngine
// }

// func NewUseCase(redisClient *repository.Redis,
// 	adRepo anydata_search.AnyDataSearch,
// 	metaRepo metadata.Repo,
// 	resRepo data_catalog_mount_resource.RepoOp,
// 	cataRepo catalog.RepoOp,
// 	colRepo catalog_column.RepoOp,
// 	ccRepo configuration_center.Repo,
// 	virProxy virtualization_engine.VirtualizationEngine,
// 	// sampleCache *cache.SampleCache) domain.UseCase {
// 	return &useCase{redisClient: redisClient,
// 		adRepo:   adRepo,
// 		metaRepo: metaRepo,
// 		resRepo:  resRepo,
// 		cataRepo: cataRepo,
// 		colRepo:  colRepo,
// 		ccRepo:   ccRepo,
// 		virProxy: virProxy,
// 		// sampleCache: sampleCache,
// 	}
// }

/*
func (u *useCase) GetBase(ctx context.Context, req *domain.GetBaseReqParam, isFrontend bool) (resp *domain.GetBaseResp, err error) {
	defer func() {
		if r := recover(); r != nil {
			if v, ok := r.(error); ok {
				log.WithContext(ctx).Error("GetBase panic ", zap.Error(v))
				err = v
			}
			log.WithContext(ctx).Error(fmt.Sprintf("GetBase panic %v", err))
		}
	}()
	catalog, err := u.cataRepo.GetDetail(nil, ctx, req.CatalogID.Uint64(), nil)
	// 只有前台接口（服务超市）才校验
	if err == nil && catalog != nil && isFrontend {
		if err = common.CatalogPropertyCheckV1(catalog); err != nil {
			return nil, err
		}
	}

	if err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", req.CatalogID.Uint64(), err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
	}

	if catalog == nil {
		log.WithContext(ctx).Errorf("catalog: %v not existed", req.CatalogID.Uint64())
		return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
	}

	// 根据catalog id获取resType = 1 （库表） 的记录 res_id 即为表id
	resources, err := u.resRepo.Get(nil, ctx, catalog.Code, 1)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(resources) == 0 {
		log.WithContext(ctx).Errorf("catalog mount not found, catalog_id: %v", req.CatalogID.String())
		return nil, errorcode.Desc(errorcode.CatalogNotFound)
	}

	tableID := resources[0].ResID
	infos, err := common.GetTableInfo(ctx, []uint64{tableID})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get metadata table info, err info: %v", err.Error())
		return nil, errorcode.Desc(errorcode.GetTableFailed)
	}
	if len(infos) == 0 {
		log.WithContext(ctx).Errorf("metadata table not found, table_id: %v", tableID)
		return nil, errorcode.Desc(errorcode.TableNotFound)
	}

	// 根据 table id 获取对应的 数据源信息
	dataSourceID := infos[0].DataSourceID
	dataSource, err := u.metaRepo.GetDataSource(ctx, dataSourceID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get metadata source info, err info: %v", err.Error())
		return nil, errorcode.Desc(errorcode.GetTableFailed)
	}

	infoSysNames, err := u.ccRepo.GetInfoSysName(ctx, []string{dataSourceID})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get info system name, err info: %v", err.Error())
	}
	var infoSysName string
	if len(infoSysNames) > 0 {
		infoSysName = infoSysNames[dataSourceID]
	}

	// f_db_type | f_db_name | f_tb_name
	dbType := strings.ToLower(dataSource.DataSourceTypeName)
	dbName := strings.ToLower(dataSource.DatabaseName)
	dbSchema := strings.ToLower(infos[0].SchemaName)
	tbName := resources[0].ResName
	//tbName := "t_data_element_his"
	dbAddr := fmt.Sprintf("%s:%v", dataSource.Host, dataSource.Port)

	var fieldsList *metadata.GetTableFieldsListResp
	fields := []*metadata.GetTableFieldsListReq{
		{DSID: dataSourceID, DBName: dbName, DBSchema: dbSchema, TBName: tbName},
	}
	fieldsList, err = u.metaRepo.GetTableFieldsList(ctx, fields)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get table fields list, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.GetTableFailed, err.Error())
	}

	// 配置全文检索搜索条件
	searchConfig := []*anydata_search.SearchConfig{
		{
			Tag: "t_lineage_tag_table",
			Properties: []*anydata_search.SearchProp{
				{Name: "f_db_type", Operation: "eq", OpValue: strings.ToLower(dbType)},
				{Name: "f_db_name", Operation: "eq", OpValue: strings.ToLower(dbName)},
				{Name: "f_tb_name", Operation: "eq", OpValue: strings.ToLower(tbName)},
				{Name: "f_db_schema", Operation: "eq", OpValue: strings.ToLower(dbSchema)},
			},
		},
	}
	kgID := settings.GetConfig().KgID
	fulltextSearch, err := u.adRepo.FulltextSearch(ctx, kgID, tbName, searchConfig)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to request fulltext search, err info: %v", err.Error())
	}
	log.WithContext(ctx).Infof("fulltextSearch result: %+v", fulltextSearch)

	// base := fulltextSearch.Res.Result[0].Vertexes[0]
	// 根据 jdbc url 过滤唯一的base
	var base *anydata_search.FulltextVertexes
	if fulltextSearch == nil || len(fulltextSearch.Res.Result) == 0 || len(fulltextSearch.Res.Result[0].Vertexes) == 0 {
		log.WithContext(ctx).Errorf("fulltext search result not found, query: %s, tbName: %s, dbType: %s, dbName: %s, dbSchema: %s", tbName, tbName, dbType, dbName, dbSchema)
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

	// vid := fulltextSearch.Res.Result[0].Vertexes[0].ID
	var vid string
	var neighborsResp *anydata_search.ADLineageNeighborsResp
	if base != nil {
		vid = base.ID
		neighborsResp, err = u.adRepo.NeighborSearch(ctx, vid, 1)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to request neighbor search, err info: %v", err.Error())
			neighborsResp = nil
		}
	} else {
		log.WithContext(ctx).Errorf("no matched jdbc_url")
	}

	expansionFlag, baseFields := domain.GetFields(neighborsResp, fieldsList)

	return domain.NewGetBaseResp(tbName, dbName, vid, infoSysName, expansionFlag, baseFields), nil
}
*/
/*
func (u *useCase) ListLineage(ctx context.Context, req *domain.ListLineageReqParam, isFrontend bool) (resp *domain.ListLineageResp, err error) {
	defer func() {
		if r := recover(); r != nil {
			if v, ok := r.(error); ok {
				log.WithContext(ctx).Error("GetBase panic ", zap.Error(v))
				err = v
			}
			log.WithContext(ctx).Error(fmt.Sprintf("GetBase panic %v", err))
		}
	}()

	key := fmt.Sprintf("%s:%s:%s", afCatalogKeyPrefix, moduleName, req.VID)

	cacheLength, err := u.redisClient.LLen(ctx, key)
	if err != nil {
		return nil, errorcode.Desc(errorcode.RedisOpeFailed)
	}

	limit, offset := *req.Limit, *req.Offset
	start := int64((offset - 1) * limit)
	stop := int64(offset*limit - 1)

	if cacheLength == 0 {
		// key 不存在，去 ad 查找
		neighborsResp, err := u.adRepo.NeighborSearch(ctx, req.VID, 2)
		if err != nil {
			return nil, errorcode.Desc(errorcode.LineageReqFailed)
		}

		list := domain.NewSummaryInfoList(req.VID, neighborsResp)

		fieldsReq := make([]*metadata.GetTableFieldsListReq, 0)
		dataSourceIDs := make([]string, 0)
		for _, base := range list {
			if base.DSID != "" {
				r := &metadata.GetTableFieldsListReq{
					DSID:     base.DSID,
					DBName:   base.DBName,
					DBSchema: base.DBSchema,
					TBName:   base.Name,
				}
				fieldsReq = append(fieldsReq, r)
				dataSourceIDs = append(dataSourceIDs, base.DSID)
			}
		}
		if len(fieldsReq) > 0 {
			fieldsList, err := u.metaRepo.GetTableFieldsList(ctx, fieldsReq)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to get table fields list, err info: %v", err.Error())
				return nil, errorcode.Desc(errorcode.GetTableFailed)
			}
			if fieldsList != nil && len(fieldsList.Data) > 0 {
				domain.AddFieldsType(list, fieldsList)
			}
		}
		if len(dataSourceIDs) > 0 {
			infoSysName, err := u.ccRepo.GetInfoSysName(ctx, dataSourceIDs)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to get info system name, err info: %v", err.Error())
			}
			if len(infoSysName) > 0 {
				domain.AddInfoSysName(list, infoSysName)
			}
		}

		// rpush
		if len(list) > 0 {
			go u.rpushList(context.Background(), key, list)
		}

		return domain.NewListLineageResp(lo.Slice(list, int(start), int(stop)+1), int64(len(list))), nil
	} else {

		if cacheLength < start-1 {
			return domain.NewListLineageResp(nil, 0), nil
		}

		results, err := u.redisClient.LRange(ctx, key, start, stop)
		if err != nil {
			log.WithContext(ctx).Errorf("u.redisClient.LRange exec failed, err info: %v", err.Error())
			return nil, errorcode.Desc(errorcode.RedisOpeFailed)
		}

		summary := make([]*domain.SummaryInfoBase, 0)
		for _, result := range results {
			r := &domain.SummaryInfoBase{}
			err := json.Unmarshal([]byte(result), &r)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to unmarshall from redis, result: %v", result)
				continue
			}
			summary = append(summary, r)
		}
		return domain.NewListLineageResp(summary, cacheLength), nil
	}
}
*/
// func (u *useCase) rpushList(ctx context.Context, cacheKey string, list []*domain.SummaryInfoBase) {
// 	// 结果序列化成json存到redis
// 	bytes := make([]interface{}, 0)

// 	for _, group := range list {
// 		res, err := json.Marshal(group)
// 		if err != nil {
// 			log.WithContext(ctx).Errorf("failed to json.Marshal response list, err: %v", err.Error())
// 			return
// 		}
// 		bytes = append(bytes, string(res))
// 	}

// 	conf := settings.GetConfig()
// 	expMin, _ := strconv.Atoi(conf.ADKgConf.CacheExpireMinutes)

// 	if expMin <= 0 || expMin > 12*60 {
// 		expMin = 8 * 60
// 	}

// 	_, err := u.redisClient.RPush(ctx, cacheKey, time.Duration(expMin)*time.Minute, bytes...)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to rpush bytes to redis, err: %v", err.Error())
// 	}
// }

// func (u *useCase) GetGraphInfo(ctx context.Context, req *domain.GetGraphInfoReqParam, isFrontend bool) (re *domain.GetGraphInfoResp, err error) {
// 	defer func() {
// 		if r := recover(); r != nil {
// 			if v, ok := r.(error); ok {
// 				log.WithContext(ctx).Error("GetGraphInfo panic ", zap.Error(v))
// 				err = v
// 			}
// 			log.WithContext(ctx).Error(fmt.Sprintf("GetGraphInfo panic %v", err))
// 		}
// 	}()

// 	catalog, err := u.cataRepo.GetDetail(nil, ctx, req.CatalogID.Uint64(), nil)
// 	// 只有前台接口（服务超市）才校验
// 	if err == nil && catalog != nil && isFrontend {
// 		if err = common.CatalogPropertyCheckV1(catalog); err != nil {
// 			return nil, err
// 		}
// 	}

// 	if err != nil {
// 		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", req.CatalogID.Uint64(), err)
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
// 		} else {
// 			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
// 		}
// 	}

// 	if catalog == nil {
// 		log.WithContext(ctx).Errorf("catalog: %v not existed", req.CatalogID.Uint64())
// 		return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
// 	}

// 	searchConfig := []*anydata_search.SearchConfig{
// 		{
// 			Tag: "datacatalog",
// 			Properties: []*anydata_search.SearchProp{
// 				{Name: "datacatalogid", Operation: "eq", OpValue: req.CatalogID.String()},
// 			},
// 		},
// 	}

// 	kgID := settings.GetConfig().GraphKgId
// 	fulltextSearch, err := u.adRepo.FulltextSearch(ctx, kgID, "", searchConfig)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to request fulltext search, err info: %v", err.Error())
// 		return nil, errorcode.Desc(errorcode.FulltextSearchFailed)
// 	}
// 	if len(fulltextSearch.Res.Result) == 0 || len(fulltextSearch.Res.Result[0].Vertexes) == 0 {
// 		log.WithContext(ctx).Errorf("fulltext search result not found, data-catalog id: %s", req.CatalogID.String())
// 		return nil, errorcode.Desc(errorcode.LineageReqFailed)
// 	}

// 	//var serviceID, appID string
// 	//serviceID, appID, err = u.getAlgConf(ctx)
// 	//if err != nil {
// 	//	return nil, err
// 	//}

// 	return &domain.GetGraphInfoResp{
// 		VID: fulltextSearch.Res.Result[0].Vertexes[0].ID,
// 	}, nil
// }

// func (u *useCase) getAlgConf(ctx context.Context) (serviceID, appID string, err error) {
// 	algServerConf, err := u.ccRepo.GetAlgServerConf(ctx, "AlgServerConf")
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to get alg server conf at cc, err info: %v", err.Error())
// 		return "", "", errorcode.Detail(errorcode.PublicInternalError, err)
// 	}
// 	if len(algServerConf) == 0 {
// 		log.WithContext(ctx).Errorf("alg server conf not found, check cc database or address")
// 		return "", "", errorcode.Desc(errorcode.PublicInternalError)
// 	}
// 	for _, cf := range algServerConf {
// 		log.WithContext(ctx).Infof("algServerConf: %+v", cf)
// 	}
// 	conf := algServerConf[0]

// 	var c struct {
// 		ServiceID string `json:"service_id"`
// 		AppID     string `json:"app_id"`
// 	}
// 	err = json.Unmarshal([]byte(conf.Addr), &c)
// 	if err != nil {
// 		log.WithContext(ctx).Errorf("failed to json.Unmarshal conf.Addr, err info: %v", err.Error())
// 		return "", "", err
// 	}

// 	// app_id NZ55ab9qSdbI3NlGR5x
// 	// service_id 24ecd8ce3a934ecd89b6fc0ec3aa545c
// 	// conf.Name := "AlgServerConf"
// 	// conf.Addr := `{"app_id":"NZ55ab9qSdbI3NlGR5x", "service_id":"24ecd8ce3a934ecd89b6fc0ec3aa545c"}`

// 	return c.ServiceID, c.AppID, nil
// }
