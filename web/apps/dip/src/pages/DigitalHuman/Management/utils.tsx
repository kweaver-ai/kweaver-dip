import type { MenuProps } from 'antd'
import intl from 'react-intl-universal'
import IconFont from '@/components/IconFont'
import { DigitalHumanManagementActionEnum } from './types'

/** 应用商店操作菜单项 */
export const getDigitalHumanManagementMenuItems = (
  onMenuClick: (key: DigitalHumanManagementActionEnum) => void,
): MenuProps['items'] => {
  return [
    {
      key: DigitalHumanManagementActionEnum.Edit,
      icon: <IconFont type="icon-edit" />,
      label: intl.get('digitalHuman.management.menuEdit'),
      onClick: (e) => {
        e.domEvent.stopPropagation()
        onMenuClick(DigitalHumanManagementActionEnum.Edit)
      },
    },
    {
      key: DigitalHumanManagementActionEnum.Delete,
      icon: <IconFont type="icon-trash" />,
      label: intl.get('digitalHuman.management.menuDelete'),
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation()
        onMenuClick(DigitalHumanManagementActionEnum.Delete)
      },
    },
  ]
}
