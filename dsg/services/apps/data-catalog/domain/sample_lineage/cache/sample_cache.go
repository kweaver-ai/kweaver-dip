package cache

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/sample_lineage"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

/** 解决方案
缓存穿透：设置了一个空的返回数据，用于在没有数据时返回(指用户查询数据，在缓存中不会有，在数据库也没有，这时要对不存在的空值也要进行缓存)，防止缓存穿透

缓存击穿：通过单飞模式控制并发

缓存雪崩：设置不同的过期时间，通过随机数和偏差控制
*/

const (
	// ExpiryDeviation make the haveDataExpiration deviation to avoid lots of cached items expire at the same time
	// make the haveDataExpiration to be [0.95, 1.05] * seconds
	// 缓存雪崩时，设置不同的过期时间对应的偏差
	ExpiryDeviation = 0.05
)

// var (
// 	RedisCacheNotFoundErr = errors.New("redis cache not found")
// 	RedisCacheInvalidErr  = errors.New("redis cache is invalid")
// )

// type SampleCache struct {
// 	redisClient               *repository.Redis
// 	VirtualizationCacheEnable bool
// 	DataMaskingEnable         bool
// 	BigModelSwitch            bool
// 	BigModelCacheEnable       bool
// 	haveDataExpiration        time.Duration
// 	emptyDataExpiration       time.Duration
// 	randDurationEntity        RandDuration
// 	singleFlight              *singleflight.Group
// }

// func NewSampleCache(redisClient *repository.Redis) *SampleCache {
// 	sampleDataConf := settings.GetConfig().VariablesConf.SampleDataConf
// 	// 样例数据有数据时用redis存储的过期时间，最后利用偏差得到随机的过期时间
// 	haveDataExpiration := time.Hour * time.Duration(sampleDataConf.HaveDataExpireHour)

// 	// 样例数据没有数据时的过期时间，最后利用偏差得到随机的过期时间
// 	emptyDataExpiration := time.Minute * time.Duration(sampleDataConf.EmptyDataExpireMinute)

// 	return &SampleCache{
// 		redisClient:               redisClient,
// 		VirtualizationCacheEnable: sampleDataConf.VirtualizationCacheEnable,
// 		DataMaskingEnable:         sampleDataConf.DataMaskingEnable,
// 		BigModelSwitch:            sampleDataConf.BigModelSwitch,
// 		BigModelCacheEnable:       sampleDataConf.BigModelCacheEnable,
// 		haveDataExpiration:        haveDataExpiration,
// 		emptyDataExpiration:       emptyDataExpiration,
// 		randDurationEntity:        NewRandDuration(ExpiryDeviation),
// 		singleFlight:              &singleflight.Group{},
// 	}
// }

/*
func (s *SampleCache) getCache(ctx context.Context, key string) (*domain.GetDataCatalogSamplesRespParam, error) {
	client := s.redisClient.GetClient()
	dataStr, err := client.Get(ctx, key).Result()
	if err != nil {
		// 在redis没有找到
		if err == redis.Nil {
			return nil, RedisCacheNotFoundErr
		}
		return nil, err
	}

	var res = &domain.GetDataCatalogSamplesRespParam{}
	err = json.Unmarshal([]byte(dataStr), res)
	if err != nil {
		// 在redis找到，但是不能正常解析，则删除这个无效的缓存
		_ = client.Del(ctx, key).Err()

		return nil, RedisCacheInvalidErr
	}

	return res, nil
}
*/
/*
func (s *SampleCache) setCacheWithExpire(ctx context.Context, key string, value string, expire time.Duration) (err error) {
	return s.redisClient.GetClient().Set(ctx, key, value, s.randDurationEntity.AroundDuration(expire)).Err()
}*/

// DeleteCacheWithKey 删除某一个key的缓存
// func (s *SampleCache) DeleteCacheWithKey(ctx context.Context, key string) (err error) {
// 	client := s.redisClient.GetClient()
// 	_, err = client.Get(ctx, key).Result()
// 	if err != nil {
// 		// 在redis没有找到
// 		if err == redis.Nil {
// 			log.WithContext(ctx).Infof("redis cache not existed, key is %s", key)
// 		}
// 		log.WithContext(ctx).Infof("redis cache get failed, key is %s, err is %v", key, err)
// 		return err
// 	} else {
// 		// 这里没有这个key删除也不会报错的
// 		err = client.Del(ctx, key).Err()
// 		if err != nil {
// 			log.WithContext(ctx).Infof("redis cache delete failed, err is %v", err)
// 			return err
// 		}
// 		log.WithContext(ctx).Infof("redis cache delete success, key is %s", key)
// 		return nil
// 	}
// }

