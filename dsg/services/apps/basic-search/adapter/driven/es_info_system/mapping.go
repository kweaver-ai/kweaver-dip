package es_info_system

type dict map[string]any

var mappingV1 = dict{
	"properties": dict{
		// 信息系统 ID
		"id": dict{
			"type": "keyword",
			// 格式为连字符分隔的 UUID，最长为 36
			"ignore_above": 36,
			// 没有根据信息系统 ID 搜索的场景，所以不需要索引 ID
			"index": false,
		},
		// 更新时间
		"updated_at": dict{
			"type":   "date",
			"format": "rfc3339_lenient",
		},
		"name": dict{
			"type":     "text",
			"analyzer": "as_hanlp_analyzer",
			"fields": dict{
				"ngram": dict{
					"type":            "text",
					"analyzer":        "af_ngram_analyzer",
					"search_analyzer": "lower_case_keyword_analyzer",
				},
				"graph": dict{
					"type":     "text",
					"analyzer": "graph_analyzer",
				},
			},
		},
		"description": dict{
			"type":     "text",
			"analyzer": "as_hanlp_analyzer",
			"fields": dict{
				"ngram": dict{
					"type":            "text",
					"analyzer":        "af_ngram_analyzer",
					"search_analyzer": "lower_case_keyword_analyzer",
				},
				"graph": dict{
					"type":     "text",
					"analyzer": "graph_analyzer",
				},
			},
		},
		"department_id": dict{
			"type": "keyword",
			// 格式为连字符分隔的 UUID，最长为 36
			"ignore_above": 36,
		},
	},
}

var indexV1 = dict{
	"settings": dict{
		"max_ngram_diff": 19,
		"analysis": dict{
			"analyzer": dict{
				"lower_case_keyword_analyzer": dict{
					"type":      "custom",
					"tokenizer": "keyword",
					"filter": []string{
						"lowercase",
						"as_word_delimiter_graph_filter",
					},
				},
				"af_ngram_analyzer": dict{
					"tokenizer": "af_ngram_tokenizer",
					"filter": []string{
						"lowercase",
					},
				},
				"as_hanlp_analyzer": dict{
					"tokenizer": "as_hanlp",
					"filter": []string{
						"lowercase",
						"asciifolding",
					},
				},
				"graph_analyzer": dict{
					"tokenizer": "keyword",
					"filter": []string{
						"lowercase",
						"asciifolding",
						"as_word_delimiter_graph_filter",
					},
				},
			},
			"tokenizer": dict{
				"af_ngram_tokenizer": dict{
					"type":     "ngram",
					"min_gram": 1,
					"max_gram": 20,
					"token_chars": []string{
						"letter",
						"digit",
					},
				},
				"as_hanlp": dict{
					"type":                   "hanlp_index",
					"enable_stop_dictionary": true,
					"enable_custom_config":   true,
				},
			},
			"filter": dict{
				"as_word_delimiter_graph_filter": dict{
					"type":                    "word_delimiter_graph",
					"split_on_case_change":    false,
					"split_on_numerics":       false,
					"stem_english_possessive": true,
				},
			},
		},
	},
	"mappings": mappingV1,
}

// af_info_system_idx_v1
var IndexAFInfoSystemV1 = indexV1
