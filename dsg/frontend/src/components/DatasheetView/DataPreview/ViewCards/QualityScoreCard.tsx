import { isNumber } from 'lodash'
import styles from '../styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import { QualityScoreTips } from '../helper'
import __ from '../locale'
import { SubTitle } from '@/components/DataAssetsCatlg/helper'
import { DashBoard } from '../g2plotConfig'
import { Empty } from '@/ui'

function QualityScoreCard({ data, isMarket }: any) {
    return (
        <div className={styles['view-card']}>
            <div className={styles['view-card-title']}>
                <SubTitle
                    showIcon={isMarket}
                    className={styles.pTitle}
                    text={__('质量评分')}
                />
                {QualityScoreTips()}
            </div>
            {isNumber(data) ? (
                <>
                    <DashBoard
                        title={__('库表总分')}
                        dataInfo={data || 0}
                        height={88}
                    />
                    <div className={styles.boardText}>
                        <span>{__('库表总分')}：</span>
                        <span>
                            {data || 0} {__('分')}
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
    )
}

export default QualityScoreCard
