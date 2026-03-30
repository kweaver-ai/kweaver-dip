import dataEmpty from '@/assets/dataEmpty.svg'
import { SubTitle } from '@/components/DataAssetsCatlg/helper'
import { Empty } from '@/ui'
import { RadarMap } from '../g2plotConfig'
import { QualityScoreDimensionTips } from '../helper'
import __ from '../locale'
import styles from '../styles.module.less'

function DimensionScoreCard({ data, isMarket, isEmpty }: any) {
    return (
        <div className={styles['view-card']} style={{ position: 'relative' }}>
            <div
                className={styles['view-card-title']}
                style={{ position: 'relative', zIndex: 10 }}
            >
                <SubTitle
                    showIcon={isMarket}
                    className={styles.pTitle}
                    text={__('维度评分')}
                />
                {QualityScoreDimensionTips()}
            </div>
            {isEmpty ? (
                <Empty
                    iconSrc={dataEmpty}
                    desc={__('暂无维度评分')}
                    iconHeight={100}
                />
            ) : (
                <div className={styles['radar-map']} style={{ zIndex: 1 }}>
                    <RadarMap
                        padding={[5, 0, 0, 0]}
                        dataInfo={data || []}
                        radarProps={{
                            label: {
                                offset: 0,
                            },
                            xAxis: {
                                label: {
                                    offset: 4,
                                },
                                line: null,
                                tickLine: null,
                                grid: {
                                    line: {
                                        style: {
                                            lineDash: null,
                                        },
                                    },
                                },
                            },
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default DimensionScoreCard
