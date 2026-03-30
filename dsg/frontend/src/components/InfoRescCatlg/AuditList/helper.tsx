import { AuditStatus, AuditType } from '@/core'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'
import styles from './styles.module.less'

export enum InfoCatlgAuditTabType {
    ToAudit = 'toAudit',
    Audited = 'audited',
}

export const tabItems = [
    { label: '待审核', key: InfoCatlgAuditTabType.ToAudit, children: '' },
    { label: '已审核', key: InfoCatlgAuditTabType.Audited, children: '' },
]

export const auditStatusList = [
    { label: __('待审核'), value: AuditStatus.TODO },
    { label: __('已通过'), value: AuditStatus.FULFILLED, bgColor: '#52C41B' },
    { label: __('已驳回'), value: AuditStatus.REJECTED, bgColor: '#E60012' },
    { label: __('审核中'), value: AuditStatus.PENDING },
]

export const auditTypeList = [
    { label: __('发布审核'), value: AuditType.PublishAudit },
    { label: __('上线审核'), value: AuditType.OnlineAudit },
    { label: __('下线审核'), value: AuditType.OfflineAudit },
    { label: __('变更审核'), value: AuditType.ChangeAudit },
]

export const searchData: IformItem[] = [
    {
        label: '类型',
        key: 'audit_type',
        options: auditTypeList,
        type: SearchType.MultipleSelect,
        initLabel: '类型不限',
    },
]

/**
 * 显示审核状态
 * @param key 接口返回字段
 * @param useStrValue 是否使用strValue字段
 * @param 资源目录使用key，接口服务使用strValue
 * @returns
 */
export const getState = (key: string, data?: any[]) => {
    const list = data || auditTypeList

    const { label, bgColor = '#d8d8d8' } =
        list.find((item) => item.value === key) || {}

    return (
        <div className={styles.state}>
            <span className={styles.dot} style={{ background: bgColor }} />
            {label}
        </div>
    )
}

export const auditInfoCatlgInfos: any[] = [
    {
        label: __('信息资源目录名称：'),
        value: 'name',
    },
    {
        label: __('所属组织架构：'),
        value: 'department_path',
    },
    {
        label: __('申请时间：'),
        value: 'audit_at',
        type: 'timestamp',
    },
]
