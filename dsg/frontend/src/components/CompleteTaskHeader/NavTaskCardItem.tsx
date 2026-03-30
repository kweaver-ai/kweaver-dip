import React, { HTMLAttributes } from 'react'
import moment from 'moment'
import styles from './styles.module.less'
import __ from './locale'
import { getTaskTypeIcon, taskPriorityInfos } from '../TaskComponents/helper'
import { PriorityLabel } from '../TaskComponents/PrioritySelect'

interface INavTaskCardItem extends HTMLAttributes<HTMLDivElement> {
    data: any
    selected: boolean
    onSelected: () => void
}

/**
 * 导航列表任务卡片
 * @param data 数据
 * @param selected 当前是否选中
 * @param onSelected 选中
 * @returns
 */
const NavTaskCardItem: React.FC<INavTaskCardItem> = ({
    data,
    selected,
    onSelected,
}) => {
    // 状态组件
    const statusLabel = {
        ready: <div className={styles.nti_status}>{__('未开始')}</div>,
        ongoing: (
            <div
                className={styles.nti_status}
                style={{
                    color: '#126EE3',
                    background: 'rgba(18,110,227,0.06)',
                }}
            >
                {__('进行中')}
            </div>
        ),
        completed: (
            <div
                className={styles.nti_status}
                style={{
                    color: '#52C41A',
                    background: 'rgba(82,196,26,0.06)',
                }}
            >
                {__('已完成')}
            </div>
        ),
    }

    return (
        <div
            className={styles.navTaskCardItemWrapper}
            style={{ backgroundColor: selected ? '#F1F7FE' : undefined }}
            onClick={onSelected}
        >
            <div className={styles.nti_titleWrapper}>
                <span>{getTaskTypeIcon(data?.task_type || '', true)}</span>
                <span className={styles.nti_title} title={data?.name}>
                    {data?.name || '--'}
                </span>
            </div>
            <div
                className={styles.nti_proWrapper}
                title={data?.project_name}
                hidden={!data?.project_name}
            >
                {__('项目')}
                {__('：')}
                {data?.project_name || '--'}
            </div>
            <div className={styles.nti_detailWrapper}>
                <PriorityLabel
                    label={taskPriorityInfos[data?.priority].label}
                    color={taskPriorityInfos[data?.priority].color}
                />
                {statusLabel[data?.status]}
                <span className={styles.nti_time} hidden={!data?.deadline}>
                    {moment(data.deadline * 1000).format('YYYY-MM-DD')}
                </span>
            </div>
        </div>
    )
}

export default NavTaskCardItem
