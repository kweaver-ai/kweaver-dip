import React, { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Dropdown, MenuProps, Space } from 'antd'
import classNames from 'classnames'
import { Graph, Node } from '@antv/x6'
import styles from './styles.module.less'
import { OperateType, NodeType } from '../const'
import { getAntdLocal, graphAddNode, graphNodeCollapse } from '../helper'
import { AddOutlined } from '@/icons'
import ChooseBusinessObj from '../ChooseBusinessObj'
import MindMapData from '../MindMapData'
import __ from '../locale'
import { GlossaryIcon } from '../GlossaryIcons'
import { getPlatformNumber } from '@/utils'

let callbackColl: any = []
interface IAttributeNodeComponent {
    node: Node
    graph: Graph
}

const BusinessActivityNodeComponent: React.FC<IAttributeNodeComponent> = ({
    node,
    graph,
}) => {
    // const { node } = props
    const { data } = node
    const [nodeData, setNodeData] = useState<any>(data)
    const [chooseBusinessObjOpen, setChooseBusinessObjOpen] = useState(false)
    const platformNumber = getPlatformNumber()

    useEffect(() => {
        setNodeData(data)
    }, [data])

    const items: MenuProps['items'] = [
        {
            key: OperateType.CreateLogicEntity,
            label: __('新建逻辑实体'),
        },
        {
            key: OperateType.ReferenceBusinessObj,
            label: (
                <div style={{ minWidth: 152 }}>
                    {
                        // platformNumber === 1
                        //     ? __('引用业务对象/活动')
                        //     :
                        __('引用业务对象')
                    }
                </div>
            ),
        },
    ]

    const onClick = ({ key }) => {
        switch (key) {
            case OperateType.CreateLogicEntity:
                graphAddNode(
                    callbackColl[0]().current,
                    callbackColl[2](),
                    node.id,
                )
                break
            case OperateType.ReferenceBusinessObj:
                setChooseBusinessObjOpen(true)
                break
            case OperateType.Fold:
                graphNodeCollapse(
                    callbackColl[0]().current,
                    callbackColl[2](),
                    node,
                )
                break
            case OperateType.Unfold:
                graphNodeCollapse(
                    callbackColl[0]().current,
                    callbackColl[2](),
                    node,
                )
                break
            default:
                break
        }
    }

    const getSelectedObj = (objs) => {
        // 添加全部选中的业务对象或活动

        graphAddNode(
            callbackColl[0]().current,
            callbackColl[2](),
            node.id,
            objs.map((o) => {
                return new MindMapData({
                    id: o.id,
                    nodeType: NodeType.ReferenceNode,
                    dataInfo: {
                        ...o,
                        isHighLight: true,
                    },
                    children: [],
                    width: 220,
                    height: 86,
                    parentId: node.id,
                })
            }),
        )
        callbackColl[4]()(true)
    }

    return (
        <ConfigProvider
            locale={getAntdLocal()}
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classNames(
                    styles.activityShapeWrapper,
                    styles.commonShapeWrapper,
                )}
            >
                <div className={styles.common}>
                    <GlossaryIcon
                        type={nodeData.dataInfo?.object_type}
                        fontSize="28px"
                        width="28px"
                        styles={{ flexShrink: 0 }}
                    />
                    <span
                        className={styles.name}
                        title={nodeData?.dataInfo?.name}
                    >
                        {nodeData?.dataInfo?.name}
                    </span>
                    {callbackColl[3]() === 'edit' && (
                        <div className={styles.right}>
                            <Dropdown
                                menu={{ items, onClick }}
                                placement="bottom"
                                trigger={['click']}
                                getPopupContainer={(n) => graph.container}
                            >
                                <div className={styles.operate}>
                                    <AddOutlined />
                                </div>
                            </Dropdown>
                        </div>
                    )}
                </div>
                {/* {nodeData.collapsed && nodeData.children.length > 0 && (
                    <div className={styles.countWrapper}>
                        <div className={styles.line} />
                        <div
                            className={styles.count}
                            onClick={() => {
                                graphNodeCollapse(
                                    callbackColl[0]().current,
                                    callbackColl[2](),
                                    node,
                                )
                            }}
                        >
                            {nodeData.children.length}
                        </div>
                    </div>
                )}
                {!nodeData.collapsed && nodeData.children.length > 0 && (
                    <div className={styles.countWrapper}>
                        <div className={styles.line} />
                        <div
                            className={styles.count}
                            onClick={() => {
                                graphNodeCollapse(
                                    callbackColl[0]().current,
                                    callbackColl[2](),
                                    node,
                                )
                            }}
                        >
                            <MinusOutlined />
                        </div>
                    </div>
                )} */}
                <ChooseBusinessObj
                    id={nodeData?.dataInfo?.id}
                    open={chooseBusinessObjOpen}
                    onClose={() => setChooseBusinessObjOpen(false)}
                    getSelectedObj={getSelectedObj}
                    selectedData={
                        nodeData.children
                            ?.filter(
                                (item) =>
                                    item.nodeType === NodeType.ReferenceNode,
                            )
                            ?.map((item) => item.dataInfo) || []
                    }
                />
            </div>
        </ConfigProvider>
    )
}

const BusinessActivityNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.Activity,
        effect: ['data'],
        component: BusinessActivityNodeComponent,
    })
    return NodeType.Activity
}

export default BusinessActivityNode
