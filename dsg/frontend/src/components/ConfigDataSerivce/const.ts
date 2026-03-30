export enum CheckedStatus {
    // 选中
    Checked = 'checked',

    // 半选
    Indeterminated = 'indeterminated',

    // 未选中
    UnChecked = 'unchecked',
}

export const defautData = {
    service_info: {
        category: null,
        department: null,
        description: null,
        developer: null,
        http_method: 'post',
        // interface_type: 'query',
        // market_publish: 'yes',
        // network_region: 'gov_intranet',
        protocol: 'http',
        rate_limiting: 0,
        return_type: 'json',
        // service_instance: 'default_instance',
        service_name: null,
        service_path: null,
        tags: [],
        timeout: 60,
        service_type: 'service_generate',
    },
    service_param: {
        data_catalog: null,
        connection_pool: null,
        data_source: null,
        data_table: null,
        data_table_request_params: [],
        data_table_response_params: [],
        script: null,
        create_model: 'wizard',
        data_source_select_type: 'custom',
    },
    service_response: {
        rules: [],
        page_size: 20,
    },
    service_test: {
        request_example: '',
        response_example: '',
    },
}

export const dataTypeRelation = {
    string: [
        'varchar',
        'char',
        'varbinary',
        'json',
        'date',
        'time',
        'datetime',
        'timestamp',
        'string',
        'timestamp with time zone',
    ],
    int: ['tinyint', 'smallint', 'integer', 'int'],
    long: ['bigint', 'long'],
    float: ['float', 'real', 'number', 'numeric'],
    double: ['double', 'decimal'],
    boolean: ['boolean'],
}

export const SYSTEM_CATEGORY_ID = '00000000-0000-0000-0000-000000000002'

export enum SYSTEM_STATUS {
    REQUIRED = 1,
    NOT_REQUIRED = 0,
    NOT_EXIST = -1,
}
