import { memo } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import { RadarMap } from '../../DataPreview/g2plotConfig'
import { RenderTooltip } from '../helper'
import __ from './locale'
import styles from './styles.module.less'

const DimensionScoreCard = ({ data, isEmpty }: any) => {
    return (
        <div className={styles['view-card']} style={{ position: 'relative' }}>
            <div className={styles['view-card-title']}>
                <div>{__('维度评分')}</div>
                {RenderTooltip(
                    __('维度评分'),
                    __(
                        '已探查库表库表级、库表数据级、行级、字段的各维度的平均值',
                    ),
                )}
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
                        padding={[5, 0, 5, 0]}
                        dataInfo={data || []}
                        height={180}
                    />
                </div>
            )}
        </div>
    )
}

export default memo(DimensionScoreCard)
