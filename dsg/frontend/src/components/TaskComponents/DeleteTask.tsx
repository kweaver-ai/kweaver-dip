import React, { useMemo, useState } from 'react'
import { message } from 'antd'
import Confirm from '../Confirm'
import {
    formatError,
    myTaskBatchDelete,
    myTaskDelete,
    TaskStatus,
} from '@/core'
import __ from './locale'

type resolveData = {
    id?: string
    name?: string
    ids?: string[]
}

interface DeleteTaskType {
    projectId: string
    taskId?: string
    tasks?: any[] // 批量删除
    onClose: (data?: resolveData) => void
}

const DeleteTask = ({
    projectId,
    taskId,
    tasks = [],
    onClose,
}: DeleteTaskType) => {
    const [loading, setLoading] = useState<boolean>(false)

    // 是否包含已完成的任务
    const hasCompletedTask = useMemo(
        () => tasks.some((item) => item.status === TaskStatus.COMPLETED),
        [tasks],
    )

    const deleteTask = async () => {
        try {
            setLoading(true)
            if (tasks?.length) {
                const ids = tasks
                    .filter((item) => item.status !== TaskStatus.COMPLETED)
                    .map((item) => item.id)
                await myTaskBatchDelete(ids)
                onClose({ ids })
            } else if (taskId) {
                const { id, name } = await myTaskDelete(taskId)
                onClose({
                    id,
                    name,
                })
            }
            setLoading(false)
            message.success(__('删除成功'))
        } catch (ex) {
            setLoading(false)
            formatError(ex)
        }
    }

    return (
        <Confirm
            onOk={() => {
                deleteTask()
            }}
            onCancel={() => {
                onClose()
            }}
            open
            title={
                tasks?.length > 0
                    ? __('确定要删除这些任务吗？')
                    : __('确定要删除该任务吗？')
            }
            content={
                <>
                    <div style={{ marginBottom: 4 }}>
                        {tasks?.length > 0
                            ? __('这些任务删除后将无法找回，请谨慎操作!')
                            : __('该任务删除后将无法找回，请谨慎操作!')}
                    </div>
                    {hasCompletedTask && (
                        <div style={{ color: 'rgb(0 0 0 / 45%)' }}>
                            {__('注：已完成的任务无法删除，将为您自动跳过。')}
                        </div>
                    )}
                </>
            }
            width={432}
            okText={__('确定')}
            cancelText={__('取消')}
            okButtonProps={{ loading }}
        />
    )
}

export default DeleteTask
