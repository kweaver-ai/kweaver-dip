{
  "toolbox": {
    "configs": [
      {
        "box_id": "5d75b9df-52b7-4656-8d0b-7aa1022328f8",
        "box_name": "语义理解工具箱",
        "box_desc": "数据语义理解服务RESTful API集合,用于业务对象识别、字段语义补全、数据理解等功能的调用,需要JWT认证信息",
        "box_svc_url": "http://data-semantic-data-semantic-api:8888",
        "status": "published",
        "category_type": "system",
        "category_name": "系统工具",
        "is_internal": false,
        "source": "custom",
        "tools": [
          {
            "tool_id": "223c1091-5fcd-4f75-96d9-4971bc97de17",
            "name": "查询字段语义补全数据",
            "description": "返回指定表单视图的字段语义补全信息",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "18d958c2-68af-4c51-9442-4bf5201f973d",
              "summary": "查询字段语义补全数据",
              "description": "返回指定表单视图的字段语义补全信息",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/fields",
              "method": "GET",
              "create_time": 1772706602161348400,
              "update_time": 1772706602161348400,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  },
                  {
                    "name": "keyword",
                    "in": "query",
                    "description": "关键字搜索",
                    "required": false,
                    "schema": {
                      "type": "string"
                    }
                  },
                  {
                    "name": "only_incomplete",
                    "in": "query",
                    "description": "仅显示未补全的字段",
                    "required": false,
                    "schema": {
                      "type": "boolean"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {},
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "200",
                    "description": "成功返回字段列表",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 0,
                              "type": "integer"
                            },
                            "data": {
                              "$ref": "#/components/schemas/FieldCompletionData"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "FieldCompletionData": {
                      "properties": {
                        "table_description": {
                          "type": "string",
                          "description": "表描述"
                        },
                        "table_info_id": {
                          "type": "string",
                          "description": "表信息ID"
                        },
                        "table_tech_name": {
                          "type": "string",
                          "description": "表技术名称"
                        },
                        "fields": {
                          "description": "字段列表",
                          "items": {
                            "$ref": "#/components/schemas/FieldInfo"
                          },
                          "type": "array"
                        },
                        "table_business_name": {
                          "description": "表业务名称",
                          "type": "string"
                        }
                      },
                      "type": "object"
                    },
                    "FieldInfo": {
                      "properties": {
                        "field_role": {
                          "description": "字段角色: 1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段",
                          "type": "integer"
                        },
                        "field_tech_name": {
                          "type": "string",
                          "description": "字段技术名称"
                        },
                        "field_type": {
                          "type": "string",
                          "description": "字段数据类型"
                        },
                        "form_view_field_id": {
                          "type": "string",
                          "description": "表单视图字段ID"
                        },
                        "op_id": {
                          "description": "临时表数据ID",
                          "type": "string"
                        },
                        "field_business_name": {
                          "type": "string",
                          "description": "字段业务名称"
                        },
                        "field_description": {
                          "type": "string",
                          "description": "字段描述"
                        }
                      },
                      "type": "object",
                      "required": [
                        "id",
                        "form_view_field_id",
                        "field_business_name",
                        "field_tech_name",
                        "field_type",
                        "field_role",
                        "field_description"
                      ]
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "fields"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602162976800,
            "update_time": 1772761225295474400,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "18d958c2-68af-4c51-9442-4bf5201f973d",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "4a7b45b8-6129-4771-b94f-d34814c9badf",
            "name": "健康检查",
            "description": "检查服务健康状态",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "666c0827-5829-40ae-92fb-bfe893d29a87",
              "summary": "健康检查",
              "description": "检查服务健康状态",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/health",
              "method": "GET",
              "create_time": 1772706602165168600,
              "update_time": 1772706602165168600,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [],
                "request_body": {
                  "description": "",
                  "content": {},
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "服务正常",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "status": {
                              "example": "ok",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "health"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602167037700,
            "update_time": 1772761224223457800,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "666c0827-5829-40ae-92fb-bfe893d29a87",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "3f353db8-71d4-4b14-863e-7085320cf394",
            "name": "重新识别业务对象",
            "description": "重新执行业务对象识别,生成新的识别结果",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "1069b55a-0950-4036-b6bf-1f1745b24998",
              "summary": "重新识别业务对象",
              "description": "重新执行业务对象识别,生成新的识别结果",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/business-objects/regenerate",
              "method": "POST",
              "create_time": 1772706602168740000,
              "update_time": 1772706602168740000,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {},
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "重新识别成功",
                    "content": {
                      "application/json": {
                        "schema": {
                          "$ref": "#/components/schemas/StatusResponse"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "StatusResponse": {
                      "type": "object",
                      "properties": {
                        "code": {
                          "type": "integer"
                        },
                        "data": {
                          "type": "object",
                          "properties": {
                            "understand_status": {
                              "enum": [
                                1,
                                2,
                                3,
                                5
                              ],
                              "type": "integer",
                              "description": "理解状态: 1-待理解, 2-待确认, 3-已完成, 5-理解失败"
                            }
                          }
                        }
                      }
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "business-objects"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602170638300,
            "update_time": 1772761222305550800,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "1069b55a-0950-4036-b6bf-1f1745b24998",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "075983f8-7d73-4796-a0bd-ab00577227f5",
            "name": "提交确认理解数据",
            "description": "用户确认理解数据无误后提交,将临时表数据迁移到正式表",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "0d760dfe-330d-4c5a-bb38-09f0d12fe131",
              "summary": "提交确认理解数据",
              "description": "用户确认理解数据无误后提交,将临时表数据迁移到正式表",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/submit",
              "method": "POST",
              "create_time": 1772706602172222000,
              "update_time": 1772706602172222000,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {},
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "提交成功",
                    "content": {
                      "application/json": {
                        "schema": {
                          "$ref": "#/components/schemas/CommonResponse"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "CommonResponse": {
                      "type": "object",
                      "properties": {
                        "code": {
                          "type": "integer",
                          "description": "响应码,0表示成功"
                        },
                        "data": {
                          "type": "object",
                          "description": "响应数据"
                        },
                        "message": {
                          "type": "string",
                          "description": "响应消息"
                        }
                      }
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "understanding"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602174115800,
            "update_time": 1772761223028076300,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "0d760dfe-330d-4c5a-bb38-09f0d12fe131",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "305877d5-04a8-422c-aca2-0e6a4e4ece22",
            "name": "一键生成理解数据",
            "description": "调用AI模型一键生成字段语义补全数据",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "0b8c023f-6364-4e93-a7b8-375040fdffb7",
              "summary": "一键生成理解数据",
              "description": "调用AI模型一键生成字段语义补全数据",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/generate",
              "method": "POST",
              "create_time": 1772706602175877400,
              "update_time": 1772706602175877400,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/GenerateUnderstandingRequest"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "生成成功",
                    "content": {
                      "application/json": {
                        "schema": {
                          "$ref": "#/components/schemas/StatusResponse"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "GenerateUnderstandingRequest": {
                      "type": "object",
                      "properties": {
                        "fields": {
                          "description": "字段选择列表(可选,不传则全部理解)",
                          "items": {
                            "type": "object",
                            "required": [
                              "form_view_field_id",
                              "field_tech_name",
                              "field_type",
                              "field_business_name",
                              "field_role",
                              "field_description"
                            ],
                            "properties": {
                              "form_view_field_id": {
                                "type": "string"
                              },
                              "field_business_name": {
                                "type": "string"
                              },
                              "field_description": {
                                "type": "string"
                              },
                              "field_role": {
                                "type": "integer"
                              },
                              "field_tech_name": {
                                "type": "string"
                              },
                              "field_type": {
                                "type": "string"
                              }
                            }
                          },
                          "type": "array"
                        }
                      }
                    },
                    "StatusResponse": {
                      "properties": {
                        "data": {
                          "type": "object",
                          "properties": {
                            "understand_status": {
                              "description": "理解状态: 1-待理解, 2-待确认, 3-已完成, 5-理解失败",
                              "enum": [
                                1,
                                2,
                                3,
                                5
                              ],
                              "type": "integer"
                            }
                          }
                        },
                        "code": {
                          "type": "integer"
                        }
                      },
                      "type": "object"
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "understanding"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602177826800,
            "update_time": 1772761220692827600,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "0b8c023f-6364-4e93-a7b8-375040fdffb7",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "309d1f2f-36b0-4d43-861c-d62fc3633d01",
            "name": "删除识别结果",
            "description": "删除指定表单视图的业务对象识别结果",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "1e92a5b0-b4ba-4c88-9c46-3fa63e7bb28f",
              "summary": "删除识别结果",
              "description": "删除指定表单视图的业务对象识别结果",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/business-objects",
              "method": "DELETE",
              "create_time": 1772706602179307500,
              "update_time": 1772706602179307500,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {},
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "删除成功",
                    "content": {
                      "application/json": {
                        "schema": {
                          "$ref": "#/components/schemas/CommonResponse"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "CommonResponse": {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "object",
                          "description": "响应数据"
                        },
                        "message": {
                          "type": "string",
                          "description": "响应消息"
                        },
                        "code": {
                          "type": "integer",
                          "description": "响应码,0表示成功"
                        }
                      }
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "business-objects"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602181014000,
            "update_time": 1772761219896322600,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "1e92a5b0-b4ba-4c88-9c46-3fa63e7bb28f",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "6cf85ca0-f430-4c0c-9300-6df836d3c444",
            "name": "查询业务对象识别结果",
            "description": "返回指定表单视图的业务对象识别结果列表,包含已识别的业务对象和未识别的字段",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "9df537a5-96a1-4792-993e-72ffaadc5553",
              "summary": "查询业务对象识别结果",
              "description": "返回指定表单视图的业务对象识别结果列表,包含已识别的业务对象和未识别的字段",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/business-objects",
              "method": "GET",
              "create_time": 1772706602182608600,
              "update_time": 1772706602182608600,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "12345678-1234-1234-1234-123456789012"
                  },
                  {
                    "name": "op_id",
                    "in": "query",
                    "description": "业务对象ID过滤",
                    "required": false,
                    "schema": {
                      "type": "string"
                    },
                    "example": "87654321-4321-4321-4321-210987654321"
                  },
                  {
                    "name": "keyword",
                    "in": "query",
                    "description": "关键字搜索",
                    "required": false,
                    "schema": {
                      "type": "string"
                    },
                    "example": "用户"
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {},
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "成功返回业务对象列表",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "description": "响应码",
                              "example": 0,
                              "type": "integer"
                            },
                            "data": {
                              "properties": {
                                "list": {
                                  "description": "业务对象列表",
                                  "items": {
                                    "$ref": "#/components/schemas/BusinessObject"
                                  },
                                  "type": "array"
                                },
                                "unidentified_fields": {
                                  "description": "未识别字段列表",
                                  "items": {
                                    "$ref": "#/components/schemas/UnidentifiedField"
                                  },
                                  "type": "array"
                                }
                              },
                              "type": "object"
                            },
                            "message": {
                              "description": "响应消息",
                              "example": "success",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "500",
                    "description": "内部服务器错误",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 500,
                              "type": "integer"
                            },
                            "message": {
                              "example": "internal server error",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "BusinessObject": {
                      "type": "object",
                      "required": [
                        "id",
                        "object_name",
                        "attributes"
                      ],
                      "properties": {
                        "object_name": {
                          "type": "string",
                          "description": "业务对象名称"
                        },
                        "attributes": {
                          "type": "array",
                          "description": "属性列表",
                          "items": {
                            "$ref": "#/components/schemas/BusinessAttribute"
                          }
                        },
                        "op_id": {
                          "type": "string",
                          "format": "uuid",
                          "description": "业务对象ID"
                        }
                      }
                    },
                    "BusinessAttribute": {
                      "type": "object",
                      "required": [
                        "id",
                        "attr_name",
                        "form_view_field_id",
                        "field_tech_name",
                        "field_business_name",
                        "field_role",
                        "field_type"
                      ],
                      "properties": {
                        "form_view_field_id": {
                          "description": "表单视图字段ID",
                          "type": "string"
                        },
                        "op_id": {
                          "type": "string",
                          "format": "uuid",
                          "description": "属性ID"
                        },
                        "attr_name": {
                          "description": "属性名称",
                          "type": "string"
                        },
                        "description": {
                          "type": "string",
                          "description": "属性描述"
                        },
                        "field_business_name": {
                          "description": "字段业务名称",
                          "type": "string"
                        },
                        "field_role": {
                          "type": "integer",
                          "description": "字段角色: 1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段",
                          "enum": [
                            1,
                            2,
                            3,
                            4,
                            5,
                            6,
                            7,
                            8
                          ]
                        },
                        "field_tech_name": {
                          "type": "string",
                          "description": "字段技术名称"
                        },
                        "field_type": {
                          "type": "string",
                          "description": "字段数据类型",
                          "enum": [
                            "string",
                            "int",
                            "bigint",
                            "float",
                            "double",
                            "decimal",
                            "datetime",
                            "date",
                            "boolean",
                            "text"
                          ]
                        }
                      }
                    },
                    "UnidentifiedField": {
                      "properties": {
                        "field_role": {
                          "type": "integer",
                          "description": "字段角色"
                        },
                        "op_id": {
                          "type": "string",
                          "format": "uuid",
                          "description": "临时表数据ID"
                        },
                        "technical_name": {
                          "description": "字段技术名称",
                          "type": "string"
                        },
                        "business_name": {
                          "type": "string",
                          "description": "字段业务名称"
                        },
                        "data_type": {
                          "type": "string",
                          "description": "字段数据类型"
                        },
                        "description": {
                          "type": "string",
                          "description": "字段描述"
                        }
                      },
                      "type": "object",
                      "required": [
                        "id",
                        "technical_name",
                        "data_type"
                      ]
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "business-objects"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602184838100,
            "update_time": 1772761218844445400,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "9df537a5-96a1-4792-993e-72ffaadc5553",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "47e3e4c0-faf3-457f-8b41-86575739b095",
            "name": "保存业务对象及属性",
            "description": "保存用户编辑的业务对象或属性名称",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "ce5987fe-2e19-42b4-a3a6-83ccf332a4ec",
              "summary": "保存业务对象及属性",
              "description": "保存用户编辑的业务对象或属性名称",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/business-objects",
              "method": "PUT",
              "create_time": 1772706602186936800,
              "update_time": 1772706602186936800,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/SaveBusinessObjectRequest"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "保存成功",
                    "content": {
                      "application/json": {
                        "schema": {
                          "$ref": "#/components/schemas/CommonResponse"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "CommonResponse": {
                      "properties": {
                        "data": {
                          "type": "object",
                          "description": "响应数据"
                        },
                        "message": {
                          "type": "string",
                          "description": "响应消息"
                        },
                        "code": {
                          "type": "integer",
                          "description": "响应码,0表示成功"
                        }
                      },
                      "type": "object"
                    },
                    "SaveBusinessObjectRequest": {
                      "type": "object",
                      "required": [
                        "type",
                        "op_id",
                        "name"
                      ],
                      "properties": {
                        "op_id": {
                          "type": "string",
                          "description": "数据ID(临时表)"
                        },
                        "name": {
                          "description": "业务对象/属性名称",
                          "type": "string"
                        },
                        "type": {
                          "type": "string",
                          "description": "保存类型: object-业务对象, attribute-业务属性",
                          "enum": [
                            "object",
                            "attribute"
                          ]
                        }
                      }
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "business-objects"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602188604200,
            "update_time": 1772761217517246500,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "ce5987fe-2e19-42b4-a3a6-83ccf332a4ec",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "7054bb7e-c083-4156-838c-985703c9003c",
            "name": "调整属性归属业务对象",
            "description": "将指定属性移动到另一个业务对象下",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "95b94c8b-ae07-4e74-8ab0-442bee046924",
              "summary": "调整属性归属业务对象",
              "description": "将指定属性移动到另一个业务对象下",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/business-objects/attributes/move",
              "method": "PUT",
              "create_time": 1772706602190071300,
              "update_time": 1772706602190071300,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/MoveAttributeRequest"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "移动成功",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 0,
                              "type": "integer"
                            },
                            "data": {
                              "properties": {
                                "attribute_id": {
                                  "type": "string"
                                },
                                "business_op_id": {
                                  "type": "string"
                                }
                              },
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "MoveAttributeRequest": {
                      "required": [
                        "attribute_id",
                        "target_object_uuid"
                      ],
                      "properties": {
                        "attribute_id": {
                          "type": "string",
                          "description": "属性ID"
                        },
                        "target_object_uuid": {
                          "description": "目标业务对象ID",
                          "type": "string"
                        }
                      },
                      "type": "object"
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "business-objects"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602191537400,
            "update_time": 1772761216905444400,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "95b94c8b-ae07-4e74-8ab0-442bee046924",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "20beda13-f62a-4e5c-8b29-ab1abbf5127c",
            "name": "保存库表信息补全数据",
            "description": "保存用户编辑的表信息和字段信息",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "3a0f85d1-9622-4206-aebe-9e6e753d48f2",
              "summary": "保存库表信息补全数据",
              "description": "保存用户编辑的表信息和字段信息",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/semantic-info",
              "method": "PUT",
              "create_time": 1772706602194154500,
              "update_time": 1772706602194154500,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "schema": {
                        "$ref": "#/components/schemas/SaveSemanticInfoRequest"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "保存成功",
                    "content": {
                      "application/json": {
                        "schema": {
                          "$ref": "#/components/schemas/CommonResponse"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "SaveSemanticInfoRequest": {
                      "type": "object",
                      "properties": {
                        "tableData": {
                          "description": "表信息补全数据(包含ID、业务名称、描述)",
                          "type": "object",
                          "required": [
                            "op_id",
                            "table_business_name",
                            "table_description"
                          ],
                          "properties": {
                            "op_id": {
                              "type": "string",
                              "description": "临时表数据ID"
                            },
                            "table_business_name": {
                              "type": "string",
                              "description": "表业务名称"
                            },
                            "table_description": {
                              "type": "string",
                              "description": "表描述"
                            }
                          }
                        },
                        "fieldData": {
                          "description": "字段信息补全数据(包含ID、业务名称、角色、描述)",
                          "type": "object",
                          "required": [
                            "op_id",
                            "field_business_name",
                            "field_role",
                            "field_description"
                          ],
                          "properties": {
                            "op_id": {
                              "type": "string",
                              "description": "临时表数据ID"
                            },
                            "field_business_name": {
                              "type": "string",
                              "description": "字段业务名称"
                            },
                            "field_role": {
                              "type": "integer",
                              "description": "字段角色: 1-业务主键, 2-关联标识, 3-业务状态, 4-时间字段, 5-业务指标, 6-业务特征, 7-审计字段, 8-技术字段"
                            },
                            "field_description": {
                              "type": "string",
                              "description": "字段描述"
                            }
                          }
                        }
                      }
                    },
                    "CommonResponse": {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "object",
                          "description": "响应数据"
                        },
                        "message": {
                          "type": "string",
                          "description": "响应消息"
                        },
                        "code": {
                          "type": "integer",
                          "description": "响应码,0表示成功"
                        }
                      }
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "understanding"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602200135200,
            "update_time": 1772761216355532300,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "3a0f85d1-9622-4206-aebe-9e6e753d48f2",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "4784793c-5b9f-4dc7-89aa-a979add5ace2",
            "name": "查询库表理解状态",
            "description": "返回指定表单视图的数据理解状态",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "fafbe98b-abe4-4652-8bdd-ac6b4372135d",
              "summary": "查询库表理解状态",
              "description": "返回指定表单视图的数据理解状态",
              "server_url": "http://data-semantic-data-semantic-api:8888",
              "path": "/api/data-semantic/v1/{id}/status",
              "method": "GET",
              "create_time": 1772706602201726500,
              "update_time": 1772706602201726500,
              "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
              "api_spec": {
                "parameters": [
                  {
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT认证令牌,格式: Bearer {token}",
                    "required": true,
                    "schema": {
                      "type": "string"
                    },
                    "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  },
                  {
                    "name": "id",
                    "in": "path",
                    "description": "表单视图ID",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {},
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "401",
                    "description": "未授权",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "code": {
                              "example": 401,
                              "type": "integer"
                            },
                            "message": {
                              "example": "unauthorized",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "200",
                    "description": "成功返回状态",
                    "content": {
                      "application/json": {
                        "schema": {
                          "$ref": "#/components/schemas/StatusResponse"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {
                    "StatusResponse": {
                      "type": "object",
                      "properties": {
                        "code": {
                          "type": "integer"
                        },
                        "data": {
                          "type": "object",
                          "properties": {
                            "understand_status": {
                              "enum": [
                                1,
                                2,
                                3,
                                5
                              ],
                              "type": "integer",
                              "description": "理解状态: 1-待理解, 2-待确认, 3-已完成, 5-理解失败"
                            }
                          }
                        }
                      }
                    }
                  }
                },
                "callbacks": null,
                "security": null,
                "tags": [
                  "understanding"
                ],
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1772706602203638000,
            "update_time": 1772761215706660600,
            "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "fafbe98b-abe4-4652-8bdd-ac6b4372135d",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          }
        ],
        "create_time": 1772706602159324200,
        "update_time": 1772761240730352000,
        "create_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
        "update_user": "08f73f14-bab9-11f0-9fb4-0665e7126b0c",
        "metadata_type": "openapi"
      }
    ]
  }
}