import { BackTop, ModalProps, Tooltip } from 'antd'
import React, { useState, useEffect } from 'react'
import Report from '@/components/DataComprehension/Report'
import ReportAnchor from '@/components/DataComprehension/ReportAnchor'
import { TabKey, ViewMode } from '@/components/DataComprehension/const'
import {
    formatError,
    formsEnumConfig,
    getDataComprehensionDetails,
    IFormEnumConfigModel,
} from '@/core'
import { ReturnTopOutlined } from '@/icons'
import { useQuery } from '@/utils'
import __ from '../locale'
import styles from './styles.module.less'
import {
    UndsGraphProvider,
    useUndsGraphContext,
} from '@/context/UndsGraphProvider'

/**
 * 数据理解报告
 */
const ComprehensionReport: React.FC<any> = ({
    catalogId,
    taskId,
    templateId,
    ...props
}) => {
    const query = useQuery()
    const { viewMode, setViewMode } = useUndsGraphContext()

    const [details, setDetails] = useState<any>()
    const [enumConfigs, setEnumConfigs] = useState<IFormEnumConfigModel>()

    useEffect(() => {
        const tab = query.get('tab') || TabKey.CANVAS
        const mode = query.get('mode') || ViewMode.VIEW
        setViewMode(mode as ViewMode)
        getEnumConfig()
        getDetails()
    }, [])

    // 理解详情
    const getDetails = async () => {
        if (!catalogId) return
        try {
            const res = await getDataComprehensionDetails(catalogId, {
                task_id: taskId,
                template_id: templateId,
            })
            setDetails(res)
        } catch (err) {
            formatError(err)
            setDetails(undefined)
        }
    }

    // 获取枚举值
    const getEnumConfig = async () => {
        const res = await formsEnumConfig()
        setEnumConfigs(res)
    }
    return (
        <div style={{ background: '#fff' }}>
            <Report details={details} enumConfigs={enumConfigs} />
            <ReportAnchor
                details={details}
                targetOffset={24}
                style={{
                    position: 'absolute',
                    top: 76,
                    right: 24,
                    zIndex: 1000,
                }}
            />
            <Tooltip title={__('回到顶部')}>
                <BackTop
                    visibilityHeight={100}
                    className={styles.backTop}
                    target={() => document.getElementById('reportWrap')!}
                >
                    <ReturnTopOutlined style={{ fontSize: 40 }} />
                </BackTop>
            </Tooltip>
        </div>
    )
}

export default ComprehensionReport
