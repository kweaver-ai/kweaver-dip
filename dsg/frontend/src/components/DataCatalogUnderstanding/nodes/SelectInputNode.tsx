import React, { useEffect, useMemo, useRef, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Input, Select, Skeleton, Tooltip } from 'antd'
import { TextAreaRef } from 'antd/lib/input/TextArea'
import { trim } from 'lodash'
import { ExclamationCircleOutlined } from '@ant-design/icons'
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
const SelectInputNodeComponent = (props: any) => {
    const { viewMode } = useUndsGraphContext()
    const { graph, node } = props
    const { id: nodeId, data } = node

    const inputRef = useRef<TextAreaRef>(null)
    const selectRef = useRef<HTMLDivElement>(null)
    const [nodeData, setNodeData] = useState<any>(data)
    const [selectOptions, setSelectOptions] = useState<any[]>([])
    const [selectValue, setSelectValue] = useState<any>()
    const [contentValue, setContentValue, getContentValue] =
        useGetState<string>()
    const [scaleX, setScaleX] = useState<number>(1)

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
                    content: {
                        ...mindMapData?.dataInfo?.content,
                        comprehension: val.substring(0, idx + 1),
                    },
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
    const mindMapData = useMemo(
        () => findNodeById(callbackColl[2](), nodeId),
        [],
    )
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
            renderText(data?.dataInfo?.content?.comprehension)
        } else if (!aiIntervalData.contentInterval) {
            setContentValue(data?.dataInfo?.content?.comprehension)
        }
        setSelectValue(data?.dataInfo?.content?.column_info?.id)
        if (callbackColl[1]() === ViewMode.VIEW) {
            setSelectOptions(
                data.dataInfo?.content?.column_info
                    ? [data.dataInfo?.content?.column_info]
                    : data.dataInfo.choices || [],
            )
        } else {
            setSelectOptions(
                data.dataInfo?.choices
                    ? data.dataInfo.choices
                    : data.dataInfo?.content?.column_info
                    ? [data.dataInfo?.content?.column_info]
                    : [],
            )
        }
        setNodeData(data)
    }, [data])
    // const viewMode = useMemo(() => callbackColl[1](), [])
    const showAi = useMemo(() => {
        if (!contentValue && !selectValue) {
            return false
        }
        return !!nodeData?.dataInfo?.ai_content
    }, [nodeData, selectValue, contentValue])

    useEffect(() => {
        graph.on('scale', ({ sx, sy }) => {
            setScaleX(sx)
        })
    }, [])

    const handleSelectChange = (value: any, option: any) => {
        setSelectValue(value)
        const ai =
            (value &&
                mindMapData?.dataInfo?.ai_content?.column_info?.id !== value) ||
            !value
                ? mindMapData?.dataInfo?.ai_content?.comprehension
                    ? {
                          ...mindMapData?.dataInfo?.ai_content,
                          column_info: undefined,
                      }
                    : undefined
                : mindMapData?.dataInfo?.ai_content
        mindMapData!.dataInfo = {
            ...mindMapData?.dataInfo,
            ai_content: ai,
            content: {
                ...mindMapData?.dataInfo?.content,
                column_info: selectOptions.find((info) => value === info.id),
            },
        }
        if (!value) {
            const ct = mindMapData?.dataInfo?.content?.comprehension
                ? {
                      ...mindMapData?.dataInfo?.content,
                      column_info: undefined,
                  }
                : undefined
            mindMapData!.dataInfo = {
                ...mindMapData?.dataInfo,
                ai_content: ai,
                content: ct,
            }
        }
        const parent = findNodeById(callbackColl[2](), mindMapData?.parentId)
        if (parent?.dataInfo?.error) {
            parent.dataInfo!.error = undefined
        }
        if (mindMapData?.dataInfo.content_errors) {
            mindMapData!.dataInfo.content_errors = undefined
        }
        graphRenderByData(callbackColl[0]().current, callbackColl[2]())
    }

    const handleTextAreaChange = (e) => {
        const inputValue = e.target.value
        setContentValue(inputValue)
        mindMapData!.dataInfo = {
            ...mindMapData?.dataInfo,
            content: {
                ...mindMapData?.dataInfo?.content,
                comprehension: inputValue,
            },
        }
        if (!inputValue) {
            const ai =
                mindMapData?.dataInfo?.ai_content?.column_info &&
                mindMapData?.dataInfo?.ai_content?.column_info?.id ===
                    mindMapData?.dataInfo?.content?.column_info?.id
                    ? {
                          ...mindMapData?.dataInfo?.content,
                          comprehension: undefined,
                      }
                    : undefined
            const ct = mindMapData?.dataInfo?.content?.column_info
                ? {
                      ...mindMapData?.dataInfo?.content,
                      comprehension: undefined,
                  }
                : undefined
            mindMapData!.dataInfo = {
                ...mindMapData?.dataInfo,
                ai_content: ai,
                content: ct,
            }
        }
        const parent = findNodeById(callbackColl[2](), mindMapData?.parentId)
        if (parent?.dataInfo?.error) {
            parent.dataInfo!.error = undefined
        }
        if (mindMapData?.dataInfo.content_errors) {
            mindMapData!.dataInfo.content_errors = undefined
        }
        refreshHiWait()
    }

    // 搜索过滤
    const filterSearchValue = (inputValue: string, option) => {
        return option.label.match(new RegExp(trim(inputValue), 'ig'))
    }

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
                            width: nodeStyleInfo[nodeData.nodeType].width - 128,
                            borderRadius: 4,
                        }}
                    />
                </div>
            )}
            <div
                className={styles.selectInputNodeWrap}
                style={{
                    width: nodeData.width,
                    height: nodeData.height,
                }}
                hidden={!!nodeData?.recommended}
            >
                <div ref={selectRef}>
                    <Select
                        id="selectInputNodeComponentSelect"
                        className={styles.sin_select}
                        placeholder={__('请选择字段')}
                        filterOption={filterSearchValue}
                        showSearch
                        allowClear
                        optionLabelProp="label"
                        status={
                            viewMode === ViewMode.EDIT &&
                            nodeData?.dataInfo?.content_errors
                                ? 'error'
                                : undefined
                        }
                        disabled={viewMode === ViewMode.VIEW}
                        value={selectValue}
                        onChange={handleSelectChange}
                        options={selectOptions.map((info) => ({
                            value: info.id,
                            label: info.name_cn,
                        }))}
                        dropdownMatchSelectWidth={false}
                        dropdownStyle={{
                            width: 220 * scaleX,
                            minWidth: 220 * scaleX,
                        }}
                        notFoundContent={
                            selectOptions.length > 0
                                ? __('未找到匹配的结果')
                                : __('暂无数据')
                        }
                        getPopupContainer={() => graph.container}
                    />
                </div>
                <div
                    className={styles.sin_line}
                    style={{
                        background:
                            viewMode === ViewMode.EDIT &&
                            nodeData?.dataInfo?.content_errors
                                ? '#f5222d'
                                : '#b7cff9',
                    }}
                />
                <Input.TextArea
                    ref={inputRef}
                    className={styles.sin_input}
                    placeholder={__('请输入理解')}
                    autoSize
                    maxLength={255}
                    status={
                        viewMode === ViewMode.EDIT &&
                        nodeData?.dataInfo?.content_errors
                            ? 'error'
                            : undefined
                    }
                    value={contentValue}
                    onChange={handleTextAreaChange}
                    disabled={viewMode === ViewMode.VIEW}
                    onBlur={() => {
                        if (contentValue) {
                            setContentValue(trim(contentValue))
                            mindMapData!.dataInfo = {
                                ...mindMapData?.dataInfo,
                                content: {
                                    ...mindMapData?.dataInfo?.content,
                                    comprehension: trim(contentValue),
                                },
                            }
                            refreshHi()
                        }
                    }}
                    onMouseMove={(e) => e.stopPropagation()}
                />
                <Tooltip
                    title={nodeData?.dataInfo?.content_errors}
                    placement="top"
                >
                    <ExclamationCircleOutlined
                        hidden={
                            viewMode === ViewMode.VIEW ||
                            !nodeData?.dataInfo?.content_errors
                        }
                        className={styles.errorIcon}
                    />
                </Tooltip>
                <RecycleBinOutlined
                    className={styles.deleteIcon}
                    hidden={viewMode === ViewMode.VIEW}
                    onClick={() =>
                        graphDeleteNode(
                            callbackColl[0]().current,
                            callbackColl[2](),
                            nodeId,
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

const SelectInputNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.SelectInputNode,
        effect: ['data'],
        component: SelectInputNodeComponent,
    })
    return NodeType.SelectInputNode
}

export default SelectInputNode
