import { Button, Flex, Table, Tooltip } from 'antd'
import { memo, useMemo, useState } from 'react'
import type { BknKnowledgeNetworkInfo } from '@/apis'
import type { BknEntry } from '@/apis/dip-studio/digital-human'
import AppIcon from '@/components/AppIcon'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useDigitalHumanStore } from '../digitalHumanStore'
import styles from './index.module.less'
import SelectKnowledgeModal from './SelectKnowledgeModal'

interface KnowledgeConfigProps {
  readonly?: boolean
}

const KnowledgeConfig = ({ readonly }: KnowledgeConfigProps) => {
  const { bkn, updateBkn, deleteBkn } = useDigitalHumanStore()
  const [selectKnowledgeModalOpen, setSelectKnowledgeModalOpen] = useState(false)

  /** 选择知识网络 */
  const handleSelectKnowledge = () => {
    setSelectKnowledgeModalOpen(true)
  }

  /** 选择知识网络结果 */
  const handleSelectKnowledgeResult = (result: BknKnowledgeNetworkInfo[]) => {
    const next: BknEntry[] = result.map((k) => ({
      name: k.name,
      url: k.id,
    }))
    updateBkn(next)
  }

  const knowledgeColumns = useMemo(() => {
    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: '40%',
        render: (text: string) => (
          <div className="flex items-center gap-2 truncate">
            <AppIcon
              name={text}
              size={20}
              className="w-6 h-6 rounded flex-shrink-0"
              shape="square"
            />
            <span title={text} className="truncate">
              {text || '--'}
            </span>
          </div>
        ),
      },
      {
        title: '功能描述',
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        render: (text: string) => text || '--',
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: (_: unknown, record: BknEntry) => (
          <Flex align="center">
            <Tooltip title="移除">
              <Button
                type="text"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteBkn(record.url)
                }}
                icon={<IconFont type="icon-remove" />}
              />
            </Tooltip>
          </Flex>
        ),
      },
    ]
    return readonly ? columns.slice(0, 2) : columns
  }, [deleteBkn, readonly])

  return (
    <ScrollBarContainer className="h-full flex flex-col p-6">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col gap-y-1">
          <div className="font-medium text-[--dip-text-color]">知识配置</div>
          <div className="text-[--dip-text-color-45]">
            选择该数字员工需要关联的业务知识网络（BKN）。数字员工将基于这些知识网络回答问题和执行任务。
          </div>
        </div>
        {bkn.length > 0 && !readonly && (
          <div className="flex items-end gap-x-3">
            <Button
              color="primary"
              icon={<IconFont type="icon-add" />}
              onClick={handleSelectKnowledge}
              variant="outlined"
            >
              知识
            </Button>
          </div>
        )}
      </div>
      <Table<BknEntry>
        dataSource={bkn}
        columns={knowledgeColumns}
        pagination={false}
        className={styles['knowledge-table']}
        rowKey={(record) => record.url}
        bordered={false}
        size="small"
        scroll={{ y: 'max(246px, calc(100vh - 299px))' }}
        locale={{
          emptyText: (
            <Empty type="empty" title="暂无知识">
              {readonly ? undefined : (
                <Button
                  icon={<IconFont type="icon-add" />}
                  color="primary"
                  variant="outlined"
                  onClick={handleSelectKnowledge}
                >
                  知识
                </Button>
              )}
            </Empty>
          ),
        }}
      />

      {/* 选择知识网络弹窗 */}
      <SelectKnowledgeModal
        open={selectKnowledgeModalOpen}
        onOk={handleSelectKnowledgeResult}
        onCancel={() => setSelectKnowledgeModalOpen(false)}
        defaultSelectedIds={bkn.map((item) => item.url) || []}
      />
    </ScrollBarContainer>
  )
}

export default memo(KnowledgeConfig)
