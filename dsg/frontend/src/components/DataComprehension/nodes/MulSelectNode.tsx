import { useEffect, useMemo, useRef, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, Select, Skeleton, Tooltip } from 'antd'
import { trim } from 'lodash'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useGetState, useMount } from 'ahooks'
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
const MulSelectNodeComponent = (props: any) => {
    const { viewMode } = useUndsGraphContext()
    const { graph, node } = props
    const { id, data } = node

    const ref = useRef<HTMLDivElement>(null)
    const [nodeData, setNodeData] = useState<any>(data)
    const [selectValue, setSelectValue, getSelectValue] =
        useGetState<string[]>()
    const [scaleX, setScaleX] = useState<number>(1)

    // 选项逐个显示
    const renderSelect = (val) => {
        const end = () => {
            const parent = findNodeById(
                callbackColl[2](),
                mindMapData?.parentId,
            )
            if (!aiIntervalData.nodeInterval) {
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
                graphRenderByData(callbackColl[0]().current, callbackColl[2]())
                callbackColl[4]()?.(undefined)
            }
            aiIntervalData.clearContentInterval()
        }
        if (val && val.length > 0) {
            const interval = setInterval(() => {
                const idx = getSelectValue()?.length || 0
                setSelectValue(val.slice(0, idx + 1)?.map((info) => info.id))
                mindMapData!.dataInfo = {
                    ...mindMapData?.dataInfo,
                    content: val.slice(0, idx + 1),
                }
                if (idx === val.length) {
                    end()
                }
                refreshHi()
            }, 10)
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
            ((data?.dataInfo?.max_multi >= 1 && !selectValue) ||
                data?.dataInfo?.max_multi === 1)
        ) {
            setSelectValue(undefined)
            renderSelect(data?.dataInfo?.content)
        } else if (!aiIntervalData.contentInterval) {
            setSelectValue(data?.dataInfo?.content?.map((info) => info.id))
        }
        setNodeData(data)
    }, [data])
    // const viewMode = useMemo(() => callbackColl[1](), [])
    const showAi = useMemo(() => {
        if (!selectValue || selectValue.length === 0) {
            return false
        }
        return !!nodeData?.dataInfo?.ai_content
    }, [nodeData, selectValue])

    useMount(() => {
        if (ref.current && data.dataInfo?.content) {
            refreshHi()
        }
    })

    useEffect(() => {
        graph.on('scale', ({ sx, sy }) => {
            setScaleX(sx)
        })
    }, [])

    const handleChange = (value, option) => {
        setSelectValue(value)
        const aiFilter = mindMapData!.dataInfo?.ai_content?.filter((info) =>
            value.includes(info.id),
        )
        const ai = aiFilter?.length > 0 ? aiFilter : undefined
        mindMapData!.dataInfo = {
            ...mindMapData?.dataInfo,
            ai_content: ai,
            content: option.map((info) => ({
                id: info.value,
                name: info.label,
            })),
        }
        if (!value || value.length === 0) {
            mindMapData!.dataInfo = {
                ...mindMapData?.dataInfo,
                ai_content: undefined,
                content: undefined,
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

    // 搜索过滤
    const filterSearchValue = (inputValue: string, option) => {
        return option.label.match(new RegExp(trim(inputValue), 'ig'))
    }

    // 刷新高度
    const refreshHi = () => {
        const hi = ref.current?.offsetHeight || 32
        if (mindMapData && hi !== mindMapData.height) {
            mindMapData!.height = hi
        }
        graphRenderByData(callbackColl[0]().current, callbackColl[2]())
    }

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
                className={styles.mulSelectNodeWrap}
                style={{
                    width: nodeData.width,
                    height: nodeData.height,
                }}
                onFocus={() => {}}
                onMouseMove={(e) => {
                    e.stopPropagation()
                }}
                onMouseOver={() => {
                    ref.current?.focus()
                }}
                hidden={!!nodeData?.recommended}
            >
                <div ref={ref}>
                    <Select
                        className={styles.msn_select}
                        placeholder={`${__('请选择')}${
                            nodeData?.dataInfo?.name
                        }`}
                        filterOption={filterSearchValue}
                        showSearch
                        mode="multiple"
                        status={
                            viewMode === ViewMode.EDIT &&
                            nodeData?.dataInfo?.content_errors
                                ? 'error'
                                : undefined
                        }
                        value={selectValue}
                        onChange={handleChange}
                        options={
                            viewMode === ViewMode.VIEW
                                ? nodeData.dataInfo.content?.map((info) => ({
                                      value: info.id,
                                      label: info.name,
                                  }))
                                : nodeData.dataInfo.choices
                                ? nodeData.dataInfo.choices.map((info) => ({
                                      value: info.id,
                                      label: info.name,
                                  }))
                                : nodeData.dataInfo.content?.map((info) => ({
                                      value: info.id,
                                      label: info.name,
                                  }))
                        }
                        maxLength={nodeData.dataInfo.item_length}
                        maxTagTextLength={10}
                        disabled={viewMode === ViewMode.VIEW}
                        notFoundContent={
                            nodeData.dataInfo.choices?.length > 0
                                ? __('未找到匹配的结果')
                                : __('暂无数据')
                        }
                        dropdownMatchSelectWidth={false}
                        dropdownStyle={{
                            width: 360 * scaleX,
                            minWidth: 360 * scaleX,
                        }}
                        getPopupContainer={() => graph.container}
                    />
                </div>
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

const MulSelectNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.MulSelectNode,
        effect: ['data'],
        component: MulSelectNodeComponent,
    })
    return NodeType.MulSelectNode
}

export default MulSelectNode
