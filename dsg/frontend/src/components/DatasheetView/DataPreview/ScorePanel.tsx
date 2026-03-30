import React, { useEffect, useState } from 'react'
import { isNumber } from 'lodash'
import { Progress, Tooltip } from 'antd'
import {
    formatRateByDataSize,
    getScore,
    IQuantileNode,
    KVMap,
    quantileNode,
    ScoreType,
    StatisticsType,
    thousandSeparator,
    TypeList,
} from './helper'
import { getIconScore } from './DataPreviewView'
import __ from './locale'
import styles from './styles.module.less'
import RuleDetail from './RuleDetail'

const ScoreCard = ({ data, type, onShowDetail }: any) => {
    return (
        <div className={styles['score-card']}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 8,
                }}
            >
                <span
                    className={styles['score-card-title']}
                    title={data?.rule_name}
                    onClick={() => onShowDetail?.(data)}
                >
                    {data?.rule_name}：
                </span>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                    {getIconScore(getScore(data?.[type]))}
                    <span>{__('分')}</span>
                </span>
            </div>
            <div className={styles['score-card-score']}>
                {__('探查数据量')}:
                <span style={{ marginLeft: '8px' }}>
                    {data?.inspected_count ?? '--'}
                </span>
            </div>
            <div className={styles['score-card-score']}>
                {__('问题数据量')}:
                <span style={{ marginLeft: '8px' }}>
                    {data?.issue_count ?? '--'}
                </span>
            </div>
            <div className={styles['score-card-score']}>
                {__('问题率')}:
                <span style={{ marginLeft: '8px' }}>
                    {formatRateByDataSize(
                        data?.issue_count,
                        data?.inspected_count,
                    ) ?? '--'}
                </span>
            </div>
        </div>
    )
}

const ScoreBox = ({ item, onShowDetail }: any) => {
    return (
        <div id={item?.type} className={styles['score-box']}>
            <div className={styles['score-box-title']}>
                <div>{`${ScoreType[item?.type]}${__('总分')}`}：</div>
                <div>
                    {getIconScore(getScore(item?.score))}
                    <span>{__('分')}</span>
                </div>
            </div>
            <div className={styles['score-box-list']}>
                {(item?.list || []).map((obj) => (
                    <ScoreCard
                        key={obj?.rule_id}
                        data={obj}
                        type={item?.type}
                        onShowDetail={onShowDetail}
                    />
                ))}
            </div>
        </div>
    )
}

const StatisticsItem = ({ data, isQuantile }: any) => {
    const [current, setCurrent] = useState<any>()
    const [item, setItem] = useState<IQuantileNode>()
    useEffect(() => {
        const jsonData = JSON.parse(data?.result || '[]')
        setCurrent(jsonData?.[0]?.result)

        if (isQuantile) {
            // const aa = [{ quantile_25: 0, quantile_50: 0, quantile_75: 0 }]
            const ret = jsonData?.[0] || {}
            const arr = Object.keys(ret)
                .map((o) => ({
                    key: o.split('_')?.[1],
                    value: ret[o],
                }))
                .filter((o) => typeof o.value === 'number')

            const splitData: IQuantileNode = {
                value: arr?.map((o) => o.value),
                quantileDes: arr?.map((o) => (o.key ? `${o.key}%` : '--')),
            }
            setItem(splitData)
        }
    }, [data, isQuantile])

    return (
        <div className={styles['count-item']}>
            <div className={styles['count-item-title']}>
                <div className={styles['count-item-title-icon']}>
                    {StatisticsType?.[data?.rule_name]}
                </div>
                <div>{data?.rule_name}</div>
            </div>
            <div
                className={styles['count-item-content']}
                title={isQuantile ? '' : current}
                style={{ marginTop: isQuantile ? '0' : '8px' }}
            >
                {isQuantile
                    ? item?.value?.length
                        ? quantileNode(item)
                        : '--'
                    : isNumber(current)
                    ? thousandSeparator(current)
                    : current ?? '--'}
            </div>
        </div>
    )
}

