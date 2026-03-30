import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Badge, InputRef, Tooltip, Button } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { trim } from 'lodash'
import classnames from 'classnames'
import { FontIcon } from '@/icons'

import styles from './styles.module.less'
import UserInfoCard from '../UserInfoCard'
import AssetsLibrary from '../SeriveMarketHeader/AssetsLibrary'
import {
    formatError,
    getRepositorys,
    allRoleList,
    LoginPlatform,
    goEffectivePath,
} from '@/core'
import actionType from '@/redux/actionType'
import __ from './locale'
import { getActualUrl, getPlatformNumber } from '@/utils'
import { homeRouteKeys } from '@/routers/config'
import GlobalMenu from '../GlobalMenu'
import MyTaskDrawer from './MyTaskDrawer'
import { useCongSearchContext } from '../CognitiveSearch/CogSearchProvider'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import CityShareCard from './CityShareCard'
import {
    flatRoute,
    findFirstPathByKeys,
    findFirstPathByModule,
    getRootMenuByPath,
    getRouteByKeys,
    useMenus,
    hasDataAssetsMenus,
} from '@/hooks/useMenus'
import { downloadApiFile } from '../OAuthLogin/helper'
import { IconType } from '@/icons/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useOemConfig } from '@/hooks/useOemConfig'

const { Header: AntdHeader } = Layout

