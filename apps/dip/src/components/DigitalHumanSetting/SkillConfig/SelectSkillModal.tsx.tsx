import type { ModalProps } from 'antd'
import { Checkbox, Modal, Spin } from 'antd'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { type DigitalHumanSkill, getEnabledSkills } from '@/apis'
import AiPromptInput from '@/components/DipChatKit/components/AiPromptInput'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useListService } from '@/hooks/useListService'

export interface SelectSkillModalProps extends Omit<ModalProps, 'onCancel' | 'onOk'> {
  onOk: (result: DigitalHumanSkill[]) => void
  onCancel: () => void
  onSubmit: (payload: AiPromptSubmitPayload) => void
  /** 已选中的技能目录名（与 store `skills` / API 一致） */
  defaultSelectedSkills?: DigitalHumanSkill[]
  /** 当前数字员工 ID；有值时「我的技能」拉取该员工已配置技能 */
  digitalHumanId?: string
  /** 外部触发刷新列表的信号 */
  refreshToken?: number
  /** 是否展示弹窗遮罩 */
  showMask?: boolean
}

/** 新建技能：自然语言输入 + 全部/我的 Tab + 卡片多选（对齐设计稿） */
const SelectSkillModal = ({
  open,
  onOk,
  onCancel,
  onSubmit,
  defaultSelectedSkills = [],
  digitalHumanId,
  refreshToken = 0,
  showMask = true,
}: SelectSkillModalProps) => {
  const [selectedSkills, setSelectedSkills] = useState<DigitalHumanSkill[]>([])

  const {
    items: allSkills,
    loading,
    error,
    fetchList: fetchAllSkills,
  } = useListService<DigitalHumanSkill, []>({
    fetchFn: getEnabledSkills,
    autoLoad: false,
  })

  useEffect(() => {
    if (!open) return
    setSelectedSkills([...defaultSelectedSkills])
  }, [open, defaultSelectedSkills])

  useEffect(() => {
    if (!open) return
    void fetchAllSkills()
  }, [open, digitalHumanId, refreshToken, fetchAllSkills])

  const toggleSelect = (skill: DigitalHumanSkill) => {
    setSelectedSkills((prev) =>
      prev.some((x) => x.name === skill.name)
        ? prev.filter((x) => x.name !== skill.name)
        : [...prev, skill],
    )
  }

  const handleCardClick = (skill: DigitalHumanSkill) => {
    toggleSelect(skill)
  }

  const handleOk = () => {
    onOk(selectedSkills)
    onCancel()
  }

  const handleSubmit = (payload: AiPromptSubmitPayload) => {
    onSubmit(payload)
  }

  /** 渲染状态内容 */
  const renderStateContent = () => {
    if (loading) {
      return <Spin />
    }

    if (error) {
      return <Empty type="failed" title="加载失败" />
    }

    if (allSkills.length === 0) {
      return <Empty title="暂无技能" />
    }

    return null
  }

  const renderSkillList = () => {
    return (
      <div className="grid grid-cols-2 gap-[14px]">
        {allSkills.map((item) => {
          const checked = selectedSkills.some((x) => x.name === item.name)
          return (
            <button
              key={item.name}
              type="button"
              className={clsx(
                'relative min-h-[94px] flex flex-col rounded-lg border-0 bg-[#f7f8fa] px-5 py-4 text-left outline-none transition-colors hover:bg-[#f0f2f5]',
                checked &&
                  'bg-[rgb(18,110,227,0.08)] shadow-[inset_0_0_0_1px_rgba(18,110,227,0.35)] hover:bg-[rgb(18,110,227,0.1)]',
              )}
              onClick={() => handleCardClick(item)}
            >
              <div className="flex items-center gap-x-2">
                <IconFont
                  type="icon-dip-deep-thinking"
                  className="text-[--dip-primary-color] text-xl h-4 w-4 shrink-0"
                />
                <span
                  className="text-base font-bold leading-[22px] text-[--dip-text-color-85] truncate flex-1"
                  title={item.name}
                >
                  {item.name}
                </span>

                <Checkbox
                  checked={checked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleSelect(item)}
                />
              </div>
              <div
                className="mt-2 line-clamp-3 text-xs text-[--dip-text-color-65]"
                title={item.description}
              >
                {item.description?.trim() || '--'}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  const renderContent = () => {
    const stateContent = renderStateContent()

    if (stateContent) {
      return <div className="absolute inset-0 flex items-center justify-center">{stateContent}</div>
    }
    return renderSkillList()
  }

  return (
    <Modal
      title="新建技能"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={744}
      mask={showMask}
      maskClosable={false}
      destroyOnHidden
      styles={{
        body: { paddingTop: 8 },
      }}
      okText="确定"
      cancelText="取消"
      footer={(_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      )}
    >
      <div className="flex flex-col gap-y-6">
        <AiPromptInput
          assignEmployeeValue="__internal_skill_agent__"
          placeholder={'可以直接输入你想要创建的Skills，也可以直接选择下方的技能'}
          onSubmit={handleSubmit}
          autoSize={{ minRows: 2, maxRows: 2 }}
        />

        <ScrollBarContainer className="grid max-h-[400px] overflow-y-auto relative min-h-[180px] mx-[-24px] px-6">
          {renderContent()}
        </ScrollBarContainer>
      </div>
    </Modal>
  )
}

export default SelectSkillModal
