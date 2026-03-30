import * as React from 'react'
import { useState, useEffect } from 'react'
import { Node } from '@antv/x6'
import { PlusOutlined } from '@ant-design/icons'
import { register } from '@antv/x6-react-shape'
import { Input, message } from 'antd'
import { trim } from 'lodash'
import styles from './styles.module.less'
import {
    shapeType,
    getNodesByShape,
    StageDataTemplate,
    getNewStagePosition,
    ValidateResult,
    getValidateResult,
    ErrorMessage,
    messageDebounce,
    getContainerNodes,
    setStageIsParents,
} from '../helper'
import { messageError } from '@/core'

let callbackColl: any = []
const messageDebounced = messageDebounce(3000)

const StageNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const { name } = data
    const [stageName, setStageData] = useState(name)
    const [editStatus, setEditStatus] = useState(false)
    const [isShowAddButton, setIsShowAddButton] = useState(false)
    // 错误状态
    const [errorStatus, setErrorStatus] = useState(ValidateResult.Normal)
    const [graphModel, setGraphModel] = useState(callbackColl[1]())

    useEffect(() => {
        setGraphModel(callbackColl[1]())
    }, [node])
    /**
     * 点击增加
     */
    const onAddStage = (site: 'left' | 'right') => {
        const graphCase = callbackColl[0]()
        if (!graphCase || !graphCase.current) {
            return
        }
        const nodes: Array<Node> = graphCase.current.getNodes()
        const stageNodes = getNodesByShape(nodes, shapeType.Stage)
        const newNode = graphCase.current.addNode({
            ...StageDataTemplate,
            position: getNewStagePosition(
                stageNodes,
                {
                    node,
                    site,
                },
                nodes,
            ),
        })
        setStageIsParents(
            newNode,
            getContainerNodes(newNode, graphCase.current.getNodes()),
        )
    }

    // 验证名称
    const validateName = (value: string): boolean => {
        const trimValue = trim(value)
        const ErrorType = getValidateResult(trimValue)
        setErrorStatus(ErrorType)
        if (ErrorType !== ValidateResult.Normal) {
            messageDebounced(() => messageError(ErrorMessage[ErrorType]))
            return false
        }
        return true
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#fff',
            }}
        >
            <div
                className={styles.lane}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    border:
                        errorStatus !== ValidateResult.Normal
                            ? '1px solid #ff4d4f'
                            : '1px solid rgb(56 123 254 / 20%)',
                    background: 'rgb(56 123 254 / 6%)',
                    borderRadius: '0 0 3px 3px',
                }}
                onFocus={() => 0}
                onBlur={() => 0}
                onMouseEnter={(e) => {
                    const graphCase = callbackColl[0]()
                    if (graphCase && graphCase.current) {
                        const nodes: Array<Node> = graphCase.current.getNodes()
                        const stageNodes = getNodesByShape(
                            nodes,
                            shapeType.Stage,
                        )
                        if (stageNodes.length < 50) {
                            setIsShowAddButton(true)
                        }
                    }
                }}
                onMouseLeave={(e) => {
                    setIsShowAddButton(false)
                }}
            >
                <div
                    className={styles.title}
                    style={{
                        display: 'inline-flex',
                        width: '100%',
                        minHeight: '60px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#126ee3',
                        color: 'white',
                        wordBreak: 'break-all',
                    }}
                    onDoubleClick={(e) => {
                        if (!editStatus && graphModel === 'resumedraft') {
                            setEditStatus(true)
                        }
                    }}
                >
                    {editStatus ? (
                        <Input.TextArea
                            value={stageName}
                            maxLength={32}
                            onChange={(e) => {
                                setStageData(e.target.value)
                            }}
                            onBlur={() => {
                                validateName(stageName)
                                if (trim(stageName) === '') {
                                    setStageData('阶段')
                                }
                                node.setData({
                                    name: trim(stageName) || '阶段',
                                })
                                setEditStatus(false)
                            }}
                            onKeyDown={(e) => {
                                if (e.keyCode === 13) {
                                    e.preventDefault()
                                }
                            }}
                            style={{
                                fontSize: '16px',
                            }}
                            onFocus={(e) => {
                                e.target.select()
                            }}
                            autoFocus
                            autoSize
                            className={styles.inputStage}
                        />
                    ) : (
                        <div
                            style={{
                                wordBreak: 'break-all',
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%',
                                padding: '5px 15px',
                                color: '#fff',
                                textAlign: 'center',
                            }}
                            className={styles.label}
                        >
                            {stageName}
                        </div>
                    )}
                </div>
                {isShowAddButton && graphModel === 'resumedraft' ? (
                    <div className={styles.stageBody}>
                        <div className={styles.stageAddButton}>
                            <PlusOutlined
                                onClick={() => {
                                    onAddStage('left')
                                }}
                            />
                        </div>
                        <div className={styles.stageAddButton}>
                            <PlusOutlined
                                onClick={() => {
                                    onAddStage('right')
                                }}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

const StageNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'stage',
        width: 180,
        height: 36,
        effect: ['data'],
        component: StageNodeComponent,
    })
    return 'stage'
}

export default StageNode
