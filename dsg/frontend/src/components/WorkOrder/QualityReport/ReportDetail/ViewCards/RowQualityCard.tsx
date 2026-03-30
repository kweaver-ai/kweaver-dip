import { Progress } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { isNumber } from 'lodash'
import classnames from 'classnames'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import { DashBoard } from '@/components/DatasheetView/DataPreview/g2plotConfig'
import {
    getScore,
    IRowItem,
    KVMap,
    ScoreType,
} from '@/components/DatasheetView/DataPreview//helper'
import __ from '../locale'
import styles from '../styles.module.less'

const GradientColor = [
    ['#C4EDA3', '#83D25D'],
    ['#BBD6F6', '#72ADF1'],
    ['#F7ECBA', '#F8C767'],
    ['#F7C8AD', '#FB8F4C'],
    ['#F0ABB2', '#EB5663'],
]

const getGradientColorByScore = (score: number) => {
    if (score >= 85) {
        return GradientColor[0]
    }
    if (score >= 80) {
        return GradientColor[1]
    }
    if (score >= 75) {
        return GradientColor[2]
    }
    if (score >= 60) {
        return GradientColor[3]
    }

    return GradientColor[4]
}

function RowQualityCard({ data }: { data: IRowItem[] }) {
    const [list, setList] = useState<any[]>([])
    const [score, setScore] = useState<any>()

    useEffect(() => {
        const arr: any[] = (data || []).reduce((prev: any[], it: IRowItem) => {
            if (typeof it.score === 'number') {
                return [
                    ...prev,
                    {
                        label: ScoreType[KVMap[it.type]],
                        key: KVMap[it.type],
                        score: it.score,
                    },
                ]
            }
            return prev
        }, [])

        let curScore
        const count = arr?.length
        if (isNumber(count) && count > 0) {
            const sum = arr.reduce((prev, cur) => prev + cur.score * 10000, 0)
            if (sum >= 0) {
                // 取整
                curScore = Math.trunc(sum / count) / 100
            }
        }
        setScore(curScore)
        setList(arr)
    }, [data])

    return (
        <div className={classnames(styles.thirdList, styles.rowScores)}>
            <div>
                {isNumber(score) ? (
                    <>
                        <DashBoard
                            title={__('行级总分')}
                            dataInfo={score}
                            height={96}
                        />
                        <div className={styles.boardText}>
                            <span>{__('行级总分')}：</span>
                            <span>
                                {score}
                                {__('分')}
                            </span>
                        </div>
                    </>
                ) : (
                    <Empty
                        iconSrc={dataEmpty}
                        desc={__('暂无质量评分')}
                        iconHeight={100}
                    />
                )}
            </div>
            {/* 分值 */}
            <div className={styles.lineScore}>
                {list?.map((o) => (
                    <div key={o.key}>
                        <span>
                            {o.label}
                            {__('总分')}:
                        </span>
                        <span>
                            <Progress
                                strokeColor={{
                                    '0%': getGradientColorByScore(
                                        getScore(o.score),
                                    )[0],
                                    '100%': getGradientColorByScore(
                                        getScore(o.score),
                                    )[1],
                                }}
                                strokeWidth={14}
                                percent={getScore(o.score)}
                                showInfo={false}
                            />
                        </span>
                        <span>
                            {getScore(o.score)}
                            <span>{__('分')}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RowQualityCard
