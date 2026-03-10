import { ReloadOutlined } from '@ant-design/icons'
import { Button, message, Spin, Tooltip } from 'antd'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApplicationInfo } from '@/apis'
import AppList from '@/components/AppList'
import { ModeEnum } from '@/components/AppList/types'
import Empty from '@/components/Empty'
import SearchInput from '@/components/SearchInput'
import { useApplicationsService } from '@/hooks/useApplicationsService'
import { WENSHU_APP_KEY } from '@/routes/types'
import { useMicroAppStore, usePreferenceStore } from '@/stores'
import { MyAppActionEnum } from './types'
import { getMyAppMoreBtn } from './utils'

const MyApp = () => {
  const { apps, updateApp, loading, error, searchValue, handleSearch, handleRefresh } =
    useApplicationsService()
  const { togglePin } = usePreferenceStore()
  const { setAppSource } = useMicroAppStore()
  const navigate = useNavigate()
  const [, messageContextHolder] = message.useMessage()
  const [hasLoadedData, setHasLoadedData] = useState(false) // 记录是否已经成功加载过数据（有数据的情况）
  const hasEverHadDataRef = useRef(false) // 使用 ref 追踪是否曾经有过数据，避免循环依赖
  const prevSearchValueRef = useRef('') // 追踪上一次的搜索值，用于判断是否是从搜索状态清空

  // 当数据加载完成且有数据时，标记为已加载过数据；数据清空后重置
  useEffect(() => {
    // 在开始处理前，先保存上一次的搜索值用于判断
    const wasSearching = prevSearchValueRef.current !== ''

    if (!loading) {
      if (apps.length > 0) {
        // 有数据时，设置为 true 并记录
        setHasLoadedData(true)
        hasEverHadDataRef.current = true
      } else if (!searchValue && hasEverHadDataRef.current) {
        // 没有数据且没有搜索值且之前有过数据时，需要判断是否是从搜索状态清空
        // 只有当上一次也没有搜索值（说明不是从搜索状态清空，而是真正的空状态）时，才重置
        if (!wasSearching) {
          // 不是从搜索状态清空，说明是真正的空状态，重置
          setHasLoadedData(false)
          hasEverHadDataRef.current = false
        }
        // 如果是从搜索状态清空（wasSearching === true），保持 hasLoadedData 不变
        // 因为数据会重新加载，如果原来有数据，加载后 apps.length > 0，hasLoadedData 会保持 true
      }
      // 如果有搜索值但 apps.length === 0，保持 hasLoadedData 不变（显示搜索框）
    }

    // 更新上一次的搜索值（在 useEffect 结束时更新，确保下次执行时能正确判断）
    prevSearchValueRef.current = searchValue
  }, [loading, apps.length, searchValue])

  /** 处理卡片菜单操作 */
  const handleMenuClick = useCallback(
    async (action: string, _app: ApplicationInfo) => {
      switch (action) {
        case MyAppActionEnum.Fix: {
          const result = await togglePin(_app.id)
          if (result) {
            updateApp({ ..._app, pinned: true })
          }
          break
        }
        case MyAppActionEnum.Unfix: {
          const result = await togglePin(_app.id)
          if (result) {
            updateApp({ ..._app, pinned: false })
          }
          break
        }
        case MyAppActionEnum.Use:
          setAppSource(_app.id, 'store')
          navigate(`/application/${_app.id}`)
          break
        default:
          break
      }
    },
    [apps, updateApp, togglePin],
  )

  /** 渲染状态内容（loading/error/empty） */
  const renderStateContent = () => {
    if (loading) {
      return <Spin size="large" />
    }

    if (error) {
      return (
        <Empty type="failed" title="加载失败">
          <Button className="mt-1" type="primary" onClick={handleRefresh}>
            重试
          </Button>
        </Empty>
      )
    }

    if (apps.length === 0) {
      if (searchValue) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return (
        <Empty
          title="暂无可用应用"
          subDesc="您当前没有任何应用的访问权限。这可能是因为管理员尚未为您分配权限，或者应用尚未部署。"
        />
      )
    }

    return null
  }

  /** 渲染内容区域 */
  const renderContent = () => {
    const stateContent = renderStateContent()

    if (stateContent) {
      return <div className="absolute inset-0 flex items-center justify-center">{stateContent}</div>
    }

    return (
      <AppList
        mode={ModeEnum.MyApp}
        apps={apps}
        moreBtn={(app) =>
          app.key === WENSHU_APP_KEY
            ? undefined
            : getMyAppMoreBtn(app, (key) => handleMenuClick(key, app))
        }
        onMenuButtonClick={(app) => handleMenuClick(MyAppActionEnum.Use, app)}
      />
    )
  }

  return (
    <div className="h-full p-6 flex flex-col relative overflow-auto">
      {messageContextHolder}
      <div className="flex justify-between mb-4 flex-shrink-0 z-20">
        <div className="flex flex-col gap-y-3">
          <span className="text-2xl font-bold text-[--dip-text-color-75]">探索企业级 AI 应用</span>
          <span className="text-[--dip-text-color-65]">
            查找具备专业能力的应用，帮你解决业务上的复杂问题
          </span>
        </div>
        {(hasLoadedData || searchValue) && (
          <div className="flex items-center gap-x-2">
            <SearchInput onSearch={handleSearch} placeholder="搜索应用" />
            <Tooltip title="刷新">
              <Button type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
          </div>
        )}
      </div>
      {/* 预留占位，避免 loading→列表 切换时产生 CLS */}
      <div className="flex-1 min-h-0 relative flex flex-col">{renderContent()}</div>
    </div>
  )
}

export default memo(MyApp)
