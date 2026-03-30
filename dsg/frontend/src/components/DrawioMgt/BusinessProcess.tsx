import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button, message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGetState, useLocalStorageState } from 'ahooks'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import FlowchartInfoManager, {
    IFlowchartInfo,
    totalOperates,
    products,
    ViewType,
} from './helper'
import {
    flowchartDelete,
    flowchartsQuery,
    formatError,
    getCoreBusinessDetails,
    IFlowchartItem,
    TaskStatus,
    transformQuery,
    getDrawioUrl,
    saveExportDrawioLog,
} from '@/core'
import { TaskInfoContext } from '@/context'
import Empty from '@/ui/Empty'
import EditFlowchart from '../FlowchartMgt/EditFlowchart'
import { getActualUrl, OperateType } from '@/utils'
import dataEmpty from '../../assets/dataEmpty.svg'
import empty from '@/assets/emptyAdd.svg'
import Loader from '@/ui/Loader'
import { AddOutlined, ImportOutlined } from '@/icons'
import Confirm from '../Confirm'
import DrawioContent from './DrawioContent'
import ImportFlow from './ImportFlow'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import ModelOperate from '../BusinessModeling/ModelOperate'
import { useBusinessModelContext } from '@/components/BusinessModeling/BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IBusinessProcess {
    modelId: string
    mainbusId?: string
    // 流程图上方是否显示恢复提示，用于修改iframe高度
    showRestoreTips?: boolean
}

/**
 * 业务流程页面
 * @param modelId 业务模型id
 * @param mainbusId 业务模型id
 */
