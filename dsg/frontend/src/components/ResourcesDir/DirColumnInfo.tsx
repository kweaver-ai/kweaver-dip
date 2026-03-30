/* eslint-disable no-param-reassign */
import React, { useState, useEffect, useMemo } from 'react'
import { ConfigProvider, Input, Table, Modal } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { useAntdTable } from 'ahooks'
import { isNumber, trim, debounce } from 'lodash'
import classnames from 'classnames'
import {
    formatError,
    getRescDirColumnInfo,
    dataTypeMapping,
    getRescDirDetail,
    reqDataCatlgColumnInfo,
} from '@/core'
import styles from './styles.module.less'
import Loader from '@/ui/Loader'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import {
    classifiedOptoins,
    openTypeList,
    sensitiveOptions,
    shareTypeList,
    InfoItemsDetail,
    ShareTypeEnum,
    OpenTypeEnum,
    typeOptoins,
    DataProcessingList,
    belongSystemClassifyList,
    sensitivityLevelList,
    columnInfoSearchData,
} from './const'
import DetailsLabel from '../../ui/DetailsLabel'
import { SearchInput, LightweightSearch } from '@/ui'
import { UniqueFlagColored } from '@/icons'
import { useQuery } from '@/utils'
import { getState } from '../DatasheetView/helper'
import { getColorOptions } from './helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface DirColumnInfoProps {
    catalogId: string
    showTitle?: boolean
    isMarket?: boolean
    isAudit?: boolean
}

