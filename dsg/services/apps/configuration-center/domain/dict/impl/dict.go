package impl

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/dict"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/dict"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"

	"github.com/redis/go-redis/v9"
)

type useCase struct {
	repo  dict.Repo
	redis *redis.Client
}

func NewUseCase(repo dict.Repo, redis *redis.Client) domain.UseCase {
	return &useCase{repo: repo, redis: redis}
}

func (uc *useCase) GetDictItemByType(ctx context.Context, dictTypes []string, queryType string) (*domain.Dicts, error) {
	var (
		err   error
		dicts []*model.TDictItem
	)
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if dicts, err = uc.repo.GetDictItemByType(ctx, dictTypes, queryType); err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.GetDictItemByType error: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	var (
		dictTypeMap = make(map[string]*domain.DictEntry) // 使用map来追踪已存在的类型
		resp        = &domain.Dicts{Dicts: make([]*domain.DictEntry, 0)}
	)

	for _, dict_item := range dicts {
		entry, exists := dictTypeMap[dict_item.FType]
		if !exists {
			entry = &domain.DictEntry{
				DictType:     dict_item.FType,
				DictItemResp: make([]*domain.DictItemResp, 0),
			}
			dictTypeMap[dict_item.FType] = entry
			resp.Dicts = append(resp.Dicts, entry)
		}

		entry.DictItemResp = append(entry.DictItemResp, &domain.DictItemResp{
			ID:          strconv.FormatUint(dict_item.ID, 10),
			DictKey:     dict_item.FKey,
			DictValue:   dict_item.FValue,
			Description: dict_item.FDescription,
			Sort:        dict_item.FSort,
		})
	}
	return resp, nil
}

func (uc *useCase) QueryDictPage(ctx context.Context, req *domain.QueryPageReqParam) (resp *domain.QueryPageRespParam, err error) {
	pageInfo := &request.PageInfo{
		Offset:    req.Offset,
		Limit:     req.Limit,
		Direction: req.Direction,
		Sort:      req.Sort,
	}
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	lists, total, err := uc.repo.ListDictByPaging(ctx, pageInfo, req.Name, req.QueryType)
	if err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.QueryDictPage error: %v", err)
		return nil, err
	}
	entries := make([]*domain.DictResp, len(lists), len(lists))

	for i, m := range lists {
		entries[i] = &domain.DictResp{
			ID:          strconv.FormatUint(m.ID, 10),
			Name:        m.Name,
			Type:        m.FType,
			Description: m.FDescription,
			Version:     m.FVersion,
			CreatedAt:   m.CreatedAt.UnixMilli(),
			CreatorName: m.CreatorName,
			UpdatedAt:   m.UpdatedAt.UnixMilli(),
			UpdaterName: m.UpdaterName,
		}
	}
	return &domain.QueryPageRespParam{
		DictResp:   entries,
		TotalCount: total,
	}, nil
}

func (uc *useCase) QueryDictItemPage(ctx context.Context, req *domain.QueryPageItemReqParam) (resp *domain.QueryPageItemRespParam, err error) {
	pageInfo := &request.PageInfo{
		Offset:    req.Offset,
		Limit:     req.Limit,
		Direction: req.Direction,
		Sort:      req.Sort,
	}
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	lists, total, err := uc.repo.ListDictItemByPaging(ctx, pageInfo, req.Name, getIdInt64(req.DictId))
	if err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.QueryDictItemPage error: %v", err)
		return nil, err
	}
	entries := make([]*domain.DictItemResp, len(lists), len(lists))

	for i, m := range lists {
		entries[i] = &domain.DictItemResp{
			ID:          strconv.FormatUint(m.ID, 10),
			DictKey:     m.FKey,
			DictValue:   m.FValue,
			Sort:        m.FSort,
			Description: m.FDescription,
		}
	}
	return &domain.QueryPageItemRespParam{
		DictItemResp: entries,
		TotalCount:   total,
	}, nil
}

func (uc *useCase) GetDictById(ctx context.Context, id string) (resp *domain.DictResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	m, err := uc.repo.GetDictByID(ctx, getIdInt64(id))
	if err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.GetDictById error: %v", err)
		return nil, err
	}
	dictEntries := &domain.DictResp{
		ID:          strconv.FormatUint(m.ID, 10),
		Name:        m.Name,
		Type:        m.FType,
		Description: m.FDescription,
		Version:     m.FVersion,
		CreatedAt:   m.CreatedAt.UnixMilli(),
		CreatorName: m.CreatorName,
		UpdatedAt:   m.UpdatedAt.UnixMilli(),
		UpdaterName: m.UpdaterName,
	}

	return dictEntries, nil
}

