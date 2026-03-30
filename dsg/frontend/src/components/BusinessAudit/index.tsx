import { Table, message } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { omit } from 'lodash'
import { Empty, OptionBarTool, OptionMenuType } from '@/ui'
import {
    formatError,
    BusinessAuditType,
    getBusinessAuditList,
    IBusinessAuditReq,
    getBusinessModelsAuditList,
    rejectBusinessAudit,
    rejectModalAudit,
} from '@/core'
import { formatTime } from '@/utils'
import { RefreshBtn } from '../ToolbarComponents'

import {
    renderLoader,
    AuditOperate,
    renderEmpty,
    AuditTypeMap,
    initSearch,
    RenderName,
    OperateTypeMap,
} from './helper'
import Audit from './Audit'
import __ from './locale'
import styles from './styles.module.less'
// import { getBusinessAuditList } from './mockData'

const BusinessAudit = ({ auditType }: { auditType: BusinessAuditType }) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(true)
    // 加载数据 load
    const [fetching, setFetching] = useState<boolean>(true)
    // 表格数据
    const [tableData, setTableData] = useState<any[]>([])
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 当前操作项
    const [operateItem, setOperateItem] = useState<any>()
    // 审核弹窗
    const [auditVisible, setAuditVisible] = useState(false)
    // 搜索条件
    const [searchCondition, setSearchCondition] = useState<IBusinessAuditReq>()
    // 使用 ref 记录最新的查询参数，避免闭包问题
    const searchConditionRef = useRef<IBusinessAuditReq>()

    useEffect(() => {
        // 初始化搜索条件
        const initCondition = initSearch as IBusinessAuditReq
        searchConditionRef.current = initCondition
        setSearchCondition(initCondition)
    }, [])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'target']
        return Object.values(omit(searchCondition, ignoreAttr)).some(
            (item) => item,
        )
    }, [searchCondition])

    // 是否显示拒绝按钮
    const showReject = useMemo(() => {
        return (
            auditType === BusinessAuditType.MainBusinessPublish ||
            auditType === BusinessAuditType.BusinessModelPublish ||
            auditType === BusinessAuditType.DataModelPublish
        )
    }, [auditType])

    useUpdateEffect(() => {
        if (searchCondition) {
            // 同步更新 ref
            searchConditionRef.current = searchCondition
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        const audit_type =
            auditType === BusinessAuditType.BusinessAreaPublish
                ? `${BusinessAuditType.BusinessAreaPublish},${BusinessAuditType.BusinessAreaDelete}`
                : auditType
        try {
            setFetching(true)
            let res: any = []
            if (
                auditType === BusinessAuditType.BusinessModelPublish ||
                auditType === BusinessAuditType.DataModelPublish
            ) {
                res = await getBusinessModelsAuditList({
                    ...params,
                    audit_type,
                })
            } else {
                res = await getBusinessAuditList({
                    ...params,
                    audit_type,
                })
            }
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    // 拒绝
    const handleReject = async (record) => {
        try {
            switch (auditType) {
                case BusinessAuditType.MainBusinessPublish:
                    await rejectBusinessAudit(record.id)
                    break
                case BusinessAuditType.BusinessModelPublish:
                case BusinessAuditType.DataModelPublish:
                    await rejectModalAudit(record.id)
                    break
                default:
                    break
            }
            message.success(__('拒绝成功'))
            setTimeout(() => {
                getTableList({ ...searchConditionRef.current })
            }, 1000)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case AuditOperate.Audit:
                setAuditVisible(true)
                break
            case AuditOperate.Reject:
                handleReject(record)
                break
            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = (record) => {
        let optionMenus = [
            {
                key: AuditOperate.Audit,
                label: __('审核'),
                menuType: OptionMenuType.Menu,
            },
        ]
        if (showReject) {
            optionMenus = [
                {
                    key: AuditOperate.Reject,
                    label: __('拒绝'),
                    menuType: OptionMenuType.Menu,
                },
                ...optionMenus,
            ]
        }

        return optionMenus
    }

    const columns: any = useMemo(() => {
        const commonProps = {
            ellipsis: true,
            render: (value) => value || '--',
        }

        const cols = [
            {
                title: __('申请编号'),
                dataIndex: 'proc_inst_id',
                key: 'proc_inst_id',
                ...commonProps,
            },
            {
                title: AuditTypeMap[auditType]?.nameLabel,
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (value, record) => (
                    <RenderName
                        value={value}
                        auditType={auditType}
                        record={record}
                    />
                ),
            },
            {
                title: __('申请人'),
                dataIndex: 'apply_user_name',
                key: 'apply_user_name',
                ...commonProps,
            },
            {
                title: __('申请类型'),
                dataIndex: 'operate',
                key: 'operate',
                ...commonProps,
                render: (val: string) => OperateTypeMap[val]?.title || '--',
            },
            {
                title: __('申请时间'),
                dataIndex: 'apply_time',
                key: 'apply_time',
                ...commonProps,
                render: (val: number) => (val ? formatTime(val) : '--'),
            },
            {
                title: __('操作'),
                key: 'action',
                width: showReject ? '110px' : '80px',
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

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        const params = {
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        } as IBusinessAuditReq
        setSearchCondition(params)
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition({
            ...searchCondition,
            offset: page || 1,
            limit: pageSize || 10,
        } as IBusinessAuditReq)
    }

    // 申报审核成功
    const handleAuditSuccess = () => {
        setAuditVisible(false)
        getTableList({ ...searchConditionRef.current })
    }

    return (
        <div className={styles.businessAudit}>
            <div className={styles.auditTitle}>
                {AuditTypeMap[auditType].title}
            </div>
            <div className={styles.auditContent}>
                {loading ? (
                    renderLoader()
                ) : (
                    <>
                        <div className={styles.auditOperation}>
                            <RefreshBtn onClick={handleRefresh} />
                        </div>
                        {tableData.length === 0 && !isSearchStatus ? (
                            renderEmpty({})
                        ) : (
                            <Table
                                columns={columns}
                                dataSource={tableData}
                                loading={fetching}
                                rowKey="id"
                                rowClassName={styles.tableRow}
                                scroll={{
                                    x: columns.length * 180,
                                    y: `calc(100vh - 270px)`,
                                }}
                                pagination={
                                    total <= 10
                                        ? false
                                        : {
                                              total,
                                              pageSize: searchCondition?.limit,
                                              current: searchCondition?.offset,
                                              showQuickJumper: true,
                                              onChange: (page, pageSize) =>
                                                  onPaginationChange(
                                                      page,
                                                      pageSize,
                                                  ),
                                              showSizeChanger: true,
                                              showTotal: (count) =>
                                                  __('共${count}条', { count }),
                                          }
                                }
                                locale={{ emptyText: <Empty /> }}
                            />
                        )}
                    </>
                )}
                {auditVisible ? (
                    <Audit
                        open={auditVisible}
                        item={operateItem}
                        auditType={auditType}
                        onAuditSuccess={handleAuditSuccess}
                        onAuditClose={() => setAuditVisible(false)}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default BusinessAudit
