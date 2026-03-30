import { useEffect, useRef, useState } from 'react'
import classnames from 'classnames'
import { Column } from '@antv/g2plot'
import { Progress, Tooltip, Space } from 'antd'
import { round, toNumber } from 'lodash'
import { InfoCircleOutlined } from '@ant-design/icons'
import loadFail from '@/assets/loadFail.png'
import styles from './styles.module.less'
import __ from './locale'
import {
    PiePlot,
    auditTypeListToColumnConfig,
    businFormStaticsItems,
    StackedColumnPlot,
    formDepartTooltipItemKeys,
    departStaticsTooltipItems,
    shareStaticsList,
} from './helper'
import {
    IInfoCatlgBusinFormStatics,
    IInfoCatlgDepartStatics,
    IInfoCatlgStatistics,
    formatError,
    reqInfoCatlgBusinFormStatics,
    reqInfoCatlgDepartStatics,
    reqInfoCatlgShareStatics,
    reqInfoCatlgStatics,
} from '@/core'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatNumber } from '@/utils'

const Overview = () => {
    // 信息资源目录统计
    const [staticsLoading, setStaticsLoading] = useState(true)
    const [statics, setStatics] = useState<IInfoCatlgStatistics>()
    const [staticsError, setStaticsError] = useState<any>(null) // 新增：存储信息资源目录统计错误
    // 业务标准表编目统计
    const [businFormStaticsLoading, setBusinFormStaticsLoading] = useState(true)
    const [businFormStatics, setBusinFormStatics] =
        useState<IInfoCatlgBusinFormStatics>()
    const [businFormStaticsError, setBusinFormStaticsError] =
        useState<any>(null) // 新增：存储业务标准表编目统计错误
    // 部门提供目录统计
    const [departStaticsLoading, setDepartStaticsLoading] = useState(true)
    const [departStatics, setDepartStatics] =
        useState<IInfoCatlgDepartStatics>()
    const [departStaticsError, setDepartStaticsError] = useState<any>(null) // 新增：存储部门提供目录统计错误
    // 目录共享统计
    const [shareStaticsLoading, setShareStaticsLoading] = useState(true)
    const [shareStatics, setShareStatics] = useState<any>()
    const [shareStaticsError, setShareStaticsError] = useState<any>(null) // 新增：存储目录共享统计错误
    // 审批统计-柱状图相关信息
    const barChartRef = useRef<HTMLDivElement>(null)
    // 目录共享统计-柱状图相关信息
    const shareInfoChartRef = useRef<HTMLDivElement>(null)
    const columnIns = useRef<Column>()

    useEffect(() => {
        getInfoCatlgStatics()
        getInfoCatlgBusinFormStatics()
        getInfoCatlgDepartStatics()
        getInfoCatlgShareStatics()
    }, [])

    const getInfoCatlgStatics = async () => {
        try {
            setStaticsLoading(true)
            const res = await reqInfoCatlgStatics()
            const auditList: any = []
            res.audit_statistic?.forEach((item) => {
                const { audit_type, auditing_num, pass_num, reject_num } = item
                auditList.push(
                    {
                        ...auditTypeListToColumnConfig[
                            `${audit_type}_auditing_num`
                        ],
                        y_type_count: auditing_num,
                    },
                    {
                        ...auditTypeListToColumnConfig[
                            `${audit_type}_pass_num`
                        ],
                        y_type_count: pass_num,
                    },
                    {
                        ...auditTypeListToColumnConfig[
                            `${audit_type}_reject_num`
                        ],
                        y_type_count: reject_num,
                    },
                )
            })

            setStatics({
                ...res,
                audit_statistic: auditList,
            })
            setStaticsError(undefined)
        } catch (e) {
            formatError(e)
            setStaticsError(e)
        } finally {
            setStaticsLoading(false)
        }
    }

    const getInfoCatlgBusinFormStatics = async () => {
        try {
            setBusinFormStaticsLoading(true)
            const res = await reqInfoCatlgBusinFormStatics()
            setBusinFormStatics(res)
            setBusinFormStaticsError(undefined)
        } catch (e) {
            formatError(e)
            setBusinFormStaticsError(e) // 保存业务标准表编目统计错误
        } finally {
            setBusinFormStaticsLoading(false)
        }
    }

    const getInfoCatlgDepartStatics = async () => {
        try {
            setDepartStaticsLoading(true)
            const res = await reqInfoCatlgDepartStatics()
            setDepartStatics(res)
            setDepartStaticsError(undefined)
        } catch (e) {
            formatError(e)
            setDepartStaticsError(e) // 保存部门提供目录统计错误
        } finally {
            setDepartStaticsLoading(false)
        }
    }

    const getInfoCatlgShareStatics = async () => {
        try {
            setShareStaticsLoading(true)
            const res = await reqInfoCatlgShareStatics()
            const shareStaticsTemp = shareStaticsList?.map((sItem) => {
                return {
                    ...sItem,
                    value: res?.share_statistic?.[sItem.key] || 0,
                }
            })
            setShareStatics({
                ...res,
                share_statistic: shareStaticsTemp,
            })
            setShareStaticsError(undefined)
        } catch (e) {
            formatError(e)
            setShareStaticsError(e) // 保存目录共享统计错误
        } finally {
            setShareStaticsLoading(false)
        }
    }

    useEffect(() => {
        if (
            staticsLoading ||
            columnIns.current ||
            !statics ||
            !barChartRef?.current
        )
            return
        const { audit_statistic = [] } = statics
        // 信息资源目录统计-审批统计
        if (audit_statistic?.length) {
            const column = StackedColumnPlot(
                barChartRef?.current,
                audit_statistic,
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
                                <span style="margin-left: 8px;"> ${formatNumber(
                                    num,
                                    true,
                                    '0',
                                )}</span>
                            </div>`
                        },
                    },
                },
            )
            column?.render()
            columnIns.current = column
        }
    }, [staticsLoading, statics, barChartRef?.current])

    useEffect(() => {
        if (shareStaticsLoading || !shareStatics || !shareInfoChartRef?.current)
            return
        const { share_statistic = [] } = shareStatics

        // 目录共享统计
        if (shareInfoChartRef?.current && share_statistic?.length) {
            const piePlot = PiePlot(
                shareInfoChartRef?.current,
                share_statistic || [],
                { total: shareStatics?.total_num || 0 },
            )
            piePlot?.render()
        }
    }, [shareStaticsLoading, shareStatics, shareInfoChartRef?.current])

    const renderInfoIconTip = (title: string) => {
        return (
            <Tooltip
                title={title}
                placement="bottomLeft"
                color="#1A1C21"
                overlayInnerStyle={{
                    color: '#fff',
                }}
                overlayStyle={{
                    maxWidth: 'unset',
                }}
                arrowPointAtCenter
            >
                <InfoCircleOutlined
                    style={{
                        color: 'rgba(0, 0, 0, 0.65)',
                        marginLeft: 4,
                        fontSize: '12px',
                    }}
                />
            </Tooltip>
        )
    }

    const renderEmpty = (error: any, total: number, callBack?: any): any => {
        if (error) {
            return (
                <div className={styles.emptyWrapper}>
                    <Empty
                        desc={
                            <Space direction="vertical" align="center" size={8}>
                                <div>{__('加载失败')}</div>
                                <div>
                                    <a onClick={() => callBack?.()}>
                                        {__('重新加载')}
                                    </a>
                                </div>
                            </Space>
                        }
                        iconSrc={loadFail}
                    />
                </div>
            )
        }
        if (!total) {
            return (
                <div className={styles.emptyWrapper}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            )
        }
        return undefined
    }

    return (
        <div className={styles.summaryWrapper}>
            {
                <>
                    <div
                        className={classnames(
                            styles.summaryItemWrapper,
                            styles.infoCatlgStaticsWrapper,
                        )}
                    >
                        <div className={styles.summaryItemTop}>
                            <div className={styles.summaryItemTitle}>
                                {__('信息资源目录统计')}
                            </div>
                        </div>
                        <div className={styles.summaryItemContentWrapper}>
                            {staticsLoading ? (
                                <Loader />
                            ) : staticsError || !statics?.total_num ? (
                                renderEmpty(
                                    staticsError,
                                    statics?.total_num || 0,
                                    getInfoCatlgStatics,
                                )
                            ) : (
                                <>
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
                                                    statics?.total_num,
                                                    true,
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
                                                    statics?.unpublish_num || 0,
                                                    true,
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
                                                    statics?.published_num || 0,
                                                    true,
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
                                                {statics?.notonline_num || 0}
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
                                                {statics?.online_num || 0}
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
                                                {statics?.offline_num || 0}
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
                                                    staticsLoading ||
                                                    !statics.audit_statistic
                                                        ?.length
                                                        ? 'hidden'
                                                        : 'visible',
                                            }}
                                            hidden={
                                                staticsLoading ||
                                                !statics?.audit_statistic
                                                    ?.length
                                            }
                                        />
                                        <div
                                            hidden={
                                                staticsLoading ||
                                                !!statics?.audit_statistic
                                                    ?.length
                                            }
                                        >
                                            <Empty
                                                desc={__('暂无数据')}
                                                iconSrc={dataEmpty}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div
                        className={classnames(
                            styles.summaryItemWrapper,
                            styles.businFormInfoWrapper,
                        )}
                    >
                        <div className={styles.summaryItemTop}>
                            <div className={styles.summaryItemTitle}>
                                {__('业务标准表编目统计')}
                            </div>
                        </div>
                        <div className={styles.summaryItemContentWrapper}>
                            {businFormStaticsLoading ? (
                                <Loader />
                            ) : businFormStaticsError ||
                              !businFormStatics?.total_num ? (
                                renderEmpty(
                                    businFormStaticsError,
                                    businFormStatics?.total_num || 0,
                                    getInfoCatlgBusinFormStatics,
                                )
                            ) : (
                                <>
                                    <div className={styles.summaryCountInfo}>
                                        {businFormStaticsItems?.map((item) => {
                                            return (
                                                <div
                                                    // span={5}
                                                    className={classnames({
                                                        [styles.countItem]:
                                                            true,
                                                        [styles.dottedItem]:
                                                            item.key === 'rate',
                                                    })}
                                                    key={item.key}
                                                >
                                                    <div
                                                        className={
                                                            styles.countItemTitle
                                                        }
                                                    >
                                                        {item.label}
                                                        {item.key === 'rate' &&
                                                            renderInfoIconTip(
                                                                __(
                                                                    '编目完成率=已发布信息资源目录/业务标准表总数',
                                                                ),
                                                            )}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.countItemValue
                                                        }
                                                    >
                                                        {`${formatNumber(
                                                            businFormStatics?.[
                                                                item.key
                                                            ],
                                                            true,
                                                            '0',
                                                        )}${
                                                            item.key === 'rate'
                                                                ? '%'
                                                                : ''
                                                        }`}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className={styles.auditStaticsWrapper}>
                                        <div className={styles.auditTitle}>
                                            {__('按部门统计')}
                                            {renderInfoIconTip(
                                                __(
                                                    '统计各部门编目完成率=本部门已发布信息资源目录数/本部门已发布的业务标准表总数',
                                                ),
                                            )}
                                        </div>
                                        <div className={styles.rankingHeader}>
                                            <span>{__('排名')}</span>
                                            <span style={{ flex: '1' }}>
                                                {__('部门')}
                                            </span>
                                            <span
                                                style={{
                                                    minWidth: '48px',
                                                }}
                                            >
                                                {__('完成率')}
                                            </span>
                                        </div>

                                        <div className={styles.linkCatlgInfo}>
                                            <div
                                                className={
                                                    styles.linkProgressChart
                                                }
                                            >
                                                {businFormStatics?.dept_statistic?.map(
                                                    (dItem, index) => {
                                                        const val =
                                                            dItem.publish_num ||
                                                            0
                                                        const total =
                                                            dItem.total_num
                                                        return (
                                                            <div
                                                                className={
                                                                    styles.linkProgressItemWrapper
                                                                }
                                                                key={`businFormStatics-${index}`}
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
                                                                    key={
                                                                        dItem.department_id
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
                                                                            title={
                                                                                dItem.department_path
                                                                            }
                                                                        >
                                                                            {dItem.department_name ||
                                                                                '--'}
                                                                        </div>

                                                                        <div
                                                                            className={
                                                                                styles.linkProportion
                                                                            }
                                                                        >
                                                                            {`${dItem.rate}%`}
                                                                        </div>
                                                                    </div>
                                                                    <Tooltip
                                                                        className={
                                                                            styles.progress
                                                                        }
                                                                        title={
                                                                            <div>
                                                                                {businFormStaticsItems
                                                                                    ?.filter(
                                                                                        (
                                                                                            fItem,
                                                                                        ) =>
                                                                                            formDepartTooltipItemKeys.includes(
                                                                                                fItem.key,
                                                                                            ),
                                                                                    )
                                                                                    ?.map(
                                                                                        (
                                                                                            fItem,
                                                                                        ) => {
                                                                                            return (
                                                                                                <div
                                                                                                    className={
                                                                                                        styles.title
                                                                                                    }
                                                                                                >
                                                                                                    {`${__(
                                                                                                        fItem.label,
                                                                                                    )}${__(
                                                                                                        '：',
                                                                                                    )}${formatNumber(
                                                                                                        dItem[
                                                                                                            fItem
                                                                                                                .key
                                                                                                        ],
                                                                                                        true,
                                                                                                        '0',
                                                                                                    )}${
                                                                                                        fItem.key ===
                                                                                                        'rate'
                                                                                                            ? '%'
                                                                                                            : ''
                                                                                                    }`}
                                                                                                </div>
                                                                                            )
                                                                                        },
                                                                                    )}
                                                                            </div>
                                                                        }
                                                                    >
                                                                        <Progress
                                                                            percent={
                                                                                toNumber(
                                                                                    dItem?.rate,
                                                                                )
                                                                                    ? toNumber(
                                                                                          dItem?.rate,
                                                                                      )
                                                                                    : total
                                                                                    ? (val /
                                                                                          total) *
                                                                                      100
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
                                                            </div>
                                                        )
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div
                        className={classnames(
                            styles.summaryItemWrapper,
                            styles.depCatlgWrapper,
                        )}
                    >
                        <div className={styles.summaryItemTop}>
                            <div className={styles.summaryItemTitle}>
                                {__('部门提供目录统计')}
                                {renderInfoIconTip(
                                    '统计部门已发布目录数占本部门目录总数的比例',
                                )}
                            </div>
                        </div>
                        <div className={styles.depItemContentWrapper}>
                            {departStaticsLoading ? (
                                <Loader />
                            ) : departStaticsError ||
                              !departStatics?.dept_statistic?.length ? (
                                renderEmpty(
                                    departStaticsError,
                                    departStatics?.dept_statistic?.length || 0,
                                    getInfoCatlgDepartStatics,
                                )
                            ) : (
                                <>
                                    <div className={styles.rankingHeader}>
                                        <span>{__('排名')}</span>
                                        <span
                                            style={{
                                                flex: '1',
                                            }}
                                        >
                                            {__('部门')}
                                        </span>
                                        <span>{__('目录总数')}</span>
                                        <span
                                            style={{
                                                minWidth: '50px',
                                            }}
                                        >
                                            {__('比例')}
                                        </span>
                                    </div>
                                    <div className={styles.departListWrapper}>
                                        {departStatics?.dept_statistic?.map(
                                            (dItem, index) => {
                                                const val =
                                                    dItem.publish_num || 0
                                                const total =
                                                    dItem?.total_num || 0
                                                return (
                                                    <div
                                                        className={
                                                            styles.linkProgressItemWrapper
                                                        }
                                                        key={`departStatics-${index}`}
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
                                                                    <span
                                                                        className={
                                                                            styles.titleContent
                                                                        }
                                                                        title={
                                                                            dItem.department_path
                                                                        }
                                                                    >
                                                                        {dItem.department_name ||
                                                                            '--'}
                                                                    </span>
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.linkNum
                                                                    }
                                                                >
                                                                    {formatNumber(
                                                                        total,
                                                                        true,
                                                                        '0',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.linkProportion
                                                                    }
                                                                >
                                                                    {`${dItem.rate}%`}
                                                                </div>
                                                            </div>
                                                            <Tooltip
                                                                className={
                                                                    styles.progress
                                                                }
                                                                title={
                                                                    <div>
                                                                        {departStaticsTooltipItems?.map(
                                                                            (
                                                                                fItem,
                                                                            ) => {
                                                                                return (
                                                                                    <div
                                                                                        className={
                                                                                            styles.title
                                                                                        }
                                                                                    >
                                                                                        {`${__(
                                                                                            fItem.label,
                                                                                        )}${__(
                                                                                            '：',
                                                                                        )}${formatNumber(
                                                                                            dItem[
                                                                                                fItem
                                                                                                    .key
                                                                                            ],
                                                                                            true,
                                                                                            '0',
                                                                                        )}${
                                                                                            fItem.key ===
                                                                                            'rate'
                                                                                                ? '%'
                                                                                                : ''
                                                                                        }`}
                                                                                    </div>
                                                                                )
                                                                            },
                                                                        )}
                                                                    </div>
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
                                                                                      1,
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
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                )
                                            },
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div
                        className={classnames(
                            styles.summaryItemWrapper,
                            styles.shareStaticsWrapper,
                        )}
                    >
                        <div className={styles.summaryItemTop}>
                            <div className={styles.summaryItemTitle}>
                                {__('目录共享统计')}
                                {renderInfoIconTip(
                                    __(
                                        '统计不同共享属性中，已发布目录占已发布目录总数的比例',
                                    ),
                                )}
                            </div>
                        </div>

                        <div className={styles.summaryItemContentWrapper}>
                            {shareStaticsLoading ? (
                                <Loader />
                            ) : (
                                shareStaticsError ||
                                (!shareStatics?.total_num &&
                                    renderEmpty(
                                        shareStaticsError,
                                        shareStatics?.total_num || 0,
                                        getInfoCatlgShareStatics,
                                    ))
                            )}
                            <div
                                ref={shareInfoChartRef}
                                style={{
                                    height: '266px',
                                    width: '100%',
                                    visibility:
                                        shareStaticsLoading ||
                                        shareStaticsError ||
                                        !shareStatics?.share_statistic?.length
                                            ? 'hidden'
                                            : 'visible',
                                }}
                                hidden={
                                    shareStaticsLoading ||
                                    shareStaticsError ||
                                    !shareStatics?.total_num
                                }
                            />
                        </div>
                    </div>
                </>
            }
        </div>
    )
}

export default Overview
