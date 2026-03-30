/* eslint-disable no-case-declarations */
import { Node as X6Node } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import classnames from 'classnames'
import { memo } from 'react'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import { NodeDataType } from '../const'
import BaseTaskNode from './BaseTaskNode'
import { NodeType, PortConfig, TaskStatusMap, TaskTypeText } from './config'
import { getTableContent } from './helper'
import styles from './styles.module.less'
// 数据目录组件
const CatalogComponent = memo(({ node }: { node: X6Node }) => {
    const { data } = node
    const { type } = data

    return (
        <BaseTaskNode>
            <div
                className={classnames(
                    styles['task-node'],
                    styles['catalog-node'],
                )}
            >
                {/* 节点头部 */}
                <div className={styles['task-node-header']}>
                    <div className={styles['catalog-title']}>
                        <FontIcon
                            name="icon-shujumuluguanli1"
                            type={IconType.COLOREDICON}
                            style={{ fontSize: 36 }}
                        />
                        <div className={styles['catalog-title-content']}>
                            <div title={data?.catalog_name}>
                                {data?.catalog_name}
                            </div>
                            <div title={data?.catalog_code}>
                                {data?.catalog_code}
                            </div>
                        </div>
                    </div>
                </div>
                {/* 节点内容 */}
                <div className={styles['task-node-content']}>
                    {getTableContent(data?.source_form_name, data?.source_type)}
                </div>
            </div>
        </BaseTaskNode>
    )
})

// 数据目录节点
export function CatalogNode() {
    register({
        shape: NodeType.Catalog,
        effect: ['data'],
        component: CatalogComponent,
        ports: PortConfig,
    })
    return NodeType.Catalog
}