// DeleteAllCache 删除所有的前缀为入参的缓存
/*func (s *SampleCache) DeleteAllCache(ctx context.Context, redisCachePrefix string) (successKeys, failKeys []string) {
	client := s.redisClient.GetClient()
	var allRedisKeys []string
	var cursor uint64
	// 获取前缀下的所有redis的key，scan函数不会阻塞redis
	allRedisKeys, cursor, err := client.Scan(ctx, cursor, redisCachePrefix+"*", 100).Result()
	if err != nil {
		return
	}
	for _, redisKey := range allRedisKeys {
		err := s.DeleteCacheWithKey(ctx, redisKey)
		if err != nil {
			failKeys = append(failKeys, redisKey)
		} else {
			successKeys = append(successKeys, redisKey)
		}
	}
	return
}
*/

// QueryFn 要和请求的样例数据方法对应上
type QueryFn func(ctx context.Context, dataCatalog *model.TDataCatalog) (*domain.GetDataCatalogSamplesRespParam, error)

/*
func (s *SampleCache) QueryCacheOrElseNetWorkSamples(ctx context.Context, query QueryFn, dataCatalog *model.TDataCatalog) (samplesRes *domain.GetDataCatalogSamplesRespParam, err error) {
	defer func(samplesRes **domain.GetDataCatalogSamplesRespParam, err *error) {
		if e := recover(); e != nil {
			log.WithContext(ctx).Errorf("======QueryCacheOrElseNetWorkSamples panic======%v", e)
			*samplesRes = &domain.GetDataCatalogSamplesRespParam{}
			*err = nil
		}
	}(&samplesRes, &err)

	redisKey := common.GetCacheRedisKey(fmt.Sprintf("%d", dataCatalog.ID))
	// 防止缓存击穿，当有多个协程同时获取同一个redis的key对应的值时, 只有一个协程会真的先去redis缓存读取并经过以下的业务逻辑后返回结果,其他的协程会等待该协程结束直接收到结果
	singleFlightRes, err, _ := s.singleFlight.Do(redisKey, func() (r interface{}, err error) {
		log.WithContext(ctx).Infof("====do singleFlight====")
		cacheRes, err := s.getCache(ctx, redisKey)
		if err != nil {
			log.WithContext(ctx).Errorf("====get samples from redis cache fail, err is %v====", err)

			var isRedisNotFound bool
			if err == RedisCacheNotFoundErr {
				isRedisNotFound = true
			}

			log.WithContext(ctx).Infof("====start query samples from db or big model====")
			// 当拿redis的缓存失败，请去请求样例数据，目前的逻辑是先请求虚拟化引擎样例数据，失败或没数据就去请求大模型样例数据（大模型失败会返回空数据），即最终返回要么是有数据要么是空
			networkRes, err := query(ctx, dataCatalog)
			log.WithContext(ctx).Infof("====end query network samples from db or big model====")
			if err != nil {
				return nil, err
			}

			// 当在redis没有缓存
			if isRedisNotFound {
				// 默认认为缓存空数据，且缓存时间相对设置短一点
				var expiration = s.emptyDataExpiration
				// 请求样例数据后数据不为空
				if len(networkRes.Entries) > 0 {
					// 这种有数据的情况，缓存时间相对设置长一点
					expiration = s.haveDataExpiration
				}
				bytes, err := json.Marshal(networkRes)
				if err != nil {
					return nil, err
				}

				// 当样例数据是大模型返回的
				if networkRes.IsAI {
					if s.BigModelCacheEnable {
						_ = s.setCacheWithExpire(ctx, redisKey, string(bytes), expiration)
						log.WithContext(ctx).Infof("====cache samples success from big model, redisKey is %v====", redisKey)
					}
				} else {
					if s.VirtualizationCacheEnable {
						_ = s.setCacheWithExpire(ctx, redisKey, string(bytes), expiration)
						log.WithContext(ctx).Infof("====cache samples success from virtualization engine, redisKey is %v====", redisKey)
					}
				}

			}

			// 当样例数据是大模型返回的
			if networkRes.IsAI {
				log.WithContext(ctx).Infof("====get samples success from big model, CatalogID is %v====", dataCatalog.ID)
			} else {
				log.WithContext(ctx).Infof("====get samples success from virtualization engine, CatalogID is %v====", dataCatalog.ID)
			}

			return networkRes, nil
		}

		log.WithContext(ctx).Infof("====get samples success from redis cache, redisKey is %v====", redisKey)
		return cacheRes, nil
	})

	if err != nil {
		// 返回样例数据失败也不报错误，返回空就行；如果要求报错，则上面singleFlight.Do返回的错误要细化定义
		return &domain.GetDataCatalogSamplesRespParam{}, nil
	}

	return singleFlightRes.(*domain.GetDataCatalogSamplesRespParam), nil
}
*/
