import { Switch, Tag } from 'antd'
import { memo } from 'react'
import ScrollBarContainer from '@/components/ScrollBarContainer'

const ChannelConfig = () => {
  const channels: Array<{
    key: string
    name: string
    desc: string
    status: 'on' | 'off'
    type: 'im' | 'web' | 'app'
  }> = [
    {
      key: 'web',
      name: 'Web 页面',
      desc: '通过 Web 页面对外提供数字员工服务，支持嵌入业务系统。',
      status: 'on',
      type: 'web',
    },
    {
      key: 'wechat-work',
      name: '企业微信',
      desc: '连接企业微信应用，让内部同事在企业微信中直接调用数字员工。',
      status: 'off',
      type: 'im',
    },
    {
      key: 'app',
      name: '移动 App SDK',
      desc: '在移动 App 中嵌入数字员工能力，支持多端统一体验。',
      status: 'off',
      type: 'app',
    },
  ]

  return (
    <div className="h-full flex flex-col gap-y-3">
      <div className="px-4 text-sm font-medium text-[--dip-text-color]">通道接入</div>
      <ScrollBarContainer className="px-4">
        <div className="flex flex-col gap-3 pb-6">
          <div className="text-xs text-[--dip-text-color-65]">
            配置数字员工可以通过哪些通道被用户访问，不同通道可独立启停，互不影响。
          </div>

          <div className="rounded-xl border border-[#E3E8EF] bg-white p-3 text-sm text-[--dip-text-color]">
            <div className="flex flex-col divide-y divide-[#F2F4F7]">
              {channels.map((channel) => (
                <div key={channel.key} className="flex items-center gap-3 py-2.5">
                  <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{channel.name}</span>
                      <Tag className="m-0 text-xs border-[#E3E8EF] text-[--dip-text-color-65]">
                        {channel.type === 'web' && 'Web'}
                        {channel.type === 'im' && 'IM'}
                        {channel.type === 'app' && '移动端'}
                      </Tag>
                      <Tag
                        color={channel.status === 'on' ? 'success' : 'default'}
                        className="m-0 text-xs flex-shrink-0"
                      >
                        {channel.status === 'on' ? '已启用' : '未启用'}
                      </Tag>
                    </div>
                    <div className="text-xs text-[--dip-text-color-65] leading-5">{channel.desc}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Switch checked={channel.status === 'on'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(ChannelConfig)

