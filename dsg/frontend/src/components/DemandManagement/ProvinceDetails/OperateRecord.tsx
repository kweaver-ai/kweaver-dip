import React, { useEffect, useState } from 'react'
import { Timeline, Tooltip } from 'antd'
import moment from 'moment'
import classNames from 'classnames'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { formatTime } from '@/utils'
import __ from '../locale'
import styles from '../Details/styles.module.less'
import { ISSZDDemandLogInfo, formatError, getDemandLogV2 } from '@/core'
import { Expand } from '@/ui'
import { DemandActionType, DemandFieldType } from '../Details/const'
import {
    IOperateRecordField,
    OperateRecordFields,
    ProvinceOperateFields,
} from './const'

interface IOperateRecord {
    logs: ISSZDDemandLogInfo[]
}
const OperateRecord: React.FC<IOperateRecord> = ({ logs }) => {
    const [expand, setExpand] = useState(true)

    const getShowInfo = (
        field: IOperateRecordField,
        item: ISSZDDemandLogInfo,
    ) => {
        if (field.type === DemandFieldType.TIME) {
            return item.op_time
                ? moment(item.op_time).format('YYYY-MM-DD HH:mm')
                : '--'
        }
        if (field.key === 'op_result') {
            return item[field.key] === 'agree' ? (
                <span style={{ color: 'rgb(82 196 27 / 85%)' }}>
                    {item.op_type ? __('同意') : __('通过')}
                </span>
            ) : (
                __('拒绝')
            )
        }
        return item[field.key] || '--'
    }
    const getFieldsShow = (item: ISSZDDemandLogInfo) => {
        // const showFields = item.op_type
        //     ? OperateRecordFields[item.op_type]
        //     : ProvinceOperateFields
        const showFields = OperateRecordFields[16]

        return showFields.map((field: IOperateRecordField) => {
            return (
                <div className={styles['time-line-item']}>
                    <span className={styles['time-line-item-label']}>
                        {field.label}
                    </span>
                    <span className={styles['time-line-item-value']}>
                        {getShowInfo(field, item)}
                    </span>
                </div>
            )
        })
    }

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
                                        {item.op_name || '--'}
                                    </div>
                                    {getFieldsShow(item)}
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
