import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Badge, Button, Dropdown, Space, Tooltip } from 'antd'
import { OptionMenuType } from '../const'
import __ from '../locale'

export interface menuTypes {
    key: string
    label: string | React.ReactNode
    menuType: OptionMenuType
    isNeedBadge?: boolean
    disabled?: boolean
    title?: string
    children?: Array<menuTypes>
}
interface OptionBarToolType {
    menus: Array<menuTypes>
    onClick: (
        key: string,
        event:
            | React.MouseEvent<HTMLElement, MouseEvent>
            | React.KeyboardEvent<HTMLElement>,
    ) => void
    // 更多按钮显示的展开方向
    placement?:
        | 'bottomRight'
        | 'topLeft'
        | 'topCenter'
        | 'topRight'
        | 'bottomLeft'
        | 'bottomCenter'
        | 'top'
        | 'bottom'
        | undefined
    getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement
}

const OptionBarTool = ({
    menus,
    onClick,
    placement = 'bottomRight',
    getPopupContainer,
}: OptionBarToolType) => {
    // 显示按钮
    const [menusData, setMenuData] = useState<Array<menuTypes>>([])
    // 下拉菜单
    const [moreData, setMoreData] = useState<Array<menuTypes>>([])
    useEffect(() => {
        setMenuData(
            menus.filter((menu) => menu.menuType === OptionMenuType.Menu),
        )
        setMoreData(
            menus.filter((menu) => menu.menuType === OptionMenuType.More),
        )
    }, [menus])

    return (
        <Space size={12}>
            {menusData.map((menuData, index) => (
                <Badge
                    status="error"
                    offset={[0, 5]}
                    dot={menuData.isNeedBadge}
                    key={index}
                >
                    <Tooltip title={menuData.title}>
                        <Button
                            type="link"
                            onClick={(e) => {
                                onClick(menuData.key, e)
                            }}
                            disabled={menuData.disabled}
                            style={{ height: '22px' }}
                        >
                            {menuData.label}
                        </Button>
                    </Tooltip>
                </Badge>
            ))}
            {moreData.length ? (
                <Dropdown
                    placement={placement}
                    trigger={['click']}
                    menu={{
                        onClick: ({ key, domEvent }) => {
                            onClick(key, domEvent)
                        },
                        items: moreData.map(({ menuType, ...other }) => other),
                    }}
                    getPopupContainer={getPopupContainer}
                >
                    <Button type="link" style={{ height: '22px' }}>
                        {__('更多')}
                    </Button>
                </Dropdown>
            ) : null}
        </Space>
    )
}

export default React.memo(OptionBarTool)
