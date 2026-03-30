import React, { useState, useEffect, useMemo } from 'react'
import { Modal, Input, Form, message, ModalProps, Select } from 'antd'
import __ from '../locale'
import {
    formatError,
    getSSZDDataSource,
    IShareApplyBasic,
    putShareApplySub,
} from '@/core'
import DetailsGroup from '../Details/DetailsGroup'
import { resourceInfo } from './const'
import { ApplyResource } from '../const'
import styles from './styles.module.less'

interface ISubscribeModal extends ModalProps {
    data?: IShareApplyBasic
    open: boolean
    onOk: () => void
}

/**
 * 订阅资源
 */
const SubscribeModal = ({ data, open, onOk, ...props }: ISubscribeModal) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)
    const [dataOriginLoading, setDataOriginLoading] = useState<boolean>(false)
    // 数据源数据
    const [dataOriginOptions, setDataOriginOptions] = useState<any[]>([])

    // 资源类型
    const rsrc: any = useMemo(() => data?.resource_type, [data])

    useEffect(() => {
        if (open) {
            getDataOriginOptions()
        } else {
            setDataOriginOptions([])
        }
        form.resetFields()
    }, [open])

    // 获取数据源
    const getDataOriginOptions = async () => {
        if (![ApplyResource.Database, ApplyResource.File].includes(rsrc)) return
        try {
            setDataOriginLoading(true)
            const res = await getSSZDDataSource(
                rsrc === ApplyResource.Database ? 'db' : 'fs',
            )
            setDataOriginOptions(res?.entries || [])
        } catch (e) {
            formatError(e)
        } finally {
            setDataOriginLoading(false)
        }
    }

    // 订阅请求
    const handleOk = async () => {
        if (!data?.id) return
        try {
            setLoading(true)
            await form.validateFields()
            const values = form.getFieldsValue()
            await putShareApplySub(data.id, values)
            message.success(__('订阅资源成功'))
            onOk()
        } catch (e) {
            if (e.errorFields) {
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            width={600}
            open={open}
            title={__('订阅资源')}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            okText={__('提交')}
            cancelText={__('取消')}
            okButtonProps={{ loading, style: { minWidth: 80 } }}
            cancelButtonProps={{ style: { minWidth: 80 } }}
            onOk={() => handleOk()}
            bodyStyle={{ minHeight: 247, padding: 0 }}
            {...props}
        >
            <div className={styles.subscribeModal}>
                <DetailsGroup
                    config={resourceInfo}
                    data={data}
                    style={{ margin: '12px 20px' }}
                />
                {[ApplyResource.Database, ApplyResource.File].includes(
                    rsrc,
                ) && (
                    <>
                        <div className={styles.divide} />
                        <Form
                            form={form}
                            layout="vertical"
                            autoComplete="off"
                            className={styles.form}
                        >
                            {[
                                ApplyResource.Database,
                                ApplyResource.File,
                            ].includes(rsrc) && (
                                <Form.Item
                                    name="data_source_id"
                                    label={
                                        rsrc === ApplyResource.File
                                            ? __('SFTP数据源')
                                            : __('数据源')
                                    }
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                rsrc === ApplyResource.File
                                                    ? __('SFTP数据源不能为空')
                                                    : __('数据源不能为空'),
                                        },
                                    ]}
                                >
                                    <Select
                                        options={dataOriginOptions}
                                        placeholder={__('请选择')}
                                        fieldNames={{
                                            label: 'ds_name',
                                            value: 'id',
                                        }}
                                        loading={dataOriginLoading}
                                        notFoundContent={
                                            dataOriginLoading
                                                ? ''
                                                : __('暂无数据')
                                        }
                                    />
                                </Form.Item>
                            )}
                            {rsrc === ApplyResource.File && (
                                <Form.Item
                                    label={__('文件存储目录')}
                                    name="file_path"
                                    validateFirst
                                    rules={[
                                        {
                                            required: true,
                                            message: __('文件存储目录不能为空'),
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        placeholder={__('请输入')}
                                        autoSize={{
                                            minRows: 3,
                                            maxRows: 3,
                                        }}
                                        showCount
                                        maxLength={255}
                                    />
                                </Form.Item>
                            )}
                        </Form>
                    </>
                )}
            </div>
        </Modal>
    )
}

export default SubscribeModal
