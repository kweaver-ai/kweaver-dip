import { useState, useEffect, useMemo } from 'react'
import { Button, Drawer, Form, Input, message, Radio, Table } from 'antd'
import classnames from 'classnames'
import { v4 as uuidv4 } from 'uuid'
import { pick } from 'lodash'
import {
    getAuditDetails,
    putDocAudit,
    formatError,
    getDataPushDetail,
    IPushAuditListItem,
} from '@/core'
import __ from '../locale'
import {
    DataPushAction,
    DataPushOperation,
    ScheduleType,
    scheduleTypeMap,
} from '../const'
import styles from './styles.module.less'
import { basicInfo } from './helper'
import { GroupHeader } from '../helper'
import DetailsGroup from '../Details/DetailsGroup'
import DataPushDrawer from '../DataPushDrawer'

interface IAuditDrawer {
    open: boolean
    auditData?: IPushAuditListItem
    onClose: (refresh?: boolean) => void
}

const AuditDrawer = ({ open, auditData, onClose }: IAuditDrawer) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [detailInfo, setDetailInfo] = useState<any>()
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        if (open && auditData) {
            getDataPushDetails()
        } else {
            form.resetFields()
        }
    }, [auditData, open])

    const versionDataConfig = [
        {
            key: 'schedule_type',
            name: '类型',
            render: (value, record) => scheduleTypeMap[value]?.text || '--',
        },
        {
            key: 'schedule_time',
            name: '指定时间',
            hidden: (record) => record.schedule_type === ScheduleType.Periodic,
            render: (value, record) => value || __('立即执行'),
        },
        {
            key: 'plan_date',
            name: '计划日期',
            hidden: (record) => record.schedule_type !== ScheduleType.Periodic,
            render: (value, record) => {
                return (
                    <span>
                        {record.schedule_start || '--'}
                        <span className={styles.arrow}> ⇀ </span>
                        {record.schedule_end || '--'}
                    </span>
                )
            },
        },
        {
            key: 'crontab_expr',
            name: '调度规则',
            hidden: (record) => record.schedule_type !== ScheduleType.Periodic,
        },
    ]

    // 版本对比数据组装
    const versionData = useMemo(() => {
        if (auditData?.audit_operation === DataPushOperation.Change) {
            // 版本变更数据组装
            const before = pick(detailInfo, [
                'schedule_type',
                'schedule_time',
                'schedule_start',
                'schedule_end',
                'crontab_expr',
            ])
            const current = detailInfo.schedule_draft || {}
            return versionDataConfig
                .filter((item) => !item.hidden?.(current))
                .map((item) => {
                    if (item.key === 'plan_date') {
                        if (
                            current.schedule_start !== before.schedule_start ||
                            current.schedule_end !== before.schedule_end
                        ) {
                            return {
                                field: (
                                    <span
                                        className={classnames(
                                            styles.baseCell,
                                            styles.change,
                                        )}
                                    >
                                        {item.name}
                                    </span>
                                ),
                                current_version: (
                                    <span
                                        className={classnames(
                                            styles.baseCell,
                                            styles.change,
                                        )}
                                    >
                                        {item.render
                                            ? item.render(
                                                  current[item.key],
                                                  current,
                                              )
                                            : current[item.key] || '--'}
                                    </span>
                                ),
                                before_version: (
                                    <span
                                        className={classnames(
                                            styles.baseCell,
                                            styles.before,
                                            styles.change,
                                        )}
                                    >
                                        {item.render
                                            ? item.render(
                                                  before[item.key],
                                                  before,
                                              )
                                            : before[item.key] || '--'}
                                    </span>
                                ),
                            }
                        }
                        return {
                            field: (
                                <span className={styles.baseCell}>
                                    {item.name}
                                </span>
                            ),
                            current_version: (
                                <span className={styles.baseCell}>
                                    {item.render
                                        ? item.render(
                                              current[item.key],
                                              current,
                                          )
                                        : current[item.key] || '--'}
                                </span>
                            ),
                            before_version: (
                                <span
                                    className={classnames(
                                        styles.baseCell,
                                        styles.before,
                                    )}
                                >
                                    {item.render
                                        ? item.render(before[item.key], before)
                                        : before[item.key] || '--'}
                                </span>
                            ),
                        }
                    }
                    if (current[item.key] !== before[item.key]) {
                        return {
                            field: (
                                <span
                                    className={classnames(
                                        styles.baseCell,
                                        styles.change,
                                    )}
                                >
                                    {item.name}
                                </span>
                            ),
                            current_version: (
                                <span
                                    className={classnames(
                                        styles.baseCell,
                                        styles.change,
                                    )}
                                >
                                    {item.render
                                        ? item.render(
                                              current[item.key],
                                              current,
                                          )
                                        : current[item.key] || '--'}
                                </span>
                            ),
                            before_version: (
                                <span
                                    className={classnames(
                                        styles.baseCell,
                                        styles.before,
                                        styles.change,
                                    )}
                                >
                                    {item.render
                                        ? item.render(before[item.key], before)
                                        : before[item.key] || '--'}
                                </span>
                            ),
                        }
                    }
                    return {
                        field: (
                            <span className={styles.baseCell}>{item.name}</span>
                        ),
                        current_version: (
                            <span className={styles.baseCell}>
                                {item.render
                                    ? item.render(current[item.key], current)
                                    : current[item.key] || '--'}
                            </span>
                        ),
                        before_version: (
                            <span
                                className={classnames(
                                    styles.baseCell,
                                    styles.before,
                                )}
                            >
                                {item.render
                                    ? item.render(before[item.key], before)
                                    : before[item.key] || '--'}
                            </span>
                        ),
                    }
                })
        }
        return []
    }, [detailInfo])

    // 获取详情
    const getDataPushDetails = async () => {
        try {
            const res = await getDataPushDetail(auditData!.data_push_id)
            setDetailInfo({
                ...auditData,
                ...res,
                show_all: (
                    <a onClick={() => setShowDetails(true)}>{__('查看全部')}</a>
                ),
            })
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const onFinish = async () => {
        if (!auditData) {
            return
        }
        try {
            setLoading(true)
            await form.validateFields()
            const { audit_idea, audit_msg } = form.getFieldsValue()
            const res = await getAuditDetails(auditData.proc_inst_id)
            await putDocAudit({
                id: auditData.proc_inst_id,
                task_id: res?.task_id,
                audit_idea,
                audit_msg,
                attachments: [],
            })
            message.success(__('审核完成'))
            onClose(true)
        } catch (e) {
            if (e?.errorFields?.length > 0) {
                return
            }
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer
            title={__('数据推送申请审核')}
            placement="right"
            push={false}
            onClose={() => onClose()}
            open={open}
            width={640}
            maskClosable={false}
            className={styles.auditDrawer}
            footer={[
                <Button onClick={() => onClose()} key="cancel">
                    {__('取消')}
                </Button>,
                <Button
                    type="primary"
                    onClick={onFinish}
                    loading={loading}
                    key="confirm"
                >
                    {__('确定')}
                </Button>,
            ]}
        >
            <div className={styles.auditDrawer_details}>
                <GroupHeader text={basicInfo.title} />
                <div className={styles.group}>
                    <DetailsGroup
                        config={basicInfo.content}
                        data={detailInfo}
                        labelWidth="110px"
                    />
                </div>
                {versionData.length > 0 && (
                    <>
                        <GroupHeader text={__('变更内容')} />
                        <span className={styles.version_change_title}>
                            {__('调度计划')}
                        </span>
                        <div className={styles.group}>
                            <Table
                                dataSource={versionData}
                                columns={[
                                    {
                                        title: __('字段'),
                                        dataIndex: 'field',
                                        key: 'field',
                                    },
                                    {
                                        title: __('当前版本'),
                                        dataIndex: 'current_version',
                                        key: 'current_version',
                                    },
                                    {
                                        title: __('变更前版本'),
                                        dataIndex: 'before_version',
                                        key: 'before_version',
                                    },
                                ]}
                                rowKey={() => uuidv4()}
                                className={styles.versionTable}
                                pagination={false}
                                bordered
                            />
                        </div>
                    </>
                )}
            </div>
            <Form
                name="reviewe"
                form={form}
                layout="vertical"
                wrapperCol={{ span: 24 }}
                autoComplete="off"
                className={styles.auditDrawer_form}
            >
                <Form.Item
                    label={__('审核意见')}
                    name="audit_idea"
                    required
                    rules={[
                        {
                            required: true,
                            message: __('请选择'),
                        },
                    ]}
                >
                    <Radio.Group>
                        <Radio value>{__('通过')}</Radio>
                        <Radio value={false}>{__('驳回')}</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) =>
                        prev.audit_idea !== cur.audit_idea
                    }
                >
                    {({ getFieldValue }) => {
                        const auditIdea = getFieldValue('audit_idea')
                        return (
                            <Form.Item
                                name="audit_msg"
                                required={auditIdea === false}
                                rules={[
                                    {
                                        required: auditIdea === false,
                                        message: __('输入不能为空'),
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    style={{
                                        height: 100,
                                        resize: 'none',
                                    }}
                                    maxLength={300}
                                    placeholder={
                                        auditIdea === false
                                            ? __('请输入（必填）')
                                            : __('请输入')
                                    }
                                    showCount
                                />
                            </Form.Item>
                        )
                    }}
                </Form.Item>
            </Form>
            {showDetails ? (
                <DataPushDrawer
                    operate={DataPushAction.Detail}
                    dataPushId={auditData?.data_push_id}
                    open={showDetails}
                    onClose={() => {
                        setShowDetails(false)
                    }}
                />
            ) : null}
        </Drawer>
    )
}

export default AuditDrawer
