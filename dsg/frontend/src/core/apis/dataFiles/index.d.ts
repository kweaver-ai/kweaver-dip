export interface IQueryList {
    offset?: number
    limit?: number
    category_id?: string
    department_id?: string
    subject_domain_id?: string
    keyword?: string
    publish_status?: string
    sort?: string
    direction?: string
    times?: string[]
    status?: string
    refreshNum?: number
    updated_at_start?: number | null
    updated_at_end?: number | null
}

export interface IRescItem {
    service_id: string
    service_code: string
    service_name: string
    service_type?: string
    publish_status: string
    status?: string
    has_draft?: boolean
    audit_advice?: string
    department?: {
        name: string
    }
    update_time: string
}
