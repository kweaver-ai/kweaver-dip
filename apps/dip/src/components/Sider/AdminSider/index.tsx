import type { MenuProps } from 'antd'
import { Menu, message, Tooltip } from 'antd'
import clsx from 'classnames'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logoImage from '@/assets/images/brand/logo.png'
import { routeConfigs } from '@/routes/routes'
import type { SiderType } from '@/routes/types'
import { getRouteByPath } from '@/routes/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
import IconFont from '../../IconFont'
import { ExternalLinksMenu } from '../components/ExternalLinksMenu'
import { MaskIcon } from '../components/GradientMaskIcon'
import { UserMenuItem } from '../components/UserMenuItem'

interface AdminSiderProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  siderType?: SiderType
}

const AdminSider = ({ collapsed, onCollapse, siderType = 'home' }: AdminSiderProps) => {
  const isHomeSider = siderType === 'home'
  const navigate = useNavigate()
  const location = useLocation()
  const [, messageContextHolder] = message.useMessage()
  const { language } = useLanguageStore()
  const { getOEMResourceConfig } = useOEMConfigStore()
  const oemResourceConfig = getOEMResourceConfig(language)

  const selectedKey = useCallback(() => {
    const pathname = location.pathname
    if (pathname === '/') return 'home'
    const route = getRouteByPath(pathname)
    return route?.key || 'home'
  }, [location.pathname])()

  const menuItems = useMemo<MenuProps['items']>(() => {
    const adminRoute = routeConfigs.find((route) => route.key === 'digital-human-management')
    if (!adminRoute?.key) return []

    return [
      {
        key: adminRoute.key,
        label: adminRoute.label || adminRoute.key,
        icon: adminRoute.iconUrl ? (
          <MaskIcon
            url={adminRoute.iconUrl}
            className="w-4 h-4"
            background={
              selectedKey === adminRoute.key
                ? 'linear-gradient(210deg, #1C4DFA 0%, #3FA9F5 100%)'
                : '#333333'
            }
          />
        ) : null,
        onClick: () => {
          if (adminRoute.path) {
            navigate(`/${adminRoute.path}`)
          }
        },
      },
    ]
  }, [selectedKey, navigate])

  const logoUrl = useMemo(() => {
    const base64Image = oemResourceConfig?.['logo.png']
    if (!base64Image) return logoImage
    if (base64Image.startsWith('data:image/')) return base64Image
    return `data:image/png;base64,${base64Image}`
  }, [oemResourceConfig])

  return (
    <div className="flex flex-col h-full px-0 pt-4 pb-1 overflow-hidden">
      {messageContextHolder}
      {isHomeSider ? (
        <div
          className={clsx(
            'flex items-center gap-2 pb-4',
            collapsed ? 'justify-center pl-1.5 pr-1.5' : 'justify-between pl-3 pr-2',
          )}
        >
          <img src={logoUrl} alt="logo" className={clsx('h-8 w-auto', collapsed && 'hidden')} />
        </div>
      ) : null}

      <div className="flex-1 flex flex-col dip-hideScrollbar">
        <div className="flex-1">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            inlineCollapsed={collapsed}
            selectable
          />
        </div>
        <ExternalLinksMenu collapsed={collapsed} />
      </div>

      {collapsed ? null : (
        <div className="mx-3 my-2 h-px shrink-0 bg-[var(--dip-border-color)]" aria-hidden />
      )}

      {collapsed ? (
        <div className="dip-sider-footer-stack shrink-0">
          <div className="dip-sider-footer-row">
            <Tooltip title="展开" placement="right">
              <span className="flex min-w-0 flex-1">
                <button
                  type="button"
                  className="flex h-10 min-h-10 w-full min-w-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--dip-text-color)]"
                  onClick={() => onCollapse(false)}
                >
                  <IconFont type="icon-dip-cebianlan" className="text-base leading-none" />
                </button>
              </span>
            </Tooltip>
          </div>
          <div className="dip-sider-footer-row">
            <UserMenuItem collapsed={collapsed} />
          </div>
        </div>
      ) : (
        <div className="dip-sider-footer-row dip-sider-footer-row-horizontal shrink-0">
          <div className="min-w-0 flex-1">
            <UserMenuItem collapsed={collapsed} />
          </div>
          <Tooltip title="收起" placement="right">
            <button
              type="button"
              className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[var(--dip-text-color)] hover:text-[var(--dip-primary-color)]"
              onClick={() => onCollapse(true)}
            >
              <IconFont type="icon-dip-cebianlan" className="text-base leading-none" />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

export default AdminSider
