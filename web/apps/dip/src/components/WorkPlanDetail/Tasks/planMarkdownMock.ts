import type { ArchivePreviewState } from '@/components/WorkPlanDetail/Outcome/Preview'

/** 计划文档 Markdown（接入接口后由服务端返回替换） */
export const MOCK_PLAN_MARKDOWN = `# 工作计划（对齐稿）

> 本文档由会话对齐生成，可在 **会话** Tab 中继续调整。

## 目标

- 明确本期交付范围与验收口径；
- 列出关键任务与依赖；
- 约定执行节奏与产出物。

## 任务摘要

| 项 | 说明 |
| --- | --- |
| 范围 | 数据采集 → 分析 → 日报输出 |
| 产出 | Markdown / 归档文件 |

## 备注

（以下为 mock 内容，仅用于本地预览布局。）
`

export function getPlanPreviewState(): ArchivePreviewState {
  return {
    title: '计划对齐.md',
    subpath: 'plan.md',
    body: MOCK_PLAN_MARKDOWN,
    loading: false,
    viewer: 'markdown',
  }
}
