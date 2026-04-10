import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock AdPromptInput to avoid issues with its dependencies
vi.mock('../../AdPromptInput', () => ({
  default: (props: any) => (
    <div data-testid="ad-prompt-input">{props.value || props.placeholder}</div>
  ),
}))

import BasicSetting from '../index'

const mockUpdateBasic = vi.fn()
const mockUseLanguageStore = vi.fn(() => ({
  language: 'zh-CN',
}))
const mockUseDigitalHumanStore = vi.fn(() => ({
  basic: {
    name: '测试数字员工',
    creature: '这是一个测试数字员工的简介',
    soul: '这是角色设定内容',
  },
  skills: [
    { id: '1', name: '技能一', description: '描述一' },
    { id: '2', name: '技能二', description: '描述二' },
  ],
  updateBasic: mockUpdateBasic,
}))

vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: () => mockUseLanguageStore(),
}))

vi.mock('../../digitalHumanStore', () => ({
  useDigitalHumanStore: () => mockUseDigitalHumanStore(),
}))

vi.mock('../NameDescriptionFields', () => ({
  default: () => (
    <>
      <input name="name" defaultValue="测试数字员工" placeholder="请输入数字员工名称" />
      <textarea
        name="creature"
        defaultValue="这是一个测试数字员工的简介"
        placeholder="请输入数字员工简介"
      />
    </>
  ),
}))

vi.mock('@/components/ScrollBarContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-bar-container">{children}</div>
  ),
}))

describe('DigitalHumanSetting/BasicSetting', () => {
  it('应该正确渲染可编辑模式', () => {
    mockUseLanguageStore.mockReturnValue({ language: 'zh-CN' })
    mockUseDigitalHumanStore.mockReturnValue({
      basic: {
        name: '测试数字员工',
        creature: '这是一个测试数字员工的简介',
        soul: '这是角色设定内容',
      },
      skills: [
        { id: '1', name: '技能一', description: '描述一' },
        { id: '2', name: '技能二', description: '描述二' },
      ],
      updateBasic: mockUpdateBasic,
    })

    render(<BasicSetting />)

    expect(screen.getByText('基本设定')).toBeInTheDocument()
    expect(screen.getByText('定义数字员工的名称、简介和核心职责描述。')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入数字员工名称')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入数字员工简介')).toBeInTheDocument()
    expect(screen.getByTestId('ad-prompt-input')).toBeInTheDocument()
  })

  it('应该正确渲染只读模式', () => {
    mockUseLanguageStore.mockReturnValue({ language: 'zh-CN' })
    mockUseDigitalHumanStore.mockReturnValue({
      basic: {
        name: '测试数字员工',
        creature: '这是一个测试数字员工的简介',
        soul: '这是角色设定内容',
      },
      skills: [
        { id: '1', name: '技能一', description: '描述一' },
        { id: '2', name: '技能二', description: '描述二' },
      ],
      updateBasic: mockUpdateBasic,
    })

    render(<BasicSetting readonly />)

    expect(screen.getByText('基本信息')).toBeInTheDocument()
    expect(screen.getByText('名称')).toBeInTheDocument()
    expect(screen.getByText('测试数字员工')).toBeInTheDocument()
    expect(screen.getByText('简介')).toBeInTheDocument()
    expect(screen.getByText('这是一个测试数字员工的简介')).toBeInTheDocument()
    expect(screen.getByText('角色设定')).toBeInTheDocument()
  })

  it('应该在只读模式下显示 "--" 当简介和角色设定为空时', () => {
    mockUseLanguageStore.mockReturnValue({ language: 'zh-CN' })
    mockUseDigitalHumanStore.mockReturnValue({
      basic: {
        name: '测试数字员工',
        creature: '',
        soul: '',
      },
      skills: [],
      updateBasic: mockUpdateBasic,
    })

    render(<BasicSetting readonly />)

    expect(screen.getAllByText('--')).toHaveLength(2)
  })

  it('应该根据不同语言显示不同占位符', () => {
    mockUseLanguageStore.mockReturnValue({ language: 'en-US' })
    mockUseDigitalHumanStore.mockReturnValue({
      basic: {
        name: '测试数字员工',
        creature: '这是一个测试数字员工的简介',
        soul: '',
      },
      skills: [
        { id: '1', name: '技能一', description: '描述一' },
        { id: '2', name: '技能二', description: '描述二' },
      ],
      updateBasic: mockUpdateBasic,
    })

    render(<BasicSetting />)

    expect(screen.getByTestId('ad-prompt-input').textContent).toContain(
      'To set AI response specifications',
    )
  })
})
