import React, { useRef, memo, useCallback, useState } from 'react'
import { Dropdown, type MenuProps } from 'antd'
import { useHover, useClickAway } from 'ahooks'
import classnames from 'classnames'
import FontIcon from '@/icons/FontIcon'
import styles from './styles.module.less'
import __ from '../locale'

interface IItemViewProps {
    // 节点数据
    node: any
    // 添加子节点
    handleAddChild: (node: any) => void
    // 重命名节点
    handleRename: (node: any) => void
    // 删除节点
    handleDelete: (node: any) => void
    // 是否选中（仅用于样式显示）
    isSelected?: boolean
}

/**
 * 场景分析分类树节点组件
 */
const ItemView = memo<IItemViewProps>(
    ({
        node,
        handleAddChild,
        handleRename,
        handleDelete,
        isSelected = false,
    }: IItemViewProps) => {
        // 是否打开菜单
        const [dropdownOpen, setDropdownOpen] = useState(false)

        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)
        const clickRef = useRef<HTMLDivElement>(null)

        /**
         * 处理菜单点击事件
         */
        const handleMenuClick = (e, key) => {
            e?.domEvent?.preventDefault()
            e?.domEvent?.stopPropagation()

            switch (key) {
                case 'add':
                    handleAddChild(node)
                    setDropdownOpen(false)
                    break
                case 'delete':
                    handleDelete(node)
                    setDropdownOpen(false)
                    break
                case 'rename':
                    handleRename(node)
                    setDropdownOpen(false)
                    break
                default:
                    break
            }
        }

        const menuItems: MenuProps['items'] = [
            {
                key: 'add',
                label: __('新建子分类'),
                onClick: (e) => {
                    handleMenuClick(e, 'add')
                },
            },
            {
                key: 'rename',
                label: __('重命名'),
                onClick: (e) => {
                    handleMenuClick(e, 'rename')
                },
            },
            {
                key: 'delete',
                label: __('删除'),
                onClick: (e) => {
                    handleMenuClick(e, 'delete')
                },
            },
        ]

        useClickAway(() => {
            if (dropdownOpen) {
                setDropdownOpen(false)
            }
        }, clickRef)

        return (
            <div
                ref={ref}
                className={classnames(
                    styles.itemviewWrapper,
                    isSelected && styles.selected,
                )}
            >
                <div
                    className={styles.itemviewWrapperNodename}
                    title={node?.catalog_name}
                >
                    <span className={styles.catlgName}>
                        {node?.catalog_name}
                    </span>
                </div>
                <span
                    ref={clickRef}
                    className={classnames(
                        styles.menuBtnWrapper,
                        (isHovering || dropdownOpen) && styles.visible,
                    )}
                >
                    <Dropdown
                        menu={{ items: menuItems }}
                        placement="bottomRight"
                        open={dropdownOpen}
                        overlayStyle={{
                            minWidth: 120,
                        }}
                    >
                        <div
                            className={classnames(
                                styles.menuBtn,
                                dropdownOpen && styles.active,
                            )}
                            onClick={(e) => {
                                setDropdownOpen(!dropdownOpen)
                            }}
                            title={__('操作')}
                        >
                            <FontIcon name="icon-gengduo1" />
                        </div>
                    </Dropdown>
                </span>
            </div>
        )
    },
)

ItemView.displayName = 'ItemView'

export default ItemView
