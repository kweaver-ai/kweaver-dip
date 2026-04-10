// 审核状态类型
export type AuditStatus = 'pending' | 'reject' | 'pass' | 'avoid' | 'undone' | 'failed' | 'sendback' | 'transfer';

// 业务类型
export type BizType =
  | 'realname'
  | 'perm'
  | 'owner'
  | 'inherit'
  | 'anonymous'
  | 'sync'
  | 'flow'
  | 'security'
  | 'automation';

// 审核模式
export type AuditType = 'tjsh' | 'hqsh' | 'zjsh';

// 文档类型
export type DocType = 'file' | 'folder';

// 审核记录
export interface AuditRecord {
  id: string;
  biz_id: string;
  biz_type: BizType;
  doc_id: string;
  doc_name: string;
  doc_path: string;
  doc_type: DocType;
  apply_user: string;
  apply_user_id: string;
  apply_user_name: string;
  apply_time: string;
  end_time?: string;
  audit_status: AuditStatus;
  proc_inst_id: string;
  last_auditor?: string;
  last_auditor_id?: string;
  workflow?: WorkflowInfo;
  apply_detail?: ApplyDetail;
}

// 工作流信息
export interface WorkflowInfo {
  abstract_info: {
    text: string;
    icon?: string;
  };
  process_name?: string;
  front_plugin_info?: {
    label?: Record<string, string>;
    entry?: string;
    name?: string;
  };
}

// 申请详情
export interface ApplyDetail {
  process?: Record<string, unknown>;
  data?: Record<string, unknown>;
  workflow?: Record<string, unknown>;
  allow_value?: string;
  deny_value?: string;
  op_type?: string;
  inherit?: boolean;
  accessor_name?: string;
  accessor_id?: string;
  expires_at?: string;
  url_title?: string;
  password?: string;
  access_limit?: number;
  target_path?: string;
  mode?: string;
  remark?: string;
}

// 分页参数
export interface PaginationParams {
  offset: number;
  limit: number;
}

// 查询参数
export interface QueryParams extends PaginationParams {
  type?: string;
  status?: string;
  doc_name?: string;
  biz_id?: string;
  abstracts?: string[];
  apply_user_names?: string[];
}

// 分页响应
export interface PaginatedResponse<T> {
  entries: T[];
  total_count: number;
}

// API 响应
export interface ApiResponse<T> {
  data: T;
  code?: number;
  message?: string;
}

// 用户信息
export interface UserInfo {
  id: string;
  name: string;
  account?: string;
  avatar_url?: string;
  isAppAdmin?: boolean;
}

// 微前端上下文
export interface MicroWidgetProps {
  prefix: string;
  businessDomainID: string;
  config: {
    systemInfo: {
      platform: string;
      location: {
        protocol: string;
        hostname: string;
        port: number;
      };
      realLocation?: {
        protocol: string;
        hostname: string;
        port: number;
        origin?: string;
      };
    };
    getTheme: {
      normal: string;
    };
  };
  history: {
    getBasePath: string;
  };
  language: {
    getLanguage: string;
  };
  token: {
    getToken: {
      access_token: string;
    };
    refreshOauth2Token: () => Promise<{ access_token: string }>;
    onTokenExpired: () => void;
  };
  _qiankun?: {
    loadMicroApp?: (...args: any[]) => any;
  };
}

// 应用上下文
export interface AppContext {
  systemType?: string;
  microWidgetProps?: MicroWidgetProps;
  lang?: string;
  token?: string;
  tenantId?: string;
  applicationType?: string;
  arbitrailyAuditLog?: Record<string, unknown>;
}

// 审核日志
export interface AuditLog {
  id: string;
  task_id: string;
  auditor_id: string;
  auditor_name: string;
  audit_status: AuditStatus;
  audit_time: string;
  remark?: string;
}

// 加签信息
export interface CountersignInfo {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
  remark?: string;
}

// 字典项
export interface DictItem {
  label: string;
  value: string;
  children?: DictItem[];
}

// 字典列表
export interface DictList {
  auditTypes: DictItem[];
  auditStatuss: DictItem[];
  bizTypes: DictItem[];
  docSharePermEnum: { value: string; index: number }[];
}
