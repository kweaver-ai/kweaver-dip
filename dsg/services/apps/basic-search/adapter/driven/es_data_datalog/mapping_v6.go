package es_data_datalog

const mappingV6 = `
{
    "settings": {
        "max_ngram_diff": 19,
        "analysis": {
            "analyzer": {
                "lower_case_keyword_analyzer": {
                    "type": "custom",
                    "tokenizer": "keyword",
                    "filter": [
                        "lowercase",
                        "as_word_delimiter_graph_filter"
                    ]
                },
                "af_ngram_analyzer": {
                    "tokenizer": "af_ngram_tokenizer",
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
                "af_ngram_tokenizer": {
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
                        "analyzer": "af_ngram_analyzer",
                        "search_analyzer": "lower_case_keyword_analyzer"
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
                        "analyzer": "af_ngram_analyzer",
                        "search_analyzer": "lower_case_keyword_analyzer"
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
                "type": "text",
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
            },
			"info_systems":{
				"type":"nested",
				"properties": {
					"name": {
						"type": "text",
						"fields": {
							"keyword": {
								"type": "text"
							}
						}
					},
					"id": {
						"type": "keyword"
					}
				}
			},
			"business_objects":{
				"type":"nested",
				"properties": {
					"name": {
						"type": "text",
						"fields": {
							"keyword": {
								"type": "text"
							}
						}
					},
					"id": {
						"type": "keyword"
					}
				}
			},
			"data_source_name": {
				"type": "text",
				"fields": {
					"keyword": {
						"type": "text"
					}
				}
			},
			"data_source_id": {
				"type": "keyword",
				"index": false
			},
			"schema_name": {
				"type": "text",
				"fields": {
					"keyword": {
						"type": "text"
					}
				}
			},
			"schema_id": {
				"type": "keyword",
				"index": false
			},
            "owner_id": {
                "type": "keyword",
                "ignore_above": 36,
                "index": false
            },
            "owner_name": {
                "type": "text",
				"fields": {
					"keyword": {
						"type": "text"
					}
				}
            }
		}
    }
}
`
