import { CheckCircleFilled } from '@ant-design/icons'
import { Spin } from 'antd'
import { memo, useEffect, useState } from 'react'
import { getPlanContent } from '@/apis/dip-studio/plan'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import type { ArchivePreviewState } from '@/components/WorkPlanDetail/Outcome/Preview'
import { ArchivePreviewPanel } from '@/components/WorkPlanDetail/Outcome/Preview'
import TaskRunRow from './components/TaskRunRow'
import type { TasksPanelProps } from './types'
import { useTaskRuns } from './useTaskRuns'

const BANNER_DISMISS_KEY = 'dip-work-plan-tasks-plan-banner-dismissed'
const PLAN_PREVIEW_SUBPATH = 'plan.md'
const PLAN_PREVIEW_TITLE = '计划对齐.md'

function TasksPanelInner({ planId, dhId, sessionId: _sessionId }: TasksPanelProps) {
  const [planPreview, setPlanPreview] = useState<ArchivePreviewState>({
    title: PLAN_PREVIEW_TITLE,
    subpath: PLAN_PREVIEW_SUBPATH,
    body: '',
    loading: true,
    viewer: 'markdown',
  })
  const { scrollMountRef, entries, total, initialLoading, loadingMore, loadError } =
    useTaskRuns(planId)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const [bannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(BANNER_DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    let cancelled = false
    const planIdTrimmed = planId?.trim()

    const basePreview: ArchivePreviewState = {
      title: PLAN_PREVIEW_TITLE,
      subpath: PLAN_PREVIEW_SUBPATH,
      body: '',
      loading: false,
      viewer: 'markdown',
    }

    if (!planIdTrimmed) {
      setPlanPreview({
        ...basePreview,
        body: '暂无计划文档',
      })
      return
    }

    setPlanPreview({ ...basePreview, loading: true })

    const loadPlanPreview = async () => {
      try {
        const res = await getPlanContent(planIdTrimmed)
        const body = res.content ?? ''
        if (!cancelled) {
          setPlanPreview({
            ...basePreview,
            body,
          })
        }
      } catch (error: any) {
        console.log('error', error)
        if (!cancelled) {
          if (error.code === 'NOT_FOUND') {
            setPlanPreview({
              ...basePreview,
              body: '',
            })
          } else {
            setPlanPreview({
              ...basePreview,
              body: '计划文档加载失败',
            })
          }
        }
      }
    }

    void loadPlanPreview()
    return () => {
      cancelled = true
    }
  }, [planId])

  if (!planId?.trim()) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <Empty title="暂无计划" desc="缺少计划 ID，无法加载任务" />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-[--dip-border-color] bg-[#FAFAF9]">
        <ScrollBarContainer className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-col gap-4 px-5">
            {!bannerDismissed ? (
              <div className="flex items-start gap-2 mt-4 rounded-lg border border-[#d9f7be] px-3 py-[9px] bg-[--dip-white]">
                <CheckCircleFilled
                  className="mt-0.5 shrink-0 text-base text-[#52c41a]"
                  aria-hidden
                />
                <p className="m-0 min-w-0 flex-1 text-sm leading-[1.57] text-[--dip-text-color]">
                  这里是我们一起对齐的计划文档，我已经根据我们最近的对话完成了最新校准，您可到【会话】页面随时调整。
                </p>
                {/* <button
                  type="button"
                  className="flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[--dip-text-color-45] transition-colors hover:bg-[--dip-hover-bg-color] hover:text-[--dip-text-color]"
                  aria-label="关闭提示"
                  onClick={dismissBanner}
                >
                  <IconFont type="icon-dip-close" />
                </button> */}
              </div>
            ) : null}
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col pl-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col border-l-0">
              <ArchivePreviewPanel preview={planPreview} />
            </div>
          </div>
        </ScrollBarContainer>
      </div>

      <div
        ref={scrollMountRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[--dip-white]"
      >
        <ScrollBarContainer className="flex min-h-0 flex-1 flex-col px-6 py-4 relative">
          <div className="mx-auto h-full flex w-full max-w-[720px] flex-col gap-5">
            {initialLoading ? (
              <div className="inset-0 flex flex-1 items-center justify-center py-20">
                <Spin />
              </div>
            ) : loadError && entries.length === 0 ? (
              <div className="inset-0 h-full flex flex-1 items-center justify-center py-12">
                <Empty type="failed" title="加载失败" />
              </div>
            ) : (
              <>
                <h2 className="m-0 text-base font-bold leading-normal text-[--dip-text-color]">
                  执行记录 · {total}
                </h2>

                {entries.length === 0 ? (
                  <div className="inset-0 flex justify-center py-12">
                    <Empty title="暂无数据" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {entries.map((entry, i) => {
                      const rowKey = `${entry.jobId}-${entry.ts}-${i}`
                      return (
                        <TaskRunRow
                          key={rowKey}
                          entry={entry}
                          digitalHumanId={dhId}
                          expanded={expandedKey === rowKey}
                          onToggle={() =>
                            setExpandedKey((prev) => (prev === rowKey ? null : rowKey))
                          }
                        />
                      )
                    })}
                  </div>
                )}

                {loadingMore ? (
                  <div className="flex justify-center py-2">
                    <Spin size="small" />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </ScrollBarContainer>
      </div>
    </div>
  )
}

const TasksPanel = memo(TasksPanelInner)
export default TasksPanel
