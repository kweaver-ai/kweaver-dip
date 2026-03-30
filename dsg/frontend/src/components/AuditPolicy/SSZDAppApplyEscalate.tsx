import React, { memo, useEffect, useState } from 'react'
import { message } from 'antd'
import {
    bindSSZDDemandAuditProcess,
    createPolicyProcess,
    deletePolicyProcess,
    deleteSSZDDemandAuditProcess,
    formatError,
    getApiAuditProcess,
    getPolicyProcessList,
    updatePolicyProcess,
    updateSSZDDemandAuditProcess,
} from '@/core'
import { IWorkflowInfo } from '../WorkflowViewPlugin'
import WorkflowView from './WorkflowView'
import { PolicyType } from './const'
import __ from './locale'
import styles from './styles.module.less'

const CurrentPolicyType = PolicyType.SSZDAppApplyEscalate

const SSZDAppApplyEscalate: React.FC = () => {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const process = await getPolicyProcessList({
                audit_type: CurrentPolicyType,
            })
            setWorkflow(process?.entries?.[0])
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
            audit_type: CurrentPolicyType,
            service_type: 'configuration-center',
            proc_def_key: workflowInfo.process_def_key,
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
        <div className={styles['policy-container']}>
            <WorkflowView
                title={__('应用申请')}
                tip={
                    !workflow
                        ? __(
                              '设置审核流程后，用户创建的应用通过审核后才会生效；若未设置审核流程，默认自动通过无需审核。',
                          )
                        : undefined
                }
                type={CurrentPolicyType}
                data={workflow}
                loading={loading}
                onSave={handleSaveWorkflow}
                onUnBind={handleUnbind}
            />
        </div>
    )
}

export default memo(SSZDAppApplyEscalate)
