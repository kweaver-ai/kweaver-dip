import React, { HTMLAttributes } from 'react'
import { Select } from 'antd'
import { SelectProps } from 'antd/es/select'
import styles from './styles.module.less'
import __ from '../MyTask/locale'
import { taskPriorityInfos } from './helper'
import { TaskPriority } from '@/core'

interface IPriorityLabel extends HTMLAttributes<HTMLDivElement> {
    label: string
    color: string
}

/**
 * 任务优先级组件
 * @param label 文本
 * @param color 颜色
 * @param bdColor 边框色
 */
export const PriorityLabel: React.FC<IPriorityLabel> = ({
    label,
    color,
    ...props
}) => {
    return (
        <div className={styles.priorityLabelWrapper} {...props}>
            <div
                className={styles.pl_icon}
                style={{ background: `${color}` }}
            />
            <div className={styles.pl_title}>{label}</div>
        </div>
    )
}

interface IPrioritySelect extends SelectProps {}

/**
 * 任务优先级选择组件
 */
export const PrioritySelect: React.FC<IPrioritySelect> = ({ ...props }) => {
    return (
        <Select
            placeholder={__('请选择任务优先级')}
            options={[
                TaskPriority.URGENT,
                TaskPriority.EMERGENT,
                TaskPriority.COMMON,
            ].map((info) => {
                return {
                    label: (
                        <PriorityLabel
                            label={taskPriorityInfos[info].label}
                            color={taskPriorityInfos[info].color}
                        />
                    ),
                    value: info,
                }
            })}
            getPopupContainer={(node) => node.parentNode}
            {...props}
        />
    )
}
