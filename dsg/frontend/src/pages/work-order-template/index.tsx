import React from 'react'
import { WorkOrderTemplateManagement } from '@/components/WorkOrderTemplate'
import styles from './styles.module.less'

function WorkOrderTemplatePage() {
    return (
        <div className={styles.workOrderTemplateWrapper}>
            <WorkOrderTemplateManagement />
        </div>
    )
}

export default WorkOrderTemplatePage
