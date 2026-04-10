import { message } from 'antd'
import clsx from 'clsx'
import { memo, useEffect, useState } from 'react'
import IconFont from '../IconFont'
import BasicSetting from './BasicSetting'
import ChannelConfig from './ChannelConfig'
import KnowledgeConfig from './KnowledgeConfig'
import SkillConfig from './SkillConfig'
import { DESettingMenuKey } from './types'
import { deSettingMenuItems } from './utils'

/** 配置内容区：左侧菜单 + 右侧表单（顶栏与返回由 Details / DHSetting 负责） */
const DigitalHumanSetting = ({ readonly }: { readonly?: boolean }) => {
  const [selectedMenu, setSelectedMenu] = useState<DESettingMenuKey>(DESettingMenuKey.BASIC)
  const [, messageContextHolder] = message.useMessage()

  useEffect(() => {
    setSelectedMenu(DESettingMenuKey.BASIC)
  }, [])

  const renderContent = () => {
    if (selectedMenu === DESettingMenuKey.BASIC) {
      return <BasicSetting readonly={readonly} />
    }
    if (selectedMenu === DESettingMenuKey.SKILL) {
      return <SkillConfig readonly={readonly} />
    }
    if (selectedMenu === DESettingMenuKey.KNOWLEDGE) {
      return <KnowledgeConfig readonly={readonly} />
    }
    if (selectedMenu === DESettingMenuKey.CHANNEL) {
      return <ChannelConfig readonly={readonly} />
    }
    return null
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[--dip-white] relative flex-1">
      {messageContextHolder}
      <div className="flex flex-1 min-h-0 overflow-hidden p-6 bg-[#F8FAFC] gap-x-4">
        <div className="w-60 pl-2 pr-1.5 py-4 bg-[--dip-white] shrink-0 rounded-md">
          <div className="flex flex-col gap-2">
            {deSettingMenuItems.map((item) => (
              <button
                type="button"
                key={item.key}
                className={clsx(
                  'h-10 px-3 flex items-center gap-2 text-start text-sm rounded transition-colors relative text-[--dip-text-color] hover:bg-[--dip-hover-bg-color]',
                  selectedMenu === item.key &&
                    '!text-[--dip-primary-color] !bg-[#f1f7fe] !hover:bg-[#f1f7fe]',
                )}
                onClick={() => setSelectedMenu(item.key)}
              >
                {/* <span
                  className={clsx(
                    'absolute left-[-4px] top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-sm',
                    'bg-[linear-gradient(180deg,#3FA9F5_0%,#126EE3_100%)]',
                    selectedMenu === item.key ? 'opacity-100' : 'opacity-0',
                  )}
                /> */}
                {item.iconSymbol && <IconFont type={item.iconSymbol} />}
                <span className="flex-1 truncate font-normal text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0 min-h-0 overflow-auto rounded-md bg-[--dip-white]">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default memo(DigitalHumanSetting)
