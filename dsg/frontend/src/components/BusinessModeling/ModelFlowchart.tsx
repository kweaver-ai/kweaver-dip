import React, { useContext, useEffect, useRef, useState, useMemo } from 'react'
import { Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import styles from './styles.module.less'
import { AddOutlined, ImportOutlined } from '@/icons'
import { getActualUrl, OperateType, useQuery } from '@/utils'
import EditFlowchart from '../FlowchartMgt/EditFlowchart'
import ImportFlow from '../DrawioMgt/ImportFlow'
import {
    flowchartsQuery,
    formatError,
    IFlowchartItem,
    transformQuery,
    getDrawioUrl,
    getCoreBusinessDetails,
} from '@/core'
import { ViewMode } from './const'
import FlowchartInfoManager, {
    IFlowchartInfo,
    ViewType,
} from '../DrawioMgt/helper'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import { useBusinessModelContext } from './BusinessModelProvider'

interface IModelFlowchart {
    flowchartCount?: number
    modelId: string
}
const ModelFlowchart: React.FC<IModelFlowchart> = ({
    flowchartCount = 0,
    modelId,
}) => {
    const ref = useRef<HTMLIFrameElement>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const [createVisible, setCreateVisible] = useState(false)
    const [importVisible, setImportVisible] = useState(false)
    const [flowchartInfo, setFlowchartInfo] = useState<IFlowchartItem>()
    const navigate = useNavigate()
    const query = useQuery()
    // 流程图相关信息
    const { drawioInfo, setDrawioInfo } = useContext(DrawioInfoContext)
    // getAccess(
    //     `${ResourceType.business_model}.${RequestType.post}`,
    // )
    const { isDraft, selectedVersion, refreshDraft } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    useEffect(() => {
        queryFlowcharts()
    }, [modelId, versionParams])

    const queryFlowcharts = async () => {
        try {
            const res = await flowchartsQuery(modelId, {
                offset: 1,
                limit: 12,
                ...versionParams,
            })
            if (res.entries.length > 0) {
                const flowchart = res.entries[0]
                setFlowchartInfo(flowchart)
            }
        } catch (e) {
            formatError(e)
        }
    }
    const onOperate = (op) => {
        switch (op) {
            case OperateType.CREATE:
                setCreateVisible(true)
                break
            case OperateType.IMPORT:
                setImportVisible(true)
                break
            default:
                break
        }
    }

    // 进入画布url拼接
    const getUrlQuery = (item: IFlowchartItem) => {
        return `?viewType=business-architecture&rootFlowId=${item?.id}&saved=${
            item?.saved
        }${getDrawioUrl({
            isDraft,
            selectedVersion,
        })}`
    }

    // 创建后跳转编辑模式
    const handlejump = (data) => {
        const flowInfo: IFlowchartInfo = {
            mid: modelId,
            fid: data.id,
            title: data.name,
            isRoot: true,
            is_ref: false,
            mbsid: modelId || '',
            read_only: false,
            path: data.id,
            absolutePath: data.id,
        }
        const fm = new FlowchartInfoManager([flowInfo], flowInfo)
        window.localStorage.setItem(
            `${data.id}`,
            JSON.stringify({
                flowchartData: fm,
            }),
        )
        navigate(`/drawio${getUrlQuery(data)}&viewmode=0&isCreate=true`)
    }

    // 查询业务模型的流程图列表
    const queryFlowchart = async (draft) => {
        if (!modelId) {
            return
        }
        try {
            const res = await flowchartsQuery(modelId, {
                offset: 1,
                limit: 12,
                is_draft: transformQuery({ isDraft: draft }).is_draft,
                // ...versionParams,
            })
            if (res.entries.length > 0) {
                const flowchart = res.entries[0]
                handlejump(flowchart)
            }
        } catch (e) {
            formatError(e)
        }
    }

    const handleCreateFlowOk = async () => {
        try {
            const res = await getCoreBusinessDetails(modelId)
            if (res.has_draft !== undefined && res.has_draft !== isDraft) {
                refreshDraft?.(res.has_draft)
            }
            queryFlowchart(res?.has_draft)
        } catch (e) {
            formatError(e)
        }
    }

    // 假链接
    const placeholderUrl = () => {
        // return `http://localhost:8080/?viewmode=1&placeholder=1&dev=1`
        return `${
            window.location.origin
        }${`/anyfabric/drawio-app/?viewmode=1&placeholder=1${getDrawioUrl({
            isDraft,
            selectedVersion,
        })}`}`
    }

    return (
        <div className={styles['flowchart-wrapper']}>
            {flowchartCount === 0 ? (
                <div>
                    <Empty
                        desc={
                            <div className={styles['empty-desc']}>
                                <div>
                                    {__('暂无流程图，点击下方按钮可新建或导入')}
                                </div>
                                <Space className={styles.btns}>
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            onOperate(OperateType.CREATE)
                                        }
                                    >
                                        <AddOutlined />
                                        {__('新建')}
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            onOperate(OperateType.IMPORT)
                                        }
                                    >
                                        <ImportOutlined />
                                        {__('导入')}
                                    </Button>
                                </Space>
                            </div>
                        }
                        iconSrc={dataEmpty}
                    />
                    <EditFlowchart
                        visible={createVisible}
                        operate={OperateType.CREATE}
                        fid=""
                        modelId={modelId}
                        defaultName=""
                        onClose={() => setCreateVisible(false)}
                        onSure={handleCreateFlowOk}
                    />
                    <ImportFlow
                        visible={importVisible}
                        mid={modelId}
                        taskId=""
                        onClose={() => setImportVisible(false)}
                        onSure={() => handleCreateFlowOk()}
                        iframeRef={iframeRef}
                    />
                    <iframe
                        id="placeholderPreview"
                        ref={iframeRef}
                        src={placeholderUrl()}
                        title={__('流程图')}
                        name={__('流程图')}
                        style={{
                            width: '100%',
                            height: 0,
                            border: 0,
                        }}
                    />
                </div>
            ) : (
                <div className={styles.iframe}>
                    <iframe
                        id="preview"
                        ref={ref}
                        src={`${
                            window.location.origin
                        }/anyfabric/drawio-app/?viewmode=1&mid=${modelId}&fid=${
                            flowchartInfo?.id
                        }&title=qwer&taskId=&userId=73072488-76f9-11ee-9d00-c2c8dbbe2cab${getDrawioUrl(
                            {
                                isDraft,
                                selectedVersion,
                            },
                        )}`}
                        title={__('流程图')}
                        name={__('流程图')}
                        style={{
                            width: '100%',
                            height: 'calc(100% - 24px)',
                            padding: '0',
                            border: 'none',
                            visibility: 'visible',
                        }}
                    />
                    {/* 屏蔽流程图右上角文字 */}
                    <div className={styles.mask} />
                </div>
            )}
        </div>
    )
}

export default ModelFlowchart
