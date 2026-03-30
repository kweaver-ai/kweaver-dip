import { memo, useContext, useEffect, useMemo, useState } from 'react'
import { useAntdTable } from 'ahooks'
import { Space, Table, Tooltip, message } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { isNil } from 'lodash'
import { FontIcon } from '@/icons'
import { MicroWidgetPropsContext } from '@/context'
import {
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    getSynthData,
    formatError,
    getLogicViewSampleData,
    SampleDataType,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Loader, Watermark, Empty, ListDefaultPageSize, ListType } from '@/ui'

import { VIEWERRORCODElIST } from '../const'
import { getFieldTypeEelment } from '../helper'
import styles from './styles.module.less'
import __ from './locale'
import dataEmpty from '@/assets/dataEmpty.svg'

const listType = ListType.WideList

const defaultListSize = ListDefaultPageSize[listType]

interface ISynthData {
    id: string
    // 服务超市中，是否显示权限申请按钮
    isShowAuditProcessBtn?: boolean
    formViewStatus?: string
    // 是否数据服务超市
    isMarket?: boolean
    enableRealData?: boolean
    catalogId?: string
}

const SynthData = ({
    id,
    formViewStatus = '',
    isMarket = true,
    enableRealData = false,
    catalogId,
}: ISynthData) => {
    // useCogAsstContext 已移除，相关功能已下线
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const [columns, setColumns] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [isErr, setIsErr] = useState<boolean>(false)
    const [userInfo] = useCurrentUser()
    const [viewDetailRes, setViewDetailRes] = useState<any>()
    const [isAIData, setIsAIData] = useState<boolean>(true)

    // 合成数据所有数据
    const [synthData, setSynthData] = useState<any>(undefined)
    // 合成数据错误类型
    const [synthError, setSynthError] = useState<any>()

    // 获取全量数据/合成数据
    const initTableData = async (_params) => {
        try {
            setLoading(true)
            const { current, pageSize } = _params
            let res = viewDetailRes || {}
            if (!viewDetailRes) {
                res = await getDatasheetViewDetails(id)
                const baseRes = await getDataViewBaseInfo(id)
                setViewDetailRes({
                    ...baseRes,
                    ...res,
                })
            }

            let res2: any = {}
            // 所有行数据(不分页数据)
            let originTableList: any[] = []
            // table显示的数据(分页数据)
            const tableList: any[] = []
            let total = 0

            if (!synthData) {
                // 获取合成数据
                res2 =
                    enableRealData && catalogId
                        ? await getLogicViewSampleData(catalogId)
                        : await getSynthData(id)
                setSynthData(res2)
                setIsAIData(!res2?.type || res2.type !== SampleDataType.Real)
                const resColumns =
                    res2?.columns?.map((item) => {
                        return {
                            ...item,
                            technical_name: item.name,
                            business_name: res?.fields?.find(
                                (it) => it.technical_name === item.name,
                            )?.business_name,
                        }
                    }) || []
                setColumns(
                    resColumns.map((cItem) => {
                        return {
                            title: (
                                <div style={{ padding: '9px 16px' }}>
                                    <div className={styles.tableTDContnet}>
                                        <span className={styles.nameIcon}>
                                            {getFieldTypeEelment(
                                                cItem,
                                                20,
                                                'top',
                                            )}
                                        </span>
                                        <span
                                            title={`${cItem.business_name}`}
                                            className={styles.businessTitle}
                                        >
                                            {cItem.business_name}
                                        </span>
                                    </div>
                                    <div
                                        className={classnames(
                                            styles.tableTDContnet,
                                            styles.subTableTDContnet,
                                        )}
                                        title={`${cItem.technical_name}`}
                                    >
                                        {cItem.technical_name}
                                    </div>
                                </div>
                            ),
                            dataIndex: cItem.technical_name,
                            key: cItem.technical_name,
                            ellipsis: true,
                            render: (text) => {
                                const isInvalidValue =
                                    text === '' || isNil(text)

                                const name = isInvalidValue
                                    ? __('暂无数据')
                                    : text === false ||
                                      text === true ||
                                      text === 0
                                    ? `${text}`
                                    : text
                                return (
                                    <div
                                        className={styles.tableTDContnet}
                                        style={{
                                            padding: '9px 16px',
                                        }}
                                    >
                                        {/* <span
                                            title={`${name}`}
                                            className={classnames(
                                                styles.businessTitle,
                                                isInvalidValue &&
                                                    styles.emptyTitle,
                                            )}
                                        >
                                            {name}
                                        </span> */}
                                        <Tooltip
                                            title={
                                                isInvalidValue && __('暂无数据')
                                            }
                                        >
                                            <span
                                                title={
                                                    isInvalidValue
                                                        ? ''
                                                        : `${name}`
                                                }
                                                className={classnames(
                                                    styles.businessTitle,
                                                    isInvalidValue &&
                                                        styles.emptyTitle,
                                                )}
                                            >
                                                {name}
                                            </span>
                                        </Tooltip>
                                    </div>
                                )
                            },
                        }
                    }) || [],
                )
            } else {
                res2 = synthData
            }
            total = res2?.data?.length || 0
            originTableList = Object.assign([], res2?.data)
            const startIndex = (current - 1) * pageSize
            const endIndex = current * pageSize
            const names = res2?.columns?.map((item) => item.name)
            originTableList
                ?.slice(startIndex, endIndex)
                ?.forEach((fieldNamesAndVal, _index) => {
                    const obj: any = {}
                    fieldNamesAndVal?.forEach((_item, index) => {
                        if (_item && typeof _item === 'object') {
                            const { column_name = '', column_value } = _item
                            obj[column_name] = column_value
                        } else {
                            obj[names[index]] = _item
                        }
                    })
                    tableList.push(obj)
                })

            setLoading(false)
            return {
                total: originTableList?.length || 0,
                list: tableList,
            }
        } catch (err) {
            const errCode = err?.data?.code || ''
            // setErrCode(errCode)
            setSynthError(errCode)

            if (errCode === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                // messageInfo(__('库表与源表的字段不一致'))
            } else if (errCode === VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE) {
                // messageInfo(__('库表数据为空，不能生成合成数据'))
            } else if (errCode === VIEWERRORCODElIST.ADGENERATING) {
                // 合成数据生成中
                // 依旧显示加载中
                // formatError(err, microWidgetProps?.components?.toast)
                return {
                    total: 0,
                    list: [],
                }
            } else if (errCode === VIEWERRORCODElIST.VIEWTABLEFIELD) {
                // 库表与源表的字段不一致
                message.info({
                    icon: <InfoCircleFilled className={styles.infoIcon} />,
                    content: <span>{err?.data?.description}</span>,
                    duration: 5,
                    className: styles.sampleMsgInfo,
                })
            } else if (errCode === VIEWERRORCODElIST.AFSAILORERROR) {
                // af-sailor服务挂掉
                message.warning({
                    icon: <InfoCircleFilled className={styles.infoIcon} />,
                    content: __('无法连接af-sailor服务，信息获取失败'),
                    className: styles.sampleMsgInfo,
                })
            } else if (errCode.toLocaleLowerCase().includes('sailor')) {
                // 解析失败
                message.error(
                    __(
                        '库表存在数据类型和真实数据不匹配的情况，无法解析数据，可联系库表管理人员调整',
                    ),
                )
            } else {
                formatError(err, microWidgetProps?.components?.toast)
            }
            setLoading(false)

            return {
                total: 0,
                list: [],
            }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(initTableData, {
        defaultPageSize: defaultListSize,
        manual: true,
    })

    useEffect(() => {
        if (id) {
            run({ ...pagination, current: 1 })
        }
    }, [enableRealData, id])

    const props: any = useMemo(() => {
        const p: { dataSource; loading; onChange; [key: string]: any } =
            tableProps
        return p
    }, [tableProps])

    const empty = () => {
        if (isMarket) {
            // if (!llm) {
            //     // 无大模型
            //     return (
            //         <div className={isMarket ? styles.marketEmpty : ''}>
            //             <Empty iconSrc={dataEmpty} desc={__('暂无样例数据')} />
            //         </div>
            //     )
            // }
            if (!tableProps?.dataSource?.length && synthError) {
                if (synthError === VIEWERRORCODElIST.VIEWTABLEFIELD) {
                    // 库表与源表的字段不一致，无法查看数据
                    return (
                        <div className={isMarket ? styles.marketEmpty : ''}>
                            <Empty
                                iconSrc={dataEmpty}
                                desc={__(
                                    '库表与源表的字段不一致，无法查看数据',
                                )}
                            />
                        </div>
                    )
                }
                if (synthError === VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE) {
                    // 源表无任何数据信息，导致合成数据为空时
                    return (
                        <div className={isMarket ? styles.marketEmpty : ''}>
                            <Empty
                                iconSrc={dataEmpty}
                                desc={__('库表数据为空，不能生成合成数据')}
                            />
                        </div>
                    )
                }
                if (synthError.toLocaleLowerCase().includes('sailor')) {
                    // 解析失败
                    return (
                        <div className={isMarket ? styles.marketEmpty : ''}>
                            <Empty
                                iconSrc={dataEmpty}
                                desc={
                                    <div style={{ textAlign: 'center' }}>
                                        <div>{__('暂无可展示的数据')}</div>
                                        <div>
                                            {__(
                                                '库表存在数据类型和真实数据不匹配的情况，无法解析并获取到数据，',
                                            )}
                                        </div>
                                        <div>
                                            {__('可联系库表管理人员调整')}
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    )
                }
                // 加载失败
                return (
                    <div className={isMarket ? styles.marketEmpty : ''}>
                        <Empty
                            iconSrc={dataEmpty}
                            desc={
                                <Space
                                    direction="vertical"
                                    align="center"
                                    size={8}
                                >
                                    <div>{__('加载失败')}</div>
                                    <div>
                                        <a
                                            onClick={() =>
                                                run({
                                                    ...pagination,
                                                    current: 1,
                                                })
                                            }
                                        >
                                            {__('重新加载')}
                                        </a>
                                    </div>
                                </Space>
                            }
                        />
                    </div>
                )
            }
            return (
                <div className={isMarket ? styles.marketEmpty : ''}>
                    <Empty
                        desc={
                            isErr
                                ? __(
                                      '源表已修改，请联系系统管理员重新发布后查看',
                                  )
                                : formViewStatus === 'delete'
                                ? __('源表已删除，无法查看全量数据')
                                : __('暂无数据')
                        }
                        iconSrc={dataEmpty}
                    />
                </div>
            )
        }

        return (
            <div
                style={{
                    padding: '80px 0',
                }}
            >
                <Empty
                    desc={
                        isErr
                            ? __('源表已修改，请联系系统管理员重新发布后查看')
                            : formViewStatus === 'delete'
                            ? __('源表已删除，无法查看全量数据')
                            : __('暂无数据')
                    }
                    iconSrc={dataEmpty}
                />
            </div>
        )
    }

    return loading ? (
        <Loader />
    ) : tableProps?.dataSource?.length > 0 ? (
        <div
            className={styles.tableWrapper}
            style={{
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                rowGap: 16,
            }}
        >
            {isAIData && (
                <div>
                    <FontIcon
                        name="icon-xinxitishi"
                        style={{ color: '#FF6304', marginRight: 8 }}
                    />
                    {__(
                        '当前样例数据由AI生成，不能作为真实数据使用，仅供参考。',
                    )}
                </div>
            )}
            <Watermark
                content={`${userInfo?.VisionName || ''} ${
                    userInfo?.Account || ''
                }`}
            >
                <Table
                    {...props}
                    columns={columns}
                    className={styles.sampleTable}
                    rowKey={(record) => record.index}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    bordered
                    rowSelection={null}
                />
            </Watermark>
        </div>
    ) : (
        empty()
    )
}

export default memo(SynthData)
