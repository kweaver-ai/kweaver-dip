import React, { useState, useEffect } from 'react'
import {
    Modal,
    Descriptions,
    Tag,
    Tabs,
    Card,
    Timeline,
    Spin,
    Empty,
    Button,
    Space,
} from 'antd'
import {
    HistoryOutlined,
    InfoCircleOutlined,
    SettingOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import { WORK_ORDER_TYPES, TEMPLATE_STATUS } from './const'
import type {
    IWorkOrderTemplatesInfo,
    WorkOrderTemplateVersion,
} from '@/core/apis/taskCenter/index.d'
import {
    getWorkOrderTemplatesDetail,
    getWorkOrderTemplatesVersionList,
    getWorkOrderTemplatesVersionDetail,
} from '@/core/apis/taskCenter'
import styles from './styles.module.less'
import { formatError } from '@/core'

const { TabPane } = Tabs

interface TemplateDetailProps {
    visible: boolean
    template?: IWorkOrderTemplatesInfo | null
    onClose: () => void
}

const TemplateDetail: React.FC<TemplateDetailProps> = ({
    visible,
    template,
    onClose,
}) => {
    const [loading, setLoading] = useState(false)
    const [versions, setVersions] = useState<WorkOrderTemplateVersion[]>([])
    const [versionLoading, setVersionLoading] = useState(false)
    const [selectedVersion, setSelectedVersion] =
        useState<WorkOrderTemplateVersion | null>(null)
    const [versionDetailVisible, setVersionDetailVisible] = useState(false)
    const [versionDetailLoading, setVersionDetailLoading] = useState(false)

    useEffect(() => {
        if (visible && template) {
            loadVersions()
        }
    }, [visible, template])

    const loadVersions = async () => {
        if (!template) return

        setVersionLoading(true)
        try {
            // 调用API获取历史版本
            const response = await getWorkOrderTemplatesVersionList(
                template.id,
                { limit: 99 },
            )
            setVersions((response.entries || []) as any)
        } catch (error) {
            setVersions([] as any)
        } finally {
            setVersionLoading(false)
        }
    }

    const handleViewVersionDetail = async (
        version: WorkOrderTemplateVersion,
    ) => {
        if (!template) return

        setSelectedVersion(version)
        setVersionDetailLoading(true)
        try {
            // 调用API获取版本详情
            const response = await getWorkOrderTemplatesVersionDetail(
                template.id,
                version.version,
            )
            setSelectedVersion({
                ...version,
                ...response,
            })
            setVersionDetailVisible(true)
        } catch (error) {
            formatError(error)
        } finally {
            setVersionDetailLoading(false)
        }
    }

    const getTypeLabel = (type: IWorkOrderTemplatesInfo['template_type']) => {
        const typeConfig = WORK_ORDER_TYPES.find((item) => item.value === type)
        return typeConfig ? typeConfig.label : type
    }

    const getStatusTag = (status: IWorkOrderTemplatesInfo['is_active']) => {
        const statusConfig = TEMPLATE_STATUS.find(
            (item) => item.value === status,
        )
        return <Tag color={statusConfig?.color}>{statusConfig?.label}</Tag>
    }

    const formatTime = (timestamp?: number) => {
        return timestamp
            ? moment(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
            : '--'
    }

    const renderContentField = (key: string, value: any, type?: string) => {
        if (!value) return null

        // 处理不同类型的字段
        if (
            type === 'dateRange' &&
            typeof value === 'string' &&
            value.includes(',')
        ) {
            const dates = value.split(',')
            return dates.join(' 至 ')
        }

        if (type === 'textarea') {
            return (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {value}
                </div>
            )
        }

        return String(value)
    }

    const getContentFields = (content: any, templateType: string) => {
        if (!content) return []

        const fieldMap: Record<string, string> = {
            // 调研工单模板
            research_unit: '调研单位',
            research_content: '调研内容',
            research_purpose: '调研目的',
            research_time: '调研时间',

            // 前置机工单模板
            apply_department: '申请部门',
            frontend_machine_address: '前置机地址',
            apply_requirement: '申请要求',

            // 数据归集工单模板
            // data_source: '数据来源',
            collection_time: '数据采集时间',
            department: '所属部门',
            sync_frequency: '数据同步频率',
            collection_method: '采集方式',
            description: '工单描述',

            // 数据标准化工单模板
            data_source: '数据源',
            data_table: '数据表',
            table_fields: '表字段',
            standard_data_elements: '标准数据元',
            business_table_fields: '业务表字段',
            business_table_standard: '业务表标准',
            remark: '备注信息',
            // description: '工单描述',

            // 数据质量稽核工单模板
            // data_source: '数据源',
            // data_table: '数据表',
            // table_fields: '表字段',
            related_business_rules: '关联业务规则',

            // 数据融合加工工单模板
            source_data_source: '源数据源',
            source_table: '源表',
            target_table: '目标表',
            field_fusion_rules: '字段融合规则',

            // 数据理解工单模板
            work_order_name: '工单名称',
            task_name: '任务名称',
            task_executor: '任务执行人',
            manage_resource_catalog: '管理资源目录',

            // 数据资源编目工单模板
            basic_info: '基本信息',
            info_items: '信息项',
            share_attributes: '共享属性',
        }

        return Object.keys(content)
            .filter((key) => fieldMap[key] && content[key])
            .map((key) => ({
                key,
                label: fieldMap[key],
                value: content[key],
            }))
    }

    if (!template) {
        return null
    }

    return (
        <>
            <Modal
                title="工单模板详情"
                open={visible}
                onCancel={onClose}
                width={1000}
                footer={false}
                bodyStyle={{
                    paddingTop: 2,
                    maxHeight: '70vh',
                    overflowY: 'auto',
                }}
            >
                <Spin spinning={loading}>
                    <div className={styles.detailContent}>
                        <Tabs defaultActiveKey="basic">
                            <TabPane tab={<span>基本信息</span>} key="basic">
                                <Card className={styles.basicCard}>
                                    <Descriptions bordered column={2}>
                                        <Descriptions.Item
                                            label="模板名称"
                                            span={2}
                                        >
                                            {template.template_name}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="工单类型">
                                            {getTypeLabel(
                                                template.template_type,
                                            )}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="版本">
                                            v{template.version}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="引用次数">
                                            {template.reference_count || 0} 次
                                        </Descriptions.Item>
                                        <Descriptions.Item label="状态">
                                            {getStatusTag(template.is_active)}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label="模板描述"
                                            span={2}
                                        >
                                            <div
                                                style={{
                                                    whiteSpace: 'pre-wrap',
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {template.description ||
                                                    '暂无描述'}
                                            </div>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="创建人">
                                            {template.created_by_name}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="创建时间">
                                            {formatTime(template.created_at)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="最后修改人">
                                            {template.updated_by_name}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="最后修改时间">
                                            {formatTime(template.updated_at)}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </TabPane>

                            <TabPane tab={<span>模板内容</span>} key="content">
                                <Card className={styles.contentCard}>
                                    <Descriptions bordered column={1}>
                                        {getContentFields(
                                            template.content,
                                            template.template_type,
                                        ).map((field) => (
                                            <Descriptions.Item
                                                key={field.key}
                                                label={field.label}
                                            >
                                                {renderContentField(
                                                    field.key,
                                                    field.value,
                                                )}
                                            </Descriptions.Item>
                                        ))}
                                        {getContentFields(
                                            template.content,
                                            template.template_type,
                                        ).length === 0 && (
                                            <Descriptions.Item label="内容">
                                                <Empty
                                                    description="暂无内容配置"
                                                    image={
                                                        Empty.PRESENTED_IMAGE_SIMPLE
                                                    }
                                                />
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </Card>
                            </TabPane>

                            <TabPane tab={<span>版本历史</span>} key="versions">
                                <Card className={styles.contentCard}>
                                    <Spin spinning={versionLoading}>
                                        {versions.length > 0 ? (
                                            <Timeline>
                                                {versions.map(
                                                    (version, index) => (
                                                        <Timeline.Item
                                                            key={version.id}
                                                            color={
                                                                index === 0
                                                                    ? 'green'
                                                                    : 'blue'
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.versionItem
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.versionHeader
                                                                    }
                                                                >
                                                                    <Space>
                                                                        <strong>
                                                                            版本{' '}
                                                                            {
                                                                                version.version
                                                                            }
                                                                        </strong>
                                                                    </Space>
                                                                    <span
                                                                        className={
                                                                            styles.versionTime
                                                                        }
                                                                    >
                                                                        (
                                                                        {formatTime(
                                                                            version.created_at,
                                                                        )}
                                                                        )
                                                                    </span>
                                                                    <Button
                                                                        type="link"
                                                                        size="small"
                                                                        onClick={() =>
                                                                            handleViewVersionDetail(
                                                                                version,
                                                                            )
                                                                        }
                                                                        style={{
                                                                            marginLeft: 20,
                                                                        }}
                                                                    >
                                                                        详情
                                                                    </Button>
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.versionInfo
                                                                    }
                                                                >
                                                                    <div>
                                                                        <span>
                                                                            创建人:
                                                                        </span>{' '}
                                                                        {
                                                                            version.created_by_name
                                                                        }
                                                                    </div>
                                                                    {version.description && (
                                                                        <div>
                                                                            <span>
                                                                                描述:
                                                                            </span>{' '}
                                                                            {
                                                                                version.description
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Timeline.Item>
                                                    ),
                                                )}
                                            </Timeline>
                                        ) : (
                                            <Empty description="暂无版本历史" />
                                        )}
                                    </Spin>
                                </Card>
                            </TabPane>
                        </Tabs>
                    </div>
                </Spin>
            </Modal>

            {/* 版本详情弹窗 */}
            <Modal
                title={`版本详情 - v${selectedVersion?.version}`}
                open={versionDetailVisible}
                onCancel={() => setVersionDetailVisible(false)}
                width={1000}
                footer={false}
            >
                <Spin spinning={versionDetailLoading}>
                    {selectedVersion && (
                        <Card>
                            <Descriptions bordered column={2}>
                                <Descriptions.Item label="模板名称" span={2}>
                                    {selectedVersion.template_name}
                                </Descriptions.Item>
                                <Descriptions.Item label="模板描述" span={2}>
                                    {selectedVersion.description || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label="版本">
                                    v{selectedVersion.version}
                                </Descriptions.Item>
                                <Descriptions.Item label="工单类型">
                                    {getTypeLabel(
                                        selectedVersion.template_type,
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="创建人">
                                    {selectedVersion.created_by_name}
                                </Descriptions.Item>
                                <Descriptions.Item label="创建时间">
                                    {selectedVersion.created_at
                                        ? moment(
                                              selectedVersion.created_at * 1000,
                                          ).format('YYYY-MM-DD HH:mm:ss')
                                        : '--'}
                                </Descriptions.Item>

                                {selectedVersion.content &&
                                    getContentFields(
                                        selectedVersion.content,
                                        selectedVersion.template_type,
                                    ).length > 0 && (
                                        <Descriptions.Item
                                            label="模板内容"
                                            span={2}
                                        >
                                            <div
                                                className={
                                                    styles.contentPreview
                                                }
                                            >
                                                {getContentFields(
                                                    selectedVersion.content,
                                                    selectedVersion.template_type,
                                                ).map((field) => (
                                                    <div
                                                        key={field.key}
                                                        className={
                                                            styles.contentItem
                                                        }
                                                        style={{
                                                            lineHeight: 2,
                                                        }}
                                                    >
                                                        <strong
                                                            style={{
                                                                fontWeight:
                                                                    'bolder',
                                                                display:
                                                                    'inline-block',
                                                                width: '100px',
                                                            }}
                                                        >
                                                            {field.label}:
                                                        </strong>{' '}
                                                        {renderContentField(
                                                            field.key,
                                                            field.value,
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </Descriptions.Item>
                                    )}
                            </Descriptions>
                        </Card>
                    )}
                </Spin>
            </Modal>
        </>
    )
}

export default TemplateDetail
