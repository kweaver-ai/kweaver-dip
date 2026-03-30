export const defautData = {
    service_info: {
        category: null,
        department: null,
        description: null,
        developer: null,
        file: null,
        http_method: 'post',
        // market_publish: 'yes',
        protocol: 'http',
        rate_limiting: 0,
        return_type: 'json',
        service_name: null,
        service_path: null,
        backend_service_host: null,
        backend_service_path: null,
        tags: [],
        timeout: 60,
        service_type: 'service_register',
    },
    service_param: {
        data_table_request_params: [],
        data_table_response_params: [],
    },
    service_response: {
        rules: [],
        page_size: 1000,
    },
    service_test: {
        request_example: '',
        response_example: '',
    },
}

export const defaultTableRequestParams = {
    cn_name: null,
    en_name: null,
    description: null,
    data_type: null,
    required: 'yes',
    default_value: null,
}

export const defaultTableResponseParams = {
    cn_name: null,
    en_name: null,
    description: null,
    data_type: null,
    sort: 'unsorted',
}
