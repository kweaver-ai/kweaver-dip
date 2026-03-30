package impl

/*
func (u *useCase) GetDataCatalogColumns(ctx context.Context, dataCatalog *model.TDataCatalog, fieldU64IDs []uint64) (*model.TDataCatalogResourceMount, []*model.TDataCatalogColumn, error) {
	ress, err := u.resRepo.Get(nil, ctx, dataCatalog.Code, common.RES_TYPE_TABLE)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get data catalog res, catalog code: %v, err: %v", dataCatalog.Code, err)
		return nil, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(ress) < 1 {
		errStr := fmt.Sprintf("no table res, catalog code: %v", dataCatalog.Code)
		log.WithContext(ctx).Warn(errStr)
		return nil, nil, nil
	}
	res := ress[0]

	//var fieldU64IDs []uint64
	//if fieldIDStr != "" {
	//	fieldIDStrs := strings.Split(fieldIDStr, ",")
	//	fieldU64IDs = lo.Map(fieldIDStrs, func(item string, _ int) uint64 {
	//		uintId, _ := strconv.ParseUint(item, 10, 64)
	//		return uintId
	//	})
	//}

	// 去掉开放不开放的限制 []int{common.OPEN_TYPE_OPEN}
	columns, err := u.colRepo.ListByOpenType(nil, ctx, dataCatalog.ID, nil, fieldU64IDs)
	if err != nil {
		return nil, nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(columns) < 1 {
		errStr := fmt.Sprintf("no columns res, catalog id: %v", dataCatalog.ID)
		log.WithContext(ctx).Warn(errStr)
		return nil, nil, nil
	}

	return res, columns, nil
}*/
/*
func (u *useCase) ClearSampleRedisCache(ctx context.Context, req *domain.ClearSampleCacheDataCatalogIDsReqParam) (*domain.ClearSampleCacheRespParam, error) {
	var successKeys, failKeys []string
	if req.DataCatalogIDStr == "all" {
		successKeys, failKeys = u.sampleCache.DeleteAllCache(ctx, common.RedisCachePrefix)
	} else {
		dataCatalogIDList := strings.Split(req.DataCatalogIDStr, ",")
		for _, dataCatalogID := range dataCatalogIDList {
			redisKey := common.RedisCachePrefix + dataCatalogID
			err := u.sampleCache.DeleteCacheWithKey(ctx, redisKey)
			if err != nil {
				failKeys = append(failKeys, redisKey)
			} else {
				successKeys = append(successKeys, redisKey)
			}
		}
	}
	return &domain.ClearSampleCacheRespParam{
		SuccessKeys:    successKeys,
		FailKeys:       failKeys,
		SampleDataConf: settings.GetConfig().SampleDataConf,
	}, nil
}
*/
/*
// QueryCacheOrElseNetWorkSamples 样例数据(分前后端两种情况)
func (u *useCase) QueryCacheOrElseNetWorkSamples(ctx context.Context, req *domain.GetDataCatalogSamplesReqParam, isFrontend bool) (*domain.GetDataCatalogSamplesRespParam, error) {
	dataCatalog, err := u.cataRepo.GetDetail(nil, ctx, req.CatalogID.Uint64(), nil)
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog: %v failed, err: %v", req.CatalogID.Uint64(), err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}

	if isFrontend {
		// 目录是否可以查看校验
		if err = common.CatalogPropertyCheckV1(dataCatalog); err != nil {
			return nil, err
		}
	}

	// 当虚拟化引擎样例数据缓存开关 或 大模型样例数据缓存开关都开启时，才走取缓存
	if u.sampleCache.VirtualizationCacheEnable || u.sampleCache.BigModelCacheEnable {
		return u.sampleCache.QueryCacheOrElseNetWorkSamples(ctx, u.GetDataCatalogSamples, dataCatalog)
	} else {
		return u.GetDataCatalogSamples(ctx, dataCatalog)
	}
}*/
/*
func (u *useCase) GetDataCatalogSamples(ctx context.Context, dataCatalog *model.TDataCatalog) (*domain.GetDataCatalogSamplesRespParam, error) {
	res, columns, err := u.GetDataCatalogColumns(ctx, dataCatalog, nil)
	if err == nil {
		if res == nil && columns == nil {
			return &domain.GetDataCatalogSamplesRespParam{}, nil
		}
	} else {
		return nil, err
	}

	var updateTime int64 //totalCount,
	var entries []map[string]string
	var isAI bool

	tableInfo, err := u.GetTableInfo(ctx, res)
	if err != nil {
		return nil, err
	}
	updateTime = tableInfo.UpdateTime

	// 先请求默认样例数据, 默认样例数据去掉分页*req.Offset, *req.Limit, true，故写死offset=1, limit=10, isRetTotalCount=false
	_, entries, err = u.GetVirtualEngineSampleDatas(ctx, tableInfo, 1, 10, false, "", columns)
	if err != nil {
		entries, _ = u.getAISamplesIfAISwitchOpen(ctx, &isAI, columns)
		return getRetSamplesRespParam(columns, updateTime, isAI, entries), nil
	} else {
		if len(entries) == 0 {
			entries, _ = u.getAISamplesIfAISwitchOpen(ctx, &isAI, columns)
			return getRetSamplesRespParam(columns, updateTime, isAI, entries), nil
		}
		return getRetSamplesRespParam(columns, updateTime, isAI, entries), nil
	}
}*/
/*
func getRetSamplesRespParam(columns []*model.TDataCatalogColumn, updateTime int64, isAI bool, entries []map[string]string) *domain.GetDataCatalogSamplesRespParam {
	retColumns := lo.Map(columns, func(item *model.TDataCatalogColumn, _ int) *domain.Column {
		return &domain.Column{ID: item.ID, CnTitle: item.NameCn, EnTitle: item.ColumnName}
	})

	return &domain.GetDataCatalogSamplesRespParam{
		UpdateTime: updateTime,
		IsAI:       isAI,
		//TotalCount: totalCount,
		Columns: retColumns,
		Entries: entries,
	}
}
*/
/*
// 当AI开关打开的时候，就去请求AI的样例数据
func (u *useCase) getAISamplesIfAISwitchOpen(ctx context.Context, isAI *bool, columns []*model.TDataCatalogColumn) ([]map[string]string, error) {
	//aiSampleDataShowValue, err := common.GetConfigCenterValueByKey(ctx, "AISampleDataShow")
	//if err != nil {
	//	return nil, err
	//}

	//if strings.ToUpper(aiSampleDataShowValue) == "YES" {
	if u.sampleCache.BigModelSwitch {
		// AI生成样例数据
		_, entries, err := getAIBigModelSampleDatas(ctx, columns)
		if err != nil {
			return nil, err
		}

		if len(entries) > 0 {
			*isAI = true
		}

		return entries, nil
	}
	//return nil, errors.New("AISampleDataShow is not YES")
	return nil, errors.New("big-model-switch is not YES")
}
*/
// asc：正序；desc：倒序。默认倒序
const (
	ASC  = "ASC"
	DESC = "DESC"
)

