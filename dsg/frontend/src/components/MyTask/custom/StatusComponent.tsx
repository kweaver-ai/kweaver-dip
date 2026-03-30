import React, { useEffect, useState } from 'react'
import { Select, SelectProps } from 'antd'
import { isNumber } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { formatError, TaskType, getStdTaskProcess, TaskStatus } from '@/core'

/**
 * 任务状态文本组件
 * @param label 文本
 * @param color 颜色
 * @param bgColor 背景色
 */
export const StatusLabel: React.FC<{
    label: string
    color: string
    bgColor: string
    status?: string
    taskId?: string
    taskType?: string
}> = ({ label, color, bgColor, status, taskId, taskType }) => {
    // 任务进度
    const [taskProgress, setTaskProgress] = useState('')

    useEffect(() => {
        getTaskProgress()
    }, [taskId])

    // 获取任务进度-标准任务
    const getTaskProgress = async () => {
        if (
            taskType !== TaskType.FIELDSTANDARD ||
            !taskId ||
            status !== TaskStatus.ONGOING
        )
            return
        try {
            const { data } = await getStdTaskProcess(taskId)
            const progressRadio =
                isNumber(data.finish_number) && isNumber(data.total_number)
                    ? ` (${data.finish_number}/${data.total_number})`
                    : ''

            setTaskProgress(progressRadio)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles.statusLabelWrapper}>
            <div
                className={styles.statusLabelBg}
                style={{ color: `${color}`, backgroundColor: `${bgColor}` }}
            >
                <span className={styles.statusLabel}>
                    {label + taskProgress}
                </span>
            </div>
        </div>
    )
}

interface IStatusSelect extends SelectProps {
    taskId?: string
    taskType?: string
    taskStatus?: string
    statusArr: any[]
    disabledArr: any[]
}
/**
 * 任务状态选择组件
 * @param statusArr 选项值
 * @param disabledArr 不可用值
 */
export const StatusSelect: React.FC<IStatusSelect> = ({
    taskId,
    taskType,
    taskStatus,
    statusArr,
    disabledArr,
    ...props
}) => {
    // 展示的选项
    const [showArr, setShowArr] = useState<any[]>([])
    // 任务进度
    const [taskProgress, setTaskProgress] = useState('')

    useEffect(() => {
        getTaskProgress()
    }, [taskId])

    // 获取任务进度-标准任务
    const getTaskProgress = async () => {
        if (taskType !== TaskType.FIELDSTANDARD || !taskId) return
        try {
            const { data } = await getStdTaskProcess(taskId)
            const progressRadio =
                isNumber(data.finish_number) && isNumber(data.total_number)
                    ? ` (${data.finish_number}/${data.total_number})`
                    : ''

            setTaskProgress(progressRadio)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        setShowArr(
            statusArr.filter((s) =>
                disabledArr.every((item) => s.num !== item),
            ),
        )
    }, [disabledArr])

    return (
        <Select
            placeholder={__('请选择任务状态')}
            options={showArr.map((info) => {
                return {
                    label: (
                        <StatusLabel
                            label={
                                info.label +
                                (info.value === taskStatus ? taskProgress : '')
                            }
                            color={info.color}
                            bgColor={info.backgroundColor}
                            status={taskStatus}
                        />
                    ),
                    value: info.value,
                }
            })}
            getPopupContainer={(node) => node.parentNode}
            {...props}
        />
    )
}
