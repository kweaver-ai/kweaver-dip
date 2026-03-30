import { Table } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { omit } from 'lodash'
import { Empty, OptionBarTool, OptionMenuType } from '@/ui'
import {
    formatError,
    IFileResourceAuditReq,
    getFileResourceAudit,
} from '@/core'
import { formatTime } from '@/utils'
import { RefreshBtn } from '../ToolbarComponents'
import {
    renderLoader,
    FileAuditOperate,
    renderEmpty,
    initSearch,
} from './helper'
import Audit from './Audit'
import __ from './locale'
import styles from './styles.module.less'

const FileAudit = () => {
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
    const [searchCondition, setSearchCondition] =
        useState<IFileResourceAuditReq>()

    useEffect(() => {
        // 初始化搜索条件
        setSearchCondition(initSearch as IFileResourceAuditReq)
    }, [])

    // 是否有过滤值
    const isSearchStatus = useMemo(() => {
        const ignoreAttr = ['offset', 'limit', 'keyword']
        return Object.values(omit(searchCondition, ignoreAttr)).some(
            (item) => item,
        )
    }, [searchCondition])

    useUpdateEffect(() => {
        if (searchCondition) {
            getTableList({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getTableList = async (params: any) => {
        try {
            setFetching(true)
            const res = await getFileResourceAudit(params)
            setTableData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    // 表格操作事件
    const handleOptionTable = (key: string, record) => {
        setOperateItem(record)
        switch (key) {
            case FileAuditOperate.Audit:
                setAuditVisible(true)
                break

            default:
                break
        }
    }

    // 表格操作项
    const getTableOptions = (record) => {
        const optionMenus = [
            {
                key: FileAuditOperate.Audit,
                label: __('审核'),
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
                title: __('文件资源名称（编码）'),
                dataIndex: 'file_resource_name',
                key: 'file_resource_name',
                ...commonProps,
                render: (value, record) => (
                    <div className={styles.fileNameWrapper}>
                        <div title={value}>{value || '--'}</div>
                        <div
                            className={styles.fileNameCode}
                            title={record?.file_resource_code}
                        >
                            {record?.file_resource_code || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: __('所属组织架构'),
                dataIndex: 'department',
                key: 'department',
                ...commonProps,
                render: (value, record) => (
                    <span title={record?.department_path}>{value || '--'}</span>
                ),
            },
            {
                title: __('申请人'),
                dataIndex: 'applier_name',
                key: 'applier_name',
                ...commonProps,
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

    // 刷新
    const handleRefresh = (refresh: boolean = true) => {
        const params = {
            ...searchCondition,
            offset: refresh ? 1 : searchCondition?.offset,
        } as IFileResourceAuditReq
        setSearchCondition(params)
    }

    // 分页改变
    const onPaginationChange = (page, pageSize) => {
        setSearchCondition({
            ...searchCondition,
            offset: page || 1,
            limit: pageSize || 10,
        } as IFileResourceAuditReq)
    }

    // 申报审核成功
    const handleAuditSuccess = () => {
        setAuditVisible(false)
        getTableList({ ...searchCondition })
    }

    return (
        <div className={styles.fileAudit}>
            <div className={styles.auditTitle}>{__('文件审核')}</div>
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
                                pagination={{
                                    total,
                                    pageSize: searchCondition?.limit,
                                    current: searchCondition?.offset,
                                    showQuickJumper: true,
                                    onChange: (page, pageSize) =>
                                        onPaginationChange(page, pageSize),
                                    showSizeChanger: true,
                                    showTotal: (count) =>
                                        __('共${count}条', { count }),
                                }}
                                locale={{ emptyText: <Empty /> }}
                            />
                        )}
                    </>
                )}
                {auditVisible ? (
                    <Audit
                        open={auditVisible}
                        item={operateItem}
                        onAuditSuccess={handleAuditSuccess}
                        onAuditClose={() => setAuditVisible(false)}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default FileAudit
