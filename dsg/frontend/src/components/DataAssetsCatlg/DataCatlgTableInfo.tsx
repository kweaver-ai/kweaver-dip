import React, { useEffect, useState, useMemo } from 'react'

import Icon from '@ant-design/icons'
import { Table, Tag, Tooltip } from 'antd'
import { useAntdTable } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import { isNumber, noop } from 'lodash'
import moment from 'moment'
import classnames from 'classnames'
import styles from './styles.module.less'
import { ExplorOutlined } from '@/icons'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import {
    DataCatlgTabKey,
    filedInfoColumns,
    formatCatlgError,
    SampleType,
    ViewIconList,
} from './helper'
import Empty from '@/ui/Empty'
import {
    getGlobalConfigValue,
    reqBusinObjField,
    reqBusinObjSample,
    getExploreReport,
} from '@/core'
import { useQuery } from '@/utils'
import Loader from '@/ui/Loader'
import FieldsToolTips from '../DatasheetView/DataQuality/FieldsToolTips'

const DEFAULTPAGESIZE = 10

interface IDataCatlgTableInfoParams {
    tableInfoType: string
    id: string
    errorCallback?: (error?: any) => void
}

const DataCatlgTableInfo: React.FC<IDataCatlgTableInfoParams> = ({
    tableInfoType,
    id,
    errorCallback = noop,
}) => {
    const query = useQuery()
    const navigate = useNavigate()

    // 样例数据是否AI生成
    const [showAIGen, setShowAIGen] = useState(false)

    const sampleOptions = [
        { label: '默认', value: SampleType.DEFAULT },
        {
            label: (
                <Tooltip
                    title={__('点击生成AI数据')}
                    getPopupContainer={(n) => n}
                    placement="bottom"
                >
                    {__('AI生成')}
                </Tooltip>
            ),
            value: SampleType.AI,
        },
    ]

    // 样例数据类型
    const [sampleType, setSampleType] = useState(SampleType.DEFAULT)
    // 样例数据是否AI生成
    const [isSampleAI, setIsSampleAI] = useState(false)

    // 最新更新时间
    const [lastUpdTime, setLastUpdTime] = useState<number | undefined>()

    const [searchCondition, setSearchConditon] = useState<any>({
        id: id || '',
    })

    // 文件数据信息
    const fileInfoColumns = [
        {
            title: '文件名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, item) => {
                return (
                    <span title={text} className={styles.fileName}>
                        {ViewIconList?.fileIcon[item.type] || ''}
                        <a
                            href={item?.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {text || '--'}
                        </a>
                    </span>
                )
            },
        },
        {
            title: '文件类型',
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            editable: true,
            render: (text) => {
                return <span title={text}>{text || '--'}</span>
            },
        },
        {
            title: '大小',
            dataIndex: 'size',
            key: 'size',
            ellipsis: true,
            editable: true,
            render: (text) => {
                return <span title={text}>{text || '--'}</span>
            },
        },

        {
            title: '文件标签',
            dataIndex: 'tag',
            key: 'tag',
            ellipsis: true,
            render: (tag) => {
                return (
                    tag?.map((tItem) => (
                        <Tag key={tItem.info_key}>{tItem.info_value}</Tag>
                    )) || '--'
                )
            },
        },
        {
            title: '拥有者',
            dataIndex: 'owner',
            key: 'owner',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            render: (text) =>
                isNumber(text)
                    ? moment(text)?.format('YYYY/MM/DD hh:mm')
                    : '--',
        },
    ]

    const [columns, setColumns] = useState<Array<any>>()

    useEffect(() => {
        setLastUpdTime(undefined)
        if (tableInfoType !== DataCatlgTabKey.SAMPLTDATA) {
            run({ ...pagination, ...searchCondition })
        }
    }, [tableInfoType])

    // 获取样例数据-"AI生成" 显示与否配置
    const getSampleAIConfig = async () => {
        try {
            const res = await getGlobalConfigValue('AISampleDataShow')
            setShowAIGen(res?.value === 'YES')
        } catch (error) {
            formatCatlgError(error, errorCallback)
        }
    }

    useEffect(() => {
        setLastUpdTime(undefined)
        setSearchConditon({
            ...searchCondition,
            offset: 1,
        })
        if (sampleType === SampleType.DEFAULT) {
            getSampleAIConfig()
        }
        run({ ...pagination, ...searchCondition, current: 1 })
    }, [sampleType])

    const getDataCatlgTableList = async (params: any) => {
        try {
            const { current: offset, pageSize: limit, catalogID } = params

            let res: any

            if (tableInfoType === DataCatlgTabKey.FIELDINFO) {
                res = await reqBusinObjField({
                    id,
                    limit,
                    offset,
                })
                setColumns(filedInfoColumns)

                return {
                    total: res?.total_count || 0,
                    list: res?.entries || [],
                }
            }

            // 样例数据
            if (tableInfoType === DataCatlgTabKey.SAMPLTDATA) {
                res = await reqBusinObjSample({
                    catalogID: id,
                    type: 1,
                })
                const reportRes = await getExploreReport({
                    id,
                    is_full_report: false,
                })

                // 默认-最新更新时间
                setLastUpdTime(res?.update_time)

                // 样例数据是否AI生成
                setIsSampleAI(res?.is_ai)

                setColumns(
                    res?.columns?.map((cItem) => {
                        const reportInfo =
                            reportRes?.data?.explore_details.find(
                                (it) => it.field_name_en === cItem.en_col_name,
                            )
                        return {
                            title: (
                                <div
                                    title={`${cItem.en_col_name} ${cItem.cn_col_name}`}
                                >
                                    <div>
                                        {cItem.en_col_name}
                                        {reportInfo && (
                                            <Tooltip
                                                // autoAdjustOverflow={false}
                                                color="white"
                                                placement="bottom"
                                                overlayClassName="reportInfoTitleTipsWrapper"
                                                title={
                                                    <FieldsToolTips
                                                        ruleData={reportInfo}
                                                    />
                                                }
                                            >
                                                <ExplorOutlined
                                                    style={{
                                                        marginLeft: '5px',
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div>{cItem.cn_col_name}</div>
                                </div>
                            ),
                            dataIndex: cItem.en_col_name,
                            key: cItem.en_col_name,
                            ellipsis: true,
                            render: (text) => {
                                return (
                                    <div className={styles.tableTDContnet}>
                                        {/* {isNumber(text) || !!text ? text : '--'} */}
                                        {text}
                                    </div>
                                )
                            },
                        }
                    }) || [],
                )
                return {
                    total: res?.total_count || 0,
                    list:
                        res?.entries?.map((outItem, idx) => {
                            const tempItem = outItem
                            res?.columns.forEach((col) => {
                                const enName = col.en_col_name
                                if (
                                    outItem[enName] === 'null' ||
                                    outItem[enName] === ''
                                ) {
                                    tempItem[enName] = '--'
                                } else {
                                    tempItem[enName] = outItem[enName]
                                }
                            })
                            return tempItem
                        }) || [],
                }
            }
            return {
                total: res.total_count || 0,
                list: res?.entries || [],
            }
        } catch (error) {
            formatCatlgError(error, errorCallback)
            return { total: 0, list: [] }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(
        getDataCatlgTableList,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    const props: any = useMemo(() => {
        const p: { dataSource; loading; onChange; [key: string]: any } =
            tableProps
        return p
    }, [tableProps])

    return (
        <div className={styles.rescItemWrapper}>
            <div className={styles.itemHeaderWrapper}>
                <div
                    className={classnames(
                        styles.dq_subTitleWrapper,
                        tableInfoType === DataCatlgTabKey.FILEDATA &&
                            styles.fileInfoItemTitle,
                    )}
                >
                    <Icon component={icon1} className={styles.icon} />
                    <div className={styles.title}>
                        {tableInfoType === DataCatlgTabKey.FIELDINFO &&
                            __('信息项')}
                        {tableInfoType === DataCatlgTabKey.SAMPLTDATA &&
                            __('样例数据')}
                        {tableInfoType === DataCatlgTabKey.FILEDATA &&
                            __('文件数据')}
                    </div>
                </div>
                {/* {tableInfoType === DataCatlgTabKey.FIELDINFO && (
                    <>
                        {downloadAccess === DownloadAccess.Yes && (
                            <div className={styles.countWrapper}>
                                {selectedFieldsKeys.length > 0 && (
                                    <>
                                        <FieldsDownloadColored />
                                        <span
                                            className={
                                                styles.selectedFieldsCount
                                            }
                                        >
                                            {__('已选中${count}个字段', {
                                                count: selectedFieldsKeys.length,
                                            })}
                                        </span>
                                    </>
                                )}

                                <Button
                                    type="primary"
                                    onClick={() => setDownloadConfigOpen(true)}
                                    className={styles.downloadBtn}
                                    disabled={selectedFieldsKeys.length === 0}
                                >
                                    {__('下载')}
                                </Button>
                            </div>
                        )} 
                        {downloadAccess !== DownloadAccess.Yes && (
                            <Button
                                type="primary"
                                onClick={() => setApplyDownloadPerOpen(true)}
                                className={styles.downloadBtn}
                                disabled={
                                    downloadAccess === DownloadAccess.Auditing
                                }
                            >
                                {downloadAccess === DownloadAccess.Auditing
                                    ? __('下载权限审核中')
                                    : __('申请下载')}
                            </Button>
                        )}
                    </>
                )} */}
            </div>
            {tableProps?.loading ? (
                <div className={styles.tableLoading}>
                    <Loader />
                </div>
            ) : tableProps?.dataSource?.length > 0 ? (
                <div className={styles.tableWrapper}>
                    <div
                        className={
                            sampleType === SampleType.AI
                                ? styles.tableMask
                                : undefined
                        }
                    />
                    <Table
                        {...props}
                        className={classnames(
                            sampleType === SampleType.AI
                                ? styles.animTable
                                : undefined,
                            tableInfoType === DataCatlgTabKey.SAMPLTDATA &&
                                styles.sampleTable,
                            tableInfoType === DataCatlgTabKey.FIELDINFO &&
                                styles.filedTable,
                        )}
                        rowKey={(record) => record.id || record.index}
                        columns={columns}
                        pagination={
                            tableInfoType !== DataCatlgTabKey.SAMPLTDATA && {
                                ...tableProps.pagination,
                                showSizeChanger: false,
                                hideOnSinglePage: true,
                            }
                        }
                        bordered={false}
                    />
                    {tableInfoType === DataCatlgTabKey.SAMPLTDATA &&
                        isSampleAI && (
                            <div className={styles.aiTableDesc}>
                                {__(
                                    '此数据为AI生成，希望以上样例数据能对您有帮助！',
                                )}
                            </div>
                        )}
                </div>
            ) : (
                <div className={styles.empty}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            )}
        </div>
    )
}

export default DataCatlgTableInfo
