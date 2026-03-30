import { isNumber } from 'lodash'
import { memo } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import { DashBoard } from '../../DataPreview/g2plotConfig'
import __ from './locale'
import styles from './styles.module.less'
import { RenderTooltip } from '../helper'

const QualityScoreCard = ({ data }: any) => {
    return (
        <div className={styles['view-card']}>
            <div className={styles['view-card-title']}>
                <div>{__('库表质量平均分')}</div>
                {RenderTooltip(
                    __('库表质量平均分'),
                    __('所有已探查库表质量得分的平均值'),
                )}
            </div>
            {isNumber(data) ? (
                <>
                    <div style={{ padding: '16px' }}>
                        <DashBoard
                            title={__('平均分')}
                            dataInfo={data || 0}
                            height={108}
                            innerRadius={0.6}
                        />
                    </div>
                    <div className={styles.boardText}>
                        <span>{__('平均分')}：</span>
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
export default memo(QualityScoreCard)
