import BusinessAreaAudit from '@/components/BusinessAudit'
import { BusinessAuditType } from '@/core'

function DataModel() {
    return <BusinessAreaAudit auditType={BusinessAuditType.DataModelPublish} />
}

export default DataModel
