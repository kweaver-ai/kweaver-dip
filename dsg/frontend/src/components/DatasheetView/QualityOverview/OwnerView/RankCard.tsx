import { Progress } from 'antd'
import { memo, useMemo } from 'react'
import { FontIcon } from '@/icons'
import { RenderTooltip, safeMultiply } from '../helper'
import styles from './styles.module.less'
import { Empty } from '@/ui'
import __ from './locale'
import dataEmpty from '@/assets/dataEmpty.svg'

const renderText = (percent: number = 0) => {
    return (
        <span style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.85)' }}>
            {percent?.toFixed(2)}
        </span>
    )
}

const RankItem = ({
    data,
    isDesc,
    onClick,
}: {
    data: any
    isDesc?: boolean
    onClick?: (item: Record<string, any>) => void
}) => {
    const percent = useMemo(() => {
        return safeMultiply(data?.total_score || 0, 100)
    }, [data?.total_score])
    return (
        <div className={styles['rank-item']}>
            <div className={styles['rank-item-title']}>
                <FontIcon
                    style={{ fontSize: 14 }}
                    name={
                        data?.department_type === 1
                            ? 'icon-zuzhi1'
                            : 'icon-bumen1'
                    }
                />
                <span
                    className={styles.name}
                    title={data?.department_path}
                    onClick={() =>
                        onClick?.({
                            value: data?.department_id,
                            label: data?.department_name,
                            key: data?.department_id,
                            type: data?.department_type,
                        })
                    }
                >
                    {data?.department_name}
                </span>
            </div>
            <div className={styles['rank-item-progress']}>
                <Progress
                    strokeColor={{
                        from: isDesc ? '#A9D8FF' : '#F6C8B0',
                        to: isDesc ? '#70AFFE' : '#FB8E4E',
                    }}
                    status="active"
                    strokeWidth={12}
                    showInfo={false}
                    percent={percent}
                />
                <span className={styles['rank-item-progress-text']}>
                    {renderText(percent)}
                </span>
            </div>
        </div>
    )
}

const RankCard = ({
    title,
    tooltip,
    data,
    isDesc, // 是否降序
    onClick,
}: {
    title?: string
    tooltip?: string
    data?: any
    isDesc?: boolean
    onClick?: (item: Record<string, any>) => void
}) => {
    return (
        <div className={styles['rank-card']}>
            <div className={styles['rank-card-header']}>
                <div className={styles['rank-card-header-title']}>{title}</div>
                {tooltip && RenderTooltip(title, tooltip)}
            </div>
            <div className={styles['rank-card-content']}>
                {data?.length > 0 ? (
                    data?.map((item: any) => (
                        <RankItem
                            key={item?.department_id}
                            data={item}
                            isDesc={isDesc}
                            onClick={onClick}
                        />
                    ))
                ) : (
                    <div className={styles['rank-card-content-empty']}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(RankCard)
