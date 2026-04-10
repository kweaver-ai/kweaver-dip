vi.mock('../UploadSkill', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="upload-skill" /> : null),
}))

vi.mock('../UploadSkill.module.less', () => ({ default: {} }))

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DigitalHumanSkill } from '@/apis'
import { getEnabledSkills } from '@/apis'
import type { GetEnabledSkillsParams } from '@/apis/dip-studio/skills'
import SelectSkillModal from '../SelectSkillModal'

const mockOnOk = vi.fn()
const mockOnCancel = vi.fn()
const mockOnSubmit = vi.fn()

vi.mock('@/apis', () => ({
  getEnabledSkills: vi.fn(),
}))

vi.mock('@/components/ScrollBarContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-bar-container">{children}</div>
  ),
}))

vi.mock('@/components/SearchInput', () => ({
  default: ({ onSearch, placeholder }: { onSearch: (v: string) => void; placeholder: string }) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      onChange={(e) => onSearch(e.target.value)}
    />
  ),
}))

vi.mock('@/components/IconFont', () => ({
  default: () => <span data-testid="icon-font" />,
}))

const mockedGetEnabledSkills = vi.mocked(getEnabledSkills)

describe('DigitalHumanSetting/SkillConfig/SelectSkillModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSkills: DigitalHumanSkill[] = [
    {
      name: '产品问答',
      description: '回答产品相关问题',
      type: 'official',
      built_in: false,
    },
    {
      name: '技术支持',
      description: '处理技术问题',
      type: 'openclaw-managed',
      built_in: false,
    },
  ]

  it('弹窗打开时获取技能列表', async () => {
    mockedGetEnabledSkills.mockResolvedValue(mockSkills)

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    expect(screen.getByText('添加技能')).toBeInTheDocument()
    expect(await screen.findByText('产品问答')).toBeInTheDocument()
    expect(screen.getByText('技术支持')).toBeInTheDocument()
    expect(screen.getByText('回答产品相关问题')).toBeInTheDocument()
  })

  it('显示默认选中的技能', async () => {
    mockedGetEnabledSkills.mockResolvedValue(mockSkills)

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[mockSkills[0]]}
      />,
    )

    await screen.findByText('产品问答')
    // 只获取技能行中的按钮，排除底部按钮
    const skillButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === '已添加' || btn.textContent === '添加')
    expect(skillButtons[0]).toHaveTextContent('已添加')
    expect(skillButtons[1]).toHaveTextContent('添加')
  })

  it('可以切换选择技能', async () => {
    mockedGetEnabledSkills.mockResolvedValue(mockSkills)

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    await screen.findByText('产品问答')
    // 获取技能行中的按钮，只保留那些确实在技能列表中的按钮
    const allButtons = screen.getAllByRole('button')
    const productAddBtn = allButtons.find((btn) => btn.textContent === '添加')
    if (productAddBtn === undefined) {
      throw new Error('expected 添加 button')
    }
    fireEvent.click(productAddBtn)

    await waitFor(() => {
      expect(mockOnOk).toHaveBeenCalledWith([mockSkills[0]])
    })

    // 再次点击取消选择
    const productAddedBtn = screen.getByText('已添加')
    fireEvent.click(productAddedBtn)

    await waitFor(() => {
      expect(mockOnOk).toHaveBeenCalledWith([])
    })
  })

  it('搜索技能过滤列表', async () => {
    // Mock API to return filtered results based on search keyword
    mockedGetEnabledSkills.mockImplementation(async (params?: GetEnabledSkillsParams) => {
      const keyword = params?.name?.trim()
      if (!keyword) return mockSkills
      return mockSkills.filter((skill) => skill.name.includes(keyword))
    })

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    await screen.findByText('产品问答')
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: '产品' } })

    // Wait for API call and re-render
    await waitFor(
      () => {
        expect(screen.getByText('产品问答')).toBeInTheDocument()
        expect(screen.queryByText('技术支持')).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('加载失败显示错误', async () => {
    mockedGetEnabledSkills.mockRejectedValue(new Error('加载失败'))

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    expect(await screen.findByText('获取数据时发生错误')).toBeInTheDocument()
  })

  it('没有技能显示空状态', async () => {
    mockedGetEnabledSkills.mockResolvedValue([])

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    expect(await screen.findByText('暂无技能')).toBeInTheDocument()
  })

  it('搜索无结果显示搜索空状态', async () => {
    mockedGetEnabledSkills.mockResolvedValue([])

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    await screen.findByText('暂无技能')
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: '不存在' } })

    await waitFor(() => {
      expect(screen.getByText('抱歉，没有找到相关内容')).toBeInTheDocument()
    })
  })

  it('点击会话创建按钮调用 onSubmit', async () => {
    mockedGetEnabledSkills.mockResolvedValue(mockSkills)

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    await screen.findByText('产品问答')
    fireEvent.click(screen.getByText('会话创建'))

    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('点击导入创建按钮打开上传弹窗', async () => {
    mockedGetEnabledSkills.mockResolvedValue(mockSkills)

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    await screen.findByText('产品问答')
    fireEvent.click(screen.getByText('导入创建'))

    expect(screen.getByTestId('upload-skill')).toBeInTheDocument()
  })

  it('点击取消调用 onCancel', async () => {
    mockedGetEnabledSkills.mockResolvedValue(mockSkills)

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    await screen.findByText('产品问答')
    // Modal close button
    const buttons = screen.getAllByRole('button')
    // First button is close, then session create, import create, then the two action buttons
    const closeBtn = buttons[0]
    fireEvent.click(closeBtn)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('关闭弹窗不获取数据', () => {
    render(
      <SelectSkillModal
        open={false}
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    expect(mockedGetEnabledSkills).not.toHaveBeenCalled()
  })

  it('显示正确类型标签', async () => {
    mockedGetEnabledSkills.mockResolvedValue(mockSkills)

    render(
      <SelectSkillModal
        open
        onOk={mockOnOk}
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        defaultSelectedSkills={[]}
      />,
    )

    await screen.findByText('产品问答')
    expect(screen.getByText('@官方')).toBeInTheDocument()
    expect(screen.getByText('@自定义')).toBeInTheDocument()
  })
})
