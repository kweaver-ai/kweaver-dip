import type { MenuProps } from 'antd'
import { Avatar, Button, Card, Dropdown } from 'antd'
import classNames from 'classnames'
import type React from 'react'
import { useState } from 'react'
import type { ApplicationInfo } from '@/apis'
import { formatTimeSlash } from '@/utils/handle-function/FormatTime'
import AppIcon from '../AppIcon'
import IconFont from '../IconFont'
import { ModeEnum } from './types'
import { cardHeight } from './utils'

interface AppCardProps {
  app: ApplicationInfo
  mode: ModeEnum.MyApp | ModeEnum.AppStore
  width: number
  menuItems?: MenuProps['items']
  /** 卡片菜单点击回调 */
  onCardClick?: (app: ApplicationInfo) => void
  /** 卡片菜单右上角按钮点击回调 */
  onMenuButtonClick?: (app: ApplicationInfo) => void
  /** 更多操作按钮 */
  moreBtn?: React.ReactNode
}

const AppCard: React.FC<AppCardProps> = ({
  app,
  mode,
  width,
  menuItems,
  moreBtn,
  onCardClick,
  onMenuButtonClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const updateTime = app.updated_at ? formatTimeSlash(new Date(app.updated_at).getTime()) : ''
  const userName = app.updated_by || ''

  return (
    <Card
      className="group rounded-[10px] transition-all w-full"
      styles={{
        root: {
          height: cardHeight,
          boxShadow: '0px 2px 8px 0px hsla(0,0%,0%,0.1)',
        },
        body: {
          height: '100%',
          padding: '16px 16px 12px 16px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      onClick={() => {
        onCardClick?.(app)
      }}
    >
      <div className="flex gap-4 mb-2 flex-shrink-0">
        {/* 应用图标 */}
        <div className="w-16 h-16 flex-shrink-0 flex overflow-hidden">
          <AppIcon
            icon={app.icon}
            name={app.name}
            size={64}
            className="w-full h-full"
            hasBorder
            isBuiltIn={app.isBuiltIn}
          />
        </div>
        {/* 名称 + 版本号 + 描述 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium mr-px truncate text-black" title={app.name}>
                {app.name}
              </div>
              {mode === ModeEnum.MyApp && (
                <Button
                  color="default"
                  variant="filled"
                  className="px-3 bg-[#F9FAFC] text-[--dip-text-color-65] hover:!bg-[--dip-primary-color] hover:!text-[--dip-white]"
                  onClick={() => {
                    onMenuButtonClick?.(app)
                  }}
                >
                  <span className="text-xs">立即使用</span>
                  <IconFont type="icon-dip-arrow-up" rotate={90} className="text-xs" />
                </Button>
              )}
            </div>
            {mode === ModeEnum.AppStore && (
              <div className="w-fit rounded text-xs px-2 py-0.5 border border-[var(--dip-border-color-base)]">
                {app.version}
              </div>
            )}
            <p
              className="text-xs line-clamp-2 text-[--dip-text-color] leading-5"
              title={app.description}
            >
              {app.description || '[暂无描述]'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-end flex-1 h-0">
        <div className="mb-2 h-px bg-[var(--dip-line-color)]" />
        <div className="flex items-center justify-between">
          {/* 更新信息 */}
          <div className="flex items-center text-xs text-[var(--dip-text-color-45)]">
            <Avatar size={24} className="flex-shrink-0 mr-2">
              {userName.charAt(0)}
            </Avatar>
            <span
              className="truncate mr-4"
              style={{ maxWidth: `${Math.floor(width * 0.22)}px` }}
              title={userName}
            >
              {userName}
            </span>
            <span>更新：{updateTime}</span>
          </div>
          {/* 更多操作 */}
          {menuItems && menuItems.length > 0 && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement="bottomRight"
              onOpenChange={(open) => {
                setMenuOpen(open)
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className={classNames(
                  'w-6 h-6 flex items-center justify-center rounded text-[var(--dip-text-color-45)] hover:text-[var(--dip-text-color-85)] hover:bg-[--dip-hover-bg-color] transition-opacity',
                  menuOpen
                    ? 'opacity-100 visible'
                    : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                )}
              >
                <IconFont type="icon-dip-gengduo" />
              </button>
            </Dropdown>
          )}
          {moreBtn && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
              }}
              className={classNames(
                'w-6 h-6 flex items-center justify-center rounded text-[var(--dip-text-color-45)] hover:text-[var(--dip-text-color-85)] hover:bg-[--dip-hover-bg-color] transition-opacity',
              )}
            >
              {moreBtn}
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default AppCard
