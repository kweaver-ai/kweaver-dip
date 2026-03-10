import { Col, type MenuProps, Row, Tabs } from 'antd'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import type { ApplicationInfo } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'
import AppCard from './AppCard'
import styles from './index.module.less'
import { ALL_TAB_KEY, type ModeEnum } from './types'
import { computeColumnCount, gap } from './utils'

interface AppListProps {
  /** 组件模式：我的应用 或 应用商店 */
  mode: ModeEnum.MyApp | ModeEnum.AppStore
  /** 应用列表数据 */
  apps: ApplicationInfo[]
  /** 卡片菜单项生成函数 */
  menuItems?: (app: ApplicationInfo) => MenuProps['items']
  /** 更多操作按钮 */
  moreBtn?: (app: ApplicationInfo) => React.ReactNode
  /** 卡片菜单右上角按钮点击回调 */
  onMenuButtonClick?: (app: ApplicationInfo) => void
  /** 卡片菜单点击回调 */
  onCardClick?: (app: ApplicationInfo) => void
}

/**
 * AppList 组件
 */
const AppList: React.FC<AppListProps> = ({
  mode,
  apps,
  menuItems,
  onMenuButtonClick,
  onCardClick,
  moreBtn,
}) => {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB_KEY)

  // 根据后端返回的 category 动态分组
  const { groupedApps, appTypes } = useMemo(() => {
    const groups: Record<string, ApplicationInfo[]> = {
      [ALL_TAB_KEY]: apps,
    }
    const typeSet = new Set<string>()

    apps.forEach((app) => {
      const appType = app.category
      if (appType) {
        typeSet.add(appType)
        if (!groups[appType]) {
          groups[appType] = []
        }
        groups[appType].push(app)
      }
    })

    return {
      groupedApps: groups,
      appTypes: Array.from(typeSet),
    }
  }, [apps])

  // 当 appTypes 变化时，如果当前 activeTab 不在列表中，重置为全部
  useEffect(() => {
    if (activeTab !== ALL_TAB_KEY && !appTypes.includes(activeTab)) {
      setActiveTab(ALL_TAB_KEY)
    }
  }, [appTypes, activeTab])

  // 当前 Tab 下的应用列表
  const currentApps = useMemo(() => {
    return groupedApps[activeTab] || []
  }, [groupedApps, activeTab])

  // 动态生成 Tab 配置
  const tabItems = useMemo(() => {
    const items = [
      {
        key: ALL_TAB_KEY,
        label: '全部',
      },
    ]

    appTypes.forEach((type) => {
      items.push({
        key: type,
        label: type,
      })
    })

    return items
  }, [appTypes])

  /** 渲染应用卡片 */
  const renderCard = useCallback(
    (app: ApplicationInfo, width: number) => {
      return (
        <Col key={app.id} style={{ width, minWidth: width }}>
          <AppCard
            app={app}
            mode={mode}
            width={width}
            menuItems={menuItems?.(app)}
            onMenuButtonClick={onMenuButtonClick}
            onCardClick={onCardClick}
            moreBtn={moreBtn?.(app)}
          />
        </Col>
      )
    },
    [mode, menuItems, onMenuButtonClick, onCardClick],
  )

  return (
    <div className="flex flex-col h-0 flex-1">
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={setActiveTab}
        className={`flex-shrink-0 mr-3 ${styles.tabs}`}
        size="small"
        // tabBarExtraContent={
        //   mode === ModeEnum.AppStore
        //     ? {
        //         right: (
        //           <span className="text-sm text-[--dip-text-color-65]">
        //             已安装（{apps.length}）
        //           </span>
        //         ),
        //       }
        //     : undefined
        // }
      />
      <ScrollBarContainer className="p-2 pt-0 ml-[-8px] ml-[-8px] mr-[-24px]">
        <AutoSizer style={{ width: 'calc(100% - 8px)' }} disableHeight>
          {({ width }) => {
            const count = computeColumnCount(width)
            const calculatedCardWidth = width / count

            return (
              <Row gutter={[gap, gap]}>
                {currentApps.map((app) => renderCard(app, calculatedCardWidth))}
              </Row>
            )
          }}
        </AutoSizer>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(AppList)
