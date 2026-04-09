import type { MenuProps } from 'antd'
import { Menu, Tooltip } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import IconFont from '../../IconFont'
import { UserMenuItem } from '../components/UserMenuItem'
import styles from './index.module.less'
import {
  type BusinessMenuItem,
  businessLeafMenuItems,
  businessMenuItems,
  defaultBusinessMenuItem,
  getBusinessAncestorKeysByPath,
} from './menus'

interface BusinessSiderProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

const BusinessSider = ({ collapsed, onCollapse }: BusinessSiderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const renderMenuIcon = (iconType?: string) =>
    iconType ? (
      <span className="inline-flex h-4 w-4 items-center justify-center">
        <IconFont type={iconType} />
      </span>
    ) : undefined

  const selectedKey = useMemo(() => {
    const matched = businessLeafMenuItems.find((item) => location.pathname.startsWith(item.path))
    return matched?.key ?? defaultBusinessMenuItem.key
  }, [location.pathname])
  const routeAncestorKeys = useMemo(
    () => getBusinessAncestorKeysByPath(location.pathname),
    [location.pathname],
  )
  const [openKeys, setOpenKeys] = useState<string[]>(routeAncestorKeys)

  useEffect(() => {
    // 首次进入或路由切换时，确保当前路由对应的父级菜单自动展开
    setOpenKeys((prev) => Array.from(new Set([...prev, ...routeAncestorKeys])))
  }, [routeAncestorKeys])

  const menuItems = useMemo<MenuProps['items']>(() => {
    const toAntMenuItem = (item: BusinessMenuItem): NonNullable<MenuProps['items']>[number] => {
      if ('children' in item) {
        return {
          key: item.key,
          label: item.label,
          icon: renderMenuIcon(item.icon),
          children: item.children.map(toAntMenuItem),
        }
      }
      return {
        key: item.key,
        label: item.label,
        icon: renderMenuIcon(item.icon),
        onClick: () => navigate(item.path),
      }
    }

    return businessMenuItems.map(toAntMenuItem)
  }, [navigate])

  return (
    <div className="flex flex-col h-full px-0 pt-4 pb-1 overflow-hidden">
      <div className="flex-1 flex flex-col dip-hideScrollbar">
        <div className="flex-1">
          <Menu
            className={styles.menu}
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            openKeys={openKeys}
            onOpenChange={(keys) => setOpenKeys(keys as string[])}
            inlineCollapsed={collapsed}
            selectable
          />
        </div>
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
                  <IconFont type="icon-sidebar" className="text-base leading-none" />
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
              <IconFont type="icon-sidebar" className="text-base leading-none" />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

export default BusinessSider
