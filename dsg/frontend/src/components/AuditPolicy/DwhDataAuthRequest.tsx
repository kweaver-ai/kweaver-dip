import { Tabs, message } from 'antd'
import React, { useEffect, useState } from 'react'
import {
    formatError,
    getPolicyProcessList,
    createPolicyProcess,
    updatePolicyProcess,
    deletePolicyProcess,
} from '@/core'
import { IWorkflowInfo } from '../WorkflowViewPlugin'
import WorkflowView from './WorkflowView'
import { PolicyType } from './const'
import { getSelectedProcess } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IAuditProcess {
    type: string
    title?: string
    tip?: string
    unBindTip?: string
    canUnBind?: boolean
}

export const AuditProcess = ({
    type,
    title,
    tip,
    unBindTip,
    canUnBind = true,
}: IAuditProcess) => {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const auditProcess = await getPolicyProcessList({
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
            service_type: 'auth-service',
        }
        try {
            if (!workflow) {
                await createPolicyProcess(processData)
                getData()
            } else {
                await updatePolicyProcess({
                    id: workflow?.id,
                    ...processData,
                })
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleUnbind = async () => {
        try {
            await deletePolicyProcess(workflow?.id)
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

const DwhDataAuthRequest: React.FC = () => {
    return (
        <div className={styles['data-resource']}>
            <Tabs
                defaultActiveKey={PolicyType.AfDwhDataAuthRequest}
                destroyInactiveTabPane
                items={[
                    {
                        label: __('数仓库表权限申请'),
                        key: PolicyType.AfDwhDataAuthRequest,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '设置后，用户申请数仓库表权限时需要审核，审核通过后可申请成功；若未设置，用户将无法创建数仓库表的权限申请',
                                )}
                                type={PolicyType.AfDwhDataAuthRequest}
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}

export default DwhDataAuthRequest
