package es_data_datalog

const mappingV4 = `
{
    "settings": {
        "max_ngram_diff": 19,
        "analysis": {
            "analyzer": {
                "ngram_analyzer": {
                    "tokenizer": "ngram_tokenizer",
                    "filter": [
                        "lowercase"
                    ]
                },
                "as_hanlp_analyzer": {
                    "tokenizer": "as_hanlp",
                    "filter": [
                        "lowercase",
                        "asciifolding"
                    ]
                },
                "graph_analyzer": {
                    "tokenizer": "keyword",
                    "filter": [
                        "lowercase",
                        "asciifolding",
                        "as_word_delimiter_graph_filter"
                    ]
                }
            },
            "tokenizer": {
                "ngram_tokenizer": {
                    "type": "ngram",
                    "min_gram": 1,
                    "max_gram": 20,
                    "token_chars": [
                        "letter",
                        "digit"
                    ]
                },
                "as_hanlp": {
                    "type": "hanlp_index",
                    "enable_stop_dictionary": true,
                    "enable_custom_config": true
                }
            },
            "filter": {
                "as_word_delimiter_graph_filter": {
                    "type": "word_delimiter_graph",
                    "split_on_case_change": false,
                    "split_on_numerics": false,
                    "stem_english_possessive": true
                }
            }
        }
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
                "analyzer": "as_hanlp_analyzer",
                "fields": {
                    "ngram": {
                        "type": "text",
                        "analyzer": "ngram_analyzer",
                        "search_analyzer": "keyword"
                    },
                    "graph": {
                        "type": "text",
                        "analyzer": "graph_analyzer"
                    }
                }
            },
            "description": {
                "type": "text",
                "analyzer": "as_hanlp_analyzer",
                "fields": {
                    "ngram": {
                        "type": "text",
                        "analyzer": "ngram_analyzer",
                        "search_analyzer": "keyword"
                    },
                    "graph": {
                        "type": "text",
                        "analyzer": "graph_analyzer"
                    }
                }
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
