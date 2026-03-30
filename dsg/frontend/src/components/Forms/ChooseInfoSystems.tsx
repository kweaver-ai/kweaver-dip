import React, { useEffect, useState } from 'react'
import { Button, Form, message, Modal, Select, Space } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import { trim } from 'lodash'
import styles from './styles.module.less'
import { Architecture, DataNode } from '../BusinessArchitecture/const'
import {
    formatError,
    getObjects,
    ICoreBusinessDetails,
    updateCoreBusiness,
} from '@/core'
import __ from './locale'

interface IChooseInfoSystems {
    open: boolean
    onClose: (isClose?: boolean) => void
    cbDetails?: ICoreBusinessDetails
    openImportFromDS: () => void
    taskId: string
}
const ChooseInfoSystems: React.FC<IChooseInfoSystems> = ({
    open,
    onClose,
    cbDetails,
    openImportFromDS,
    taskId,
}) => {
    const [form] = Form.useForm()
    const [systems, setSystems] = useState<DataNode[]>([])

    const getSystems = async () => {
        try {
            const res = await getObjects({
                limit: 0,
                id: '',
                is_all: true,
                type: Architecture.BSYSTEM,
            })
            setSystems(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (open) {
            getSystems()
        } else {
            setSystems([])
            form.resetFields()
        }
    }, [open])

    const onFinish = async (values) => {
        // 调用编辑业务模型的接口
        if (!cbDetails || !cbDetails?.main_business_id) return
        try {
            await updateCoreBusiness(
                {
                    ...values,
                    ...cbDetails,
                    task_id: taskId,
                },
                cbDetails?.main_business_id,
            )
            message.success(__('保存成功'))
            onClose()
            openImportFromDS()
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Modal
            open={open}
            footer={null}
            closable={false}
            maskClosable={false}
            width={432}
            getContainer={false}
            bodyStyle={{ padding: 0 }}
        >
            <div className={styles.chooseInfoSysWrapper}>
                <InfoCircleFilled className={styles.tipIcon} />
                <div className={styles.title}>{__('无可选数据源')}</div>
                <div className={styles.tips}>
                    {__(
                        '仅支持选择业务模型关联的信息系统中的数据源本业务模型暂未关联信息系统，请先配置',
                    )}
                </div>
                <Form form={form} onFinish={onFinish}>
                    <Form.Item
                        noStyle
                        shouldUpdate={(pre, cur) =>
                            pre.business_system_id !== cur.business_system_id
                        }
                    >
                        {({ getFieldValue }) => {
                            const bSystem = getFieldValue('business_system_id')
                            return (
                                <Form.Item
                                    name="business_system_id"
                                    className={styles.infoSysSelect}
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择信息系统'),
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder={__('请选择信息系统')}
                                        mode="multiple"
                                        maxTagCount={99}
                                        showSearch
                                        filterOption={(input, option) => {
                                            return (
                                                option?.children
                                                    ?.toString()
                                                    .toLowerCase()
                                                    .includes(
                                                        trim(
                                                            input.toLowerCase(),
                                                        ),
                                                    ) || false
                                            )
                                        }}
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                        allowClear
                                        maxTagTextLength={20}
                                        notFoundContent={
                                            <div className={styles.noData}>
                                                {__('暂无数据')}
                                            </div>
                                        }
                                    >
                                        {systems.map((sys) => (
                                            <Select.Option
                                                value={sys.id}
                                                key={sys.id}
                                                disabled={
                                                    bSystem?.length === 99 &&
                                                    !bSystem?.includes(sys.id)
                                                }
                                            >
                                                {sys.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                </Form>
                <Space size={12}>
                    <Button onClick={() => onClose(true)}>{__('关闭')}</Button>
                    <Button type="primary" onClick={() => form.submit()}>
                        {__('保存配置')}
                    </Button>
                </Space>
            </div>
        </Modal>
    )
}

export default ChooseInfoSystems
