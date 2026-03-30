import { Button, message, Space, Tabs, Tooltip } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import {
    editProcessModelInfo,
    execDataProcess,
    formatError,
    getDataBaseDetails,
    getProcessModelDetail,
    IFormEnumConfigModel,
    saveProcessData,
    TaskExecutableStatus,
    updateProcessModel,
    updateProcessModelDetail,
} from '@/core'
import { InfotipOutlined } from '@/icons'
import PageDrawer from '@/ui/PageDrawer'
import { confirm } from '@/utils/modalHelper'
import LogsList from '../DataDevelopmentWorkflow/LogsList'
import { ModelType, tabsKey } from '../DataSynchronization/const'
import DataProcessModel from './DataProcessModel'
import HeaderEditModal from './HeaderEditModal'
import PublishSuccess from './PublishSuccess'
import { dataProcessModelTabs } from './helper'
import __ from './locale'
import styles from './styles.module.less'

import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { enBeginNameRegNew } from '@/utils'
import ProcessLogic from './ProcessLogic'
import { PublishStatus } from './const'

interface IDataProcessPage {
    open: boolean
    onClose: () => void
    modelInfo: any
    taskId: string
    taskStatus: TaskExecutableStatus
    configEnum?: IFormEnumConfigModel
}

const DataProcessPage: FC<IDataProcessPage> = ({
    open,
    onClose,
    modelInfo,
    taskId,
    taskStatus,
    configEnum,
}) => {
    // 编辑信息弹窗
    const [editInfoStatus, setEditInfoStatus] = useState<boolean>(false)
    // 编辑信息弹窗位置
    const [editModelLeft, setEditModelLeft] = useState<number>(100)
    // 当前模型的基础信息
    const [basicData, setBasicData] = useState<any>(modelInfo)

    // 当前模型是否发布
    const [modelPublishStatus, setModelPushlishStatus] =
        useState<PublishStatus>(PublishStatus.CreateModel)

    const [modelId, setModelId] = useState<string>(modelInfo?.id || '')
    const [modelType, SetModelType] = useState<ModelType>(ModelType.CREATE)

    // 成功状态
    const [successStatus, setSuccessStatus] = useState<boolean>(false)

    // 重置model的id
    const [resetModelId, setResetModelId] = useState<string>('')

    // 画布ref
    const modelRef: any = useRef()
    // 编辑器ref
    const editorRef: any = useRef()

    const [activeTab, setActiveTab] = useState<tabsKey>(tabsKey.MODEL)

    const [modelDetail, setModeDetail] = useState<any>(null)

    const [tableListModelForm, setTableListModelForm] = useState<any>(null)

    const [modeInfoDetail, setModelInfoDetail] = useState<any>(null)

    const [allProcessModelTabs, setAllProcessModelTabs] =
        useState<Array<any>>(dataProcessModelTabs)

    const [lastEditorStatus, setLastEditorStatus] = useState<any>(null)

    const [execStatus, setExecStatus] = useState<boolean>(true)

    useEffect(() => {
        setBasicData(modelInfo)
        setResetModelId('')
        setLastEditorStatus(null)
        setActiveTab(tabsKey.MODEL)
        if (modelInfo?.id) {
            setModelPushlishStatus(PublishStatus.AllPublish)
            setModelId(modelInfo.id)
            initModelDetailInfo(modelInfo.id)
        } else {
            setModelPushlishStatus(PublishStatus.CreateModel)
            setModelId('')
            setModelInfoDetail(null)
        }
    }, [modelInfo])

    useEffect(() => {
        switch (modelPublishStatus) {
            case PublishStatus.CreateModel:
                setAllProcessModelTabs(
                    dataProcessModelTabs.map((currentTab) => {
                        if (currentTab.key === tabsKey.LOGS) {
                            return {
                                ...currentTab,
                                disabled: true,
                            }
                        }
                        return currentTab
                    }),
                )
                break
            case PublishStatus.ModePublish:
                setAllProcessModelTabs(
                    dataProcessModelTabs.map((currentTab) => {
                        if (currentTab.key === tabsKey.LOGS) {
                            return {
                                ...currentTab,
                                disabled: true,
                            }
                        }
                        return currentTab
                    }),
                )
                break
            default:
                setAllProcessModelTabs(dataProcessModelTabs)
                break
        }
    }, [modelPublishStatus])

    const initModelDetailInfo = async (id: string) => {
        try {
            const details = await getProcessModelDetail(id)
            setModelInfoDetail(details)
        } catch (ex) {
            formatError(ex)
        }
    }

    /**
     * 检查重复
     */
    const checkRepeat = (fieldsData: Array<any>, indexId, value) => {
        const repeatData = fieldsData.find(
            (currentField, index) =>
                index !== indexId && currentField.name === value,
        )
        return !!repeatData
    }
    /**
     * 字段校验
     */

    const checkFieldsStatus = (fileds: Array<any>) => {
        const errorFields = fileds.filter((field, index) => {
            if (!enBeginNameRegNew.test(field.name)) {
                return true
            }
            if (checkRepeat(fileds, index, field.name)) {
                return true
            }
            return false
        })
        return !errorFields.length
    }

    /**
     * 发布模型
     * @returns
     */
    const handleFinish = async (isExit: boolean = false) => {
        try {
            if (
                activeTab === tabsKey.MODEL &&
                modelPublishStatus !== PublishStatus.AllPublish
            ) {
                const fieldsData = modelRef.current?.getData()
                if (!fieldsData.fid) {
                    message.error(__('请先配置业务表信息'))
                    return
                }
                if (!fieldsData.target?.name) {
                    message.error(__('请先配置目标数据表信息'))
                    modelRef.current?.setTargetFormError()
                    return
                }
                if (!fieldsData.target?.fields?.length) {
                    message.error(__('请至少设置一个目标表字段'))
                    return
                }
                if (!checkFieldsStatus(fieldsData.target.fields)) {
                    message.error(__('请先修改目标数据表字段信息'))
                    return
                }
                if (!modeInfoDetail?.insert_sql) {
                    message.error(__('还未编写加工逻辑'))
                    changeTabModel()
                    setActiveTab(tabsKey.PROCESSLOGIC)
                    return
                }
                if (resetModelId) {
                    const [resData] = await updateProcessModel(resetModelId, {
                        ...modeInfoDetail,
                        ...fieldsData,
                        task_id: taskId,
                    })
                    setModelId(resData.id)
                    setResetModelId('')
                } else {
                    const [resData] = await saveProcessData({
                        ...modeInfoDetail,
                        ...fieldsData,
                        ...basicData,
                        task_id: taskId,
                    })
                    setModelId(resData.id)
                }
                if (isExit) {
                    message.success('发布成功')
                } else {
                    setSuccessStatus(true)
                    setModelPushlishStatus(PublishStatus.AllPublish)
                }
            } else if (
                activeTab === tabsKey.PROCESSLOGIC &&
                modelPublishStatus !== PublishStatus.AllPublish
            ) {
                const fieldsData = editorRef.current?.getData()
                if (!modeInfoDetail.fid) {
                    message.error(__('请先配置业务表信息'))
                    setModelInfoDetail({
                        ...modeInfoDetail,
                        ...fieldsData,
                    })
                    setActiveTab(tabsKey.MODEL)
                    return
                }
                if (!modeInfoDetail.target?.name) {
                    message.error(__('请先配置目标数据表信息'))
                    setActiveTab(tabsKey.MODEL)
                    setModelInfoDetail({
                        ...modeInfoDetail,
                        ...fieldsData,
                    })
                    return
                }

                if (!modeInfoDetail.target?.fields?.length) {
                    message.error(__('请至少设置一个目标表字段'))
                    setModelInfoDetail({
                        ...modeInfoDetail,
                        ...fieldsData,
                    })
                    setActiveTab(tabsKey.MODEL)
                    return
                }
                if (!checkFieldsStatus(modeInfoDetail.target.fields)) {
                    message.error(__('请先修改目标数据表字段信息'))
                    setModelInfoDetail({
                        ...modeInfoDetail,
                        ...fieldsData,
                    })
                    setActiveTab(tabsKey.MODEL)
                    return
                }
                if (!fieldsData?.insert_sql) {
                    message.error(__('还未编写加工逻辑'))
                    return
                }
                setModelInfoDetail({
                    ...modeInfoDetail,
                    ...fieldsData,
                })
                if (fieldsData) {
                    if (resetModelId) {
                        const [resData] = await updateProcessModel(
                            resetModelId,
                            {
                                ...modeInfoDetail,
                                ...fieldsData,
                                task_id: taskId,
                            },
                        )
                        setModelId(resData.id)
                        setResetModelId('')
                    } else {
                        const [resData] = await saveProcessData({
                            ...modeInfoDetail,
                            ...fieldsData,
                            ...basicData,
                            task_id: taskId,
                        })
                        setModelId(resData.id)
                    }
                    if (isExit) {
                        message.success('发布成功')
                        onClose()
                    } else {
                        setSuccessStatus(true)
                        setModelPushlishStatus(PublishStatus.AllPublish)
                    }
                }
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    const updateLogicProcess = async (isExit: boolean = false) => {
        try {
            const fieldsData = editorRef.current?.getData()
            await updateProcessModelDetail(modelId, {
                ...fieldsData,
                task_id: taskId,
            })
            message.success('更新成功')
            if (isExit) {
                onClose()
            } else if (modelPublishStatus === PublishStatus.HasUpdateLogic) {
                setModelPushlishStatus(PublishStatus.AllPublish)
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    const changeTabModel = async () => {
        try {
            const fieldsData = modelRef.current?.getData()
            setModeDetail(fieldsData)
            if (fieldsData?.target?.datasource_id) {
                const dataSourceDetailInfo = await getDataBaseDetails(
                    fieldsData.target.datasource_id,
                )

                setTableListModelForm({
                    datasource_name: dataSourceDetailInfo.name,
                    info_system: dataSourceDetailInfo?.info_system_name,
                    datasource_id: fieldsData?.target?.datasource_id || '',
                    datasource_type: dataSourceDetailInfo.type,
                    table_name: fieldsData.target.name,
                    catalog_name: fieldsData.target.catalog_name,
                    schema: fieldsData.target.schema,
                    fields: fieldsData.target.fields.map(
                        (currentField) => currentField.name,
                    ),
                })
            }
            setModelInfoDetail({
                ...fieldsData,
                table_list: modeInfoDetail?.table_list || [],
                insert_sql: modeInfoDetail?.insert_sql || '',
            })
            setActiveTab(tabsKey.PROCESSLOGIC)
            setModelPushlishStatus(PublishStatus.ModePublish)
        } catch (ex) {
            formatError(ex)
        }
    }

    const getContentComponent = () => {
        switch (activeTab) {
            case tabsKey.MODEL:
                return (
                    <DataProcessModel
                        modelId={modelId}
                        model={modelType}
                        ref={modelRef}
                        taskId={taskId}
                        details={modeInfoDetail}
                        allDataTypes={configEnum?.data_type || []}
                    />
                )
            case tabsKey.PROCESSLOGIC:
                return (
                    <ProcessLogic
                        taskid={taskId}
                        modelFormInfo={tableListModelForm}
                        ref={editorRef}
                        details={modeInfoDetail}
                        lastStatus={lastEditorStatus}
                        onDataChange={() => {
                            if (
                                modelPublishStatus === PublishStatus.AllPublish
                            ) {
                                setModelPushlishStatus(
                                    PublishStatus.HasUpdateLogic,
                                )
                            }
                        }}
                        taskStatus={taskStatus}
                    />
                )
            case tabsKey.LOGS:
                return (
                    <div className={styles.dyncLogsContent}>
                        <LogsList
                            pageType="whole"
                            model="proc"
                            id={modelId}
                            hi={234}
                            isNeedUpdate={execStatus}
                        />
                    </div>
                )
            default:
                return null
        }
    }

    const editProcessDataInfo = async (id, values) => {
        try {
            await editProcessModelInfo(id, {
                task_id: taskId,
                ...values,
            })
            message.success(__('编辑成功'))
        } catch (ex) {
            formatError(ex)
        }
    }

    const getGroupBtn = (status: PublishStatus) => {
        switch (status) {
            case PublishStatus.CreateModel:
                return (
                    <Button
                        type="primary"
                        style={{
                            width: 80,
                        }}
                        onClick={() => {
                            handleFinish()
                        }}
                    >
                        {__('发布')}
                    </Button>
                )
            case PublishStatus.ModePublish:
                if (activeTab === tabsKey.MODEL) {
                    return (
                        <Space>
                            <Button
                                type="primary"
                                style={{
                                    width: 80,
                                }}
                                onClick={() => {
                                    handleFinish()
                                }}
                            >
                                {__('发布')}
                            </Button>
                        </Space>
                    )
                }
                return (
                    <Space>
                        <Button
                            type="primary"
                            style={{
                                width: 80,
                            }}
                            onClick={() => {
                                handleFinish()
                            }}
                        >
                            {__('发布')}
                        </Button>
                    </Space>
                )
            case PublishStatus.HasUpdateLogic:
            case PublishStatus.AllPublish:
                if (activeTab === tabsKey.MODEL) {
                    return (
                        <Space>
                            {taskStatus ===
                            TaskExecutableStatus.COMPLETED ? null : (
                                <Button
                                    type="default"
                                    style={{
                                        minWidth: 80,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                    onClick={() => {
                                        confirm({
                                            width: 432,
                                            title: (
                                                <span
                                                    style={{
                                                        color: '#000',
                                                        fontWeight: '550',
                                                    }}
                                                >
                                                    {__(
                                                        '确认要重置数据加工吗？',
                                                    )}
                                                </span>
                                            ),
                                            icon: (
                                                <ExclamationCircleFilled
                                                    style={{ color: '#FAAD14' }}
                                                />
                                            ),
                                            content: __(
                                                '重置后您需重新配置目标数据表，且需要手动清除已加工的数据，请谨慎操作！',
                                            ),
                                            okText: __('确定'),
                                            cancelText: __('取消'),
                                            onOk: () => {
                                                setModelPushlishStatus(
                                                    PublishStatus.CreateModel,
                                                )
                                                setModelInfoDetail(null)
                                                setResetModelId(modelId)
                                                setModelId('')
                                            },
                                        })
                                    }}
                                >
                                    {__('重置')}
                                </Button>
                            )}
                            <Button
                                type="primary"
                                style={{
                                    minWidth: 80,
                                }}
                                loading={!execStatus}
                                onClick={async () => {
                                    try {
                                        setExecStatus(false)
                                        await execDataProcess(modelId)
                                        setActiveTab(tabsKey.LOGS)
                                        message.success(__('立即执行成功'))
                                        setExecStatus(true)
                                    } catch (ex) {
                                        formatError(ex)
                                    }
                                }}
                            >
                                {__('立即执行')}
                            </Button>
                        </Space>
                    )
                }
                if (activeTab === tabsKey.PROCESSLOGIC) {
                    return (
                        <Space>
                            {taskStatus ===
                            TaskExecutableStatus.COMPLETED ? null : (
                                <Button
                                    type="default"
                                    style={{
                                        width: 80,
                                    }}
                                    onClick={() => {
                                        updateLogicProcess()
                                    }}
                                >
                                    {__('更新')}
                                </Button>
                            )}

                            <Button
                                type="primary"
                                style={{
                                    minWidth: 80,
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                                loading={!execStatus}
                                disabled={!execStatus}
                                onClick={async () => {
                                    try {
                                        const fieldsData =
                                            editorRef.current?.getData()
                                        const lastData =
                                            editorRef.current?.getCurrentPageData() ||
                                            null
                                        setExecStatus(false)
                                        setLastEditorStatus(lastData)

                                        setModelInfoDetail({
                                            ...modeInfoDetail,
                                            ...fieldsData,
                                        })
                                        await execDataProcess(modelId)
                                        setActiveTab(tabsKey.LOGS)
                                        message.success(__('立即执行成功'))
                                        setExecStatus(true)
                                    } catch (ex) {
                                        formatError(ex)
                                    }
                                }}
                            >
                                {__('立即执行')}
                            </Button>
                        </Space>
                    )
                }
                return (
                    <Button
                        type="primary"
                        style={{
                            minWidth: 80,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                        loading={!execStatus}
                        onClick={async () => {
                            try {
                                setExecStatus(false)
                                await execDataProcess(modelId)
                                message.success(__('立即执行成功'))
                                setExecStatus(true)
                            } catch (ex) {
                                formatError(ex)
                            }
                        }}
                    >
                        {__('立即执行')}
                    </Button>
                )

            default:
                return <div />
        }
    }
    return (
        <PageDrawer
            open={open}
            onClose={() => {
                if (modelPublishStatus === PublishStatus.AllPublish) {
                    onClose()
                } else {
                    ReturnConfirmModal({
                        onCancel: onClose,
                    })
                }
            }}
            headerConfig={{
                group: [12, 12],
                headerNodes: [
                    <div className={styles.headerTitle}>
                        <div className={styles.headerModelInfo}>
                            <div
                                className={styles.modelInfoWrap}
                                title={basicData?.name}
                            >
                                {basicData?.name}
                            </div>
                            <Tooltip placement="top" title={__('数据加工信息')}>
                                <div
                                    className={styles.iconWrapper}
                                    onClick={(event) => {
                                        setEditModelLeft(event.clientX)
                                        setEditInfoStatus(true)
                                    }}
                                >
                                    <InfotipOutlined
                                        style={{
                                            color: 'rgba(0,0,0,0.65)',
                                        }}
                                    />
                                </div>
                            </Tooltip>
                        </div>

                        <div className={styles.headerTab}>
                            <Tabs
                                items={allProcessModelTabs}
                                defaultActiveKey={tabsKey.MODEL}
                                onChange={(activeKey) => {
                                    if (
                                        activeTab === tabsKey.MODEL &&
                                        modelPublishStatus !==
                                            PublishStatus.AllPublish &&
                                        modelPublishStatus !==
                                            PublishStatus.HasUpdateLogic
                                    ) {
                                        changeTabModel()
                                    } else if (
                                        activeTab === tabsKey.PROCESSLOGIC
                                    ) {
                                        const fieldsData =
                                            editorRef.current?.getData()
                                        const lastData =
                                            editorRef.current?.getCurrentPageData() ||
                                            null
                                        setLastEditorStatus(lastData)

                                        setModelInfoDetail({
                                            ...modeInfoDetail,
                                            ...fieldsData,
                                        })
                                    }
                                    setActiveTab(activeKey as tabsKey)
                                }}
                                activeKey={activeTab}
                            />
                        </div>
                        <HeaderEditModal
                            onClose={() => {
                                setEditInfoStatus(false)
                                // setEditModelLeft(100)
                            }}
                            data={basicData}
                            open={editInfoStatus}
                            left={editModelLeft}
                            onUpdateData={(values) => {
                                setBasicData({ ...basicData, ...values })
                                if (modelId || resetModelId) {
                                    editProcessDataInfo(
                                        modelId || resetModelId,
                                        values,
                                    )
                                }
                                setEditInfoStatus(false)
                                // setEditModelLeft(100)
                            }}
                            isNeedEdit={
                                taskStatus !== TaskExecutableStatus.COMPLETED
                            }
                        />
                    </div>,
                    <div className={styles.headerRightBtn}>
                        {getGroupBtn(modelPublishStatus)}
                    </div>,
                ],
                needReturn: true,
            }}
        >
            {getContentComponent()}
            {successStatus && (
                <PublishSuccess
                    onExecution={async () => {
                        try {
                            const lastData =
                                editorRef.current?.getCurrentPageData() || null
                            setExecStatus(false)
                            setLastEditorStatus(lastData)
                            await execDataProcess(modelId)
                            setActiveTab(tabsKey.LOGS)
                            setSuccessStatus(false)
                            message.success(__('立即执行成功'))
                            setExecStatus(true)
                        } catch (ex) {
                            formatError(ex)
                        }
                    }}
                    onBackList={() => {
                        setSuccessStatus(false)
                        onClose()
                    }}
                    onClose={() => {
                        setSuccessStatus(false)
                    }}
                />
            )}
        </PageDrawer>
    )
}
export default DataProcessPage
