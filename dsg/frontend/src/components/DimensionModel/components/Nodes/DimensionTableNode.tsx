import { register } from '@antv/x6-react-shape'
import { memo } from 'react'
import { Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import TableNode from './TableNode'
import { ModelPortConf, NodeType } from './config'
import styles from './styles.module.less'
import __ from '../../locale'
import DataTypeIcons from '../Icons'
// import { FormatType, FormatTypeTXT } from '../../const'
import { FormatDataTypeTXT } from '@/core'

// 自定义列渲染
const ItemRender = memo(({ item, isLink, isErrorType }: any) => {
    const { title, type } = item
    return (
        <div className={styles['item-wrapper']}>
            <Tooltip
                title={
                    <span
                        style={{ color: 'rgba(0,0,0,0.85)', fontSize: '12px' }}
                    >
                        {FormatDataTypeTXT(type)}
                    </span>
                }
                placement="left"
                color="#fff"
            >
                <div>
                    <DataTypeIcons type={type} />
                </div>
            </Tooltip>
            <div className={styles['item-wrapper-title']} title={title}>
                <div className={styles['item-wrapper-title-text']}>{title}</div>
                {isLink && (
                    <>
                        <div className={styles['item-wrapper-title-link']}>
                            <span>{__('关联字段')}</span>
                        </div>
                        {isErrorType && (
                            <div className={styles['item-wrapper-title-error']}>
                                <Tooltip
                                    title={__('该字段与维度字段数据类型不一致')}
                                >
                                    <ExclamationCircleOutlined
                                        style={{
                                            color: '#F5222D',
                                            fontSize: '14px',
                                            width: '20px',
                                        }}
                                    />
                                </Tooltip>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
})

// 自定义维度表组件
const DimensionTableComponent = memo((props: any) => {
    const { node } = props
    return <TableNode node={node} ItemRender={ItemRender} />
})

// 维度表节点
export function DimensionTableNode() {
    register({
        shape: NodeType.Dimension,
        effect: ['data'],
        component: DimensionTableComponent,
        ports: ModelPortConf,
    })
    return NodeType.Dimension
}
