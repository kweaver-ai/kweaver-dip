import {
    Button,
    Col,
    Drawer,
    Row,
    Space,
    Form,
    Radio,
    Input,
    message,
} from 'antd'
import { FC, useState } from 'react'
import __ from '../locale'
import { AuditDataType, AuditDataTypeLabel, AuditType } from '../const'
import styles from './styles.module.less'
import LabelTitle from '../LabelTitle'
import { formatTime } from '@/utils'
import ViewDetail from '../ApplicationManage/ViewDetail'
import { formatError, getAuditInfo, putDocAudit } from '@/core'

interface AuditingProps {
    auditData: any
    auditType: string
    onClose: () => void
    open: boolean
    onUpdateList: () => void
}

/**
 * 审核组件
 * @param {string} auditDataId - 审核数据ID
 * @param {AuditType} auditType - 审核类型
 * @returns
 */
const Auditing: FC<AuditingProps> = ({
    auditData,
    auditType,
    onClose,
    open,
    onUpdateList,
}) => {
    // 加载状态
    const [loading, setLoading] = useState<boolean>(false)

    // 表单
    const [form] = Form.useForm()

    // 详情ID
    const [detailOpen, setDetailOpen] = useState<boolean>(false)

    /**
     * 提交审核
     * @param values 表单数据
     */
    const handleFinish = async (values) => {
        // 提交审核
        try {
            const res = await getAuditInfo(auditData.proc_inst_id)
            await putDocAudit({
                id: auditData.proc_inst_id,
                task_id: res.task_id,
                audit_idea: values.audit_result === 1,
                audit_msg: values.description,
                attachments: [],
            })
            onUpdateList()
            onClose()
        } catch (err) {
            message.error(err.data.cause)
        }
    }

    return (
        <Drawer
            title={
                auditType === AuditType.APP_REPORT_ESCALATE
                    ? __('应用上报申请审核')
                    : __('应用申请审核')
            }
            open={open}
            push={false}
            onClose={onClose}
            maskClosable={false}
            width={700}
            footer={
                <div className={styles.drawerFootWrapper}>
                    <Space size={8}>
                        <Button onClick={onClose} className={styles.btn}>
                            {__('取消')}
                        </Button>
                        <Button
                            onClick={() => {
                                form.submit()
                            }}
                            type="primary"
                            className={styles.btn}
                            disabled={loading}
                        >
                            {__('确定')}
                        </Button>
                    </Space>
                </div>
            }
        >
            <div className={styles.auditingContainer}>
                <LabelTitle label={__('应用信息')} />
                <div className={styles.rawContainer}>
                    <Row gutter={[0, 8]}>
                        <Col span={4}>
                            <span className={styles.detailLabel}>
                                {__('应用名称：')}
                            </span>
                        </Col>
                        <Col span={20}>{auditData?.name || '--'}</Col>
                        <Col span={4}>
                            <span className={styles.detailLabel}>
                                {__('类型：')}
                            </span>
                        </Col>
                        <Col span={20}>
                            <span>
                                {auditType === AuditType.APP_REPORT_ESCALATE
                                    ? __('上报')
                                    : AuditDataTypeLabel[
                                          auditData?.type ||
                                              AuditDataType.CREATE
                                      ] || '--'}
                            </span>
                        </Col>
                        <Col span={4}>
                            <span className={styles.detailLabel}>
                                {__('申请时间：')}
                            </span>
                        </Col>
                        <Col span={20}>{formatTime(auditData?.updated_at)}</Col>
                        <Col span={4}>
                            <span className={styles.detailLabel}>
                                {__('详情：')}
                            </span>
                        </Col>
                        <Col span={20}>
                            <Button
                                type="link"
                                onClick={() => {
                                    setDetailOpen(true)
                                }}
                            >
                                {__('查看全部')}
                            </Button>
                        </Col>
                    </Row>
                </div>
            </div>
            <div className={styles.auditingContainer}>
                <LabelTitle label={__('审核信息')} />
                <div className={styles.rawContainer}>
                    <Form form={form} layout="vertical" onFinish={handleFinish}>
                        <Form.Item
                            name="audit_result"
                            label={__('审核意见')}
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择审核意见'),
                                },
                            ]}
                        >
                            <Radio.Group>
                                <Radio value={1}>{__('通过')}</Radio>
                                <Radio value={2}>{__('驳回')}</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item name="description" label={__('备注')}>
                            <Input.TextArea
                                placeholder={__('请输入备注')}
                                maxLength={255}
                                style={{ height: 100, resize: `none` }}
                                autoSize={false}
                                showCount
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>
            {detailOpen && (
                <ViewDetail
                    appId={auditData.id}
                    onClose={() => {
                        setDetailOpen(false)
                    }}
                    open={detailOpen}
                    dataVersion="editing"
                />
            )}
        </Drawer>
    )
}

export default Auditing
