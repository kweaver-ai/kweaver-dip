# Text2SQL 背景知识片段（渐进式加载）

本文档存放 **`gen_exec` 的 `config.background` 可拼接 SQL 模板** 等可复用知识。**默认不要整文件预读**，按下方规则按需加载对应章节即可。

## 渐进式加载规则（MUST）

1. **先**只读 [text2sql.md](text2sql.md) 完成主流程约束与 **`show_ds` → `gen_exec` 顺序**。
2. **在 `show_ds` 已有候选表/字段摘要之后**，再根据用户问题做意图匹配：命中 [索引：意图 → 章节](#索引意图--章节) 中的某一类时，**仅打开本文档对应 `##` 章节**，把该节 SQL 模板与占位说明 **追加或合并** 进 `gen_exec` 的 `background`（与 `show_ds` 摘要同属一段纯文本即可；业务口径如「注册资金单位为万」仍放在摘要侧）。
3. **未命中**任一类时：**不读取**本文档其余章节，避免无关模板干扰生成。
4. 后续每新增一类知识：在本文档增加新 `##` 节，并更新下方索引表一行。

## 索引：意图 → 章节

| 意图关键词（示例） | 读取章节 |
|-------------------|----------|
| 前百分之几、Top X%、排名前 10%、最高 5% 企业/记录、按比例取前段 | [Top X%（按指标排名前百分之几）](#top-x按指标排名前百分之几) |

---

## Top X%（按指标排名前百分之几）

**适用**：单表（或已 `show_ds` 明确的单事实源）上，按某数值指标 **降序** 取 **前 `top_percent` 比例** 的行，输出指定目标列（如企业名称）。

**拼进 `config.background` 时**：将占位符替换为 `show_ds` 已确认的**真实表名与字段名**；`{and_condition}` 无前缀过滤则整行删除或留空。

```sql
-- 适用：查询某表中按某指标排名前X%的目标字段
SELECT {target_col}
FROM (
    SELECT
        {target_col},
        {metric_col},
        ROW_NUMBER() OVER (ORDER BY {metric_col} DESC) AS rn,
        COUNT(*) OVER () AS total_cnt
    FROM {table_name}
    WHERE {metric_col} IS NOT NULL
      {and_condition}
) t
WHERE rn <= CEIL(total_cnt * {top_percent});
```

**占位符**：

- `{target_col}`：目标输出字段（如 `entname`）
- `{metric_col}`：排序指标字段（如 `regcap`）
- `{table_name}`：表名（如 `scjg_e_baseinfo`）
- `{and_condition}`：额外 `AND` 条件（无条件则不要写 `{and_condition}` 这一行）
- `{top_percent}`：小数比例（如 `0.1` 表示前 10%）

**口径说明**：该写法按 **行数** 取整前排位（`CEIL`），并列指标值时可能多出行；若业务要求严格“分位数阈值”而非“前 10% 行数”，需在业务侧另定口径（本文档不展开）。