const ProgressItem = ({
    data,
    code,
}: {
    data: { key: any; value: number; percent: number }
    code?: any
}) => {
    const { key, value, percent } = data || {}
    return (
        <div className={styles['progress-item']}>
            <Tooltip
                title={
                    code !== undefined ? (
                        <div
                            style={{
                                color: 'rgba(0,0,0,0.65)',
                            }}
                        >
                            <div> {__('字段值')}:</div>
                            <div
                                style={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                            >
                                {key}
                            </div>
                            <div> {__('码值描述')}:</div>
                            <div
                                style={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                            >
                                {code}
                            </div>
                        </div>
                    ) : (
                        ''
                    )
                }
                placement="right"
                color="white"
            >
                <div className={styles['progress-item-name']} title={key}>
                    <span>{key}</span>
                    {code !== undefined && (
                        <span>
                            (<span>{code}</span>)
                        </span>
                    )}
                </div>
            </Tooltip>
            <Progress
                className={styles['progress-item-percent']}
                percent={percent}
                strokeColor="#70AFFE"
                strokeWidth={12}
                showInfo={false}
            />
            <div className={styles['progress-item-value']} title={`${value}`}>
                {value}
            </div>
        </div>
    )
}

const DistributionItem = ({ data, codeInfo }: any) => {
    const [current, setCurrent] = useState<any[]>()
    const [codeMap, setCodeMap] = useState<any>()
    useEffect(() => {
        const jsonData = JSON.parse(data?.result || '[]')

        const total =
            jsonData?.reduce((prev, cur) => prev + (cur.value ?? 0), 0) ?? 1

        const result = jsonData?.map((o) => ({
            ...o,
            key: o.key === null ? 'NULL' : o.key,
            percent: Math.trunc((o.value / total) * 10000) / 100,
        }))

        setCurrent(result)
    }, [data])

    useEffect(() => {
        if (codeInfo) {
            const obj = JSON.parse(codeInfo || '{}')
            setCodeMap(obj)
        }
    }, [codeInfo])

    return (
        <div className={styles['distribution-item']}>
            <div className={styles['distribution-item-title']}>
                <div>
                    {data?.rule_name}：<span>Top</span>
                    <span>20</span>
                </div>
            </div>
            <div className={styles['distribution-item-tip']}>
                <div>
                    {__('字段值')}
                    {Object.keys(codeMap || {})?.length
                        ? `(${__('码值描述')})`
                        : ''}
                </div>
                <div />
                <div>出现次数</div>
            </div>
            <div className={styles['distribution-item-content']}>
                {current?.map((it) => {
                    return (
                        <ProgressItem
                            data={it}
                            key={it.key}
                            code={codeMap?.[it.key]}
                        />
                    )
                })}
            </div>
        </div>
    )
}

const StatisticsBox = ({ item }: any) => {
    const [prevList, setPrevList] = useState<any[]>([])
    const [nextList, setNextList] = useState<any[]>([])
    useEffect(() => {
        const prev: any[] = []
        const next: any[] = []
        ;(item?.list || []).forEach((it) => {
            if (Object.keys(StatisticsType).includes(it?.rule_name)) {
                prev.push(it)
            } else {
                next.push(it)
            }
        })
        setPrevList(prev)
        setNextList(next)
    }, [item])

    return (
        <div className={styles['data-count']} id="data_statistics">
            <div className={styles['data-count-title']}>{__('数据统计')}：</div>
            <div className={styles['data-count-list']}>
                {prevList.map((obj) => (
                    <StatisticsItem
                        key={obj?.rule_id}
                        data={obj}
                        isQuantile={obj?.rule_name === '分位数'}
                    />
                ))}
            </div>
            <div className={styles['data-count-distribution']}>
                {nextList.map((obj) => (
                    <DistributionItem
                        key={obj?.rule_id}
                        data={obj}
                        codeInfo={item?.codeInfo}
                    />
                ))}
            </div>
        </div>
    )
}

function ScorePanel({ data }: any) {
    const [ruleMap, setRuleMap] = useState<any>([])
    const [ruleDetailOpen, setRuleDetailOpen] = useState<boolean>(false)
    const [currentRuleInfo, setCurrentRuleInfo] = useState<any>()

    useEffect(() => {
        const { details, code_info, ...rest } = data || {}
        const scoreItems = TypeList.map((key) => {
            const attr = KVMap[key]
            const rules = (details || []).filter((o) => o.dimension === key)
            const score = rest[attr]
            return {
                score,
                type: attr,
                list: rules,
                codeInfo: code_info,
            }
        })?.filter((o) => o?.list?.length > 0)
        setRuleMap(scoreItems)
    }, [data])

    return (
        <>
            <div>
                {ruleMap.map((item) => {
                    return item?.type === 'data_statistics' ? (
                        <StatisticsBox key="data_statistics" item={item} />
                    ) : (
                        <ScoreBox
                            key={item?.type}
                            item={item}
                            onShowDetail={(it) => {
                                const { rule_id, ...rest } = it || {}
                                setCurrentRuleInfo(rest)
                                setRuleDetailOpen(true)
                            }}
                        />
                    )
                })}
            </div>
            {ruleDetailOpen && (
                <RuleDetail
                    type="field"
                    open={ruleDetailOpen}
                    onClose={() => {
                        setRuleDetailOpen(false)
                        setCurrentRuleInfo(undefined)
                    }}
                    ruleId={currentRuleInfo?.rule_id}
                    ruleInfo={currentRuleInfo}
                />
            )}
        </>
    )
}

export default ScorePanel
