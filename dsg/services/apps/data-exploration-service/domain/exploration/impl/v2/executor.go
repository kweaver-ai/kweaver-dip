package v2

import (
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/nsql"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
)

func getSql(sql string, table string) string {
	sql = strings.Replace(sql, "${T}", table, -1)
	return sql
}

func (e *ExplorationDomainImplV2) generateSql(sql string, tableInfo exploration.MetaDataTableInfo, totalSample int32, field *exploration.ExploreField) (string, error) {
	if totalSample > 0 {
		sql = getSql(sql, nsql.RT)
	} else {
		sql = getSql(sql, nsql.T)
	}

	groupLimit := "5"
	if settings.GetConfig().ExplorationConf.GroupLimit > 0 {
		groupLimit = strconv.FormatInt(int64(settings.GetConfig().ExplorationConf.GroupLimit), 10)
	}
	sql = strings.Replace(sql, "${group_limit}", groupLimit, -1)

	// 数据库表信息替换
	sql = strings.Replace(sql, "${schema_name}", tableInfo.SchemaName, -1)
	sql = strings.Replace(sql, "${name}", tableInfo.Name, -1)
	sql = strings.Replace(sql, "${ve_catalog_id}", tableInfo.VeCatalogId, -1)
	// 扫描样本数量替换
	total := strconv.FormatInt(int64(totalSample), 10)
	sql = strings.Replace(sql, "${total_sample}", total, -1)

	if field != nil {
		sql = strings.Replace(sql, "${column_name}", field.FieldName, -1)
	}
	return sql, nil
}
