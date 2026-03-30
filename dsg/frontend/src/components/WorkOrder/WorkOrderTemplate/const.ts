export const initSearchCondition: any = {
    offset: 1,
    limit: 12,
    keyword: '',
    ticket_type: undefined,
    status: undefined,
}

export enum OptionStatus {
    Create = 'create',
    Detail = 'detail',
    Edit = 'edit',
    Enable = 'enable',
    Stop = 'stop',
    Delete = 'delete',
}