func (uc *useCase) GetDictDetail(ctx context.Context, id string) (resp *domain.DictDetailResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	m, err := uc.repo.GetDictByID(ctx, getIdInt64(id))
	if err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.GetDictDetail error: %v", err)
		return nil, err
	}
	dictEntries := &domain.DictResp{
		ID:          strconv.FormatUint(m.ID, 10),
		Name:        m.Name,
		Type:        m.FType,
		Description: m.FDescription,
	}
	lists, errItem := uc.repo.GetDictItemListByDictID(ctx, getIdInt64(id))
	if errItem != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.GetDictDetail error: %v", err)
		return nil, errItem
	}
	itemEntries := make([]*domain.DictItemResp, len(lists), len(lists))
	for i, m := range lists {
		itemEntries[i] = &domain.DictItemResp{
			ID:          strconv.FormatUint(m.ID, 10),
			DictKey:     m.FKey,
			DictValue:   m.FValue,
			Sort:        m.FSort,
			Description: m.FDescription,
		}
	}
	return &domain.DictDetailResp{
		DictResp:     dictEntries,
		DictItemResp: itemEntries,
	}, nil
}

func (uc *useCase) GetDictItemTypeList(ctx context.Context, queryType string) (*domain.Dicts, error) {
	var (
		err   error
		dicts []*model.TDictItem
	)

	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	if dicts, err = uc.repo.GetDictItemTypeList(ctx, queryType); err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.GetDictItemTypeList error: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	var (
		dictTypeMap = make(map[string]*domain.DictEntry) // 使用map来追踪已存在的类型
		resp        = &domain.Dicts{Dicts: make([]*domain.DictEntry, 0)}
	)

	for _, dict_item := range dicts {
		entry, exists := dictTypeMap[dict_item.FType]
		if !exists {
			entry = &domain.DictEntry{
				DictType:     dict_item.FType,
				DictItemResp: make([]*domain.DictItemResp, 0),
			}
			dictTypeMap[dict_item.FType] = entry
			resp.Dicts = append(resp.Dicts, entry)
		}

		entry.DictItemResp = append(entry.DictItemResp, &domain.DictItemResp{
			ID:          strconv.FormatUint(dict_item.ID, 10),
			DictKey:     dict_item.FKey,
			DictValue:   dict_item.FValue,
			Description: dict_item.FDescription,
			Sort:        dict_item.FSort,
		})
	}
	return resp, nil
}

func (uc *useCase) GetDictList(ctx context.Context, queryType string) (resp []*domain.DictResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	var dicts []*model.TDict
	if dicts, err = uc.repo.GetDictList(ctx, queryType); err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.GetDictList error: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	entries := make([]*domain.DictResp, len(dicts), len(dicts))
	for i, m := range dicts {
		entries[i] = &domain.DictResp{
			ID:          strconv.FormatUint(m.ID, 10),
			Name:        m.Name,
			Type:        m.FType,
			Description: m.FDescription,
		}
	}
	return entries, nil
}

func (uc *useCase) UpdateDictAndItem(ctx context.Context, req *domain.DictUpdateResParam) (resp *domain.AddRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	uniqueMap := make(map[string]bool)
	//检查值是否重复
	for _, m := range req.DicItemRes {
		var value = m.DictKey + "_" + req.DictRes.Type
		if _, exists := uniqueMap[value]; exists {
			log.WithContext(ctx).Errorf("dict get uc.repo.UpdateDictAndItem error: %v", err)
			return nil, errorcode.Detail(errorcode.PublicRequestParameterUniqueError, err)
		}
		uniqueMap[value] = true
	}
	userInfo, err := user_util.GetUserInfo(ctx)
	dictID, _ := strconv.ParseUint(req.DictRes.ID, 10, 64)
	// 更新字典
	dictModel := &model.TDict{
		Name:         req.DictRes.Name,
		UpdatedAt:    time.Now(),
		UpdaterUID:   userInfo.ID,
		UpdaterName:  userInfo.Name,
		FDescription: req.DictRes.FDescription,
		ID:           dictID,
		FType:        req.DictRes.Type,
		SszdFlag:     req.DictRes.SszdFlag,
	}
	//字典值先删除后新增
	var dictItemModels = make([]*model.TDictItem, len(req.DicItemRes), len(req.DicItemRes))
	for i, m := range req.DicItemRes {
		dictItemModels[i] = &model.TDictItem{
			DictID:       dictModel.ID,
			FType:        req.DictRes.Type,
			FKey:         m.DictKey,
			FValue:       m.DictValue,
			FDescription: m.Description,
			FSort:        int32(i),
			CreatedAt:    dictModel.UpdatedAt,
			CreatorUID:   dictModel.UpdaterUID,
			CreatorName:  dictModel.UpdaterName,
		}
	}
	err = uc.repo.UpdateDictAndItem(ctx, dictModel, dictItemModels)
	if err != nil {
		return nil, err
	}
	uc.updateRedisCache(ctx, dictItemModels)
	return &domain.AddRespParam{
		IDResp: response.IDResp{
			ID: models.ModelID(req.DictRes.ID),
		},
	}, nil
}

