import { ExclamationCircleOutlined, MinusOutlined } from '@ant-design/icons'
import { Graph, Node } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import { useDebounce, useUpdateEffect } from 'ahooks'
import {
    ConfigProvider,
    Dropdown,
    Input,
    MenuProps,
    message,
    Space,
    Tooltip,
} from 'antd'
import classNames from 'classnames'
import { trim } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import { ErrorInfo, getPlatformNumber, nameReg } from '@/utils'
import { AddOutlined, EllipsisOutlined, LogicEntityColored } from '@/icons'
import { NodeType, OperateType } from '../const'
import {
    findNodeById,
    getAntdLocal,
    graphAddNode,
    graphDeleteNode,
    graphNodeCollapse,
} from '../helper'
import __ from '../locale'
import styles from './styles.module.less'

let callbackColl: any = []
interface ILogicEntityNodeComponent {
    node: Node
    graph: Graph
}
const LogicEntityNodeComponent: React.FC<ILogicEntityNodeComponent> = ({
    node,
    graph,
}) => {
    const { data } = node

    const [nodeData, setNodeData] = useState<any>(data)
    const [name, setName] = useState('')
    const debounceName = useDebounce(name, { wait: 500 })
    const [isRename, setIsRename] = useState(false)
    const [isNameError, setIsNameError] = useState(false)
    const platformNumber = getPlatformNumber()

    // 同级节点的所有名字
    const sameLevelNames = useMemo(() => {
        const currentParentData = findNodeById(
            callbackColl[2](),
            nodeData.parentId,
        )
        const names: string[] = []
        currentParentData?.children?.forEach((item) => {
            if (item.dataInfo?.id !== nodeData.dataInfo.id)
                names.push(item.dataInfo?.name)
        })
        return names
    }, [data])

    useUpdateEffect(() => {
        // 重名时不允许保存
        if (sameLevelNames.find((n) => n === debounceName)) {
            callbackColl[4]?.()({
                ...callbackColl[5]?.(),
                [nodeData.id]:
                    // platformNumber === LoginPlatform.default
                    //     ? __('逻辑实体名称在业务对象/活动中重复，请重新输入')
                    //     :
                    __('逻辑实体名称在业务对象中重复，请重新输入'),
            })
            setIsNameError(false)
        } else if (
            (debounceName && nameReg.test(debounceName)) ||
            !debounceName
        ) {
            callbackColl[4]?.()({
                ...callbackColl[5]?.(),
                [nodeData.id]: '',
            })
            setIsNameError(false)
        } else {
            callbackColl[4]?.()({
                ...callbackColl[5]?.(),
                // [nodeData.id]: ErrorInfo.ONLYSUP,
            })
            setIsNameError(false)
        }
    }, [debounceName])

    useEffect(() => {
        setNodeData(data)
        // setName(data?.dataInfo?.name)
        if (!data?.dataInfo?.name) {
            setIsRename(true)
        }
    }, [data])

    const items: MenuProps['items'] = [
        {
            key: OperateType.Rename,
            label: <div>{__('重命名')}</div>,
        },
        {
            key: OperateType.Delete,
            label: <div style={{ minWidth: 152 }}>{__('删除')}</div>,
        },
    ]

    const deleteEntity = () => {
        const currentData = findNodeById(callbackColl[2](), nodeData.id)
        if ((currentData?.children?.length || 0) > 0) {
            confirm({
                title: '确认要删除逻辑实体吗？',
                icon: <ExclamationCircleOutlined />,
                content: __(
                    '删除后，「${name}」逻辑实体中的${count}个属性将一并删除。',
                    {
                        name: nodeData.dataInfo.name,
                        count: currentData?.children?.length,
                    },
                ),
                okText: __('确定'),
                cancelText: __('取消'),
                onOk: () => {
                    graphDeleteNode(
                        callbackColl[0]().current,
                        callbackColl[2](),
                        node.id,
                    )
                },
            })
            return
        }
        graphDeleteNode(callbackColl[0]().current, callbackColl[2](), node.id)
    }

    const onClick = ({ key }) => {
        switch (key) {
            case OperateType.AddAttribute:
                graphAddNode(
                    callbackColl[0]().current,
                    callbackColl[2](),
                    node.id,
                )
                break
            case OperateType.Rename:
                setIsRename(true)
                setName(nodeData?.dataInfo?.name)
                break
            case OperateType.Delete:
                deleteEntity()
                break
            default:
                break
        }
    }

    const getNewName = (names: string[], i = 0) => {
        const newName = i === 0 ? __('未命名') : `${__('未命名')}${i}`
        if (names.find((n) => n === newName)) {
            return getNewName(names, i + 1)
        }
        return newName
    }

    const renameOver = () => {
        if (isNameError) return
        let newName = ''
        if (name) {
            if (sameLevelNames.find((item) => item === name)) {
                message.error(
                    // platformNumber === LoginPlatform.default
                    //     ? __('逻辑实体名称在业务对象/活动中重复，请重新输入')
                    //     :
                    __('逻辑实体名称在业务对象中重复，请重新输入'),
                )
                return
            }
        } else {
            newName = getNewName(sameLevelNames)
        }
        setIsRename(false)
        node.replaceData({
            ...nodeData,
            dataInfo: { ...nodeData.dataInfo, name: name || newName },
        })
        const currentData = findNodeById(callbackColl[2](), node.id)
        if (currentData && currentData?.dataInfo) {
            currentData.dataInfo.name = name || newName
        }
    }

    const handleNameChange = (e) => {
        setName(trim(e.target.value))
    }

    return (
        <ConfigProvider
            locale={getAntdLocal()}
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classNames(
                    styles.commonShapeWrapper,
                    styles.logicEntityShapeWrapper,
                )}
            >
                <div className={styles.common}>
                    {isRename ? (
                        <Input
                            placeholder={__('请输入逻辑实体名称')}
                            value={name}
                            autoFocus
                            onBlur={() => renameOver()}
                            onPressEnter={() => renameOver()}
                            onChange={handleNameChange}
                            maxLength={128}
                            className={
                                isNameError ? styles.nameInput : undefined
                            }
                        />
                    ) : (
                        <>
                            <LogicEntityColored className={styles.typeIcon} />
                            <span
                                className={styles.name}
                                title={nodeData?.dataInfo?.name}
                            >
                                {nodeData?.dataInfo?.name}
                            </span>
                            {callbackColl[3]() === 'edit' && (
                                <div className={styles.right}>
                                    <Space size={8}>
                                        <Tooltip
                                            title={__('添加属性')}
                                            placement="bottom"
                                        >
                                            <div
                                                className={styles.operate}
                                                onClick={() =>
                                                    graphAddNode(
                                                        callbackColl[0]()
                                                            .current,
                                                        callbackColl[2](),
                                                        node.id,
                                                    )
                                                }
                                            >
                                                <AddOutlined />
                                            </div>
                                        </Tooltip>
                                        <Dropdown
                                            menu={{ items, onClick }}
                                            placement="bottom"
                                            trigger={['click']}
                                            getPopupContainer={() =>
                                                graph.container
                                            }
                                        >
                                            <div className={styles.operate}>
                                                <EllipsisOutlined />
                                            </div>
                                        </Dropdown>
                                    </Space>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {nodeData.collapsed && nodeData.children.length > 0 && (
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
                )}
                {isNameError && (
                    <div className={styles.errorInfo}>{ErrorInfo.ONLYSUP}</div>
                )}
            </div>
        </ConfigProvider>
    )
}

const LogicEntityNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.LogicEntity,
        effect: ['data'],
        component: LogicEntityNodeComponent,
    })
    return NodeType.LogicEntity
}

export default LogicEntityNode
