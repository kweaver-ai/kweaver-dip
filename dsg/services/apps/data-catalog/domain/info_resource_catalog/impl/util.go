package impl

import (
	"context"
	"strings"

	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
)

func buildOrderByParams(sortBy *info_resource_catalog.SortParams) []*info_resource_catalog.OrderParamItem {
	if sortBy == nil {
		return nil
	}
	return functools.Map(func(field string) *info_resource_catalog.OrderParamItem {
		return &info_resource_catalog.OrderParamItem{
			Field:     snakeToPascal(field),
			Direction: info_resource_catalog.OrderDirection(*sortBy.Direction),
		}
	}, sortBy.Fields)
}

func snakeToPascal(identifier string) string {
	return strings.Join(functools.Map(func(word string) string {
		firstChar := string(word[0])
		return strings.Replace(word, firstChar, strings.ToUpper(firstChar), 1)
	}, strings.Split(identifier, "_")), "")
}

func isEntityInvalid(entity *info_resource_catalog.BusinessEntity) bool {
	return entity.ID == ""
}

const emptyItemID = "0"

func calculateOffset(pageNumber, recordNumber int) int {
	return (pageNumber - 1) * recordNumber
}

type Object[T comparable] interface {
	UniqueKey() T
}

func Equal[T comparable](obj1, obj2 Object[T]) bool {
	return obj1.UniqueKey() == obj2.UniqueKey()
}

// 传入空列表参数时跳过操作
func operateSkipEmpty[E, R any](ctx context.Context, list []E, operation func(context.Context, []E) ([]R, error)) (items []R, err error) {
	if len(list) == 0 {
		items = make([]R, 0)
		return
	}
	return operation(ctx, list)
}

// 执行更新操作，对于空参数列表和未分类项跳过处理
func (d *infoResourceCatalogDomain) updateSkipEmptyAndUncataloged(ctx context.Context, entry []*info_resource_catalog.BusinessEntity, query queryItems) (updates, invalids []*info_resource_catalog.BusinessEntity, err error) {
	if len(entry) == 0 || (len(entry) == 1 && entry[0].ID == constant.UnallocatedId) {
		return
	}
	return d.updateItems(ctx, query, entry)
}
