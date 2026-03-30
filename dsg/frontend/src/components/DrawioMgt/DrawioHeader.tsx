import React, { useEffect, useState, useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, message, Tooltip } from 'antd'
import {
    LeftOutlined,
    CheckCircleOutlined,
    LinkOutlined,
    ArrowUpOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'
import { useDebounceFn, useGetState, useLocalStorageState } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'
import {
    formatError,
    messageError,
    saveExportDrawioLog,
    TaskExecutableStatus,
    TaskType,
} from '@/core'
import FlowchartIconOutlined from '@/icons/FlowchartIconOutlined'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import FlowchartInfoManager, {
    getViewmode,
    openWindowPreviewFlow,
    operateAfterSave,
    saveFlowRequest,
} from './helper'
import EditFlowchart from '../FlowchartMgt/EditFlowchart'
import { OperateType } from '@/utils'
import GlobalMenu from '../GlobalMenu'

const DrawioHeader: React.FC<any> = ({ flowchartId }) => {
    // 流程图相关信息
    const { drawioInfo, setDrawioInfo } = useContext(DrawioInfoContext)
    const [df, setDf, getDf] = useGetState<any>()
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

    // 保存按钮显示/隐藏
    const showSave = useMemo(() => {
        // 判断任务下相关不能编辑
        if (drawioInfo?.taskId && drawioInfo?.taskType !== 'modeling') {
            return false
        }
        if (
            drawioInfo?.taskId &&
            drawioInfo?.taskExecutableStatus !== TaskExecutableStatus.EXECUTABLE
        ) {
            return false
        }
        if (flowInfosMg?.current?.read_only) {
            return false
        }
        return true
    }, [drawioInfo, flowInfosMg])

    const navigator = useNavigate()

    // load
    const [loading, setLoading] = useState(false)
    // 弹框显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 保存相关文本
    const [savingText, setSavingText] = useState('')

    // 保存类型
    const enum SaveType {
        NONE = 'none',
        SAVING = 'saving',
        SUCCESS = 'success',
        FAILED = 'failed',
    }
    const [saveType, setSaveType] = useState(SaveType.NONE)

    // 是否为根流程图
    const isRootFlow = useMemo(() => {
        return flowInfosMg?.current?.isRoot
    }, [flowInfosMg])

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
        if (drawioInfo?.currentFid) {
            await getLatestData()
        }
    }, [drawioInfo?.currentFid])

    // drawio的消息处理
    useEffect(() => {
        setEditVisible(false)
        const handleMessage = (e) => {
            try {
                if (typeof e?.data === 'string') {
                    const data = JSON.parse(e?.data)
                    const { event } = data
                    switch (event) {
                        case 'af_saving':
                            // drawio自发保存中
                            saving(SaveType.SAVING)
                            break
                        case 'af_saved':
                            // drawio自发保存完成
                            // saved()
                            break
                        case 'af_saveLoading':
                            // drawio保存请求中
                            saving(SaveType.SAVING)
                            break
                        case 'af_saveSuccess':
                            // drawio保存请求成功
                            saved(SaveType.SUCCESS)
                            break
                        case 'af_saveFailed':
                            // drawio保存请求失败
                            saved(SaveType.FAILED)
                            break
                        case 'af_flowContent':
                            // 获取drawio文件内容
                            saveFlowContent(data)
                            break
                        case 'af_justClick':
                            // drawio单纯点击
                            break
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
    }, [])

    const saveExportLog = async (export_type: string) => {
        try {
            const tempStr = window.localStorage.getItem(`${flowchartId}`)
            if (tempStr !== null) {
                const temp = JSON.parse(tempStr || '')
                if (
                    temp?.flowchartData?.current?.mid &&
                    temp?.flowchartData?.current?.fid &&
                    temp?.flowchartData?.current?.title
                ) {
                    saveExportDrawioLog(
                        temp.flowchartData.current.mid,
                        temp.flowchartData.current.fid,
                        {
                            export_type,
                            flowchart_name: temp.flowchartData.current.title,
                        },
                    )
                }
            }
        } catch (err) {
            formatError(err)
        }
    }

    // 保存中
    const saving = (type: SaveType) => {
        setLoading(true)
        setSaveType(type)
        setSavingText(__('正在保存...'))
    }

    // 保存提示
    const saved = (type: SaveType) => {
        setLoading(false)
        setSaveType(type)
        setSavingText(
            type === SaveType.SUCCESS ? __('所有更改均已保存') : __('保存失败'),
        )
        setTimeout(() => {
            setSavingText(__(''))
            setSaveType(SaveType.NONE)
        }, 3000)
    }

    // 保存流程图请求
    const saveFlowContent = async (data?) => {
        const { flag } = data
        if (['forSave', 'forUpLevel', 'forJump', 'forBack'].includes(flag)) {
            const fm = await getLatestData()
            const bo = await saveFlowRequest(
                fm?.current?.mid,
                fm?.current?.fid,
                getDf()?.taskId,
                data,
                getDf(),
                flag === 'forSave' ? 'true' : 'false',
            )
            // 保存提示
            // saved(bo ? SaveType.SUCCESS : SaveType.FAILED)
            switch (flag) {
                case 'forSave':
                    if (bo) {
                        message.success(
                            getDf()?.saved ? __('更新成功') : __('保存成功'),
                        )
                        goToUpOneLevel()
                    } else {
                        messageError(
                            getDf()?.saved ? __('更新失败') : __('保存失败'),
                        )
                    }
                    break
                case 'forUpLevel':
                    goToUpOneLevel()
                    break
                case 'forBack':
                    handleReturn()
                    break
                default:
                    break
            }
        }
    }

    // 通过drawio拿到文件内容
    const handleSaveWithDrawio = (flag) => {
        // 查看模式不做处理
        if (
            getViewmode(getDf().viewmode, flowInfosMg?.current?.read_only) ===
            '1'
        ) {
            if (flag === 'forBack') {
                handleReturn()
            }
            return
        }
        operateAfterSave(getDf(), flag)
    }

    // 保存的防抖
    const { run } = useDebounceFn(handleSaveWithDrawio, {
        wait: 2000,
        leading: true,
        trailing: false,
    })

    const isWorkOrderTask = (task_type?: string) => {
        return [TaskType.DATACOMPREHENSIONWWORKORDER].includes(
            task_type as TaskType,
        )
    }

    // 返回
    const handleReturn = () => {
        setAfFlowchartInfo({ ...afFlowchartInfo, isRecord: true })
        // 返回任务板块下
        setTimeout(() => {
            if (
                getDf()?.backUrl &&
                getDf()?.backUrl !== 'null' &&
                getDf()?.backUrl !== 'undefined'
            ) {
                navigator(
                    `/${
                        isWorkOrderTask(drawioInfo?.taskType)
                            ? 'complete-work-order-task'
                            : 'complete-task'
                    }?projectId=${getDf()?.projectId}&taskId=${
                        getDf()?.taskId
                    }&backUrl=${getDf().backUrl}&targetTab=${'process'}`,
                )
                return
            }
            // 区分业务建模视角类型
            if (getDf()?.viewType === 'domain') {
                // 业务域
                navigator(
                    `/coreBusiness/${flowInfosMg?.root?.mbsid}?domainId=${
                        getDf()?.did
                    }&departmentId=${getDf()?.departmentId}&viewType=${
                        getDf()?.viewType
                    }&targetTab=${'process'}`,
                )
            } else {
                // 业务架构
                navigator(
                    `/coreBusiness/${flowInfosMg?.root?.mbsid}?domainId=${
                        getDf()?.did
                    }&departmentId=${getDf()?.departmentId}&viewType=${
                        getDf()?.viewType
                    }&targetTab=${'process'}`,
                )
            }
        }, 0)
    }

    // 查看业务模型
    const handleLinkJump = async () => {
        run('forJump')
        const fm = await getLatestData()
        openWindowPreviewFlow({
            main_business_id: fm?.current?.mbsid,
            viewType: getDf()?.viewType,
        })
    }

    // 返回上一层流程图
    const handleUpOneLevel = () => {
        // 查看模式直接获取树数据
        if (
            getViewmode(getDf().viewmode, flowInfosMg?.current?.read_only) ===
            '1'
        ) {
            goToUpOneLevel()
            return
        }
        run('forUpLevel')
    }

    // 上一层路径处理
    const goToUpOneLevel = async () => {
        const fm = await getLatestData()
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            if (fm?.current?.path === fm?.root?.path) {
                return
            }
            const temp = JSON.parse(tempStr || '')
            const pathArr = fm?.current?.path.split('/')
            const flowPath = pathArr?.slice(0, pathArr.length - 2)
            if (flowPath) {
                fm?.onCurrentData(flowPath?.join('/'))
                setAfFlowchartInfo({
                    ...temp,
                    flowchartData: fm,
                })
                setDrawioInfo({
                    ...getDf(),
                    currentFid: flowPath[flowPath.length - 1],
                })
            }
        }
    }

    // 编辑流程图信息后更新
    const handleEditSure = async (updateInfo) => {
        const fm = await getLatestData()
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            // 更新流程图存储信息
            fm?.updateData(fm?.root?.path || '', { title: updateInfo?.name })
            setAfFlowchartInfo({
                ...temp,
                flowchartData: fm,
            })
            window.postMessage(
                JSON.stringify({
                    event: 'af_updateFlowTree',
                    id: updateInfo?.id,
                    name: updateInfo?.name,
                }),
                '*',
            )
        }
    }

    return (
        <>
            <div className={styles.drawioHeaderWrapper}>
                <div className={styles.dh_nameWrapper}>
                    <GlobalMenu />
                    <div
                        className={styles.dh_returnWrapper}
                        onClick={() => run('forBack')}
                    >
                        <LeftOutlined className={styles.dh_returnIcon} />
                        <div className={styles.dh_return}>{__('返回')}</div>
                    </div>
                    <FlowchartIconOutlined className={styles.dh_icon} />
                    {!isRootFlow && (
                        <Tooltip title={__('返回上级')} placement="bottom">
                            <ArrowUpOutlined
                                className={styles.dh_iconUp}
                                onClick={handleUpOneLevel}
                            />
                        </Tooltip>
                    )}
                    {!isRootFlow && (
                        <span className={styles.dh_omit}>... /</span>
                    )}
                    <div
                        title={flowInfosMg?.current?.title}
                        className={styles.dh_breadTitle}
                    >
                        {flowInfosMg?.current?.title}
                    </div>
                    <Tooltip title={__('详细信息')}>
                        <InfoCircleOutlined
                            hidden={!isRootFlow}
                            onClick={() => {
                                setEditVisible(true)
                            }}
                            className={styles.dh_link}
                            style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                        />
                    </Tooltip>
                    <Tooltip title={__('查看流程所属业务模型')}>
                        <LinkOutlined
                            className={styles.dh_link}
                            hidden={!flowInfosMg?.current?.is_ref}
                            onClick={handleLinkJump}
                        />
                    </Tooltip>
                    <div
                        className={styles.dh_saveTip}
                        hidden={savingText === ''}
                    >
                        <CheckCircleOutlined
                            style={{ marginRight: 4 }}
                            hidden={saveType !== SaveType.SUCCESS}
                        />
                        {savingText}
                    </div>
                </div>
                <div hidden={!showSave}>
                    {getDf()?.saved ? (
                        <Tooltip title={__('更新全部内容')}>
                            <Button
                                type="primary"
                                onClick={() => run('forSave')}
                                style={{ width: 80, height: 36 }}
                                // loading={loading}
                            >
                                {__('更新')}
                            </Button>
                        </Tooltip>
                    ) : (
                        <Tooltip title={__('保存全部内容')}>
                            <Button
                                type="primary"
                                onClick={() => run('forSave')}
                                style={{ width: 80, height: 36 }}
                                // loading={loading}
                            >
                                {__('保存')}
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>
            <EditFlowchart
                visible={editVisible}
                operate={OperateType.EDIT}
                fid={flowchartId}
                modelId={getDf()?.rootMid}
                taskId={getDf()?.taskId}
                onClose={() => setEditVisible(false)}
                onSure={(info) => handleEditSure(info)}
            />
        </>
    )
}

export default DrawioHeader
