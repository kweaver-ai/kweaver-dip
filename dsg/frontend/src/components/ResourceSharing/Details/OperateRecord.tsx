import React, { useEffect, useState } from 'react'
import { Timeline, Tooltip } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import DetailsGroup from './DetailsGroup'
import { IShareApplyLog } from '@/core'
import { logTypeMap } from './const'

interface IOperateRecord {
    data?: IShareApplyLog[]
}

/**
 * 操作记录
 */
const OperateRecord: React.FC<IOperateRecord> = ({ data = [] }) => {
    // 是否收起
    const [fold, setFold] = useState(false)

    return (
        <div className={classnames(styles.operateRecord, fold && styles.fold)}>
            {fold ? (
                <div
                    className={styles.fold_content}
                    onClick={() => setFold(false)}
                >
                    {__('操作记录')}
                </div>
            ) : (
                <>
                    <div className={styles.top}>
                        <Tooltip title={__('收起操作记录')}>
                            <RightOutlined
                                onClick={() => setFold(true)}
                                className={styles.foldIcon}
                            />
                        </Tooltip>
                        {__('操作记录')}
                    </div>
                    <Timeline className={styles.record_content}>
                        {data?.map((item, idx) => (
                            <Timeline.Item
                                key={idx}
                                dot={<div className={styles.dot} />}
                            >
                                <div className={styles.timeline_item}>
                                    <div className={styles.title}>
                                        {logTypeMap[item.op_type]?.title}
                                    </div>
                                    <DetailsGroup
                                        config={
                                            logTypeMap[item.op_type]?.content
                                        }
                                        data={item}
                                        wordBreak={false}
                                        labelWidth="76px"
                                        overflowEllipsis
                                    />
                                </div>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </>
            )}
        </div>
    )
}
export default OperateRecord
