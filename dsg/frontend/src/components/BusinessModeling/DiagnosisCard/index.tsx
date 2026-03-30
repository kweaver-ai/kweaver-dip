import { ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import { Button, message, Popconfirm, Space, Tooltip } from 'antd'
import classnames from 'classnames'
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce, useUpdateEffect } from 'ahooks'
import { SearchInput } from '@/ui'
import { TaskInfoContext } from '@/context'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'

import { RefreshBtn } from '@/components/ToolbarComponents'
import { DiagnosisOutlined } from '@/icons'

import { OperateType, phaseList } from '@/components/BusinessDiagnosis/const'
import {
    BusinessAuditStatus,
    cancelBusinessDiagnosisAudit,
    delBusinessDiagnosis,
    DiagnosisPhase,
    editBusinessDiagnosis,
    formatError,
    getBusinessDiagnosisList,
    getPolicyProcessList,
    postBusinessDiagnosisAudit,
    SearchAllIndicator,
    TaskExecutableStatus,
    TaskStatus,
} from '@/core'
import styles from './styles.module.less'

import {
    AuditStatusTag,
    getDisabledTooltip,
} from '@/components/BusinessAudit/helper'
import CreateDiagnosis from './CreateDiagnosis'
import {
    getDiagnosisContent,
    getState,
} from '@/components/BusinessDiagnosis/helper'
import CommonTable from '@/components/CommonTable'
import Confirm from '@/components/Confirm'
import { formatTime } from '@/utils'
import Detail from './Detail'
import { PolicyType } from '@/components/AuditPolicy/const'

