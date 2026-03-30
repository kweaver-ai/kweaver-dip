import BusinessAreaAudit from '@/components/BusinessAudit'
import { BusinessAuditType } from '@/core'

function BusinessArea() {
    return (
        <BusinessAreaAudit auditType={BusinessAuditType.BusinessAreaPublish} />
    )
}

export default BusinessArea
