package info_resource_catalog

import (
	"context"
	"reflect"
	"strings"

	"github.com/biocrosscoder/flex/common"
	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/collections/dict"
	"github.com/biocrosscoder/flex/typed/collections/orderedcontainers"
	"github.com/biocrosscoder/flex/typed/collections/set"
	"github.com/biocrosscoder/flex/typed/collections/sortedcontainers"
	"github.com/biocrosscoder/flex/typed/collections/sortedcontainers/sortedlist"
	"github.com/biocrosscoder/flex/typed/functools"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// 生成SQL语句占位符
func buildPlaceholders(fieldCount, recordCount int) (placeholders string) {
	unit := "(" + strings.Join(arraylist.Repeat("?", fieldCount), ",") + ")"
	return strings.Join(arraylist.Repeat(unit, recordCount), ",")
}

// 生成SQL语句参数值列表
func buildParamValues[T any](poToFields func(x T) []any, po []T) (values []any, err error) {
	return functools.Reduce(func(x, y []any) []any {
		return append(x, y...)
	}, functools.Map(poToFields, po))
}

// 回滚事务
func rollBackTx(tx *gorm.DB) {
	err := tx.Rollback().Error
	if err != nil {
		log.Error("rollback tx error ", zap.Error(err))
	}
}

// 提交事务
func commitTx(tx *gorm.DB) (err error) {
	err = tx.Commit().Error
	if err != nil {
		log.Error("commit tx error ", zap.Error(err))
	}
	return
}

// 结束事务
func endTx(tx *gorm.DB, err error) error {
	if err != nil {
		rollBackTx(tx)
	} else {
		err = commitTx(tx)
	}
	return err
}

// 比较新旧对象列表差异并返回待插入项列表、待更新项列表、待删除项ID列表
func diff[T any](oldItems, newItems []T) (itemsToInsert, itemsToUpdate []T, itemIDsToDelete []int64) {
	// [准备工作]
	objectToID := func(x any) int64 {
		return reflect.ValueOf(any(x)).Elem().FieldByName("ID").Int()
	}
	buildMap := func(items []T) dict.Dict[int64, T] {
		itemMap := make(dict.Dict[int64, T], len(items))
		functools.Map(func(x T) any {
			return itemMap.Set(objectToID(x), x)
		}, items)
		return itemMap
	}
	oldItemMap := buildMap(oldItems)
	newItemMap := buildMap(newItems)
	oldItemIDs := set.Of(oldItemMap.Keys()...)
	newItemIDs := set.Of(newItemMap.Keys()...) // [/]
	// [生成待插入项列表]
	idsToAdd := newItemIDs.Difference(oldItemIDs)
	itemsToInsert = functools.Filter(func(x T) bool {
		return idsToAdd.Has(objectToID(x))
	}, newItems) // [/]
	// [生成待更新项列表]
	idsToUpdate := oldItemIDs.Intersection(newItemIDs)
	itemsToUpdate = functools.Filter(func(x T) bool {
		id := objectToID(x)
		return idsToUpdate.Has(id) && !common.Equal(oldItemMap[id], newItemMap[id])
	}, newItems) // [/]
	// [生成待删除项ID列表]
	itemsToRemove := oldItemIDs.Difference(newItemIDs)
	itemIDsToDelete = make([]int64, itemsToRemove.Size())
	i := 0
	for itemID := range itemsToRemove {
		itemIDsToDelete[i] = itemID
		i++
	} // [/]
	return
}

// 比较新旧关联对象列表差异并返回待插入项列表、待更新项列表、待删除项ID列表
func diffRelatedItems(oldItems, newItems []*domain.InfoResourceCatalogRelatedItemPO) (itemsToInsert, itemsToUpdate []*domain.InfoResourceCatalogRelatedItemPO, itemIDsToDelete []int64) {
	// [准备工作]
	buildMap := func(items []*domain.InfoResourceCatalogRelatedItemPO) dict.Dict[domain.InfoResourceCatalogRelatedItemPO, *domain.InfoResourceCatalogRelatedItemPO] {
		itemMap := make(dict.Dict[domain.InfoResourceCatalogRelatedItemPO, *domain.InfoResourceCatalogRelatedItemPO], len(items))
		for _, item := range items {
			itemMap.Set(item.UniqueKey(), item)
		}
		return itemMap
	}
	oldItemMap := buildMap(oldItems)
	newItemMap := buildMap(newItems)
	oldItemIDs := set.Of(oldItemMap.Keys()...)
	newItemIDs := set.Of(newItemMap.Keys()...) // [/]
	// [生成待插入项列表]
	idsToAdd := newItemIDs.Difference(oldItemIDs)
	itemsToInsert = functools.Filter(func(x *domain.InfoResourceCatalogRelatedItemPO) bool {
		return idsToAdd.Has(x.UniqueKey())
	}, newItems) // [/]
	// [生成待更新项列表]
	idsToUpdate := oldItemIDs.Intersection(newItemIDs)
	itemsToUpdate = functools.Filter(func(x *domain.InfoResourceCatalogRelatedItemPO) bool {
		id := x.UniqueKey()
		if idsToUpdate.Has(id) && x.RelatedItemName != newItemMap[id].RelatedItemName {
			x.RelatedItemName = newItemMap[id].RelatedItemName
			return true
		}
		return false
	}, oldItems) // [/]
	// [生成待删除项ID列表]
	itemsToRemove := oldItemIDs.Difference(newItemIDs)
	itemIDsToDelete = make([]int64, itemsToRemove.Size())
	i := 0
	for itemID := range itemsToRemove {
		itemIDsToDelete[i] = oldItemMap[itemID].ID
		i++
	} // [/]
	return
}

// ID列表转换为SQL语句参数值列表
func idsToParamValues(ids []int64) []any {
	return functools.Map(func(x int64) any {
		return x
	}, ids)
}

// 构建SQL语句SET参数
func buildSetParams(po any, fields []string) (template string, values []any) {
	v := reflect.ValueOf(po)
	if v.Kind() == reflect.Pointer {
		v = v.Elem()
	}
	values = make([]any, len(fields))
	for i, name := range fields {
		field, _ := v.Type().FieldByName(name)
		values[i] = v.FieldByName(name).Interface()
		fields[i] = field.Tag.Get("db") + " = ?"
	}
	template = strings.Join(fields, ",")
	return
}

// 构建精准匹配查询参数
func buildEqualParams(conditions []*domain.SearchParamItem) (template string, values []any) {
	fieldGroups := sortedcontainers.NewSortedDict(sortedlist.AscendOrder, dict.Dict[uint8, []string]{})
	groupSize := make(map[string]int)
	valueMap := make(map[string][]any)
	for _, condition := range conditions {
		group := make([]string, len(condition.Keys))
		count := len(condition.Values)
		// [根据值列表项数生成等值查询/IN查询条件]
		singleSign := map[bool]string{false: " = ?", true: " != ?"}[condition.Exclude]
		multipleSign := map[bool]string{false: " IN ", true: " NOT IN "}[condition.Exclude]
		placeholder := map[bool]string{true: singleSign, false: multipleSign + buildPlaceholders(count, 1)}[count == 1] // [/]
		// [生成查询条件的参数模板]
		for j, key := range condition.Keys {
			group[j] = key + placeholder
		} // [/]
		// [按优先级排序记录查询条件组]
		fieldGroup := orLink(group)
		groupList := fieldGroups.Get(condition.Priority, []string{})
		fieldGroups.Set(condition.Priority, append(groupList, fieldGroup)) // [/]
		// [记录当前查询条件组的参数候选值]
		valueMap[fieldGroup] = condition.Values
		groupSize[fieldGroup] = len(group) // [/]
	}
	// [生成查询条件参数模板列表和参数值列表]
	parts := make([]string, 0)
	values = make([]any, 0)
	for _, fieldGroup := range fieldGroups.Values() {
		for _, field := range fieldGroup {
			parts = append(parts, field)
			for i := 0; i < groupSize[field]; i++ {
				values = append(values, valueMap[field]...)
			}
		}
	} // [/]
	template = andLink(parts)
	return
}

// 构建模糊匹配查询参数
func buildLikeParams(conditions []*domain.SearchParamItem) (template string, values []any) {
	fieldGroups := sortedcontainers.NewSortedDict(sortedlist.AscendOrder, dict.Dict[uint8, []string]{})
	groupSize := make(map[string]int)
	valueMap := make(map[string][]any)
	for _, condition := range conditions {
		group := make([]string, len(condition.Keys))
		// [生成查询条件的参数模板]
		placeholder := map[bool]string{false: " LIKE ?", true: " NOT LIKE ?"}[condition.Exclude]
		for j, key := range condition.Keys {
			group[j] = orLink(arraylist.Repeat(key+placeholder, len(condition.Values)))
		} // [/]
		// [按优先级排序查询条件组]
		fieldGroup := orLink(group)
		groupList := fieldGroups.Get(condition.Priority, []string{})
		fieldGroups.Set(condition.Priority, append(groupList, fieldGroup)) // [/]
		// [构建并记录当前模糊查询条件的参数候选值]
		valueMap[fieldGroup] = functools.Map(func(x any) any {
			return "%" + x.(string) + "%"
		}, condition.Values)
		groupSize[fieldGroup] = len(group) // [/]
	}
	// [生成查询条件参数模板列表和参数值列表]
	parts := make([]string, 0)
	values = make([]any, 0)
	for _, fieldGroup := range fieldGroups.Values() {
		for _, field := range fieldGroup {
			parts = append(parts, field)
			for i := 0; i < groupSize[field]; i++ {
				values = append(values, valueMap[field]...)
			}
		}
	} // [/]
	template = andLink(parts)
	return
}

// 结构体字段名转换为数据库表列名
func structFieldToDBColumn(po any, fieldName string) string {
	v := reflect.TypeOf(po)
	if v.Kind() == reflect.Pointer {
		v = v.Elem()
	}
	field, _ := v.FieldByName(fieldName)
	return field.Tag.Get("db")
}

// 构建WHERE查询参数
func buildWhereParams(conditions *orderedcontainers.OrderedDict[string, []any]) (template string, values []any) {
	keys := make([]string, 0, conditions.Size())
	for _, item := range conditions.Items() {
		if len(item.Value) > 0 {
			keys = append(keys, item.Key)
		}
	}
	// [没有查询条件时输出空模板]
	if len(keys) == 0 {
		return
	} // [/]
	template = "WHERE " + andLink(keys)
	values = make([]any, 0)
	for _, key := range keys {
		values = append(values, conditions.Get(key)...)
	}
	return
}

// 逻辑与组合
func andLink(conditions []string) string {
	return "(" + strings.Join(conditions, " AND ") + ")"
}

// 逻辑或组合
func orLink(conditions []string) string {
	return "(" + strings.Join(conditions, " OR ") + ")"
}

// 构建分页参数
func buildPagingParams(offset, limit int) (template string, values []any) {
	if limit == 0 {
		return
	}
	template = /*sql*/ `LIMIT ? OFFSET ?`
	values = []any{limit, offset}
	return
}

// 将SQL语句中占位符替换为实际内容
func render(sqlStr *string, slots map[string]string) {
	for slot, content := range slots {
		*sqlStr = strings.Replace(*sqlStr, slot, content, 1)
	}
}

// 映射搜索字段
func mappingSearchFields(po any, items []*domain.SearchParamItem, prefix string) {
	for _, item := range items {
		item.Keys = functools.Map(func(field string) string {
			return prefix + structFieldToDBColumn(po, field)
		}, item.Keys)
	}
}

// 构建排序参数
func buildOrderByParams[T any](orderBy []*domain.OrderParamItem, prefix string) string {
	// [没有排序条件时返回空字符串]
	if len(orderBy) == 0 {
		return ""
	} // [/]
	// [映射排序字段]
	po := new(T)
	for _, item := range orderBy {
		item.Field = prefix + structFieldToDBColumn(po, item.Field)
	} // [/]
	directions := make([]domain.OrderDirection, len(orderBy))
	fields := make([]string, len(orderBy))
	for i, item := range orderBy {
		directions[i] = item.Direction
		fields[i] = item.Field
	}
	// [全部字段按升序排列时，采用默认升序无需传方向参数]
	if functools.All(func(x domain.OrderDirection) bool {
		return x == domain.AscendingOrder
	}, directions) {
		return "ORDER BY " + strings.Join(fields, ",")
	} // [/]
	// [全部字段按降序排列时，只传一个方向参数]
	if functools.All(func(x domain.OrderDirection) bool {
		return x == domain.DescendingOrder
	}, directions) {
		return "ORDER BY " + strings.Join(fields, ",") + " DESC"
	} // [/]
	// [每个字段各自指定排序方向参数]
	return "ORDER BY " + strings.Join(functools.Map(func(x *domain.OrderParamItem) string {
		return x.Field + " " + strings.ToUpper(string(x.Direction))
	}, orderBy), ",") // [/]
}

// 构建范围查询参数
func buildBetweenParams(conditions []*domain.SearchParamItem) (template string, values []any) {
	fieldGroups := sortedcontainers.NewSortedDict(sortedlist.AscendOrder, dict.Dict[uint8, []string]{})
	groupSize := make(map[string]int)
	valueMap := make(map[string][]any)
	for _, condition := range conditions {
		// [跳过参数值不足的项]
		count := len(condition.Values)
		if count < 2 {
			continue
		} // [/]
		group := make([]string, len(condition.Keys))
		// [生成查询条件的参数模板]
		placeholder := map[bool]string{true: " NOT", false: ""}[condition.Exclude] + " BETWEEN ? AND ?"
		for j, key := range condition.Keys {
			group[j] = key + placeholder
		} // [/]
		// [按优先级排序记录查询条件组]
		fieldGroup := orLink(group)
		groupList := fieldGroups.Get(condition.Priority, []string{})
		fieldGroups.Set(condition.Priority, append(groupList, fieldGroup)) // [/]
		// [记录当前查询条件组的参数候选值]
		valueMap[fieldGroup] = condition.Values[:2]
		groupSize[fieldGroup] = len(group) // [/]
	}
	// [生成查询条件参数模板列表和参数值列表]
	parts := make([]string, 0)
	values = make([]any, 0)
	for _, fieldGroup := range fieldGroups.Values() {
		for _, field := range fieldGroup {
			parts = append(parts, field)
			for i := 0; i < groupSize[field]; i++ {
				values = append(values, valueMap[field]...)
			}
		}
	} // [/]
	template = andLink(parts)
	return
}

// 过滤标记删除的项
func filterDeleted(key string, equals []*domain.SearchParamItem) []*domain.SearchParamItem {
	priority := len(equals) - 1
	return append(equals, &domain.SearchParamItem{
		Keys:     []string{key},
		Values:   []any{0},
		Exclude:  false,
		Priority: uint8(priority),
	})
}

// 根据map构建SQL语句SET参数
func buildSetParamsFromMap(po any, updates map[string]any) (template string, values []any) {
	v := reflect.ValueOf(po)
	if v.Kind() == reflect.Pointer {
		v = v.Elem()
	}
	values = make([]any, len(updates))
	fields := make([]string, len(updates))
	i := 0
	for name, value := range updates {
		field, _ := v.Type().FieldByName(name)
		fields[i] = field.Tag.Get("db") + " = ?"
		values[i] = value
		i++
	}
	template = strings.Join(fields, ",")
	return
}

const recordSQL = true

// 执行SQL查询
func Raw(tx *gorm.DB, sql string, values ...any) *gorm.DB {
	f := func(tx *gorm.DB) *gorm.DB {
		return tx.Raw(sql, values...)
	}
	if recordSQL {
		log.Infof("[SQL]: %s\n", tx.ToSQL(f))
	}
	return f(tx)
}

// 执行SQL更新
func Exec(tx *gorm.DB, sql string, values ...any) *gorm.DB {
	f := func(tx *gorm.DB) *gorm.DB {
		return tx.Exec(sql, values...)
	}
	if recordSQL {
		log.Infof("[SQL]: %s\n", tx.ToSQL(f))
	}
	return f(tx)
}

// 传入空列表参数时跳过操作
func skipEmpty[T any](tx *gorm.DB, po []T, operation func(*gorm.DB, []T) error) (err error) {
	if len(po) == 0 {
		return
	}
	return operation(tx, po)
}

// 处理数据库事务
func (repo *infoResourceCatalogRepo) handleDbTx(ctx context.Context, operation func(*gorm.DB) error) (err error) {
	tx := repo.db.WithContext(ctx).Begin()
	err = endTx(tx, operation(tx))
	return
}

func (repo *infoResourceCatalogRepo) HandleDbTx(ctx context.Context, operation func(*gorm.DB) error) (err error) {
	tx := repo.db.WithContext(ctx).Begin()
	err = endTx(tx, operation(tx))
	return
}
