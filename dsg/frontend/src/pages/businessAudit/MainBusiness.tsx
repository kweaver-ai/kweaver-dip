import BusinessAreaAudit from '@/components/BusinessAudit'
import { BusinessAuditType } from '@/core'

function MainBusiness() {
    return (
        <BusinessAreaAudit auditType={BusinessAuditType.MainBusinessPublish} />
    )
}

export default MainBusiness