// 到数据安全处理接口请求得到脱敏后的sql，拼接分页和排序后再返回
/*func getVirtualEngineMaskingSql(ctx context.Context, columns []*model.TDataCatalogColumn, catalogName string, tableInfo *common.TableInfo,
	offset int, limit int, direction string, enableMasking bool) (selectRaw string, err error) {
	fullTableName := fmt.Sprintf("%s.%s.%s", catalogName, tableInfo.SchemaName, tableInfo.Name)

	colNames := lo.Map(columns, func(item *model.TDataCatalogColumn, _ int) string {
		return item.ColumnName
	})
	selectRaw = fmt.Sprintf(`SELECT %s FROM %s`, `"`+strings.Join(colNames, `","`)+`"`, fullTableName)

	// 排序目前以id或f_id，如果表字段有这两个字段且类型为数字型，则以此两字段排序，后期要扩充改此map即可
	idFieldExistMap := map[string]bool{
		"id":   false,
		"f_id": false,
	}
	fieldSubReqItems := lo.Map(columns, func(item *model.TDataCatalogColumn, _ int) *common.FieldSubReqItem {
		// 目前脱敏仅支持的字段类型为string，其他类型的字段不会做处理
		fieldType := "unknown"
		if item.DataFormat != nil {
			switch *item.DataFormat {
			case 0:
				fieldType = "int"
				if _, ok := idFieldExistMap[item.ColumnName]; ok {
					// 当字段为数字型，且在设置的排序字段内
					idFieldExistMap[item.ColumnName] = true
				}
			case 1:
				fieldType = "string"
			default:
				fieldType = "unknown"
			}
		}

		return &common.FieldSubReqItem{
			Field:       item.ColumnName,
			ChineseName: item.NameCn,
			Sensitive:   *item.SensitiveFlag,
			Classified:  *item.ClassifiedFlag,
			FieldType:   fieldType,
		}
	})

	if enableMasking {
		// 当脱敏服务开启时才去请求
		selectRaw, err = common.GetMaskingSqlByRequest(ctx, fieldSubReqItems, fullTableName)
		if err != nil {
			return "", errorcode.Detail(errorcode.SqlMaskingRequestErr, err)
		}
		log.WithContext(ctx).Infof("masking Sql raw查询数据脱敏接口后的sql为: %s", selectRaw)
	}

	// 自己在脱敏后的sql后面再拼接排序
	// 下载时要判断时间的排序 asc：正序；desc：倒序。默认倒序desc
	if strings.ToUpper(direction) == ASC || strings.ToUpper(direction) == DESC {
		sortField := ""
		for k, v := range idFieldExistMap {
			if v == true {
				sortField = k
				break
			}
		}
		if sortField != "" {
			selectRaw = fmt.Sprintf(`%s ORDER BY %s %s`, selectRaw, sortField, strings.ToUpper(direction))
		}

	}

	// 自己在排序的（如有）sql后面再拼接分页
	selectRaw = fmt.Sprintf(`%s OFFSET %d LIMIT %d`, selectRaw, (offset-1)*limit, limit)

	log.WithContext(ctx).Infof("virtual engine select raw sql 查询虚拟化引擎表数据的语句: %s", selectRaw)
	return selectRaw, nil
}
*/
/*func (u *useCase) GetTableInfo(ctx context.Context, res *model.TDataCatalogResourceMount) (*common.TableInfo, error) {
	tableInfos, err := common.GetTableInfo(ctx, []uint64{res.ResID})
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog: %v mounted table: %v failed, err: %v", res.CatalogID, res.ResID, err)
		return nil, errorcode.Detail(errorcode.DataSourceRequestErr, err)
	}
	if len(tableInfos) < 1 {
		errStr := fmt.Sprintf("no table info, table res id: %v", res.ResID)
		log.WithContext(ctx).Error(errStr)
		return nil, errorcode.Detail(errorcode.DataSourceNotFound, errors.New(errStr))
	}
	return tableInfos[0], nil
}*/

