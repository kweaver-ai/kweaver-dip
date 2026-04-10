import { get } from '@/utils/http';
import type { AuditLog } from '@/types';

const WORKFLOW_REST_PATH = '/api/workflow-rest/v1';

export function fetchLog(id: string) {
  return get<AuditLog[]>(`${WORKFLOW_REST_PATH}/process-instance/${id}/logs`);
}

export function processCategory(tenantId?: string) {
  return get(`${WORKFLOW_REST_PATH}/process-definition/category/list`, {
    params: { tenant_id: tenantId },
  });
}

export function fetchProcessList(params?: { category?: string }) {
  return get(`${WORKFLOW_REST_PATH}/workflow/process/list`, { params });
}

export function fetchProcessDetail(id: string) {
  return get(`${WORKFLOW_REST_PATH}/workflow/process/${id}`);
}
