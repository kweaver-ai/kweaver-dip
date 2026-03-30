import { Card, message, Popover } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseCircleFilled } from '@ant-design/icons'
import { formatError, messageError, TaskStatus } from '@/core'
import {
    editTask,
    IWorkItem,
    syncWorkOrder,
} from '@/core/apis/taskCenter/index'
import { ExecutorInfo } from '@/core/apis/taskCenter/index.d'
import { messageDebounce } from '@/core/graph/helper'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import DatePickerSelect from '../TaskComponents/DatePickerSelect'
import { WorkOrderTypeColor } from '../TaskComponents/helper'
import { WorkOrderStatus } from './helper'
import styles from './styles.module.less'
import UserSearch from './UserSearch'
import WorkOrderCardMenu from './WorkOrderCardMenu'
import __ from './locale'
import { AuditType } from '../WorkOrder/helper'
import { AuditOptions } from '../WorkOrder/WorkOrderManage/helper'

interface IWorkOrderCard {
    workOrderData: IWorkItem
    projectId: string
    onDetail: (item: IWorkItem) => void
    color: string
    users: Array<ExecutorInfo> | null
    onTransfer: (item: IWorkItem) => void
    updateWorkOrder: () => void
}

const WorkOrderCard = ({
    workOrderData,
    projectId,
    onDetail,
    color,
    users,
    onTransfer,
    updateWorkOrder,
}: IWorkOrderCard) => {
    const [workOrderInfo, setWorkOrderInfo] = useState(workOrderData)
    const [dateData, setDateData] = useState<any>(
        moment(workOrderData.deadline),
    )
    const [taskType, setTaskType] = useState(workOrderData.sub_type)
    const [newTaskStatus, setNewTaskStatus] = useState<string>('ready')
    const [executorId, setExecutorId] = useState<string>(
        workOrderData.executor_id,
    )
    const [noUserBorder, setNoUserBorder] = useState<any>({})
    const [menuStatus, setMenuStatus] = useState<boolean>(false)

    useEffect(() => {
        setWorkOrderInfo(workOrderData)
        setDateData(moment(workOrderData.deadline * 1000))
        setNewTaskStatus(workOrderData.status)
        setExecutorId(workOrderData.executor_id)
        setTaskType(workOrderData.sub_type)
        if (
            workOrderData.status === TaskStatus.ONGOING &&
            !workOrderData.executor_id
        ) {
            setNoUserBorder({ border: '1px solid #F5222D' })
        } else {
            setNoUserBorder({})
        }
    }, [workOrderData])

    const handleSync = async (_id: string) => {
        try {
            await syncWorkOrder(_id)
            message.success(__('同步成功'))
            // 刷新
            updateWorkOrder()
        } catch (error) {
            message.error(__('同步失败'))
        }
    }

    return (
        <Card
            className={styles.taskCard}
            bodyStyle={{
                padding: 16,
            }}
            style={{
                borderLeft: `3px solid ${
                    WorkOrderTypeColor[workOrderData.sub_type] || '#3e52b5'
                }`,
            }}
            onMouseMove={() => {
                setMenuStatus(true)
            }}
            onMouseLeave={() => {
                setMenuStatus(false)
            }}
            onClick={() => {
                onDetail(workOrderData)
            }}
        >
            <div className={styles.taskToolBar}>
                <div className={styles.taskTypeIcon}>
                    <FontIcon
                        name="icon-gongdan"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16 }}
                    />
                </div>
                <div
                    className={classnames({
                        [styles.taskName]: true,
                    })}
                >
                    <div className={styles.it}>{workOrderData.name}</div>
                    <div
                        hidden={
                            ![AuditType.AUDITING, AuditType.REJECT].includes(
                                workOrderData?.audit_status as any,
                            )
                        }
                        className={classnames(
                            styles.it,
                            workOrderData?.audit_status === AuditType.REJECT
                                ? styles['is-reject']
                                : undefined,
                        )}
                    >
                        {
                            AuditOptions.find(
                                (o) => o.value === workOrderData?.audit_status,
                            )?.label
                        }
                        {workOrderData?.audit_status === AuditType.REJECT &&
                            workOrderData?.audit_description && (
                                <Popover
                                    placement="bottomLeft"
                                    arrowPointAtCenter
                                    overlayClassName={styles.PopBox}
                                    content={
                                        <div className={styles.PopTip}>
                                            <div>
                                                <span
                                                    className={
                                                        styles.popTipIcon
                                                    }
                                                >
                                                    <CloseCircleFilled />
                                                </span>
                                                {__('审核未通过')}
                                            </div>
                                            <div
                                                style={{
                                                    wordBreak: 'break-all',
                                                }}
                                            >
                                                {
                                                    workOrderData?.audit_description
                                                }
                                            </div>
                                        </div>
                                    }
                                >
                                    <FontIcon
                                        name="icon-xinxitishi"
                                        type={IconType.FONTICON}
                                        style={{
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                        }}
                                    />
                                </Popover>
                            )}
                    </div>
                </div>
                <div
                    className={styles.taskMenu}
                    onClick={(e) => e.stopPropagation()}
                    hidden={workOrderInfo.status === 'completed'}
                    style={{
                        visibility: menuStatus ? 'visible' : 'hidden',
                    }}
                >
                    <WorkOrderCardMenu
                        status={newTaskStatus}
                        type={workOrderData.sub_type}
                        needSync={workOrderData.need_sync}
                        audit_status={workOrderData.audit_status}
                        onTriggerTransfer={() => {
                            onTransfer(workOrderData)
                        }}
                        onTriggerDetail={() => {
                            onDetail(workOrderData)
                        }}
                        onTriggerSync={() => {
                            handleSync(workOrderData.id)
                        }}
                    />
                </div>
            </div>
            <div className={styles.taskConfig}>
                <UserSearch
                    style={noUserBorder}
                    projectId={projectId}
                    userid={executorId}
                    nodeId={workOrderData?.node_id || ''}
                    allUsers={users}
                    status={workOrderData.status as any}
                    userName={workOrderData.executor_name}
                    taskType={taskType}
                    disabled
                />
                {WorkOrderStatus[workOrderData.status]}
            </div>
            <div className={styles.taskConfig} hidden={!workOrderData.deadline}>
                {workOrderData.deadline ? (
                    <DatePickerSelect
                        date={dateData}
                        onChange={(date, dateString) => {
                            setDateData(date)
                        }}
                        overdue={workOrderData.overdue}
                        disabled
                    />
                ) : (
                    <div />
                )}
            </div>
        </Card>
    )
}

export default WorkOrderCard
