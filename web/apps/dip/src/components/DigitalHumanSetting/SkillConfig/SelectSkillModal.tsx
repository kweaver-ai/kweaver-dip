import type { ModalProps } from 'antd'
import { Button, Modal, Spin } from 'antd'
import clsx from 'clsx'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { type DigitalHumanSkill, type GetEnabledSkillsParams, getEnabledSkills } from '@/apis'
import type { AiPromptSubmitPayload } from '@/components/DipChatKit/components/AiPromptInput/types'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import SearchInput from '@/components/SearchInput'
import { useListService } from '@/hooks/useListService'
import { DEFAULT_SKILL_ICON_COLORS, getMatchedColorByName } from '@/utils/handle-function'
import UploadSkill from './UploadSkill'

export interface SelectSkillModalProps extends Omit<ModalProps, 'onCancel' | 'onOk'> {
  /** 在列表中点击「添加」或「已添加」时立即回传当前已选技能（不再使用底部确定） */
  onOk: (result: DigitalHumanSkill[]) => void
  onCancel: () => void
  onSubmit: (payload?: AiPromptSubmitPayload) => void
  /** 已选中的技能目录名（与 store `skills` / API 一致） */
  defaultSelectedSkills?: DigitalHumanSkill[]
  /** 当前数字员工 ID；有值时「我的技能」拉取该员工已配置技能 */
  digitalHumanId?: string
  /** 外部触发刷新列表的信号 */
  refreshToken?: number
  /** 是否展示弹窗遮罩 */
  showMask?: boolean
}

const SelectSkillModal = ({
  open,
  onOk,
  onCancel,
  onSubmit,
  defaultSelectedSkills = [],
  refreshToken = 0,
}: SelectSkillModalProps) => {
  const [selectedSkills, setSelectedSkills] = useState<DigitalHumanSkill[]>([])
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const getFetchArgs = useCallback((searchValue: string): [GetEnabledSkillsParams?] => {
    const trimmed = searchValue.trim()
    const params: GetEnabledSkillsParams | undefined = trimmed ? { name: trimmed } : undefined
    return [params]
  }, [])

  const {
    items: allSkills,
    loading,
    error,
    searchValue,
    handleSearch,
    handleRefresh,
    fetchList,
  } = useListService<DigitalHumanSkill, [GetEnabledSkillsParams?]>({
    fetchFn: getEnabledSkills,
    getFetchArgs,
    autoLoad: false,
  })

  useLayoutEffect(() => {
    if (!open) return
    setSelectedSkills([...defaultSelectedSkills])
    handleSearch('')
  }, [open, defaultSelectedSkills, handleSearch])

  useEffect(() => {
    if (!open) return
    void fetchList(...getFetchArgs(searchValue))
  }, [open, searchValue, refreshToken, fetchList, getFetchArgs])

  const listError = error

  const selectedCount = selectedSkills.length
  const maxSelectCount = 50

  const toggleSelect = (skill: DigitalHumanSkill) => {
    setSelectedSkills((prev) => {
      const exists = prev.some((x) => x.name === skill.name)
      if (exists) {
        const next = prev.filter((x) => x.name !== skill.name)
        queueMicrotask(() => onOk(next))
        return next
      }
      const next = [...prev, skill]
      queueMicrotask(() => onOk(next))
      return next
    })
  }

  const handleSubmit = (payload?: AiPromptSubmitPayload) => {
    onSubmit(payload)
  }

  const renderStateContent = () => {
    if (loading && !allSkills.length) {
      return <Spin />
    }

    if (listError) {
      return <Empty type="failed" title={typeof listError === 'string' ? listError : '加载失败'} />
    }

    if (allSkills.length === 0) {
      if (searchValue.trim()) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return <Empty title="暂无技能" />
    }

    return null
  }

  const renderSkillRows = () => {
    return (
      <div>
        {allSkills.map((item: DigitalHumanSkill, index: number) => {
          const isAdded = selectedSkills.some((x) => x.name === item.name)
          return (
            <div
              key={item.name}
              className={clsx(
                'flex flex-col bg-[#F8F8F7]',
                index === 0 && 'rounded-t-lg',
                index === allSkills.length - 1 && 'rounded-b-lg',
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="flex h-12 w-12 pl-1 pb-0.5 shrink-0 items-end rounded-[10px] text-[8px] font-semibold leading-tight text-white"
                  style={{
                    backgroundColor: getMatchedColorByName(item.name, DEFAULT_SKILL_ICON_COLORS),
                  }}
                >
                  skill
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 flex items-center gap-2 break-words text-sm font-bold leading-[22px]">
                    <span className="truncate">{item.name}</span>
                    <span className="text-xs text-[#A0A0A9] font-normal flex-shrink-0">
                      @{item.type === 'openclaw-managed' ? '自定义' : '官方'}
                    </span>
                  </p>
                  <p
                    className="m-0 whitespace-pre-wrap break-words text-xs line-clamp-2 leading-5 text-[#6A7282]"
                    title={item.description?.trim()}
                  >
                    {item.description?.trim() || '--'}
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  {isAdded ? (
                    <button
                      type="button"
                      className="h-7 min-w-16 cursor-pointer rounded-md border border-[--dip-border-color] bg-[] px-3 text-[13px] leading-5 text-[--dip-text-color-45] transition-colors hover:bg-[var(--dip-hover-bg-color)]"
                      title="点击取消选择"
                      onClick={() => toggleSelect(item)}
                    >
                      已添加
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="h-7 min-w-16 rounded-md border border-[--dip-border-color] bg-[--dip-white] px-3 text-[13px] leading-5 text-[--dip-text-color-85] transition-colors hover:bg-[var(--dip-hover-bg-color)]"
                      onClick={() => toggleSelect(item)}
                    >
                      添加
                    </button>
                  )}
                </div>
              </div>
              {index !== allSkills.length - 1 && (
                <div className="h-px bg-[#F3F4F6] flex-shrink-0 mx-4">
                  <div className="h-px bg-[--dip-line-color-10] ml-[76px] flex-shrink-0" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderListBody = () => {
    const stateContent = renderStateContent()
    if (stateContent) {
      return <div className="flex flex-1 items-center justify-center mb-16">{stateContent}</div>
    }
    return renderSkillRows()
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 px-6">
          添加技能
          <span className="text-xs text-[#6A7282] font-normal">
            已选 {selectedCount}/{maxSelectCount}
          </span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={780}
      closable
      centered
      mask={{ closable: false, enabled: true }}
      destroyOnHidden
      footer={null}
      styles={{
        container: {
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          padding: '20px 0',
        },
        body: {
          padding: '8px 0 0 0',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
        },
      }}
    >
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden gap-y-3">
        <div className="relative flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button
              type="primary"
              icon={
                <div className="w-4 h-5">
                  <IconFont type="icon-newchat" className="!text-xl" />
                </div>
              }
              onClick={() => handleSubmit()}
            >
              会话创建
            </Button>
            <Button onClick={() => setUploadModalOpen(true)}>导入创建</Button>
          </div>
          <SearchInput placeholder="搜索技能" className="!w-[220px]" onSearch={handleSearch} />
        </div>
        <div className="flex flex-col h-0 flex-1 mx-6">
          <ScrollBarContainer className="h-full min-h-0 pr-6 -mr-6 flex flex-col">
            {renderListBody()}
          </ScrollBarContainer>
        </div>
      </div>
      <UploadSkill
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        onSuccess={() => void handleRefresh()}
      />
    </Modal>
  )
}

export default SelectSkillModal
