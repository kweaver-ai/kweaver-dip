import React from 'react'
import { SelectProps, Select } from 'antd'
import styles from './styles.module.less'
import {
    getTaskTypeIcon,
    TaskTypeLabel,
} from '@/components/TaskComponents/helper'
import __ from '../locale'

/**
 * 任务类型组件
 * @param label
 */
export const TaskTypeContent: React.FC<{
    label: string
}> = ({ label }) => {
    return (
        <div className={styles.taskTypeLabelWrapper}>
            {getTaskTypeIcon(label)}
            <span className={styles.text}>{TaskTypeLabel[label]}</span>
        </div>
    )
}

interface ITaskTypeSelect extends SelectProps {
    data: any[] | undefined
}

/**
 * 任务类型选择组件
 * @param data 任务类型集
 */
export const TaskTypeSelect: React.FC<ITaskTypeSelect> = ({
    data,
    loading,
    ...props
}) => {
    return (
        <Select
            placeholder={__('请选择任务类型')}
            options={
                data && data.length > 0
                    ? data.map((t) => {
                          return {
                              value: t,
                              label: <TaskTypeContent label={t} />,
                          }
                      })
                    : undefined
            }
            notFoundContent={
                <div
                    style={{
                        color: 'rgba(0, 0, 0, 0.85)',
                    }}
                >
                    {__('请先选择任务所在阶段/节点')}
                </div>
            }
            getPopupContainer={(node) => node.parentNode}
            {...props}
        />
    )
}
