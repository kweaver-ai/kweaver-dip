import * as React from 'react'
import { useState, useEffect } from 'react'
import { Dropdown, DropdownProps } from 'antd'
import { isNumber } from 'lodash'
import { StatusDomPregress, getStatusItems, IStatusDom } from './helper'
import styles from './styles.module.less'
import { formatError, TaskType, getStdTaskProcess } from '@/core'

interface StatusSelectType {
    disabled?: boolean
    taskId?: string
    taskType?: string
    status: string
    width?: number | string
    dropPlacement?: DropdownProps['placement']
    onChange: (status: string) => void
}

const StatusSelect = ({
    disabled = false,
    taskId,
    taskType,
    status,
    width,
    dropPlacement,
    onChange,
}: StatusSelectType) => {
    const [statusBorder, setStatusBorder] = useState<string>('')
    const [statusItem, setStatusItem] = useState<any>(getStatusItems(status))
    // 任务进度
    const [taskProgress, setTaskProgress] = useState('')
    const [statusDomEnums, setStatusDomEnums] = useState<IStatusDom>(
        StatusDomPregress(),
    )

    useEffect(() => {
        setTaskProgress('')
        if (taskType !== TaskType.FIELDSTANDARD || !taskId) {
            setTaskProgress('')
        } else {
            getTaskProgress(taskId)
        }
    }, [taskId])

    useEffect(() => {
        if (status) {
            setStatusDomEnums(StatusDomPregress(taskProgress, status))
            setStatusItem(getStatusItems(status, taskProgress))
        }
    }, [taskProgress, status])

    // 获取任务进度-标准任务
    const getTaskProgress = async (id: string) => {
        try {
            const { data } = await getStdTaskProcess(id)
            const progressRadio =
                isNumber(data.finish_number) && isNumber(data.total_number)
                    ? ` (${data.finish_number}/${data.total_number})`
                    : ''
            setTaskProgress(progressRadio)
        } catch (error) {
            formatError(error)
        }
    }

    return status === 'completed' ? (
        <div
            style={{ cursor: disabled ? 'not-allowed' : 'unset', width }}
            onClick={(e) => e.stopPropagation()}
        >
            {statusDomEnums.completed}
        </div>
    ) : (
        <Dropdown
            menu={{
                items: statusItem,
                onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation()
                    onChange(key)
                    setStatusBorder('')
                },
            }}
            trigger={['click']}
            placement={dropPlacement || 'bottom'}
            onOpenChange={(open) => {
                if (open) {
                    setStatusBorder('1px solid #126EE3')
                } else {
                    setStatusBorder('')
                }
            }}
            disabled={disabled}
        >
            <div
                className={
                    disabled ? styles.selectedItemDisabled : styles.selectedItem
                }
                style={
                    statusBorder ? { border: statusBorder, width } : { width }
                }
                onClick={(e) => e.stopPropagation()}
            >
                {statusDomEnums[status]}
            </div>
        </Dropdown>
    )
}

export default StatusSelect
