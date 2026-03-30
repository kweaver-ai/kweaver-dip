package common

/*
const MAX_GOROUTINES = 5 // 协程池中最大的运行协程数
const BATCH_TIMEOUT = 15 // 批量去请求元数据表的总超时时间，单位是秒

// MAX_TABLE_ID_COUNT 前面设置为1000，性能测试中1000总是报错，这里设置100
const MAX_TABLE_ID_COUNT = 100 // 批量去请求元数据表的id的个数，放在ids数组里的最大个数

// GetConcurrencyTableInfos 多线程并发请求元数据表信息
func GetConcurrencyTableInfos(ctx context.Context, tableIDs []uint64) ([]*TableInfo, error) {
	log.WithContext(ctx).Infof("GetConcurrencyTableInfos开始：%v", tableIDs)
	if len(tableIDs) <= MAX_TABLE_ID_COUNT {
		tableInfos, err := GetTableInfo(ctx, tableIDs)
		if err != nil {
			return nil, err
		}
		log.WithContext(ctx).Info("GetConcurrencyTableInfos结束")
		return tableInfos, nil
	}
	// 设置超时时间
	poolCtx, cancel := context.WithTimeout(context.Background(), BATCH_TIMEOUT*time.Second)
	defer cancel()

	// 设置协程池最大的协程数量
	antsPool, err := ants.NewPool(MAX_GOROUTINES)
	if err != nil {
		log.WithContext(ctx).Errorf("初始化协程池错误，error is %v", err)
		return nil, err
	}

	taskFunc := func(subTableIDs []uint64) *promise.Promise[[]*TableInfo] {
		return promise.New(func(resolve func([]*TableInfo), reject func(error)) {
			subTableInfos, err2 := GetTableInfo(ctx, subTableIDs)
			if err2 != nil || len(subTableInfos) == 0 {
				log.WithContext(ctx).Errorf("请求元数据表信息接口报错,请求的tableIDs is %v", subTableIDs)
				reject(err2)
			} else {
				resolve(subTableInfos)
			}
		})
	}
	var taskList []*promise.Promise[[]*TableInfo]

	// 比如 2 = 4.0/2; 3 = 5.0/2;
	batch := int(math.Ceil(float64(len(tableIDs)) / float64(MAX_TABLE_ID_COUNT)))
	for i := 0; i < batch; i++ {
		if i+1 == batch {
			// 把任务加入协程池
			taskList = append(taskList, taskFunc(tableIDs[i*MAX_TABLE_ID_COUNT:]))
		} else {
			// 把任务加入协程池
			taskList = append(taskList, taskFunc(tableIDs[i*MAX_TABLE_ID_COUNT:(i+1)*MAX_TABLE_ID_COUNT]))
		}
	}

	// 执行协程池中的任务
	pro := promise.AllWithPool(poolCtx, promise.FromAntsPool(antsPool), taskList...)
	// 等待所有的任务执行完毕，这里是返回切片的切片
	allSlices, err := pro.Await(poolCtx)
	if err != nil {
		// 等待所有的任务执行完毕，只要某一个任务出现了错误或panic，就会进入这里
		log.WithContext(ctx).Errorf("promise.Await报错,err is %v", err)
		return nil, err
	}

	var retList []*TableInfo
	for _, tableInfoSlice := range *allSlices {
		retList = append(retList, tableInfoSlice...)
	}

	log.WithContext(ctx).Info("GetConcurrencyTableInfos结束")
	return retList, nil
}
*/
