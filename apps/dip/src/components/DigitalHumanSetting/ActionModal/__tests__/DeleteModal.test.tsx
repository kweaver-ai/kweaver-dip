import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { deleteDigitalHumanMock } = vi.hoisted(() => ({
  deleteDigitalHumanMock: vi.fn<(id: string) => Promise<void>>(async (_id: string) => {}),
}))

vi.mock('@/apis', () => ({
  deleteDigitalHuman: (id: string) => deleteDigitalHumanMock(id),
}))

vi.mock('react-intl-universal', () => ({
  default: {
    get: (key: string) => {
      const dict: Record<string, string> = {
        'digitalHuman.management.deleteConfirmBody': '确认删除 __DH_NAME__ 吗？',
        'digitalHuman.management.deleteModalTitle': '删除数字员工',
        'digitalHuman.management.deleteOk': '确定',
        'digitalHuman.management.deleteCancel': '取消',
        'digitalHuman.management.deleteNameLabel': '请输入名称',
        'digitalHuman.management.deleteNamePlaceholder': '请输入待删除名称',
        'digitalHuman.management.validateNameRequired': '名称必填',
        'digitalHuman.management.validateNameMismatch': '名称不匹配',
        'digitalHuman.management.deleteSuccess': '删除成功',
        'digitalHuman.management.deleteFailed': '删除失败',
      }
      return dict[key] ?? key
    },
  },
}))

import DeleteModal from '../DeleteModal'

describe('DigitalHumanSetting/DeleteModal', () => {
  it('展示删除确认文案和高亮名称', () => {
    render(
      <DeleteModal
        open
        deleteData={{ id: '1', name: '员工A' }}
        onOk={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('删除数字员工')).toBeInTheDocument()
    expect(screen.getByText('员工A')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入待删除名称')).toBeInTheDocument()
  })

  it('输入正确名称后点击确定，调用删除 API 与回调', async () => {
    const onOk = vi.fn()
    const onCancel = vi.fn()
    render(
      <DeleteModal
        open
        deleteData={{ id: 'dh-1', name: '员工B' }}
        onOk={onOk}
        onCancel={onCancel}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '员工B' } })
    fireEvent.click(screen.getByRole('button', { name: /确\s*定/ }))

    await waitFor(() => {
      expect(deleteDigitalHumanMock).toHaveBeenCalledWith('dh-1')
      expect(onOk).toHaveBeenCalledWith({ id: 'dh-1', name: '员工B' })
      expect(onCancel).toHaveBeenCalled()
    })
  })
})
