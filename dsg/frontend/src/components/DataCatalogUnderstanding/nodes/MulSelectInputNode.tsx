import React, { useEffect, useMemo, useRef, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Input, Select, Skeleton, Tooltip } from 'antd'
import { TextAreaRef } from 'antd/lib/input/TextArea'
import { Graph, Node } from '@antv/x6'
import { max, trim } from 'lodash'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useDebounceFn, useGetState, useMount } from 'ahooks'
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
const MulSelectInputNodeComponent = (props: any) => {
    const { viewMode } = useUndsGraphContext()
    const { graph, node } = props
    const { id, data } = node

    const selectRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<TextAreaRef>(null)
    const [nodeData, setNodeData] = useState<any>(data)
    const [selectOptions, setSelectOptions] = useState<any[]>([])
    const [selectValue, setSelectValue, getSelectValue] =
        useGetState<string[]>()
    const [contentValue, setContentValue, getContentValue] =
        useGetState<string>()
    const [scaleX, setScaleX] = useState<number>(1)

    // 选项逐个显示
    const renderSelect = (val) => {
        const end = () => {
            if (
                !aiIntervalData.nodeInterval &&
                !aiIntervalData.contentInterval
            ) {
                const parent = findNodeById(
                    callbackColl[2](),
                    mindMapData?.parentId,
                )
                parent!.recommended = false
                aiIntervalData.clear()
                if (
                    !parent?.recommendedAll &&
                    checkDimensionRecommend(callbackColl[2]())
                ) {
                    callbackColl[4]()?.(undefined)
                }
            }
            clearInterval(aiIntervalData.selectInterval)
            aiIntervalData.selectInterval = undefined
            if (!aiIntervalData.contentInterval) {
                aiIntervalData.needStart = false
            }
        }
        if (val && val.length > 0) {
            const interval = setInterval(() => {
                const idx = getSelectValue()?.length || 0
                setSelectValue(val.slice(0, idx + 1)?.map((info) => info.id))
                mindMapData!.dataInfo = {
                    ...mindMapData?.dataInfo,
                    content: {
                        ...mindMapData?.dataInfo?.content,
                        catalog_infos: val.slice(0, idx + 1),
                    },
                }
                if (idx === val.length) {
                    end()
                    refreshHi()
                }
            }, 10)
            aiIntervalData.selectInterval = interval
        } else {
            end()
            // graphRenderByData(callbackColl[0]().current, callbackColl[2]())
        }
    }

    // 文本逐字显示
    const renderText = (val) => {
        const end = () => {
            const parent = findNodeById(
                callbackColl[2](),
                mindMapData?.parentId,
            )
            if (
                !aiIntervalData.nodeInterval
                // &&
                // !aiIntervalData.selectInterval
            ) {
                parent!.recommended = false
                aiIntervalData.clear()
                if (
                    !parent?.recommendedAll &&
                    checkDimensionRecommend(callbackColl[2]())
                ) {
                    callbackColl[4]()?.(undefined)
                }
            } else if (mindMapData?.dataInfo?.max_multi === 1) {
                parent!.recommended = false
                callbackColl[4]()?.(undefined)
            }

            // graphRenderByData(callbackColl[0]().current, callbackColl[2]())
            aiIntervalData.clearContentInterval()
            // clearInterval(aiIntervalData.contentInterval)
            // aiIntervalData.contentInterval = undefined
            // if (!aiIntervalData.selectInterval) {
            //     aiIntervalData.needStart = false
            //     graphRenderByData(callbackColl[0]().current, callbackColl[2]())
            // }
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
                    refreshHi()
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
            renderText(data?.dataInfo?.content?.comprehension)
        } else if (!aiIntervalData.contentInterval) {
            setContentValue(data?.dataInfo?.content?.comprehension)
        }
        setSelectValue(
            data?.dataInfo?.content?.catalog_infos?.map((info) => info.id),
        )
        // if (
        //     aiIntervalData.needStart &&
        //     !aiIntervalData.selectInterval &&
        //     !aiIntervalData.contentInterval &&
        //     ((data?.dataInfo?.max_multi >= 1 &&
        //         !selectValue &&
        //         !contentValue) ||
        //         data?.dataInfo?.max_multi === 1)
        // ) {
        //     renderSelect(data?.dataInfo?.content?.catalog_infos)
        //     renderText(data?.dataInfo?.content?.comprehension)
        // } else if (
        //     !aiIntervalData.contentInterval &&
        //     !aiIntervalData.selectInterval
        // ) {
        //     setSelectValue(
        //         data?.dataInfo?.content?.catalog_infos?.map((info) => info.id),
        //     )
        //     setContentValue(data?.dataInfo?.content?.comprehension)
        // }
        if (viewMode === ViewMode.VIEW) {
            setSelectOptions(data.dataInfo?.content?.catalog_infos || [])
        } else {
            setSelectOptions(
                data.dataInfo?.choices
                    ? data.dataInfo.choices
                    : data.dataInfo?.content?.catalog_infos || [],
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

    useMount(() => {
        if (selectRef.current && data.dataInfo?.content) {
            refreshHi(data.height)
        }
    })

    useEffect(() => {
        graph.on('scale', ({ sx, sy }) => {
            setScaleX(sx)
        })
    }, [])

    const handleSelectChange = (value: string[], option: any) => {
        setSelectValue(value)
        const aiFilter =
            mindMapData!.dataInfo?.ai_content?.catalog_infos?.filter((info) =>
                value.includes(info.id),
            )
        const ai1 =
            aiFilter?.length > 0
                ? {
                      ...mindMapData?.dataInfo?.ai_content,
                      catalog_infos: aiFilter,
                  }
                : mindMapData?.dataInfo?.ai_content?.comprehension
                ? {
                      ...mindMapData?.dataInfo?.ai_content,
                      catalog_infos: undefined,
                  }
                : undefined
        mindMapData!.dataInfo = {
            ...mindMapData?.dataInfo,
            ai_content: ai1,
            content: {
                ...mindMapData?.dataInfo?.content,
                catalog_infos: selectOptions.filter((info) =>
                    value.includes(info.id),
                ),
            },
        }
        if (!value || value.length === 0) {
            const ai2 = mindMapData?.dataInfo?.ai_content?.comprehension
                ? {
                      ...mindMapData?.dataInfo?.ai_content,
                      catalog_infos: undefined,
                  }
                : undefined
            const ct = mindMapData?.dataInfo?.content?.comprehension
                ? {
                      ...mindMapData?.dataInfo?.content,
                      catalog_infos: undefined,
                  }
                : undefined
            mindMapData!.dataInfo = {
                ...mindMapData?.dataInfo,
                ai_content: ai2,
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
        refreshHi()
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
            const ai = mindMapData?.dataInfo?.ai_content?.catalog_infos
                ? {
                      ...mindMapData?.dataInfo?.ai_content,
                      comprehension: undefined,
                  }
                : undefined
            const ct = mindMapData?.dataInfo?.content?.catalog_infos
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

    // 刷新高度
    const refreshHi = (height?: number) => {
        const inputHi =
            height ||
            inputRef.current?.resizableTextArea?.textArea.offsetHeight ||
            32
        const selectHi = selectRef.current?.offsetHeight || 32
        const hi = max([inputHi, selectHi]) || 32
        if (mindMapData && hi !== mindMapData.height) {
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
                <div
                    ref={selectRef}
                    onFocus={() => {}}
                    onMouseOver={() => {
                        selectRef.current?.focus()
                    }}
                >
                    <Select
                        className={styles.sin_select}
                        placeholder={__('请选择目录')}
                        filterOption={filterSearchValue}
                        showSearch
                        mode="multiple"
                        optionLabelProp="label"
                        value={selectValue}
                        onChange={handleSelectChange}
                        status={
                            viewMode === ViewMode.EDIT &&
                            nodeData?.dataInfo?.content_errors
                                ? 'error'
                                : undefined
                        }
                        maxLength={nodeData.dataInfo.item_length}
                        maxTagTextLength={10}
                        disabled={viewMode === ViewMode.VIEW}
                        notFoundContent={
                            selectOptions.length > 0
                                ? __('未找到匹配的结果')
                                : __('暂无数据')
                        }
                        dropdownMatchSelectWidth={false}
                        dropdownStyle={{
                            width: 220 * scaleX,
                            minWidth: 220 * scaleX,
                        }}
                        getPopupContainer={() => graph.container}
                    >
                        {selectOptions.map((info) => (
                            <Select.Option
                                value={info.id}
                                label={info.title}
                                key={info.id}
                                style={{ lineHeight: '38px' }}
                            >
                                <div
                                    style={{
                                        height: '44px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <span
                                        style={{
                                            lineHeight: '22px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                        title={info.title}
                                    >
                                        {info.title}
                                    </span>
                                    <span
                                        style={{
                                            lineHeight: '22px',
                                            color: 'rgb(0 0 0 / 45%)',
                                            fontSize: '12px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                        title={info?.path}
                                    >
                                        {info?.path || '--'}
                                    </span>
                                </div>
                            </Select.Option>
                        ))}
                    </Select>
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

const MulSelectInputNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.MulSelectInputNode,
        effect: ['data'],
        component: MulSelectInputNodeComponent,
    })
    return NodeType.MulSelectInputNode
}

export default MulSelectInputNode
