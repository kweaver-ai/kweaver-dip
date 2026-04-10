import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="trash-icon" />,
}))

import type { SessionSummary } from '@/apis/dip-studio/sessions'
import { HistorySection } from '../HistorySection'

const session = (key: string, title?: string): SessionSummary => ({
  key,
  kind: 'direct',
  updatedAt: Date.now(),
  sessionId: key,
  abortedLastRun: false,
  totalTokensFresh: true,
  modelProvider: 'openai',
  model: 'gpt',
  contextTokens: 0,
  derivedTitle: title,
})

describe('Sider/HistorySection', () => {
  it('空列表时显示占位文案', () => {
    render(
      <HistorySection
        sessions={[]}
        hasMore={false}
        total={0}
        onMore={() => {}}
        onOpenHistoryDetail={() => {}}
      />,
    )
    expect(screen.getByText('暂无历史记录')).toBeInTheDocument()
  })

  it('点击更多触发 onMore，点击会话触发详情', () => {
    const onMore = vi.fn()
    const onOpenHistoryDetail = vi.fn()
    render(
      <HistorySection
        sessions={[session('s1', '会话1')]}
        hasMore
        total={120}
        onMore={onMore}
        onOpenHistoryDetail={onOpenHistoryDetail}
      />,
    )

    fireEvent.click(screen.getByText('更多'))
    expect(onMore).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTitle('会话1'))
    expect(onOpenHistoryDetail).toHaveBeenCalledWith('s1')
  })

  it('点击删除按钮触发 onDeleteHistory', () => {
    const onDeleteHistory = vi.fn()
    const s = session('s2', '会话2')
    render(
      <HistorySection
        sessions={[s]}
        hasMore={false}
        total={1}
        onMore={() => {}}
        onOpenHistoryDetail={() => {}}
        onDeleteHistory={onDeleteHistory}
      />,
    )
    fireEvent.click(screen.getByLabelText('删除历史会话'))
    expect(onDeleteHistory).toHaveBeenCalledWith(s)
  })
})
