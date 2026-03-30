package es_data_datalog

const mappingV1 = `
{
    "aliases": {
        "af_data_catalog_idx": {}
    },
    "mappings": {
        "properties": {
            "id": {
                "type": "keyword",
                "ignore_above": 36,
                "index": false
            },
            "code": {
                "type": "keyword",
                "ignore_above": 256,
                "index": false,
                "doc_values": false
            },
            "title": {
                "type": "text",
                "analyzer": "ik_max_word",
                "search_analyzer": "ik_smart"
            },
            "description": {
                "type": "text",
                "analyzer": "ik_max_word",
                "search_analyzer": "ik_smart"
            },
            "data_kind": {
                "type": "long"
            },
            "data_range": {
                "type": "long"
            },
            "update_cycle": {
                "type": "long"
            },
            "shared_type": {
                "type": "long"
            },
            "orgcode": {
                "type": "keyword",
                "ignore_above": 36,
                "doc_values": false
            },
            "orgname": {
                "type": "keyword",
                "ignore_above": 128,
                "index": false,
                "doc_values": false
            },
            "group_id": {
                "type": "keyword",
                "ignore_above": 36,
                "doc_values": false
            },
            "data_updated_at": {
                "type": "date",
                "format": "strict_date_optional_time||epoch_millis"
            },
            "published_at": {
                "type": "date",
                "format": "strict_date_optional_time||epoch_millis"
            },
            "table_id": {
                "type": "keyword",
                "ignore_above": 36,
                "doc_values": false
            },
            "table_rows": {
                "type": "long",
                "index": false
            }
        }
    }
}
`
