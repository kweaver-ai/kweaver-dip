import { useEffect, useRef, useState } from 'react'
import classnames from 'classnames'
import { Column } from '@antv/g2plot'
import { Row, Col, Progress, Tooltip } from 'antd'
import { round, sumBy, toNumber } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import {
    catlgFedbkStaticsList,
    catlgUseStaticsList,
    ColumnPlot,
    OverviewResTypeEnum,
    PiePlot,
    rescCatlgStaticsGroupIds,
    resTypeList,
    shareStaticsList,
    StackedColumnPlot,
} from './helper'
import { formatError, reqRescCatlgOverview } from '@/core'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatNumber } from '@/utils'

const Overview = () => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState<any>({})
    // 审批统计-柱状图相关信息
    const barChartRef = useRef<HTMLDivElement>(null)
    // 目录共享统计-柱状图相关信息
    const shareInfoChartRef = useRef<HTMLDivElement>(null)
    // 目录使用-柱状图相关信息
    const catlgUsageChartRef = useRef<HTMLDivElement>(null)
    // 目录反馈-柱状图相关信息
    const catlgFedbkChartRef = useRef<HTMLDivElement>(null)
    const columnIns = useRef<Column>()

    useEffect(() => {
        getOverviewData()
    }, [])

    const getOverviewData = async () => {
        try {
            setLoading(true)
            const res = await reqRescCatlgOverview()
            const formatRes = {
                ...res,
                // 数据资源目录统计
                audit_statics_list: Object.keys(rescCatlgStaticsGroupIds).map(
                    (key) => {
                        return {
                            ...rescCatlgStaticsGroupIds[key],
                            y_type_count: res?.data_catalog_count?.[key] || 0,
                        }
                    },
                ),
                // 部门提供目录统计-总数
                department_statics_count: sumBy(
                    res?.department_count || [],
                    'count',
                ),
                // 目录共享统计-total
                share_conditional_total: Object.keys(
                    res?.share_conditional || {},
                ).reduce((prev, next) => {
                    return prev + toNumber(res?.share_conditional?.[next] || 0)
                }, 0),
                // 目录共享统计-list
                share_conditional_list: shareStaticsList?.map((item) => {
                    return {
                        ...item,
                        value: res?.share_conditional?.[item.key] || 0,
                    }
                }),
                // 目录使用统计-总数
                catalog_using_count_total: Object.keys(
                    res?.catalog_using_count || {},
                )
                    ?.map((item) => toNumber(res?.catalog_using_count?.[item]))
                    ?.reduce((prev, next) => prev + next, 0),
                // // 目录使用统计-list
                // catalog_using_count_list: catlgUseStaticsList?.map((item) => {
                //     return {
                //         ...item,
                //         value: res?.catalog_using_count?.[item.type] || 0,
                //     }
                // }),
                // 目录反馈统计-总数
                catalog_feedback_count_total: Object.keys(
                    res?.catalog_feedback_count || {},
                )
                    ?.map((item) =>
                        toNumber(res?.catalog_feedback_count?.[item]),
                    )
                    ?.reduce((prev, next) => prev + next, 0),
                // 目录反馈统计-list
                catalog_feedback_count_list: catlgFedbkStaticsList?.map(
                    (item) => {
                        return {
                            ...item,
                            value:
                                res?.catalog_feedback_count?.[item.type] || 0,
                        }
                    },
                ),
            }
            setDetails(formatRes)

            // setDetails(delDetails)
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (loading || !details || !barChartRef?.current) return
        const { audit_statics_list = [] } = details
        // 数据资源目录统计-审批统计
        if (audit_statics_list?.length) {
            if (audit_statics_list?.length) {
                const column = StackedColumnPlot(
                    barChartRef?.current,
                    audit_statics_list,
                    {
                        // 分组柱状图 组间的间距 (像素级别)
                        // intervalPadding: 20,
                        // padding: [24, 0, 0, 0],
                        tooltip: {
                            showTitle: false,
                            shared: false,
                            position: 'top',
                            customContent: (title, datum) => {
                                const name = datum?.[0]?.name
                                const num = datum?.[0]?.value || 0
                                const color = datum?.[0]?.data?.color
                                return `<div style="color: #fff; disaply: inline-flex; align-items: center; gap: 16px;padding: 8px 0;line-height: 16px;">
                                    <div style="display: inline-flex; align-items: flex-start;column-gap:8px;word-break:break-all">
                                        <span style="width:8px;min-width:8px; height:8px;margin-top: 4px;border-radius:50%;background:${color};display:${
                                    color ? '' : 'none'
                                }"></span>
                                        ${title}${name}
                                    </div>
                                    <span style="margin-left: 8px;"> ${num}</span>
                                  
                                </div>`
                            },
                        },
                    },
                )
                column?.render()
                columnIns.current = column
            }
        }
    }, [loading, details, barChartRef?.current])

    useEffect(() => {
        if (!details || !shareInfoChartRef?.current) return
        const { share_conditional_list = [] } = details

        // 目录共享统计
        if (shareInfoChartRef?.current && share_conditional_list?.length) {
            const piePlot = PiePlot(
                shareInfoChartRef?.current,
                share_conditional_list || [],
                { total: details?.share_conditional_total || 0 },
            )
            piePlot?.render()
        }
    }, [loading, details, shareInfoChartRef?.current])

    // useEffect(() => {
    //     if (!details || !catlgUsageChartRef?.current) return
    //     const { catalog_using_count_list = [] } = details
    //     // 目录使用统计
    //     if (catlgUsageChartRef?.current && catalog_using_count_list?.length) {
    //         const usageColumn = ColumnPlot(
    //             catlgUsageChartRef?.current,
    //             catalog_using_count_list || [],
    //             {
    //                 tooltip: {
    //                     showTitle: false,
    //                     customContent: (title, datum) => {
    //                         return `<div style="padding: 8px 12px ; line-height: 1.8; color: #fff, font-size: 12px; line-height: 16px'">
    //                         <div>${title}<span style="margin-left: 8px"> ${datum?.[0]?.value}</span></div>
    //                     </div>`
    //                     },
    //                 },
    //             },
    //         )
    //         usageColumn?.render()
    //     }
    // }, [loading, details, catlgUsageChartRef?.current])

    useEffect(() => {
        if (!details || !catlgFedbkChartRef?.current) return
        const { catalog_feedback_count_list = [] } = details
        // 目录反馈统计
        if (
            catlgFedbkChartRef?.current &&
            catalog_feedback_count_list?.length
        ) {
            const fedbkColumn = ColumnPlot(
                catlgFedbkChartRef?.current,
                catalog_feedback_count_list || [],
                {
                    tooltip: {
                        showTitle: false,
                        position: 'top',
                        customContent: (title, datum) => {
                            const num = datum?.[0]?.y_type_count || 0

                            return `<div style="padding: 8px 12px; color: #fff, font-size: 12px; line-height: 16px'">
                                        <div>${title}<span style="margin-left: 8px"> ${datum?.[0]?.value}</span></div>
                                    </div>`
                        },
                    },
                },
            )
            fedbkColumn?.render()
        }
    }, [loading, details, catlgFedbkChartRef?.current])

    return (
        <div className={styles.summaryWrapper}>
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.summaryItem}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div
                                className={classnames(
                                    styles.summaryItemWrapper,
                                    styles.auditInfoWrapper,
                                )}
                            >
                                <div className={styles.summaryItemTop}>
                                    <div className={styles.summaryItemTitle}>
                                        {__('数据资源目录统计')}
                                    </div>
                                </div>
                                <div
                                    className={styles.summaryItemContentWrapper}
                                >
                                    <div className={styles.summaryCountInfo}>
                                        <div className={styles.countItem}>
                                            <div
                                                className={
                                                    styles.countItemTitle
                                                }
                                            >
                                                {__('目录总数')}
                                            </div>
                                            <div
                                                className={
                                                    styles.countItemValue
                                                }
                                            >
                                                {formatNumber(
                                                    details?.data_catalog_count
                                                        ?.catalog_count,
                                                    false,
                                                    '0',
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.countItem}>
                                            <div
                                                className={
                                                    styles.countItemTitle
                                                }
                                            >
                                                {__('未发布')}
                                            </div>
                                            <div
                                                className={
                                                    styles.countItemValue
                                                }
                                            >
                                                {formatNumber(
                                                    details?.data_catalog_count
                                                        ?.un_publish_catalog_count,
                                                    false,
                                                    '0',
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.countItem}>
                                            <div
                                                className={
                                                    styles.countItemTitle
                                                }
                                            >
                                                {__('已发布')}
                                            </div>
                                            <div
                                                className={
                                                    styles.countItemValue
                                                }
                                            >
                                                {formatNumber(
                                                    details?.data_catalog_count
                                                        ?.publish_catalog_count,
                                                    false,
                                                    '0',
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className={classnames(
                                                styles.countItem,
                                                styles.smallCountItem,
                                            )}
                                        >
                                            <div
                                                className={
                                                    styles.countItemTitle
                                                }
                                            >
                                                {__('未上线')}
                                            </div>
                                            <div
                                                className={
                                                    styles.countItemValue
                                                }
                                            >
                                                {details?.data_catalog_count
                                                    ?.notline_catalog_count ||
                                                    0}
                                            </div>
                                        </div>
                                        <div
                                            className={classnames(
                                                styles.countItem,
                                                styles.smallCountItem,
                                            )}
                                        >
                                            <div
                                                className={
                                                    styles.countItemTitle
                                                }
                                            >
                                                {__('已上线')}
                                            </div>
                                            <div
                                                className={
                                                    styles.countItemValue
                                                }
                                            >
                                                {details?.data_catalog_count
                                                    ?.online_catalog_count || 0}
                                            </div>
                                        </div>
                                        <div
                                            className={classnames(
                                                styles.countItem,
                                                styles.smallCountItem,
                                            )}
                                        >
                                            <div
                                                className={
                                                    styles.countItemTitle
                                                }
                                            >
                                                {__('已下线')}
                                            </div>
                                            <div
                                                className={
                                                    styles.countItemValue
                                                }
                                            >
                                                {details?.data_catalog_count
                                                    ?.offline_catalog_count ||
                                                    0}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.auditStaticsWrapper}>
                                        <div className={styles.auditTitle}>
                                            {__('审批统计')}
                                        </div>
                                        <div
                                            ref={barChartRef}
                                            style={{
                                                height: '280px',
                                                visibility:
                                                    loading ||
                                                    !details.audit_statics_list
                                                        ?.length
                                                        ? 'hidden'
                                                        : 'visible',
                                            }}
                                            hidden={
                                                loading ||
                                                !details.audit_statics_list
                                                    ?.length
                                            }
                                        />
                                        <div
                                            hidden={
                                                loading ||
                                                details.audit_statics_list
                                                    ?.length
                                            }
                                        >
                                            <Empty
                                                desc={__('暂无数据')}
                                                iconSrc={dataEmpty}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div
                                className={classnames(
                                    styles.summaryItemWrapper,
                                    styles.linkCatlgInfoWrapper,
                                )}
                            >
                                <div className={styles.summaryItemTop}>
                                    <div className={styles.summaryItemTitle}>
                                        {__('数据资源统计')}
                                    </div>
                                </div>
                                <div
                                    className={styles.summaryItemContentWrapper}
                                >
                                    <Row className={styles.summaryCountInfo}>
                                        {resTypeList?.map((item) => {
                                            return (
                                                <Col
                                                    span={5}
                                                    className={styles.countItem}
                                                    key={item.value}
                                                >
                                                    <div
                                                        className={
                                                            styles.countItemTitle
                                                        }
                                                    >
                                                        {item.label}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.countItemValue
                                                        }
                                                    >
                                                        {formatNumber(
                                                            details
                                                                ?.data_resource_count?.[
                                                                `${item.value}_count`
                                                            ],
                                                            false,
                                                            '0',
                                                        )}
                                                    </div>
                                                </Col>
                                            )
                                        })}
                                    </Row>
                                    <div className={styles.auditStaticsWrapper}>
                                        <div className={styles.auditTitle}>
                                            {__('资源挂接目录情况')}
                                        </div>

                                        <div className={styles.linkCatlgInfo}>
                                            <div
                                                className={styles.linkCatlgNums}
                                            >
                                                <div
                                                    className={
                                                        styles.linkNumItem
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.linkTitle
                                                        }
                                                    >
                                                        {__('资源挂接目录情况')}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.linkNum
                                                        }
                                                    >
                                                        {formatNumber(
                                                            details
                                                                .data_resource_count
                                                                ?.resource_mount,
                                                            false,
                                                            '0',
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        styles.linkNumItem
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.linkTitle
                                                        }
                                                    >
                                                        {__(
                                                            '未挂接目录的资源数',
                                                        )}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.linkNum
                                                        }
                                                    >
                                                        {formatNumber(
                                                            details
                                                                .data_resource_count
                                                                ?.resource_un_mount,
                                                            false,
                                                            '0',
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={
                                                    styles.linkProgressChart
                                                }
                                            >
                                                {resTypeList?.map((item) => {
                                                    if (
                                                        item.value ===
                                                        OverviewResTypeEnum.ALL
                                                    )
                                                        return undefined
                                                    const {
                                                        data_resource_count,
                                                    } = details
                                                    const val =
                                                        data_resource_count?.[
                                                            `${item.value}_mount`
                                                        ] || 0
                                                    const total =
                                                        data_resource_count?.[
                                                            `${item.value}_count`
                                                        ] || 0
                                                    return (
                                                        <div
                                                            className={
                                                                styles.linkProgressItem
                                                            }
                                                            key={item.value}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.linkItemInfo
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.title
                                                                    }
                                                                >
                                                                    {item.label}
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.linkNum
                                                                    }
                                                                >
                                                                    {`${val}/${total}`}
                                                                </div>
                                                            </div>
                                                            <Tooltip
                                                                className={
                                                                    styles.progress
                                                                }
                                                                title={
                                                                    <div>
                                                                        <div
                                                                            className={
                                                                                styles.title
                                                                            }
                                                                        >
                                                                            {`${__(
                                                                                '${num}总数',
                                                                                {
                                                                                    num: item.label,
                                                                                },
                                                                            )} ${total}`}
                                                                        </div>

                                                                        <div
                                                                            className={
                                                                                styles.linkNum
                                                                            }
                                                                        >
                                                                            {`${__(
                                                                                '已挂接目录的${type}数',
                                                                                {
                                                                                    type: item.label,
                                                                                },
                                                                            )} ${val}`}
                                                                        </div>
                                                                    </div>
                                                                }
                                                            >
                                                                <Progress
                                                                    percent={
                                                                        total
                                                                            ? (100 *
                                                                                  val) /
                                                                              total
                                                                            : 0
                                                                    }
                                                                    strokeWidth={
                                                                        10
                                                                    }
                                                                    strokeColor="#3AA0FF"
                                                                    showInfo={
                                                                        false
                                                                    }
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        <Col span={12}>
                            <div
                                className={classnames(
                                    styles.summaryItemWrapper,
                                    styles.depCatlgWrapper,
                                )}
                            >
                                <div className={styles.summaryItemTop}>
                                    <div className={styles.summaryItemTitle}>
                                        {__('部门提供目录统计')}
                                    </div>

                                    <div className={styles.summaryItemValue}>
                                        <span
                                            className={
                                                styles.summaryItemValueTitle
                                            }
                                        >
                                            {__('提供部门总数')}
                                        </span>
                                        <span
                                            className={
                                                styles.summaryItemValueCount
                                            }
                                        >
                                            {formatNumber(
                                                details.department_statics_count,
                                                false,
                                                '0',
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.depItemContentWrapper}>
                                    {details.department_count?.length ? (
                                        details.department_count?.map(
                                            (item, index) => {
                                                const val = item.count
                                                const total =
                                                    details?.department_statics_count ||
                                                    0
                                                return (
                                                    <div
                                                        className={
                                                            styles.linkProgressItemWrapper
                                                        }
                                                        key={`department_name-${index}`}
                                                    >
                                                        <div
                                                            className={
                                                                styles.index
                                                            }
                                                        >
                                                            {index + 1}
                                                        </div>

                                                        <div
                                                            className={
                                                                styles.linkProgressItem
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.linkItemInfo
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.title
                                                                    }
                                                                >
                                                                    <Tooltip
                                                                        title={
                                                                            item.department_path ||
                                                                            __(
                                                                                '未分类',
                                                                            )
                                                                        }
                                                                        overlayClassName={
                                                                            styles.tooltip
                                                                        }
                                                                        getPopupContainer={(
                                                                            n,
                                                                        ) => n}
                                                                    >
                                                                        <span
                                                                            className={
                                                                                styles.titleContent
                                                                            }
                                                                        >
                                                                            {item.department_name ||
                                                                                __(
                                                                                    '未分类',
                                                                                )}
                                                                        </span>
                                                                    </Tooltip>
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.linkNum
                                                                    }
                                                                >
                                                                    {/* {`${val}/${total}`} */}
                                                                    {val}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.linkProportion
                                                                    }
                                                                >
                                                                    {`${
                                                                        total
                                                                            ? round(
                                                                                  (val /
                                                                                      total) *
                                                                                      100,
                                                                              )
                                                                            : 0
                                                                    }%`}
                                                                </div>
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles.progress
                                                                }
                                                            >
                                                                <Progress
                                                                    percent={
                                                                        total
                                                                            ? toNumber(
                                                                                  round(
                                                                                      (val /
                                                                                          total) *
                                                                                          100,
                                                                                  ) ||
                                                                                      0,
                                                                              )
                                                                            : 0
                                                                    }
                                                                    strokeLinecap="butt"
                                                                    strokeWidth={
                                                                        6
                                                                    }
                                                                    strokeColor="#3AA0FF"
                                                                    showInfo={
                                                                        false
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            },
                                        )
                                    ) : (
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    )}
                                </div>
                            </div>
                        </Col>

                        <Col span={12}>
                            <div
                                className={classnames(
                                    styles.summaryItemWrapper,
                                    styles.shareStaticsWrapper,
                                )}
                            >
                                <div className={styles.summaryItemTop}>
                                    <div className={styles.summaryItemTitle}>
                                        {__('目录共享统计')}
                                    </div>
                                </div>

                                <div
                                    className={styles.summaryItemContentWrapper}
                                >
                                    <div
                                        ref={shareInfoChartRef}
                                        style={{
                                            height: '266px',
                                            width: '100%',
                                            visibility:
                                                loading ||
                                                !details.share_conditional_list
                                                    ?.length
                                                    ? 'hidden'
                                                    : 'visible',
                                        }}
                                        hidden={
                                            loading ||
                                            !details.share_conditional_list
                                                ?.length
                                        }
                                    />
                                    <div
                                        hidden={
                                            loading ||
                                            details.share_conditional_list
                                                ?.length
                                        }
                                    >
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Col>
                        {/* <Col span={12}>
                            <div
                                className={classnames(
                                    styles.summaryItemWrapper,
                                    styles.catlgUseWrapper,
                                )}
                            >
                                <div className={styles.summaryItemTop}>
                                    <div className={styles.summaryItemTitle}>
                                        {__('目录使用统计')}
                                    </div>
                                    <div className={styles.summaryItemValue}>
                                        <span
                                            className={
                                                styles.summaryItemValueTitle
                                            }
                                        >
                                            {__('使用总数')}
                                        </span>
                                        <span
                                            className={
                                                styles.summaryItemValueCount
                                            }
                                        >
                                            {formatNumber(
                                                details?.catalog_using_count_total,
                                                false,
                                                '0',
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={styles.summaryItemContentWrapper}
                                >
                                    <div
                                        ref={catlgUsageChartRef}
                                        style={{
                                            height: '390px',
                                            width: '100%',
                                            visibility:
                                                loading ||
                                                !details
                                                    ?.catalog_using_count_list
                                                    ?.length
                                                    ? 'hidden'
                                                    : 'visible',
                                        }}
                                        hidden={
                                            loading ||
                                            !details?.catalog_using_count_list
                                                ?.length
                                        }
                                    />
                                    <div
                                        hidden={
                                            loading ||
                                            details?.catalog_using_count_list
                                                ?.length
                                        }
                                    >
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Col> */}
                        <Col span={24}>
                            <div
                                className={classnames(
                                    styles.summaryItemWrapper,
                                    styles.catlgFedbkWrapper,
                                )}
                            >
                                <div className={styles.summaryItemTop}>
                                    <div className={styles.summaryItemTitle}>
                                        {__('目录反馈统计')}
                                    </div>
                                    <div className={styles.summaryItemValue}>
                                        <span
                                            className={
                                                styles.summaryItemValueTitle
                                            }
                                        >
                                            {__('反馈总数')}
                                        </span>
                                        <span
                                            className={
                                                styles.summaryItemValueCount
                                            }
                                        >
                                            {formatNumber(
                                                details.catalog_feedback_count_total,
                                                false,
                                                '0',
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={styles.summaryItemContentWrapper}
                                >
                                    <div
                                        ref={catlgFedbkChartRef}
                                        style={{
                                            height: '390px',
                                            width: '100%',
                                            visibility:
                                                loading ||
                                                !details
                                                    .catalog_feedback_count_list
                                                    ?.length
                                                    ? 'hidden'
                                                    : 'visible',
                                        }}
                                        hidden={
                                            loading ||
                                            !details.catalog_feedback_count_list
                                                ?.length
                                        }
                                    />
                                    <div
                                        hidden={
                                            loading ||
                                            details.catalog_feedback_count_list
                                                ?.length
                                        }
                                    >
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            {/* <div className={styles.summaryItem}>
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <div className={styles.summaryItemWrapper}>
                            <div className={styles.summaryItemTop}>
                                <div className={styles.summaryItemTitle}>
                                    {__('数据资源目录统计')}
                                </div>
                                <div className={styles.summaryItemValue}>
                                    <span
                                        className={styles.summaryItemValueTitle}
                                    >
                                        {__('提供部门总数')}
                                    </span>
                                    <span
                                        className={styles.summaryItemValueCount}
                                    >
                                        1000
                                    </span>
                                </div>
                            </div>
                            <div className={styles.summaryItemContentWrapper}>
                                <Row className={styles.summaryCountInfo}>
                                    <Col
                                        xs={5}
                                        // md={6}
                                        // lg={7}
                                        xl={8}
                                        className={styles.countItem}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('目录总数')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(10100)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={5}
                                        // md={6}
                                        // lg={7}
                                        xl={8}
                                        className={styles.countItem}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('未发布')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(1000)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={5}
                                        // md={6}
                                        // lg={7}
                                        xl={8}
                                        className={styles.countItem}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('已发布')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(9100)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={2}
                                        sm={3}
                                        lg={3}
                                        xl={3}
                                        className={classnames(
                                            styles.countItem,
                                            styles.smallCountItem,
                                        )}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('未上线')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(2233)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={3}
                                        sm={3}
                                        lg={3}
                                        xl={3}
                                        className={classnames(
                                            styles.countItem,
                                            styles.smallCountItem,
                                        )}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('已上线')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(2233)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={3}
                                        sm={3}
                                        lg={3}
                                        xl={3}
                                        className={classnames(
                                            styles.countItem,
                                            styles.smallCountItem,
                                        )}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('已下线')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(2233)}
                                        </div>
                                    </Col>
                                </Row>
                                <div className={styles.auditStaticsWrapper}>
                                   
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.summaryItemWrapper}>
                            <div className={styles.summaryItemTop}>
                                <div className={styles.summaryItemTitle}>
                                    {__('数据资源目录统计')}
                                </div>
                                <div className={styles.summaryItemValue}>
                                    <span
                                        className={styles.summaryItemValueTitle}
                                    >
                                        {__('提供部门总数')}
                                    </span>
                                    <span
                                        className={styles.summaryItemValueCount}
                                    >
                                        1000
                                    </span>
                                </div>
                            </div>
                            <div className={styles.summaryItemContentWrapper}>
                                <Row className={styles.summaryCountInfo}>
                                    <Col
                                        xs={5}
                                        // md={6}
                                        // lg={7}
                                        xl={8}
                                        className={styles.countItem}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('目录总数')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(10100)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={5}
                                        // md={6}
                                        // lg={7}
                                        xl={8}
                                        className={styles.countItem}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('未发布')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(1000)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={5}
                                        // md={6}
                                        // lg={7}
                                        xl={8}
                                        className={styles.countItem}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('已发布')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(9100)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={2}
                                        sm={3}
                                        lg={3}
                                        xl={3}
                                        className={classnames(
                                            styles.countItem,
                                            styles.smallCountItem,
                                        )}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('未上线')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(2233)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={3}
                                        sm={3}
                                        lg={3}
                                        xl={3}
                                        className={classnames(
                                            styles.countItem,
                                            styles.smallCountItem,
                                        )}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('已上线')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(2233)}
                                        </div>
                                    </Col>
                                    <Col
                                        xs={3}
                                        sm={3}
                                        lg={3}
                                        xl={3}
                                        className={classnames(
                                            styles.countItem,
                                            styles.smallCountItem,
                                        )}
                                    >
                                        <div className={styles.countItemTitle}>
                                            {__('已下线')}
                                        </div>
                                        <div className={styles.countItemValue}>
                                            {formatNumber(2233)}
                                        </div>
                                    </Col>
                                </Row>
                                <div className={styles.auditStaticsWrapper}>
                                    
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div> */}
        </div>
    )
}

export default Overview
