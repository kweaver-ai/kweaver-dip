import { useState, useEffect, useContext, useRef, ReactNode } from 'react'
import { Menu, Button, Tooltip, Badge } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import classNames from 'classnames'
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    CaretLeftOutlined,
    LeftOutlined,
} from '@ant-design/icons'
import { useSize, useUpdateEffect } from 'ahooks'
import { SizeMe } from 'react-sizeme'
import { some } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import {
    getActualUrl,
    getPlatformNumber,
    isSemanticGovernanceApp,
} from '@/utils'
import { MessageContext, useMicroAppProps } from '@/context'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import {
    findFirstPathByKeys,
    findFirstPathByModule,
    findMenuTreeByKey,
    findParentMenuByKey,
    flatRoute,
    getMenuKeyPath,
    getRootMenuByPath,
    getRouteByAttr,
    getRouteByModule,
    getRouteByModuleWithGroups,
    useMenus,
} from '@/hooks/useMenus'
import { formatError, getWorkOrderProcessing } from '@/core'
import actionType from '@/redux/actionType'
import { FontIcon } from '@/icons'

interface IIndexMenuSider {
    resizable?: boolean // 是否可以拖拽, 默认false
}

const IndexMenuSider = ({ resizable = false }: IIndexMenuSider) => {
    const { microAppProps } = useMicroAppProps()
    const [menus] = useMenus()
    const [selectedKey, setSelectedKey] = useState<string>('')
    const [menusType, setMenusType] = useState<string>('')
    const { messageInfo, setMessageInfo } = useContext(MessageContext)
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [menuItems, setMenuItems] = useState<Array<any>>([])
    const [collapsed, setCollapsed] = useState(false)
    const [openKeys, setOpenKeys] = useState<string[]>([''])
    const [{ using, governmentSwitch }, updateUsing] = useGeneralConfig()
    const platform = getPlatformNumber()
    const ref = useRef<HTMLDivElement>(null)
    const menuSize = useSize(ref) || { width: 220, height: 0 }
    const dispatch = useDispatch()
    const menusCountConfigs = useSelector(
        (state: any) => state?.menusCountConfigsReducer,
    )
    // semanticGovernance 专用
    const isSemanticGovernance = isSemanticGovernanceApp()
    const [moduleCategories, setModuleCategories] = useState<Array<any>>([])
    const [selectedModuleKey, setSelectedModuleKey] = useState<string>('')

    useEffect(() => {
        const nextMenusType =
            getRootMenuByPath(pathname, menus)?.module?.[0] || ''
        setMenusType(nextMenusType)
        getDefaultSelectKey()
    }, [pathname, menus])

    useEffect(() => {
        if (menusType) {
            getMenusCountConfigs()
            adaptMenu()
            getDefaultSelectKey()
        }
    }, [menusType])

    // semanticGovernance 专用：初始化模块分类
    useEffect(() => {
        if (isSemanticGovernance && menus.length > 0) {
            // 提取所有 type === 'module' 的菜单项作为分类
            const categories = menus.filter(
                (menu) => menu.type === 'module' && !menu.hide,
            )
            setModuleCategories(categories)

            // 如果还没有选中的模块，默认选中第一个
            if (!selectedModuleKey && categories.length > 0) {
                const firstCategory = categories[0]
                setSelectedModuleKey(firstCategory.key)
                setMenusType(firstCategory.key)
            }
        }
    }, [isSemanticGovernance, menus, selectedModuleKey])

    useUpdateEffect(() => {
        adaptMenu()
    }, [menuSize.width])

    useUpdateEffect(() => {
        adaptMenu()
    }, [menusCountConfigs])

    const adaptMenu = () => {
        const result = filterMenus(getRouteByModuleWithGroups(menusType, menus))
        setMenuItems(result)
    }

    const getMenusCountConfigs = async () => {
        try {
            const res = await getWorkOrderProcessing({
                limit: 10,
                offset: 1,
                status: 'Unassigned,Ongoing',
                type: 'data_quality',
            })
            if (res?.todo_count > 0) {
                dispatch({
                    type: actionType.SET_MENUS_COUNT_CONFIGS,
                    payload: [
                        {
                            key: 'dataQualityWorkOrderProcessing',
                            count: res?.todo_count,
                            needBadge: true,
                        },
                    ],
                })
            } else {
                dispatch({
                    type: actionType.SET_MENUS_COUNT_CONFIGS,
                    payload: menusCountConfigs.filter(
                        (it) => it.key !== 'dataQualityWorkOrderProcessing',
                    ),
                })
            }
        } catch (err) {
            formatError(err)
        }
    }

    const renderWithBadge = (key: string, node: ReactNode) => {
        const config = menusCountConfigs.find((item) => item.key === key)
        if (!config?.needBadge || typeof config.count !== 'number') {
            return node
        }
        return (
            <Badge
                count={config.count}
                overflowCount={999}
                size="small"
                showZero
                offset={[6, 0]}
            >
                {node}
            </Badge>
        )
    }

    const menuItem = (
        item: any,
        currentRoute: any,
        href: string,
        parentItem?: any,
        skipTooltip?: boolean,
    ) => {
        if (skipTooltip) {
            const labelText = item?.label || currentRoute?.label
            return (
                <a
                    href={href}
                    onClick={(e) => e.preventDefault()}
                    title={labelText}
                >
                    {labelText}
                </a>
            )
        }

        return (
            <SizeMe>
                {({ size }) => {
                    // 判断是否需要显示tooltip(收起状态或文本过长时)
                    const needTooltip =
                        collapsed || (size.width || 0) < menuSize.width - 40

                    // 构建tooltip内容
                    let tooltipTitle = ''
                    if (item?.isDeveloping) {
                        tooltipTitle = __('功能开发中')
                    } else if (needTooltip && !item.children) {
                        // 在收起状态下,对于没有子菜单的项,显示分组名称
                        if (
                            collapsed &&
                            item?.type !== 'group' &&
                            item.module?.length > 1
                        ) {
                            // 获取分组key (module[1])
                            const groupKey = item.module[1]
                            // 从menus中查找分组信息
                            const groupItem = menus.find(
                                (m) => m.key === groupKey && m.type === 'group',
                            )
                            if (groupItem?.label) {
                                tooltipTitle = `${groupItem.label} - ${
                                    item?.label || currentRoute?.label
                                }`
                            } else {
                                tooltipTitle =
                                    item?.label || currentRoute?.label
                            }
                        } else {
                            tooltipTitle = item?.label || currentRoute?.label
                        }
                    }

                    return (
                        <Tooltip
                            title={tooltipTitle}
                            placement="bottom"
                            // 黑底白字样式
                            overlayClassName={styles.menuTooltip}
                        >
                            <a
                                href={href}
                                onClick={(e) => e.preventDefault()}
                                title={
                                    needTooltip
                                        ? ''
                                        : item?.label || currentRoute?.label
                                }
                            >
                                {item?.type === 'group'
                                    ? item?.label
                                    : item?.label || currentRoute?.label}
                            </a>
                        </Tooltip>
                    )
                }}
            </SizeMe>
        )
    }

    // 筛选菜单
    const filterMenus = (
        items: any[],
        parentItem?: any,
        skipTooltip?: boolean,
    ) => {
        return items
            .map((item) => {
                const { key, label, children, icon, type } = item
                const currentRoute = getRouteByAttr(key, 'key', menus)
                const realPath =
                    currentRoute?.path || findFirstPathByKeys([key], menus)
                const href = `${getActualUrl(realPath)}`
                const showBadge = menusCountConfigs.find(
                    (it) => it.key === key,
                )?.count

                if (children) {
                    const child = children.filter((it) => !it.hide && !it.index)

                    // 检查是否有未隐藏的 index 子路由（用于默认页面）
                    const hasIndexChild = children.some(
                        (it) => it.index && !it.hide,
                    )

                    // 如果过滤后没有子项
                    if (child.length === 0) {
                        // 对于分组类型,返回 null 稍后过滤
                        // 对于有 index 子路由或有 layoutElement 的节点,应该保留
                        // 这样可以保留像"业务标准"这样有 index 子路由的页面
                        if (
                            type === 'group' ||
                            (!hasIndexChild && !currentRoute?.layoutElement)
                        ) {
                            return null
                        }
                        // 对于有 index 子路由或有 layoutElement 的节点,作为叶子节点处理
                        return {
                            key,
                            icon,
                            type,
                            label: showBadge
                                ? renderWithBadge(
                                      key,
                                      menuItem(
                                          item,
                                          currentRoute,
                                          href,
                                          parentItem,
                                          skipTooltip,
                                      ),
                                  )
                                : menuItem(
                                      item,
                                      currentRoute,
                                      href,
                                      parentItem,
                                      skipTooltip,
                                  ),
                            disabled: item?.isDeveloping,
                        }
                    }

                    // 递归处理子菜单项,所有子菜单项都跳过Tooltip,只使用title属性
                    const processedChildren = filterMenus(child, item, true)

                    // 如果递归处理后没有子项
                    if (processedChildren.length === 0) {
                        // 对于分组类型,返回 null
                        // 对于有 index 子路由或有 layoutElement 的节点,应该保留
                        if (
                            type === 'group' ||
                            (!hasIndexChild && !currentRoute?.layoutElement)
                        ) {
                            return null
                        }
                        // 对于有 index 子路由或有 layoutElement 的节点,作为叶子节点处理
                        return {
                            key,
                            icon,
                            type,
                            label: showBadge
                                ? renderWithBadge(
                                      key,
                                      menuItem(
                                          item,
                                          currentRoute,
                                          href,
                                          parentItem,
                                          skipTooltip,
                                      ),
                                  )
                                : menuItem(
                                      item,
                                      currentRoute,
                                      href,
                                      parentItem,
                                      skipTooltip,
                                  ),
                            disabled: item?.isDeveloping,
                        }
                    }

                    // 在收起状态下,如果当前项有children,在children数组前面添加分组标题
                    if (collapsed && type !== 'group') {
                        // 添加分组标题
                        const groupTitleItem = {
                            key: `${key}-title`,
                            type: 'group' as const,
                            label: (
                                <span
                                    style={{
                                        fontSize: '12px',
                                        color: 'rgba(0, 0, 0, 0.45)',
                                        cursor: 'default',
                                        fontWeight: 'normal',
                                        paddingLeft: '0',
                                    }}
                                >
                                    {typeof label === 'string'
                                        ? label
                                        : currentRoute?.label || key}
                                </span>
                            ),
                            disabled: true,
                        }

                        // 子菜单项已经通过skipTooltip参数处理过,直接使用
                        const childrenWithOnlyTitle = processedChildren

                        return {
                            key,
                            icon,
                            type,
                            label: showBadge
                                ? renderWithBadge(
                                      key,
                                      menuItem(
                                          item,
                                          currentRoute,
                                          href,
                                          parentItem,
                                          skipTooltip,
                                      ),
                                  )
                                : menuItem(
                                      item,
                                      currentRoute,
                                      href,
                                      parentItem,
                                      skipTooltip,
                                  ),
                            children: [
                                groupTitleItem,
                                ...childrenWithOnlyTitle,
                            ],
                            disabled: item?.isDeveloping,
                        }
                    }

                    return {
                        key,
                        icon,
                        type,
                        label: showBadge
                            ? renderWithBadge(
                                  key,
                                  menuItem(
                                      item,
                                      currentRoute,
                                      href,
                                      parentItem,
                                      skipTooltip,
                                  ),
                              )
                            : menuItem(
                                  item,
                                  currentRoute,
                                  href,
                                  parentItem,
                                  skipTooltip,
                              ),
                        children: processedChildren,
                        disabled: item?.isDeveloping,
                    }
                }
                return {
                    key,
                    icon,
                    type,
                    label: showBadge
                        ? renderWithBadge(
                              key,
                              menuItem(
                                  item,
                                  currentRoute,
                                  href,
                                  parentItem,
                                  skipTooltip,
                              ),
                          )
                        : menuItem(
                              item,
                              currentRoute,
                              href,
                              parentItem,
                              skipTooltip,
                          ),
                    disabled: item?.isDeveloping,
                }
            })
            .filter((item) => item !== null) // 过滤掉 null 项
    }

    // const getMenu = (menus) => {
    //     const authServiceAccesses = getAccess(accessScene.auth_service)
    //     const configAppsAccesses = getAccess(accessScene.config_apps)
    //     let usingFilterData =
    //         using === 2
    //             ? authServiceAccesses
    //                 ? [
    //                       'dataContent',
    //                       'DataCatalogUnderstanding',
    //                       'caseReport',
    //                       'applicationCase',
    //                       'categoryManage',
    //                   ]
    //                 : [
    //                       'dataContent',
    //                       'DataCatalogUnderstanding',
    //                       // 'dataAssetDevelopment',
    //                       'categoryManage',
    //                       'applicationCase',
    //                   ]
    //             : governmentSwitch.on
    //             ? []
    //             : [
    //                   'resourceSharing',
    //                   'resourceDirReport',
    //                   'dirReportAudit',
    //                   'resourceReport',
    //                   'resourceReportAudit',
    //                   'objectionMgt',
    //                   'applicationCase',
    //               ]
    //     usingFilterData =
    //         llm || llmLoading
    //             ? usingFilterData
    //             : [...usingFilterData, 'intelligentQA']
    //     if (using === 2 && !authServiceAccesses && !configAppsAccesses) {
    //         usingFilterData.push('dataAssetDevelopment')
    //     }
    //     const routers = menus
    //         .map((item) => {
    //             const path =
    //                 item?.path?.substring(0, 1) === '/'
    //                     ? item?.path
    //                     : `/${item?.path}`
    //             const href = `${getActualUrl(path)}`
    //             return {
    //                 ...item,
    //                 label: item?.path ? (
    //                     <a href={href} onClick={(e) => e.preventDefault()}>
    //                         {item?.label}
    //                     </a>
    //                 ) : (
    //                     item?.label
    //                 ),
    //                 children: item?.children
    //                     ? getMenuFilterHide(item?.children)?.length > 0
    //                         ? getMenuFilterHide(item?.children)
    //                         : undefined
    //                     : undefined,
    //             }
    //         })
    //         .filter((item) => !item.hide)
    //         .filter(
    //             (item) =>
    //                 menuSiderKeys[menusType].includes(item.key) &&
    //                 !usingFilterData.includes(item.key),
    //         )

    //     const pathInner = getInnerUrl(pathname || '')
    //     const result = filterMenuAccess(routers, getAccesses)
    //     // 有效路径
    //     const isEffective = checkPathExists(otherMenusItems, pathInner)
    //     // 有权限路径
    //     const isAccess = checkPathExists(result, pathInner)
    //     if (isEffective && !isAccess) {
    //         navigate('/403')
    //         return
    //     }
    //     if (!isEffective) {
    //         navigate('/404')
    //         return
    //     }
    //     setMenuItems(result)
    // }

    // /**
    //  * 过滤hide、index菜单
    //  * hide:true 详情等路由，不需要在菜单中显示
    //  * index:true 没有一级菜单，下面没有子级
    //  */
    // const getMenuFilterHide = (menus: any[]) => {
    //     const authServiceAccesses = getAccess(accessScene.auth_service)
    //     const usingFilterData =
    //         using === 2
    //             ? authServiceAccesses
    //                 ? [
    //                       'dataContent',
    //                       'DataCatalogUnderstanding',
    //                       'categoryManage',
    //                       'demandAudit',
    //                       'provinceDemand',
    //                   ]
    //                 : [
    //                       'dataContent',
    //                       'DataCatalogUnderstanding',
    //                       'dataAssetDevelopment',
    //                       'categoryManage',
    //                       'demandAudit',
    //                       'provinceDemand',
    //                   ]
    //             : governmentSwitch.on
    //             ? [
    //                   'demandApplication',
    //                   'demandHall',
    //                   'demandMgt',
    //                   'demandAudit',
    //               ]
    //             : [
    //                   'resourceSharing',
    //                   'resourceDirReport',
    //                   'dirReportAudit',
    //                   'resourceReport',
    //                   'resourceReportAudit',
    //                   'objectionMgt',
    //                   'demandApplication',
    //                   'demandHall',
    //                   'demandMgt',
    //                   'demandAudit',
    //                   'provinceDemand',
    //                   'demandAudit',
    //               ]

    //     return menus
    //         .map((item) => {
    //             const path =
    //                 item?.path?.substring(0, 1) === '/'
    //                     ? item?.path
    //                     : `/${item?.path}`
    //             const href = `${getActualUrl(path)}`
    //             if (item?.children) {
    //                 return {
    //                     ...item,
    //                     label: item?.path ? (
    //                         <a href={href} onClick={(e) => e.preventDefault()}>
    //                             {item?.label}
    //                         </a>
    //                     ) : (
    //                         item?.label
    //                     ),
    //                     children: getMenuFilterHide(item?.children),
    //                 }
    //             }
    //             return {
    //                 ...item,
    //                 label: item?.path ? (
    //                     <a href={href} onClick={(e) => e.preventDefault()}>
    //                         {item?.label}
    //                     </a>
    //                 ) : (
    //                     item?.label
    //                 ),
    //             }
    //         })
    //         .filter((item) => !item.hide && !item.index)
    //         .filter((item) => !usingFilterData.includes(item.key))
    // }

    /**
     * 获取选中菜单的路径
     * @returns 路径
     */
    const getDefaultSelectKey = () => {
        if (!menusType) {
            return
        }
        const menu = getRouteByAttr(pathname, 'path', menus)
        if (menu.index) {
            setSelectedKey(findParentMenuByKey(menu?.key)?.key)
        } else {
            setSelectedKey(menu?.key)
        }
        setOpenKey()
    }

    const setOpenKey = () => {
        const pathKey = getRouteByAttr(pathname, 'path', menus)?.key
        const rootMenu = getRootMenuByPath(pathname, menus)
        // 当前key匹配则是一级菜单，否则查找父key
        if (pathKey === rootMenu?.key) {
            setOpenKeys([pathKey])
        } else {
            setOpenKeys(getMenuKeyPath(rootMenu, pathKey))
        }
    }

    const getParentKeyByPath = (key: string, data: any[]) => {
        let parentKey: string
        data.forEach((item) => {
            if (item.children) {
                if (item.children.some((it) => it.key === key)) {
                    parentKey = item.key
                } else if (getParentKeyByPath(key, item.children)) {
                    parentKey = getParentKeyByPath(key, item.children)
                }
            }
        })
        return parentKey!
    }

    // 检查路径是否存在
    const checkPathExists = (items: any[], path: string) => {
        const temp = flatRoute(items)
        const result =
            path.slice(-1) === '/' ? path.slice(0, path.length - 1) : path
        return some(temp, {
            path: result,
        })
    }

    const handleMenuClick = (item) => {
        setSelectedKey(item.key)
        const path =
            getRouteByAttr(item.key, 'key', menus)?.path ||
            findFirstPathByKeys([item.key], menus)
        const url = path.substring(0, 1) === '/' ? path : `/${path}`
        navigate(url)
    }

    useUpdateEffect(() => {
        if (!collapsed) {
            setOpenKey()
        }
    }, [collapsed])

    const toggleCollapsed = () => {
        // 收起时，通过样式隐藏了菜单group
        setCollapsed(!collapsed)
    }

    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1)
        // 一级菜单
        const firstMenus = getRouteByModuleWithGroups(menusType, menus)
        if (firstMenus.map((item) => item.key).indexOf(latestOpenKey!) === -1) {
            setOpenKeys(keys)
        } else {
            setOpenKeys(latestOpenKey ? [latestOpenKey] : [])
        }
    }

    // semanticGovernance 专用：切换模块分类
    const handleModuleCategoryClick = (moduleKey: string) => {
        setSelectedModuleKey(moduleKey)
        setMenusType(moduleKey)
        // 切换模块时清空选中的菜单
        setSelectedKey('')
        setOpenKeys([])

        // 自动跳转到该模块下的第一个有权限的菜单
        const firstUrl = findFirstPathByModule(moduleKey, menus)
        if (firstUrl) {
            navigate(firstUrl)
        }
    }

    const handleBackClick = () => {
        // 跳转到宿主根目录
        window.location.href = '/studio'
        // microAppProps?.toggleSideBarShow?.(true)
    }

    return (
        <div
            className={classNames(
                styles.indexMenuSiderWrapper,
                collapsed && styles.collapsedMenu,
                resizable && styles.resizableMenu,
                isSemanticGovernance && styles.withCategoryBar,
            )}
            ref={ref}
        >
            {/* semanticGovernance 专用 */}
            {isSemanticGovernance && moduleCategories.length > 0 && (
                <div className={styles.categoryBar}>
                    <Tooltip title="返回" placement="right">
                        <div
                            className={styles.categoryItem}
                            onClick={handleBackClick}
                        >
                            <span className={styles.categoryIcon}>
                                <LeftOutlined />
                            </span>
                        </div>
                    </Tooltip>
                    {moduleCategories.map((category) => (
                        <Tooltip
                            key={category.key}
                            title={category.label}
                            placement="right"
                        >
                            <div
                                className={classNames(
                                    styles.categoryItem,
                                    selectedModuleKey === category.key &&
                                        styles.categoryItemActive,
                                )}
                                onClick={() =>
                                    handleModuleCategoryClick(category.key)
                                }
                            >
                                {category.attribute?.iconFont ? (
                                    <span className={styles.categoryIcon}>
                                        <FontIcon
                                            name={category?.attribute?.iconFont}
                                        />
                                    </span>
                                ) : (
                                    <span className={styles.categoryLabel}>
                                        {category.label?.substring(0, 4)}
                                    </span>
                                )}
                            </div>
                        </Tooltip>
                    ))}
                </div>
            )}
            <div className={styles.menuWrapper}>
                <Menu
                    mode="inline"
                    defaultOpenKeys={[selectedKey]}
                    selectedKeys={[selectedKey]}
                    className={styles.menu}
                    items={menuItems}
                    inlineCollapsed={collapsed}
                    openKeys={openKeys}
                    onClick={handleMenuClick}
                    onOpenChange={onOpenChange}
                    style={{
                        width: resizable
                            ? '100%'
                            : collapsed
                            ? '50px'
                            : '232px',
                    }}
                />
                {!resizable && (
                    <div className={styles.collapsedBtn}>
                        <Button
                            type="text"
                            onClick={toggleCollapsed}
                            className={styles.btn}
                        >
                            {collapsed ? (
                                <MenuUnfoldOutlined />
                            ) : (
                                <MenuFoldOutlined />
                            )}
                            <span className={styles.btnTips}>
                                <CaretLeftOutlined
                                    className={styles.tipsIcon}
                                />
                                <span className={styles.tipsText}>
                                    {collapsed ? __('展开') : __('收起')}
                                </span>
                            </span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default IndexMenuSider
