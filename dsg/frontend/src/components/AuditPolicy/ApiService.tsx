import React, { useEffect, useState } from 'react'
import { Tabs, message } from 'antd'
import {
    createApiAuditProcess,
    delApiAuditProcess,
    formatError,
    getApiAuditProcess,
    updateApiAuditProcess,
} from '@/core'
import { IWorkflowInfo } from '../WorkflowViewPlugin'
import WorkflowView from './WorkflowView'
import { PolicyType } from './const'
import { getSelectedProcess } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface IApiAuditProcess {
    type: string
    title?: string
    tip?: string
    unBindTip?: string
    canUnBind?: boolean
}

export const ApiAuditProcess = ({
    type,
    title,
    tip,
    unBindTip,
    canUnBind = true,
}: IApiAuditProcess) => {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const auditProcess = await getApiAuditProcess({
                audit_type: type,
            })
            const auditData = getSelectedProcess(auditProcess?.entries, type)
            setWorkflow(auditData?.[0])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        getData()
    }, [])

    const handleSaveWorkflow = async (workflowInfo: IWorkflowInfo) => {
        const processData = {
            audit_type: type,
            proc_def_key: workflowInfo.process_def_key,
        }
        try {
            if (!workflow) {
                await createApiAuditProcess(processData)
                getData()
            } else {
                await updateApiAuditProcess({
                    id: workflow?.bind_id,
                    ...processData,
                })
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleUnbind = async () => {
        try {
            await delApiAuditProcess({ id: workflow?.bind_id })
            setWorkflow(undefined)
            message.success(__('解绑成功'))
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <WorkflowView
            title={title}
            tip={!workflow ? tip : unBindTip || undefined}
            type={type}
            data={workflow}
            loading={loading}
            onSave={handleSaveWorkflow}
            onUnBind={canUnBind ? handleUnbind : undefined}
        />
    )
}

const ApiService: React.FC = () => {
    const [{ using }] = useGeneralConfig()
    return (
        <div className={styles['api-container']}>
            <Tabs
                defaultActiveKey={PolicyType.ApiPublish}
                destroyInactiveTabPane
                items={[
                    {
                        label: __('发布审核'),
                        key: PolicyType.ApiPublish,
                        children: (
                            <ApiAuditProcess
                                tip={__(
                                    '设置审核流程后，用户发布接口时需要审核，审核通过后接口可发布成功；若未设置审核流程，默认自动通过无需审核',
                                )}
                                type={PolicyType.ApiPublish}
                            />
                        ),
                    },
                    {
                        label: __('变更审核'),
                        key: PolicyType.ApiChange,
                        children: (
                            <ApiAuditProcess
                                tip={__(
                                    '设置审核流程后，用户变更已发布的接口时需要审核，审核通过后接口可变更成功；若未设置审核流程，默认自动通过无需审核',
                                )}
                                type={PolicyType.ApiChange}
                            />
                        ),
                    },
                    {
                        label: __('上线审核'),
                        key: PolicyType.ApiOnline,
                        children: (
                            <ApiAuditProcess
                                tip={__(
                                    '设置审核流程后，用户上线接口时需要审核，审核通过后接口可上线成功；若未设置审核流程，默认自动通过无需审核',
                                )}
                                type={PolicyType.ApiOnline}
                            />
                        ),
                    },
                    {
                        label: __('下线审核'),
                        key: PolicyType.ApiOffline,
                        children: (
                            <ApiAuditProcess
                                tip={__(
                                    '设置审核流程后，用户下线接口时需要审核，审核通过后接口可下线成功；若未设置审核流程，默认自动通过无需审核',
                                )}
                                type={PolicyType.ApiOffline}
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}

export default ApiService
