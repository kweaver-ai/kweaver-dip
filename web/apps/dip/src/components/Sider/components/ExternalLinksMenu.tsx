import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { useMemo } from 'react'
import SidebarSystemIcon from '@/assets/images/sider/proton.svg?react'
import { BUSINESS_NETWORK_BASE_PATH } from '@/components/Sider/BusinessSider/menus'
import { getFullPath } from '@/utils/config'
import { getAccessToken, getRefreshToken } from '@/utils/http/token-config'
import IconFont from '../../IconFont'

export interface ExternalLinksMenuProps {
  /** 是否折叠侧栏 */
  collapsed: boolean
  /** 可见路由角色（与主菜单一致） */
  roleIds?: Set<string>
}

/**
 * 侧栏底部外链：业务知识网络 SSO、系统工作台
 */
export const ExternalLinksSection = ({ collapsed, roleIds }: ExternalLinksMenuProps) => {
  const items = useMemo<MenuProps['items']>(() => {
    const baseOrigin = window.location.origin
    const getExternalUrl = (path: string) => `${baseOrigin}${path}`

    const redirectUrl = '/studio/home'
    const token = getAccessToken()
    const refreshToken = getRefreshToken()
    const ssoSearchParams = new URLSearchParams({
      redirect_url: redirectUrl,
      product: 'adp',
    })
    if (token) {
      if (process.env.NODE_ENV === 'development') {
        // TODO: 测试使用
        ssoSearchParams.set(
          'token',
          'ory_at_1Ol1cd_wZVPwYNCr50AiR9dctvUvM1_mI2C-f481n6Y.uikVUF3c1Rf5KFBivT8JbYDE6VDFLplv_1KRiihWqWU',
        )
        ssoSearchParams.set(
          'refreshToken',
          'ory_rt_b1VBSySehSNQro5ZPZPTxScOEYVkNwaVpzTVk0tgCZI.8lJkppPN97yZSGWTlZOSxqz3fpoTg0dKTR8MwCWr5Uo',
        )
      } else {
        ssoSearchParams.set('token', token)
        ssoSearchParams.set('refreshToken', refreshToken)
      }
    }
    const businessNetworkHref = getFullPath(BUSINESS_NETWORK_BASE_PATH)

    return [
      {
        key: 'data-platform',
        title: '全局业务知识网络',
        label: (
          <a
            href={businessNetworkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 justify-between"
          >
            <span>全局业务知识网络</span>
            <IconFont type="icon-arrowup" rotate={45} />
          </a>
        ),
        icon: <IconFont type="icon-graph" />,
      },
      {
        key: 'system',
        title: '系统工作台',
        label: (
          <a
            href={getExternalUrl('/deploy')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 justify-between"
          >
            <span>系统工作台</span>
            <IconFont type="icon-arrowup" rotate={45} />
          </a>
        ),
        icon: <SidebarSystemIcon />,
      },
    ]
  }, [roleIds])

  return (
    <div className="shrink-0">
      <Menu
        mode="inline"
        selectedKeys={[]}
        items={items}
        inlineCollapsed={collapsed}
        selectable={false}
      />
    </div>
  )
}

export const ExternalLinksMenu = ExternalLinksSection
