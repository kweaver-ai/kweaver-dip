import type { MenuProps } from 'antd'

export type SiderMenuItemType = 'route' | 'pinned' | 'external'

export interface SiderMenuItemData {
  key: string
  label: string
  icon?: React.ReactNode
  iconUrl?: string
  disabled?: boolean
  onContextMenu?: MenuProps['items']
  onClick?: () => void
  type?: SiderMenuItemType
}
