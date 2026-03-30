import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { message } from 'antd'
import { useResetState, useUpdateEffect } from 'ahooks'
import { trim } from 'lodash'
import { async } from '@antv/x6/lib/registry/marker/async'
import { DetailsOutlined, EditOutlined } from '@/icons'
import { ValidateResult, getValidateResult, ErrorMessage } from '../helper'
import { messageError } from '@/core'

let callbackColl: any = []
const bodyStyle = {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    paddingRight: '12px',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 0 2px 6px transparent',
    overflow: 'hidden',
}

const InputNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const { name, task_config, status } = data

    // 错误状态
    const [errorStatus, setErrorStatus, resetErrorStatus] =
        useResetState(status)

    // 编辑/详情按钮显示/隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 阴影
    const [shadow, setShadow, resetShadow] = useResetState(
        '0 0 4px 4px transparent',
    )

    const callback = (index: number): any => {
        if (callbackColl.length > index) {
            return callbackColl[index]()
        }
        return null
    }

    // 节点颜色状态
    const [color, setColor, resetColor] = useResetState(() => {
        if (task_config && task_config.exec_role) {
            // const res = (callback(2) as IAssemblyLineRoleItem[])?.filter(
            //     (r) => r.id === task_config.exec_role_id,
            // )
            return task_config.exec_role.color
        }
        return undefined
    })

    useUpdateEffect(() => {
        resetShadow()
        resetColor()
        resetErrorStatus()
    }, [data])

    // 验证名称
    const validateName = (value: string) => {
        const trimValue = trim(value)
        const ErrorType = getValidateResult(trimValue)
        setErrorStatus(ErrorType)
        if (ErrorType !== ValidateResult.Normal) {
            messageError(ErrorMessage[ErrorType])
        }
    }

    return (
        <div
            style={
                errorStatus !== ValidateResult.Normal
                    ? {
                          ...bodyStyle,
                          border: '1px solid #ff4d4f',
                      }
                    : {
                          ...bodyStyle,
                          boxShadow: shadow,
                      }
            }
            onFocus={() => {
                setEditVisible(true)
            }}
            onMouseEnter={() => {
                setEditVisible(true)
                setShadow(`0px 2px 6px 0px rgba(0,0,0,0.1)`)
            }}
            onMouseLeave={() => {
                setEditVisible(false)
                setShadow('0px 2px 6px 0px transparent')
            }}
            onClick={() => {
                if (callback(0) !== 'resumedraft') {
                    const openConfig = callback(1)
                    if (openConfig) {
                        openConfig(node)
                    }
                }
            }}
        >
            <div
                style={{
                    width: 4,
                    height: '100%',
                    marginRight: '12px',
                    borderRadius: '3px 0 0 3px',
                    backgroundColor: `#126ee3`,
                }}
            />
            <div
                style={{
                    color: 'rgba(0, 0, 0, 0.85)',
                    display: 'flex',
                    width: '32px',
                    height: '100%',
                    flex: '1',
                    alignItems: 'center',
                    fontSize: '14px',
                    whiteSpace: 'normal',
                    wordBreak: 'break-all',
                }}
                onDoubleClick={() => {
                    const openConfig = callback(1)
                    if (openConfig) {
                        openConfig(node)
                    }
                }}
                title={name}
            >
                {name}
            </div>
            <div
                style={{
                    width: '48px',
                    height: '17px',
                    lineHeight: '17px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}
            >
                {callback(0) === 'resumedraft' ? (
                    <EditOutlined
                        style={{
                            visibility: editVisible ? 'visible' : 'hidden',
                            alignSelf: 'center',
                            marginLeft: '8px',
                            color: 'rgba(0, 0, 0, 0.65)',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            const openConfig = callback(1)
                            if (openConfig) {
                                openConfig(node)
                            }
                        }}
                    />
                ) : (
                    <DetailsOutlined
                        style={{
                            visibility: editVisible ? 'visible' : 'hidden',
                            alignSelf: 'center',
                            marginLeft: '8px',
                            color: 'rgba(0, 0, 0, 0.65)',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            const openConfig = callback(1)
                            if (openConfig) {
                                openConfig(node)
                            }
                        }}
                    />
                )}
            </div>
        </div>
    )
}

const InputNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'input_node',
        effect: ['data'],
        component: InputNodeComponent,
    })
    return 'input_node'
}

export default InputNode
