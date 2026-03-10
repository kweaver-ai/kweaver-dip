import type { MenuProps } from 'antd'
import { Dropdown, Menu } from 'antd'
import AvatarIcon from '@/assets/images/sider/avatar.svg?react'
import { useUserInfoStore } from '@/stores'

export interface UserMenuItemProps {
  /** 是否折叠 */
  collapsed: boolean
}

export const UserMenuItem = ({ collapsed }: UserMenuItemProps) => {
  const { userInfo, logout } = useUserInfoStore()
  const handleLogout = () => {
    logout()
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: '退出登录',
      title: '',
      onClick: handleLogout,
    },
  ]

  const content = (
    // <div
    //   className={clsx(
    //     'w-full flex items-center h-10 rounded   cursor-pointer hover:bg-[--dip-hover-bg-color]',
    //     collapsed ? 'justify-center px-0' : 'gap-2 px-2.5',
    //   )}
    // >
    //   <AvatarIcon className="w-4 h-4 shrink-0" />
    //   {!collapsed && (
    //     <span
    //       className="w-full text-sm font-normal text-[#000] truncate"
    //       title={userInfo?.vision_name}
    //     >
    //       {userInfo?.vision_name || '用户'}
    //     </span>
    //   )}
    // </div>
    <div>
      <Menu
        mode="inline"
        selectedKeys={[]}
        items={[
          { type: 'divider' },
          {
            key: 'user-menu',
            icon: <AvatarIcon className="w-4 h-4 shrink-0" />,
            label: userInfo?.vision_name || '用户',
            title: userInfo?.vision_name || '用户',
            onClick: () => {},
          },
        ]}
        inlineCollapsed={collapsed}
        selectable={false}
      />
    </div>
  )

  return (
    <div className="w-full">
      <Dropdown
        menu={{
          items: menuItems,
          inlineCollapsed: false,
        }}
        placement="topLeft"
        trigger={['click']}
      >
        {content}
      </Dropdown>
    </div>
  )
}
