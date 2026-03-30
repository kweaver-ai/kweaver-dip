package nsql

const QT = ` ( SELECT * FROM ${ve_catalog_id}.${schema_name}.${name} LIMIT ${total_sample} ) AS T `

const RT = ` ( SELECT * FROM ${ve_catalog_id}.${schema_name}."${name}" ORDER BY RAND() LIMIT ${total_sample} ) AS T `

const T = ` ${ve_catalog_id}.${schema_name}."${name}" `

// count table 查询表总数据量
const CountTable = `SELECT  COUNT(1) AS result FROM ${T} `

// 空值统计
const NullCount = `SELECT COUNT(1) AS result FROM ${T} WHERE "${column_name}" is NULL `

// 空字段统计
const BlankCount = `SELECT COUNT(1) AS result FROM ${T} WHERE "${column_name}" is NULL or  trim(cast("${column_name}" as string)) = '' `

// 最大值统计
const Max = `Max("${column_name}") AS "${rule_id}"`

// 最小值统计
const Min = `Min("${column_name}") AS "${rule_id}"`

// 平均值统计
const Avg = `Round(Avg("${column_name}"),2) AS "${rule_id}"`

// 标准差统计
const StddevPop = `stddev_pop("${column_name}") AS "${rule_id}"`

// 方差统计
const VarPop = `var_pop("${column_name}") AS "${rule_id}"`

// true值统计
const True = `COUNT(CASE WHEN "${column_name}" = TRUE THEN 1 ELSE NULL END) AS "${rule_id}"`

// false值统计
const False = `COUNT(CASE WHEN "${column_name}" = FALSE THEN 1 ELSE NULL END) AS "${rule_id}"`

const StatisticsSql = `SELECT ${sql} FROM ${T}`

// 按天统计
const Day = `SELECT TO_CHAR("${column_name}", 'yyyy-mm-dd') as "key", count(1) as "value" FROM ${T} where "${column_name}" is not null group by TO_CHAR("${column_name}", 'yyyy-mm-dd') order by "value" desc `

// 按月统计
const Month = `SELECT TO_CHAR("${column_name}", 'yyyy-mm') as "key", count(1) as "value" FROM ${T} where  "${column_name}" is not null group by TO_CHAR("${column_name}", 'yyyy-mm') order by "value" desc `

// 按年统计
const Year = `SELECT TO_CHAR("${column_name}", 'yyyy') as "key", count(1) as "value" FROM ${T} where  "${column_name}" is not null group by TO_CHAR("${column_name}", 'yyyy') order by "value" desc `

const GroupSql = `SELECT ${group_column_name},COUNT(1) as value FROM (SELECT ${group_sql} FROM ${T} WHERE "${column_name}" IS NOT NULL ) t GROUP BY GROUPING SETS (${group_column_name}) ORDER BY value DESC limit ${group_limit}`

// 分位数统计
const Quantile = `approx_percentile("${column_name}",0.25) AS "${quantile_25}",approx_percentile("${column_name}",0.50) AS "${quantile_50}",approx_percentile("${column_name}",0.75) AS "${quantile_75}"`

// 字段空值统计
const Null = `COUNT(CASE WHEN ${null_config} THEN 1 ELSE NULL END) AS "${rule_id}"`

// 字段唯一性统计
const Unique = `COUNT(CASE WHEN "${column_name}" IS NOT NULL then "${column_name}" end) - COUNT(DISTINCT CASE WHEN "${column_name}" IS NOT NULL then "${column_name}" end) AS "${rule_id}"`

// 字段码值检查
const Dict = `COUNT(CASE WHEN "${column_name}" in (${dict_config}) THEN 1 ELSE NULL END) AS "${rule_id}"`

// 字段格式检查
const Regexp = `COUNT(CASE WHEN  REGEXP_LIKE(CAST("${column_name}" as string), '${regexp_config}') THEN 1 ELSE NULL END) AS "${rule_id}"`

const MergeSql = `SELECT ${sql} , COUNT(1) AS count2 FROM ${T}`

// 行级空值统计
const RowNull = `SELECT COUNT(CASE WHEN ${row_null_config} THEN 1 ELSE NULL END) AS count1, COUNT(1) AS count2 FROM ${T}`

// 行级唯一性统计
const RowUnique = `SELECT COUNT(1)- COUNT(DISTINCT (${column_names})) AS count1, COUNT(1) AS count2 FROM ${ve_catalog_id}.${schema_name}."${name}" WHERE ${column_not_null} ${limit}`

//const Dict = `SELECT "${column_name}" as "key", count(1) as "value"  FROM ${T} where ${dict_column_name} in (${dict}) group by "${column_name}"  order by "value" desc`

//const DictNotIn = `SELECT count(1) as "result" FROM ${T} where ${dict_column_name} not in (${dict}) `

const Group = `SELECT "${column_name}" as "key", count(1) as "value"  FROM  ${T}  group by "${column_name}" order by "value" desc limit ${group_limit}`

// 非空值获取
const NotNULL = `SELECT "${column_name}" as "key" FROM ${T} WHERE "${column_name}" is NOT NULL LIMIT 1 `

// 数据范围统计
const DataRangeMatch = `SELECT count(1) AS "result" FROM ${T} where ${range_condition} `

const RangeCondition = `"${column_name}" >= ${min} and "${column_name}" <= ${max}`

const RangeConditionMax = `"${column_name}" <= ${max}`

const RangeConditionMin = `"${column_name}" >= ${min}`

// metadata_standard_table 根据元数据表id查询标准表信息
const Metadata_standard_table = `LOOKUP ON entity_standard_table WHERE entity_standard_table.metadata_table_id == ${metadata_table_id}
                                 YIELD  vertex as entity_standard_table`

// metadata_source_table 根据元数据表id查询贴源表信息
const Metadata_source_table = `LOOKUP ON entity_source_table WHERE entity_source_table.metadata_table_id == ${metadata_table_id}
YIELD  vertex as entity_source_table`

const ShowColumns = `SHOW COLUMNS FROM ${ve_catalog_id}.${schema_name}.${name}`

const CustomRule = `SELECT COUNT(CASE WHEN ${rule_expression} THEN 1 ELSE NULL END) AS count1, COUNT(1) AS count2 FROM (SELECT * FROM ${T} WHERE ${filter}) tmp_table`
const CustomRuleExpression = `SELECT COUNT(CASE WHEN ${rule_expression} THEN 1 ELSE NULL END) AS count1, COUNT(1) AS count2 FROM ${T}`

// 时间戳探查
const TimeStampRule = `SELECT MAX("${column_name}") AS "${column_name}" FROM ${T} WHERE "${column_name}" is not null`
