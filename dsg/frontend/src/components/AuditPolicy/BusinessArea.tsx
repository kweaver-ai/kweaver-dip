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
            service_type: 'business-grooming',
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

const CoreBusiness: React.FC = () => {
    return (
        <div className={styles['data-resource']}>
            <Tabs
                defaultActiveKey={PolicyType.AfBgPublishBusinessArea}
                destroyInactiveTabPane
                items={[
                    {
                        label: __('发布审核'),
                        key: PolicyType.AfBgPublishBusinessArea,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '用户新建业务领域及变更时需要审核，审核通过后业务领域新建或变更才生效；若未设置，默认自动通过无需审核',
                                )}
                                type={PolicyType.AfBgPublishBusinessArea}
                            />
                        ),
                    },
                    {
                        label: __('删除审核'),
                        key: PolicyType.AfBgDeleteBusinessArea,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '用户删除业务领域时需要审核，审核通过后业务领域删除才生效；若未设置，默认自动通过无需审核',
                                )}
                                type={PolicyType.AfBgDeleteBusinessArea}
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}

export default CoreBusiness
