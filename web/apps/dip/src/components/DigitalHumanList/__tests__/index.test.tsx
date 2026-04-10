import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DigitalHumanList from '../index'

const { employeeCardMock } = vi.hoisted(() => ({
  employeeCardMock: vi.fn(),
}))

vi.mock('react-virtualized-auto-sizer', () => ({
  default: ({ children }: { children: ({ width }: { width: number }) => React.ReactNode }) => (
    <div data-testid="auto-sizer">{children({ width: 800 })}</div>
  ),
}))

vi.mock('../../ScrollBarContainer', () => ({
  default: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="scroll-bar-container" {...rest}>
      {children}
    </div>
  ),
}))

vi.mock('../EmployeeCard', () => ({
  default: (props: {
    digitalHuman: { id: string; name: string }
    width: number
    menuItems?: unknown[]
    onCardClick?: (digitalHuman: { id: string; name: string }) => void
  }) => {
    employeeCardMock(props)
    return (
      <button
        type="button"
        data-testid={`employee-card-${props.digitalHuman.id}`}
        onClick={() => props.onCardClick?.(props.digitalHuman)}
      >
        {props.digitalHuman.name}
      </button>
    )
  },
}))

describe('DigitalHumanList/index', () => {
  it('渲染列表并给每个卡片传递计算后的宽度与菜单', () => {
    const list = [
      { id: '1', name: '小助手A', creature: 'A 简介' },
      { id: '2', name: '小助手B', creature: 'B 简介' },
    ]
    const menuItems = vi.fn((digitalHuman: { id: string }) => [{ key: `k-${digitalHuman.id}` }])

    render(<DigitalHumanList digitalHumans={list as never[]} menuItems={menuItems} />)

    expect(screen.getByTestId('scroll-bar-container')).toBeInTheDocument()
    expect(screen.getByTestId('employee-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('employee-card-2')).toBeInTheDocument()

    expect(menuItems).toHaveBeenCalledTimes(2)
    expect(employeeCardMock).toHaveBeenCalledTimes(2)
    expect(employeeCardMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        digitalHuman: expect.objectContaining({ id: '1', name: '小助手A' }),
        width: 400,
        menuItems: [{ key: 'k-1' }],
      }),
    )
  })

  it('点击卡片时向上触发 onCardClick', () => {
    const onCardClick = vi.fn()
    const list = [{ id: '1', name: '小助手A', creature: 'A 简介' }]

    render(<DigitalHumanList digitalHumans={list as never[]} onCardClick={onCardClick as never} />)

    fireEvent.click(screen.getByTestId('employee-card-1'))

    expect(onCardClick).toHaveBeenCalledTimes(1)
    expect(onCardClick).toHaveBeenCalledWith(expect.objectContaining({ id: '1', name: '小助手A' }))
  })
})
