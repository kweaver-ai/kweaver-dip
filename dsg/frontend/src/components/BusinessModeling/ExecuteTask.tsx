import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import {
    BizModelType,
    formatError,
    getCoreBusinessDetails,
    getCoreBusinesses,
    ICoreBusinessDetails,
    ICoreBusinessItem,
    IQueryModals,
    messageError,
    TaskExecutableStatus,
    TaskStatus,
    TaskType,
} from '@/core'
import { OperateType, useQuery } from '@/utils'
import { TaskInfoContext } from '@/context'
import styles from './styles.module.less'

import { defaultMenu, products, TabKey, totalOperates, ViewMode } from './const'
import CreateCoreBusiness from './CreateCoreBusiness'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import CoreBusinessInfos from './CoreBusinessInfos'
import Forms from '../Forms'
import BusinessProcess from '../DrawioMgt/BusinessProcess'
import Report from '../Report'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { DrawioInfoProvider } from '@/context/DrawioProvider'
import CoreBusinessIndicator from './CoreBusinessIndicator'
import { useBusinessModelContext } from './BusinessModelProvider'
import DiagnosisCard from './DiagnosisCard'
import StandardCard from './StandardCard'
import CombedCard from './CombedCard'

/**
 * 废弃
 * @param param0
 * @returns
 */
