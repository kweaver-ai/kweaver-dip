import BusinessAreaAudit from '@/components/BusinessAudit'
import { BusinessAuditType } from '@/core'

function BusinessDiagnosis() {
    return (
        <BusinessAreaAudit
            auditType={BusinessAuditType.BusinessDiagnosisPublish}
        />
    )
}

export default BusinessDiagnosis
