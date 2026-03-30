import * as React from 'react'
import { useState } from 'react'
import { message } from 'antd'
import Confirm from '@/components/Confirm'
import { formatError, myTaskDelete } from '@/core'
import __ from './locale'

type resolveData = {
    id?: string
    name?: string
}

interface DeleteTaskType {
    projectId: string
    taskId: string
    onClose: (data?: resolveData) => void
}

const DeleteTask = ({ projectId, taskId, onClose }: DeleteTaskType) => {
    const [loading, setLoading] = useState<boolean>(false)

    const deleteTask = async () => {
        try {
            setLoading(true)
            const { id, name } = await myTaskDelete(taskId)
            onClose({
                id,
                name,
            })
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
            title={__('确定要删除该任务吗？')}
            content={__('该任务删除后将无法找回，请谨慎操作!')}
            width={432}
            okText={__('确定')}
            cancelText={__('取消')}
            okButtonProps={{ loading }}
        />
    )
}

export default DeleteTask
