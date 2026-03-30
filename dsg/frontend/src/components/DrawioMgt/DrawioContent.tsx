import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useGetState, useLocalStorageState } from 'ahooks'
import { Button } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import CellInfos from './CellInfos'
import FlowchartInfoManager, {
    CellInfosType,
    changeToDrawioUrl,
    FlowchartTreeNodeType,
    products,
    totalOperates,
    updateFormCount,
} from './helper'
import {
    formatError,
    getCoreBusinessDetails,
    getFormsFieldsList,
    transformQuery,
} from '@/core'
import DrawioTree from './DrawioTree'
import DragBox from '../DragBox'
import FlowchartIconOutlined from '@/icons/FlowchartIconOutlined'
import FieldTableView from '../FormGraph/FieldTableView'

import Loader from '@/ui/Loader'
import { OperateType } from '@/utils'
import { TaskInfoContext } from '@/context'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useBusinessModelContext } from '@/components/BusinessModeling/BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IDrawioContent {
    mode: 'preview' | 'edit'
    flowchartId?: string
    onFlowOperate?: (op) => void
    // 流程图上方是否显示恢复提示，用于修改iframe高度
    showRestoreTips?: boolean
}

/**
 * 流程图内容区
 * @param mode 流程图模式
 * @parama flowchartId 根流程图id
 * @param mainbusId 业务模型id
 */
