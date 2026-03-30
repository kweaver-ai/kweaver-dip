import { Button } from 'antd'
import React from 'react'
import styles from './styles.module.less'
import __ from './locale'
import { Loader } from '@/ui'
import { IRoleDetails } from '@/core'
import RoleAvatar from '@/components/UserManagement/RoleAvatar'

// 模式
export enum Mode {
    // 查看
    View = 'view',
    // 编辑
    Edit = 'edit',
}

// 表单初始值
export const initialValues = {
    deadline_time: 30,
    deadline_reminder: __('【工单名称 (工单编号)】已到截止时间，请及时处理！'),
    beforehand_time: 5,
    beforehand_reminder: __(
        '【工单名称 (工单编号)】距离截止时间仅剩 X 天，请及时处理！',
    ),
}

// 底部按钮
interface FooterButtonsProps {
    // 模式
    mode: Mode
    // 编辑
    handleEdit: () => void
    // 保存
    handleSubmit: () => void
    // 重置
    handleReset?: () => void
    // 是否显示重置
    showReset?: boolean
    // 是否禁用保存
    submitDisabled?: boolean
    // 保存禁用提示
    submitDisabledTips?: string
}

// 底部按钮
export const FooterButtons: React.FC<FooterButtonsProps> = ({
    mode,
    handleEdit,
    handleSubmit,
    handleReset = () => {},
    showReset = true,
    submitDisabled = false,
    submitDisabledTips = '',
}) => {
    return (
        <div className={styles.messageSetFooter}>
            {mode === Mode.View ? (
                <Button type="primary" onClick={handleEdit}>
                    {__('编辑')}
                </Button>
            ) : (
                <>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        disabled={submitDisabled}
                        title={submitDisabledTips}
                    >
                        {__('保存')}
                    </Button>
                    {showReset && (
                        <Button onClick={handleReset}>{__('重置')}</Button>
                    )}
                </>
            )}
        </div>
    )
}

// 详情展示中的分组样式
export const DetailGroupTitle = ({
    title,
    tips,
    children,
}: {
    title: string
    tips?: string
    children?: React.ReactNode
}) => {
    return (
        <div className={styles.detailGroupWrapper}>
            <div className={styles.detailGroupTitle}>
                {title}
                {children}
            </div>
            <div className={styles.detailGroupTips}>{tips}</div>
        </div>
    )
}

/**
 * 加载中
 */
export const renderLoader = (marginTop: number = 104) => (
    <div style={{ marginTop, width: '100%' }}>
        <Loader />
    </div>
)

export interface CascaderOption {
    value: string
    label: React.ReactNode
    children?: CascaderOption[]
    isLeaf?: boolean
    role?: IRoleDetails
}

// 渲染带头像的角色选项
const renderRoleOption = (role: IRoleDetails) => (
    <span className={styles.cascaderOptionWithAvatar}>
        <RoleAvatar role={role} size={20} fontSize={12} />
        <span className={styles.cascaderOptionLabel}>{role.name}</span>
    </span>
)

// 构建级联选项
export const buildCascaderOptions = (
    roles: IRoleDetails[],
): CascaderOption[] => {
    const internalRoles = roles.filter((role) => role.type === 'Internal')
    const customRoles = roles.filter((role) => role.type === 'Custom')

    const cascaderOptions: CascaderOption[] = []

    if (internalRoles.length > 0) {
        cascaderOptions.push({
            value: 'Internal',
            label: __('内置角色'),
            children: internalRoles.map((role) => ({
                value: role.id,
                label: renderRoleOption(role),
                isLeaf: true,
                role,
            })),
        })
    }

    if (customRoles.length > 0) {
        cascaderOptions.push({
            value: 'Custom',
            label: __('自定义角色'),
            children: customRoles.map((role) => ({
                value: role.id,
                label: renderRoleOption(role),
                isLeaf: true,
                role,
            })),
        })
    }

    return cascaderOptions
}
