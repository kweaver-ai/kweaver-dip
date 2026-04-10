import type { AuditRecord } from '@/types';
import type { AuditListMode } from '../types';

export interface AuditListProps {
  mode: AuditListMode;
  onRefresh?: () => void;
}

export type StatusFilter = '' | 'pending' | 'reject' | 'pass' | 'undone' | 'transfer' | 'sendback';

export type ListRecord = AuditRecord & {
  end_time?: string;
  last_auditor?: string;
  last_auditor_id?: string;
  result?: string;
  strategy_configs?: {
    audit_idea_config?: {
      audit_idea_switch?: boolean;
      status?: string;
    };
  };
  auditors?: Array<{
    id?: string;
    name?: string;
    status?: string;
  }> | null;
};