// GetVirtualEngineSampleDatas type=1，返回虚拟化引擎的样例数据
/*func (u *useCase) GetVirtualEngineSampleDatas(ctx context.Context, tableInfo *common.TableInfo,
	offset int, limit int, isRetTotalCount bool, direction string, columns []*model.TDataCatalogColumn) (int64, []map[string]string, error) {
	catalogName := common.GetDataSourceCatalogName(ctx, tableInfo.AdvancedParams)
	if len(catalogName) < 1 {
		errStr := "failed to get datasource catalog name, catalog name is empty"
		log.WithContext(ctx).Error(errStr)
		return 0, nil, errorcode.Detail(errorcode.DataSourceNotFound, errors.New(errStr))
	}

	var selectRaw string
	var rawResults *virtualization_engine.RawResult
	var totalCount int64
	var err error
	if isRetTotalCount {
		selectRaw = fmt.Sprintf(`SELECT count(*) FROM "%s"."%s"."%s"`,
			catalogName, tableInfo.SchemaName, tableInfo.Name)
		log.WithContext(ctx).Infof("virtual engine select raw sql count(*)查询虚拟化引擎表总条数的语句: %s", selectRaw)
		rawResults, err = u.virProxy.Raw(ctx, selectRaw)
		if err != nil {
			return 0, nil, err
		}

		rawCount := fmt.Sprintf("%v", rawResults.Data[0][0])
		totalCount, err = strconv.ParseInt(rawCount, 10, 64)
		if err != nil {
			// 可能字符串 s 不是合法的整数格式，处理错误
			return 0, nil, errorcode.Detail(errorcode.VirtualEngineRequestErr, err)
		}
	}

	// selectRaw包括数据脱敏接口返回的sql加上后面自己拼接的排序和分页
	selectRaw, err = getVirtualEngineMaskingSql(ctx, columns, catalogName, tableInfo, offset, limit, direction, u.sampleCache.DataMaskingEnable)
	if err != nil {
		return 0, nil, err
	}

	rawResults, err = u.virProxy.Raw(ctx, selectRaw)
	if err != nil {
		return 0, nil, err
	}

	entries := make([]map[string]string, len(rawResults.Data))
	for i, datum := range rawResults.Data {
		entries[i] = make(map[string]string, len(rawResults.Columns))
		for j, a := range datum {
			if a == nil {
				// nil 用%v打印会变成<nil>，所以单独返回null字符串
				entries[i][rawResults.Columns[j].Name] = "null"
			} else {
				entries[i][rawResults.Columns[j].Name] = fmt.Sprintf("%v", a)
			}
		}
	}
	return totalCount, entries, nil
}
*/
// type=2，返回AI生成样例数据
/*func getAIBigModelSampleDatas(ctx context.Context, columns []*model.TDataCatalogColumn) (totalCount int64, samples []map[string]string, err error) {
	defer func() {
		// 拦截超时的panic，使之不报500内部错误
		if e := recover(); e != nil {
			log.WithContext(ctx).Error("getAIBigModelSampleDatas occur panic")
			err = errors.New("getAIBigModelSampleDatas occur panic")
		}
	}()

	var differs, titles []string
	cn2EnColNameMap := make(map[string]string, len(columns))
	for _, columnItem := range columns {
		differs = append(differs, columnItem.NameCn)
		// 列名的中文与英文的键值对
		cn2EnColNameMap[columnItem.NameCn] = columnItem.ColumnName
	}

	fieldSuffix := ":str"
	for _, item := range differs {
		titles = append(titles, item+fieldSuffix)
	}
	sampleObj := domain.ADSampleDataRequestBody{
		Titles:  titles,
		Example: []string{},
		Differs: differs,
	}

	// 请求AD大模型接口得到样例数据，请求大模型时，是以中文列名去请求的
	resData, err := postAdSampleDataRequest(ctx, sampleObj)
	if err != nil {
		log.WithContext(ctx).Errorf("postAdSampleDataRequest occur err, err: %v", err)
		return 0, nil, err
	}

	resp := &domain.ADSampleDataResponseBody{}
	if err = json.Unmarshal(resData, &resp); err != nil {
		return 0, nil, err
	}

	//resp.Res.SampleData的结构为：[{
	//	"处罚结果": "违反",
	//	"处罚类型": "暂扣",
	//	"证件号码": "456789123"
	//}]
	// 返回时要把上面这个数组结构中的Map中的key转为英文字段即可
	entries := make([]map[string]string, 0)
	for _, adRowMap := range resp.Res.SampleData {
		entryMap := make(map[string]string, len(adRowMap))
		for k, v := range adRowMap {
			if _, ok := cn2EnColNameMap[k]; ok {
				// 存在
				entryMap[cn2EnColNameMap[k]] = v
			}
		}
		if len(entryMap) > 0 {
			entries = append(entries, entryMap)
		}

		// 超过10条就截断，最大返回10条
		if len(entries) >= 10 {
			break
		}
	}

	return int64(len(entries)), entries, nil
}*/