func (uc *useCase) CreateDictAndItem(ctx context.Context, req *domain.DictCreateResParam) (resp *domain.AddRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	uniqueMap := make(map[string]bool)
	//检查值是否重复
	for _, m := range req.DicItemRes {
		var value = m.DictKey + "_" + req.DictRes.Type
		if _, exists := uniqueMap[value]; exists {
			log.WithContext(ctx).Errorf("dict get uc.repo.UpdateDictAndItem error: %v", err)
			return nil, errorcode.Detail(errorcode.PublicRequestParameterUniqueError, err)
		}
		uniqueMap[value] = true
	}
	userInfo, err := user_util.GetUserInfo(ctx)
	dictID, _ := utils.GetUniqueID()
	// 更新字典
	dictModel := &model.TDict{
		Name:        req.DictRes.Name,
		UpdatedAt:   time.Now(),
		UpdaterUID:  userInfo.ID,
		UpdaterName: userInfo.Name,
		CreatedAt:   time.Now(),
		CreatorUID:  userInfo.ID,
		CreatorName: userInfo.Name,
		FType:       req.DictRes.Type,
		SszdFlag:    req.DictRes.SszdFlag,
		ID:          dictID,
	}
	//字典值先删除后新增
	var dictItemModels = make([]*model.TDictItem, len(req.DicItemRes), len(req.DicItemRes))
	for i, m := range req.DicItemRes {
		dictItemModels[i] = &model.TDictItem{
			DictID:       dictModel.ID,
			FType:        req.DictRes.Type,
			FKey:         m.DictKey,
			FValue:       m.DictValue,
			FDescription: m.Description,
			FSort:        int32(i),
			CreatedAt:    dictModel.UpdatedAt,
			CreatorUID:   dictModel.UpdaterUID,
			CreatorName:  dictModel.UpdaterName,
		}
	}
	err = uc.repo.CreateDictAndItem(ctx, dictModel, dictItemModels)
	if err != nil {
		return nil, err
	}
	uc.updateRedisCache(ctx, dictItemModels)
	return &domain.AddRespParam{
		IDResp: response.IDResp{
			ID: models.ModelID(strconv.FormatUint(dictID, 10)),
		},
	}, nil
}

func (uc *useCase) DeleteDictAndItem(ctx context.Context, req *domain.DictIdReq) (resp *domain.AddRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	dictID, _ := strconv.ParseUint(req.ID, 10, 64)
	tDict, _ := uc.repo.GetDictByID(ctx, dictID)
	err = uc.repo.DeleteDictAndItem(ctx, dictID)
	if err != nil {
		return nil, err
	}
	uc.deleteRedisCache(ctx, tDict.FType)
	return &domain.AddRespParam{
		IDResp: response.IDResp{
			ID: models.ModelID(req.ID),
		},
	}, nil
}

func (uc *useCase) BatchCheckNotExistTypeKey(ctx context.Context, req *domain.DictTypeKeyReq) ([]string, error) {
	// 1. 检查Redis缓存
	notInCache, existInCache := uc.checkRedisCache(ctx, req.DictTypeKey)
	if len(notInCache) == 0 {
		return []string{}, nil
	}

	// 2. 查询数据库
	dbResults, err := uc.queryDatabase(ctx, notInCache)
	if err != nil {
		return nil, err
	}
	fmt.Printf("sssaaaas")
	// 3. 更新缓存
	uc.updateRedisCache(ctx, dbResults)

	// 4. 合并结果并找出不存在的键
	return uc.findNonExistentKeys(req.DictTypeKey, existInCache, dbResults), nil
}

