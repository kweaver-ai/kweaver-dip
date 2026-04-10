import { Button, Flex, Table, Tooltip } from 'antd'
import { memo, useMemo, useState } from 'react'
import type { ChannelConfig as DhChannelConfig } from '@/apis/dip-studio/digital-human'
import DingDingIcon from '@/assets/icons/dingding.svg'
import FeiShuIcon from '@/assets/icons/feishu.svg'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import ScrollBarContainer from '@/components/ScrollBarContainer'
import { useDigitalHumanStore } from '../digitalHumanStore'
import AddChannelModal from './AddChannelModal'
import styles from './index.module.less'

const CHANNEL_TYPE_LABEL: Record<NonNullable<DhChannelConfig['type']>, string> = {
  feishu: '飞书',
  dingtalk: '钉钉',
}

interface ChannelConfigProps {
  readonly?: boolean
}

const ChannelConfig = ({ readonly }: ChannelConfigProps) => {
  const { channel, updateChannel, deleteChannel } = useDigitalHumanStore()
  const [addChannelModalOpen, setAddChannelModalOpen] = useState(false)

  /** 添加通道 */
  const handleAddChannel = () => {
    setAddChannelModalOpen(true)
  }

  /** 添加通道结果 */
  const handleAddChannelResult = (result: DhChannelConfig) => {
    updateChannel(result)
  }

  const channelDataSource = useMemo(() => {
    if (!channel) return []
    return [channel]
  }, [channel])

  const channelColumns = useMemo(() => {
    const columns = [
      {
        title: '名称',
        dataIndex: 'type',
        key: 'type',
        width: '40%',
        render: (type: DhChannelConfig['type']) => {
          const label = CHANNEL_TYPE_LABEL[type ?? 'feishu']
          return (
            <div className="flex items-center gap-2 truncate">
              <img
                src={type === 'dingtalk' ? DingDingIcon : FeiShuIcon}
                alt={label}
                className="h-4 w-4 object-contain"
              />
              <span title={label} className="truncate">
                {label}
              </span>
            </div>
          )
        },
      },
      {
        title: '通道描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (_: string, record: DhChannelConfig) =>
          `用于在${record.type === 'dingtalk' ? '钉钉' : '飞书'}客户端接收消息，处理事务`,
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: () => (
          <Flex align="center">
            <Tooltip title="移除">
              <Button
                type="text"
                onClick={() => deleteChannel()}
                icon={<IconFont type="icon-remove" />}
              />
            </Tooltip>
          </Flex>
        ),
      },
    ]
    return readonly ? columns.slice(0, 2) : columns
  }, [deleteChannel, readonly])

  return (
    <ScrollBarContainer className="h-full flex flex-col p-6 relative flex-1">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col gap-y-1">
          <div className="font-medium text-[--dip-text-color]">通道接入</div>
          <div className="text-[--dip-text-color-45]">
            配置数字员工可接入的通信通道，如钉钉、飞书等。
          </div>
        </div>
        {channel && !readonly && (
          <div className="flex items-end gap-x-3">
            <Button
              color="primary"
              icon={<IconFont type="icon-add" />}
              variant="outlined"
              onClick={handleAddChannel}
            >
              通道
            </Button>
          </div>
        )}
      </div>
      <Table<DhChannelConfig>
        dataSource={channelDataSource}
        columns={channelColumns}
        pagination={false}
        className={styles['channel-table']}
        rowKey={(record) => `${record.type ?? 'feishu'}-${record.appId}`}
        bordered={false}
        size="small"
        scroll={{ y: 'max(246px, calc(100vh - 299px))' }}
        locale={{
          emptyText: (
            <Empty type="empty" title="暂无通道">
              {readonly ? undefined : (
                <Button
                  icon={<IconFont type="icon-add" />}
                  color="primary"
                  variant="outlined"
                  onClick={handleAddChannel}
                >
                  通道
                </Button>
              )}
            </Empty>
          ),
        }}
      />

      {/* 添加通道弹窗 */}
      <AddChannelModal
        open={addChannelModalOpen}
        onOk={handleAddChannelResult}
        onCancel={() => setAddChannelModalOpen(false)}
      />
    </ScrollBarContainer>
  )
}

export default memo(ChannelConfig)
