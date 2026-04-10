import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import classNames from 'classnames'
import { memo, useId } from 'react'
import { TASK_RUN_UI_STATUS_COLORS, type TaskRunDisplayEntry, type TaskRunUiStatus } from '../types'
import { formatExecutionDateLabel, getRunUiStatus, taskStatusTagLabel } from '../utils'
import TaskRunExpandedPanel from './TaskRunExpandedPanel'

export type TaskRunRowProps = {
  entry: TaskRunDisplayEntry
  digitalHumanId?: string
  expanded: boolean
  onToggle: () => void
}

function StatusLeadingIcon({ status, color }: { status: TaskRunUiStatus; color: string }) {
  const cls = 'shrink-0 text-sm leading-none text-xl'
  const style = { color }

  switch (status) {
    case 'running':
      return <SyncOutlined spin className={cls} style={style} aria-hidden />
    case 'success':
      return <CheckCircleOutlined className={cls} style={style} aria-hidden />
    case 'failed':
      return <ExclamationCircleOutlined className={cls} style={style} aria-hidden />
    case 'skipped':
      return <MinusCircleOutlined className={cls} style={style} aria-hidden />
    case 'pending':
      return <ClockCircleOutlined className={cls} style={style} aria-hidden />
  }
}

function TaskRunRowInner({ entry, digitalHumanId, expanded, onToggle }: TaskRunRowProps) {
  const reactId = useId()
  const panelId = `task-run-expanded-${reactId.replace(/:/g, '')}`

  const uiStatus = getRunUiStatus(entry)
  const tagColors = TASK_RUN_UI_STATUS_COLORS[uiStatus]

  return (
    <div
      className={classNames(
        'box-border overflow-hidden rounded-lg border border-[#eaeef3] bg-white',
        expanded && 'border-[var(--dip-primary-color)]',
      )}
    >
      <button
        type="button"
        className="box-border w-full cursor-pointer border-0 bg-transparent px-5 py-3 text-left font-inherit text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dip-primary-color)]"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <div className="flex w-full items-center gap-4">
          <StatusLeadingIcon status={uiStatus} color={tagColors.color} />
          <span className="min-w-0 flex-1 truncate" title={formatExecutionDateLabel(entry)}>
            {formatExecutionDateLabel(entry)}
          </span>
          {entry.outcomeCount != null && entry.outcomeCount > 0 ? (
            <span className="shrink-0 text-xs text-black/45">{entry.outcomeCount}个成果</span>
          ) : (
            <span className="w-11 shrink-0" aria-hidden />
          )}
          <span
            className="box-border min-w-10 shrink-0 rounded border px-2 py-px text-center text-xs leading-[1.6667]"
            style={{
              borderColor: tagColors.bdColor,
              backgroundColor: tagColors.bgColor,
              color: tagColors.color,
            }}
          >
            {taskStatusTagLabel(uiStatus)}
          </span>
          <DownOutlined
            className={classNames(
              'shrink-0 text-[10px] text-[--dip-text-color] opacity-[0.85] transition-transform duration-200 ease-out',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </div>
      </button>
      {expanded ? (
        <TaskRunExpandedPanel
          id={panelId}
          digitalHumanId={digitalHumanId}
          sessionId={entry.sessionKey ?? entry.sessionId}
        />
      ) : null}
    </div>
  )
}

const TaskRunRow = memo(TaskRunRowInner)
export default TaskRunRow