func (uc *useCase) checkRedisCache(ctx context.Context, items []*domain.DictTypeKey) ([]*domain.DictTypeKey, map[string]bool) {
	notInCache := make([]*domain.DictTypeKey, 0)
	existInCache := make(map[string]bool)
	pipe := uc.redis.Pipeline()

	// 批量构建查询
	cmds := make(map[string]*redis.StringCmd)
	for _, item := range items {
		hashKey := fmt.Sprintf("dict:%s", item.DictType)
		cmds[fmt.Sprintf("%s:%s", item.DictType, item.DictKey)] = pipe.HGet(ctx, hashKey, item.DictKey)
	}

	// 执行管道命令
	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		log.WithContext(ctx).Warnf("redis pipeline error: %v", err)
		return items, existInCache
	}

	// 处理结果
	for _, item := range items {
		key := fmt.Sprintf("%s:%s", item.DictType, item.DictKey)
		if cmd, ok := cmds[key]; ok {
			if cmd.Err() == nil {
				existInCache[key] = true
			} else {
				notInCache = append(notInCache, item)
			}
		}
	}

	return notInCache, existInCache
}

func (uc *useCase) queryDatabase(ctx context.Context, items []*domain.DictTypeKey) ([]*model.TDictItem, error) {
	var dictItemModels = make([]model.TDictItem, len(items))
	for i, m := range items {
		dictItemModels[i] = model.TDictItem{
			FType: m.DictType,
			FKey:  m.DictKey,
		}
	}

	dictItems, err := uc.repo.GetCheckTypeKeyList(ctx, dictItemModels)
	if err != nil {
		log.WithContext(ctx).Errorf("dict get uc.repo.GetCheckTypeKey error: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return dictItems, nil
}

func (uc *useCase) updateRedisCache(ctx context.Context, items []*model.TDictItem) {
	typeMap := make(map[string]map[string]interface{})

	// 按类型分组
	for _, item := range items {
		if _, ok := typeMap[item.FType]; !ok {
			typeMap[item.FType] = make(map[string]interface{})
		}
		typeMap[item.FType][item.FKey] = item.FValue
	}
	// 批量更新Redis
	pipe := uc.redis.Pipeline()
	for dictType, fields := range typeMap {
		t := util.RandomInt(20)
		hashKey := fmt.Sprintf("dict:%s", dictType)
		pipe.HMSet(ctx, hashKey, fields)
		pipe.Expire(ctx, hashKey, time.Duration(t)*time.Minute)
	}

	if _, err := pipe.Exec(ctx); err != nil {
		log.WithContext(ctx).Warnf("update redis cache error: %v", err)
	}
}

func (uc *useCase) deleteRedisCache(ctx context.Context, dictType string) {
	pipe := uc.redis.Pipeline()
	hashKey := fmt.Sprintf("dict:%s", dictType)
	pipe.Del(ctx, hashKey)

	if _, err := pipe.Exec(ctx); err != nil {
		log.WithContext(ctx).Warnf("deleteRedisCache redis cache error: %v", err)
	}
}

/*
*
返回不存在的字段类型
*/
func (uc *useCase) findNonExistentKeys(original []*domain.DictTypeKey, existInCache map[string]bool, dbResults []*model.TDictItem) []string {
	exists := make(map[string]bool)
	for k, v := range existInCache {
		exists[k] = v
	}

	for _, item := range dbResults {
		exists[fmt.Sprintf("%s:%s", item.FType, item.FKey)] = true
	}

	var notExist []string
	for _, item := range original {
		key := fmt.Sprintf("%s:%s", item.DictType, item.DictKey)
		if !exists[key] {
			notExist = append(notExist, item.DictType)
		}
	}

	return notExist
}

func getIdInt64(id string) uint64 {
	idUint64, _ := strconv.ParseUint(id, 10, 64)
	return idUint64
}

// findDifference 返回在 array1 中但不在 array2 中的字符串的切片
//func findDifference(array1 []*domain.DictTypeKey, array2 []*model.TDictItem) []string {
//	m := make(map[string]struct{})
//	n := make(map[string]struct{})
//	// 将 array2 中的元素放入 m 中
//	for _, v := range array2 {
//		m[v.FType] = struct{}{}
//	}
//
//	// 遍历 array1，找出不在 m 中的元素，即 array1 独有的元素
//	for _, v := range array1 {
//		if _, ok := m[v.DictType]; !ok {
//			n[v.DictType] = struct{}{}
//		}
//	}
//	// 将 map n 的 key 转换为 slice
//	diff := make([]string, len(n))
//	i := 0
//	for k := range n {
//		diff[i] = k
//		i++
//	}
//	return diff
//}
