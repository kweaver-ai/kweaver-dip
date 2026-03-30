import React, { useEffect, useMemo, useState } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider, DatePicker, Skeleton } from 'antd'
import moment from 'moment'
import styles from './styles.module.less'
import { NodeType, ViewMode } from '../const'
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

const { RangePicker } = DatePicker

let callbackColl: any = []
const TimeNodeComponent = (props: any) => {
    const { viewMode } = useUndsGraphContext()

    const { node } = props
    const { id, data } = node

    const [nodeData, setNodeData] = useState<any>(data)
    const [timeValue, setTimeValue] = useState<any>()

    let aiIntervalData: AiIntervalData
    const mindMapData = useMemo(() => findNodeById(callbackColl[2](), id), [])
    useMemo(() => {
        aiIntervalData = callbackColl[3]()
        const parent = findNodeById(callbackColl[2](), mindMapData?.parentId)
        if (parent && !parent?.recommendedAll) {
            aiIntervalData = parent.aiIntervalData!
        }
        if (aiIntervalData.needStart) {
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
            }
            aiIntervalData.needStart = false
        }
        setTimeValue([
            data?.dataInfo?.content?.start
                ? moment(data.dataInfo.content.start * 1000)
                : null,
            data?.dataInfo?.content?.end
                ? moment(data.dataInfo.content.end * 1000)
                : null,
        ])
        setNodeData(data)
    }, [data])
    // const viewMode = useMemo(() => callbackColl[1](), [])
    const showAi = useMemo(() => {
        if (timeValue?.[0] === null || timeValue?.[1] === null) {
            return false
        }
        return !!nodeData?.dataInfo?.ai_content
    }, [nodeData, timeValue])

    const handleValueChange = (values) => {
        setTimeValue(values)
        if (values?.[0] === null || values?.[1] === null) {
            mindMapData!.dataInfo = {
                ...mindMapData?.dataInfo,
                content: undefined,
                ai_content: undefined,
            }
        } else {
            mindMapData!.dataInfo = {
                ...mindMapData?.dataInfo,
                content: {
                    start: values?.[0].endOf('month').unix(),
                    end: values?.[1].endOf('month').unix(),
                },
            }
        }
        const parent = findNodeById(callbackColl[2](), mindMapData?.parentId)
        if (parent?.dataInfo?.error) {
            parent.dataInfo!.error = undefined
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
                <Skeleton.Input
                    active
                    style={{ width: 220, borderRadius: 4 }}
                />
            )}
            <div
                className={styles.timeNodeWrap}
                style={{
                    width: nodeData.width,
                    height: nodeData.height,
                }}
                hidden={!!nodeData?.recommended}
            >
                <RangePicker
                    className={styles.tn_date}
                    picker="month"
                    allowClear={false}
                    inputReadOnly
                    placeholder={[__('开始时间'), __('结束时间')]}
                    disabled={viewMode === ViewMode.VIEW}
                    value={timeValue}
                    onChange={handleValueChange}
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

const TimeNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.TimeNode,
        effect: ['data'],
        component: TimeNodeComponent,
    })
    return NodeType.TimeNode
}

export default TimeNode
