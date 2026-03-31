/* eslint-disable consistent-return */
import React, { useRef, useEffect, useMemo, useState } from 'react'
import { Layout, Badge, Tooltip } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import classnames from 'classnames'
import { useMicroAppProps } from '@/context/MicroAppPropsProvider'
import { isRuntimeMicroApp } from '@/utils/runtimeConfig'
import UserInfoCard from '@/components/UserInfoCard'
import { IconType } from '@/icons/const'
import { ApplyListOutlined, FontIcon } from '@/icons'
import actionType from '@/redux/actionType'
import __ from '@/components/AssetCenterHeader/locale'
import { LoginPlatform, allRoleList } from '@/core'
import { getPlatformNumber } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useCongSearchContext } from '@/components/CognitiveSearch/CogSearchProvider'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import CityShareCard from '@/components/AssetCenterHeader/CityShareCard'
import MyTaskDrawer from '@/components/AssetCenterHeader/MyTaskDrawer'
import {
    flatRoute,
    findFirstPathByModule,
    findFirstPathByKeys,
    getRootMenuByPath,
    getRouteByKeys,
    useMenus,
    hasDataAssetsMenus,
    hasMyTaskMenus,
} from '@/hooks/useMenus'
import styles from './styles.module.less'
import { homeRouteKeys } from '@/routers/config'

const { Header: AntdHeader } = Layout

export interface MicroAppHeaderProps {
    /** 是否从 SearchDataCopilot 进入 */
    isFromSearchCopilot?: boolean
    /** 从 SearchDataCopilot 进入时，点击服务超市的回调 */
    onServiceMarketClick?: () => void
}

/**
 * 微应用Header组件
 * 在微应用环境下,使用主应用提供的 renderAppMenu 渲染应用菜单
 * 同时集成 AssetCenterHeader 的布局内容
 */
