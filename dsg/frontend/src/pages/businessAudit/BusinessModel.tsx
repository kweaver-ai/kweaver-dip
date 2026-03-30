import BusinessAreaAudit from '@/components/BusinessAudit'
import { BusinessAuditType } from '@/core'

function BusinessModel() {
    return (
        <BusinessAreaAudit auditType={BusinessAuditType.BusinessModelPublish} />
    )
}

export default BusinessModel