const DrawioContent: React.FC<IDrawioContent> = ({
    mode,
    flowchartId,
    onFlowOperate,
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
    const [userId] = useCurrentUser('ID')

    useMemo(() => {
        setDf(drawioInfo)
    }, [drawioInfo])
    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartId}`,
    )
    const flowInfosMg = useMemo(() => {
        return new FlowchartInfoManager(
            afFlowchartInfo?.flowchartData?.infos || [],
            afFlowchartInfo?.flowchartData?.current,
        )
    }, [afFlowchartInfo])

    // iframe
    const ref = useRef<HTMLIFrameElement>(null)
    // drawio的url
    const [src, setSrc] = useState<string>()

    // 左分区默认大小
    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])

    // 弹窗显示/隐藏
    const [infosVisible, setInfosVisible] = useState(false)
    const [preFormVisible, setPreFormVisible] = useState(false)

    // 字段数据集
    const [fields, setFields] = useState<any[]>([])
    // 操作的表单
    const [formItem, setFormItem, getFormItem] = useGetState<any>()

    const [loading, setLoading, getLoading] = useGetState(true)
    // 是否是审核模式
    const { isButtonDisabled, isDraft, selectedVersion } =
        useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    // 获取最新数据
    const getLatestData = () => {
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            setAfFlowchartInfo(temp)
            return new FlowchartInfoManager(
                temp?.flowchartData?.infos || [],
                temp?.flowchartData?.current,
            )
        }
        return undefined
    }

    useMemo(async () => {
        // 流程图切换关闭弹窗
        if (infosVisible) {
            setInfosVisible(false)
        }
        if (drawioInfo?.currentFid) {
            const fm = await getLatestData()
            // 更新src
            if (fm?.current) {
                const { read_only, mid, fid, title } = fm.current
                setLoading(true)
                setSrc(
                    changeToDrawioUrl(
                        drawioInfo.viewmode,
                        read_only,
                        mid,
                        fid,
                        title,
                        drawioInfo?.taskId,
                        userId,
                        isDraft,
                        selectedVersion,
                    ),
                )
            }
        }
    }, [drawioInfo?.currentFid])

    useEffect(() => {
        // 相关数据获取、存储
        setFields([])
        const fm = getLatestData()

        // 更新src
        if (fm?.current) {
            const { read_only, mid, fid, title } = fm.current
            setSrc(
                changeToDrawioUrl(
                    drawioInfo.viewmode,
                    read_only,
                    mid,
                    fid,
                    title,
                    drawioInfo?.taskId,
                    userId,
                    isDraft,
                    selectedVersion,
                ),
            )
            setDrawioInfo({
                ...drawioInfo,
                iframe: ref,
            })
        }
        getCoreBusiness()
    }, [drawioInfo?.rootFlowId])

    useEffect(() => {
        // drawio的消息处理
        const handleMessage = (e) => {
            try {
                if (typeof e?.data === 'string') {
                    const data = JSON.parse(e?.data)
                    const { event } = data
                    switch (event) {
                        case 'af_showInfoSider':
                            // 展示侧边栏
                            showInfoSider(data)
                            break
                        case 'af_hideInfoSider':
                            // 隐藏侧边栏
                            setInfosVisible(false)
                            break
                        case 'af_shouldUpdateForm':
                            setLoading(false)
                            // 更新表单数量
                            shouldUpdateForm()
                            break
                        case 'af_updateFlowTree':
                            getLatestData()
                            break
                        default:
                            break
                    }
                }
            } catch (error) {
                // console.log('index-error ', error)
            }
        }

        window.addEventListener('message', handleMessage, false)
        return () => {
            window.removeEventListener('message', handleMessage, false)
        }
    }, [])

    // 获取业务模型详情
    const getCoreBusiness = async () => {
        if (!flowInfosMg?.current?.mbsid) return
        const res = await getCoreBusinessDetails(
            flowInfosMg.current.mbsid,
            versionParams,
        )
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

    // 获取表单字段信息
    const queryFormFields = async (item?) => {
        try {
            const res = await getFormsFieldsList(item?.id, {
                limit: 0,
                ...versionParams,
            })
            setFields(res.entries)
        } catch (error) {
            setFields([])
            formatError(error)
        }
    }

    // 侧边栏显示/收起
    const showInfoSider = (data) => {
        // 默认收起
        setInfosVisible(false)
        const { cellInfos } = data
        // 子流程,普通节点,流程信息显示侧边栏
        const fm = getLatestData()
        if (
            cellInfos.absolutePath &&
            !cellInfos.absolutePath.includes(fm?.current?.absolutePath)
        ) {
            return
        }
        if (
            cellInfos?.shape === CellInfosType.NORMAL ||
            cellInfos?.shape === CellInfosType.PROCESS ||
            cellInfos?.shape === CellInfosType.TOTAL
        ) {
            setDrawioInfo({
                ...getDf(),
                cellInfos,
            })
            setInfosVisible(true)
        }
    }

    // 侧边栏关闭处理
    const handleSiderClose = () => {
        setInfosVisible(false)
        // 通知drawio调整侧边栏显示状态
        ref.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'dio_hideInfoSider' }),
            '*',
        )
    }

    // 需要更新表单数量
    const shouldUpdateForm = () => {
        const fm = getLatestData()
        updateFormCount({
            df: getDf(),
            fid: fm?.current?.fid || '',
            ...versionParams,
        })
    }

    // 获取iframe高度
    const getIframeHeight = () => {
        if (mode === 'preview') {
            if (getLoading()) {
                return 0
            }
            return showRestoreTips
                ? 'calc(100vh - 175px)'
                : 'calc(100vh - 125px)'
        }
        return '100%'
    }

    // 选中节点处理
    const handleSelectedNode = (sn) => {
        // 表单详情
        if (sn.catalog_type === FlowchartTreeNodeType.FORM) {
            setFormItem(sn)
            queryFormFields(sn)
            setPreFormVisible(true)
        }
    }

    return (
        <div className={styles.drawioContentWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[265, 500]}
                maxSize={[600, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
                gutterStyles={{
                    background: '#FFF',
                    width: '4px',
                    cursor: 'ew-resize',
                    position: 'relative',
                    top: '6px',
                }}
                gutterSize={4}
            >
                <DrawioTree
                    hi="calc(100vh - 52px)"
                    flowchartId={flowchartId}
                    mode={mode}
                    onOperate={(op) => onFlowOperate?.(op)}
                    getSelectedData={(sn) => handleSelectedNode(sn)}
                />
                <div
                    id="bp_rightWrapper"
                    className={styles.dc_rightWrapper}
                    style={{
                        height:
                            mode === 'preview' ? '100%' : 'calc(100vh - 52px)',
                        margin:
                            mode === 'preview'
                                ? '0 -24px 0 -4px'
                                : '0 -24px 0 -20px',
                    }}
                >
                    <div
                        className={styles.dc_headerWrapper}
                        hidden={mode === 'edit'}
                    >
                        <div className={styles.dc_headerTitle}>
                            <FlowchartIconOutlined className={styles.dc_icon} />
                            <div
                                title={flowInfosMg?.current?.title}
                                className={styles.dc_title}
                            >
                                {flowInfosMg?.current?.title}
                            </div>
                        </div>
                        <Button
                            type={taskInfo?.name ? 'default' : 'primary'}
                            onClick={() => onFlowOperate?.(OperateType.PREVIEW)}
                            disabled={isButtonDisabled}
                            hidden={
                                getDf()?.viewmode !== '1' ||
                                !checkTask(OperateType.EDIT) ||
                                !checkPermission(
                                    'manageBusinessModelAndBusinessDiagnosis',
                                )
                            }
                            title={
                                isButtonDisabled ? __('审核中，无法操作') : ''
                            }
                        >
                            {__('编辑')}
                        </Button>
                    </div>
                    {getLoading() && (
                        <div
                            style={{
                                width: '100%',
                                height:
                                    mode === 'preview'
                                        ? 'calc(100vh - 242px)'
                                        : '100%',
                            }}
                        >
                            <Loader />
                        </div>
                    )}
                    <iframe
                        id={mode}
                        ref={ref}
                        src={src}
                        title="流程图"
                        name="流程图"
                        style={{
                            width: '100%',
                            height: getIframeHeight(),
                            padding: mode === 'preview' ? '0' : '0 0 0 20px',
                            border: 'none',
                            visibility: getLoading() ? 'hidden' : 'visible',
                        }}
                    />
                </div>
            </DragBox>
            <CellInfos
                mode={mode}
                flowchartId={flowchartId || ''}
                pMbid={flowInfosMg?.current?.mbsid || ''}
                open={infosVisible}
                onClose={handleSiderClose}
            />
            <FieldTableView
                visible={preFormVisible}
                formId={formItem?.id}
                items={fields}
                isDrawio
                model="view"
                onClose={() => {
                    setPreFormVisible(false)
                    setFields([])
                }}
            />
        </div>
    )
}

export default DrawioContent
