import { LeftOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import clsx from 'classnames'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BasicSetting, ChannelConfig, KnowledgeConfig, SkillConfig } from '@/components/DESetting'
import { DESettingMenuKey } from '@/components/DESetting/types'
import { deSettingMenuItems } from '@/components/DESetting/utils'

export interface DESettingProps {
  /** 数字员工名称，用于标题展示，可选 */
  employeeName?: string
}

const DESetting = ({ employeeName }: DESettingProps) => {
  const navigate = useNavigate()
  const [selectedMenu, setSelectedMenu] = useState<DESettingMenuKey>(DESettingMenuKey.BASIC)
  const [, messageContextHolder] = message.useMessage()

  useEffect(() => {
    setSelectedMenu(DESettingMenuKey.BASIC)
  }, [])

  const handleBack = () => {
    navigate('/studio/digital-employee')
  }

  const handleCancel = () => {
    navigate('/studio/digital-employee')
  }

  const handlePublish = () => {
    // 后续接入实际发布逻辑
    // 暂时只做占位，避免无响应
    // eslint-disable-next-line no-console
    console.log('TODO: 发布数字员工配置')
  }

  const renderContent = () => {
    if (selectedMenu === DESettingMenuKey.BASIC) {
      return <BasicSetting />
    }
    if (selectedMenu === DESettingMenuKey.SKILL) {
      return <SkillConfig />
    }
    if (selectedMenu === DESettingMenuKey.KNOWLEDGE) {
      return <KnowledgeConfig />
    }
    if (selectedMenu === DESettingMenuKey.CHANNEL) {
      return <ChannelConfig />
    }
    return null
  }

  return (
    <div className="h-full flex flex-col bg-[--dip-page-bg-color]">
      {messageContextHolder}
      {/* 顶部子导航 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[--dip-border-color] bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[--dip-hover-bg-color] text-[--dip-text-color]"
          >
            <LeftOutlined />
          </button>
          <div className="flex flex-col">
            <span className="text-base font-medium text-[--dip-text-color]">数字员工配置</span>
            {employeeName && (
              <span className="text-xs text-[--dip-text-color-45] mt-0.5 truncate max-w-xs">
                {employeeName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handlePublish}>
            发布
          </Button>
        </div>
      </div>

      {/* 底部左右布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单栏 */}
        <div className="w-60 pl-2 pr-1.5 py-4 bg-[#FFFFFFD9] border-r border-[--dip-border-color] shrink-0">
          <div className="flex flex-col gap-2">
            {deSettingMenuItems.map((item) => (
              <button
                type="button"
                key={item.key}
                className={clsx(
                  'h-10 px-3 flex items-center text-start text-sm rounded transition-colors relative text-[--dip-text-color] hover:bg-[--dip-hover-bg-color]',
                  selectedMenu === item.key &&
                    '!text-[--dip-primary-color] !bg-[#f1f7fe] !hover:bg-[#f1f7fe]',
                )}
                onClick={() => setSelectedMenu(item.key)}
              >
                <span
                  className={clsx(
                    'absolute left-[-4px] top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-sm',
                    'bg-[linear-gradient(180deg,#3FA9F5_0%,#126EE3_100%)]',
                    selectedMenu === item.key ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="flex-1 truncate font-normal text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 py-4">{renderContent()}</div>
      </div>
    </div>
  )
}

export default DESetting
