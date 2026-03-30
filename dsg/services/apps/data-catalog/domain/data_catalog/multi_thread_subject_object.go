package data_catalog

import (
	"context"
	"math"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/promise"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/panjf2000/ants/v2"
)

const SUBJECT_MAX_GOROUTINES = 5 // 协程池中最大的运行协程数
const SUBJECT_BATCH_TIMEOUT = 15 // 批量去请求元数据表的总超时时间，单位是秒

const SUBJECT_MAX_ID_COUNT = 10 // 批量去请求主题对象路径的id的个数，放在ids数组里的最大个数

// GetConcurrencySubjectObjects 多线程并发请求主题对象路径信息
func GetConcurrencySubjectObjects(ctx context.Context, businessObjectIDs []string) ([]*common.BOPathItem, error) {
	log.WithContext(ctx).Infof("GetConcurrencySubjectObjects开始，总的请求主题对象ids为：%v", businessObjectIDs)
	if len(businessObjectIDs) <= SUBJECT_MAX_ID_COUNT {
		subBusinessObjects, err := common.GetPathByBusinessDomainID(ctx, businessObjectIDs)
		if err != nil {
			return nil, err
		}
		log.WithContext(ctx).Info("GetConcurrencySubjectObjects结束")
		return subBusinessObjects, nil
	}
	// 设置超时时间
	poolCtx, cancel := context.WithTimeout(context.Background(), SUBJECT_BATCH_TIMEOUT*time.Second)
	defer cancel()

	// 设置协程池最大的协程数量
	antsPool, err := ants.NewPool(SUBJECT_MAX_GOROUTINES)
	if err != nil {
		log.WithContext(ctx).Errorf("初始化协程池错误，error is %v", err)
		return nil, err
	}

	taskFunc := func(subBusinessObjectIDs []string) *promise.Promise[[]*common.BOPathItem] {
		return promise.New(func(resolve func([]*common.BOPathItem), reject func(error)) {
			subBusinessObjects, err2 := common.GetPathByBusinessDomainID(ctx, subBusinessObjectIDs)
			if err2 != nil {
				log.WithContext(ctx).Errorf("请求主题对象路径信息接口报错,请求的subBusinessObjectIDs is %v, err is %v", subBusinessObjectIDs, err2)
				reject(err2)
			} else if len(subBusinessObjects) == 0 {
				// 这里因为主题对象被删除，会导致传入的部分主题对象id无法对应返回主题对象，这里不需报错，返回nil即可
				log.WithContext(ctx).Warnf("请求主题对象路径信息返回为空,但请求的subBusinessObjectIDs is %v", subBusinessObjectIDs)
				resolve(nil)
			} else {
				resolve(subBusinessObjects)
			}
		})
	}
	var taskList []*promise.Promise[[]*common.BOPathItem]

	// 比如 2 = 4.0/2; 3 = 5.0/2;
	batch := int(math.Ceil(float64(len(businessObjectIDs)) / float64(SUBJECT_MAX_ID_COUNT)))
	for i := 0; i < batch; i++ {
		if i+1 == batch {
			// 把任务加入协程池
			taskList = append(taskList, taskFunc(businessObjectIDs[i*SUBJECT_MAX_ID_COUNT:]))
		} else {
			// 把任务加入协程池
			taskList = append(taskList, taskFunc(businessObjectIDs[i*SUBJECT_MAX_ID_COUNT:(i+1)*SUBJECT_MAX_ID_COUNT]))
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

	var retList []*common.BOPathItem
	for _, tableInfoSlice := range *allSlices {
		retList = append(retList, tableInfoSlice...)
	}

	log.WithContext(ctx).Info("GetConcurrencySubjectObjects结束")
	return retList, nil
}
