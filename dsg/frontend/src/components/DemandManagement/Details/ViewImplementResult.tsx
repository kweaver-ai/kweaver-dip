import { Modal, Table, Checkbox } from 'antd'
import React, { useEffect, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import { IImplAchv } from '@/core'
import { Authority } from './const'
import { PassOrReject } from '../const'

const initDataSource = [
    {
        name: __('读取'),
        key: Authority.Read,
        result: '',
    },
    {
        name: __('下载'),
        key: Authority.Download,
        result: '',
    },
]
interface IDataSourceItem {
    name: string
    key: string
    result: string
}

interface IViewImplementResult {
    open: boolean
    onClose: () => void
    authority: string[]
    initAuthority?: IImplAchv
}
const ViewImplementResult: React.FC<IViewImplementResult> = ({
    open,
    onClose,
    authority,
    initAuthority,
}) => {
    const [dataSource, setDataSource] = useState<IDataSourceItem[]>([
        {
            name: __('读取'),
            key: Authority.Read,
            result: '',
        },
    ])
    const [remark, setRemark] = useState('')
    useEffect(() => {
        const data = initDataSource
            .filter((item) => authority.includes(item.key))
            .map((item) => {
                if (initAuthority) {
                    const res = initAuthority.authority_apply_result.find(
                        (au) => au.authority === item.key,
                    )
                    return { ...item, result: res?.result || '' }
                }
                return item
            })
        setDataSource(data)
        setRemark(initAuthority?.remark || '')
    }, [authority, initAuthority])

    const columns = [
        {
            title: __('权限'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: __('允许'),
            dataIndex: 'result',
            key: 'result',
            render: (result) => (
                <Checkbox checked={result === PassOrReject.Pass} disabled />
            ),
        },
        {
            title: __('拒绝'),
            dataIndex: 'result',
            key: 'result',
            render: (result) => (
                <Checkbox checked={result === PassOrReject.Reject} disabled />
            ),
        },
    ]
    return (
        <Modal
            title={__('查看实施结果')}
            width={640}
            open={open}
            onCancel={onClose}
            footer={null}
            bodyStyle={{ maxHeight: 425, overflow: 'auto' }}
        >
            <div className={styles['view-implement-result-wrapper']}>
                <div className={styles['grant-authority-title']}>
                    {__('授予权限')}
                </div>
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                />
                {remark && (
                    <>
                        <div className={styles['reject-reason-title']}>
                            {__('拒绝理由')}
                        </div>
                        <div className={styles['reject-reason']}>{remark}</div>
                    </>
                )}
            </div>
        </Modal>
    )
}

export default ViewImplementResult
