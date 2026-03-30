import dataEmpty from '@/assets/dataEmpty.svg'
import { SubTitle } from '@/components/DataAssetsCatlg/helper'
import { Empty } from '@/ui'
import { RadarMap } from '@/components/DatasheetView/DataPreview/g2plotConfig'
import { QualityScoreDimensionTips } from '@/components/DatasheetView/DataPreview/helper'
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
                    // showIcon={isMarket}
                    showIcon={false}
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
                        padding={[5, 0, 10, 0]}
                        dataInfo={data || []}
                        height={160}
                    />
                </div>
            )}
        </div>
    )
}

export default DimensionScoreCard
