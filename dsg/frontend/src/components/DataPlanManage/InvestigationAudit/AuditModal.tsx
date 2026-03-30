import { Button, Drawer, Form, Input, message, Radio, Space, Table } from 'antd'
import moment from 'moment'
import { useEffect, useState } from 'react'
import classnames from 'classnames'
import {
    formatError,
    getAuditDetails,
    getInvestigationReportDetail,
    putDocAudit,
} from '@/core'
import DetailModal from '../Investigation/DetailModal'
import { PromptModal } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { AuditOptionType } from './const'
import { convertToPlain } from '../PlanUnderstanding/helper'

interface IAuditModal {
    item: any
    onClose?: (refresh?: boolean) => void
}

const KVMap = {
    data_aggregation_plan_name: '关联计划',
    opinion: '申报意见',
    research_conclusion: '调研结论',
    research_content: '调研内容',
    research_method: '调研方法',
    research_object: '调研对象',
    research_purpose: '调研目的',
}

const Attrs = [
    // 'data_aggregation_plan_name',
    'research_conclusion',
    'research_content',
    'research_method',
    'research_object',
    'research_purpose',
    'opinion',
]

function AuditModal({ item, onClose }: IAuditModal) {
    const [form] = Form.useForm()
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [data, setData] = useState<any>()

    const getDetail = async () => {
        try {
            const res = await getInvestigationReportDetail(item?.id)
            if (
                ['change_auditing', 'change_reject'].includes(res?.audit_status)
            ) {
                const { change_audit, ...rest } = res

                const attrsData = Object.keys(change_audit || {})
                    .filter((k) => Attrs.includes(k))
                    .map((k) => {
                        return change_audit?.[k] === rest?.[k]
                            ? undefined
                            : {
                                  name: KVMap[k],
                                  current:
                                      k === 'research_content'
                                          ? convertToPlain(change_audit?.[k])
                                          : change_audit?.[k],
                                  origin:
                                      k === 'research_content'
                                          ? convertToPlain(rest?.[k])
                                          : rest?.[k],
                              }
                    })
                    .filter((o) => !!o)
                if (attrsData?.length) {
                    setData(attrsData)
                }
            } else {
                setData(undefined)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (item?.id) {
            getDetail()
        }
    }, [item?.id])

    const handleSubmit = async (values) => {
        if (!item) return
        const { audit_idea, audit_msg } = values
        const title = audit_idea ? __('同意') : __('拒绝')
        const content = audit_idea
            ? __('确定同意申请吗？')
            : __('确定拒绝申请吗？拒绝后，审核流程将结束。')

        PromptModal({
            title,
            content,
            async onOk() {
                try {
                    setLoading(true)
                    const res = await getAuditDetails(item?.proc_inst_id)
                    await putDocAudit({
                        id: item.proc_inst_id,
                        task_id: res?.task_id,
                        audit_idea,
                        audit_msg,
                        attachments: [],
                    })
                    onClose?.(true)
                } catch (e) {
                    message.error(e?.data?.cause)
                } finally {
                    setLoading(false)
                }
            },
            onCancel() {},
        })
    }

    const columns = [
        {
            title: '字段',
            key: 'name',
            dataIndex: 'name',
            ellipsis: true,
        },
        {
            title: '当前版本',
            key: 'current',
            dataIndex: 'current',
            ellipsis: true,
        },
        {
            title: '变更前版本',
            key: 'origin',
            dataIndex: 'origin',
            ellipsis: true,
        },
    ]

    return (
        <>
            <Drawer
                open
                title={
                    <span style={{ fontWeight: 550, fontSize: 16 }}>
                        {__('调研报告申请审核')}
                    </span>
                }
                onClose={() => onClose?.()}
                maskClosable={false}
                destroyOnClose
                placement="right"
                width={640}
                bodyStyle={{ padding: '0px' }}
                footer={
                    <div className={styles['audit-modal-footer']}>
                        <Space size={8}>
                            <Button
                                onClick={() => onClose?.()}
                                className={styles.btn}
                            >
                                {__('取消')}
                            </Button>
                            <Button
                                onClick={() => {
                                    form.submit()
                                }}
                                type="primary"
                                className={styles.btn}
                                loading={loading}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <div className={styles['audit-modal-content']}>
                    <div
                        className={classnames(
                            styles['audit-item'],
                            styles['audit-content'],
                        )}
                    >
                        <div className={styles.moduleTitle}>
                            <h4>{__('基本信息')}</h4>
                        </div>
                        <div className={styles['audit-attr']}>
                            <span>{__('调研报告名称')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div
                                    className={styles['dir-title']}
                                    title={item?.name}
                                >
                                    {item?.name || '--'}
                                </div>
                            </div>
                        </div>

                        <div className={styles['audit-attr']}>
                            <span>{__('申请时间')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    {item?.apply_time
                                        ? moment(item?.apply_time).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </div>
                            </div>
                        </div>
                        <div className={styles['audit-attr']}>
                            <span>{__('类型')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    {AuditOptionType.find(
                                        (o) => o.value === item?.audit_type,
                                    )?.label ?? '--'}
                                </div>
                            </div>
                        </div>
                        <div className={styles['audit-attr']}>
                            <span>{__('详情')}:</span>
                            <div className={styles['audit-attr-info']}>
                                <div>
                                    <Button
                                        ghost
                                        type="link"
                                        onClick={() => setPreviewOpen(true)}
                                    >
                                        {__('查看全部')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.moduleTitle} hidden={!data}>
                            <h4>{__('变更内容')}</h4>
                        </div>
                        <div hidden={!data}>
                            <Table
                                columns={columns}
                                dataSource={data}
                                pagination={false}
                            />
                        </div>
                    </div>

                    <div
                        className={styles['audit-item']}
                        style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <Form
                            layout="vertical"
                            form={form}
                            onFinish={(values) => {
                                handleSubmit(values)
                            }}
                            autoComplete="off"
                            scrollToFirstError
                            style={{ marginBottom: '12px' }}
                        >
                            <Form.Item
                                label={__('审核意见')}
                                name="audit_idea"
                                initialValue
                                required
                            >
                                <Radio.Group>
                                    <Radio value>{__('通过')}</Radio>
                                    <Radio value={false}>{__('驳回')}</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item
                                name="audit_msg"
                                style={{ marginBottom: '0px' }}
                            >
                                <Input.TextArea
                                    className={styles['show-count']}
                                    style={{
                                        height: 104,
                                        resize: 'none',
                                    }}
                                    placeholder={__('请输入说明')}
                                    showCount
                                    maxLength={255}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </Drawer>
            {previewOpen && (
                <DetailModal
                    id={item?.id}
                    isAudit
                    onClose={() => {
                        setPreviewOpen(false)
                    }}
                />
            )}
        </>
    )
}

export default AuditModal
