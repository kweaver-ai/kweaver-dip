import type { MenuProps } from 'antd'
import type { ApplicationInfo } from '@/apis'
import IconFont from '@/components/IconFont'
import { WENSHU_APP_KEY } from '@/routes/types'
import { AppStoreActionEnum } from './types'

/** 应用商店操作菜单项 */
export const getAppStoreMenuItems = (
  app: ApplicationInfo,
  onMenuClick: (key: AppStoreActionEnum) => void,
): MenuProps['items'] => {
  const isWenshuApp = app.key === WENSHU_APP_KEY
  const items: any = [
    {
      key: AppStoreActionEnum.Config,
      icon: <IconFont type="icon-dip-shezhi" />,
      label: '配置',
      onClick: () => onMenuClick(AppStoreActionEnum.Config),
    },
    {
      key: AppStoreActionEnum.Run,
      icon: <IconFont type="icon-dip-run" />,
      label: '运行',
      onClick: () => onMenuClick(AppStoreActionEnum.Run),
    },
  ]
  if (!isWenshuApp) {
    items.push(
      ...[
        { type: 'divider' },
        {
          key: AppStoreActionEnum.Uninstall,
          icon: <IconFont type="icon-dip-trash" />,
          danger: true,
          label: '卸载',
          onClick: () => onMenuClick(AppStoreActionEnum.Uninstall),
        },
      ],
    )
  }
  return items
}
