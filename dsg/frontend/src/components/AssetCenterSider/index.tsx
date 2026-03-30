import React, { useState, useEffect, useContext, useRef, useMemo } from 'react'
import { Layout, Menu, MenuProps } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSize } from 'ahooks'
import { drop, findIndex } from 'lodash'
import {
    DataAssetsColored,
    DataAssetsNewOutlined,
    ConfigCenterOutlined,
    OperationCenterOutlined,
    OperationCenterColored,
    EllipsisOutlined,
} from '@/icons'
import Items from './Items'
import styles from './styles.module.less'
import __ from './locale'
import { MessageContext } from '@/context'
import { formatError } from '@/core'
import { getTasks } from '@/core/apis/taskCenter'
import EllipsisColored from '@/icons/EllipsisColored'
import {
    findFirstPathByKeys,
    findFirstPathByModule,
    useMenus,
} from '@/hooks/useMenus'

const { Sider: AntdSider } = Layout

const AssetCenterSider = () => {
    const [selectedKey, setSelectedKey] = useState<string[]>([])
    const { messageInfo, setMessageInfo } = useContext(MessageContext)
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const ref = useRef(null)
    const size = useSize(ref)
    const [menus] = useMenus()

    const getMessages = async () => {
        try {
            const task = await getTasks({ statistics: true })
            // const review = await getReviewCount()
            setMessageInfo({
                ...messageInfo,
                todoTasksCount: task?.total_executable_tasks || 0,
                todoReviewCount: 0,
            })
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getMessages()
    }, [])

    const menuItems: MenuProps['items'] = useMemo(() => {
        const items: any[] = [
            {
                title: __('数据服务超市'),
                label: (
                    <Items
                        SelectedIcon={DataAssetsColored}
                        CurrentIcon={DataAssetsNewOutlined}
                        selectedKey={selectedKey}
                        currentKey="data-assets"
                        title={__('数据服务超市')}
                    />
                ),
                key: 'data-assets',
            },
            {
                title: __('运营中心'),
                label: (
                    <Items
                        SelectedIcon={OperationCenterColored}
                        CurrentIcon={OperationCenterOutlined}
                        selectedKey={selectedKey}
                        currentKey="work-center"
                        count={
                            Number(messageInfo?.todoTasksCount) +
                            Number(messageInfo?.todoReviewCount)
                        }
                        title={__('运营中心')}
                    />
                ),
                key: 'work-center',
            },
            {
                title: __('配置中心'),
                label: (
                    <Items
                        SelectedIcon={ConfigCenterOutlined}
                        CurrentIcon={ConfigCenterOutlined}
                        selectedKey={selectedKey}
                        currentKey="config-center"
                        title={__('配置中心')}
                    />
                ),
                key: 'config-center',
            },
        ].filter((info) => menus.find((item) => item.key === info.key))
        if (size?.height) {
            let showNumber = Math.floor((Math.max(size.height, 176) - 28) / 68)
            if (showNumber < 8) {
                showNumber =
                    items.length === showNumber
                        ? showNumber + 1
                        : items.length === 2
                        ? 3
                        : showNumber
                // 显示的菜单
                const showItems = items.slice(0, showNumber - 1)
                // 隐藏的菜单
                const hideItems = drop(items, showNumber - 1)
                // 设置 'more' 菜单选中状态
                if (hideItems.find((item) => selectedKey.includes(item.key))) {
                    if (!selectedKey.includes('more')) {
                        setSelectedKey((prev) => [...prev, 'more'])
                    }
                } else if (selectedKey.includes('more')) {
                    setSelectedKey((prev) =>
                        prev.filter((item) => item !== 'more'),
                    )
                }
                const configIndex = findIndex(
                    showItems,
                    (item) => item.key === 'config-center',
                )
                // 显示分割线
                if (configIndex !== -1 && configIndex !== 0) {
                    showItems.splice(configIndex, 0, {
                        type: 'divider',
                        key: 'divder',
                    })
                }
                if (hideItems.length > 0) {
                    return [
                        ...showItems,
                        {
                            label: (
                                <Items
                                    SelectedIcon={EllipsisColored}
                                    CurrentIcon={EllipsisOutlined}
                                    selectedKey={selectedKey}
                                    currentKey="more"
                                    title={__('更多')}
                                />
                            ),
                            key: 'more',
                            children: hideItems
                                .filter((item) => item.title)
                                .map((item) => ({
                                    label: item.title,
                                    key: item.key,
                                })),
                            popupClassName: styles['sider-submenu'],
                        },
                    ]
                }
                return showItems
            }
        }
        const configIndex = findIndex(
            items,
            (item) => item.key === 'config-center',
        )
        if (configIndex !== -1 && configIndex !== 0) {
            items.splice(configIndex, 0, {
                type: 'divider',
                key: 'divder',
            })
        }
        return items
    }, [size?.height, selectedKey, messageInfo, menus?.length])

    /**
     * 获取选中菜单的路径
     * @returns 路径
     */
    const getDefaultSelectKey = () => {
        const pathnameArr: string[] = pathname.split('/')
        if (menuItems.find((item) => item?.key === pathnameArr[1])) {
            setSelectedKey([pathnameArr[1]])
        } else {
            setSelectedKey([pathnameArr[1], 'more'])
        }
    }

    // const getConfigCenterFirstUrl = () => {
    //     const result: string[] = [
    //         accessScene.config_architecture,
    //         accessScene.config_role,
    //         accessScene.datasource,
    //         accessScene.config_pipeline,
    //         accessScene.audit_process,
    //         accessScene.audit_strategy,
    //         accessScene.config_apps,
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

    const handleMenuClick = (item) => {
        const { key, keyPath } = item
        setSelectedKey(keyPath)
        if (key === 'config-center') {
            const firstUrl = findFirstPathByModule(key)
            navigate(firstUrl)
        } else {
            const firstUrl = findFirstPathByKeys([key])
            navigate(firstUrl)
        }
    }

    useEffect(() => {
        getDefaultSelectKey()
    }, [pathname])

    return (
        <AntdSider width={96} className={styles.sider} ref={ref}>
            <Menu
                mode="vertical"
                defaultOpenKeys={selectedKey}
                selectedKeys={selectedKey}
                className={styles.menu}
                items={menuItems}
                onClick={handleMenuClick}
            />
        </AntdSider>
    )
}

export default AssetCenterSider
