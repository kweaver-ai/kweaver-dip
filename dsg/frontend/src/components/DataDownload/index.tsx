import React, { useState, useRef } from 'react'
import { Button, Popconfirm, Space, message, Tooltip } from 'antd'
import moment from 'moment'
import { InfoCircleFilled } from '@ant-design/icons'
import { SortOrder } from 'antd/lib/table/interface'
import styles from './styles.module.less'
import __ from './locale'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { SearchInput, LightweightSearch } from '@/ui'
import {
    searchData,
    OperateType,
    stateType,
    statusList,
    errorStatusDesc,
    isJsonString,
} from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import CommonTable from '@/components/CommonTable'
import {
    formatError,
    getDownloadTask,
    getDownloadTaskUrl,
    delDownloadTask,
    SortDirection,
} from '@/core'
import { DatasheetViewColored, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { getState } from '@/components/BusinessDiagnosis/helper'

const DataDownload = () => {
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        created_at: 'descend',
    })
    const [searchKey, setSearchKey] = useState<string>('')
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 10,
        direction: SortDirection.DESC,
        sort: 'created_at',
    })
    const commonTableRef: any = useRef()

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('表业务名称')}</span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('（技术名称）')}
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.nameBox}>
                    <DatasheetViewColored className={styles.viewIcon} />
                    <div className={styles.nameItem}>
                        <div title={record.name} className={styles.name}>
                            {record.name}
                        </div>
                        <div title={record.name_en} className={styles.nameEn}>
                            {record.name_en}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('任务状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            render: (text, record) => {
                const status = getState(text, statusList)

                const remark = isJsonString(record?.remark)
                    ? JSON.parse(record?.remark)
                    : { code: 'other' }
                return (
                    <div className={styles.typeWrapper}>
                        <span className={styles.tagsLabel}>
                            {status || '--'}
                        </span>
                        {record?.remark &&
                            record?.status === stateType.failed && (
                                <Tooltip
                                    title={`${__('异常原因：')}${
                                        errorStatusDesc[remark.code] ||
                                        remark?.description
                                    }`}
                                    placement="bottom"
                                >
                                    <FontIcon
                                        name="icon-shenheyijian"
                                        type={IconType.COLOREDICON}
                                        className={styles.icon}
                                    />
                                </Tooltip>
                            )}
                    </div>
                )
            },
        },
        {
            title: __('创建时间'),
            dataIndex: 'created_at',
            key: 'created_at',
            ellipsis: true,
            sorter: true,
            sortOrder: tableSort.created_at,
            showSorterTooltip: false,
            render: (text) =>
                text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--',
        },
        {
            title: __('操作'),
            dataIndex: 'option',
            key: 'option',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                const btnList = [
                    {
                        label: __('取消'),
                        status: OperateType.CANCEL,
                        show: record.status === stateType.queuing,
                        popconfirmTips: __('确定要取消吗?'),
                    },
                    {
                        label: __('下载'),
                        status: OperateType.DOWNLOAD,
                        show: record.status === stateType.finished,
                    },
                    {
                        label: __('删除'),
                        status: OperateType.DELETE,
                        show:
                            record.status === stateType.finished ||
                            record.status === stateType.failed,
                        popconfirmTips: __('确定要删除吗?'),
                    },
                ]
                return (
                    <Space size={16}>
                        {btnList
                            .filter((item) => item.show)
                            .map((item: any) => {
                                return (
                                    <Popconfirm
                                        title={item.popconfirmTips}
                                        placement="bottom"
                                        okText={__('确定')}
                                        cancelText={__('取消')}
                                        onConfirm={() => {
                                            handleOperate(item.status, record)
                                        }}
                                        disabled={!item.popconfirmTips}
                                        icon={
                                            <InfoCircleFilled
                                                style={{
                                                    color: '#3A8FF0',
                                                    fontSize: '16px',
                                                }}
                                            />
                                        }
                                        overlayClassName={styles.popconfirmTips}
                                        key={item.status}
                                    >
                                        <Button
                                            type="link"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!item.popconfirmTips) {
                                                    handleOperate(
                                                        item.status,
                                                        record,
                                                    )
                                                }
                                            }}
                                            title={item.popconfirmTips}
                                        >
                                            {item.label}
                                        </Button>
                                    </Popconfirm>
                                )
                            })}
                    </Space>
                )
            },
        },
    ]

    const emptyDesc = () => {
        return <div>{__('暂无数据')}</div>
    }

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    const handleOperate = (op: OperateType, item: any) => {
        if (op === OperateType.DOWNLOAD) {
            toDownload(item.id)
        } else if (op === OperateType.DELETE || op === OperateType.CANCEL) {
            toDel(item.id, op === OperateType.CANCEL)
        }
    }

    const toDownload = async (id: string) => {
        try {
            const res = await getDownloadTaskUrl(id)
            // downloadFile(res.link)
            window.open(res.link, '_blank')
        } catch (err) {
            formatError(err)
        }
    }

    const toDel = async (id: string, isCancesl?: boolean) => {
        try {
            await delDownloadTask(id)
            message.success(isCancesl ? __('取消成功') : __('删除成功'))
            setSearchCondition({ ...searchCondition, offset: 1 })
        } catch (err) {
            formatError(err)
        }
    }
    // 表格排序改变
    const handleTableChange = (sorter) => {
        const sorterKey = sorter.columnKey

        if (sorter.column) {
            setTableSort({
                created_at: null,
                [sorterKey]: sorter.order || 'ascend',
            })
            return {
                key: sorterKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }

        setTableSort({
            created_at: null,
            [sorterKey]:
                searchCondition.direction === SortDirection.ASC
                    ? 'descend'
                    : 'ascend',
        })

        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    return (
        <div className={styles.drawerBox}>
            <Space size={8} className={styles['drawerBox-search']}>
                <SearchInput
                    maxLength={255}
                    value={searchKey}
                    onKeyChange={(kw: string) => {
                        if (kw) {
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: kw,
                            })
                        }
                        setSearchKey(kw)
                    }}
                    // 解决清除按钮接口调用2次
                    onChange={(e) => {
                        const { value } = e.target
                        if (!value) {
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: undefined,
                            })
                        }
                    }}
                    className={styles['drawerBox-search-inp']}
                    style={{ width: 272 }}
                    placeholder={__('搜索业务名称、技术名称')}
                />
                <LightweightSearch
                    formData={searchData}
                    onChange={(data) =>
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                            ...data,
                        })
                    }
                    defaultValue={{ status: '' }}
                />
                <RefreshBtn onClick={() => search()} />
            </Space>
            <div>
                <CommonTable
                    queryAction={getDownloadTask}
                    params={searchCondition}
                    baseProps={{
                        columns,
                        rowClassName: styles.tableRow,
                        scroll: { y: 'calc(100vh - 274px)' },
                    }}
                    ref={commonTableRef}
                    emptyDesc={emptyDesc()}
                    emptyIcon={dataEmpty}
                    onChange={(currentPagination, filters, sorter) => {
                        if (
                            currentPagination.current === searchCondition.offset
                        ) {
                            const selectedMenu = handleTableChange(sorter)
                            setSearchCondition({
                                ...searchCondition,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                offset: 1,
                                limit: currentPagination?.pageSize,
                            })
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default DataDownload
