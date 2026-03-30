import dataEmpty from '@/assets/dataEmpty.svg'
import { SubTitle } from '@/components/DataAssetsCatlg/helper'
import { Empty } from '@/ui'
import { LineGraph } from '../g2plotConfig'
import { DimensionColor, ScoreType } from '../helper'
import __ from '../locale'
import styles from '../styles.module.less'

function HistoryTrendCard({ data, isMarket, isEmpty }: any) {
    return (
        <div className={styles['view-card']}>
            <SubTitle
                showIcon={isMarket}
                className={styles.pTitle}
                text={__('各维度评分历史趋势')}
            />

            {isEmpty ? (
                <Empty
                    iconSrc={dataEmpty}
                    desc={__('暂无各维度评分历史趋势')}
                    iconHeight={100}
                />
            ) : (
                <div className={styles.lineBox}>
                    <LineGraph dataInfo={data} />
                    <div className={styles.trendLegend}>
                        {[
                            'accuracy_score',
                            'completeness_score',
                            // 'consistency_score',
                            'standardization_score',
                            'uniqueness_score',
                        ].map((key) => (
                            <span>
                                <span
                                    style={{
                                        background: `${DimensionColor[key]}`,
                                    }}
                                />
                                {ScoreType[key]}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default HistoryTrendCard
