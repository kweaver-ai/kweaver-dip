import React, { useState, useMemo } from 'react'
import { Avatar, Checkbox, Tooltip, Dropdown, MenuProps } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import { formatTime } from '@/utils'
import { IAgentItem } from '@/core'
import AgentAvatar from './AgentAvatar'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import SelectCategory from './SelectCategory'

interface AssistantCardProps {
    /** 助手数据 */
    data: IAgentItem
    /** 点击回调 */
    onClick?: (data: IAgentItem) => void
    /** 下架回调 */
    onRemove?: (id: string) => void
    /** 是否可选择（多选模式） */
    selectable?: boolean
    /** 是否选中 */
    selected?: boolean
    /** 选择回调 */
    onSelect?: (id: string, selected: boolean) => void
    /** 是否禁用 */
    disabled?: boolean
    /** 禁用时的提示文字 */
    disabledTooltip?: string
    /** 权限对象（可扩展） */
    permissions?: {
        offline?: boolean
        classify?: boolean
        [key: string]: boolean | undefined
    }
}

const Card: React.FC<AssistantCardProps> = ({
    data,
    onClick,
    onRemove,
    selectable = false,
    selected = false,
    onSelect,
    disabled = false,
    disabledTooltip,
    permissions = {},
}) => {
    // 关联分类弹窗状态
    const [categoryModalOpen, setCategoryModalOpen] = useState(false)

    // 处理下架助手
    const handleRemoveAssistant = (id: string) => {
        ReturnConfirmModal({
            title: __('确定要下架助手吗?'),
            content: __('下架后用户将不能再从智能问数进行访问。'),
            okText: __('确定'),
            cancelText: __('取消'),

            onOK: () => {
                onRemove?.(id)
            },
        })
    }

    // 处理关联分类
    const handleCategory = (id: string) => {
        setCategoryModalOpen(true)
    }

    // 卡片操作菜单配置（可扩展，每个菜单项关联一个权限）
    const menuConfig = [
        {
            key: 'category',
            label: __('关联分类'),
            permission: 'classify',
            onClick: (cardId: string) => handleCategory(cardId),
        },
        {
            key: 'remove',
            label: __('下架助手'),
            permission: 'offline',
            onClick: (cardId: string) => handleRemoveAssistant(cardId),
        },
    ] as const

    // 根据权限过滤菜单项
    const getCardMenuItems = (cardId: string): MenuProps['items'] => {
        return menuConfig
            .filter((item) => permissions[item.permission])
            .map((item) => ({
                key: item.key,
                label: item.label,
                onClick: ({ domEvent }: { domEvent: Event }) => {
                    domEvent.stopPropagation()
                    item.onClick(cardId)
                },
            })) as unknown as MenuProps['items']
    }

    // 判断是否有可用菜单项（有一个或以上权限时显示 Dropdown）
    const hasAvailableMenuItems = useMemo(() => {
        return menuConfig.some((item) => permissions[item.permission])
    }, [permissions])

    // 处理卡片点击
    const handleCardClick = () => {
        if (disabled || categoryModalOpen) return
        if (selectable) {
            onSelect?.(data.id, !selected)
        } else {
            onClick?.(data)
        }
    }

    // 处理 Checkbox 点击
    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (disabled) return
        onSelect?.(data.id, !selected)
    }

    // 禁用状态下复选框显示为选中，但实际不参与选择
    const isChecked = disabled || selected

    return (
        <div
            className={classnames(styles.assistantCard, {
                [styles.selectable]: selectable,
                [styles.selected]: selected,
                [styles.disabled]: disabled,
            })}
            onClick={handleCardClick}
        >
            {/* 多选框 */}
            {selectable &&
                (disabled && disabledTooltip ? (
                    <Tooltip title={disabledTooltip} placement="bottom">
                        <span className={styles.cardCheckbox}>
                            <Checkbox checked={isChecked} disabled={disabled} />
                        </span>
                    </Tooltip>
                ) : (
                    <Checkbox
                        className={styles.cardCheckbox}
                        checked={isChecked}
                        onClick={handleCheckboxClick}
                    />
                ))}

            {/* 卡片主体：图标 + 标题描述 */}
            <div className={styles.cardBody}>
                {/* 图标 */}
                <AgentAvatar
                    avatarType={data.avatar_type}
                    avatar={data.avatar}
                    name={data.name}
                />

                {/* 内容区域 */}
                <div className={styles.cardContent}>
                    <div className={styles.cardTitle} title={data.name || '--'}>
                        {data.name || '--'}
                    </div>
                    <div
                        className={styles.cardDescription}
                        title={data.profile || '--'}
                    >
                        {data.profile || '--'}
                    </div>
                </div>
            </div>

            {/* 底部：用户信息 + 操作 */}
            <div className={styles.cardFooter}>
                <div className={styles.footerLeft}>
                    <Avatar size={16} className={styles.avatar}>
                        {data.published_by_name?.[0] || 'U'}
                    </Avatar>
                    <span
                        title={data.published_by_name || '--'}
                        className={styles.userName}
                    >
                        {data.published_by_name || '--'}
                    </span>
                    <span
                        title={formatTime(data.published_at) || '--'}
                        className={styles.publishTime}
                    >
                        {__('发布时间')}：
                        {formatTime(data.published_at) || '--'}
                    </span>
                </div>
                {/* 操作菜单（非多选模式且有一个或以上权限时显示 Dropdown） */}
                {!selectable && hasAvailableMenuItems && (
                    <Dropdown
                        menu={{
                            items: getCardMenuItems(data.af_agent_id),
                        }}
                        trigger={['click']}
                        placement="bottomLeft"
                    >
                        <div
                            className={styles.cardOperation}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <EllipsisOutlined
                                style={{
                                    fontSize: '20px',
                                    color: 'rgba(0, 0, 0)',
                                }}
                            />
                        </div>
                    </Dropdown>
                )}
            </div>
            <SelectCategory
                open={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                agent={data}
            />
        </div>
    )
}

export default Card