const ExecuteTask: React.FC<{ tabKey: string }> = ({ tabKey }) => {
    const { businessModelType, setBusinessModelType, refreshDraft } =
        useBusinessModelContext()
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const [coreBusinessList, setCoreBusinessList] = useState<
        ICoreBusinessItem[]
    >([])
    const [selectedCoreBusiness, setSelectedCoreBusiness] =
        useState<ICoreBusinessItem>()
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchValue, setSearchValue] = useState('')
    const [searchCondition, setSearchCondition] = useState<IQueryModals>({
        offset: 1,
        limit: 20,
        keyword: '',
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
    })
    const [visible, setVisible] = useState(false)
    const [operateType, setOperateType] = useState(OperateType.CREATE)
    const [editId, setEditId] = useState<string>()
    const [relatedCoreBusinessId, setRelatedCoreBusinessId] = useState('')

    const query = useQuery()
    // 任务id
    const taskId = query.get('taskId') || ''
    // 项目id
    const projectId = query.get('projectId') || ''

    const [coreBizDetails, setCoreBizDetails] = useState<ICoreBusinessDetails>()

    useUpdateEffect(() => {
        if (searchValue === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchValue,
            offset: 1,
        })
    }, [searchValue])

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
    }

    useEffect(() => {
        setRelatedCoreBusinessId('')
        getCoreBusinessList()
    }, [taskInfo.taskId])

    useEffect(() => {
        getCoreBizDetails()
    }, [taskInfo.modelId])

    const getCoreBusinessList = async (ot?: OperateType) => {
        const offset =
            ot === OperateType.DELETE
                ? coreBusinessList.length === 1
                    ? (searchCondition.offset && searchCondition.offset - 1) ||
                      1
                    : searchCondition.offset
                : searchCondition.offset

        if (!taskInfo.taskId) return
        try {
            const res = await getCoreBusinesses({
                // ...searchCondition,
                offset: 1,
                project_id: taskInfo.projectId,
                task_id: taskInfo.projectId ? '' : taskInfo.taskId,
                // id: taskInfo.subDomainId,
            })

            // if (taskInfo.projectId && res?.entries?.length === 0) {
            //     messageError(__('当前项目无关联业务模型，请联系项目负责人'))
            //     setTaskInfo({ ...taskInfo, coreBizError: true })
            // } else {
            //     setTaskInfo({ ...taskInfo, coreBizError: false })
            // }
            setTaskInfo({ ...taskInfo, coreBizError: false })

            setTotal(res.total_count)
            setCoreBusinessList(res.entries || [])
            setRelatedCoreBusinessId(res?.entries?.[0]?.main_business_id)
            // getCoreBizDetails(res?.entries?.[0]?.main_business_id)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 获取业务模型详情
    const getCoreBizDetails = async () => {
        if (!taskInfo.modelId) {
            setCoreBizDetails(undefined)
            return
        }
        try {
            const res = await getCoreBusinessDetails(taskInfo.modelId)
            setCoreBizDetails(res)
            setTaskInfo({ ...taskInfo, modelAuditStatus: res?.audit_status })
        } catch (error) {
            formatError(error)
        }
    }

    const getSelectedCoreBusiness = (selectedCoreBus: ICoreBusinessItem) => {
        setSelectedCoreBusiness(selectedCoreBus)
    }

    const onCreateSuccess = (modelInfo) => {
        setVisible(false)
        setTaskInfo({ ...taskInfo, modelId: modelInfo.id })
    }

    const handleOperate = (type: OperateType, id?: string) => {
        setOperateType(type)
        setVisible(true)
        setEditId(id)
    }

    const handlePageChange = async (page: number) => {
        setSearchCondition({ ...searchCondition, offset: page })
    }

    const onDeleteSuccess = () => {
        getCoreBusinessList(OperateType.DELETE)
    }

    const renderEmpty = () => {
        return (
            <div className={styles['empty-wrapper']}>
                <Empty
                    desc={
                        taskInfo.taskStatus !== TaskStatus.COMPLETED
                            ? taskInfo?.task_type === TaskType.DATAMODELING
                                ? __('点击【新建】，可以新建数据模型')
                                : __('点击【新建】，可以新建业务模型')
                            : taskInfo?.task_type === TaskType.DATAMODELING
                            ? __('暂无数据模型')
                            : __('暂无业务模型')
                    }
                    iconSrc={dataEmpty}
                    onAdd={
                        taskInfo.taskStatus !== TaskStatus.COMPLETED
                            ? () => setVisible(true)
                            : undefined
                    }
                />
            </div>
        )
    }

    const getTabsContent = () => {
        switch (tabKey) {
            case TabKey.ABSTRACT:
                return <CoreBusinessInfos coreBizId={relatedCoreBusinessId} />
            case TabKey.FORM:
                return (
                    <Forms
                        modelId={coreBizDetails?.business_model_id || ''}
                        pMbid={coreBizDetails?.main_business_id || ''}
                        coreBizName={coreBizDetails?.name || ''}
                    />
                )
            case TabKey.PROCESS:
                return (
                    <BusinessProcess
                        modelId={coreBizDetails?.business_model_id || ''}
                        mainbusId={coreBizDetails?.main_business_id || ''}
                    />
                )
            case TabKey.INDICATOR:
                return (
                    <CoreBusinessIndicator
                        modelId={coreBizDetails?.business_model_id || ''}
                        coreBizName={coreBizDetails?.name || ''}
                    />
                )
            case TabKey.DIAGNOSIS: // 诊断任务
                return (
                    <DiagnosisCard
                        modelId={coreBizDetails?.business_model_id || ''}
                        mainbusId={coreBizDetails?.main_business_id || ''}
                    />
                )
            case TabKey.COMBED: // 梳理任务
                return (
                    <CombedCard
                        modelId={coreBizDetails?.business_model_id || ''}
                        mainbusId={coreBizDetails?.main_business_id || ''}
                    />
                )
            case TabKey.STANDARD: // 标准新建任务
                return (
                    <StandardCard
                        modelId={coreBizDetails?.business_model_id || ''}
                        mainbusId={coreBizDetails?.main_business_id || ''}
                    />
                )
            case TabKey.REPORT:
                return (
                    <div className={styles.tabContentWrapper}>
                        <div className={styles.tabContentTitle}>
                            {__('业务诊断')}
                        </div>
                        <div className={styles.tabContent}>
                            <Report
                                modelId={
                                    coreBizDetails?.business_model_id || ''
                                }
                            />
                        </div>
                    </div>
                )
            default:
                return <div />
        }
    }

    useEffect(() => {
        setBusinessModelType(
            taskInfo?.taskType === TaskType.DATAMODELING
                ? BizModelType.DATA
                : BizModelType.BUSINESS,
        )
        refreshDraft?.(coreBizDetails?.has_draft ?? false)
    }, [taskInfo?.taskType, coreBizDetails?.has_draft])

    return (
        <DrawioInfoProvider>
            <div
                className={classnames(
                    styles.executeTaskWrapper,
                    !taskInfo?.modelId && styles.executeTaskEmptyWrapper,
                )}
            >
                {!taskInfo?.modelId &&
                [TaskType.MODEL, TaskType.DATAMODELING].includes(
                    taskInfo?.taskType,
                )
                    ? renderEmpty()
                    : getTabsContent()}
            </div>
            <CreateCoreBusiness
                visible={visible}
                operateType={operateType as OperateType}
                setOperateType={setOperateType}
                onClose={() => setVisible(false)}
                onSuccess={onCreateSuccess}
                selectedNode={taskInfo.processInfo}
                viewMode={ViewMode.BArchitecture}
            />
        </DrawioInfoProvider>
    )
}
export default ExecuteTask
