/* eslint-disable no-case-declarations */
import { Node as X6Node } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import classnames from 'classnames'
import { memo } from 'react'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import { NodeDataType } from '../const'
import BaseTaskNode from './BaseTaskNode'
import { NodeType, TaskStatusMap, TaskTypeText } from './config'
import styles from './styles.module.less'

/**
 * 标签节点组件
 */
const TagComponent = memo(({ node }: { node: X6Node }) => {
    const { data } = node
    return (
        <BaseTaskNode>
            <div
                className={classnames(styles['task-status-label'])}
                hidden={!TaskStatusMap[data?.taskStatus]}
            >
                <div className={styles.top}>
                    <FontIcon
                        name="icon-renwuzhongxin1"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16, color: '#14CEAA' }}
                    />
                    {TaskTypeText?.[data?.taskType]}
                </div>
                <div
                    className={styles.bottom}
                    style={{
                        color: TaskStatusMap[data?.taskStatus]?.color,
                    }}
                >
                    {TaskStatusMap?.[data?.taskStatus]?.text}
                </div>
            </div>
        </BaseTaskNode>
    )
})

export function TagNode() {
    register({
        shape: NodeType.Tag,
        effect: ['data'],
        component: TagComponent,
    })
    return NodeType.Tag
}