const MicroAppHeader: React.FC<MicroAppHeaderProps> = ({
    isFromSearchCopilot = false,
    onServiceMarketClick,
}) => {
    const { microAppProps } = useMicroAppProps()
    const { checkPermission } = useUserPermCtx()
    const [{ using }] = useGeneralConfig()
    const [isOnlySystemMgm, setIsOnlySystemMgm] = useState<boolean>(true)
    const [activeMenuKey, setActiveMenuKey] = useState<string>('data-market')
    const [dataDownloadOpen, setDataDownloadOpen] = useState<boolean>(false)

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const appMenuContainerRef = useRef<HTMLDivElement>(null)
    const { pathname } = useLocation()

    // 判断是否为微应用模式
    const isMicroApp = useMemo(() => {
        return isRuntimeMicroApp()
    }, [])

    // 主应用提供的渲染函数
    const { renderAppMenu } = microAppProps || {}

    const citySharingData = useSelector(
        (state: any) => state?.citySharingReducer,
    )
    const assetsData = useSelector((state: any) => state?.dataAssetsReducer)

    const [menus] = useMenus()
    const platform = getPlatformNumber()

    // 菜单配置
    const menuConfig = useMemo(() => {
        const config = [
            {
                key: 'data-market',
                label: __('数据服务超市'),
            },
            {
                key: 'asset-overview',
                label: __('资产全景'),
            },
            {
                key: 'work-center',
                label: __('数据运营管理'),
            },
            {
                key: 'config-center',
                label: __('应用配置'),
            },
        ]

        // 如果是从 SearchDataCopilot 进入，添加"找数助手"菜单项
        if (isFromSearchCopilot) {
            config.unshift({
                key: 'search-copilot',
                label: __('找数助手'),
            })
        }

        // 根据模块下是否有有效路径来过滤显示（找数助手菜单项不需要过滤）
        return config.filter((item) => {
            if (item.key === 'search-copilot') {
                return true
            }
            const firstPath = findFirstPathByModule(item.key, menus)
            return !!firstPath
        })
    }, [menus, isFromSearchCopilot])

    // 是否有服务超市菜单
    const hasServiceMarket = hasDataAssetsMenus(menus)

    // 是否有我的任务(菜单不为空时显示)
    const shouldShowTask = false
    // const shouldShowTask = hasMyTaskMenus(menus)

    // 是否有需求申请权限
    const hasDemandApplyPerm = useMemo(() => {
        if (platform === LoginPlatform.default) {
            return checkPermission('demandAnalysisAndImplement')
        }
        return false
    }, [checkPermission, platform])

    // 是否显示申请列表
    const showApplyList = true

    useEffect(() => {
        getRoleHasAccess()
        updateActiveMenu()
    }, [checkPermission, pathname])

    // 如果是从 SearchDataCopilot 进入，设置找数助手为激活状态
    useEffect(() => {
        if (isFromSearchCopilot) {
            setActiveMenuKey('search-copilot')
        }
    }, [isFromSearchCopilot])

    const getRoleHasAccess = () => {
        const systemMgm =
            checkPermission(allRoleList.TCSystemMgm, 'only') ?? false
        setIsOnlySystemMgm(systemMgm)
    }

    const updateActiveMenu = () => {
        // 如果是从 SearchDataCopilot 进入，不根据 pathname 更新激活菜单
        // 激活菜单由 useEffect 中的逻辑控制
        if (isFromSearchCopilot) {
            return
        }

        // 获取菜单所属 module
        const rootMenu = getRootMenuByPath(pathname, menus)
        let menuKey = rootMenu?.module?.[0]

        // 如果没有 module,尝试多种方式获取 menuKey
        if (!menuKey) {
            if (rootMenu?.key) {
                menuKey = rootMenu.key
            } else {
                const pathArr = pathname.split('/').filter(Boolean)
                const firstPath = pathArr[0]
                const menuKeys = [
                    'data-market',
                    'asset-overview',
                    'work-center',
                    'config-center',
                ]
                if (menuKeys.includes(firstPath)) {
                    menuKey = firstPath
                } else {
                    menuKey = 'data-market'
                }
            }
        }

        setActiveMenuKey(menuKey)
    }

    // 处理菜单点击
    const handleMenuClick = (key: string) => {
        setActiveMenuKey(key)
        if (
            [
                'data-market',
                'asset-overview',
                'work-center',
                'config-center',
            ].includes(key)
        ) {
            const firstUrl = findFirstPathByModule(key, menus)
            navigate(firstUrl)
        } else {
            const firstUrl = findFirstPathByKeys([key], menus)
            navigate(firstUrl)
        }
    }

    useEffect(() => {
        // 只在微应用模式下渲染主应用的组件
        if (!isMicroApp) {
            return
        }

        // 渲染主应用的应用菜单组件
        if (appMenuContainerRef.current && renderAppMenu) {
            try {
                renderAppMenu(appMenuContainerRef.current)
            } catch (error) {
                // console.error('[MicroAppHeader] 渲染应用菜单失败:', error)
            }
        }

        // 清理函数
        return () => {
            // 清空容器内容
            if (appMenuContainerRef.current) {
                appMenuContainerRef.current.innerHTML = ''
            }
        }
    }, [isMicroApp, renderAppMenu])

    // 如果不是微应用模式,不渲染任何内容
    if (!isMicroApp) {
        return null
    }

    const handleToHome = () => {
        const homeRoute = microAppProps?.route?.homeRoute || '/dip-hub'
        window.location.href = homeRoute
    }

    const [appIcon, appName] = useMemo<[string, string]>(() => {
        return [
            microAppProps?.application?.icon,
            microAppProps?.application?.name,
        ]
    }, [microAppProps])

    const gotoPersonalCenter = (e) => {
        e.preventDefault()
        navigate('/personal-center')
    }

    return (
        <>
            <AntdHeader
                className={styles.microAppHeader}
                style={{
                    backgroundColor: '#fff',
                    padding: '0 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '52px',
                    lineHeight: '52px',
                }}
            >
                {/* 左侧区域: appMenuContainerRef 替换 logo */}
                <div
                    className={styles.leftWrapper}
                    style={{
                        display: 'flex',
                        flex: 1,
                        alignItems: 'center',
                    }}
                >
                    <div
                        ref={appMenuContainerRef}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    />
                    <div className={styles.appTitleWrapper}>
                        <FontIcon
                            name="icon-zhuye"
                            type={IconType.COLOREDICON}
                            className={styles.appHomeIcon}
                            onClick={() => handleToHome()}
                        />
                        <span className={styles.appSeparator}>/</span>
                        <span className={styles.appTitle}>
                            <span hidden={!appIcon}>
                                <img
                                    alt={appName}
                                    src={`data:image/png;base64,${appIcon}`}
                                    className={styles.appTitleIcon}
                                />
                            </span>
                            <span>{appName}</span>
                        </span>
                        {isFromSearchCopilot && (
                            <>
                                <span className={styles.appSeparator}>/</span>
                                <span
                                    className={styles.appTitle}
                                    onClick={() => onServiceMarketClick?.()}
                                >
                                    {__('数据服务超市')}
                                </span>
                                <span className={styles.appSeparator}>/</span>
                                <span className={styles.appTitle}>
                                    {__('找数助手')}
                                </span>
                            </>
                        )}
                    </div>
                    <div
                        className={styles.menuWrapper}
                        hidden={isFromSearchCopilot}
                    >
                        {menuConfig.map((menu) => {
                            const isActive = activeMenuKey === menu.key
                            // 从 SearchDataCopilot 进入时，找数助手菜单项不可点击
                            const isDisabled =
                                isFromSearchCopilot &&
                                menu.key === 'search-copilot'

                            return (
                                <div
                                    key={menu.key}
                                    className={classnames(
                                        styles.menuItem,
                                        isActive && styles.menuItemActive,
                                        isDisabled && styles.menuItemDisabled,
                                    )}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            handleMenuClick(menu.key)
                                        }
                                    }}
                                    style={
                                        isDisabled
                                            ? {
                                                  cursor: 'not-allowed',
                                                  opacity: 0.5,
                                              }
                                            : undefined
                                    }
                                >
                                    <span
                                        className={classnames(
                                            styles.menuLabel,
                                            isActive && styles.menuLabelActive,
                                        )}
                                    >
                                        {menu.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 右侧区域: 集成 AssetCenterHeader 的操作区域 */}
                <div className={styles.operationWrapper}>
                    {shouldShowTask && (
                        <div
                            onClick={(e) => {
                                setDataDownloadOpen(true)
                            }}
                            className={styles.downloadTask}
                        >
                            <Tooltip title={__('查看我的任务')}>
                                <FontIcon
                                    name="icon-woderenwu"
                                    className={styles.downloadIcon}
                                />
                            </Tooltip>
                            {__('我的任务')}
                        </div>
                    )}

                    <div onClick={(e) => {}}>
                        <a onClick={gotoPersonalCenter}>{__('个人中心')}</a>
                    </div>

                    {/* {[LoginPlatform.default].includes(platform) &&
                        showApplyList &&
                        hasDemandApplyPerm &&
                        using === 2 && (
                            <div
                                onClick={() => navigate(`/demand-mgt/create`)}
                                className={styles.itemWrapper}
                            >
                                <ApplyListOutlined
                                    style={{
                                        marginRight: '8px',
                                        fontSize: '16px',
                                    }}
                                />
                                <div style={{ position: 'relative' }}>
                                    {__('需求申请')}
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '-29%',
                                            left:
                                                assetsData?.dataAssetIds
                                                    ?.length < 10
                                                    ? '89%'
                                                    : '78%',
                                        }}
                                    >
                                        <Badge
                                            count={
                                                assetsData?.dataAssetIds
                                                    ?.length || 0
                                            }
                                            overflowCount={99}
                                        />
                                    </span>
                                </div>
                            </div>
                        )}  */}

                    {/* 市州共享申请 */}
                    {!isOnlySystemMgm &&
                        using === 1 &&
                        checkPermission('initiateSharedApplication') && (
                            <CityShareCard>
                                <Badge
                                    count={citySharingData?.data?.length || 0}
                                    overflowCount={99}
                                    size="small"
                                    color="#8FCBFF"
                                    offset={[-8, 8]}
                                >
                                    <Tooltip title={__('发起共享申报')}>
                                        <FontIcon
                                            name="icon-gouwuche1"
                                            className={styles.singleIcon}
                                        />
                                    </Tooltip>
                                </Badge>
                            </CityShareCard>
                        )}

                    {/* 用户信息卡片 */}
                    <div className={styles.itemWrapper}>
                        <UserInfoCard />
                    </div>
                </div>
            </AntdHeader>
            {dataDownloadOpen && (
                <MyTaskDrawer
                    open={dataDownloadOpen}
                    onClose={() => setDataDownloadOpen(false)}
                />
            )}
        </>
    )
}

export default MicroAppHeader
