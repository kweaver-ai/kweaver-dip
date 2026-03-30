import React, { useEffect, useState } from 'react'
import { Timeline, Tooltip } from 'antd'
import moment from 'moment'
import classNames from 'classnames'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { formatTime } from '@/utils'
import __ from '../locale'
import styles from './styles.module.less'
import { IDemandLogInfo, formatError, getDemandLogV2 } from '@/core'
import { DemandActionType } from './const'
import { Expand } from '@/ui'

interface IOperateRecord {
    logs: IDemandLogInfo[]
}
const OperateRecord: React.FC<IOperateRecord> = ({ logs }) => {
    const [expand, setExpand] = useState(true)

    return (
        <div
            className={classNames(
                styles['operate-record-wrapper'],
                !expand && styles['operate-record-fold-wrapper'],
            )}
        >
            {expand ? (
                <>
                    <div className={styles['operate-record-title']}>
                        <Tooltip title={__('收起操作记录')} placement="bottom">
                            <RightOutlined
                                className={styles['arrow-icon']}
                                onClick={() => setExpand(false)}
                            />
                        </Tooltip>
                        {__('操作记录')}
                    </div>
                    <div className={styles['operate-record-content']}>
                        <Timeline>
                            {logs.map((item, index) => (
                                <Timeline.Item
                                    key={index}
                                    dot={
                                        <div
                                            className={styles['time-line-dot']}
                                        />
                                    }
                                >
                                    <div className={styles['time-line-title']}>
                                        {DemandActionType[item.action_type]}
                                    </div>
                                    <div className={styles['time-line-item']}>
                                        {item.action_type === 'demand_close' ||
                                        item.action_type ===
                                            'analysis_confirm_audit' ? null : (
                                            <>
                                                <span
                                                    className={
                                                        styles[
                                                            'time-line-item-label'
                                                        ]
                                                    }
                                                >
                                                    {__('操作人：')}
                                                </span>
                                                <span
                                                    className={
                                                        styles[
                                                            'time-line-item-value'
                                                        ]
                                                    }
                                                >
                                                    {item.op_user || '--'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {item.extend_info &&
                                        JSON.parse(item.extend_info)
                                            ?.result && (
                                            <div
                                                className={
                                                    styles['time-line-item']
                                                }
                                            >
                                                <span
                                                    className={
                                                        styles[
                                                            'time-line-item-label'
                                                        ]
                                                    }
                                                >
                                                    {item.action_type ===
                                                    'analysis_confirm_audit'
                                                        ? __('审核结果：')
                                                        : __('确认方案：')}
                                                </span>
                                                <span
                                                    className={classNames(
                                                        styles[
                                                            'time-line-item-value'
                                                        ],
                                                        JSON.parse(
                                                            item.extend_info,
                                                        )?.result ===
                                                            'reject' &&
                                                            styles[
                                                                'time-line-item-value-reject'
                                                            ],
                                                        JSON.parse(
                                                            item.extend_info,
                                                        )?.result === 'pass' &&
                                                            styles[
                                                                'time-line-item-value-pass'
                                                            ],
                                                    )}
                                                >
                                                    {JSON.parse(
                                                        item.extend_info,
                                                    )?.result === 'pass'
                                                        ? __('通过')
                                                        : __('驳回')}
                                                </span>
                                            </div>
                                        )}
                                    {item.extend_info &&
                                        JSON.parse(item.extend_info)?.result ===
                                            'reject' && (
                                            <div
                                                className={
                                                    styles['time-line-item']
                                                }
                                            >
                                                <span
                                                    className={
                                                        styles[
                                                            'time-line-item-label'
                                                        ]
                                                    }
                                                >
                                                    {__('驳回说明：')}
                                                </span>
                                                <span
                                                    className={
                                                        styles[
                                                            'time-line-item-value'
                                                        ]
                                                    }
                                                >
                                                    {JSON.parse(
                                                        item.extend_info,
                                                    )?.remark ? (
                                                        <Expand
                                                            rows={2}
                                                            content={
                                                                JSON.parse(
                                                                    item.extend_info,
                                                                )?.remark
                                                            }
                                                        />
                                                    ) : (
                                                        '--'
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                    <div className={styles['time-line-item']}>
                                        <span
                                            className={
                                                styles['time-line-item-label']
                                            }
                                        >
                                            {__('操作时间：')}
                                        </span>
                                        <span
                                            className={
                                                styles['time-line-item-value']
                                            }
                                        >
                                            {item.op_time
                                                ? moment(item.op_time).format(
                                                      'YYYY-MM-DD HH:mm',
                                                  )
                                                : '--'}
                                        </span>
                                    </div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </div>
                </>
            ) : (
                <div
                    className={styles['unfold-container']}
                    onClick={() => setExpand(true)}
                >
                    <LeftOutlined className={styles['expand-arrow']} />
                    {__('查看操作记录')}
                </div>
            )}
        </div>
    )
}
export default OperateRecord
