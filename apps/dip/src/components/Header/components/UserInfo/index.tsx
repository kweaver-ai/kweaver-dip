import { DownOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import AvatarIcon from '@/assets/images/sider/avatar.svg?react'
import { useUserInfoStore } from '@/stores'

/**
 * 用户信息组件
 */
export const UserInfo = () => {
  const { userInfo, logout } = useUserInfoStore()

  const handleLogout = () => {
    logout()
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <div className="flex items-center gap-x-2 cursor-pointer h-full">
        <AvatarIcon className="w-6 h-6 shrink-0" />
        <span
          className="text-sm font-normal text-black max-w-28 truncate"
          title={userInfo?.vision_name}
        >
          {userInfo?.vision_name}
        </span>
        <DownOutlined className="text-[10px]" />
      </div>
    </Dropdown>
  )
}