const AssetCenterHeader = (props: {
    showApplyList?: boolean
    inCogAsst?: boolean // 是否为认知助手页面
    inDataApplication?: boolean // 是否为数据应用页面
    showTask?: boolean // 是否展示任务
}) => {
    const {
        showApplyList = true,
        inCogAsst = false,
        showTask = true,
        inDataApplication = false,
    } = props
    const [assetsLibraryOpen, setAssetsLibraryOpen] = useState(false)
    const [menusType, setMenusType] = useState<string>('')
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [dataDownloadOpen, setDataDownloadOpen] = useState<boolean>(false)
    const [toHomePath, setToHomePath] = useState<string>('')

    const { checkPermission, checkPermissions } = useUserPermCtx()

    const [cogKey, setCogKey] = useState('')
    const [showHistory, setShowHistory] = useState(false)
    const searchRef: any = useRef()
    const inputRef: any = useRef<InputRef>()
    const { bigHeader, assetType } = useCongSearchContext()
    const [isOnlySystemMgm, setIsOnlySystemMgm] = useState<boolean>(true)
    const [{ using }, updateUsing] = useGeneralConfig()
    const [menus] = useMenus()
    const [oemConfig] = useOemConfig()
    const platform = getPlatformNumber()
    const [inHome, setInHome] = useState<boolean>(false)
    const [activeMenuKey, setActiveMenuKey] = useState<string>('data-market')

    // 菜单配置 - 根据权限动态过滤
    const menuConfig = useMemo(() => {
        const config = [
            {
                key: 'data-market',
                label: __('数据服务超市'),
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
        // 根据模块下是否有有效路径来过滤显示
        return config.filter((item) => {
            const firstPath = findFirstPathByModule(item.key)
            return !!firstPath
        })
    }, [menus])

    // 是否有服务超市菜单
    const hasServiceMarket = hasDataAssetsMenus(menus)

    // 是否有我的任务（菜单不为空时显示）
    // const shouldShowTask = showTask && hasMyTaskMenus(menus)
    const shouldShowTask = false

    // const menuTypeTitle = {
    //     operatingCenter: __('运营中心'),
    //     appCenter: __('应用中心'),
    //     configCenter: __('配置中心'),
    // }

    const { pathname } = useLocation()

    // 是否为认知搜索界面
    const isCogSearchPage = useMemo(() => {
        return pathname === `/cognitive-search`
    }, [pathname])

    const hasDemandApplyPerm = useMemo(() => {
        if (platform === LoginPlatform.default) {
            return checkPermission('demandAnalysisAndImplement')
        }
        return false
    }, [checkPermission, platform])

    useEffect(() => {
        getRoleHasAccess()
    }, [checkPermission])

    useEffect(() => {
        // 获取菜单所属 module
        const rootMenu = getRootMenuByPath(pathname)
        setMenusType(
            menus.find((item) => item.key === rootMenu?.module?.[0])?.label ||
                '',
        )
        const homeMenu = flatRoute(
            getRouteByKeys(homeRouteKeys[platform]),
            true,
        )
        const path =
            pathname.slice(-1) === '/'
                ? pathname.slice(0, pathname.length - 1)
                : pathname
        setInHome(homeMenu.some((item) => item.path === path))

        // 更新活动菜单状态 - 使用 rootMenu 的 module 来确定当前菜单
        let menuKey = rootMenu?.module?.[0]

        // 如果没有 module,尝试多种方式获取 menuKey
        if (!menuKey) {
            // 1. 直接使用 rootMenu 的 key
            if (rootMenu?.key) {
                menuKey = rootMenu.key
            }
            // 2. 从 pathname 中提取第一段路径
            else {
                const pathArr = pathname.split('/').filter(Boolean)
                const firstPath = pathArr[0]

                // 匹配我们的菜单配置
                const menuKeys = ['data-market', 'work-center', 'config-center']
                if (menuKeys.includes(firstPath)) {
                    menuKey = firstPath
                } else {
                    // 默认使用 data-market
                    menuKey = 'data-market'
                }
            }
        }

        setActiveMenuKey(menuKey)
    }, [pathname])

    // 搜索占位
    const showPlace = useMemo(() => {
        const res = !showHistory && cogKey.trim() === ''
        if (res) {
            setCogKey('')
        }
        return res
    }, [showHistory, cogKey])

    const getShopCartData = async () => {
        try {
            const res = await getRepositorys()
            dispatch({
                type: actionType.SET_DATA_ASSETS,
                payload: {
                    dataAssetIds: res.entries.map((item) => item.res_id),
                },
            })
        } catch (error) {
            formatError(error)
        }
    }

    const getRoleHasAccess = () => {
        const systemMgm =
            checkPermission(allRoleList.TCSystemMgm, 'only') ?? false
        setIsOnlySystemMgm(systemMgm)
    }

    const assetsData = useSelector((state: any) => state?.dataAssetsReducer)
    const citySharingData = useSelector(
        (state: any) => state?.citySharingReducer,
    )

    // 是否展示市州共享申请
    const showCitySharing = useMemo(() => {
        return using === 1
    }, [using])

    useEffect(() => {
        // if (showApplyList) {
        //     // 获取数据资源申请库
        //     getShopCartData()
        // }
        // getAccessesRoutes()
    }, [])

    // const getAccessesRoutes = () => {
    //     const homeAccessesRoutes = filterMenuAccess(assetCenter, getAccesses)
    //     // 首页菜单权限
    //     if (homeAccessesRoutes.length > 0) {
    //         if (
    //             homeAccessesRoutes
    //                 ?.map((item) => item.path)
    //                 .includes('asset-center')
    //         ) {
    //             setToHomePaht(`/asset-center`)
    //         } else {
    //             setToHomePaht(`/${homeAccessesRoutes[0]?.path}`)
    //         }
    //         setIsOnlyConfigCenter(false)
    //     } else {
    //         setIsOnlyConfigCenter(true)
    //         const path = getPath(otherMenusItems, 'systemConfig', getAccesses)
    //         setToHomePaht(`/${path}`)
    //     }
    // }

    const handleClickHeaderImg = () => {
        if (inHome || isOnlySystemMgm) {
            return
        }
        if (isOnlySystemMgm && platform !== LoginPlatform.default) {
            return
        }
        // 回到门户首页
        goEffectivePath(menus, LoginPlatform.default, isOnlySystemMgm, (path) =>
            window.open(
                getActualUrl(path, true, LoginPlatform.default),
                '_self',
                'noopener,noreferrer',
            ),
        )
        // goEffectivePath(menus, platform, isOnlySystemMgm, navigate)
        // navigate(toHomePath)
    }

    // 跳转至认知搜索
    const handleCognitiveSearch = (val?: any, tag?: string) => {
        const value = trim(val)

        const url = getActualUrl(
            `/cognitive-search?tabKey=${tag || 'all'}&keyword=${value}`,
        )
        window.open(url, '_blank')
    }

    // 点击其他区域，关闭下拉菜单
    useEffect(() => {
        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    const handleClickOutside = (event: any) => {
        if (
            searchRef?.current &&
            !searchRef.current.contains(event.target) &&
            !event.target.classList.contains('searchPlace')
        ) {
            setShowHistory(false)
        }
    }

    // 点击一条历史记录时跳转至认知搜索界面
    const handleClickHistoryItem = (item) => {
        setCogKey(item?.qword)
        handleCognitiveSearch(item?.qword)
    }

    // 处理菜单点击
    const handleMenuClick = (key: string) => {
        setActiveMenuKey(key)
        if (['data-market', 'work-center', 'config-center'].includes(key)) {
            const firstUrl = findFirstPathByModule(key)
            navigate(firstUrl)
        } else {
            const firstUrl = findFirstPathByKeys([key])
            navigate(firstUrl)
        }
    }

    const gotoPersonalCenter = (e) => {
        e.preventDefault()
        navigate('/personal-center')
    }

    return (
        <>
            <AntdHeader
                className={classnames(
                    styles.headerWrapper,
                    isCogSearchPage && styles.cogSearchHeaderWrapper,
                    bigHeader && !inCogAsst && styles.cogSearchHeaderBigWrapper,
                )}
                style={{ backgroundColor: '#fff' }}
            >
                <div
                    className={classnames(styles.imgWrapper, {
                        [styles.imgWrapperDisabled]: isOnlySystemMgm || inHome,
                    })}
                >
                    {!isOnlySystemMgm && platform === LoginPlatform.default && (
                        <GlobalMenu />
                    )}
                    {[LoginPlatform.drmb, LoginPlatform.drmp].includes(
                        platform,
                    ) &&
                        !inHome &&
                        !isOnlySystemMgm && (
                            <FontIcon
                                name="icon-shouye"
                                type={IconType.COLOREDICON}
                                className={styles.homeIcon}
                                onClick={handleClickHeaderImg}
                            />
                        )}
                    {oemConfig?.['logo.png'] && (
                        <img
                            height="40px"
                            src={`data:image/png;base64,${oemConfig['logo.png']}`}
                            alt="AnyFabric Asset Center"
                            aria-hidden
                            className={classnames(styles.img, {
                                [styles.imgDrm]:
                                    platform !== LoginPlatform.default,
                            })}
                            onClick={handleClickHeaderImg}
                        />
                    )}
                    {/* <div
                        className={styles.menuTitleWrapper}
                        hidden={isCogSearchPage}
                    >
                        {menusType}
                    </div> */}
                    {/* {inCogAsst && (
                        <div
                            className={classnames(styles.cogAsstTitle, {
                                [styles.dataApplication]: inDataApplication,
                            })}
                        >
                            <div className={styles.divider} />
                            <span className={styles.subTitle}>
                                {inDataApplication
                                    ? __('数据应用')
                                    : __('问数助手')}
                            </span>
                        </div>
                    )} */}

                    <div className={styles.menuWrapper}>
                        {menuConfig.map((menu) => {
                            const isActive = activeMenuKey === menu.key

                            return (
                                <div
                                    key={menu.key}
                                    className={classnames(
                                        styles.menuItem,
                                        isActive && styles.menuItemActive,
                                    )}
                                    onClick={() => handleMenuClick(menu.key)}
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

                {/* {!inCogAsst &&
                    platform === LoginPlatform.default &&
                    (isCogSearchPage ? (
                        <div className={styles.searchPageHeader}>
                            <SearchHeader />
                        </div>
                    ) : (
                        <HistoryDropdown
                            keyword={cogKey.trim()}
                            onClickHistory={handleClickHistoryItem}
                            onClickCogSearchQA={(value) =>
                                handleCognitiveSearch(value, 'answers')
                            }
                            onClickCogSearchAll={(value) =>
                                handleCognitiveSearch(value)
                            }
                            showHistory={showHistory}
                            className={styles.cogSearchDropdown}
                            overlayStyle={{ maxWidth: 520 }}
                        >
                            <div
                                ref={searchRef}
                                onClick={() => setShowHistory(true)}
                                className="af_homeGuideSearch"
                            >
                                <SearchInput
                                    ref={inputRef}
                                    placeholder={__('请输入要查找的内容')}
                                    value={cogKey}
                                    onOriginalKeyChange={(kw: string) => {
                                        setShowHistory(true)
                                        setCogKey(kw)
                                    }}
                                    onPressEnter={(e: any) => {
                                        const { value } = e.target
                                        if (trim(value)) {
                                            setShowHistory(false)
                                            handleCognitiveSearch(value)
                                        }
                                    }}
                                    width={isCogSearchPage ? 640 : 520}
                                    className={styles.searchInput}
                                    maxLength={100}
                                    bordered={false}
                                />
                                {showPlace && (
                                    <div
                                        className={classnames(
                                            styles.searchPlace,
                                            'searchPlace',
                                        )}
                                        onClick={() => {
                                            inputRef?.current?.focus()
                                            setShowHistory(true)
                                        }}
                                    >
                                        <SearchOutlined
                                            style={{ marginRight: 6 }}
                                        />
                                        {__('搜索')}
                                    </div>
                                )}
                            </div>
                        </HistoryDropdown>
                    ))} */}
                <div className={styles.operationWrapper}>
                    {/* && checkPermission('basicPermission') */}
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
                        )} */}

                    {/* 市州共享申请 */}
                    {[LoginPlatform.default, LoginPlatform.drmp].includes(
                        platform,
                    ) &&
                        !isOnlySystemMgm &&
                        using === 1 &&
                        checkPermission('initiateSharedApplication') && (
                            <CityShareCard inCogAsst={inCogAsst}>
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

                    {platform === LoginPlatform.drmp &&
                        !isOnlySystemMgm &&
                        !inCogAsst &&
                        checkPermission('initiateDataSupplyDemand') && (
                            <Tooltip title={__('发起供需申报')}>
                                <FontIcon
                                    name="icon-faqigongxuduijie"
                                    className={styles.singleIcon}
                                    style={{ marginLeft: 8 }}
                                    onClick={() => {
                                        window.open(
                                            '/anyfabric/drmb/city-demand/apply',
                                            '_self',
                                        )
                                        // navigate(`/city-demand/apply`)
                                    }}
                                />
                            </Tooltip>
                        )}

                    {platform === LoginPlatform.ca && (
                        <div className={styles.itemWrapper}>
                            <div onClick={() => downloadApiFile()}>
                                <FontIcon
                                    name="icon-xiazai"
                                    style={{ marginRight: '8px' }}
                                />
                                <span>API 管理</span>
                            </div>
                        </div>
                    )}
                    <div className={styles.itemWrapper}>
                        <UserInfoCard />
                    </div>
                </div>
            </AntdHeader>
            <div className={styles.headerShadow} hidden={isCogSearchPage} />
            {assetsLibraryOpen && (
                <AssetsLibrary
                    open={assetsLibraryOpen}
                    onClose={() => setAssetsLibraryOpen(false)}
                />
            )}
            {dataDownloadOpen && (
                <MyTaskDrawer
                    open={dataDownloadOpen}
                    onClose={() => setDataDownloadOpen(false)}
                />
            )}
        </>
    )
}

export default AssetCenterHeader
