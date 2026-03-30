import { Tabs, message } from 'antd'
import React, { useEffect, useState } from 'react'
import {
    createDemandAuditProcessV2,
    deleteDemandAuditProcessV2,
    formatError,
    getDemandAuditProcessV2List,
    updateDemandAuditProcessV2,
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
            const auditProcess = await getDemandAuditProcessV2List(type)
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
                await createDemandAuditProcessV2(processData)
                getData()
            } else {
                await updateDemandAuditProcessV2({
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
            await deleteDemandAuditProcessV2(workflow?.id)
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

const CityDemand: React.FC = () => {
    return (
        <div className={styles['data-resource']}>
            <Tabs
                defaultActiveKey={PolicyType.CityDemandDeclare}
                destroyInactiveTabPane
                items={[
                    {
                        label: __('供需申报'),
                        key: PolicyType.CityDemandDeclare,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '设置审核流程后，用户申请需部门负责人审核；若未设置审核流程，默认自动通过无需审核',
                                )}
                                type={PolicyType.CityDemandDeclare}
                            />
                        ),
                    },
                    {
                        label: __('供需分析'),
                        key: PolicyType.CityDemandAnalysis,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '设置审核流程后，运营人员分析后需市数据局审核；若未设置审核流程，默认自动通过无需审核',
                                )}
                                type={PolicyType.CityDemandAnalysis}
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}

export default CityDemand
