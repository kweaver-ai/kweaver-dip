import React, { useState, useCallback, useEffect } from 'react'
import { Button, Dropdown, DropdownProps, Menu, MenuProps, Tooltip } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import { SortDirection } from '@/core/apis/common.d'
import { FontIcon, SortOutlined } from '@/icons'
import styles from './styles.module.less'

/**
 * @interface
 * @description 菜单数据
 * @param {string} key 排序的字段
 * @param {string} label 菜单项名称
 * @param {React.ReactNode} icon 菜单图标配置
 * @param {SortDirection} sort 排序方式
 */
interface IMenuData {
    key: string
    label?: string | React.ReactNode
    icon?: React.ReactNode
    sort?: SortDirection
}

/**
 * @interface
 * @description 下拉筛选组件
 * @param {IMenuData[]} menus 排序的选项
 * @param {IMenuData} defaultMenu 默认排序的选项及方式
 * @param {IMenuData} changeMenu
 * @param {React.ReactNode} Icon 图标配置
 * @param {(value: IMenuData) => void} menuChangeCb 点击菜单的回调
 */
interface IDropDownFilter extends DropdownProps {
    menus: IMenuData[]
    defaultMenu: IMenuData
    changeMenu?: IMenuData
    Icon?: React.ReactNode
    menuChangeCb: (value: IMenuData) => void
    getIsShowFilter?: (isShow: boolean) => void
    text?: string
    textStyle?: any
    tips?: string
    showTips?: Boolean
    customItems?: IMenuData[]
}

const DropDownFilter: React.FC<IDropDownFilter> = ({
    menus,
    defaultMenu,
    changeMenu,
    Icon = <FontIcon name="icon-paixu" />,
    menuChangeCb = () => {},
    getIsShowFilter = () => {},
    text,
    textStyle = {},
    tips = '排序',
    showTips = true,
    customItems = [],
    ...props
}) => {
    // 选中菜单项的参数
    const [selectedMenu, setSelectedMenu] = useState<IMenuData>(
        customItems.length > 0
            ? {
                  key: customItems[0].key,
                  sort: SortDirection.ASC,
              }
            : {
                  key: defaultMenu.key,
                  sort: defaultMenu.sort || SortDirection.ASC,
              },
    )
    const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)
    const handleMenuClick = ({ key }) => {
        const temp: IMenuData = { ...selectedMenu }
        if (key === selectedMenu.key) {
            temp.sort =
                selectedMenu.sort === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC
        } else {
            temp.key = key
            temp.sort = SortDirection.ASC
        }
        setSelectedMenu(temp)
        getIsShowFilter(false)
    }

    const getMenuIcon = useCallback(
        (menu) => {
            if (
                selectedMenu.key === menu.key &&
                menu.sort !== SortDirection.NONE
            ) {
                if (selectedMenu.sort === SortDirection.ASC) {
                    return <ArrowUpOutlined />
                }
                return <ArrowDownOutlined />
            }
            return <span />
        },
        [selectedMenu],
    )

    useUpdateEffect(() => {
        if (!changeMenu) {
            menuChangeCb(selectedMenu)
        }
    }, [selectedMenu])

    useUpdateEffect(() => {
        if (changeMenu) {
            setSelectedMenu(changeMenu)
        }
    }, [changeMenu])

    // 菜单项
    const items: MenuProps['items'] = menus.map((menu) => ({
        ...menu,
        icon: getMenuIcon(menu),
    }))

    return (
        <Dropdown
            menu={{
                items: [...customItems, ...items],
                selectedKeys: [selectedMenu.key],
                onClick: handleMenuClick,
            }}
            placement="bottomLeft"
            trigger={['click']}
            className={styles.filterContainer}
            onOpenChange={(open) => {
                getIsShowFilter(open)
            }}
            {...props}
        >
            <div className={styles.filterWrapper} style={{ ...textStyle }}>
                {text ? (
                    <span style={{ marginLeft: 8, marginRight: 5 }}>
                        {Icon}
                    </span>
                ) : (
                    <Tooltip
                        placement="bottom"
                        open={showTips && tooltipOpen}
                        title={tips}
                    >
                        <Button
                            type="text"
                            icon={Icon}
                            onClick={() => setTooltipOpen(false)}
                            onMouseEnter={() => setTooltipOpen(true)}
                            onMouseLeave={() => setTooltipOpen(false)}
                        />
                    </Tooltip>
                )}
                {text && <span className={styles.filterText}>{text}</span>}
            </div>
        </Dropdown>
    )
}
export default DropDownFilter
