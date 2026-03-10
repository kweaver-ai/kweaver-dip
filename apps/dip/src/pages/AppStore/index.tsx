import { ExclamationCircleFilled, ReloadOutlined } from '@ant-design/icons'
import { Button, Modal, message, Spin, Tooltip } from 'antd'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ApplicationInfo, deleteApplications } from '@/apis'
import AppConfigDrawer from '@/components/AppConfigDrawer'
import AppList from '@/components/AppList'
import { ModeEnum } from '@/components/AppList/types'
import AppUploadModal from '@/components/AppUploadModal'
import Empty from '@/components/Empty'
import IconFont from '@/components/IconFont'
import SearchInput from '@/components/SearchInput'
import { useApplicationsService } from '@/hooks/useApplicationsService'
import { useMicroAppStore, usePreferenceStore } from '@/stores'
import styles from './index.module.less'
import { AppStoreActionEnum } from './types'
import { getAppStoreMenuItems } from './utils'

const AppStore = () => {
  const { apps, loading, error, searchValue, handleSearch, handleRefresh } =
    useApplicationsService()
  const { unpinMicroApp } = usePreferenceStore()
  const { setAppSource } = useMicroAppStore()
  const navigate = useNavigate()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [installModalVisible, setInstallModalVisible] = useState(false)
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [selectedApp, setSelectedApp] = useState<ApplicationInfo | null>(null)
  const [hasLoadedData, setHasLoadedData] = useState(false) // 记录是否已经成功加载过数据（有数据的情况）
  const hasEverHadDataRef = useRef(false) // 使用 ref 追踪是否曾经有过数据，避免循环依赖
  const prevSearchValueRef = useRef('') // 追踪上一次的搜索值，用于判断是否是从搜索状态清空
  const [modal, contextHolder] = Modal.useModal()
  // 当数据加载完成且有数据时，标记为已加载过数据；所有应用卸载后重置
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
          // 不是从搜索状态清空，说明是真正的空状态（所有应用被卸载），重置
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
      try {
        switch (action) {
          /** 卸载应用 */
          case AppStoreActionEnum.Uninstall:
            modal.confirm({
              title: '确认卸载',
              icon: <ExclamationCircleFilled />,
              content: '卸载应用后，相关配置和数据将被清除，用户将无法使用应用。是否继续?',
              okText: '确定',
              okType: 'primary',
              okButtonProps: { danger: true },
              cancelText: '取消',
              footer: (_, { OkBtn, CancelBtn }) => (
                <>
                  <OkBtn />
                  <CancelBtn />
                </>
              ),
              onOk: async () => {
                try {
                  await deleteApplications(_app.id)
                  messageApi.success('卸载成功')
                  handleRefresh()
                  unpinMicroApp(_app.id, false)
                } catch (err: any) {
                  if (err?.description) {
                    messageApi.error(err.description)
                    return
                  }
                }
              },
            })
            break

          /** 配置应用 */
          case AppStoreActionEnum.Config:
            setSelectedApp(_app)
            setConfigModalVisible(true)
            break

          /** 运行应用 */
          case AppStoreActionEnum.Run:
            setAppSource(_app.id, 'store')
            navigate(`/application/${_app.id}`)
            break

          /** 授权管理 */
          case AppStoreActionEnum.Auth:
            // TODO: 跳转授权管理
            break

          default:
            break
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Failed to handle app action:', err)
        }
      }
    },
    [handleRefresh],
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
          title="暂无应用"
          subDesc="当前应用市场空空如也，您可以点击下方按钮安装第一个企业应用。"
        >
          <Button
            className="mt-1"
            type="primary"
            icon={<IconFont type="icon-dip-upload" />}
            onClick={() => {
              setInstallModalVisible(true)
            }}
          >
            安装应用
          </Button>
        </Empty>
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
        mode={ModeEnum.AppStore}
        apps={apps}
        menuItems={(app) => getAppStoreMenuItems(app, (key) => handleMenuClick(key, app))}
      />
    )
  }

  return (
    <div className="h-full p-6 flex flex-col relative">
      {contextHolder}
      {messageContextHolder}
      <div className="flex justify-between mb-6 flex-shrink-0 z-20">
        <div className="flex flex-col gap-y-3">
          <span className="text-base font-bold text-[--dip-text-color]">应用商店</span>
          <span className="text-sm text-[--dip-text-color-65]">
            管理企业应用市场，安装或卸载应用
          </span>
        </div>
        {(hasLoadedData || searchValue) && (
          <div className="flex items-center gap-x-2">
            <SearchInput onSearch={handleSearch} placeholder="搜索应用" />
            <Tooltip title="刷新">
              <Button type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
            <Button
              type="primary"
              icon={<IconFont type="icon-dip-upload" />}
              onClick={() => setInstallModalVisible(true)}
            >
              安装应用
            </Button>
          </div>
        )}
      </div>
      {/* 预留占位，避免 loading→列表 切换时产生 CLS */}
      <div className="flex-1 min-h-0 relative flex flex-col">{renderContent()}</div>
      <AppConfigDrawer
        appData={selectedApp ?? undefined}
        open={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
      />
      <AppUploadModal
        open={installModalVisible}
        onCancel={() => setInstallModalVisible(false)}
        onSuccess={(appInfo) => {
          setInstallModalVisible(false)
          handleRefresh()
          // 显示成功提示
          const key = `upload-success-${Date.now()}`
          messageApi.success({
            key,
            className: styles.uploadSuccessMessage,
            content: (
              <div className="flex items-center gap-2">
                <span>
                  应用"
                  <span className="inline-block max-w-md truncate align-bottom">
                    {appInfo.name}
                  </span>
                  "上传成功，请完成配置以启用服务。
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedApp(appInfo)
                      setConfigModalVisible(true)
                      messageApi.destroy(key)
                    }}
                    className="text-[--dip-primary-color]"
                  >
                    去配置
                  </button>
                </span>
              </div>
            ),
          })
        }}
      />
    </div>
  )
}

export default memo(AppStore)
