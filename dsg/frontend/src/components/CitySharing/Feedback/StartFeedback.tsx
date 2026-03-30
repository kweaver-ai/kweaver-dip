import {
    Button,
    DatePicker,
    Drawer,
    Form,
    Input,
    message,
    Popconfirm,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { useEffect, useState } from 'react'
import { ExclamationCircleFilled } from '@ant-design/icons'
import __ from '../locale'
import { CommonTitle } from '@/ui'
import { ApplierView, MultiColumn, SubTitle } from '../helper'
import styles from './styles.module.less'
import { formatError, startFeedback } from '@/core'

interface StartFeedbackProps {
    data: any[]
    open: boolean
    onClose: () => void
    onOk: () => void
}
const StartFeedback = ({ data, open, onClose, onOk }: StartFeedbackProps) => {
    const [form] = Form.useForm()
    const [dataSource, setDataSource] = useState<any[]>([])

    useEffect(() => {
        setDataSource(data)
    }, [data])

    const columns = [
        {
            title: __('申请名称（编码）'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 260,
            render: (value, record) => <MultiColumn record={record} />,
        },
        {
            title: __('申请部门'),
            dataIndex: 'apply_org_name',
            key: 'apply_org_name',
            ellipsis: true,
            render: (value, record) => (
                <span title={record.apply_org_path}>{value}</span>
            ),
        },
        {
            title: (
                <SubTitle title={__('申请人')} subTitle={__('（联系电话）')} />
            ),
            dataIndex: 'applier',
            key: 'applier',
            ellipsis: true,
            render: (value, record) => <ApplierView data={record} />,
        },
        {
            title: __('申请资源个数'),
            dataIndex: 'view_num',
            key: 'view_num',
            ellipsis: true,
            render: (value, record) => value + record.api_num || '--',
        },
        {
            title: __('操作'),
            dataIndex: 'operation',
            key: 'operation',
            render: (value, record) => (
                <Popconfirm
                    title={__('确认移除吗？')}
                    icon={
                        <ExclamationCircleFilled style={{ color: '#1890FF' }} />
                    }
                    onConfirm={() =>
                        setDataSource(
                            dataSource.filter((item) => item.id !== record.id),
                        )
                    }
                >
                    <Button type="link">{__('移除')}</Button>
                </Popconfirm>
            ),
        },
    ]

    const onFinish = async (values: any) => {
        try {
            await startFeedback({
                share_apply_ids: dataSource.map((item) => item.id),
                feedback_finish_date: values.feedback_finish_date.valueOf(),
                feedback_remark: values.feedback_remark,
            })
            onClose()
            onOk()
            message.success(__('提交成功'))
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={__('发起成效反馈')}
            width={1000}
            footer={
                <Space className={styles['start-feedback-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Tooltip
                        title={
                            dataSource.length === 0
                                ? __('请添加申请单后再提交')
                                : ''
                        }
                    >
                        <Button
                            type="primary"
                            disabled={dataSource.length === 0}
                            onClick={() => form.submit()}
                        >
                            {__('提交')}
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <div className={styles['start-feedback-wrapper']}>
                <Form
                    form={form}
                    layout="vertical"
                    autoComplete="off"
                    onFinish={onFinish}
                >
                    <div className={styles['common-title']}>
                        <CommonTitle title={__('基本信息')} />
                    </div>
                    <Form.Item
                        label={__('截至时间')}
                        name="feedback_finish_date"
                        required
                        rules={[{ required: true, message: __('请选择') }]}
                    >
                        <DatePicker className={styles['date-picker']} />
                    </Form.Item>
                    <Form.Item
                        label={__('反馈说明')}
                        name="feedback_remark"
                        required
                        rules={[{ required: true, message: __('请输入') }]}
                    >
                        <Input.TextArea
                            maxLength={500}
                            className={styles.textarea}
                            placeholder={__('请输入')}
                        />
                    </Form.Item>
                </Form>
                <div className={styles['common-title']}>
                    <CommonTitle title={__('关联共享申请单')} />
                </div>
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    pagination={{ hideOnSinglePage: data.length < 11 }}
                />
            </div>
        </Drawer>
    )
}

export default StartFeedback
