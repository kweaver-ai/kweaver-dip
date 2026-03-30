import React, { useEffect, useState } from 'react'
import { Button, Space, Tooltip, message, Modal, Spin } from 'antd'
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import {
    getWorkOrderTemplate,
    createWorkOrderTemplate,
    updateWorkOrderTemplate,
    deleteWorkOrderTemplate,
    getWorkOrderTemplateDetailById,
    updateWorkOrderTemplateStatus,
} from '@/core/apis/taskCenter'
import {
    SearchInput,
    ListPagination,
    Loader,
    LightweightSearch,
    ReturnConfirmModal,
} from '@/ui'
import { ListType } from '@/ui/const'
import { RefreshBtn } from '@/components/ToolbarComponents'
import TemplateCard from './TemplateCard'
import OperateModal from './OperateModal'
import Empty from '@/ui/Empty'
import styles from './styles.module.less'
import { SearchFilter, TicketTypeOptions } from './helper'
import { formatError } from '@/core'
import __ from './locale'
import { initSearchCondition, OptionStatus } from './const'
import Details from './Details'
import dataEmpty from '@/assets/dataEmpty.svg'

function WorkOrderTemplate() {
    const [dataSource, setDataSource] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchCondition, setSearchCondition] = useState(initSearchCondition)

    const [formVisible, setFormVisible] = useState(false)
    const [current, setCurrent] = useState<any>(null)
    const [detailVisible, setDetailVisible] = useState(false)
    const [total, setTotal] = useState(0)

    // 获取工单模板列表
    const onLoad = async () => {
        setLoading(true)
        try {
            const res = await getWorkOrderTemplate({
                keyword: searchCondition.keyword,
                limit: searchCondition.limit,
                offset: searchCondition.offset,
                ticket_type: searchCondition.ticket_type,
                status: searchCondition.status,
            })

            setDataSource(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        onLoad()
    }, [searchCondition])

    const handlePageChange = (offset: number, limit: number) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset,
            limit,
        }))
    }

    const handleStatusChange = async (template: any, status: boolean) => {
        if (!template) {
            return
        }
        try {
            await updateWorkOrderTemplateStatus(template?.id, status ? 1 : 0)
            message.success(__('操作成功'))
            onLoad()
        } catch (error) {
            formatError(error)
        }
    }

    // 删除工单模板
    const handleDelete = (template: any) => {
        if (!template) {
            return
        }
        try {
            ReturnConfirmModal({
                title: __('确定删除用此模板吗？'),
                content: '',
                cancelText: __('取消'),
                okText: __('确定'),
                onOK: async () => {
                    await deleteWorkOrderTemplate(template?.id)
                    message.success(__('删除成功'))
                    onLoad()
                },
            })
        } catch (error) {
            formatError(error)
        }
    }

    // 表单提交处理
    const handleFormSubmit = async (values: any) => {
        try {
            if (current) {
                await updateWorkOrderTemplate(current.id, values)
                message.success(__('更新成功'))
            } else {
                await createWorkOrderTemplate(values)
                message.success(__('添加成功'))
            }
            setFormVisible(false)
            setCurrent(null)
            onLoad()
        } catch (error) {
            formatError(error)
        }
    }

    // 操作处理
    const handleOperation = (key: string, data?: any) => {
        switch (key) {
            case OptionStatus.Create:
                setCurrent(null)
                setFormVisible(true)
                break
            case OptionStatus.Detail:
                setCurrent(data)
                setDetailVisible(true)
                break
            case OptionStatus.Edit:
                setCurrent(data)
                setFormVisible(true)
                break
            case OptionStatus.Enable:
                ReturnConfirmModal({
                    title: __('确定启用此模板吗？'),
                    content: __(
                        '一个工单只能使用一个模板，当前类型的工单，正在使用另一个模板“${type}”。启用此模板后，此类型的工单将使用新的模板，原模板不再使用，请确认操作。',
                        {
                            type: __('${type}模板', {
                                type: TicketTypeOptions.find(
                                    (o) => o.value === data?.ticket_type,
                                )?.label,
                            }),
                        },
                    ),
                    cancelText: __('取消'),
                    okText: __('确定'),
                    onOK: () => handleStatusChange(data, true),
                })
                break
            case OptionStatus.Stop:
                handleStatusChange(data, false)
                break
            case OptionStatus.Delete:
                handleDelete(data)
                break
            default:
                break
        }
    }

    return (
        <div className={styles['work-order-template']}>
            <div className={styles.header}>
                <div className={styles.left}>
                    <Space size={8}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOperation(OptionStatus.Create)}
                        >
                            {__('添加工单模板')}
                        </Button>
                    </Space>
                </div>
                <div className={styles.right}>
                    <Space size={12}>
                        <SearchInput
                            style={{ width: 272 }}
                            placeholder={__('搜索模板名称')}
                            onKeyChange={(kw: string) => {
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                    keyword: kw,
                                })
                            }}
                            onPressEnter={(e: any) => {
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                    keyword: e.target.value,
                                })
                            }}
                        />
                        <LightweightSearch
                            formData={SearchFilter}
                            onChange={(data, key) => {
                                if (key === 'ticket_type') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        ticket_type:
                                            data.ticket_type || undefined,
                                    })
                                } else if (key === 'status') {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        status: data.status,
                                    })
                                } else {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset: 1,
                                        ticket_type: undefined,
                                        status: undefined,
                                    })
                                }
                            }}
                            defaultValue={{
                                ticket_type: undefined,
                                status: undefined,
                            }}
                        />
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                })
                            }
                        />
                    </Space>
                </div>
            </div>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loadingWrapper}>
                        <div className={styles.loadingContent}>
                            <Loader />
                        </div>
                    </div>
                ) : dataSource?.length === 0 ? (
                    <div className={styles.emptyWrapper}>
                        {searchCondition?.keyword ? (
                            <Empty />
                        ) : (
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        )}
                    </div>
                ) : (
                    <>
                        <div className={styles.cardWrapper}>
                            {dataSource?.map((item) => (
                                <TemplateCard
                                    key={item?.id}
                                    data={item}
                                    onChange={handleOperation}
                                />
                            ))}
                        </div>

                        <div className={styles.paginationWrapper}>
                            <ListPagination
                                listType={ListType.CardList}
                                queryParams={searchCondition}
                                totalCount={total}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                            />
                        </div>
                    </>
                )}
            </div>

            <OperateModal
                visible={formVisible}
                item={current}
                onCancel={() => {
                    setFormVisible(false)
                    setCurrent(null)
                }}
                onSubmit={handleFormSubmit}
            />

            <Details
                id={current?.id}
                open={detailVisible}
                onClose={() => {
                    setCurrent(null)
                    setDetailVisible(false)
                }}
            />
        </div>
    )
}

export default WorkOrderTemplate
