import type { AuditRecord } from '@/types';

export type AuditorLog = {
  auditor: string;
  auditor_name: string;
  audit_status: 'pass' | 'reject' | 'sendback' | null;
  audit_idea?: string | null;
  audit__idea?: string | null;
  end_time?: string | number | Date | null;
  proc_status?: string;
  /** 是否为加签产生的审核员，与 Vue flowLogDetail 一致 */
  countersign?: string;
};

export type TransferLog = {
  transfer_by: string;
  transfer_by_name: string;
  transfer_auditor_name: string;
  reason?: string;
  batch?: number;
};

/** 与 Vue flowLogDetail item.countersign_logs 条目一致 */
export type CountersignLogEntry = {
  countersign_auditor?: string;
  countersign_by_name?: string;
  reason?: string;
  taskDefKey?: string;
};

export type FlowLogNode = {
  act_type: 'startEvent' | 'transferEvent' | 'autoPass' | 'autoReject' | string;
  act_status: '1' | '2' | string;
  act_model?: 'tjsh' | 'hqsh' | 'zjsh' | string;
  act_def_name?: string;
  act_def_key?: string;
  auditor_logs: AuditorLog[][];
  transfer_logs?: TransferLog[];
  transfer_by?: string;
  transfer_by_name?: string;
  transfer_auditor_name?: string;
  reason?: string;
  countersign_logs?: CountersignLogEntry[];
  custom_text?: string;
  custom_title?: string;
  custom_status_cls?: 'green' | 'red' | 'sendback' | 'orange';
};

export type ExtAuditRecord = AuditRecord & {
  audit_msg?: string;
  audit_type?: string;
  apply_user_avatar_url?: string;
  auditors?: {
    id: string;
    name: string;
    account?: string;
    countersign?: string;
  }[];
};

export interface FlowLogDetailProps {
  temp: ExtAuditRecord;
  auditPage?: boolean;
  donePage?: boolean;
  refreshToken?: number;
}
