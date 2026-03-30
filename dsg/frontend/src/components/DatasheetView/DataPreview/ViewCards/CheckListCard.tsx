import { Progress } from 'antd'
import classnames from 'classnames'
import { SubTitle } from '@/components/DataAssetsCatlg/helper'
import __ from '../locale'
import styles from '../styles.module.less'

function CheckListCard({ isMarket, data }: any) {
    return (
        <div className={styles['view-card']}>
            <SubTitle
                showIcon={isMarket}
                className={styles.pTitle}
                text={__('库表字段探查数量')}
            />
            <div className={styles.fourth}>
                <Progress
                    className={styles.fourthProgress}
                    type="circle"
                    percent={Math.round(
                        ((data?.explore_count || 0) /
                            (data?.total_count || 1)) *
                            100,
                    )}
                    strokeWidth={8}
                    width={120}
                    format={(percent) => `${percent}%`}
                    strokeColor="#59A4FF"
                />
            </div>
            <div className={styles.fourthLegend}>
                <div className={styles.legendBox}>
                    <span className={styles.legendDot} />
                    <span
                        title={__('探查字段数')}
                        className={styles.legendLabel}
                    >
                        {__('探查字段数')}：
                    </span>
                    <span className={styles.legendValue}>
                        {data?.explore_count}
                    </span>
                </div>
                <div className={styles.legendBox}>
                    <span
                        className={classnames(styles.legendDot, styles.total)}
                    />
                    <span title={__('字段总数')} className={styles.legendLabel}>
                        {__('字段总数')}：
                    </span>
                    <span className={styles.legendValue}>
                        {data?.total_count || 0}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default CheckListCard