function DiagnosisCard({
    modelId,
    mainbusId,
}: {
    modelId: string
    mainbusId: string
}) {
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)

    const [detailVisible, setDetailVisible] = useState<boolean>(false)
    const initSearchCondition = {
        offset: 1,
        limit: 999,
        direction: 'desc',
        sort: 'created_at',
        task_id: taskInfo?.id,
    }
    const commonTableRef: any = useRef()
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)
    const [delVisible, setDelVisible] = useState<boolean>(false)
    const [isBatchDel, setIsBatchDel] = useState<boolean>(false)
    const [selectedIds, setSelectedIds] = useState<any[]>([])
    const [currentData, setCurrentData] = useState<any>()
    const [searchCondition, setSearchCondition] =
        useState<any>(initSearchCondition)
    const [searchValue, setSearchValue] = useState<string>('')
    const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
    const [isReDiagnosis, setIsReDiagnosis] = useState<boolean>(false)
    const [flagDiagnosisId, setFlagDiagnosisId] = useState<string>('')

    const debounceCondition = useDebounce(searchCondition, {
        wait: 300,
    })

    const [hasProcess, setHasProcess] = useState<boolean>(false)

    const getProcess = async () => {
        try {
            const res = await getPolicyProcessList({
                audit_type: PolicyType.AfBgPublishBusinessDiagnosis,
            })
            setHasProcess(res?.total_count > 0)
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        setSearchCondition({
            ...initSearchCondition,
            task_id: taskInfo?.id,
        })
    }, [taskInfo?.id])

    useEffect(() => {
        getProcess()
    }, [])

    useEffect(() => {
        document.addEventListener('click', handleClick, true)
        return () => {
            document.removeEventListener('click', handleClick, true)
        }
    }, [])

    const handleClick = () => {
        setFlagDiagnosisId('')
    }

    const emptyText = (canAdd: boolean) => {
        return (
            <div className={styles.indexEmptyBox}>
                {canAdd ? (
                    <div>{__('点击【发起诊断】，可发起业务模型诊断')}</div>
                ) : (
                    <div>{__('暂无诊断报告')}</div>
                )}
            </div>
        )
    }

    const columns: any = [
        {
            title: __('诊断报告名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => (
                <span className={styles.nameWrapper}>
                    <span
                        title={text}
                        className={classnames(styles.tableName, {
                            [styles.tableNameOp]:
                                record.phase === DiagnosisPhase.Failed ||
                                record.phase === DiagnosisPhase.Done,
                        })}
                        onClick={() => {
                            if (
                                record.phase === DiagnosisPhase.Failed ||
                                record.phase === DiagnosisPhase.Done
                            ) {
                                handleOperate(OperateType.details, record)
                            }
                        }}
                    >
                        {text}
                    </span>
                    {hasProcess && <AuditStatusTag record={record} />}
                </span>
            ),
        },
        {
            title: __('包含主干业务'),
            dataIndex: 'processes',
            key: 'processes',
            ellipsis: true,
            render: (text, record) =>
                record?.report?.processes
                    ?.map((item) => item.name)
                    ?.join('、') || '--',
        },
        {
            title: __('主干业务数量'),
            dataIndex: 'processesNum',
            key: 'processesNum',
            ellipsis: true,
            width: 120,
            render: (text, record) => record?.processes?.length || 0,
        },
        {
            title: __('诊断内容'),
            dataIndex: 'dimensions',
            key: 'dimensions',
            ellipsis: true,
            render: (text, record) =>
                record?.dimensions
                    ? getDiagnosisContent(record?.dimensions)
                    : '--',
        },
        {
            title: __('状态'),
            dataIndex: 'phase',
            key: 'phase',
            ellipsis: true,
            width: 120,
            render: (text, record) => getState(text, phaseList) || '--',
        },
        {
            title: __('生成报告时间'),
            dataIndex: 'publish_status',
            key: 'publish_status',
            ellipsis: true,
            width: 200,
            render: (text, record) =>
                record.phase === DiagnosisPhase.Done &&
                record?.report?.creationTimestamp
                    ? formatTime(record?.report?.creationTimestamp)
                    : '--',
        },
        {
            title: __('创建人'),
            dataIndex: 'creator_name',
            key: 'creator_name',
            ellipsis: true,
            width: 100,
        },
        {
            title: __('操作'),
            key: 'action',
            width: 240,
            fixed: 'right',
            render: (text, record) => {
                const { audit_status } = record
                const btnList = [
                    {
                        label: __('撤回'),
                        status: OperateType.revocation,
                        show:
                            record.phase === DiagnosisPhase.Done &&
                            audit_status === BusinessAuditStatus.PubAuditing,
                    },
                    {
                        label: __('取消诊断'),
                        status: OperateType.cancel,
                        tips: __('确定要取消诊断吗?'),
                        show: record.phase === DiagnosisPhase.Running,
                    },
                    {
                        label: __('查看报告'),
                        status: OperateType.details,
                        show:
                            record.phase === DiagnosisPhase.Failed ||
                            record.phase === DiagnosisPhase.Done,
                    },
                    {
                        label: __('提交'),
                        status: OperateType.submit,
                        show:
                            hasProcess &&
                            record.phase === DiagnosisPhase.Done &&
                            [
                                BusinessAuditStatus.Unpublished,
                                BusinessAuditStatus.PubReject,
                            ].includes(audit_status),
                    },
                    {
                        label: __('重新诊断'),
                        status: OperateType.rerun,
                        show:
                            (record.phase === DiagnosisPhase.Canceled ||
                                record.phase === DiagnosisPhase.Done) &&
                            (hasProcess
                                ? audit_status !== BusinessAuditStatus.Published
                                : true),
                        disabled:
                            audit_status === BusinessAuditStatus.PubAuditing,
                        tooltip:
                            audit_status === BusinessAuditStatus.PubAuditing
                                ? getDisabledTooltip(
                                      __('重新诊断'),
                                      __('审核中'),
                                  )
                                : undefined,
                    },
                    {
                        label: __('删除'),
                        status: OperateType.del,
                        show: hasProcess
                            ? audit_status !== BusinessAuditStatus.Published
                            : true,
                        disabled:
                            record.phase === DiagnosisPhase.Running ||
                            audit_status === BusinessAuditStatus.PubAuditing,
                        tooltip:
                            audit_status === BusinessAuditStatus.PubAuditing
                                ? getDisabledTooltip(__('删除'), __('审核中'))
                                : undefined,
                    },
                ]
                return (
                    <Space size={16} className={styles.optionsBox}>
                        {btnList
                            .filter(
                                (item) =>
                                    item.show &&
                                    (!canOpt
                                        ? item.status === OperateType.details
                                        : true),
                            )
                            .map((item: any) => {
                                return (
                                    <Popconfirm
                                        title={item.tips}
                                        placement="bottom"
                                        okText={__('确定')}
                                        cancelText={__('取消')}
                                        onConfirm={() => {
                                            handleOperate(item.status, record)
                                        }}
                                        disabled={!item.tips}
                                        icon={
                                            <InfoCircleFilled
                                                style={{
                                                    color: '#3A8FF0',
                                                    fontSize: '16px',
                                                }}
                                            />
                                        }
                                        overlayClassName={styles.popconfirmTips}
                                        key={item.status}
                                    >
                                        <Tooltip title={item.tooltip}>
                                            <Button
                                                type="link"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (
                                                        item.status !==
                                                        OperateType.cancel
                                                    ) {
                                                        handleOperate(
                                                            item.status,
                                                            record,
                                                        )
                                                    }
                                                }}
                                                disabled={item.disabled}
                                            >
                                                {item.label}
                                            </Button>
                                        </Tooltip>
                                    </Popconfirm>
                                )
                            })}
                    </Space>
                )
            },
        },
    ]

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    // 撤回
    const handleRevocation = async (item: any) => {
        try {
            await cancelBusinessDiagnosisAudit(item?.id)
        } catch (e) {
            formatError(e)
        } finally {
            search()
        }
    }

    // 提交
    const handleSubmit = async (item: any) => {
        try {
            await postBusinessDiagnosisAudit(item?.id)
            message.success(__('提交成功'))
        } catch (e) {
            formatError(e)
        } finally {
            search()
        }
    }

    const handleOperate = async (op: OperateType, item: any) => {
        setCurrentData(item)
        if (op === OperateType.details) {
            // const url = `/business/diagnosis/details?id=${item.id}`
            // navigator(url)
            setDetailVisible(true)
        } else if (op === OperateType.del) {
            setDelVisible(true)
        } else if (op === OperateType.rerun) {
            setIsReDiagnosis(true)
            setCreateModalOpen(true)
        } else if (op === OperateType.cancel) {
            handleCancel(item)
        } else if (op === OperateType.revocation) {
            handleRevocation(item)
        } else if (op === OperateType.submit) {
            handleSubmit(item)
        }
    }

    const batchDelete = async () => {
        setDelBtnLoading(true)
        Promise.all(
            selectedIds.map(async (item) => {
                await delBusinessDiagnosis(item)
            }),
        ).then(() => {
            message.success(__('删除成功'))
            setDelBtnLoading(false)
            setDelVisible(false)
            setIsBatchDel(false)
            search()
            setSelectedIds([])
        })
    }

    const handleDelete = async () => {
        try {
            setDelBtnLoading(true)
            if (!currentData) return
            await delBusinessDiagnosis(currentData.id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            search()
        }
    }

    const handleCancel = async (item: any) => {
        try {
            await editBusinessDiagnosis({
                id: item?.id,
                name: item.name,
                canceled: true,
            })
            message.success(__('取消诊断成功'))
        } catch (e) {
            formatError(e)
        } finally {
            search()
        }
    }

    const canOpt = useMemo(() => {
        return !(
            taskInfo.status === TaskStatus.COMPLETED ||
            taskInfo.executable_status !== TaskExecutableStatus.EXECUTABLE
        )
    }, [taskInfo.status, taskInfo.executable_status])

    return (
        <div className={styles.diagnosisCardWrapper}>
            <div className={styles.diagnosisBox}>
                <div
                    className={classnames(
                        styles['diagnosisBox-search'],
                        isEmpty && styles.isEmpty,
                    )}
                >
                    <div className={styles['diagnosisBox-search-left']}>
                        <Space size={12}>
                            {canOpt && (
                                <Button
                                    type="primary"
                                    icon={
                                        <DiagnosisOutlined
                                            style={{ fontSize: 16 }}
                                        />
                                    }
                                    onClick={() => {
                                        setIsReDiagnosis(false)
                                        setCreateModalOpen(true)
                                    }}
                                >
                                    {__('发起诊断')}
                                </Button>
                            )}
                        </Space>
                    </div>
                    <div className={styles['diagnosisBox-search-right']}>
                        <Space size={8}>
                            <RefreshBtn onClick={() => search()} />
                        </Space>
                    </div>
                </div>

                <CommonTable
                    queryAction={getBusinessDiagnosisList}
                    params={debounceCondition}
                    baseProps={{
                        columns,
                        scroll: {
                            x: 1300,
                            y: `calc(100vh - 286px)`,
                        },
                        rowClassName: (record) =>
                            record.id === flagDiagnosisId
                                ? styles.flagTableRow
                                : '',
                        rowSelection: undefined,
                    }}
                    useDefaultPageChange
                    ref={commonTableRef}
                    emptyDesc={emptyText(canOpt)}
                    emptyIcon={dataEmpty}
                    getTableList={(res) => {
                        const isAllPass = res?.entries?.every(
                            (o) =>
                                o?.audit_status ===
                                BusinessAuditStatus.Published,
                        )
                        setTaskInfo((prev) => ({
                            ...prev,
                            isAllPass,
                        }))
                    }}
                    getEmptyFlag={(flag) => {
                        setIsEmpty(
                            flag &&
                                JSON.stringify(initSearchCondition) ===
                                    JSON.stringify(searchCondition),
                        )
                    }}
                    emptyStyle={{
                        display: 'flex',
                        height: 'calc(100% - 200px)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
            </div>

            {/* 删除/批量删除 */}
            <Confirm
                open={delVisible}
                title={__('确定要删除吗？')}
                content={__('删除后将无法恢复报告。')}
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#FAAD14', fontSize: '22px' }}
                    />
                }
                onOk={() => (isBatchDel ? batchDelete() : handleDelete())}
                onCancel={() => {
                    setDelVisible(false)
                    if (isBatchDel) {
                        setSelectedIds([])
                    }
                }}
                width={410}
                okButtonProps={{ loading: delBtnLoading }}
            />
            {createModalOpen && (
                <CreateDiagnosis
                    open={createModalOpen}
                    onClose={(toSearch?: boolean, id?: string) => {
                        setCreateModalOpen(false)
                        if (toSearch) {
                            search()
                        }
                        if (id) {
                            setFlagDiagnosisId(id)
                        }
                    }}
                    onShowDetail={(id: string) => {
                        setDetailVisible(true)
                        setCurrentData({ id })
                    }}
                    isReDiagnosis={isReDiagnosis}
                    id={currentData?.id}
                    name={currentData?.name}
                    data={taskInfo?.data || []}
                    taskId={taskInfo?.id}
                />
            )}

            {detailVisible && (
                <Detail
                    id={currentData?.id}
                    visible={detailVisible}
                    onClose={() => {
                        setDetailVisible(false)
                        setCurrentData(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default memo(DiagnosisCard)
