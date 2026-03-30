/* eslint-disable no-param-reassign */
import React, { useState, useEffect, useMemo } from 'react'
import { ConfigProvider, Input, Table, Modal, Radio } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { SearchOutlined } from '@ant-design/icons'
import { useAntdTable } from 'ahooks'
import { isNumber, trim, debounce } from 'lodash'
import classnames from 'classnames'
import {
    formatError,
    queryInfoResCatlgColumns,
    getRescDirDetail,
    dataTypeMapping,
} from '@/core'
import styles from './styles.module.less'
import Loader from '@/ui/Loader'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { InfoItemsDetail, ShareTypeEnum, OpenTypeEnum } from '../const'
import CommonIcon from '../../CommonIcon'
import { ReactComponent as pkSvg } from '@/icons/svg/outlined/pk.svg'
import DetailsLabel from '../../../ui/DetailsLabel'
import { SearchInput } from '@/ui'
import { UniqueFlagColored } from '@/icons'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { InfoCatlgItemDataTypeOptions } from '../EditInfoRescCatlg/helper'

interface DirColumnInfoProps {
    catalogId: string
    // showTitle?: boolean
}

// DirDetailContent传参数
const DirColumnInfo: React.FC<DirColumnInfoProps> = (infoProps: any) => {
    const { catalogId } = infoProps
    const [loading, setLoading] = useState(true)
    const [detailsOpen, setDetailsOpen] = useState(false)

    const [searchKey, setSearchKey] = useState('')
    const [{ using, governmentSwitch }] = useGeneralConfig()

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    const governmentKeys = [
        'source_system',
        'source_system_level',
        'info_item_level',
    ]

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            catalogId,
            keyword: searchKey || '',
            current: 1,
        })
    }, [catalogId])

    const column: ColumnsType<any> = [
        {
            title: __('信息项名称'),
            key: 'name',
            dataIndex: 'name',
            width: 220,
            ellipsis: true,
            render: (text, record) => {
                return (
                    <div className={styles.infoNames}>
                        <div>
                            <div className={styles.catlgNameCont} title={text}>
                                <span
                                    title={text}
                                    className={classnames(
                                        styles.names,
                                        styles.primaryColor,
                                        record.is_primary_key &&
                                            styles.iconWidth,
                                    )}
                                    // onClick={() => {
                                    //     fieldDetail(record)
                                    // }}
                                >
                                    {text || '--'}
                                </span>
                                {record.is_primary_key && (
                                    <UniqueFlagColored
                                        className={styles.typeIcon}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )
            },
        },

        {
            title: __('映射字段'),
            key: 'field_name_cn',
            dataIndex: 'field_name_cn',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return (
                    <span title={text}>
                        {record?.field_name_en
                            ? `${record?.field_name_cn}（${record?.field_name_en}）`
                            : '--'}
                    </span>
                )
            },
        },
        {
            title: __('关联数据元'),
            key: 'data_refer',
            dataIndex: 'data_refer',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return <span title={text}>{text?.name || '--'}</span>
            },
        },
        {
            title: __('关联码表'),
            key: 'code_set',
            dataIndex: 'code_set',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return <span title={text}>{text?.name || '--'}</span>
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'metadata',
            key: 'metadata',
            ellipsis: true,
            width: 200,
            render: (metadata, record) => {
                const data_length = record?.metadata?.data_length
                    ? `${__('长度')}：${record?.metadata?.data_length}；`
                    : ''
                const ranges = record?.metadata?.data_range
                    ? `${__('值域')}：${record?.metadata?.data_range}`
                    : ''
                const info =
                    data_length || ranges ? `（${data_length}${ranges}）` : ''
                const val =
                    InfoCatlgItemDataTypeOptions.find(
                        (item) => item.value === metadata?.data_type,
                    )?.label || ''
                const title = `${val}${info}`
                return <span title={title}>{title || '--'}</span>
            },
        },
        {
            title: __('敏感属性'),
            key: 'is_sensitive',
            dataIndex: 'is_sensitive',
            width: 100,
            ellipsis: true,
            render: (value) => (value ? __('敏感') : __('不敏感')),
        },
        {
            title: __('涉密属性'),
            key: 'is_secret',
            dataIndex: 'is_secret',

            width: 100,
            ellipsis: true,
            render: (value) => (value ? __('涉密') : __('非涉密')),
        },
        {
            title: <span>{__('是否主键')}</span>,
            dataIndex: 'is_primary_key',
            key: 'is_primary_key',
            width: 100,
            render: (value) => (value ? __('是') : __('否')),
        },
        {
            title: <span>{__('是否增量字段')}</span>,
            dataIndex: 'is_incremental',
            key: 'is_incremental',
            width: 140,
            render: (value) => (value ? __('是') : __('否')),
        },
        {
            title: <span>{__('是否本部门产生')}</span>,
            dataIndex: 'is_local_generated',
            key: 'is_local_generated',
            width: 140,
            render: (value) => (value ? __('是') : __('否')),
        },
        {
            title: <span>{__('是否标准化')}</span>,
            dataIndex: 'is_standardized',
            key: 'is_standardized',
            width: 120,
            render: (value) => (value ? __('是') : __('否')),
        },
    ]

    const labelText = (text?: string | number) => {
        if (isNumber(text)) return text
        return text || '--'
    }

    // 初始params
    const initialQueryParams = {
        current: 1,
        pageSize: 10,
        keyword: '',
        catalogId,
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
        const { keyword, current: offset, pageSize: limit } = params

        try {
            setLoading(true)
            const res: any = await queryInfoResCatlgColumns({
                id: catalogId,
                keyword,
                offset,
                limit,
            })
            return {
                total: res?.total_count || 0,
                list: res?.entries || res?.columns || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getColumnInfo, {
        defaultPageSize: 10,
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
            <span>{__('暂无已完成字段')}</span>
        )
        const icon = searchKey ? searchEmpty : dataEmpty
        return (
            <Empty desc={desc} iconSrc={icon} className={styles.tableEmpty} />
        )
    }

    const fieldDetail = (row: any) => {
        InfoItemsDetail.forEach((item) => {
            if (item.key === 'shared_condition') {
                item.label =
                    row.shared_type === ShareTypeEnum.NOSHARE
                        ? __('不予共享依据')
                        : __('共享条件')
                item.hidden = row.shared_type === ShareTypeEnum.UNCONDITION
            }
            if (item.key === 'open_condition') {
                item.hidden = row.open_type === OpenTypeEnum.NOOPEN
            }
            item.value = row[item.key]
        })
        setDetailsOpen(true)
    }

    return (
        <div
            className={classnames(
                styles.dirColumnWapper,
                styles.showTitleColumnWapper,
            )}
        >
            <div className={styles.empty} hidden={!loading}>
                <Loader />
            </div>

            <div className={styles.dirColumnHeader} hidden={loading}>
                <div className={styles.columnTitle}>{__('信息项')}</div>
                <SearchInput
                    placeholder={__('搜索信息项名称')}
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
            </div>

            <div
                className={styles.dirColumnContent}
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
                            ...pagination,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                        }}
                        scroll={{
                            // x: 1600,
                            y:
                                // 搜索后数据为空情况
                                searchKey && !tableProps.dataSource?.length
                                    ? undefined
                                    : pagination.total > 10
                                    ? 'calc(100vh - 312px)'
                                    : 'calc(100vh - 248px)',
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
                    <DetailsLabel detailsList={InfoItemsDetail} />
                </div>
            </Modal>
        </div>
    )
}

export default DirColumnInfo
