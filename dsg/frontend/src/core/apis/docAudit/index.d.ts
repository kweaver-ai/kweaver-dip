export interface IDocAudit {
    id: string
    task_id: string
    audit_idea: boolean
    audit_msg: string
    attachments: any[]
}

export interface IDocAuditAuthority {
    proc_inst_id: string
    type: string
}