// DirDetailContent传参数
const DirColumnInfo: React.FC<DirColumnInfoProps> = (infoProps: any) => {
    const { catalogId, isMarket, isAudit, showTitle = false } = infoProps
    const query = useQuery()
    const isResourcesList = query.get('isResourcesList') === 'true'

    const [loading, setLoading] = useState(true)
    const [detailsOpen, setDetailsOpen] = useState(false)

    const [searchKey, setSearchKey] = useState('')
    const [fieldDetails, setFieldDetails] = useState<any>(InfoItemsDetail)
    const [{ using, governmentSwitch }] = useGeneralConfig()

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    const governmentKeys = [
        'source_system',
        'source_system_level',
        // 'info_item_level',
    ]

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            catalogId,
            keyword: searchKey || '',
            current: 1,
        })
    }, [catalogId])

    const getDataType = (type: string) => {
        let tempType = ''
        Object.keys(dataTypeMapping).forEach((key) => {
            if (dataTypeMapping[key].includes(type)) {
                tempType = key
            }
        })
        return typeOptoins.find((item) => item.strValue === tempType)?.value
    }

    const column: ColumnsType<any> = [
        {
            title: '信息项业务名称',
            key: 'business_name',
            width: 220,
            ellipsis: true,
            render: (record) => {
                return (
                    <div className={styles.infoNames}>
                        <div>
                            <div className={styles.catlgNameCont}>
                                <span
                                    title={record.business_name}
                                    className={classnames(
                                        styles.names,
                                        styles.primaryColor,
                                        record.primary_flag === 1 &&
                                            styles.iconWidth,
                                    )}
                                    onClick={() => {
                                        fieldDetailHandel(record)
                                    }}
                                >
                                    {record.business_name || '--'}
                                </span>
                                {record.primary_flag === 1 && (
                                    <UniqueFlagColored
                                        className={styles.typeIcon}
                                    />
                                )}
                            </div>
                        </div>
                        {/* <div
                            title={record.technical_name}
                            className={classnames(
                                styles.ellipsis,
                                styles.names,
                            )}
                        >
                            {record.technical_name}
                        </div> */}
                    </div>
                )
            },
        },
        {
            title: __('信息项技术名称'),
            key: 'technical_name',
            dataIndex: 'technical_name',
            ellipsis: true,
            width: 150,
            render: (text) => <span>{labelText(text)}</span>,
        },
        {
            title: __('关联数据标准'),
            key: 'standard',
            dataIndex: 'standard',
            ellipsis: true,
            width: 120,
            render: (text) => <span>{labelText(text)}</span>,
        },
        {
            title: __('关联码表'),
            key: 'code_table',
            dataIndex: 'code_table',
            ellipsis: true,
            width: 120,
            render: (text) => <span>{labelText(text)}</span>,
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            width: 200,
            render: (text, record) => {
                const data_length = record?.data_length
                    ? `${__('长度')}：${record?.data_length}`
                    : ''
                const ranges = record?.data_range
                    ? `${__('值域')}：${record?.data_range}`
                    : ''
                const info =
                    data_length || ranges
                        ? `（${data_length}${
                              data_length && ranges ? '；' : ''
                          }${ranges}）`
                        : ''
                const val =
                    typeOptoins.find((item) => item.value === text)?.label || ''
                const title = `${val}${info}`
                return <span title={title}>{title || '--'}</span>
            },
        },
        {
            title: __('共享属性'),
            key: 'shared_type',
            ellipsis: true,
            render: (item) => {
                const type =
                    shareTypeList.find((it) => it.value === item.shared_type)
                        ?.label || '--'
                const condition = item.shared_condition
                    ? `（${item.shared_condition}）`
                    : ''
                const title = `${type}${condition}`
                return (
                    <span className={styles.ellipsis} title={title}>
                        {
                            getColorOptions(shareTypeList)?.find(
                                (i) => i.value === item.shared_type,
                            )?.label
                        }
                        {condition}
                    </span>
                )
            },
        },
        {
            title: __('开放属性'),
            key: 'open_type',
            ellipsis: true,
            render: (item) => {
                const type =
                    openTypeList.find((it) => it.value === item.open_type)
                        ?.label || '--'
                const condition = item.open_condition
                    ? `（${item.open_condition}）`
                    : ''
                const title = `${type}${condition}`
                return (
                    <span className={styles.ellipsis} title={title}>
                        {
                            getColorOptions(openTypeList)?.find(
                                (i) => i.value === item.open_type,
                            )?.label
                        }
                        {condition}
                    </span>
                )
            },
        },
        {
            title: __('敏感属性'),
            key: 'sensitive_flag',
            width: 120,
            ellipsis: true,
            render: (item) =>
                getColorOptions(sensitiveOptions)?.find(
                    (i) => i.value === item.sensitive_flag,
                )?.label || '--',
        },
        {
            title: __('涉密属性'),
            key: 'classified_flag',
            width: 120,
            ellipsis: true,
            render: (item) =>
                getColorOptions(classifiedOptoins)?.find(
                    (i) => i.value === item.classified_flag,
                )?.label || '--',
        },
        {
            title: __('来源系统'),
            key: 'source_system',
            width: 120,
            ellipsis: true,
            render: (item) =>
                DataProcessingList.find((sItem) => {
                    return sItem.value === item.source_system
                })?.label || '--',
        },
        {
            title: __('来源系统分类'),
            key: 'source_system_level',
            width: 120,
            ellipsis: true,
            render: (item) =>
                belongSystemClassifyList.find((sItem) => {
                    return sItem.value === item.source_system_level
                })?.label || '--',
        },
        {
            title: __('信息项分级'),
            key: 'info_item_level',
            width: 120,
            ellipsis: true,
            render: (item) =>
                isNumber(item.info_item_level)
                    ? sensitivityLevelList.find((sItem) => {
                          return sItem.value === item.info_item_level
                      })?.label
                    : item.info_item_level || '--',
        },
        {
            title: __('时间戳'),
            dataIndex: 'timestamp_flag',
            key: 'timestamp_flag',
            ellipsis: true,
            render: (text) =>
                text === 1 ? __('是') : text === 0 ? __('否') : '--',
        },
        // {
        //     title: __('映射字段'),
        //     dataIndex: 'map_field',
        //     key: 'map_field',
        //     ellipsis: true,
        //     width: 120,
        //     render: (text) => text || '--',
        // },
    ]

    const labelText = (text?: string | number) => {
        if (isNumber(text)) return text
        return text || '--'
    }

    // 初始params
    const initialQueryParams = {
        current: 1,
        pageSize: 12,
        keyword: '',
        catalogId,
        shared_type: isResourcesList ? ShareTypeEnum.NOSHARE : undefined,
    }

    // 查询params
    const [queryParams, setQueryParams] = useState(initialQueryParams)

    useEffect(() => {
        run({
            ...queryParams,
            keyword: searchKey || '',
            current: 1,
        })
    }, [queryParams])

    const getColumnInfo = async (params) => {
        const {
            direction,
            keyword,
            sort,
            current: offset,
            pageSize: limit,
            shared_type,
        } = params

        try {
            setLoading(true)
            const detialRes = await getRescDirDetail(catalogId)
            const action = isMarket
                ? reqDataCatlgColumnInfo
                : getRescDirColumnInfo
            const res = await action({
                catalogId:
                    detialRes?.draft_id !== '0' && isAudit
                        ? detialRes?.draft_id
                        : catalogId,
                direction,
                keyword,
                sort,
                offset,
                limit,
                shared_type,
            })
            return {
                total: res?.total_count || 0,
                list: res?.columns || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getColumnInfo, {
        defaultPageSize: 12,
        manual: true,
    })

    const props = useMemo(() => {
        const p: { dataSource; onChange; [key: string]: any } = tableProps
        return p
    }, [tableProps])

    const handleSearchPressEnter = (e) => {
        const value = trim(e.target.value)
        setSearchKey(value)
        setQueryParams({
            ...queryParams,
            keyword: value,
            ...pagination,
            current: 1,
        })
    }

    // 空库表
    const showTableEmpty = () => {
        const desc = searchKey ? (
            <span>{__('抱歉，没有找到相关内容')}</span>
        ) : (
            <span>{__('暂无数据')}</span>
        )
        const icon = searchKey ? searchEmpty : dataEmpty
        return (
            <Empty desc={desc} iconSrc={icon} className={styles.tableEmpty} />
        )
    }

    const fieldDetailHandel = (row: any) => {
        setFieldDetails(
            InfoItemsDetail.map((item) => {
                const obj: any = {
                    ...item,
                    value: row[item.key],
                }
                // if (item.key === 'shared_condition') {
                //     obj.label =
                //         row.shared_type === ShareTypeEnum.NOSHARE
                //             ? __('不予共享依据')
                //             : __('共享条件')
                //     obj.hidden = row.shared_type === ShareTypeEnum.UNCONDITION
                // }
                // if (item.key === 'open_condition') {
                //     obj.hidden = row.open_type === OpenTypeEnum.NOOPEN
                // }
                return obj
            }),
        )
        setDetailsOpen(true)
    }

    return (
        <div
            className={classnames(
                styles.dirColumnWapper,
                showTitle && styles.showTitleColumnWapper,
                isMarket && styles.marketColumnWapper,
            )}
        >
            <div className={styles.empty} hidden={!loading}>
                <Loader />
            </div>
            <div className={styles.dirColumnHeader}>
                {showTitle && (
                    <div className={styles.columnTitle}>{__('信息项')}</div>
                )}
                <div className={styles.columnSearch}>
                    <SearchInput
                        placeholder={__('搜索信息项技术、业务名称')}
                        onChange={debounce((e: any) => {
                            const kw = e.target.value
                            setSearchKey(kw)
                            run({
                                ...queryParams,
                                keyword: kw ?? '',
                                current: 1,
                            })
                        }, 500)}
                        onPressEnter={handleSearchPressEnter}
                        style={{ width: 272 }}
                        maxLength={255}
                    />
                    {isResourcesList ? (
                        <LightweightSearch
                            formData={columnInfoSearchData}
                            onChange={(data, key) => {
                                setQueryParams({
                                    ...queryParams,
                                    ...data,
                                })
                            }}
                            defaultValue={{
                                shared_type: ShareTypeEnum.NOSHARE,
                            }}
                        />
                    ) : null}
                </div>
            </div>
            <div
                className={classnames(
                    styles.dirColumnContent,
                    'dirColumnContent',
                )}
                hidden={
                    loading || (!searchKey && !tableProps.dataSource?.length)
                }
            >
                <ConfigProvider renderEmpty={() => showTableEmpty()}>
                    <Table
                        rowKey={(record) => record.id}
                        columns={
                            governmentStatus
                                ? column
                                : column.filter(
                                      (item: any) =>
                                          !governmentKeys.includes(item.key),
                                  )
                        }
                        {...props}
                        loading={false}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            pageSizeOptions: [12, 24, 50, 100],
                            showQuickJumper: true,
                            total: pagination.total,
                            showSizeChanger: true,
                            hideOnSinglePage: pagination.total <= 12,
                            showTotal: (count) => {
                                return `共 ${count} 条记录`
                            },
                        }}
                        scroll={{
                            // x: 1600,
                            y:
                                // 搜索后数据为空情况
                                searchKey && !tableProps.dataSource?.length
                                    ? undefined
                                    : pagination.total > 12
                                    ? showTitle
                                        ? 'calc(100vh - 292px)'
                                        : 'calc(100vh - 360px)'
                                    : 'calc(100vh - 338px)',
                        }}
                    />
                </ConfigProvider>
            </div>
            {!loading &&
                !searchKey &&
                !tableProps.dataSource?.length &&
                showTableEmpty()}

            {/* 详情弹窗 */}
            <Modal
                title={`${__('信息项')}`}
                width={800}
                open={detailsOpen}
                onOk={() => setDetailsOpen(false)}
                onCancel={() => setDetailsOpen(false)}
                footer={null}
                destroyOnClose
            >
                <div className={styles.detailBox}>
                    <DetailsLabel detailsList={fieldDetails} />
                </div>
            </Modal>
        </div>
    )
}

export default DirColumnInfo
