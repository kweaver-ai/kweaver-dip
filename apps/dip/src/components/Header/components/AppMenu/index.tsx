import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppIcon from '@/components/AppIcon'
import IconFont from '@/components/IconFont'
import { usePreferenceStore } from '@/stores'
import { useMicroAppStore } from '@/stores/microAppStore'
/**
 * 导航菜单图标按钮组件
 */
export const AppMenu = () => {
  const navigate = useNavigate()
  const { appId } = useParams<{ appId: string }>()
  const idNum = useMemo(() => (appId ? Number(appId) : NaN), [appId])
  const { fetchPinnedMicroApps, loading, pinnedMicroApps, wenshuAppInfo } = usePreferenceStore()
  const { setAppSource } = useMicroAppStore()
  const appSourceMap = useMicroAppStore((state) => state.appSourceMap)
  // 处理点击按钮触发加载
  const handleButtonClick = () => {
    if (loading) return
    fetchPinnedMicroApps()
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const app = [wenshuAppInfo, ...pinnedMicroApps].find((item) => item?.id === Number(key))
    if (app?.id) {
      const type = (!Number.isNaN(idNum) ? appSourceMap[idNum] : null) || 'home'
      setAppSource(app.id, type)
      // 以新标签页形式打开应用
      navigate(`/application/${app.id}`)
    }
  }

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = []
    if (wenshuAppInfo) {
      items.push({
        key: wenshuAppInfo.id,
        icon: <AppIcon icon={wenshuAppInfo.icon} name={wenshuAppInfo.name} size={16} />,
        label: wenshuAppInfo.name,
      })
    }
    if (Array.isArray(pinnedMicroApps)) {
      items.push(
        ...pinnedMicroApps.map((app) => ({
          key: app.id,
          icon: <AppIcon icon={app.icon} name={app.name} size={16} />,
          label: app.name,
        })),
      )
    }
    return items
  }, [pinnedMicroApps, wenshuAppInfo])

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: handleMenuClick,
        style: {
          maxHeight: 'calc(100vh - 80px)',
        },
      }}
      trigger={['click']}
      placement="bottomLeft"
      styles={{
        itemContent: {
          maxWidth: '400px',
        },
      }}
    >
      <div className="flex items-center justify-center cursor-pointer">
        <IconFont
          type="icon-dip-a-quanbu1"
          className="!text-xl hover:!text-[--dip-primary-color]"
          onClick={handleButtonClick}
        />
      </div>
    </Dropdown>
  )
}
