import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DipResizeObserver from '../index'

function mockRect(el: HTMLElement, width: number, height: number) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
}

describe('DipResizeObserver', () => {
  it('尺寸变化回调携带 width、height、dom、visible', async () => {
    const onResize = vi.fn()
    render(
      <DipResizeObserver onResize={onResize}>
        <div data-testid="box">content</div>
      </DipResizeObserver>,
    )
    const el = screen.getByTestId('box')
    mockRect(el, 120, 80)

    await Promise.resolve()

    expect(onResize).toHaveBeenCalledTimes(1)
    expect(onResize.mock.calls[0][0]).toMatchObject({
      width: 120,
      height: 80,
      visible: true,
      dom: el,
    })
  })

  it('width 为 0 时 visible 为 false', async () => {
    const onResize = vi.fn()
    render(
      <DipResizeObserver onResize={onResize}>
        <div data-testid="box2" />
      </DipResizeObserver>,
    )
    const el = screen.getByTestId('box2')
    mockRect(el, 0, 40)

    await Promise.resolve()

    expect(onResize.mock.calls[0][0]).toMatchObject({
      width: 0,
      visible: false,
    })
  })
})
