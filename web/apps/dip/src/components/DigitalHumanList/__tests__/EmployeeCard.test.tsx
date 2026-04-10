import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/digital-human/resolveDigitalHumanIcon', () => ({
  resolveDigitalHumanIconSrc: (id?: string) => (id ? `/icon/${id}.png` : ''),
}))
vi.mock('@/components/AppIcon', () => ({
  default: ({ name }: { name: string }) => <span data-testid="fallback-icon">{name}</span>,
}))
vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="icon-font" />,
}))

import EmployeeCard from '../EmployeeCard'

describe('DigitalHumanList/EmployeeCard', () => {
  it('渲染名称、简介和统计信息', () => {
    const digitalHuman = {
      id: 'dh1',
      name: '小助手',
      creature: '简介',
      icon_id: '',
      skills: [{}, {}],
      bkn: [{}],
      channel: { id: 'c1' },
    } as any
    render(<EmployeeCard digitalHuman={digitalHuman} width={320} />)

    expect(screen.getByTitle('小助手')).toBeInTheDocument()
    expect(screen.getByText('简介')).toBeInTheDocument()
    expect(screen.getByText('2 个技能')).toBeInTheDocument()
    expect(screen.getByText('1 个知识网络')).toBeInTheDocument()
    expect(screen.getByText('1 个通道')).toBeInTheDocument()
    expect(screen.getByTestId('fallback-icon')).toBeInTheDocument()
  })

  it('点击卡片触发 onCardClick', () => {
    const onCardClick = vi.fn()
    const digitalHuman = { id: 'dh2', name: '可点击', creature: '', icon_id: '' } as any
    render(<EmployeeCard digitalHuman={digitalHuman} width={300} onCardClick={onCardClick} />)

    fireEvent.click(screen.getByTitle('可点击'))
    expect(onCardClick).toHaveBeenCalledWith(digitalHuman)
  })
})
