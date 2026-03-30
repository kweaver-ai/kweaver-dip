import { Tabs } from 'antd'
import { useEffect, useState } from 'react'
import { useQuery } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'
import AuditTable from './AuditTable'
import { AuditType } from './const'

const PlanProcessingAudit = () => {
    return (
        <div className={styles['plan-processing-audit']}>
            <AuditTable type={AuditType.Tasks} />
        </div>
    )
}

export default PlanProcessingAudit
