import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { useMemo } from 'react'
import SidebarAiStoreIcon from '@/assets/images/sider/aiStore.svg?react'
import SidebarSystemIcon from '@/assets/images/sider/proton.svg?react'
import { getFirstVisibleRouteBySiderType } from '@/routes/utils'
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
 * 侧栏底部外链：AI Store、业务知识网络 SSO、系统工作台
 */
export const ExternalLinksMenu = ({ collapsed, roleIds }: ExternalLinksMenuProps) => {
  const items = useMemo<MenuProps['items']>(() => {
    const firstStoreRoute = getFirstVisibleRouteBySiderType('store', roleIds || new Set())
    const baseOrigin = window.location.origin
    const getExternalUrl = (path: string) => `${baseOrigin}${path}`

    const storePath = `/${firstStoreRoute?.path || 'store/my-app'}`
    const storeHref = getFullPath(storePath)

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
    const ssoUrl = `${baseOrigin}/interface/studioweb/internalSSO?${ssoSearchParams.toString()}`

    return [
      {
        key: 'ai-store',
        title: 'AI Store',
        label: (
          <a
            href={storeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 justify-between"
          >
            <span>AI Store</span> <span>&gt;</span>
          </a>
        ),
        icon: <SidebarAiStoreIcon />,
      },
      {
        key: 'data-platform',
        title: '业务知识网络',
        label: (
          <a
            href={ssoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 justify-between"
          >
            <span>业务知识网络</span> <span>&gt;</span>
          </a>
        ),
        icon: <IconFont type="icon-yewuzhishiwangluo" />,
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
            <span>系统工作台</span> <span>&gt;</span>
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
