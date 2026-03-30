// 码表信息
export interface CodeTableInfo {
    // 码表ID
    code_table_code: string
    // 名称
    name: string
    // 英文名
    name_en: string
    // 描述
    description: string
}

export interface CodeTableDetail {
    id: string
    code_table_code: string
    name: string
    name_en: string
    description: string
    catalog_id: string
    status: number
    org_type: number
    authority_id: string
    std_file_code: string
    enums: Array<CodeTableEnums>
    version: string
    catalog_name: string
    create_time: string
    update_time: string
}

// 码表枚举类型
type CodeTableEnums = {
    id: string
    // 码值
    code: string
    // 码值描述
    value: string
    // 说明
    description: string
    dict_id: string
}
