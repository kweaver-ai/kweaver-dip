import React, { useMemo, useRef, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Input, Skeleton } from 'antd'
import { TextAreaRef } from 'antd/lib/input/TextArea'
import { trim } from 'lodash'
import { useDebounceFn, useGetState } from 'ahooks'
import styles from './styles.module.less'
import { nodeStyleInfo, NodeType, ViewMode } from '../const'
import __ from '../locale'
import {
    checkDimensionRecommend,
    findNodeById,
    graphDeleteNode,
    graphRenderByData,
} from '../helper'
import { RecycleBinOutlined } from '@/icons'
import aiIdentify from '@/icons/svg/outlined/aiIdentify.svg'
import AiIntervalData from '../AiIntervalData'
import { getAntdLocal } from '@/core/graph/helper'
import { useUndsGraphContext } from '@/context/UndsGraphProvider'

let callbackColl: any = []
const TextAreaNodeComponent = (props: any) => {
    const { viewMode } = useUndsGraphContext()
    const { node } = props
    const { id, data } = node

    const [nodeData, setNodeData] = useState<any>(data)
    const [contentValue, setContentValue, getContentValue] =
        useGetState<string>()
    const inputRef = useRef<TextAreaRef>(null)

    // 文本逐字显示
    const renderText = (val) => {
        const end = () => {
            const parent = findNodeById(
                callbackColl[2](),
                mindMapData?.parentId,
            )
            if (!aiIntervalData.nodeInterval) {
                aiIntervalData.clear()
                parent!.recommended = false
                if (
                    !parent?.recommendedAll &&
                    checkDimensionRecommend(callbackColl[2]())
                ) {
                    callbackColl[4]()?.(undefined)
                }
                graphRenderByData(callbackColl[0]().current, callbackColl[2]())
            } else if (mindMapData?.dataInfo?.max_multi === 1) {
                parent!.recommended = false
                graphRenderByData(callbackColl[0]().current, callbackColl[2]())
                callbackColl[4]()?.(undefined)
            }
            aiIntervalData.clearContentInterval()
        }
        if (val) {
            const interval = setInterval(() => {
                const idx = getContentValue()?.length || 0
                setContentValue(val.substring(0, idx + 1))
                mindMapData!.dataInfo = {
                    ...mindMapData?.dataInfo,
                    content: val.substring(0, idx + 1),
                }
                if (idx === val.length - 1) {
                    end()
                }
            }, 5)
            aiIntervalData.contentInterval = interval
        } else {
            end()
            graphRenderByData(callbackColl[0]().current, callbackColl[2]())
        }
    }

    let aiIntervalData: AiIntervalData
    const mindMapData = useMemo(() => findNodeById(callbackColl[2](), id), [])
    useMemo(() => {
        aiIntervalData = callbackColl[3]()
        const parent = findNodeById(callbackColl[2](), mindMapData?.parentId)
        if (parent && !parent?.recommendedAll) {
            aiIntervalData = parent.aiIntervalData!
        }
        if (
            aiIntervalData.needStart &&
            !aiIntervalData.contentInterval &&
            ((data?.dataInfo?.max_multi >= 1 && !contentValue) ||
                data?.dataInfo?.max_multi === 1)
        ) {
            setContentValue(undefined)
            renderText(data?.dataInfo?.content)
        } else if (!aiIntervalData.contentInterval) {
            setContentValue(data?.dataInfo?.content)
        }
        setNodeData(data)
    }, [data])
    // const viewMode = useMemo(() => callbackColl[1](), [])
    const showAi = useMemo(() => {
        if (!contentValue) {
            return false
        }
        return !!nodeData?.dataInfo?.ai_content
    }, [contentValue, nodeData])

    const handleTextAreaChange = (e) => {
        const inputValue = e.target.value
        setContentValue(inputValue)
        mindMapData!.dataInfo = {
            ...mindMapData?.dataInfo,
            content: inputValue,
        }
        const parent = findNodeById(callbackColl[2](), mindMapData?.parentId)
        if (parent?.dataInfo?.error) {
            parent.dataInfo!.error = undefined
        }
        if (!inputValue) {
            mindMapData!.dataInfo = {
                ...mindMapData?.dataInfo,
                ai_content: undefined,
                content: undefined,
            }
        }
        refreshHiWait()
    }

    // 刷新高度
    const refreshHi = () => {
        const hi =
            inputRef.current?.resizableTextArea?.textArea.offsetHeight || 32
        if (hi !== mindMapData!.height) {
            mindMapData!.height = hi
        }
        graphRenderByData(callbackColl[0]().current, callbackColl[2]())
    }

    const { run: refreshHiWait } = useDebounceFn(refreshHi, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    return (
        <ConfigProvider
            locale={getAntdLocal()}
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            {nodeData?.recommended && (
                <div
                    className={styles.node_skeleton}
                    style={{
                        width: nodeData.width,
                        height: nodeData.height,
                    }}
                >
                    <Skeleton.Input
                        active
                        style={{
                            width: nodeStyleInfo[nodeData.nodeType].width - 104,
                            borderRadius: 4,
                        }}
                    />
                </div>
            )}
            <div
                className={styles.textAreaNodeWrap}
                style={{
                    width: nodeData.width,
                    height: nodeData.height,
                }}
                hidden={!!nodeData?.recommended}
            >
                <Input.TextArea
                    ref={inputRef}
                    className={styles.tan_input}
                    placeholder={`${__('请输入')}${nodeData?.dataInfo?.name}`}
                    autoSize
                    maxLength={255}
                    value={contentValue}
                    onChange={handleTextAreaChange}
                    disabled={viewMode === ViewMode.VIEW}
                    onBlur={() => {
                        if (contentValue) {
                            setContentValue(trim(contentValue))
                            mindMapData!.dataInfo = {
                                ...mindMapData?.dataInfo,
                                content: trim(contentValue),
                            }
                            refreshHi()
                        }
                    }}
                />
                <RecycleBinOutlined
                    className={styles.deleteIcon}
                    hidden={viewMode === ViewMode.VIEW}
                    onClick={() =>
                        graphDeleteNode(
                            callbackColl[0]().current,
                            callbackColl[2](),
                            id,
                            callbackColl[4](),
                        )
                    }
                />
                <img
                    src={aiIdentify}
                    alt="aiIdentify"
                    className={styles.aiIcon}
                    hidden={!showAi}
                />
            </div>
        </ConfigProvider>
    )
}

const TextAreaNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.TextAreaNode,
        effect: ['data'],
        component: TextAreaNodeComponent,
    })
    return NodeType.TextAreaNode
}

export default TextAreaNode
