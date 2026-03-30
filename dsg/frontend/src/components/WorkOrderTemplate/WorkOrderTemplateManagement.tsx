import { PlusOutlined } from '@ant-design/icons'
import {
    Button,
    DatePicker,
    Pagination,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    message,
} from 'antd'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { formatError } from '@/core'
import {
    createWorkOrderTemplates,
    deleteWorkOrderTemplates,
    getWorkOrderTemplatesList,
    updateWorkOrderTemplates,
} from '@/core/apis/taskCenter'
import type {
    IWorkOrderTemplatesInfo,
    WorkOrderTemplateParams,
} from '@/core/apis/taskCenter/index.d'
import { LightweightSearch, SearchInput } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import {
    PAGINATION_CONFIG,
    SEARCH_FILTER_CONFIG,
    TEMPLATE_STATUS,
    WORK_ORDER_TYPES,
} from './const'
import styles from './styles.module.less'
import TemplateDetail from './TemplateDetail'
import TemplateForm from './TemplateForm'

const { Option } = Select
const { RangePicker } = DatePicker

interface SearchParams {
    keyword?: string
    template_type?: IWorkOrderTemplatesInfo['template_type']
    is_active?: IWorkOrderTemplatesInfo['is_active']
}

const WorkOrderTemplateManagement: React.FC = () => {
    // 状态管理
    const [loading, setLoading] = useState(false)
    const [searchParams, setSearchParams] = useState<SearchParams>({
        keyword: '',
        template_type: undefined,
        is_active: undefined,
    })
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: PAGINATION_CONFIG.defaultPageSize,
        total: 0,
    })

    // 数据状态
    const [templates, setTemplates] = useState<IWorkOrderTemplatesInfo[]>([])

    // 弹窗状态
    const [formVisible, setFormVisible] = useState(false)
    const [detailVisible, setDetailVisible] = useState(false)
    const [currentTemplate, setCurrentTemplate] =
        useState<IWorkOrderTemplatesInfo | null>(null)
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

    // 初始化数据
    useEffect(() => {
        loadTemplates()
    }, [])

    // 搜索和分页变化时重新加载数据
    useEffect(() => {
        loadTemplates()
    }, [searchParams, pagination.current, pagination.pageSize])

    const loadTemplates = async () => {
        setLoading(true)
        try {
            const params: WorkOrderTemplateParams = {
                offset: pagination.current,
                limit: pagination.pageSize,
                ...searchParams,
            }

            // 清理undefined参数
            Object.keys(params).forEach((key) => {
                if (
                    params[key as keyof WorkOrderTemplateParams] === undefined
                ) {
                    delete params[key as keyof WorkOrderTemplateParams]
                }
            })

            const response = await getWorkOrderTemplatesList(params)
            if (response?.entries) {
                setTemplates(response.entries as any)
                setPagination((prev) => ({
                    ...prev,
                    total: response.total_count || 0,
                }))
            }
        } catch (error) {
            formatError(error)
            setTemplates([])
            setPagination((prev) => ({
                ...prev,
                total: 0,
            }))
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setCurrentTemplate(null)
        setFormMode('create')
        setFormVisible(true)
    }

    const handleEdit = (template: IWorkOrderTemplatesInfo) => {
        setCurrentTemplate(template)
        setFormMode('edit')
        setFormVisible(true)
    }

    const handleView = (template: IWorkOrderTemplatesInfo) => {
        setCurrentTemplate(template)
        setDetailVisible(true)
    }

    const handleDelete = (template: IWorkOrderTemplatesInfo) => {
        confirm({
            title: '确认删除',
            content: `确定要删除工单模板"${template.template_name}"吗？`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await deleteWorkOrderTemplates(template.id)
                    message.success('删除成功')
                    loadTemplates()
                } catch (error: any) {
                    formatError(error)
                }
            },
        })
    }

    const handleFormSubmit = async (data: any) => {
        try {
            if (formMode === 'create') {
                // 创建模式
                const createData = {
                    template_name: data.template_name,
                    template_type: data.template_type,
                    description: data.description || '',
                    content: data.content || {},
                }

                await createWorkOrderTemplates(createData)
                message.success('创建成功')
            } else {
                // 编辑模式
                const updateData = {
                    template_name: data.template_name,
                    description: data.description || '',
                    content: data.content || {},
                    is_active: data.is_active,
                }

                // 只传递有变化的字段
                const filteredUpdateData: any = {}
                Object.keys(updateData).forEach((key) => {
                    if (
                        updateData[key as keyof typeof updateData] !== undefined
                    ) {
                        filteredUpdateData[key] =
                            updateData[key as keyof typeof updateData]
                    }
                })

                await updateWorkOrderTemplates(
                    currentTemplate!.id,
                    filteredUpdateData,
                )
                message.success('更新成功')
            }

            setFormVisible(false)
            loadTemplates()
        } catch (error: any) {
            formatError(error)
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

    const formatTime = (timestamp: number) => {
        return timestamp
            ? moment(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
            : '--'
    }

    const columns = [
        {
            title: '模板名称',
            dataIndex: 'template_name',
            key: 'template_name',
            width: 240,
            ellipsis: true,
        },
        {
            title: '工单类型',
            dataIndex: 'template_type',
            key: 'template_type',
            render: (type: IWorkOrderTemplatesInfo['template_type']) => (
                <span>{getTypeLabel(type)}</span>
            ),

            width: 150,
        },
        {
            title: '版本',
            dataIndex: 'version',
            key: 'version',
            width: 80,
        },
        {
            title: '引用次数',
            dataIndex: 'reference_count',
            key: 'reference_count',
            width: 100,
        },
        {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (status: IWorkOrderTemplatesInfo['is_active']) =>
                getStatusTag(status),
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            render: (time: number) => formatTime(time),
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right' as const,
            render: (_: any, record: IWorkOrderTemplatesInfo) => (
                <Space>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleView(record)}
                    >
                        查看
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Tooltip
                        title={
                            record?.reference_count
                                ? '模板被引用,不允许删除'
                                : undefined
                        }
                    >
                        <Button
                            type="link"
                            size="small"
                            disabled={!!record?.reference_count}
                            danger
                            onClick={() => {
                                if (!record?.reference_count) {
                                    handleDelete(record)
                                }
                            }}
                        >
                            删除
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    return (
        <div className={styles.workOrderTemplateManagement}>
            {/* 搜索区域 */}
            <div className={styles.searchCard}>
                <div className={styles.searchRow}>
                    <div className={styles.contentHeader}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                        >
                            添加工单模板
                        </Button>
                    </div>
                    <Space size={16}>
                        <Space size={8}>
                            <SearchInput
                                placeholder="搜索模板名称"
                                value={searchParams.keyword}
                                onKeyChange={(keyword: string) =>
                                    setSearchParams((prev) => ({
                                        ...prev,
                                        keyword,
                                    }))
                                }
                            />
                            <LightweightSearch
                                formData={SEARCH_FILTER_CONFIG}
                                onChange={(data, key) => {
                                    if (key === 'template_type') {
                                        setSearchParams((prev) => ({
                                            ...prev,
                                            template_type:
                                                data.template_type || undefined,
                                        }))
                                    }
                                }}
                                defaultValue={{
                                    template_type: undefined,
                                }}
                            />
                        </Space>
                        <span>
                            <RefreshBtn
                                loading={loading}
                                onClick={() => {
                                    setPagination((prev) => ({
                                        ...prev,
                                        current: 1,
                                    }))
                                    loadTemplates()
                                }}
                            />
                        </span>
                    </Space>
                </div>
            </div>

            {/* 表格区域 */}
            <div className={styles.contentCard}>
                <Table
                    columns={columns}
                    dataSource={templates}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: '100%' }}
                />

                {/* 分页区域 */}
                <div className={styles.paginationWrapper}>
                    <Pagination
                        {...pagination}
                        {...PAGINATION_CONFIG}
                        onChange={(page, pageSize) => {
                            setPagination((prev) => ({
                                ...prev,
                                current: page,
                                pageSize: pageSize || prev.pageSize,
                            }))
                        }}
                    />
                </div>
            </div>

            {/* 表单弹窗 */}
            <TemplateForm
                visible={formVisible}
                mode={formMode}
                initialValues={currentTemplate}
                onSubmit={handleFormSubmit}
                onCancel={() => setFormVisible(false)}
            />

            {/* 详情弹窗 */}
            <TemplateDetail
                visible={detailVisible}
                template={currentTemplate}
                onClose={() => setDetailVisible(false)}
            />
        </div>
    )
}

export default WorkOrderTemplateManagement
