import { useAntdTable, useUpdateEffect } from 'ahooks'
import { Space, Table, Tooltip } from 'antd'
import moment from 'moment'
import { memo, useEffect, useState } from 'react'
import { uniqBy } from 'lodash'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useQuery, OperateType } from '@/utils'
import { DsType, defaultMenu } from '@/components/DatasheetView/const'
import { DataSourceOrigin } from '@/components/DataSource/helper'
import {
    formatError,
    getUnEditRescCatlgList,
    getDataCatalogMount,
} from '@/core'
import {
    LightweightSearch,
    ListDefaultPageSize,
    ListType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import { ResTypeEnum, resourceTypeList } from '../const'
import { CustomExpandIcon, resourceTypeIcon } from '../helper'
import { defaultSearchData, searchData } from './helper'
import __ from './locale'
import styles from './styles.module.less'

const LogicalViewList = (props: any) => {
    const { condition, dataType, initCheckedItems, checkItems, setCheckItems } =
        props
    const query = useQuery()
    const type = query.get('type') || ''
    const rowId = query.get('id') || ''
    const draftId = query.get('draftId') || ''
    const isEmptyCatalogEdit = query.get('isEmptyCatalogEdit') || ''
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [total, setTotal] = useState(0)
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: ListDefaultPageSize[ListType.NarrowList],
        offset: 1,
        sort: 'publish_at',
        direction: defaultMenu.sort,
        keyword,
        source_type: DataSourceOrigin.DATAWAREHOUSE,
        // publish_status: 'publish',
    })
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [selectedRows, setSelectedRows] = useState<any[]>([])
    const [mountResourceList, setMountResourceList] = useState<any[]>([])

    useEffect(() => {
        if (checkItems) {
            setSelectedRows(checkItems)
            setSelectedRowKeys(checkItems?.map((item) => item.resource_id))
        }
    }, [checkItems])

    useEffect(() => {
        if (rowId && type) {
            setSelectedRows(checkItems)
            setSelectedRowKeys(checkItems?.map((item) => item.resource_id))
        }
    }, [rowId, type])

    useEffect(() => {
        if (
            !(
                dataType !== undefined &&
                [DsType.all, DsType.datasourceType].includes(dataType)
            ) &&
            searchCondition.sort === 'type'
        ) {
            setSearchCondition((prev) => ({
                ...prev,
                sort: defaultMenu.key,
                direction: defaultMenu.sort,
            }))
            return
        }
        run({ ...searchCondition, ...condition })
    }, [searchCondition, condition])

    useUpdateEffect(() => {
        if (keyword === searchCondition.keyword) return
        setSearchCondition((prev) => ({
            ...prev,
            keyword,
            offset: 1,
        }))
    }, [keyword])

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('数据资源名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div className={styles.catlgName}>
                    <span className={styles.nameIcon}>
                        {resourceTypeIcon(record.resource_type)}
                    </span>
                    <div className={styles.catlgNameCont}>
                        <div title={text} className={styles.names}>
                            {text || '--'}
                        </div>
                        <div title={record?.code} className={styles.code}>
                            {record?.code || '--'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('资源类型'),
            dataIndex: 'resource_type',
            key: 'resource_type',
            ellipsis: true,
            render: (text, record) =>
                resourceTypeList?.find((item) => item.value === text)?.label ||
                '--',
        },
        {
            title: __('所属组织架构'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text, record) => {
                return (
                    <div
                        className={styles.ellipsisName}
                        title={record?.department_path}
                    >
                        {text || '--'}
                    </div>
                )
            },
        },
        {
            title: __('发布时间'),
            dataIndex: 'publish_at',
            key: 'publish_at',
            ellipsis: true,
            render: (text: any) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
    ]

    const getListData = async (params) => {
        try {
            setLoading(true)
            const { current, pageSize, ...rest } = params

            const obj = {
                ...rest,
                offset: current,
                limit: pageSize,
                catalog_id: type === OperateType.EDIT ? rowId : undefined,
            }
            const res = await getUnEditRescCatlgList(obj)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            setTotal(0)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getListData, {
        defaultPageSize: 10,
        manual: true,
    })

    // 自定义 rowSelection 的 getCheckboxProps
    const rowSelection = {
        hideSelectAll: true,
        selectedRowKeys,
        onSelect: (record, selected, selecRows, nativeEvent) => {
            const list = selected
                ? uniqBy([...checkItems, record], 'resource_id')
                : checkItems.filter(
                      (item) => item.resource_id !== record.resource_id,
                  )
            setSelectedRowKeys(list?.map((item) => item.resource_id))
            setCheckItems(list)
        },
        getCheckboxProps: (record) => {
            const hide = record.resource_type === ResTypeEnum.API

            // 检查是否已经选择了一个 resource_type 为 1 的记录

            const isDataViewSelected =
                // 如果已选择库表资源且当前记录也是库表资源
                selectedRows.some((rec) => rec.resource_type === 1) &&
                record.resource_type === 1 &&
                // 如果当前记录不是已选择的记录
                !selectedRows.find(
                    (item) => item.resource_id === record.resource_id,
                )

            // 编辑时，已选择的库表资源不可取消
            const isEditModeDisabled =
                type === OperateType.EDIT &&
                isEmptyCatalogEdit !== 'true' &&
                initCheckedItems?.some(
                    (rec) =>
                        rec.resource_id === record.resource_id &&
                        rec.resource_type === 1,
                )

            return {
                disabled: isDataViewSelected || isEditModeDisabled, // 根据条件禁用选择框
                // 增加禁用提示
                title: isDataViewSelected
                    ? __('只能挂接一个库表资源')
                    : isEditModeDisabled
                    ? __('编目不能修改库表资源')
                    : undefined,
                style: {
                    display: hide ? 'none' : 'inline-flex', // 根据条件隐藏选择框
                },
                children: isDataViewSelected ? (
                    <Tooltip title={__('只能挂接一个库表资源')}>
                        <span
                            style={{
                                width: 20,
                                height: 20,
                                position: 'absolute',
                                top: 12,
                                left: 6,
                                zIndex: 11,
                                borderRadius: '50%',
                            }}
                        />
                    </Tooltip>
                ) : null,
            }
        },
    }

    // 空库表
    const renderEmpty = () => {
        // 未搜索 没数据
        if (total === 0 && !searchCondition.keyword) {
            return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        }
        if (total === 0 && searchCondition.keyword) {
            return <Empty />
        }
        return null
    }

    const searchChange = (d, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setSearchCondition({
                ...searchCondition,
                ...d,
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                [dataKey]: d[dataKey],
            })
        }
    }

    return (
        <div className={styles['lv-list']}>
            <Space size={12} className={styles['lv-list-top']}>
                <SearchInput
                    style={{ width: 287 }}
                    placeholder={__('搜索数据资源名称、编码')}
                    onKeyChange={(kw: string) => {
                        setSearchCondition((prev) => ({
                            ...prev,
                            offset: 1,
                            keyword: kw,
                        }))
                        setKeyword(kw)
                    }}
                    onPressEnter={(e: any) =>
                        setSearchCondition((prev) => ({
                            ...prev,
                            offset: 1,
                            keyword: e.target.value,
                        }))
                    }
                />
                <LightweightSearch
                    formData={searchData}
                    onChange={(data, key) => {
                        setSearchCondition({
                            ...searchCondition,
                            current: 1,
                            resource_type: data.resource_type || undefined,
                        })
                    }}
                    defaultValue={defaultSearchData}
                />
            </Space>
            <div className={styles['lv-list-bottom']}>
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="resource_id"
                    bordered={false}
                    rowSelection={rowSelection}
                    locale={{
                        emptyText: renderEmpty(),
                    }}
                    expandable={{
                        expandIcon: CustomExpandIcon,
                    }}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                        showTotal: (count) => __('共${count}条', { count }),
                    }}
                />
            </div>
        </div>
    )
}

export default memo(LogicalViewList)
