import type { MenuProps } from 'antd'
import IconFont from '@/components/IconFont'
import { SkillManagementActionEnum } from './types'

export const getSkillManagementMenuItems = (
  onMenuClick: (key: SkillManagementActionEnum) => void,
): MenuProps['items'] => {
  return [
    {
      key: SkillManagementActionEnum.Delete,
      icon: <IconFont type="icon-trash" />,
      label: '删除',
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation()
        onMenuClick(SkillManagementActionEnum.Delete)
      },
    },
  ]
}
