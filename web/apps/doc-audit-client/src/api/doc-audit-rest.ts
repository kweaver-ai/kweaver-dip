import { del, get, post, put } from '@/utils/http';
import type { QueryParams, UserInfo } from '@/types';

const DOC_AUDIT_REST_PATH = '/api/doc-audit-rest/v1';

// staff
export function getStaffInfo() {
  return get<{ result: UserInfo }>(`${DOC_AUDIT_REST_PATH}/staff/ivuser`);
}

export function searchUsers(keyword: string, params?: { offset?: number; limit?: number }) {
  return get<{ entries: UserInfo[]; total_count: number }>(`${DOC_AUDIT_REST_PATH}/staff/search`, {
    params: { keyword, ...params },
  });
}

export function getUserList(userIds: string[]) {
  return post<UserInfo[]>(`${DOC_AUDIT_REST_PATH}/staff/list`, {
    body: { user_ids: userIds },
  });
}

export function getDepartmentUsers(deptId: string, params?: { offset?: number; limit?: number }) {
  return get<{ entries: UserInfo[]; total_count: number }>(`${DOC_AUDIT_REST_PATH}/staff/department/${deptId}/users`, {
    params,
  });
}

// doc-audit
export function fetchApplyPage(params: QueryParams) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/applys`, { params });
}

export function fetchTodoPage(params: QueryParams) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/tasks`, { params });
}

export function fetchDonePage(params: QueryParams) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/historys`, { params });
}

export function fetchTodoCount() {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/tasks/count`);
}

export function fetchInfo(id: string) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/${id}`);
}

export function getAuditLogs(bizId: string) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/biz/${bizId}`);
}

export function save(data: Record<string, unknown>, bizType: string) {
  return post(`${DOC_AUDIT_REST_PATH}/doc-audit/${bizType}`, { body: data });
}

export function audit(data: {
  id: string;
  task_id?: string;
  audit_idea?: boolean;
  audit_msg?: string;
  attachments?: string[];
}) {
  return put(`${DOC_AUDIT_REST_PATH}/doc-audit`, { body: data });
}

export function sendbackAudit(data: { id: string; target_user_id: string; remark?: string; attachments?: string[] }) {
  return put(`${DOC_AUDIT_REST_PATH}/doc-audit/sendback`, { body: data });
}

export function fetchAuthority(params: { proc_inst_id: string; type: string }) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/authority`, { params });
}

export function fetchDownload(data: { doc_id: string; doc_name: string }) {
  return post(`${DOC_AUDIT_REST_PATH}/document/download`, { body: data });
}

export function fetchDirsList(data: { doc_id: string }) {
  return post(`${DOC_AUDIT_REST_PATH}/document/dirs/list`, { body: data });
}

export function folderdownload(data: { doc_id: string }) {
  return post(`${DOC_AUDIT_REST_PATH}/document/folder/download`, { body: data });
}

export function cancel(applyId: string) {
  return del(`${DOC_AUDIT_REST_PATH}/doc-audit/${applyId}`);
}

export function countersign(
  applyId: string,
  data: {
    task_id?: string;
    reason?: string;
    audit_model?: string;
    auditors: string[];
  }
) {
  return post(`${DOC_AUDIT_REST_PATH}/doc-audit/countersign/${applyId}`, {
    body: data,
  });
}

export function transferAudit(applyId: string, data: { auditor: string; reason?: string }) {
  return post(`${DOC_AUDIT_REST_PATH}/doc-audit/transfer/${applyId}`, {
    body: data,
  });
}

export function countersignList(applyId: string, taskId: string) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/countersign/list/${applyId}/${taskId}`);
}

export function countersignLogs(procInstId: string) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/countersign/logs/${procInstId}`);
}

export function remindAuditors(id: string, data: { auditors: string[]; remark?: string }) {
  return post(`${DOC_AUDIT_REST_PATH}/doc-audit/${id}/reminder`, { body: data });
}

export function getRemindStatus(id: string, isArbitrary = false) {
  return get(`${DOC_AUDIT_REST_PATH}/doc-audit/${id}/reminder-status`, {
    params: { is_arbitrary: isArbitrary },
  });
}

export function processFinished(params: { messageId: string; handlerId: string }) {
  return put(`${DOC_AUDIT_REST_PATH}/doc-audit/to-do-list/${params.messageId}/handler_id`, {
    body: { handlerId: params.handlerId },
  });
}
