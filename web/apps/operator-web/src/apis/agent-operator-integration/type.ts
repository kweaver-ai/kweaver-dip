export interface BoxToolListResponse {
  box_id: string;
  status: 'unpublish' | 'published' | 'offline';
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  tools: ToolInfoNew[];
}

export interface ToolInfoNew {
  tool_id: string;
  name: string;
  description: string;
  status: 'enabled' | 'disabled';
  metadata_type: 'openapi';
  metadata: OpenAPIStruct;
  quota_control?: QuotaControl;
  create_time: number;
  create_user: string;
  update_time: number;
  update_user: string;
  extend_info?: Record<string, any>;
}

export interface OpenAPIStruct {
  summary: string;
  path: string;
  method: string;
  description: string;
  server_url: string;
  api_spec: {
    parameters?: Array<{
      name: string;
      in: 'path' | 'query' | 'header' | 'cookie';
      description: string;
      required: boolean;
      schema: ParameterSchema;
    }>;
    request_body?: {
      description: string;
      required: boolean;
      content: Record<
        string,
        {
          schema: any;
          example: any;
        }
      >;
    };
    responses?: Record<
      string,
      {
        description: string;
        content: Record<
          string,
          {
            schema: any;
            example: any;
          }
        >;
      }
    >;
    schemas?: Record<string, ParameterSchema>;
    security?: Array<{
      securityScheme: 'apiKey' | 'http' | 'oauth2';
    }>;
  };
}

export interface ParameterSchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  format?: 'int32' | 'int64' | 'float' | 'double' | 'byte';
  example?: string;
}

export interface QuotaControl {
  quota_type: 'token' | 'api_key' | 'ip' | 'user' | 'concurrent' | 'rate_limit' | 'none';
  quota_value?: number;
  time_window?: {
    value: number;
    unit: 'second' | 'minute' | 'hour' | 'day';
  };
  overage_policy?: 'reject' | 'queue' | 'log_only';
  burst_capacity?: number;
}

export interface ToolListParams {
  page?: number;
  page_size?: number;
  sort_by?: 'create_time' | 'update_time' | 'name';
  sort_order?: 'asc' | 'desc';
  name?: string;
  status?: 'enabled' | 'disabled';
  user_id?: string;
  all?: boolean;
}

export interface GlobalToolListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  data: ToolInfoNew[];
}

export enum MetadataTypeEnum {
  OpenAPI = 'openapi',
  Function = 'function',
}

export interface FunctionExecuteRequest {
  code?: string; // 函数代码
  event?: object; // 函数事件参数
  dependencies?: FunctionDependency[];
  dependencies_url?: string;
}
export interface FunctionExecuteResponse {
  stdout: string; // 标准输出
  stderr: string; // 标准错误输出
  result: object; // 函数执行结果
  metrics: object; // 函数执行指标
}

export enum AIGenTypeEnum {
  PythonFunctionGenerator = 'python_function_generator',
  MetadataParamGenerator = 'metadata_param_generator',
}

export interface PostAIGenCodeRequest {
  type: AIGenTypeEnum;
  query?: string; // 用户提示词，当type=python_function_generator时必填
  code?: string; // 代码内容，当type=metadata_param_generator时必填
  inputs?: Array<any>; // 参数列表
  outputs?: Array<any>; // 输出参数列表
  stream?: boolean; // 是否流式输出。Default: false
}

export interface PostAIGenCodeResponse {
  // 响应内容; 当type=python_function_generator时，content为函数代码string类型，当type=metadata_param_generator时，content为以下结构
  content: {
    name: string; // 函数名
    description: string; // 函数描述
    use_rule: string; // 使用规则
    inputs: any[]; // 参数列表
    outputs: any[]; // 输出参数列表
  };
}

// 函数依赖库
export interface FunctionDependency {
  name: string; // 依赖库名称
  version: string; // 依赖库版本
}

export interface GetFunctionDependenciesResponse {
  dependencies: FunctionDependency[];
  session_id: string;
}

export interface SearchFunctionDepencyVersionsRequest {
  packageName: string; // 依赖库名称
  pypiRepoUrl?: string; // Pypi源地址，默认 https://pypi.org/simple/
  pythonVersion?: string; // Python版本，默认 3.10
}

export interface SearchFunctionDepencyVersionsResponse {
  package_name: string; // 依赖库名称
  versions: string[]; // 依赖库版本列表
}
