import type { ModalProps } from 'antd'
import { Checkbox, Modal, Spin, Tabs } from 'antd'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { type BknKnowledgeNetworkInfo, getBknKnowledgeNetworks } from '@/apis'
import AppIcon from '@/components/AppIcon'
import Empty from '@/components/Empty'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { LoadStatus } from '@/types/enums'
import { formatTimeSlash } from '@/utils/handle-function/FormatTime'

export interface SelectKnowledgeModalProps extends Omit<ModalProps, 'onCancel' | 'onOk'> {
  /** 确定成功的回调，传递信息 */
  onOk: (result: BknKnowledgeNetworkInfo[]) => void
  /** 取消回调 */
  onCancel: () => void
  /** 默认选中的知识网络IDs */
  defaultSelectedIds?: string[]
}

/** 选择知识网络弹窗 */
const SelectKnowledgeModal = ({
  open,
  onOk,
  onCancel,
  defaultSelectedIds = [],
}: SelectKnowledgeModalProps) => {
  const [status, setStatus] = useState<LoadStatus>(LoadStatus.Empty)
  const [knowledgeList, setKnowledgeList] = useState<BknKnowledgeNetworkInfo[]>([])
  const [selectedList, setSelectedList] = useState<BknKnowledgeNetworkInfo[]>([])

  useEffect(() => {
    setSelectedList(knowledgeList.filter((item) => defaultSelectedIds?.includes(item.id)))
  }, [knowledgeList, defaultSelectedIds])

  // 获取知识网络列表
  const fetchKnowledgeNetworks = async () => {
    if (status === LoadStatus.Loading) return // 防止重复请求
    setStatus(LoadStatus.Loading)
    try {
      const result = await getBknKnowledgeNetworks({ limit: -1 })
      setKnowledgeList(result.entries)
      setStatus(result.total_count > 0 ? LoadStatus.Normal : LoadStatus.Empty)
    } catch {
      // messageApi.error(error?.description || '获取知识网络列表失败')
      setKnowledgeList([])
      setStatus(LoadStatus.Failed)
    }
  }

  useEffect(() => {
    if (open) {
      fetchKnowledgeNetworks()
    }
  }, [open])

  // 选择知识网络
  const handleSelect = (item: BknKnowledgeNetworkInfo) => {
    if (selectedList.some((selected) => selected.id === item.id)) {
      setSelectedList(selectedList.filter((selected) => selected.id !== item.id))
    } else {
      setSelectedList([...selectedList, item])
    }
  }

  // 确定
  const handleOk = () => {
    onOk(selectedList)
    onCancel()
  }

  const renderStateContent = () => {
    if (status === LoadStatus.Loading) {
      return <Spin />
    }

    if (status === LoadStatus.Failed) {
      return <Empty type="failed" title="加载失败" />
    }

    if (status === LoadStatus.Empty) {
      return <Empty title="暂无知识" />
    }

    return null
  }

  const renderKnowledgeList = () => {
    return (
      <div className="grid grid-cols-2 gap-[14px]">
        {knowledgeList.map((item) => {
          const isSelected = selectedList.some((selected) => selected.id === item.id)
          return (
            <button
              key={item.id}
              type="button"
              className={clsx(
                'relative flex min-h-[94px] flex-col rounded-lg border border-[--dip-border-color] px-5 py-4 text-left outline-none transition-colors hover:bg-[rgba(0,0,0,0.02)]',
                isSelected &&
                  '!border-[--dip-primary-color] !bg-[rgba(18,110,227,0.06)] !hover:bg-[rgba(18,110,227,0.1)]',
              )}
              onClick={() => handleSelect(item)}
            >
              <div className="flex items-center gap-x-3">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex overflow-hidden">
                  <AppIcon name={item.name} size={48} className="w-full h-full" shape="square" />
                </div>
                <div className="flex flex-col gap-y-2 flex-1">
                  <div className="flex items-center gap-x-2">
                    <span
                      className="text-base font-bold leading-[22px] text-[--dip-text-color-85] truncate flex-1"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <Checkbox
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelect(item)}
                    />
                  </div>
                  <div
                    className="mt-2 line-clamp-2 text-xs text-[--dip-text-color-65]"
                    title={item.comment}
                  >
                    {item.comment?.trim() || '[暂无描述]'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end flex-1 h-0">
                <div className="h-px bg-[--dip-line-color-10] my-2" />
                <div className="text-right mt-2 text-xs text-[--dip-text-color-65]">
                  更新：{formatTimeSlash(item.update_time || '') || '--'}
                </div>
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

    return renderKnowledgeList()
  }

  return (
    <Modal
      title="添加知识"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      closable
      centered
      mask={{ closable: false }}
      destroyOnHidden
      width={744}
      okText="确定"
      cancelText="取消"
      footer={(_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      )}
    >
      <div className="flex flex-col">
        {/* <AiPromptInput
            employeeOptions={[]}
            placeholder="可以直接输入你想要创建的业务知识网络，也可以直接选择下方的业务知识网络"
            onSubmit={handleSubmit}
            autoSize={{ minRows: 2, maxRows: 2 }}
          /> */}
        <Tabs
          size="small"
          items={[
            {
              key: 'all',
              label: '全部业务知识网络',
            },
          ]}
          activeKey="all"
        />
        <ScrollBarContainer className="mx-[-24px] px-6">
          <div className="flex-1 grid max-h-[400px] overflow-y-auto relative min-h-[180px]">
            {renderContent()}
          </div>
        </ScrollBarContainer>
      </div>
    </Modal>
  )
}

export default SelectKnowledgeModal