// var otelClient = &http.Client{Transport: otelhttp.NewTransport(&http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}), Timeout: 5 * time.Minute}

// func postAdSampleDataRequest(ctx context.Context, requestBodyObj interface{}) (data []byte, err error) {
// 	ctx, span := trace.StartInternalSpan(ctx)
// 	defer func() { trace.TelemetrySpanEnd(span, err) }()

// 	buf, err := json.Marshal(requestBodyObj)
// 	if err != nil {
// 		return nil, err
// 	}

// 	request, err := http.NewRequestWithContext(ctx, http.MethodPost, settings.GetConfig().DepServicesConf.AfSailorServiceHost+"/api/internal/af-sailor-service/v1/tools/large_language_model/sample_data", bytes.NewReader(buf))
// 	if err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, err
// 	}
// 	adResp, err := otelClient.Do(request)
// 	// 延时关闭
// 	defer adResp.Body.Close()

// 	if err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, err
// 	}
// 	// 返回的结果resp.Body
// 	resData, err := io.ReadAll(adResp.Body)
// 	if adResp.StatusCode != http.StatusOK {
// 		log.WithContext(ctx).Error(string(resData))
// 		return nil, errors.New(util.BytesToString(buf))
// 	}

// 	if err != nil {
// 		log.WithContext(ctx).Error(err.Error())
// 		return nil, err
// 	}

// 	return resData, nil
// }
