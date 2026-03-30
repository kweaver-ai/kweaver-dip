import { Button, message, Space, Tabs, Tooltip } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import {
    editSyncModelInfo,
    execDataSync,
    formatError,
    saveSyncData,
    TaskExecutableStatus,
    updateSyncModel,
} from '@/core'
import { InfotipOutlined } from '@/icons'
import PageDrawer from '@/ui/PageDrawer'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { enBeginNameRegNew } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import LogsList from '../DataDevelopmentWorkflow/LogsList'
import { ModelType, tabsKey } from './const'
import HeaderEditModal from './HeaderEditModal'
import { dataSyncModelTabs } from './helper'
import __ from './locale'
import PublishSuccess from './PublishSuccess'
import styles from './styles.module.less'
import SynschronizationModel from './SynschronizationModel'

interface IDataSyncPage {
    open: boolean
    onClose: () => void
    modelInfo: any
    taskId: string
    taskStatus: TaskExecutableStatus
}

const DataSyncPage: FC<IDataSyncPage> = ({
    open,
    onClose,
    modelInfo,
    taskId,
    taskStatus,
}) => {
    // 编辑信息弹窗
    const [editInfoStatus, setEditInfoStatus] = useState<boolean>(false)
    // 编辑信息弹窗位置
    const [editModelLeft, setEditModelLeft] = useState<number>(100)
    // 当前模型的基础信息
    const [basicData, setBasicData] = useState<any>(modelInfo)

    // 当前模型是否发布M
    const [modelPublishStatus, setModelPushlishStatus] =
        useState<boolean>(false)

    const [modelId, setModelId] = useState<string>(modelInfo?.id || '')
    const [modelType, SetModelType] = useState<ModelType>(ModelType.CREATE)

    // 成功状态
    const [successStatus, setSuccessStatus] = useState<boolean>(false)

    // 重置model的id
    const [resetModelId, setResetModelId] = useState<string>('')

    // 画布ref
    const modelRef: any = useRef()

    const [activeTab, setActiveTab] = useState<tabsKey>(tabsKey.MODEL)

    const [execStatus, setExecStatus] = useState<boolean>(true)

    useEffect(() => {
        setBasicData(modelInfo)
        setResetModelId('')
        setActiveTab(tabsKey.MODEL)
        if (modelInfo?.id) {
            setModelPushlishStatus(true)
            setModelId(modelInfo.id)
        } else {
            setModelPushlishStatus(false)
            setModelId('')
        }
    }, [modelInfo])

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
            const fieldsData = modelRef.current?.getData()
            if (fieldsData) {
                if (!fieldsData.target?.fields?.length) {
                    message.error(__('请先配置来源数据表'))
                    return
                }
                if (!fieldsData.target?.name) {
                    message.error(__('请先配置目标数据表信息'))
                    modelRef.current?.setTargetFormError()
                    return
                }

                if (
                    !fieldsData.target?.fields?.filter(
                        (currentField) => !currentField?.unmapped,
                    ).length
                ) {
                    message.error(__('请至少同步一个字段'))
                    return
                }

                if (!checkFieldsStatus(fieldsData.target?.fields)) {
                    message.error(__('请先修改目标数据表字段信息'))
                    return
                }

                if (resetModelId) {
                    const [resData] = await updateSyncModel(resetModelId, {
                        ...fieldsData,
                        task_id: taskId,
                    })
                    setModelId(resData.id)
                    setResetModelId('')
                } else {
                    const [resData] = await saveSyncData({
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
                    setModelPushlishStatus(true)
                }
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    const getContentComponent = () => {
        switch (activeTab) {
            case tabsKey.MODEL:
                return (
                    <SynschronizationModel
                        modelId={modelId}
                        model={modelType}
                        ref={modelRef}
                    />
                )
            case tabsKey.LOGS:
                return (
                    <div className={styles.dyncLogsContent}>
                        <LogsList
                            pageType="whole"
                            model="sync"
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

    const editSyncDataInfo = async (id, values) => {
        try {
            await editSyncModelInfo(id, {
                task_id: taskId,
                ...values,
            })
            message.success(__('编辑成功'))
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <PageDrawer
            open={open}
            onClose={() => {
                if (modelPublishStatus) {
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
                            <Tooltip placement="top" title={__('数据同步信息')}>
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
                                items={
                                    modelPublishStatus
                                        ? dataSyncModelTabs
                                        : dataSyncModelTabs.map(
                                              (currentTab) => {
                                                  if (
                                                      currentTab.key ===
                                                      tabsKey.LOGS
                                                  ) {
                                                      return {
                                                          ...currentTab,
                                                          disabled: true,
                                                      }
                                                  }
                                                  return currentTab
                                              },
                                          )
                                }
                                defaultActiveKey={tabsKey.MODEL}
                                onChange={(activeKey) => {
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
                                    editSyncDataInfo(
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
                        {activeTab === tabsKey.MODEL ? (
                            modelPublishStatus ? (
                                <Space>
                                    {taskStatus ===
                                    TaskExecutableStatus.COMPLETED ? null : (
                                        <Button
                                            style={{
                                                width: 80,
                                            }}
                                            onClick={() => {
                                                confirm({
                                                    width: 432,
                                                    title: (
                                                        <span
                                                            style={{
                                                                color: '#000',
                                                                fontWeight:
                                                                    '550',
                                                            }}
                                                        >
                                                            {__(
                                                                '确认要重置数据同步吗？',
                                                            )}
                                                        </span>
                                                    ),
                                                    icon: (
                                                        <ExclamationCircleFilled
                                                            style={{
                                                                color: '#FAAD14',
                                                            }}
                                                        />
                                                    ),
                                                    content: __(
                                                        '重置后您需重新配置来源数据表及目标数据表，且需要手动清除已同步的数据，请谨慎操作！',
                                                    ),
                                                    okText: __('确定'),
                                                    cancelText: __('取消'),
                                                    onOk: () => {
                                                        setModelPushlishStatus(
                                                            false,
                                                        )
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
                                            display: 'flex',
                                            justifyContent: 'center',
                                        }}
                                        loading={!execStatus}
                                        disabled={!execStatus}
                                        onClick={async () => {
                                            try {
                                                setExecStatus(false)
                                                await execDataSync(modelId)
                                                setActiveTab(tabsKey.LOGS)
                                                message.success(
                                                    __('立即执行成功'),
                                                )
                                                setExecStatus(true)
                                            } catch (ex) {
                                                formatError(ex)
                                            }
                                        }}
                                    >
                                        {__('立即执行')}
                                    </Button>
                                </Space>
                            ) : (
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
                        ) : (
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
                                        await execDataSync(modelId)
                                        message.success(__('立即执行成功'))
                                        setExecStatus(true)
                                    } catch (ex) {
                                        formatError(ex)
                                    }
                                }}
                            >
                                {__('立即执行')}
                            </Button>
                        )}
                    </div>,
                ],
                needReturn: true,
            }}
        >
            {getContentComponent()}
            {successStatus && (
                <PublishSuccess
                    onExecution={async () => {
                        setExecStatus(false)
                        await execDataSync(modelId)
                        setActiveTab(tabsKey.LOGS)
                        setSuccessStatus(false)
                        message.success(__('立即执行成功'))
                        setExecStatus(true)
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
export default DataSyncPage
