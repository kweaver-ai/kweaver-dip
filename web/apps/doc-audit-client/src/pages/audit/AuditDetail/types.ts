export interface AuditDetailProps {
  id: string;
  auditStatus?: string;
  inDrawer?: boolean;
  applyPage?: boolean;
  donePage?: boolean;
  doneStatus?: string;
  onAuditResult?: () => void;
  onClose?: () => void;
}

export type ProcAuditor = { auditor?: string };

export type ProcTransferLog = { transfer_by?: string };

export type ProcLogForAction = {
  act_status?: string;
  act_def_key?: string;
  auditor_logs?: ProcAuditor[][];
  transfer_logs?: ProcTransferLog[];
};

export type PickedAuditor = {
  userid: string;
  name: string;
  avatar_url?: string;
  status?: string;
};