const BusinessProcess: React.FC<IBusinessProcess> = ({
    modelId,
    mainbusId,
    showRestoreTips,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const { checkPermission } = useUserPermCtx()

    // 流程图相关信息
    const { drawioInfo, setDrawioInfo } = useContext(DrawioInfoContext)
    // 流程图存储所有信息
    const [df, setDf, getDf] = useGetState<any>()
    useMemo(() => {
        setDf(drawioInfo)
    }, [drawioInfo])

    const ref = useRef<HTMLIFrameElement>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const navigate = useNavigate()
    // 路径信息
    const [searchParams] = useSearchParams()
    // 项目id
    const projectId = searchParams.get('projectId') || ''
    // 任务下返回路径
    const backUrl = searchParams.get('backUrl')
    // 业务建模查看视角
    const viewType = searchParams.get('viewType') || 'domain'

    // 流程图编辑对话框操作类型
    const [operateType, setOperateType, getOperateType] = useGetState(
        OperateType.CREATE,
    )
    // 弹框显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)
    const [delVisible, setDelVisible] = useState(false)
    const [importVisible, setImportVisible] = useState(false)

    // load显示,【true】显示,【false】隐藏
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(true)

    const [mid, setMid, getMid] = useGetState(modelId)
    // 单个操作对应流程图Item
    const [flowchartItem, setFlowchartItem] = useState<
        IFlowchartItem | undefined
    >()
    // 业务模型信息
    const [coreBusinessDetails, setCoreBusinessDetails] = useState<any>()
    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartItem?.id}`,
        { defaultValue: undefined },
    )
    // 是否是审核模式
    const {
        isButtonDisabled,
        isDraft,
        refreshDraft,
        selectedVersion,
        refreshCoreBusinessDetails,
    } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    const flowInfosMg = useMemo(() => {
        return new FlowchartInfoManager(
            afFlowchartInfo?.flowchartData?.infos || [],
            afFlowchartInfo?.flowchartData?.current,
        )
    }, [afFlowchartInfo])

    useEffect(() => {
        setFetching(false)
        setDrawioInfo({
            ...drawioInfo,
            viewmode: '1',
            iframe: ref,
            taskId: taskInfo?.taskId || '',
            taskType: taskInfo?.taskType,
            taskExecutableStatus: taskInfo?.taskExecutableStatus,
            projectId,
            viewType,
            backUrl,
            currentFid: '',
            viewKey: ViewType.FLOWPATH,
        })
        // 相关数据获取、存储
        getCoreBusiness()
        queryFlowcharts()
    }, [mainbusId, modelId, isDraft, selectedVersion])

    useEffect(() => {
        setMid(modelId)
        const tempStr = window.localStorage.getItem(`${flowchartItem?.id}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr)
            if (!temp?.isRecord) {
                setAfFlowchartInfo(undefined)
            }
        }
        return () => {
            if (tempStr !== null) {
                const temp = JSON.parse(tempStr || '')
                if (!temp?.isRecord === true) {
                    return
                }
                setAfFlowchartInfo(undefined)
            }
        }
    }, [])

    useEffect(() => {
        const handleMessage = (e) => {
            try {
                if (typeof e?.data === 'string' && flowchartItem) {
                    const data = JSON.parse(e?.data)
                    const { event } = data
                    switch (event) {
                        case 'exportSVGSuccess':
                            // 导出SVG成功
                            saveExportLog('svg')
                            message.success(__('导出SVG成功'))
                            break
                        case 'exportPNGSuccess':
                            // 导出PNG成功
                            saveExportLog('png')
                            message.success(__('导出PNG成功'))
                            break
                        case 'exportJPEGSuccess':
                            // 导出JPEG成功
                            saveExportLog('jpeg')
                            message.success(__('导出JPEG成功'))
                            break
                        default:
                            break
                    }
                }
            } catch (error) {
                // console.log('DrawioHeader-error ', error)
            }
        }
        window.addEventListener('message', handleMessage, false)

        return () => {
            window.removeEventListener('message', handleMessage, false)
        }
    }, [flowchartItem])

    /**
     * 保存导出日志
     * @param export_type
     */
    const saveExportLog = async (export_type: string) => {
        if (flowchartItem?.id && flowchartItem?.name) {
            saveExportDrawioLog(modelId, flowchartItem.id || '', {
                export_type,
                flowchart_name: flowchartItem.name,
            })
        }
    }

    // 获取最新数据
    const getLatestData = () => {
        const tempStr = window.localStorage.getItem(`${flowchartItem?.id}`)
        if (tempStr !== null) {
            setAfFlowchartInfo(JSON.parse(tempStr || ''))
            return JSON.parse(tempStr || '')
        }
        return ''
    }

    // 获取业务模型详情
    const getCoreBusiness = async () => {
        if (!mainbusId) return
        const res = await getCoreBusinessDetails(mainbusId)
        setCoreBusinessDetails(res)
        // 记录业务模型相关信息
        setDrawioInfo({
            ...getDf(),
            // 部门id
            departmentId: res?.department_id,
            // 部门名称
            departmentName: res?.department_name,
            // 部门类型
            departmentType: res?.type,
            // 业务域id
            did: res?.subject_domain_id,
            // 根业务模型id
            rootMid: res?.business_model_id,
        })
    }

    // 查询业务模型的流程图列表
    const queryFlowcharts = async (jump: boolean = false) => {
        if (!modelId) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const res = await flowchartsQuery(modelId, {
                offset: 1,
                limit: 12,
                ...versionParams,
            })
            if (res.entries.length > 0) {
                const flowchart = res.entries[0]
                // 需要跳转进入编辑模式
                if (jump) {
                    handlejump(flowchart)
                    return
                }
                setFlowchartItem(flowchart)
                // drawio信息
                setDrawioInfo({
                    ...getDf(),
                    currentFid: flowchart.id,
                    saved: flowchart.saved,
                })
            } else {
                setFlowchartItem(undefined)
            }
        } catch (e) {
            setFlowchartItem(undefined)
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 创建后跳转编辑模式
    const handlejump = (data) => {
        const flowInfo: IFlowchartInfo = {
            mid: modelId,
            fid: data.id,
            title: data.name,
            isRoot: true,
            is_ref: false,
            mbsid: mainbusId || '',
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
        navigate(
            `/drawio${getUrlQuery(data)}&viewmode=0&isCreate=true${getDrawioUrl(
                {
                    isDraft,
                    selectedVersion,
                },
            )}`,
        )
    }

    // 向存储里添加流程图信息
    const addFlowchartDataToLocalStorage = (data) => {
        const flowInfo: IFlowchartInfo = {
            mid: modelId,
            fid: data.id,
            title: data.name,
            isRoot: true,
            is_ref: false,
            mbsid: mainbusId || '',
            read_only: false,
            path: data.id,
            absolutePath: data.id,
        }
        const fm = new FlowchartInfoManager([flowInfo], flowInfo)
        setAfFlowchartInfo({ flowchartData: fm })
    }

    // 根据流程图更新存储相关信息
    useMemo(() => {
        if (flowchartItem) {
            addFlowchartDataToLocalStorage(flowchartItem)
        } else {
            setAfFlowchartInfo(undefined)
        }
    }, [flowchartItem])

    // 新建、编辑、导入流程图成功
    const handleEditSure = async (info?) => {
        setEditVisible(false)
        setImportVisible(false)
        // 编辑下更新信息
        if (operateType === OperateType.EDIT) {
            const tempStr = window.localStorage.getItem(`${flowchartItem?.id}`)
            if (tempStr !== null) {
                const temp = JSON.parse(tempStr || '')
                setAfFlowchartInfo(temp)
                const fm = new FlowchartInfoManager(
                    temp?.flowchartData?.infos || [],
                    temp?.flowchartData?.current,
                )
                // 更新流程图存储信息
                fm?.updateData(fm?.root?.path || '', { title: info?.name })
                setAfFlowchartInfo({
                    ...temp,
                    flowchartData: fm,
                })
                window.postMessage(
                    JSON.stringify({
                        event: 'af_updateFlowTree',
                        id: info?.id,
                        name: info?.name,
                    }),
                    '*',
                )
            }
        } else {
            const res = await getCoreBusinessDetails(modelId)
            // 草稿状态发生变化，刷新草稿，通过监听isDraft的变化触发getList
            if (res.has_draft !== undefined && res.has_draft !== isDraft) {
                refreshDraft?.(res.has_draft)
            } else {
                // 刷新数据
                queryFlowcharts(true)
            }
            refreshCoreBusinessDetails?.(res)
        }
    }

    // 删除流程图请求处理
    const handleDelete = async () => {
        setDelVisible(false)
        try {
            setFetching(true)
            if (!flowchartItem) return
            await flowchartDelete(modelId, flowchartItem.id!, taskInfo.taskId)
            message.success(__('删除成功'))
            setAfFlowchartInfo(undefined)
            setFlowchartItem(undefined)
            setDrawioInfo({
                ...drawioInfo,
                iframe: ref,
            })
        } catch (e) {
            formatError(e)
        } finally {
            setFetching(false)
        }
    }

    // 菜单栏相关操作
    const onOperate = (op) => {
        setOperateType(op)
        switch (op) {
            // 创建流程图
            case OperateType.CREATE:
                setEditVisible(true)
                break
            // 编辑流程图
            case OperateType.EDIT:
                setEditVisible(true)
                break
            // 删除流程图
            case OperateType.DELETE:
                setDelVisible(true)
                break
            // 导入流程图
            case OperateType.IMPORT:
                setImportVisible(true)
                break
            // 进入编辑模式
            case OperateType.PREVIEW: {
                const temp = getLatestData()
                if (getDf().viewKey !== ViewType.PROCESSNAV) {
                    const { root } = getLatestData().flowchartData
                    const fm = new FlowchartInfoManager([root], root)
                    window.localStorage.setItem(
                        `${root.fid}`,
                        JSON.stringify({
                            flowchartData: fm,
                        }),
                    )
                } else {
                    setAfFlowchartInfo({ ...temp, isRecord: true })
                }
                navigate(
                    `/drawio${getUrlQuery(
                        flowchartItem!,
                    )}&viewmode=0${getDrawioUrl({
                        isDraft,
                        selectedVersion,
                    })}`,
                )
                break
            }
            default:
                break
        }
    }

    // 进入画布url拼接
    const getUrlQuery = (item: IFlowchartItem) => {
        let url = `?viewType=${viewType}&rootFlowId=${item?.id}&saved=${item?.saved}`
        if (taskInfo?.taskId) {
            url += `&backUrl=${backUrl}&projectId=${projectId}&taskId=${taskInfo.taskId}&taskType=${taskInfo?.taskType}&taskStatus=${taskInfo?.taskStatus}&taskExecutableStatus=${taskInfo?.taskExecutableStatus}`
        }
        return url
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

    // 空白显示
    const showEmpty = ({ disabled }: { disabled: boolean }) => {
        const desc =
            !checkTask(OperateType.CREATE) ||
            !checkPermission('manageBusinessModelAndBusinessDiagnosis') ||
            !modelId ? (
                <span>{__('暂无业务流程')}</span>
            ) : (
                <div>
                    <div>{__('点击 【新建】按钮或【导入】按钮')}</div>
                    <div>{__('可新建或导入流程图')}</div>
                    <Button
                        style={{ marginTop: 16 }}
                        type="primary"
                        onClick={() => onOperate(OperateType.CREATE)}
                        disabled={disabled}
                        title={disabled ? __('审核中，无法操作') : ''}
                    >
                        <AddOutlined />
                        {__('新建')}
                    </Button>
                    <Button
                        style={{ marginTop: 16, marginLeft: 12 }}
                        onClick={() => onOperate(OperateType.IMPORT)}
                        disabled={disabled}
                        title={disabled ? __('审核中，无法操作') : ''}
                    >
                        <ImportOutlined />
                        {__('导入')}
                    </Button>
                </div>
            )
        const icon =
            !checkTask(OperateType.CREATE) ||
            !checkPermission('manageBusinessModelAndBusinessDiagnosis')
                ? dataEmpty
                : empty
        return <Empty desc={desc} iconSrc={icon} />
    }

    return (
        <div
            className={classnames(
                styles.businessProcessWrapper,
                styles.tabContentWrapper,
                flowchartItem
                    ? styles.businProcessShadow
                    : styles.businProcessHasNoData,
            )}
        >
            {loading ? (
                <div className={styles.bp_empty}>
                    <Loader />
                </div>
            ) : flowchartItem ? (
                <div>
                    <DrawioContent
                        mode="preview"
                        flowchartId={flowchartItem?.id}
                        onFlowOperate={(op) => onOperate(op)}
                        showRestoreTips={showRestoreTips}
                    />
                </div>
            ) : (
                <>
                    <div className={styles.tabContentTitle}>
                        {__('流程图')}
                        {taskInfo.taskId &&
                            taskInfo.taskStatus !== TaskStatus.COMPLETED && (
                                <ModelOperate modelId={modelId} />
                            )}
                    </div>
                    <div className={styles.tabContent}>
                        <div className={styles.bp_empty}>
                            {showEmpty({ disabled: !!isButtonDisabled })}
                        </div>
                    </div>
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
                </>
            )}
            <EditFlowchart
                visible={editVisible}
                operate={operateType}
                fid={flowchartItem?.id}
                modelId={modelId}
                defaultName={coreBusinessDetails?.name}
                onClose={() => setEditVisible(false)}
                onSure={(info) => handleEditSure(info)}
            />
            <Confirm
                open={delVisible}
                title={__('确认要删除业务流程吗？')}
                content={__('业务流程删除后将无法找回，请谨慎操作！')}
                onOk={() => handleDelete()}
                onCancel={() => setDelVisible(false)}
                okButtonProps={{ loading: fetching }}
                width={432}
            />
            <ImportFlow
                visible={importVisible}
                mid={modelId}
                taskId={taskInfo?.taskId}
                onClose={() => setImportVisible(false)}
                onSure={() => handleEditSure()}
                iframeRef={iframeRef}
            />
        </div>
    )
}

export default BusinessProcess
