import React, { useEffect, useState } from 'react'
import { InfoCircleFilled } from '@ant-design/icons'
import __ from './locale'
import Confirm from '../Confirm'
import { OperateType } from '@/utils'

interface IConfirmOnline {
    open: boolean
    onOk: () => void
    onCancel: () => void
    type: OperateType
}

const ConfirmOnline: React.FC<IConfirmOnline> = ({
    open,
    onOk,
    onCancel,
    type,
}) => {
    const [confirmTitle, setConfirmTitle] =
        useState<string>('确认要发起上线审核吗？')
    const [confirmContent, setConfirmContent] =
        useState<string>('当前操作会触发上线审核流程。')

    useEffect(() => {
        if (type === OperateType.ONLINE) {
            setConfirmTitle(__('确定要上线资源吗?'))
            setConfirmContent(__('上线成功后，资源上线到服务超市。'))
        } else if (type === OperateType.OFFLINE) {
            setConfirmTitle(__('确定要下线资源吗?'))
            setConfirmContent(__('下线成功后，资源将从服务超市下线。'))
        } else if (type === OperateType.PUBLISH) {
            setConfirmTitle(__('确定要发布资源吗?'))
            setConfirmContent(
                __('发布成功后，可点击【上线】按钮，进行上线操作。'),
            )
        }
    }, [type])

    return (
        <Confirm
            open={open}
            title={confirmTitle}
            content={confirmContent}
            onOk={onOk}
            icon={
                <InfoCircleFilled
                    style={{ color: '#3A8FF0', fontSize: '22px' }}
                />
            }
            onCancel={onCancel}
            width={432}
        />
    )
}

export default ConfirmOnline
