import { Drawer, type DrawerProps } from 'antd'
import clsx from 'classnames'
import { useEffect, useState } from 'react'
import type { ApplicationBasicInfo } from '@/apis'
import AgentConfig from './AgentConfig'
import BasicConfig from './BasicConfig'
import OntologyConfig from './OntologyConfig'
import { ConfigMenuType } from './types'
import { menuItems } from './utils'

export interface AppConfigDrawerProps extends Pick<DrawerProps, 'open' | 'onClose'> {
  /** 已有的应用基础信息 */
  appData?: ApplicationBasicInfo | null
}

export const AppConfigDrawer = ({ appData, open, onClose }: AppConfigDrawerProps) => {
  const [selectedMenu, setSelectedMenu] = useState<ConfigMenuType>(ConfigMenuType.BASIC)

  // 当抽屉打开时，重置选中菜单
  useEffect(() => {
    if (open) {
      setSelectedMenu(ConfigMenuType.BASIC)
    }
  }, [open])

  const handleMenuClick = (key: ConfigMenuType) => {
    setSelectedMenu(key)
  }

  return (
    <Drawer
      title={
        <div className="flex items-center gap-1 text-base font-medium text-[--dip-text-color]">
          <span>应用配置</span>
          {appData?.name && (
            <>
              <span className="text-[--dip-text-color-45] font-normal">/</span>
              <span className="text-[--dip-text-color-45]">{appData.name}</span>
            </>
          )}
        </div>
      }
      open={open}
      onClose={onClose}
      closable={{ placement: 'end' }}
      maskClosable
      destroyOnHidden
      styles={{
        wrapper: { width: '60%', minWidth: 640 },
        body: { padding: 0 },
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧菜单栏 */}
          <div className="w-40 pl-2 pr-1.5 py-3 bg-[#F9FAFC] shrink-0">
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={clsx(
                    'h-10 px-3 flex items-center text-start text-sm rounded transition-colors relative text-[--dip-text-color] hover:bg-[--dip-hover-bg-color]',
                    selectedMenu === item.key &&
                      '!text-[--dip-primary-color] bg-[#f1f7fe] hover:bg-[#f1f7fe]',
                  )}
                  onClick={() => handleMenuClick(item.key)}
                >
                  <span
                    className={clsx(
                      'absolute left-[-2px] top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-sm',
                      'bg-[linear-gradient(180deg,#3FA9F5_0%,#126EE3_100%)]',
                      selectedMenu === item.key ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex-1 truncate font-normal text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧配置区域 */}
          <div className="flex-1 py-4">
            {selectedMenu === ConfigMenuType.BASIC && (
              <BasicConfig key={`basic-${appData?.id}`} appId={appData?.id} />
            )}
            {selectedMenu === ConfigMenuType.ONTOLOGY && (
              <OntologyConfig key={`ontology-${appData?.id}`} appId={appData?.id} />
            )}
            {selectedMenu === ConfigMenuType.AGENT && (
              <AgentConfig key={`agent-${appData?.id}`} appId={appData?.id} />
            )}
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default AppConfigDrawer
