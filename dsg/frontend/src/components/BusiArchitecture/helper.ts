import {
    BusinessDomainLevelTypes,
    BusinessAuditType,
    getAuditProcessFromConfCenter,
} from '@/core'

// 检查是否配置了发布审核流程
export const checkAuditProcess = async (type: BusinessDomainLevelTypes) => {
    const auditType =
        type === BusinessDomainLevelTypes.Process
            ? BusinessAuditType.MainBusinessPublish
            : BusinessAuditType.BusinessAreaPublish

    const res = await getAuditProcessFromConfCenter({
        audit_type: auditType,
    })

    return res?.entries?.length
}
