import clsx from 'classnames'
import type { SessionSummary } from '@/apis/dip-studio/sessions'
import IconFont from '@/components/IconFont'

interface HistorySectionProps {
  sessions: SessionSummary[]
  hasMore: boolean
  selectedSessionKey?: string
  onMore: () => void
  onOpenHistoryDetail: (sessionKey: string) => void
  onDeleteHistory?: (session: SessionSummary) => void
}

function getSessionTitle(session: any): string {
  return session.derivedTitle?.trim() || session.key || ''
}

export const HistorySection = ({
  sessions,
  hasMore,
  selectedSessionKey,
  onMore,
  onOpenHistoryDetail,
  onDeleteHistory,
}: HistorySectionProps) => {
  return (
    <div className="px-2 pb-2">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs leading-[20px] text-[--dip-text-color-45]">历史记录</span>
        {hasMore ? (
          <button
            type="button"
            className="text-xs text-[--dip-primary-color] bg-transparent border-0 cursor-pointer hover:underline"
            onClick={onMore}
          >
            更多
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5">
        {sessions.length === 0 ? (
          <div className="text-xs text-[--dip-text-color-45] px-2 py-2">暂无历史记录</div>
        ) : (
          sessions.map((session) => {
            const title = getSessionTitle(session)
            const isActive = selectedSessionKey === session.key
            return (
              <button
                key={`history-session-${session.key}`}
                type="button"
                onClick={() => onOpenHistoryDetail(session.key)}
                className={clsx(
                  'group w-full text-left h-10 px-2 py-1.5 rounded-md relative border-0 flex items-center',
                  isActive
                    ? 'bg-[#f1f7fe] text-[--dip-primary-color]'
                    : 'bg-transparent hover:bg-[--dip-hover-bg-color]',
                )}
              >
                {/* {isActive ? (
                  <span className="absolute left-[-4px] top-[10px] bottom-[10px] w-[2px] rounded-[2px] bg-[linear-gradient(180deg,#3fa9f5_0%,#126ee3_100%)]" />
                ) : null} */}
                <div
                  className={clsx(
                    'truncate text-sm group-hover:mr-2',
                    isActive ? 'text-[--dip-primary-color]' : 'text-[--dip-text-color]',
                  )}
                  title={title}
                >
                  {title}
                </div>
                <button
                  type="button"
                  className="w-6 h-6 flex-shrink-0 hidden items-center justify-center rounded text-[--dip-text-color-45] group-hover:inline-flex hover:bg-[rgba(0,0,0,0.06)]"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteHistory?.(session)
                  }}
                  aria-label="删除历史会话"
                >
                  <IconFont type="icon-dip-trash" />
                </button>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
