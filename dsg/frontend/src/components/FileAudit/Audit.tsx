import { useState, useEffect, useMemo } from 'react'
import { Drawer, Form, Input, Radio, Table } from 'antd'
import { useUpdateEffect } from 'ahooks'
import DetailsLabel from '@/ui/DetailsLabel'
import {
    getAuditDetails,
    putDocAudit,
    formatError,
    getFileResourceList,
    IAttachmentListItem,
    getFileAttachmentPreviewPdf,
} from '@/core'
import { formatTime } from '@/utils'
import {
    DrawerFooter,
    DetailGroupTitle,
    refreshDetails,
    FileAuditOperate,
    initSearch,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { Empty, OptionBarTool, OptionMenuType } from '@/ui'

interface IAudit {
    open: boolean
    item: any
    onAuditSuccess: () => void
    onAuditClose: () => void
}

const Audit = ({ open, item, onAuditSuccess, onAuditClose }: IAudit) => {
    // 附件列表
    const [tableData, setTableData] = useState<IAttachmentListItem[]>([])
    // 附件总数
    const [total, setTotal] = useState(0)
    // 加载中
    const [loading, setLoading] = useState(false)
    // 搜索条件
    const [searchCondition, setSearchCondition] = useState<any>()

    const [form] = Form.useForm()

    useEffect(() => {
        if (open) {
            form.resetFields()
        }
    }, [open])

    useEffect(() => {
        // 初始化搜索条件
        setSearchCondition(initSearch)
    }, [])

    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取附件列表
    const getTableList = async (params: any) => {
        try {
            setLoading(true)
            const res = await getFileResourceList(
                item?.file_resource_id,
                params,
            )
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 预览
    const handlePreview = async (record) => {
        try {
            const { href_url } = await getFileAttachmentPreviewPdf({
                id: record.id,
                preview_id: record.preview_oss_id,
            })
            window.open(href_url, '_blank')
        } catch (error) {
            formatError(error)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        switch (key) {
            case FileAuditOperate.Preview:
                handlePreview(record)
                break
            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = (record) => {
        const optionMenus = [
            {
                key: FileAuditOperate.Preview,
                label: __('预览'),
                menuType: OptionMenuType.Menu,
            },
        ]

        return optionMenus
    }

    const columns: any = useMemo(() => {
        const commonProps = {
            ellipsis: true,
            render: (value) => value || '--',
        }

        const cols = [
            {
                title: __('文件名称'),
                dataIndex: 'name',
                key: 'name',
                ...commonProps,
            },
            {
                title: __('文件类型'),
                dataIndex: 'type',
                key: 'type',
                ...commonProps,
            },
            {
                title: __('文件大小'),
                dataIndex: 'size',
                key: 'size',
                ...commonProps,
            },
            {
                title: __('上传时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                width: '200px',
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: '80px',
                fixed: 'right',
                render: (_, record) => {
                    return (
                        <OptionBarTool
                            menus={getTableOptions(record) as any[]}
                            onClick={(key, e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOptionTable(key, record)
                            }}
                        />
                    )
                },
            },
        ]
        return cols
    }, [])

    const onPaginationChange = (page: number, pageSize: number) => {
        setSearchCondition({
            ...searchCondition,
            offset: page,
            limit: pageSize,
        })
    }

    // 提交审核
    const onFinish = async (values) => {
        const { audit_idea, audit_msg } = values
        try {
            const res = await getAuditDetails(item?.id)
            await putDocAudit({
                id: item?.id,
                task_id: res?.task_id,
                audit_idea,
                audit_msg,
                attachments: [],
            })
            onAuditSuccess()
        } catch (e) {
            formatError(e)
        }
    }

    // 提交审核
    const handleClickSubmit = async () => {
        try {
            await form.validateFields()
            form.submit()
        } catch (error) {
            // console.log(error)
        }
    }

    return (
        <Drawer
            title={__('文件审核')}
            placement="right"
            onClose={onAuditClose}
            open={open}
            width={800}
            maskClosable={false}
            footer={
                <DrawerFooter
                    onClose={onAuditClose}
                    onSubmit={handleClickSubmit}
                />
            }
        >
            <>
                <DetailGroupTitle title={__('基本信息')} />
                <DetailsLabel
                    wordBreak
                    detailsList={refreshDetails({
                        actualDetails: item,
                    })}
                    labelWidth="130px"
                    style={{ paddingLeft: 12 }}
                />
            </>
            <DetailGroupTitle title={__('附件清单')} />
            <Table
                columns={columns}
                dataSource={tableData}
                loading={loading}
                rowKey="id"
                rowClassName={styles.tableRow}
                scroll={{
                    y: `120px`,
                }}
                pagination={{
                    total,
                    pageSize: searchCondition?.limit,
                    current: searchCondition?.offset,
                    showQuickJumper: true,
                    onChange: (page, pageSize) =>
                        onPaginationChange(page, pageSize),
                    showSizeChanger: true,
                    showTotal: (count) => __('共${count}条', { count }),
                }}
                locale={{ emptyText: <Empty /> }}
            />
            <>
                <DetailGroupTitle title={__('审核信息')} />
                <Form
                    name="reviewe"
                    form={form}
                    layout="vertical"
                    wrapperCol={{ span: 24 }}
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    autoComplete="off"
                    className={styles.auditForm}
                >
                    <Form.Item
                        label={__('审核意见')}
                        name="audit_idea"
                        initialValue
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <Radio.Group>
                            <Radio value>{__('通过')}</Radio>
                            <Radio value={false}>{__('驳回')}</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item name="audit_msg">
                        <Input.TextArea
                            style={{
                                height: 100,
                                resize: 'none',
                            }}
                            maxLength={300}
                            placeholder={__('请输入')}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </>
        </Drawer>
    )
}

export default Audit
