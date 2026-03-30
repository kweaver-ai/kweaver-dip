/* eslint-disable no-case-declarations */
import { Node as X6Node } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import { memo, useContext, useMemo } from 'react'
import classnames from 'classnames'
import moment from 'moment'
import { Popover, Tooltip } from 'antd'
import { CloseCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import BaseTaskNode from './BaseTaskNode'
import {
    ComprehensionReportStatus,
    NodeType,
    PortConfig,
    ReportStatusMap,
    TaskStatusMap,
    TaskTypeText,
} from './config'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { NodeDataType } from '../const'
import { getTableContent } from './helper'
import { NodeContext, useNodeContext } from '../NodeContext'
import { TabKey } from '../../const'

/**
 * 通用任务节点组件
 */
const TaskComponent = memo(({ node }: { node: X6Node }) => {
    const { data } = node
    const { onShowQualityReport, updateActiveKey } = useNodeContext()
    const [title, content] = useMemo(() => {
        const nodeType = data?.type
        let top = <div />
        let bottom = <div />
        switch (nodeType) {
            case NodeDataType.Aggregation:
            case NodeDataType.Fusion:
                bottom = getTableContent(
                    data?.source_form_name,
                    data?.source_type,
                )
                break
            case NodeDataType.Comprehension:
                top = (
                    <div className={styles.title}>
                        <div>数据理解报告</div>
                        <div
                            className={styles.link}
                            onClick={() =>
                                updateActiveKey?.(TabKey.COMPREHENSIONREPORT)
                            }
                        >
                            查看
                        </div>
                    </div>
                )
                bottom =
                    data?.auditStatus &&
                    data?.auditStatus !==
                        ComprehensionReportStatus.Comprehended ? (
                        <div className={styles.desc}>
                            <div
                                className={styles.audit}
                                style={{
                                    color: ReportStatusMap[data?.auditStatus]
                                        ?.color,
                                    backgroundColor:
                                        ReportStatusMap[data?.auditStatus]
                                            ?.backgroundColor,
                                }}
                            >
                                <span>
                                    {ReportStatusMap[data?.auditStatus]?.text}
                                </span>
                                {data?.auditStatus ===
                                    ComprehensionReportStatus.Refuse &&
                                    data?.auditTip && (
                                        <Popover
                                            placement="bottomLeft"
                                            arrowPointAtCenter
                                            overlayClassName={styles.PopBox}
                                            content={
                                                <div className={styles.PopTip}>
                                                    <div>
                                                        <span
                                                            className={
                                                                styles.popTipIcon
                                                            }
                                                        >
                                                            <CloseCircleFilled />
                                                        </span>
                                                        审核未通过
                                                    </div>
                                                    <div
                                                        style={{
                                                            wordBreak:
                                                                'break-all',
                                                        }}
                                                    >
                                                        {data?.auditTip}
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <FontIcon
                                                name="icon-xinxitishi"
                                                type={IconType.FONTICON}
                                                style={{
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        </Popover>
                                    )}
                            </div>
                        </div>
                    ) : (
                        <Tooltip
                            title={`更新时间: ${
                                data?.report_updated_at
                                    ? moment(data?.report_updated_at).format(
                                          'YYYY-MM-DD HH:mm:ss',
                                      )
                                    : '--'
                            }`}
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,.85)',
                            }}
                            placement="bottomLeft"
                            showArrow={false}
                        >
                            <div className={styles.desc}>
                                <FontIcon
                                    name="icon-gengxinshijian"
                                    type={IconType.FONTICON}
                                    style={{ fontSize: 14, color: '#999EB8' }}
                                />
                                <div>
                                    {data?.report_updated_at
                                        ? moment(
                                              data?.report_updated_at,
                                          ).format('YYYY-MM-DD HH:mm:ss')
                                        : '--'}
                                </div>
                            </div>
                        </Tooltip>
                    )
                break
            case NodeDataType.Standardization:
                top = <div className={styles.title}>标准检测报告</div>
                bottom = (
                    <Tooltip
                        title={`更新时间: ${
                            data?.report_updated_at
                                ? moment(data?.report_updated_at).format(
                                      'YYYY-MM-DD HH:mm:ss',
                                  )
                                : '--'
                        }`}
                        color="#fff"
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,.85)',
                        }}
                        placement="bottomLeft"
                        showArrow={false}
                    >
                        <div className={styles.desc}>
                            <FontIcon
                                name="icon-gengxinshijian"
                                type={IconType.FONTICON}
                                style={{ fontSize: 14, color: '#999EB8' }}
                            />
                            <div>
                                {data?.report_updated_at
                                    ? moment(data?.report_updated_at).format(
                                          'YYYY-MM-DD HH:mm:ss',
                                      )
                                    : '--'}
                            </div>
                        </div>
                    </Tooltip>
                )
                break
            case NodeDataType.Quality:
                top = (
                    <div className={styles.title}>
                        <div>数据质量报告</div>
                        <div
                            className={styles.link}
                            onClick={() => onShowQualityReport()}
                        >
                            查看
                        </div>
                    </div>
                )
                bottom = (
                    <Tooltip
                        title={`更新时间: ${
                            data?.report_updated_at
                                ? moment(data?.report_updated_at).format(
                                      'YYYY-MM-DD HH:mm:ss',
                                  )
                                : '--'
                        }`}
                        color="#fff"
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,.85)',
                        }}
                        placement="bottomLeft"
                        showArrow={false}
                    >
                        <div className={styles.desc}>
                            <FontIcon
                                name="icon-gengxinshijian"
                                type={IconType.FONTICON}
                                style={{ fontSize: 14, color: '#999EB8' }}
                            />
                            <div>
                                {data?.report_updated_at
                                    ? moment(data?.report_updated_at).format(
                                          'YYYY-MM-DD HH:mm:ss',
                                      )
                                    : '--'}
                            </div>
                        </div>
                    </Tooltip>
                )
                break
            default:
        }

        return [top, bottom]
    }, [data])

    return (
        <BaseTaskNode>
            <div className={styles['task-node']}>
                {/* 节点头部 */}
                <div className={styles['task-node-header']}>{title}</div>
                {/* 节点内容 */}
                <div className={styles['task-node-content']}>{content}</div>
            </div>
        </BaseTaskNode>
    )
})

export function TaskNode() {
    register({
        shape: NodeType.Task,
        effect: ['data'],
        component: TaskComponent,
        ports: PortConfig,
    })
    return NodeType.Task
}
