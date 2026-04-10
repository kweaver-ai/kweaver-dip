import { message } from 'antd'
import clsx from 'classnames'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SiderType } from '@/routes/types'
import { getRouteByPath } from '@/routes/utils'
import { useLanguageStore } from '@/stores/languageStore'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { ExternalLinksSection } from '../components/ExternalLinksMenu'
import { SiderFooterUser } from '../components/SiderFooterUser'
import { StoreMenuSection } from '../components/StoreMenuSection'
import { StudioMenuSection } from '../components/StudioMenuSection'

interface AdminSiderProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  layout?: SiderType
}
const AdminSider = ({ collapsed, onCollapse, layout = 'entry' }: AdminSiderProps) => {
  const isHomeSider = layout === 'entry'
  const navigate = useNavigate()
  const location = useLocation()
  const [, messageContextHolder] = message.useMessage()
  const { language } = useLanguageStore()
  const { getOEMResourceConfig } = useOEMConfigStore()
  const oemResourceConfig = getOEMResourceConfig(language)
  const modules = useUserInfoStore((s) => s.modules)
  const hasStudio = modules.includes('studio')
  const hasStore = modules.includes('store')

  const selectedKey = useCallback(() => {
    const pathname = location.pathname
    if (pathname === '/') return 'home'
    const route = getRouteByPath(pathname)
    return route?.key || 'home'
  }, [location.pathname])()

  const logoUrl = useMemo(() => {
    return oemResourceConfig?.['logo.png']
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

      {/* 菜单内容 */}
      <div className="flex-1 flex flex-col dip-hideScrollbar">
        {hasStudio ? (
          <div className="flex-1">
            <StudioMenuSection
              collapsed={collapsed}
              selectedKey={selectedKey}
              roleIds={new Set<string>([])}
              navigate={navigate}
              allowedKeys={['digital-human', 'skills']}
            />
          </div>
        ) : null}
        {hasStore ? (
          <div
            className={clsx(hasStudio ? 'mt-auto shrink-0' : 'flex-1 flex flex-col justify-start')}
          >
            <StoreMenuSection
              collapsed={collapsed}
              selectedKey={selectedKey}
              roleIds={new Set<string>([])}
              navigate={navigate}
            />
          </div>
        ) : null}
        <ExternalLinksSection collapsed={collapsed} roleIds={new Set<string>([])} />
      </div>

      {collapsed ? null : (
        <div className="mx-3 my-2 h-px shrink-0 bg-[var(--dip-border-color)]" aria-hidden />
      )}

      <SiderFooterUser collapsed={collapsed} onCollapse={onCollapse} />
    </div>
  )
}

export default AdminSider
