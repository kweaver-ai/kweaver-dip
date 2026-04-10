vi.mock('../UploadSkill.module.less', () => ({
  default: {},
}))

vi.mock('@/components/AppUploadModal/index.module.less', () => ({
  default: {},
}))

vi.mock('@/apis', () => ({
  installSkill: vi.fn(),
}))

vi.mock('antd', async (importOriginal) => {
  const mod = await importOriginal<typeof import('antd')>()
  const { Dragger: ActualDragger } = mod.Upload
  const Dragger = (props: import('react').ComponentProps<typeof ActualDragger>) => (
    <>
      <ActualDragger {...props} />
      <button
        type="button"
        hidden
        data-testid="upload-simulate-remove"
        onClick={() =>
          props.onChange?.({
            file: { status: 'removed', uid: '-1' } as any,
            fileList: [],
          } as any)
        }
      />
    </>
  )
  return { ...mod, Upload: { ...mod.Upload, Dragger } }
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installSkill } from '@/apis'
import type { InstallSkillResult } from '@/apis/dip-studio/skills'
import UploadSkill from '../UploadSkill'

const installOkResult: InstallSkillResult = { name: 'test-skill', skillPath: '/test/path' }

function getFileInput(): HTMLInputElement {
  const el = document.querySelector('input[type="file"]')
  if (!(el instanceof HTMLInputElement)) {
    throw new Error('expected file input')
  }
  return el
}

const mockOnCancel = vi.fn()
const mockOnSuccess = vi.fn()

vi.mock('@/components/AppUploadModal/utils', () => ({
  formatFileSize: (size: number) => `${size} bytes`,
  getFileInfo: (file: File) => ({
    name: file.name,
    size: file.size,
    file,
  }),
}))

const mockedInstallSkill = vi.mocked(installSkill)

describe('DigitalHumanSetting/SkillConfig/UploadSkill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染上传区域', () => {
    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    expect(screen.getByRole('dialog')).toHaveTextContent('导入技能')
    expect(screen.getByText('点击或将文件拖拽到这里上传')).toBeInTheDocument()
    expect(screen.getByText('支持 .zip / .skill 格式的技能包，大小不超过 24MB')).toBeInTheDocument()
  })

  it('关闭弹窗重置状态', () => {
    const { rerender } = render(
      <UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />,
    )

    expect(screen.getByText('点击或将文件拖拽到这里上传')).toBeInTheDocument()

    rerender(<UploadSkill open={false} onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    // Modal 已经关闭，不应该内容
    expect(screen.queryByText('点击或将文件拖拽到这里上传')).not.toBeInTheDocument()
  })

  it('选择正确格式文件显示文件信息', async () => {
    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    // 模拟文件选择
    const file = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const uploadInput = getFileInput()

    fireEvent.change(uploadInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument()
      expect(screen.getByText('等待导入')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /导入技能/ })).toBeEnabled()
    })
  })

  it('拒绝错误文件格式', async () => {
    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const uploadInput = getFileInput()
    fireEvent.change(uploadInput, { target: { files: [file] } })

    // message will be shown, but we can check fileInfo not added
    await waitFor(() => {
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument()
    })
  })

  it('拒绝超过大小限制的文件', async () => {
    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    // 25MB file
    const largeFile = new File(['x'.repeat(25 * 1024 * 1024)], 'large.zip', {
      type: 'application/zip',
    })
    const uploadInput = getFileInput()
    fireEvent.change(uploadInput, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.queryByText('large.zip')).not.toBeInTheDocument()
    })
  })

  it('移除文件重置状态', async () => {
    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    const file = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const uploadInput = getFileInput()
    fireEvent.change(uploadInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /导入技能/ })).toBeEnabled()
    })

    // 直接改 input.files 为空不会触发 antd Upload 的 status: 'removed'；用包装 Dragger 注入的按钮模拟移除
    fireEvent.click(screen.getByTestId('upload-simulate-remove'))

    await waitFor(() => {
      expect(screen.queryByText('test.zip')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /导入技能/ })).toBeDisabled()
    })
  })

  it('上传成功显示成功状态', async () => {
    mockedInstallSkill.mockResolvedValue(installOkResult)

    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    const file = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const uploadInput = getFileInput()
    fireEvent.change(uploadInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument()
    })

    const uploadBtn = screen.getByRole('button', { name: /导入技能/ })
    fireEvent.click(uploadBtn)

    await waitFor(() => {
      expect(screen.getByText('技能导入成功')).toBeInTheDocument()
    })
  })

  it('上传失败显示错误信息', async () => {
    mockedInstallSkill.mockRejectedValue(new Error('文件格式错误'))

    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    const file = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const uploadInput = getFileInput()
    fireEvent.change(uploadInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument()
    })

    const uploadBtn = screen.getByRole('button', { name: /导入技能/ })
    fireEvent.click(uploadBtn)

    await waitFor(() => {
      expect(screen.getByText('文件格式错误')).toBeInTheDocument()
    })
  })

  it('点击取消在上传中显示确认弹窗', async () => {
    const uploadDeferred: { resolve?: (value: InstallSkillResult) => void } = {}
    mockedInstallSkill.mockImplementation(
      () =>
        new Promise<InstallSkillResult>((resolve) => {
          uploadDeferred.resolve = resolve
        }),
    )

    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    const file = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const uploadInput = getFileInput()
    fireEvent.change(uploadInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument()
    })

    const uploadBtn = screen.getByRole('button', { name: /导入技能/ })
    fireEvent.click(uploadBtn)

    await waitFor(() => {
      expect(screen.getByText('正在验证技能包...')).toBeInTheDocument()
    })

    const allButtons = screen.getAllByRole('button')
    const cancelBtn = allButtons.find((btn) => {
      const text = btn.textContent || ''
      return text.includes('取') && text.includes('消')
    })
    if (cancelBtn === undefined) {
      throw new Error('expected footer cancel button')
    }
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.getAllByText('确认取消导入').length).toBeGreaterThan(0)
    })

    uploadDeferred.resolve?.(installOkResult)
  })

  it('成功后点击确定调用 onSuccess 和 onCancel', async () => {
    mockedInstallSkill.mockResolvedValue(installOkResult)

    render(<UploadSkill open onCancel={mockOnCancel} onSuccess={mockOnSuccess} />)

    const file = new File(['test content'], 'test.zip', { type: 'application/zip' })
    const uploadInput = getFileInput()
    fireEvent.change(uploadInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument()
    })

    const uploadBtn = screen.getByRole('button', { name: /导入技能/ })
    fireEvent.click(uploadBtn)

    await waitFor(() => {
      expect(screen.getByText('技能导入成功')).toBeInTheDocument()
    })

    // Find ok button (antd adds space between characters: "确 定")
    const okBtn = screen.getAllByRole('button').find((btn) => btn.textContent?.includes('定'))
    if (okBtn === undefined) {
      throw new Error('expected ok button')
    }
    fireEvent.click(okBtn)

    expect(mockOnSuccess).toHaveBeenCalled()
    expect(mockOnCancel).toHaveBeenCalled()
  })
})
