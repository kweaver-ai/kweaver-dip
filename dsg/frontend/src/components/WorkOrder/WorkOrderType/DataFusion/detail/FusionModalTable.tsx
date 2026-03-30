import { Table } from 'antd'
import React, { useEffect, useState } from 'react'
import { trim } from 'lodash'
import { useAntdTable, useDebounce, useUpdateEffect } from 'ahooks'
import __ from '../locale'
import styles from './styles.module.less'
import { allDataTypeOptions, DataType } from '@/components/DataEleManage/const'
import { Empty, SearchInput } from '@/ui'
import { formatError } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'

/**
 * 融合模型表单
 * @returns
 */
const FusionModalTable = ({ id, fusionModelData = {} }: any) => {
    const [loading, setLoading] = useState<any>(true)
    // 融合表详情
    const [detail, setDetail] = useState<any>(fusionModelData)

    const initParams = {
        keyword: '',
        offset: 1,
        limit: 5,
    }

    const [searchCondition, setSearchCondition] = useState<any>({
        ...initParams,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 100 })

    const columns = [
        {
            title: __('字段名称'),
            dataIndex: 'c_name',
            key: 'c_name',
            ellipsis: true,
            width: 100,
            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('英文名称'),
            dataIndex: 'e_name',
            key: 'e_name',
            ellipsis: true,
            width: 100,
            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('数据标准'),
            dataIndex: 'standard_name_zh',
            key: 'standard_name_zh',
            ellipsis: true,
            width: 72,

            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('关联码表'),
            dataIndex: 'code_table_name_zh',
            key: 'code_table_name_zh',
            ellipsis: true,
            width: 72,
            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('关联编码规则'),
            dataIndex: 'code_rule_name',
            key: 'code_rule_name',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('值域'),
            dataIndex: 'data_range',
            key: 'data_range',
            ellipsis: true,
            width: 72,
            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            width: 140,
            render: (text, record) => {
                const data_length = record?.data_length
                    ? `${__('长度')}：${record?.data_length}`
                    : ''
                const info = data_length
                    ? `（${data_length}${
                          record.data_type === DataType.TDECIMAL &&
                          record?.data_accuracy
                              ? ` ${__('精度')}：${record?.data_accuracy}`
                              : ''
                      }）`
                    : ''
                const val =
                    allDataTypeOptions.find((item) => item.value === text)
                        ?.label || ''
                const title = `${val}${info}`
                return <span title={title}>{title || '--'}</span>
            },
        },
        {
            title: __('主键'),
            dataIndex: 'primary_key',
            key: 'primary_key',
            width: 60,
            render: (text) => (text ? __('是') : __('否')),
        },
        {
            title: __('必填'),
            dataIndex: 'is_required',
            key: 'is_required',
            width: 60,
            render: (text) => (text ? __('是') : __('否')),
        },
        {
            title: __('增量字段'),
            dataIndex: 'is_increment',
            key: 'is_increment',
            width: 88,
            render: (text) => (text ? __('是') : __('否')),
        },
        {
            title: __('是否标准'),
            dataIndex: 'is_standard',
            key: 'is_standard',
            width: 88,
            render: (text) => (text ? __('是') : __('否')),
        },
        {
            title: __('字段关系'),
            dataIndex: 'field_relationship',
            key: 'field_relationship',
            // width: 136,
            ellipsis: true,
            render: (text, record) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
    ]

    const getInfoItemList = async (params) => {
        const { keyword = '', offset, limit } = params

        try {
            setLoading(true)
            const filterFields = fusionModelData?.fields?.filter(
                (item) =>
                    item.c_name
                        ?.toLocaleLowerCase()
                        .includes(keyword.toLocaleLowerCase()) ||
                    item.e_name
                        ?.toLocaleLowerCase()
                        .includes(keyword.toLocaleLowerCase()),
            )
            const startIndex = (offset - 1) * limit
            const endIndex = startIndex + limit
            const pagedFields = filterFields?.slice(startIndex, endIndex)

            return {
                total: filterFields.length || 0, // 总数使用过滤后的长度
                list: pagedFields, // 返回分页后的数据
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getInfoItemList, {
        defaultPageSize: 5,
        manual: true,
    })

    useUpdateEffect(() => {
        run({
            ...searchDebounce,
            current: searchDebounce.offset,
            pageSize: searchDebounce.limit,
        })
    }, [searchDebounce])

    useEffect(() => {
        if (!fusionModelData?.fields?.length) return
        run(searchDebounce)
    }, [fusionModelData])

    return (
        <div className={styles.fusionTableDetailWrapper}>
            {!fusionModelData?.table_name &&
            !fusionModelData?.fields?.length ? (
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            ) : (
                <>
                    <div className={styles.fusionTop}>
                        <div className={styles.fusionTableNameWrapper}>
                            {__('融合表名称') + __('：')}
                            <span>{fusionModelData?.table_name || '--'}</span>
                        </div>
                        {!!fusionModelData?.fields?.length && (
                            <SearchInput
                                style={{ width: 272 }}
                                placeholder={__('搜索中英文名称')}
                                value={searchCondition?.keyword}
                                onKeyChange={(val: string) =>
                                    setSearchCondition({
                                        ...searchCondition,
                                        keyword: trim(val),
                                        offset: 1,
                                    })
                                }
                            />
                        )}
                    </div>
                    <Table
                        columns={columns}
                        rowKey="id"
                        dataSource={tableProps.dataSource}
                        locale={{
                            emptyText: (
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            ),
                        }}
                        pagination={{
                            ...tableProps.pagination,
                            hideOnSinglePage: tableProps.pagination.total <= 5,
                            showQuickJumper: true,
                            responsive: true,
                            showLessItems: true,
                            showSizeChanger: false,
                            // showTotal: (count) => {
                            //     return `共 ${count} 条记录 第 ${
                            //         searchCondition.offset
                            //     }/${Math.ceil(count / searchCondition.limit)} 页`
                            // },
                        }}
                        onChange={(newPagination, filters, sorter) => {
                            // const selectedMenu = handleTableChange(sorter)
                            setSearchCondition((prev) => ({
                                ...prev,
                                // sort: selectedMenu.key,
                                // direction: selectedMenu.sort,
                                offset: newPagination.current,
                                limit: newPagination.pageSize,
                            }))
                        }}
                    />
                </>
            )}
        </div>
    )
}

export default FusionModalTable
