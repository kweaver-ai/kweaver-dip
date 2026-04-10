import { type MenuProps, Popover } from 'antd'
import type { ApplicationInfo } from '@/apis'
import PinIcon from '@/assets/icons/icon_pin.svg?react'
import { usePreferenceStore } from '@/stores'
import { MyAppActionEnum } from './types'

/** 我的应用操作菜单项 */
export const getMyAppMenuItems = (
  app: ApplicationInfo,
  onMenuClick: (key: MyAppActionEnum) => void,
): MenuProps['items'] => {
  const { isPinned } = usePreferenceStore.getState()
  const pinned = isPinned(app.key)

  if (pinned) {
    return [
      {
        key: 'unfix',
        label: '取消固定',
        icon: <PinIcon className="text-[var(--dip-warning-color)] w-4 h-4" />,
        onClick: () => onMenuClick(MyAppActionEnum.Unfix),
      },
    ]
  }
  return [
    {
      key: 'fix',
      icon: <PinIcon className="w-4 h-4" />,
      label: '固定',
      onClick: () => onMenuClick(MyAppActionEnum.Fix),
    },
  ]
}

export const getMyAppMoreBtn = (
  app: ApplicationInfo,
  onMenuClick: (key: MyAppActionEnum) => void,
) => {
  const { isPinned } = usePreferenceStore.getState()
  const pinned = isPinned(app.key)
  if (pinned) {
    return (
      <Popover content="取消固定">
        <PinIcon
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-[--dip-hover-bg-color] text-[var(--dip-warning-color)]"
          onClick={() => onMenuClick(MyAppActionEnum.Unfix)}
        />
      </Popover>
    )
  }
  return (
    <Popover content="固定">
      <PinIcon
        className="w-4 h-4 flex items-center justify-center rounded text-[var(--dip-text-color-45)] hover:bg-[--dip-hover-bg-color]"
        onClick={() => onMenuClick(MyAppActionEnum.Fix)}
      />
    </Popover>
  )
}
