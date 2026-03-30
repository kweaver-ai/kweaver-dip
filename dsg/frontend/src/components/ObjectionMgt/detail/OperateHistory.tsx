import { useState } from 'react'
import { Tooltip, Timeline } from 'antd'
import moment from 'moment'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import styles from '../styles.module.less'
import __ from '../locale'

interface ILog {
    // 操作备注
    op_comment: string
    // 操作类型名称
    op_name: string
    // 操作部门
    op_org: string
    // 操作结果 undone 撤销 agree 同意 reject 拒绝/驳回
    op_result: 'undone' | 'agree' | 'reject'
    // 操作时间
    op_time: number
    // 操作类型 66 提出异议 71 处理异议 76 审核异议 81 撤销异议
    op_type: 66 | 71 | 76 | 81
    // 操作用户名称
    op_user: string
}

interface IOperateHistory {
    log: ILog[]
}

const renderTitle = (title: string) => {
    return <div className={styles.op_title}>{title}</div>
}

const renderContent = (label: string, content: string) => {
    return (
        <div>
            <span className={styles.op_label}>{label}：</span>
            {content}
        </div>
    )
}

const renderResult = (label: string, result: 'undone' | 'agree' | 'reject') => {
    return (
        <div>
            <span className={styles.op_label}>{label}：</span>
            {result === 'agree' ? (
                <span className={styles.op_agree}>{__('同意')}</span>
            ) : (
                <span className={styles.op_reject}>{__('拒绝')}</span>
            )}
        </div>
    )
}

const renderTime = (label: string, time: number) => (
    <div>
        <span className={styles.op_label}>{label}：</span>
        {moment(time).format('YYYY-MM-DD HH:mm:ss')}
    </div>
)

const renderTimelineContent = (item: ILog) => {
    switch (item.op_type) {
        case 66:
            return (
                <div>
                    {renderTitle('提出异议')}
                    {renderContent(__('提出人'), item.op_user)}
                    {renderContent(__('提出部门'), item.op_org)}
                    {renderTime(__('提出异议时间'), item.op_time)}
                </div>
            )
        case 71:
            return (
                <div>
                    {renderTitle('数据异议申请审核')}
                    {renderResult(__('审核结果'), item.op_result)}
                    {renderContent(__('审核人'), item.op_user)}
                    {renderTime(__('审核时间'), item.op_time)}
                </div>
            )
        case 76:
            return (
                <div>
                    {renderTitle('数源部门处理')}
                    {renderResult(__('处理结果'), item.op_result)}
                    {renderContent(__('处理部门'), item.op_org)}
                    {renderTime(__('处理时间'), item.op_time)}
                </div>
            )
        case 81:
            return (
                <div>
                    {renderTitle('异议评价')}
                    {renderContent(__('评价人'), item.op_user)}
                    {renderContent(__('评价部门'), item.op_org)}
                    {renderTime(__('评价时间'), item.op_time)}
                </div>
            )

        default:
            return ''
    }
}

const OperateHistory = ({ log }: IOperateHistory) => {
    const [expand, setExpand] = useState(true)
    return (
        <div className={styles.operateHistory}>
            {expand ? (
                <div className={styles.recordWrapper}>
                    <div className={styles.recordTitle}>
                        <Tooltip title={__('收起操作记录')} placement="bottom">
                            <RightOutlined
                                className={styles.icon}
                                onClick={() => setExpand(false)}
                            />
                        </Tooltip>
                        {__('操作记录')}
                    </div>
                    <div className={styles.recordContent}>
                        <Timeline>
                            {log.map((i, index) => (
                                <Timeline.Item
                                    key={index}
                                    dot={<div className={styles.dot} />}
                                >
                                    {renderTimelineContent(i)}
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </div>
                </div>
            ) : (
                <div
                    className={styles.foldWrapper}
                    onClick={() => setExpand(true)}
                >
                    <LeftOutlined className={styles.arrow} />
                    {__('查看操作记录')}
                </div>
            )}
        </div>
    )
}

export default OperateHistory
