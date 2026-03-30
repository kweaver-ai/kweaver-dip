import { Checkbox, Form, Input, Modal, Table } from 'antd'
import React, { useEffect, useState } from 'react'
import { cloneDeep } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { PassOrReject } from './const'
import { Authority } from './Details/const'
import { IImplAchv } from '@/core'

interface IDataSourceItem {
    name: string
    key: string
    result: string
}
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

interface IAddImplementResult {
    open: boolean
    onClose: () => void
    getImplementRes: (data: any) => void
    authority: string[]
    initAuthority?: IImplAchv
}
const AddImplementResult: React.FC<IAddImplementResult> = ({
    open,
    onClose,
    getImplementRes,
    authority,
    initAuthority,
}) => {
    const [form] = Form.useForm()
    const [dataSource, setDataSource] = useState<IDataSourceItem[]>([
        {
            name: __('读取'),
            key: Authority.Read,
            result: '',
        },
    ])

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
        form.setFieldsValue({ remark: initAuthority?.remark || '' })
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
            render: (result, record, index) => (
                <Checkbox
                    checked={record.result === PassOrReject.Pass}
                    onClick={() => {
                        const temp = cloneDeep(dataSource)
                        temp[index].result =
                            !temp[index].result ||
                            temp[index].result === PassOrReject.Reject
                                ? PassOrReject.Pass
                                : temp[index].result === PassOrReject.Pass
                                ? ''
                                : PassOrReject.Reject
                        // 勾选下载的“允许”后，连带勾选 读取的“允许”
                        if (
                            temp[index].result === PassOrReject.Pass &&
                            temp[index].key === Authority.Download
                        ) {
                            temp[index - 1].result = PassOrReject.Pass
                        }
                        setDataSource(temp)
                    }}
                />
            ),
        },
        {
            title: __('拒绝'),
            dataIndex: 'result',
            key: 'result',
            render: (result, record, index) => (
                <Checkbox
                    checked={record.result === PassOrReject.Reject}
                    onClick={() => {
                        const temp = cloneDeep(dataSource)
                        temp[index].result =
                            !temp[index].result ||
                            temp[index].result === PassOrReject.Pass
                                ? PassOrReject.Reject
                                : temp[index].result === PassOrReject.Reject
                                ? ''
                                : PassOrReject.Pass
                        // 勾选读取的“拒绝”后，连带勾选 下载的“拒绝”
                        if (
                            temp[index].result === PassOrReject.Reject &&
                            temp[index].key === Authority.Read &&
                            authority.includes(Authority.Download)
                        ) {
                            temp[index + 1].result = PassOrReject.Reject
                        }
                        setDataSource(temp)
                    }}
                />
            ),
        },
    ]

    const handleOk = async () => {
        let values
        if (dataSource.find((item) => item.result === PassOrReject.Reject)) {
            values = await form.validateFields()
        }
        getImplementRes({
            authority_apply_result: dataSource.map((item) => ({
                authority: item.key,
                result: item.result,
            })),
            remark: values?.remark || '',
        })

        onClose()
    }

    return (
        <Modal
            title={__('添加实施结果')}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            bodyStyle={{ paddingTop: 16 }}
        >
            <div className={styles['add-implement-res-wrapper']}>
                <div className={styles.title}>{__('授予权限')}</div>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                />
                {dataSource.find(
                    (item) => item.result === PassOrReject.Reject,
                ) && (
                    <Form form={form} layout="vertical" className={styles.form}>
                        <Form.Item
                            label={__('请说明拒绝理由')}
                            required
                            name="remark"
                            rules={[
                                {
                                    required: true,
                                    message: __('请说明拒绝理由'),
                                },
                            ]}
                        >
                            <Input.TextArea maxLength={300} showCount />
                        </Form.Item>
                    </Form>
                )}
            </div>
        </Modal>
    )
}
export default AddImplementResult
