import classNames from 'classnames'
import { memo, useId, useState } from 'react'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import TaskConversation from './TaskConversation'
import TaskOutcomeList from './TaskOutcomeList'

export type TaskRunExpandedTab = 'session' | 'outcomes'

export type TaskRunExpandedPanelProps = {
  /** 供无障碍与父级 `aria-controls` 对应 */
  id?: string
  /** 数字员工 ID，对应接口路径中的 `dhId` */
  digitalHumanId?: string
  /** 本次执行关联的会话 key / id */
  sessionId?: string
}

const tabBtnBase =
  'box-border h-8 cursor-pointer rounded-[20px] border-0 px-4 text-sm font-medium  text-black/65 bg-[#126EE303] hover:bg-[#126EE30F]'

const tabBtnActive = '!bg-[#126EE30F]'

function TaskRunExpandedPanelInner({ id, digitalHumanId, sessionId }: TaskRunExpandedPanelProps) {
  const baseId = useId().replace(/:/g, '')
  const tabSessionId = `task-run-tab-session-${baseId}`
  const tabOutcomesId = `task-run-tab-outcomes-${baseId}`
  const tabPanelId = `task-run-tabpanel-${baseId}`

  const [activeTab, setActiveTab] = useState<TaskRunExpandedTab>('session')

  return (
    <section id={id} className="" aria-label="执行记录展开内容">
      <div className="mx-5 h-px bg-[#f5f5f5] mb-4" aria-hidden />
      <div className="flex gap-2 mx-5 mb-2" role="tablist" aria-label="执行记录详情">
        <button
          type="button"
          id={tabSessionId}
          role="tab"
          aria-selected={activeTab === 'session'}
          aria-controls={tabPanelId}
          className={classNames(tabBtnBase, activeTab === 'session' && tabBtnActive)}
          onClick={() => setActiveTab('session')}
        >
          执行过程
        </button>
        <button
          type="button"
          id={tabOutcomesId}
          role="tab"
          aria-selected={activeTab === 'outcomes'}
          aria-controls={tabPanelId}
          className={classNames(tabBtnBase, activeTab === 'outcomes' && tabBtnActive)}
          onClick={() => setActiveTab('outcomes')}
        >
          输出成果
        </button>
      </div>

      <div
        id={tabPanelId}
        className="flex flex-col overflow-hidden"
        style={{ height: '60vh', maxHeight: '60vh' }}
        role="tabpanel"
        aria-labelledby={activeTab === 'session' ? tabSessionId : tabOutcomesId}
      >
        {activeTab === 'session' ? (
          <TaskConversation digitalHumanId={digitalHumanId} sessionId={sessionId} />
        ) : (
          <ScrollBarContainer className="py-2">
            <TaskOutcomeList digitalHumanId={digitalHumanId} sessionId={sessionId} />
          </ScrollBarContainer>
        )}
      </div>
    </section>
  )
}

const TaskRunExpandedPanel = memo(TaskRunExpandedPanelInner)
export default TaskRunExpandedPanel
