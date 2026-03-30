import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Dropdown, Row, Col, Divider, Tooltip } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { CloseOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { flatMapDeep, flattenDeep, last } from 'lodash'
import styles from './styles.module.less'
import { FontIcon, MenuOutlined } from '@/icons'
import __ from './locale'
import { getActualUrl, getInnerUrl, getPlatformNumber } from '@/utils'
import { allRoleList, LoginPlatform } from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { globalMenuClassify, jumpRoute } from './helper'
import {
    useMenus,
    findFirstPathByKeys,
    findFirstPathByModule,
    findMenuTreeByKey,
    getMenuKeyPath,
    getRootMenuByPath,
    getRouteByAttr,
    getRouteByModule,
} from '@/hooks/useMenus'
import { IconType } from '@/icons/const'
import { isRuntimeMicroApp } from '@/utils/runtimeConfig'

const GlobalMenu: React.FC = () => {
    // 判断是否为微应用模式
    const isMicroApp = useMemo(() => isRuntimeMicroApp(), [])

    // 微应用模式下不显示 GlobalMenu
    if (isMicroApp) {
        return null
    }
    const [menus] = useMenus()
    const [menuList, setMenuList] = useState<Array<any>>([])
    const [classifyMentList, setClassifyMentList] =
        useState<Array<any>>(globalMenuClassify)
    const navigator = useNavigate()
    const { pathname } = useLocation()
    const [towColMenus, setTowColMenus] = useState<boolean>(false)
    const [oneColMenus, setOneColMenus] = useState<boolean>(false)
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
    const [activeRouterKey, setActiveRouterKey] = useState<string[]>([])
    const [{ using, governmentSwitch, local_app }, updateUsing] =
        useGeneralConfig()
    // 使用useRef绑定DOM对象
    const domRef = useRef<HTMLDivElement>(null)
    const domBtnRef = useRef<HTMLDivElement>(null)
    const platform = getPlatformNumber()

    useEffect(() => {
        // 显示菜单列表项
        const showList = globalMenuClassify
            .map((col) => col.filter((i) => menus.find((m) => m.key === i.key)))
            .filter((i) => i.length > 0)
            .map((col) =>
                col.map((i) => {
                    const group = menus.find((m) => m.key === i.key)
                    // 对于某些菜单(如 work-center, config-center),需要使用 findFirstPathByModule 获取实际的第一个子页面
                    const needFirstPath = [
                        'work-center',
                        'config-center',
                    ].includes(i.key)
                    const path = needFirstPath
                        ? findFirstPathByModule(i.key)
                        : group?.path || findFirstPathByModule(i.key)
                    const href = `${getActualUrl(
                        path?.substring(0, 1) === '/' ? path : `/${path}`,
                    )}`
                    return {
                        ...group,
                        ...i,
                        label: (
                            <a href={href} onClick={(e) => e.preventDefault()}>
                                {group?.label}
                            </a>
                        ),
                        path,
                        children: filterMenus(
                            getRouteByModule(i.key).filter(
                                (m) => m.type !== 'group',
                            ),
                        ),
                    }
                }),
            )
        setClassifyMentList(showList)
    }, [menus])

    const flatMenu = (routeArr: any[]): any[] =>
        flatMapDeep(routeArr, (item) => [
            item,
            ...flatMenu(item.children || []),
        ])

    useEffect(() => {
        const pathKey = getRouteByAttr(pathname, 'path')?.key
        const rootMenu = getRootMenuByPath(pathname)
        // 当前key匹配则是一级菜单，否则查找父key
        if (
            flattenDeep(classifyMentList).find((item) => item.key === pathKey)
        ) {
            setActiveRouterKey([pathKey])
        } else {
            const flatMenuList = flatMenu(flattenDeep(classifyMentList))
            const pathArr: string[] = getMenuKeyPath(rootMenu, pathKey).filter(
                (item) => flatMenuList.find((it) => it.key === item),
            )
            const module: string = last(rootMenu?.module) || ''
            setActiveRouterKey([...pathArr, module].filter((item) => item))
        }
    }, [pathname, classifyMentList])

    // 适配菜单
    const filterMenus = (items: any[]) => {
        return items
            .filter((item) => !item.hide && !item.index)
            .map((item) => {
                const currentRoute = getRouteByAttr(item.key, 'key')
                let path =
                    currentRoute?.path ||
                    findFirstPathByKeys(item.key, [findMenuTreeByKey(item.key)])
                const jumpTarget = jumpRoute.find((it) => it.key === item.key)
                if (jumpTarget) {
                    const menu = findMenuTreeByKey(jumpTarget.targetKey)
                    path = menu?.path || path
                }
                const href = `${getActualUrl(path)}`
                if (item?.children) {
                    return {
                        ...item,
                        label: (
                            <a href={href} onClick={(e) => e.preventDefault()}>
                                {item.label || currentRoute?.label}
                            </a>
                        ),
                        path,
                        children: filterMenus(item?.children),
                    }
                }
                return {
                    ...item,
                    path,
                    label: (
                        <a href={href} onClick={(e) => e.preventDefault()}>
                            {item.label || currentRoute?.label}
                        </a>
                    ),
                }
            })
    }

    // useEffect(() => {
    //     const menu = getMenus(
    //         globalMenuList.filter((current) => {
    //             // 没有普通用户权限，且是资产中心，则不显示
    //             if (current.key === 'asset-center' && !userRoleAccess) {
    //                 return false
    //             }
    //             // 没有普通用户权限，且本地应用没有开启，则不显示我的资产
    //             if (
    //                 current.key === 'my-assets' &&
    //                 !userRoleAccess &&
    //                 !local_app
    //             ) {
    //                 return false
    //             }
    //             return true
    //         }),
    //     )
    //     const fullPath = getInnerUrl(pathname || '')
    //     const pathInner =
    //         fullPath.slice(-1) === '/'
    //             ? fullPath.slice(0, fullPath.length - 1)
    //             : fullPath
    //     const result = filterMenuAccess(menu, getAccesses) || []
    //     // 有效路径
    //     const isEffective = checkPathExists(routes, pathInner)
    //     // 有权限路径
    //     const isAccess = checkPathExists(result, pathInner)
    //     if (isEffective && !isAccess) {
    //         navigator('/403')
    //         return
    //     }
    //     if (!isEffective) {
    //         navigator('/404')
    //         return
    //     }
    //     // 没有配置中心权限，显示2列；只有系统管理员权限，显示2列
    //     setTowColMenus(
    //         !result?.find((item) => item.key === 'config-center') ||
    //             result.length === 2,
    //     )
    //     setMenuList(result)
    // }, [using, userRoleAccess, llm])

    // useEffect(() => {
    //     if (towColMenus) {
    //         const [first, second, third] = globalMenuClassify
    //         if (menuList.find((item) => item.key === 'audit-center')) {
    //             setClassifyMentList([first, third])
    //             return
    //         }
    //         const List = [first, second]
    //         setClassifyMentList(List)
    //     }
    // }, [towColMenus])

    // useEffect(() => {
    //     const key =
    //         getRouteByAttr(pathname.substring(1), 'path')?.key ||
    //         getWorkbenchKey(pathname.substring(1))
    //     setActiveRouterKey(key)
    // }, [pathname])

    // useEffect(() => {
    //     if (towColMenus) {
    //         const [first, second, third] = globalMenuClassify
    //         if (menuList.find((item) => item.key === 'audit-center')) {
    //             setClassifyMentList([first, third])
    //             return
    //         }
    //         const List = [first, second]
    //         setClassifyMentList(List)
    //     }
    // }, [towColMenus])

    // 组件初始化绑定点击事件
    useEffect(() => {
        const handleClickOutSide = (e: MouseEvent) => {
            // 判断用户点击的对象是否在DOM节点内部
            if (!domRef.current?.contains(e.target as Node)) {
                if (domBtnRef.current?.contains(e.target as Node)) {
                    if (dropdownOpen) {
                        setDropdownOpen(false)
                    }
                } else {
                    setDropdownOpen(false)
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutSide)
        return () => {
            document.removeEventListener('mousedown', handleClickOutSide)
        }
    }, [])

    //  // 检查路径是否存在
    //  const checkPathExists = (menus: any[], path: string) => {
    //     // 去除菜单前 /
    //     const temp = flatRoute(menus).map((item) => {
    //         return {
    //             ...item,
    //             path: path.substring(0, 1) === '/' ? path.substring(1) : path,
    //         }
    //     })
    //     // 去除path后 /
    //     const result =
    //         path.slice(-1) === '/' ? path.slice(0, path.length - 1) : path
    //     return _.some(temp, {
    //         path: result.substring(1),
    //     })
    // }

    // useEffect(() => {
    //     getRoleHasAccess()
    // }, [allRoles])

    // const getRoleHasAccess = () => {
    //     const resourceAccessRole = [
    //         allRoleList.TCNormal,
    //         allRoleList.TCDataButler,
    //         allRoleList.TCDataGovernEngineer,
    //         allRoleList.TCDataOperationEngineer,
    //         allRoleList.TCDataOwner,
    //     ]
    //     let hasResourceAccess = false
    //     allRoles.forEach((role) => {
    //         if (resourceAccessRole.includes(role.id)) {
    //             hasResourceAccess = true
    //         }
    //     })
    //     setUserRoleAccess(hasResourceAccess)
    // }

    // const getMenus = (menus: any[]) => {
    //     let usingFilterData =
    //         using === 1
    //             ? governmentSwitch.on
    //                 ? []
    //                 : [
    //                       'resourceSharing',
    //                       'resourceDirReport',
    //                       'dirReportAudit',
    //                       'resourceReport',
    //                       'resourceReportAudit',
    //                       'objectionMgt',
    //                       'applicationCase',
    //                   ]
    //             : [
    //                   'dataContent',
    //                   'DataCatalogUnderstanding',
    //                   'categoryManage',
    //                   'applicationCase',
    //               ]
    //     usingFilterData = llm
    //         ? usingFilterData
    //         : [...usingFilterData, 'intelligentQA']
    //     return menus
    //         .filter((current) => !usingFilterData.includes(current.key))
    //         .map((item) => {
    //             const currentRoute = getRouteByAttr(item.key, 'key')
    //             const path = item.path || currentRoute?.path
    //             const href = `${getActualUrl(
    //                 path?.substring(0, 1) === '/' ? path : `/${path}`,
    //             )}`
    //             if (item?.children) {
    //                 return {
    //                     ...item,
    //                     label: (
    //                         <a href={href} onClick={(e) => e.preventDefault()}>
    //                             {item.label || currentRoute?.label}
    //                         </a>
    //                     ),
    //                     path: item.path || currentRoute?.path,
    //                     children: getMenus(item?.children),
    //                     access: item.access || currentRoute?.access,
    //                 }
    //             }
    //             return {
    //                 ...item,
    //                 label: (
    //                     <a href={href} onClick={(e) => e.preventDefault()}>
    //                         {item.label || currentRoute?.label}
    //                     </a>
    //                 ),
    //                 path: item.path || currentRoute?.path,
    //                 access: item.access || currentRoute?.access,
    //             }
    //         })
    // }

    // const getConfigCenterFirstUrl = () => {
    //     const result: string[] = [
    //         accessScene.config_architecture,
    //         accessScene.config_role,
    //         accessScene.datasource,
    //         accessScene.config_pipeline,
    //         accessScene.audit_process,
    //         accessScene.audit_strategy,
    //         accessScene.timestamp_blacklist,
    //     ]?.filter((current) => getAccesses([current], false))
    //     if (result?.[0]) {
    //         const menuItem = otherMenusItems.find((item) =>
    //             (item.access || []).includes(result?.[0]),
    //         )
    //         return `/${menuItem?.path}` || ''
    //     }
    //     return ''
    // }

    const menuClick = (item: any, path: string) => {
        if (!path) {
            navigator('/404')
            return
        }
        navigator(path?.substring(0, 1) === '/' ? path : `/${path}`)
        setDropdownOpen(false)

        //  // 普通用户只有审核待办权限，没有任务中心其他权限，配置第二个path
        //  const pathList = ['taskCenter/project']
        //  if (path) {
        //      let url = ''
        //      if (pathList.includes(path)) {
        //          const currentRoute = getRouteByAttr(path, 'path')
        //          const access = getAccesses(currentRoute?.access, false)
        //          url = access ? `/${path}` : `/${secPath}`
        //      } else if (path === '/systemConfig/businessArchitecture') {
        //          url = getConfigCenterFirstUrl()
        //      } else {
        //          url = path.substring(0, 1) === '/' ? path : `/${path}`
        //      }
        //      navigator(url)
        //      setDropdownOpen(false)
        //  }
    }

    const items = [
        {
            key: '1',
            label: (
                <Row ref={domRef} className={styles.globalMenuRow}>
                    {classifyMentList.map((col, indx) => {
                        return (
                            <Col
                                className={classnames(
                                    styles.globalMenuCol,
                                    indx === classifyMentList.length - 1 &&
                                        styles.noBorder,
                                )}
                                span={
                                    classifyMentList.length === 1
                                        ? 24
                                        : classifyMentList.length === 2
                                        ? 12
                                        : 8
                                }
                                key={indx}
                            >
                                {col.map((item) => {
                                    return (
                                        <div key={item.key}>
                                            <div
                                                className={classnames(
                                                    styles.firstMenu,
                                                    activeRouterKey?.length ===
                                                        1 &&
                                                        activeRouterKey[0] ===
                                                            item.key &&
                                                        styles.active,
                                                )}
                                                onClick={() =>
                                                    menuClick(item, item.path)
                                                }
                                            >
                                                <span
                                                    className={styles.iconBox}
                                                >
                                                    {activeRouterKey ===
                                                    item.key
                                                        ? item.activeIcon
                                                        : item.icon}
                                                </span>
                                                <span
                                                    className={
                                                        styles.firstMenuLabel
                                                    }
                                                >
                                                    {item.label}
                                                </span>
                                            </div>
                                            {item?.children?.length > 0 &&
                                                item.children.map(
                                                    (it, secIndex) => {
                                                        return (
                                                            <div
                                                                className={classnames(
                                                                    {
                                                                        [styles.secondMenu]:
                                                                            true,
                                                                        [styles.firSecondMenu]:
                                                                            secIndex ===
                                                                            0,
                                                                        [styles.lastSecondMenu]:
                                                                            secIndex ===
                                                                            item
                                                                                .children
                                                                                .length -
                                                                                1,
                                                                        [styles.hasChidSecondMenu]:
                                                                            it
                                                                                ?.children
                                                                                ?.length,
                                                                        [styles.active]:
                                                                            activeRouterKey[0] ===
                                                                            it.key,
                                                                    },
                                                                )}
                                                                key={it.key}
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.secondMenuLabel
                                                                    }
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        menuClick(
                                                                            it,
                                                                            it.path,
                                                                        )
                                                                    }}
                                                                >
                                                                    {it.label}
                                                                </div>

                                                                {it?.children
                                                                    ?.length >
                                                                    0 && (
                                                                    <div
                                                                        className={
                                                                            styles.thirdMenu
                                                                        }
                                                                    >
                                                                        {it.children.map(
                                                                            (
                                                                                i,
                                                                                index,
                                                                            ) => {
                                                                                return (
                                                                                    <div
                                                                                        className={
                                                                                            styles.thirdMenuItem
                                                                                        }
                                                                                        key={
                                                                                            i.key
                                                                                        }
                                                                                    >
                                                                                        <span
                                                                                            onClick={(
                                                                                                e,
                                                                                            ) => {
                                                                                                menuClick(
                                                                                                    i,
                                                                                                    i.path,
                                                                                                )
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                i.label
                                                                                            }
                                                                                        </span>
                                                                                        {index +
                                                                                            1 !==
                                                                                            it
                                                                                                .children
                                                                                                .length && (
                                                                                            <Divider type="vertical" />
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            },
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    },
                                                )}
                                        </div>
                                    )
                                })}
                            </Col>
                        )
                    })}
                    <CloseOutlined
                        onClick={() => setDropdownOpen(false)}
                        className={styles.closeBtn}
                    />
                </Row>
            ),
        },
    ]

    return (
        platform === LoginPlatform.default && (
            <div className={styles.globalMenuWrapper}>
                <Dropdown
                    menu={{ items }}
                    trigger={['click']}
                    open={dropdownOpen}
                    overlayClassName={classnames(
                        styles.globalMenuPopupWrapper,
                        classifyMentList.length === 1 && styles.oneColMenus,
                        classifyMentList.length === 2 && styles.towColMenus,
                        // towColMenus && styles.towColMenus,
                        // oneColMenus && styles.oneColMenus,
                    )}
                >
                    <div
                        ref={domBtnRef}
                        className={styles.globalIconBox}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <FontIcon
                            name="icon-caidan"
                            type={IconType.COLOREDICON}
                            className={styles.globalIcon}
                        />
                    </div>
                </Dropdown>
            </div>
        )
    )
}

export default GlobalMenu
