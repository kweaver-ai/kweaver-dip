import { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { DatePickerProps, Tabs } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import {
    classifiyRescTypeColorMap,
    ClassStaticsInnerType,
    ClassStaticsType,
    rescTypeMap,
    StackedColumnPlot,
} from './helper'
import { Empty, Loader } from '@/ui'
import {
    formatError,
    IRescCatlgClassStatics,
    IRescCatlgOverviewParams,
    reqRescCatlgClassStatics,
} from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'

interface IClassficationStatics {
    filterDatePicker?: DatePickerProps['picker']
    dateParams?: any
}

const ClassficationStatics = (props: IClassficationStatics) => {
    const { filterDatePicker, dateParams } = props
    const [loading, setLoading] = useState(true)
    const dateFormatter = 'YYYY-MM-DD HH:mm:ss'
    const [filterParams, setFilterParams] = useState<IRescCatlgOverviewParams>()
    // 待审核ref
    const auditingChartRef = useRef<any>()
    // 已通过ref
    const passedChartRef = useRef<any>()
    // 未通过ref
    const failedChartRef = useRef<any>()
    // 反馈统计ref
    const fedbkStaticsRef = useRef<any>()

    // 图标chart
    const [auditingColumn, setAuditingColumn] = useState<any>([])
    const [passedColumn, setPassedColumn] = useState<any>([])
    const [failedColumn, setFailedColumn] = useState<any>([])

    const [staticsData, setStaticsData] = useState<IRescCatlgClassStatics>({})
    // 待审核tab key
    const [auditingTabKey, setAuditingTabKey] = useState<ClassStaticsInnerType>(
        ClassStaticsInnerType.Publish,
    )
    // 待审核-图表数据
    const [auditingData, setAuditingData] = useState<any>({})
    // 审核通过tab key
    const [passedTabKey, setPassedTabKey] = useState<ClassStaticsInnerType>(
        ClassStaticsInnerType.Publish,
    )
    // 审核通过-图表数据
    const [passedData, setPassedData] = useState<any>({})
    // 审核未通过tab key
    const [failedTabKey, setFailedTabKey] = useState<ClassStaticsInnerType>(
        ClassStaticsInnerType.Publish,
    )
    // 审核未通过-图表数据
    const [failedData, setFailedData] = useState<any>({})

    // 待审核tab
    const auditingTabItems = [
        {
            label: __('发布待审核'),
            // key: ClassStaticsInnerType.Publish,
            key: ClassStaticsInnerType.Publish,
        },
        {
            label: __('上线待审核'),
            // key:ClassStaticsInnerType.Online,
            key: ClassStaticsInnerType.Online,
        },
        {
            label: __('下线待审核'),
            // key: ClassStaticsInnerType.Offline,
            key: ClassStaticsInnerType.Offline,
        },
    ]

    // 通过tab
    const passedTabItems = [
        {
            label: __('发布通过'),
            // key: PublishStatus.PUBLISHED,
            key: ClassStaticsInnerType.Publish,
        },
        {
            label: __('上线通过'),
            // key: OnlineStatus.ONLINE,
            key: ClassStaticsInnerType.Online,
        },
        {
            label: __('下线通过'),
            // key: OnlineStatus.OFFLINE,
            key: ClassStaticsInnerType.Offline,
        },
    ]

    // 未通过tab
    const failedTabItems = [
        {
            label: __('发布未通过'),
            // key: PublishStatus.UNPUBLISHED,
            key: ClassStaticsInnerType.Publish,
        },
        {
            label: __('上线未通过'),
            // key: OnlineStatus.UP_REJECT,
            key: ClassStaticsInnerType.Online,
        },
        {
            label: __('下线未通过'),
            // key: OnlineStatus.DOWN_REJECT,
            key: ClassStaticsInnerType.Offline,
        },
    ]

    useEffect(() => {
        if (!dateParams) return
        setFilterParams(dateParams)
    }, [dateParams])

    useEffect(() => {
        getClassStatics(filterParams)
    }, [filterParams])

    useEffect(() => {
        if (!staticsData || loading) return
        if (staticsData) {
            setAuditingData(staticsData?.auditing?.[auditingTabKey])
            setPassedData(staticsData?.pass?.[passedTabKey])
            setFailedData(staticsData?.reject?.[failedTabKey])
            const column1 = renderStaticsColumn(
                auditingChartRef?.current,
                staticsData?.auditing?.[auditingTabKey],
            )
            const column2 = renderStaticsColumn(
                passedChartRef?.current,
                staticsData?.pass?.[passedTabKey],
            )
            const column3 = renderStaticsColumn(
                failedChartRef?.current,
                staticsData?.reject?.[failedTabKey],
            )
            setAuditingColumn(column1)
            setPassedColumn(column2)
            setFailedColumn(column3)

            renderStaticsColumn(
                fedbkStaticsRef?.current,
                staticsData.feedback_count,
            )
        }
    }, [staticsData, loading])

    useUpdateEffect(() => {
        auditingColumn?.destroy?.()
        setAuditingData(staticsData?.auditing?.[auditingTabKey])
        const column = renderStaticsColumn(
            auditingChartRef?.current,
            staticsData?.auditing?.[auditingTabKey],
        )
        setAuditingColumn(column)
    }, [auditingTabKey])

    useUpdateEffect(() => {
        passedColumn?.destroy?.()
        setPassedData(staticsData?.pass?.[passedTabKey])
        const column = renderStaticsColumn(
            passedChartRef?.current,
            staticsData?.pass?.[passedTabKey],
        )
        setPassedColumn(column)
    }, [passedTabKey])

    useUpdateEffect(() => {
        failedColumn?.destroy?.()
        setFailedData(staticsData?.reject?.[failedTabKey])
        const column = renderStaticsColumn(
            failedChartRef?.current,
            staticsData?.reject?.[failedTabKey],
        )
        setFailedColumn(column)
    }, [failedTabKey])

    const renderStaticsColumn = (container: any, data: any) => {
        if (container && data) {
            const column = StackedColumnPlot(container, data, {
                xField: 'dive',
                yField: 'count',
                seriesField: 'typeName',
                isGroup: true,
                // isStack: false,
                // isGroup:
                //     _.uniq(data?.map((item) => item.dive) || []).length > 1,
                intervalPadding: undefined,
                dodgePadding: undefined,
                columnWidthRatio: 0.28,
                tooltip: {
                    showTitle: false,
                    shared: false,
                    position: 'top',
                },

                padding: [48, 0, 32, 48],
                // color: ['#A0D7E7', '#8894FF', '#79ADF7', '#59A3FF'],
                color: ({ typeName }: any) => {
                    return classifiyRescTypeColorMap[typeName]
                },
                // 概览数据右上角展示
                // legend: {
                //     layout: 'horizontal',
                //     position: 'top-right',
                //     marker: {
                //         symbol: 'circle',
                //     },
                // },
                columnStyle: {
                    radius: [5, 5, 0, 0],
                    // fill: columnColorList[StaticsType.Aduiting],
                    strokeOpacity: 0,
                },
                // minColumnWidth: 22,
                // maxColumnWidth: 22,
            })
            column?.render()
            return column
        }
        return undefined
    }

    const itemList = ['auditing', 'pass', 'reject']

    const staticsItemList = useMemo(
        () => [
            {
                ref: auditingChartRef,
                data: staticsData?.auditing?.[auditingTabKey],
                key: ClassStaticsType.Aduiting,
                tabKey: auditingTabKey,
                tabItems: auditingTabItems,
                onTabChange: (tabKey: string) =>
                    setAuditingTabKey(tabKey as ClassStaticsInnerType),
            },
            {
                ref: passedChartRef,
                data: staticsData?.pass?.[passedTabKey],
                key: ClassStaticsType.Passed,
                tabKey: passedTabKey,
                tabItems: passedTabItems,
                onTabChange: (tabKey: string) =>
                    setPassedTabKey(tabKey as ClassStaticsInnerType),
            },
            {
                ref: failedChartRef,
                data: staticsData?.reject?.[failedTabKey],
                key: ClassStaticsType.Failed,
                tabKey: failedTabKey,
                tabItems: failedTabItems,
                onTabChange: (tabKey: string) =>
                    setFailedTabKey(tabKey as ClassStaticsInnerType),
            },
            {
                ref: fedbkStaticsRef,
                data: staticsData?.feedback_count,
            },
        ],
        [staticsData],
    )

    const renderStaticsItemNode = (item) => {
        const { ref, data = [], key, tabKey, tabItems = [], onTabChange } = item
        return (
            <div key={key}>
                {tabItems?.length > 0 && (
                    <Tabs
                        activeKey={tabKey}
                        onChange={(e) => {
                            // onTabChange(e)
                            if (key === ClassStaticsType.Aduiting) {
                                setAuditingTabKey(e as ClassStaticsInnerType)
                            } else if (key === ClassStaticsType.Passed) {
                                setPassedTabKey(e as ClassStaticsInnerType)
                            } else if (key === ClassStaticsType.Failed) {
                                setFailedTabKey(e as ClassStaticsInnerType)
                            }
                        }}
                        items={tabItems}
                    />
                )}
                {!loading && !data?.length && (
                    // <div style={{ position: 'absolute', width: '100%' }}>
                    <div>
                        <Empty iconSrc={dataEmpty} desc="暂无数据" />
                    </div>
                )}
                {data?.length > 0 && (
                    <>
                        {/* {tabItems?.lnegth > 0 && (
                            <Tabs
                                activeKey={tabKey}
                                onChange={onTabChange}
                                items={tabItems}
                            />
                        )} */}
                        <div
                            ref={ref}
                            style={{
                                height: '266px',
                                width: '100%',
                                padding: '0 16px',
                                visibility:
                                    loading || !data?.length
                                        ? 'hidden'
                                        : 'visible',
                            }}
                        />
                    </>
                )}
            </div>
        )
    }

    // useEffect(() => {
    //     setAuditingData()
    // },[auditingTabKey])

    const getClassStatics = async (params: any) => {
        if (!params) return
        try {
            setLoading(true)
            const { date, ...restPrams } = params
            const start = date[0].startOf(params.type).format(dateFormatter)
            const end = date[1].endOf(params.type).format(dateFormatter)
            const res = await reqRescCatlgClassStatics({
                ...restPrams,
                start,
                end,
            })
            const { catalog_count = {}, ...rest } = res

            const newCatlogCount: any = Object.keys(catalog_count)?.reduce(
                (acc, auditKey) => {
                    const newAcc = Object.keys(
                        catalog_count?.[auditKey] || {},
                    )?.reduce((newObj, pubTypeKey) => {
                        // eslint-disable-next-line no-param-reassign
                        newObj[pubTypeKey] = catalog_count?.[auditKey]?.[
                            pubTypeKey
                        ]?.map((item, index) => ({
                            ...item,
                            typeName: rescTypeMap[item.type],
                        }))
                        return newObj
                    }, {})
                    acc[auditKey] = newAcc
                    return acc
                },
                {},
            )
            const newFedBackCount = res.feedback_count?.map((item) => ({
                ...item,
                typeName: rescTypeMap[item.type],
            }))

            setStaticsData({
                ...rest,
                ...newCatlogCount,
                feedback_count: newFedBackCount,
            })
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return loading ? (
        <div className={styles.loadingWrapper}>
            <Loader />
        </div>
    ) : (
        <div className={styles.classStaticsWrapper}>
            <div className={styles.classStaticsTitle}>{__('目录统计')}</div>
            <div className={styles.catlgStaticsWrapper}>
                <div className={styles.staticsItemWrapper}>
                    {/* <Tabs
                        activeKey={auditingTabKey}
                        onChange={(tabKey: string) =>
                            setAuditingTabKey(tabKey as ClassStaticsInnerType)
                        }
                        items={auditingTabItems}
                    /> */}
                    {/* <Space split={<Divider type="vertical" />}>
                        <a
                            className={classnames(
                                styles.tabLink,
                                auditingTabKey ===
                                    ClassStaticsInnerType.Publish &&
                                    styles.activeLink,
                            )}
                            onClick={() => {
                                // setFilterParams({
                                //     ...filterParams,
                                //     auditingTabKey: ClassStaticsInnerType.Publish,
                                // })
                                setAuditingTabKey(ClassStaticsInnerType.Publish)
                            }}
                        >
                            发布待审核
                        </a>
                        <a
                            className={classnames(
                                styles.tabLink,
                                auditingTabKey ===
                                    ClassStaticsInnerType.Online &&
                                    styles.activeLink,
                            )}
                            onClick={() => {
                                // setFilterParams({
                                //     ...filterParams,
                                //     auditingTabKey:ClassStaticsInnerType.Online,
                                // })
                                setAuditingTabKey(ClassStaticsInnerType.Online)
                            }}
                        >
                            上线待审核
                        </a>
                        <a
                            className={classnames(
                                styles.tabLink,
                                auditingTabKey ===
                                    ClassStaticsInnerType.Offline &&
                                    styles.activeLink,
                            )}
                            onClick={() => {
                                // setFilterParams({
                                //     ...filterParams,
                                //     auditingTabKey: ClassStaticsInnerType.Offline,
                                // })
                                setAuditingTabKey(ClassStaticsInnerType.Offline)
                            }}
                        >
                            下线待审核
                        </a>
                    </Space> */}
                    {/* <div
                        ref={auditingChartRef}
                        style={{
                            height: '390px',
                            width: '100%',
                            visibility: loading ? 'hidden' : 'visible',
                        }}
                        hidden={!staticsData?.auditing?.[auditingTabKey]}
                    />
                    {staticsData?.auditing?.[auditingTabKey] && (
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    )} */}

                    {/* {staticsItemList?.map((item) =>
                        renderStaticsItemNode(item),
                    )} */}

                    <Tabs
                        activeKey={auditingTabKey}
                        onChange={(e) => {
                            setAuditingTabKey(e as ClassStaticsInnerType)
                        }}
                        items={auditingTabItems}
                    />

                    {!loading &&
                        !staticsData?.auditing?.[auditingTabKey]?.length && (
                            // <div style={{ position: 'absolute', width: '100%' }}>
                            <div>
                                <Empty iconSrc={dataEmpty} desc="暂无数据" />
                            </div>
                        )}
                    {!!staticsData?.auditing?.[auditingTabKey]?.length && (
                        <div
                            ref={auditingChartRef}
                            style={{
                                height: '266px',
                                width: '100%',
                                padding: '0 16px',
                                visibility:
                                    loading ||
                                    !staticsData?.auditing?.[auditingTabKey]
                                        ?.length
                                        ? 'hidden'
                                        : 'visible',
                            }}
                        />
                    )}
                </div>
                <div className={styles.staticsItemWrapper}>
                    <Tabs
                        activeKey={passedTabKey}
                        onChange={(e) => {
                            setPassedTabKey(e as ClassStaticsInnerType)
                        }}
                        items={passedTabItems}
                    />

                    {!loading && !staticsData?.pass?.[passedTabKey]?.length && (
                        <div>
                            <Empty iconSrc={dataEmpty} desc="暂无数据" />
                        </div>
                    )}
                    {/* {!!staticsData?.pass?.[passedTabKey]?.length && ( */}
                    <div
                        ref={passedChartRef}
                        style={{
                            height: '266px',
                            width: '100%',
                            padding: '0 16px',
                            display:
                                loading ||
                                !staticsData?.pass?.[passedTabKey]?.length
                                    ? 'none'
                                    : undefined,
                            visibility:
                                loading ||
                                !staticsData?.pass?.[passedTabKey]?.length
                                    ? 'hidden'
                                    : 'visible',
                        }}
                    />
                    {/* )} */}
                </div>
                <div className={styles.staticsItemWrapper}>
                    <Tabs
                        activeKey={failedTabKey}
                        onChange={(e) => {
                            setFailedTabKey(e as ClassStaticsInnerType)
                        }}
                        items={failedTabItems}
                    />

                    {!loading &&
                        !staticsData?.reject?.[failedTabKey]?.length && (
                            <div>
                                <Empty iconSrc={dataEmpty} desc="暂无数据" />
                            </div>
                        )}
                    {/* {!!staticsData?.reject?.[failedTabKey]?.length && ( */}
                    <div
                        ref={failedChartRef}
                        style={{
                            height: '266px',
                            width: '100%',
                            padding: '0 16px',
                            display:
                                loading ||
                                !staticsData?.reject?.[failedTabKey]?.length
                                    ? 'none'
                                    : undefined,
                            visibility:
                                loading ||
                                !staticsData?.reject?.[failedTabKey]?.length
                                    ? 'hidden'
                                    : 'visible',
                        }}
                    />
                    {/* )} */}
                </div>
                <div className={styles.feedback_countWrapper}>
                    <div className={styles.classStaticsTitle}>
                        {__('反馈统计')}
                    </div>

                    <div className={styles.staticsItemWrapper}>
                        {!loading && !staticsData?.feedback_count?.length && (
                            <div>
                                <Empty iconSrc={dataEmpty} desc="暂无数据" />
                            </div>
                        )}

                        <div
                            ref={fedbkStaticsRef}
                            style={{
                                height: '266px',
                                width: '100%',
                                padding: '0 16px',
                                visibility:
                                    loading ||
                                    !staticsData?.feedback_count?.length
                                        ? 'hidden'
                                        : 'visible',
                            }}
                            hidden={
                                loading || !staticsData?.feedback_count?.length
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ClassficationStatics
