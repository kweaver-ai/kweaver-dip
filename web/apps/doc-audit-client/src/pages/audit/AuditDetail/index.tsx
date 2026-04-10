import { useState, useEffect, useRef } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Spin, Button, Space, Modal, message, Dropdown, Input, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getConfig } from '@/utils/http';
import {
  fetchInfo,
  audit,
  sendbackAudit,
  transferAudit,
  countersign,
  countersignLogs,
  fetchAuthority,
  cancel,
  getRemindStatus,
  remindAuditors,
  searchUsers,
} from '@/api/doc-audit-rest';
import type { AuditRecord } from '@/types';
import { useAppStore, useDictStore, getBizTypeLabel } from '@/store';
import { UserAvatarName } from '@/components';
import styles from './index.module.less';
import { t } from '@/i18n';
import FlowLogDetail from '../FlowLogDetail';
import { loadMicroApp } from 'qiankun';
import { processCategory, fetchLog } from '@/api/workflow-rest';
import { getBizTypeColumnText } from '@/utils/biz-type';
import type { AuditDetailProps, PickedAuditor, ProcLogForAction } from './types';
import TransferIcon from '@/assets/transfer.svg';
import CountersignIcon from '@/assets/countersign.svg';
import SendbackIcon from '@/assets/sendback.svg';
import StampPassZh from '@/assets/stamp_pass_zh.svg';
import StampPassTw from '@/assets/stamp_pass_tw.svg';
import StampPassEn from '@/assets/stamp_pass_en.svg';
import StampRejectZh from '@/assets/stamp_reject_zh.svg';
import StampRejectTw from '@/assets/stamp_reject_tw.svg';
import StampRejectEn from '@/assets/stamp_reject_en.svg';
import StampUndoZh from '@/assets/stamp_undo_zh.svg';
import StampUndoTw from '@/assets/stamp_undo_tw.svg';
import StampUndoEn from '@/assets/stamp_undo_en.svg';
import { selectUser } from '@/utils/user';

/** 与 doc-audit-client detail.vue checkTransferBtn 一致 */
function checkTransferBtn(
  customDescription: Record<string, unknown> | undefined,
  procLogs: Array<{ act_status?: string; transfer_logs?: unknown[] }>
): boolean {
  if (!customDescription?.transfer) {
    return false;
  }
  const transfer = customDescription.transfer as {
    transferSwitch?: string;
    maxCount?: string | number;
  };
  if (transfer.transferSwitch !== 'Y') {
    return false;
  }
  let showTransferBtn = false;
  procLogs.forEach(log => {
    if (customDescription && log.act_status === '1') {
      const currentTransferArr = log.transfer_logs ?? [];
      const maxCount = transfer.maxCount;
      if (currentTransferArr.length > 0 && currentTransferArr.length >= parseInt(String(maxCount), 10)) {
        showTransferBtn = false;
      } else {
        showTransferBtn = true;
      }
    }
  });
  return showTransferBtn;
}

const AuditDetail: React.FC<AuditDetailProps> = ({
  id,
  auditStatus = '',
  inDrawer = false,
  applyPage = false,
  donePage = false,
  doneStatus = '',
  onAuditResult,
}) => {
  const { microWidgetProps, context, lang } = useAppStore();
  const { dictList } = useDictStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [auditRemark, setAuditRemark] = useState('');
  const [opRemark, setOpRemark] = useState('');
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditType, setAuditType] = useState<'pass' | 'reject'>('pass');
  const [microAppLoading, setMicroAppLoading] = useState(false);
  const [enableFlow, setEnableFlow] = useState(false);
  const [detail, setDetail] = useState<AuditRecord | null>(null);
  /** 流程日志：用于与 Vue 版一致的转审按钮展示判断（transfer_logs / maxCount） */
  const [procLogsForTransfer, setProcLogsForTransfer] = useState<ProcLogForAction[] | null>(null);
  const [showCountersignBtn, setShowCountersignBtn] = useState(false);
  const [showTransferBtn, setShowTransferBtn] = useState(false);
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [opType, setOpType] = useState<'transfer' | 'countersign' | 'sendback'>('transfer');
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string; name: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [transferAuditors, setTransferAuditors] = useState<PickedAuditor[]>([]);
  const [countersignAuditors, setCountersignAuditors] = useState<PickedAuditor[]>([]);
  /** 加签：超出可添加人数时的红色提示（显示在备注 TextArea 下方） */
  const [countersignLimitError, setCountersignLimitError] = useState('');
  const [remindModalOpen, setRemindModalOpen] = useState(false);
  const [remindRemark, setRemindRemark] = useState('');
  const [remindCandidates, setRemindCandidates] = useState<PickedAuditor[]>([]);
  const [selectedRemindAuditorIds, setSelectedRemindAuditorIds] = useState<string[]>([]);
  const [flowLogRefreshToken, setFlowLogRefreshToken] = useState(0);
  const [opAttachments, setOpAttachments] = useState<
    Array<{ docid: string; name: string; doc_type?: 'file' | 'folder' }>
  >([]);
  const auditDetailMicroAppRef = useRef<{ unmount: () => void } | null>(null);
  const auditViewportRef = useRef<HTMLDivElement | null>(null);
  const drawerAuditViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id, auditStatus]);

  useEffect(() => {
    if (!detail?.proc_inst_id) {
      setProcLogsForTransfer(null);
      return;
    }
    if (detail.audit_status === 'avoid' || detail.audit_status === 'failed') {
      setProcLogsForTransfer(null);
      return;
    }
    let cancelled = false;
    void fetchLog(detail.proc_inst_id)
      .then((raw: unknown) => {
        if (!cancelled) {
          setProcLogsForTransfer(Array.isArray(raw) ? raw : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProcLogsForTransfer([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.id, detail?.proc_inst_id, detail?.audit_status]);

  useEffect(() => {
    const customDesc = (detail as AuditRecord & { customDescription?: Record<string, unknown> })?.customDescription;
    if (
      !detail?.proc_inst_id ||
      !customDesc ||
      customDesc.countersign_switch !== 'Y' ||
      !Array.isArray(procLogsForTransfer)
    ) {
      setShowCountersignBtn(false);
      return;
    }

    const maxAuditors = Number(customDesc.max_auditors ?? 0);
    const maxCount = Number(customDesc.max_count ?? 0);
    const activeLogs = procLogsForTransfer.filter(l => l.act_status === '1');
    if (activeLogs.length === 0) {
      setShowCountersignBtn(false);
      return;
    }

    let cancelled = false;
    void countersignLogs(detail.proc_inst_id)
      .then((logsRaw: unknown) => {
        if (cancelled) return;
        const csLogs = Array.isArray(logsRaw) ? logsRaw : [];
        let canShow = false;
        activeLogs.forEach(log => {
          const currentActCountersignArr = csLogs.filter(
            (item: Record<string, unknown>) => String(item.taskDefKey ?? '') === String(log.act_def_key ?? '')
          );
          const firstBatch = currentActCountersignArr[0] as { batch?: string | number } | undefined;
          if (currentActCountersignArr.length > 0 && firstBatch != null && maxCount === Number(firstBatch.batch)) {
            canShow = false;
            return;
          }
          if (maxAuditors === currentActCountersignArr.length) {
            canShow = false;
            return;
          }
          canShow = true;
        });
        setShowCountersignBtn(canShow);
      })
      .catch(() => {
        if (!cancelled) setShowCountersignBtn(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detail, procLogsForTransfer]);

  useEffect(() => {
    const customDesc = (detail as AuditRecord & { customDescription?: Record<string, unknown> })?.customDescription;
    if (!customDesc || !Array.isArray(procLogsForTransfer)) {
      setShowTransferBtn(false);
      return;
    }
    setShowTransferBtn(checkTransferBtn(customDesc, procLogsForTransfer));
  }, [detail, procLogsForTransfer]);

  useEffect(() => {
    return () => {
      if (auditDetailMicroAppRef.current) {
        auditDetailMicroAppRef.current.unmount();
        auditDetailMicroAppRef.current = null;
      }
    };
  }, []);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetchInfo(id);
      setDetail(res);
    } catch (error) {
      console.error('Failed to load detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureTaskValid = async () => {
    if (!detail?.proc_inst_id) return false;
    try {
      const result = (await fetchAuthority({
        proc_inst_id: detail.proc_inst_id,
        type: 'task',
      })) as { result?: boolean };
      if (!result?.result) {
        message.warning(t('message.taskNotPrem'));
        onAuditResult?.();
        return false;
      }
      return true;
    } catch {
      message.warning(t('message.taskNotPrem'));
      onAuditResult?.();
      return false;
    }
  };

  const refreshTaskAuditors = async () => {
    if (!detail?.proc_inst_id) return;
    try {
      const authority = (await fetchAuthority({
        proc_inst_id: detail.proc_inst_id,
        type: 'task',
      })) as {
        result?: boolean;
        audit_status?: string;
        auditors?: Array<{ id?: string; name?: string; countersign?: string }>;
      };
      if (authority?.result) {
        setDetail(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            audit_status: authority.audit_status || prev.audit_status,
            auditors:
              (authority.auditors as (AuditRecord & {
                auditors?: unknown;
              })['auditors']) ?? (prev as AuditRecord & { auditors?: unknown }).auditors,
          } as AuditRecord;
        });
      }
    } catch {
      // Ignore authority refresh failure; keep current detail state.
    }
  };

  const ensureApplyValid = async () => {
    if (!detail?.proc_inst_id) return false;
    try {
      const result = (await fetchAuthority({
        proc_inst_id: detail.proc_inst_id,
        type: 'apply',
      })) as { result?: boolean };
      if (!result?.result) {
        message.warning(t('message.taskNotPrem'));
        onAuditResult?.();
        return false;
      }
      return true;
    } catch {
      message.warning(t('message.taskNotPrem'));
      onAuditResult?.();
      return false;
    }
  };

  const handleRemind = async () => {
    if (!detail) return;

    try {
      const valid = await ensureApplyValid();
      if (!valid) return;
      const remindStatus = (await getRemindStatus(detail.id)) as {
        status?: boolean;
      };
      if (remindStatus?.status) {
        message.info(t('common.detail.remind.waitInfo'));
        return;
      }
      setSubmitting(true);
      const detailWithAuditors = detail as AuditRecord & {
        audit_type?: string;
        auditors?: Array<{ id?: string; name?: string; status?: string }>;
      };
      let pendingAuditors = (detailWithAuditors.auditors || [])
        .filter(item => item.status === 'pending')
        .map(item => ({
          userid: String(item.id || ''),
          name: String(item.name || ''),
          status: String(item.status || ''),
        }))
        .filter(item => item.userid && item.name);
      if (detailWithAuditors.audit_type === 'zjsh') {
        pendingAuditors = pendingAuditors.length > 0 ? [pendingAuditors[0]] : [];
      }
      if (pendingAuditors.length === 0) {
        message.info(t('common.detail.remind.taskProcessed'));
        return;
      }
      setRemindCandidates(pendingAuditors);
      setSelectedRemindAuditorIds(pendingAuditors.map(item => item.userid));
      setRemindRemark('');
      setRemindModalOpen(true);
    } catch (error) {
      const err = error as { response?: { data?: { code?: number } } };
      if (err.response?.data?.code === 403057004) {
        message.info(t('common.detail.remind.taskProcessed'));
        onAuditResult?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitRemind = async () => {
    if (!detail || selectedRemindAuditorIds.length === 0) return;
    setSubmitting(true);
    try {
      await remindAuditors(detail.id, {
        auditors: selectedRemindAuditorIds,
        remark: remindRemark,
      });
      message.success(t('common.detail.remind.successInfo'));
      setRemindModalOpen(false);
    } catch (error) {
      const err = error as { response?: { data?: { code?: number } } };
      const code = err.response?.data?.code;
      switch (code) {
        case 403057001:
        case 403057003:
        case 403057011:
          message.info(t('common.detail.remind.userProcessed'));
          setRemindModalOpen(false);
          onAuditResult?.();
          break;
        case 403057002:
          message.info(t('common.detail.remind.waitInfo'));
          setRemindModalOpen(false);
          break;
        case 403057004:
          message.info(t('common.detail.remind.taskProcessed'));
          setRemindModalOpen(false);
          onAuditResult?.();
          break;
        case 400057001:
        case 400:
          message.warning(t('invalidParams'));
          break;
        default:
          message.warning(t('message.networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = () => {
    if (!detail) return;
    Modal.confirm({
      title: t('common.detail.auditMsg.title'),
      content: getRevokeConfirmContent(),
      centered: true,
      maskClosable: false,
      okText: t('common.detail.auditMsg.confirm'),
      cancelText: t('common.detail.auditMsg.cancel'),
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      ),
      onOk: async () => {
        setSubmitting(true);
        try {
          await cancel(detail.biz_id);
          message.success(t('common.detail.revokeMsg.confirmMSg'));
          onAuditResult?.();
        } catch (error) {
          const code = extractErrorCode(error);
          if (code === 401001101) {
            Modal.error({
              title: t('message.UndoFailed'),
              content: t('message.UndoFailedNotTask'),
              centered: true,
              onOk: () => {
                onAuditResult?.();
              },
            });
          } else {
            message.error(t('message.UndoFailed'));
          }
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleSearchUsers = async (keyword: string) => {
    if (!keyword) {
      setUserOptions([]);
      return;
    }
    try {
      const res = (await searchUsers(keyword, { offset: 0, limit: 20 })) as {
        entries?: Array<{ id: string; name: string; account?: string }>;
      };
      const options = (res.entries || []).map(user => ({
        value: user.id,
        label: user.account ? `${user.name}(${user.account})` : user.name,
        name: user.name,
      }));
      setUserOptions(options);
    } catch {
      setUserOptions([]);
    }
  };

  const openAuditModal = (type: 'pass' | 'reject') => {
    setAuditType(type);
    setAuditRemark('');
    setAuditModalOpen(true);
  };

  const submitAudit = async () => {
    if (!detail) return;
    const detailWithStrategy = detail as AuditRecord & {
      strategy_configs?: {
        audit_idea_config?: {
          audit_idea_switch?: boolean;
          status?: string;
        };
      };
    };
    const auditIdeaConfig = detailWithStrategy.strategy_configs?.audit_idea_config;
    const isAuditCommentRequired = Boolean(
      auditIdeaConfig?.audit_idea_switch === true &&
        (auditIdeaConfig.status === '2' || (auditIdeaConfig.status === '1' && auditType === 'reject'))
    );
    if (isAuditCommentRequired && !auditRemark.trim()) {
      message.warning(t('message.emptyIdea'));
      return;
    }
    if (!(await ensureTaskValid())) {
      setAuditModalOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      const detailWithTask = detail as AuditRecord & { task_id?: string };
      await audit({
        id: detail.id,
        task_id: detailWithTask.task_id,
        audit_idea: auditType === 'pass',
        audit_msg: auditRemark || '',
        attachments: [],
      });
      message.success(t('message.approved'));
      setAuditModalOpen(false);
      onAuditResult?.();
    } catch (error) {
      console.error('Audit failed:', error);
      message.error(t('message.submitErr'));
    } finally {
      setSubmitting(false);
    }
  };

  const openMoreOperation = (type: 'transfer' | 'countersign' | 'sendback') => {
    setOpType(type);
    setOpRemark('');
    setSelectedUserId(undefined);
    setTransferAuditors([]);
    setCountersignAuditors([]);
    setCountersignLimitError('');
    setOpAttachments([]);
    setUserOptions([]);
    setOpModalOpen(true);
  };

  const normalizePickedUsers = (rawUsers: unknown[]): PickedAuditor[] =>
    rawUsers
      .map(raw => {
        const user = raw as Record<string, unknown>;
        const selType = String(user.sel_type || '');
        if (selType && selType !== 'user') return null;
        const userid = String(user.userid || user.id || '');
        const name = String(user.name || '');
        if (!userid || !name) return null;
        return { userid, name, avatar_url: String(user.avatar_url || '') };
      })
      .filter(Boolean) as PickedAuditor[];

  const getCurrentAuditorIds = () => {
    const ids = new Set<string>();
    (procLogsForTransfer as ProcLogForAction[] | null)?.forEach(log => {
      if (log.act_status !== '1') return;
      (log.auditor_logs || []).forEach(group => {
        (group || []).forEach(auditor => {
          if (auditor?.auditor) ids.add(auditor.auditor);
        });
      });
    });
    const detailWithAuditors = detail as AuditRecord & {
      audit_type?: string;
      auditors?: Array<{ id?: string }>;
    };
    if (detailWithAuditors.audit_type === 'zjsh' && Array.isArray(detailWithAuditors.auditors)) {
      detailWithAuditors.auditors.forEach(item => {
        if (item?.id) ids.add(item.id);
      });
    }
    return ids;
  };

  const getTransferredByIds = () => {
    const ids = new Set<string>();
    (procLogsForTransfer as ProcLogForAction[] | null)?.forEach(log => {
      (log.transfer_logs || []).forEach(tr => {
        if (tr.transfer_by) ids.add(tr.transfer_by);
      });
    });
    return ids;
  };

  /** 当前进行中环节的 act_def_key，与 Vue auditComment getAuditorIds 中 curentActDefKey 一致 */
  const getCurrentActDefKey = (): string | undefined => {
    const logs = (procLogsForTransfer as ProcLogForAction[] | null) || [];
    const active = logs.find(l => l.act_status === '1');
    return active?.act_def_key;
  };

  /** 与 Vue auditComment checkCountersign 一致 */
  const checkCountersignBeforeSubmit = async (): Promise<boolean> => {
    setCountersignLimitError('');
    if (!detail) return false;
    const auditorIdSet = getCurrentAuditorIds();
    let hasExistUser = false;
    let hasApplyUser = false;
    countersignAuditors.forEach(chooseUser => {
      if (chooseUser.userid === detail.apply_user_id) hasApplyUser = true;
      if (auditorIdSet.has(chooseUser.userid)) hasExistUser = true;
    });
    if (hasExistUser) {
      message.info(t('common.detail.auditMsg.countersignErrorTip'));
      return false;
    }
    if (hasApplyUser) {
      message.info(t('common.detail.auditMsg.countersignApplyUserErrorTip'));
      return false;
    }
    const customDesc = (detail as AuditRecord & { customDescription?: Record<string, unknown> }).customDescription;
    if (!customDesc) {
      return false;
    }
    const curentActDefKey = getCurrentActDefKey();
    try {
      const logsRaw = await countersignLogs(detail.proc_inst_id);
      const csLogs = Array.isArray(logsRaw) ? logsRaw : [];
      const maxAuditors = Number(customDesc.max_auditors ?? 0);
      const maxCount = Number(customDesc.max_count ?? 0);
      const curentActCountersignArr = csLogs.filter(
        (item: Record<string, unknown>) => String(item.taskDefKey ?? '') === String(curentActDefKey ?? '')
      );
      const firstBatch = curentActCountersignArr[0] as { batch?: string | number } | undefined;
      if (curentActCountersignArr.length > 0 && firstBatch != null && maxCount === Number(firstBatch.batch)) {
        message.warning(t('common.detail.countersign.maxAddErrCount'));
        return false;
      }
      const remaining = maxAuditors - curentActCountersignArr.length;
      if (countersignAuditors.length > remaining) {
        setCountersignLimitError(
          `${t('common.detail.countersign.maxAdd')}${remaining}${t(
            'common.detail.countersign.maxUnitsA'
          )}${t('common.detail.countersign.personnel')}`
        );
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const chooseTransferAuditor = async () => {
    try {
      const result = await selectUser({
        range: ['user'],
        tabs: ['organization'],
        title: t('common.detail.transfer.select'),
        isAdmin: false,
        isSelectOwn: false,
        multiple: false,
      });
      const picked = normalizePickedUsers(Array.isArray(result) ? result : []);
      if (picked.length === 0) return;
      const pickedOne = picked[0];
      if (pickedOne.userid === detail?.apply_user_id) {
        message.info(t('common.detail.auditMsg.transferApplyUserErrorTip'));
        return;
      }
      if (getCurrentAuditorIds().has(pickedOne.userid)) {
        message.info(t('common.detail.auditMsg.transferErrorTip'));
        return;
      }
      if (getTransferredByIds().has(pickedOne.userid)) {
        message.info(t('common.detail.transfer.hasTransferUser'));
        return;
      }
      setTransferAuditors([pickedOne]);
      setSelectedUserId(pickedOne.userid);
    } catch (error) {
      console.error('Choose transfer auditor failed:', error);
    }
  };

  const chooseCountersignAuditor = async () => {
    const menu = (microWidgetProps as any)?.contextMenu;
    const addAccessorFn = menu?.addAccessorFn;
    const systemType = (context as any)?.systemType;
    const baseParams = {
      functionid: 'chooseAuditor',
      title: t('common.detail.operation.countersign'),
      selectPermission: 2,
      groupOptions: { select: 3, drillDown: 1 },
      multiple: true,
      isSelectOwn: false,
      selectedVisitorsCustomLabel: t('common.detail.operation.selected'),
    };
    try {
      const result = await selectUser({
        range: ['user'],
        tabs: ['organization'],
        title: t('common.detail.operation.countersign'),
        isAdmin: false,
        isSelectOwn: false,
        multiple: true,
      });
      const picked = normalizePickedUsers(Array.isArray(result) ? result : []);
      if (picked.length === 0) return;

      const currentAuditorIds = getCurrentAuditorIds();
      const existingIds = new Set(countersignAuditors.map(u => u.userid));
      let hasExistUser = false;
      let hasApplyUser = false;
      const legalUsers: PickedAuditor[] = [];
      picked.forEach(user => {
        if (user.userid === detail?.apply_user_id) {
          hasApplyUser = true;
          return;
        }
        if (currentAuditorIds.has(user.userid)) {
          hasExistUser = true;
          return;
        }
        if (!existingIds.has(user.userid)) {
          legalUsers.push(user);
          existingIds.add(user.userid);
        }
      });
      if (hasExistUser) {
        message.info(t('common.detail.auditMsg.countersignErrorTip'));
      } else if (hasApplyUser) {
        message.info(t('common.detail.auditMsg.countersignApplyUserErrorTip'));
      }
      if (legalUsers.length > 0) {
        setCountersignLimitError('');
        setCountersignAuditors(prev => [...prev, ...legalUsers]);
      }
    } catch (error) {
      console.error('Choose countersign auditor failed:', error);
    }
  };

  const checkTransferBeforeSubmit = () => {
    if (!detail || transferAuditors.length === 0) return false;
    const targetUser = transferAuditors[0];
    if (targetUser.userid === detail.apply_user_id) {
      message.info(t('common.detail.auditMsg.transferApplyUserErrorTip'));
      return false;
    }
    if (getCurrentAuditorIds().has(targetUser.userid)) {
      message.info(t('common.detail.auditMsg.transferErrorTip'));
      return false;
    }
    if (getTransferredByIds().has(targetUser.userid)) {
      message.info(t('common.detail.transfer.hasTransferUser'));
      return false;
    }
    const transferConfig = (detail as AuditRecord & { customDescription?: Record<string, any> }).customDescription
      ?.transfer;
    const maxCount = Number(transferConfig?.maxCount || 0);
    const activeLog = ((procLogsForTransfer as ProcLogForAction[] | null) || []).find(log => log.act_status === '1');
    const currentTransferCount = (activeLog?.transfer_logs || []).length;
    if (maxCount > 0 && currentTransferCount >= maxCount) {
      message.warning(t('common.detail.transfer.overLimit'));
      return false;
    }
    return true;
  };

  const extractErrorCode = (error: unknown) => Number((error as any)?.response?.data?.code);

  const extractErrorDetail = (error: unknown) => (error as any)?.response?.data?.detail;

  const submitMoreOperation = async () => {
    if (!detail) return;
    if (!(await ensureTaskValid())) {
      setOpModalOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      if (opType === 'transfer') {
        if (transferAuditors.length === 0) {
          message.warning(t('message.confirm'));
          return;
        }
        if (!checkTransferBeforeSubmit()) {
          return;
        }
        await transferAudit(detail.biz_id, {
          auditor: transferAuditors[0].userid,
          reason: opRemark || '',
        });
        message.success(t('common.detail.transfer.success'));
      } else if (opType === 'countersign') {
        if (countersignAuditors.length === 0) {
          message.warning(t('message.confirm'));
          return;
        }
        if (!(await checkCountersignBeforeSubmit())) {
          return;
        }
        const detailExt = detail as AuditRecord & {
          task_id?: string;
          audit_type?: string;
        };
        await countersign(detail.biz_id, {
          task_id: detailExt.task_id,
          reason: opRemark || '',
          audit_model: detailExt.audit_type,
          auditors: countersignAuditors.map(u => u.userid),
        });
        // 加签成功后仅刷新右侧详情：更新 auditors + 刷新流程日志，不刷新左侧表格
        await refreshTaskAuditors();
        setFlowLogRefreshToken(v => v + 1);
      } else {
        if (!selectedUserId) {
          message.warning(t('message.confirm'));
          return;
        }
        await sendbackAudit({
          id: detail.id,
          target_user_id: selectedUserId,
          remark: opRemark || undefined,
          attachments: opAttachments.length > 0 ? opAttachments.map(i => i.docid) : undefined,
        });
        message.success(t('message.approved'));
      }
      setOpModalOpen(false);
      if (opType !== 'countersign') {
        onAuditResult?.();
      }
    } catch (error) {
      console.error('Submit operation failed:', error);
      const code = extractErrorCode(error);
      const detailStr = extractErrorDetail(error);
      if (opType === 'transfer') {
        if (code === 403057009) {
          message.warning(t('common.detail.transfer.overLimit'));
        } else if (code === 400019001) {
          message.warning(t('common.detail.transfer.usersNotFound'));
        } else if (code === 403057006) {
          message.warning(t('common.detail.transfer.hasTransferUser'));
        } else if (code === 403057008) {
          message.warning(t('common.detail.auditMsg.transferErrorTip'));
        } else if (code === 401001101 || code === 403057004) {
          message.warning(t('message.taskNotPrem'));
          onAuditResult?.();
          setOpModalOpen(false);
        } else if (code === 403057010) {
          const userName = transferAuditors[0]?.name || '';
          message.warning(`${userName}${t('message.countersignApprovedError')}`);
        } else if (code === 400 || code === 400057001) {
          message.warning(t('invalidParams'));
        } else {
          message.error(t('message.submitErr'));
        }
      } else if (opType === 'countersign') {
        if (code === 401001101) {
          message.warning(t('message.taskNotPrem'));
          onAuditResult?.();
          setOpModalOpen(false);
        } else if (code === 500001103) {
          message.error(t('common.detail.countersign.maxAddErrCount'));
        } else if (code === 500001104) {
          message.error(t('common.detail.countersign.addErrRepeat'));
        } else if (code === 400019001) {
          message.error(t('common.detail.countersign.addErrNotFound'));
        } else if (code === 500001105) {
          const intervalSymbol = lang === 'en-us' ? ',' : '、';
          let approvedUserNames = '';
          countersignAuditors.forEach(e => {
            if (detailStr != null && String(detailStr).indexOf(e.userid) !== -1) {
              approvedUserNames = approvedUserNames === '' ? e.name : `${approvedUserNames}${intervalSymbol}${e.name}`;
            }
          });
          if (lang === 'en-us') {
            message.warning(
              `This approval has already been processed by ${approvedUserNames}. You cannot add them again.`
            );
          } else {
            message.warning(`${approvedUserNames}${t('message.countersignApprovedError')}`);
          }
        } else if (code === 400 || code === 400057001) {
          message.warning(t('invalidParams'));
        } else {
          message.error(t('message.submitErr'));
        }
      } else {
        message.error(t('message.submitErr'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAuditTypeName = () => {
    if (!detail) return '';

    if (['realname', 'perm', 'owner', 'inherit'].includes(detail.biz_type) || detail.biz_type === 'anonymous') {
      return t(`common.detail.founding.${detail.biz_type}`);
    }

    const detailWithAutomation = detail as AuditRecord & {
      apply_detail?: {
        data?: {
          automation_flow_name?: string;
        };
      };
    };
    const automationFlowName = detailWithAutomation.apply_detail?.data?.automation_flow_name;
    if (detail.biz_type === 'automation' && automationFlowName) {
      return `${t('common.detail.founding.startTitle')}${automationFlowName}`;
    }

    return `${t('common.detail.founding.startTitle')}${getBizTypeLabel(detail.biz_type, dictList)}`;
  };

  /**
   * 撤销提示：英文与 Vue 一致（中间无类型名）；中文/繁体 xxx 与列表「申请类型」列
   */
  const getRevokeConfirmContent = () => {
    if (!detail) return '';
    const applyTypeName = lang === 'en-us' ? '' : getBizTypeColumnText(detail, lang);
    return (
      t('common.detail.revokeMsg.info.sureRevoke1') + applyTypeName + t('common.detail.revokeMsg.info.sureRevoke2')
    );
  };

  const formatApplyUserName = (name: string) => {
    if (name.length > 12) {
      return `${name.substring(0, 12)}...`;
    }
    return name;
  };

  const checkEnableFlow = async (currentDetail: AuditRecord) => {
    if (currentDetail.biz_type !== 'flow') {
      setEnableFlow(false);
      return;
    }

    try {
      const flowConfig = dictList.bizTypes.filter(item => item.value === 'flow');
      if (flowConfig.length === 1 && (flowConfig[0] as { entry?: string }).entry) {
        setEnableFlow(true);
        return;
      }
      const categories = (await processCategory(context?.tenantId)) as Array<{
        audit_type?: string;
      }>;
      setEnableFlow(categories.filter(item => item.audit_type === 'flow').length === 1);
    } catch {
      setEnableFlow(false);
    }
  };

  const loadDetailPlugin = async (currentDetail: AuditRecord, flowEnabled: boolean) => {
    const detailAny = currentDetail as AuditRecord & {
      apply_detail?: {
        process?: Record<string, unknown>;
        data?: Record<string, unknown>;
        workflow?: Record<string, unknown>;
      };
      workflow?: {
        front_plugin_info?: {
          entry?: string;
          name?: string;
        };
      };
    };
    const hasWorkflow = typeof detailAny.apply_detail?.workflow !== 'undefined';
    if (!microWidgetProps || (!hasWorkflow && !flowEnabled)) return;

    const urlPrefix = getConfig('prefix');
    const entry = detailAny.workflow?.front_plugin_info?.entry || '';
    if (!entry) return;
    const container = inDrawer ? drawerAuditViewportRef.current : auditViewportRef.current;
    if (!container) return;

    const appConfig = {
      name: detailAny.workflow?.front_plugin_info?.name || currentDetail.biz_type,
      entry: `${microWidgetProps.config.systemInfo.realLocation?.origin || window.location.origin}${urlPrefix}${entry}`,
      container,
      props: {
        microWidgetProps,
        apply_id: currentDetail.biz_id,
        process: detailAny.apply_detail?.process,
        data: detailAny.apply_detail?.data,
        apply_time: currentDetail.apply_time,
        target: donePage ? 'donePage' : 'auditPage',
        audit_status: currentDetail.audit_status,
      },
    };

    try {
      setMicroAppLoading(true);
      if (auditDetailMicroAppRef.current) {
        auditDetailMicroAppRef.current.unmount();
        auditDetailMicroAppRef.current = null;
      }
      const loader =
        microWidgetProps._qiankun && microWidgetProps._qiankun.loadMicroApp
          ? microWidgetProps._qiankun.loadMicroApp
          : loadMicroApp;
      auditDetailMicroAppRef.current = loader(appConfig, {
        sandbox: { experimentalStyleIsolation: true },
      });
      (auditDetailMicroAppRef.current as any)?.mountPromise?.then(
        () => {
          setMicroAppLoading(false);
        },
        () => {
          setMicroAppLoading(false);
        }
      );
    } catch (error) {
      console.warn(error);
      setMicroAppLoading(false);
    }
  };

  useEffect(() => {
    if (!detail) return;
    void checkEnableFlow(detail);
  }, [detail?.id]);

  useEffect(() => {
    if (!detail) return;
    void loadDetailPlugin(detail, enableFlow);
  }, [detail?.id, enableFlow, inDrawer, microWidgetProps, donePage]);

  if (loading) {
    return (
      <div className={styles['detail-loading']}>
        <Spin />
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const auditTypeName = getAuditTypeName();
  const detailAny = detail as AuditRecord & {
    apply_detail?: {
      workflow?: Record<string, unknown>;
    };
  };
  const hasWorkflow = typeof detailAny.apply_detail?.workflow !== 'undefined';
  const detailWithStrategy = detail as AuditRecord & {
    strategy_configs?: {
      audit_idea_config?: {
        audit_idea_switch?: boolean;
        status?: string;
      };
    };
  };
  const auditIdeaConfig = detailWithStrategy.strategy_configs?.audit_idea_config;
  const isAuditCommentRequired = Boolean(
    auditIdeaConfig?.audit_idea_switch === true &&
      (auditIdeaConfig.status === '2' || (auditIdeaConfig.status === '1' && auditType === 'reject'))
  );
  const auditConfirmText =
    auditType === 'pass'
      ? t(`common.detail.auditMsg.agree.${detail.biz_type}`) || t('common.detail.auditMsg.agree.yes')
      : t(`common.detail.auditMsg.reject.${detail.biz_type}`) || t('common.detail.auditMsg.reject.no');
  const auditModalTitle =
    auditType === 'pass' ? t('common.detail.operation.pass') : t('common.detail.operation.reject');
  const customDesc = (detail as AuditRecord & { customDescription?: Record<string, any> }).customDescription;
  const showSendbackBtn = customDesc?.send_back_switch === 'Y';
  const buildMoreMenuLabel = (IconComp: ComponentType<{ className?: string }>, text: string) => (
    <span className={styles['more-menu-item-label']}>
      <IconComp className={styles['details-ops-icon']} />
      <span>{text}</span>
    </span>
  );
  const moreMenuItems = [
    showTransferBtn
      ? {
          key: 'transfer',
          label: buildMoreMenuLabel(TransferIcon, t('common.detail.operation.Transfer')),
        }
      : null,
    showCountersignBtn
      ? {
          key: 'countersign',
          label: buildMoreMenuLabel(CountersignIcon, t('common.detail.operation.countersignBtn')),
        }
      : null,
    showSendbackBtn
      ? {
          key: 'sendback',
          label: buildMoreMenuLabel(SendbackIcon, t('common.detail.operation.sendback')),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: ReactNode }>;
  const opTitleMap: Record<'transfer' | 'countersign' | 'sendback', string> = {
    transfer: t('common.detail.operation.Transfer'),
    countersign: t('common.detail.operation.countersignBtn'),
    sendback: t('common.detail.operation.sendback'),
  };
  const opPlaceholderMap: Record<'transfer' | 'countersign' | 'sendback', string> = {
    transfer: t('common.detail.operation.transferPlaceholder'),
    countersign: t('common.detail.operation.countersignPlaceholder'),
    sendback: t('common.detail.operation.sendbackPlaceholder'),
  };
  const transferUserName = transferAuditors[0]?.name || '';
  const locale = (lang || 'zh-cn').toLowerCase();
  const stampStatus = String(detail.audit_status ?? '')
    .trim()
    .toLowerCase();
  const normalizedDoneStatus = String(doneStatus ?? '')
    .trim()
    .toLowerCase();

  const renderStatusStamp = () => {
    if (
      stampStatus !== 'pass' &&
      stampStatus !== 'avoid' &&
      stampStatus !== 'reject' &&
      stampStatus !== 'undone' &&
      stampStatus !== 'flow_undone'
    ) {
      return null;
    }
    if (stampStatus === 'undone' || stampStatus === 'flow_undone') {
      if (locale === 'zh-tw') return <StampUndoTw className={styles['status-stamp-svg']} />;
      if (locale === 'en-us') return <StampUndoEn className={styles['status-stamp-svg']} />;
      return <StampUndoZh className={styles['status-stamp-svg']} />;
    }
    if (stampStatus === 'reject') {
      if (locale === 'zh-tw') return <StampRejectTw className={styles['status-stamp-svg']} />;
      if (locale === 'en-us') return <StampRejectEn className={styles['status-stamp-svg']} />;
      return <StampRejectZh className={styles['status-stamp-svg']} />;
    }
    if (locale === 'zh-tw') return <StampPassTw className={styles['status-stamp-svg']} />;
    if (locale === 'en-us') return <StampPassEn className={styles['status-stamp-svg']} />;
    return <StampPassZh className={styles['status-stamp-svg']} />;
  };

  const statusStampNode = renderStatusStamp();
  // 与 doc-audit-client detail.vue 一致：
  // - donePage 且 transfer/sendback 时显示转审角标，不显示 stamp
  // - 其余情况（包含我的申请页 applyPage）根据 audit_status 显示 stamp
  const shouldRenderStatusStamp =
    (applyPage || donePage) &&
    !(donePage && (normalizedDoneStatus === 'transfer' || normalizedDoneStatus === 'sendback'));

  return (
    <div className={styles['todo-detail']}>
      <div className={styles['content-wrapper']}>
        {donePage && (doneStatus === 'transfer' || doneStatus === 'sendback') && (
          <div className={styles['block-icon']}>
            <div
              className={`${styles.badge} ${
                doneStatus === 'transfer' ? styles.transfer : styles.sendback
              } ${locale === 'en-us' ? styles.en : ''}`}
              style={{ fontSize: '64px' }}
              data-text={
                doneStatus === 'transfer' ? t('common.auditStatuss.transfer') : t('common.auditStatuss.sendback')
              }
            />
          </div>
        )}

        <div className={styles['header']} title={detail.apply_user_name + auditTypeName}>
          {formatApplyUserName(detail.apply_user_name)}
          {auditTypeName}
        </div>
        <Spin spinning={microAppLoading}>
          <div
            ref={auditViewportRef}
            className={
              (hasWorkflow || enableFlow) && !inDrawer ? styles['audit-viewport'] : styles['audit-viewport-hidden']
            }
            style={{
              position: 'relative',
              zIndex: 1,
              paddingRight: shouldRenderStatusStamp && statusStampNode ? 80 : 0,
            }}
          />
          <div
            ref={drawerAuditViewportRef}
            className={
              (hasWorkflow || enableFlow) && inDrawer ? styles['audit-viewport'] : styles['audit-viewport-hidden']
            }
          />
        </Spin>
        {shouldRenderStatusStamp && statusStampNode && <div className={styles['status-stamp']}>{statusStampNode}</div>}

        <div className={styles['flow-log-section']}>
          <FlowLogDetail
            temp={detail as AuditRecord & { audit_msg?: string }}
            auditPage={!donePage}
            donePage={donePage}
            refreshToken={flowLogRefreshToken}
          />
        </div>
      </div>
      {applyPage && detail?.audit_status === 'pending' && (
        <Space className={styles['btn-wrapper']}>
          <Button type="primary" loading={submitting} onClick={() => void handleRemind()}>
            {t('common.detail.operation.Remind')}
          </Button>
          <Button className={styles['btn']} loading={submitting} onClick={handleRevoke}>
            {t('common.detail.operation.revoke')}
          </Button>
        </Space>
      )}
      {!donePage && !applyPage && (
        <Space className={styles['btn-wrapper']}>
          <Button type="primary" loading={submitting} onClick={() => openAuditModal('pass')}>
            {t('common.detail.operation.pass')}
          </Button>
          <Button className={styles['btn']} loading={submitting} onClick={() => openAuditModal('reject')}>
            {t('common.detail.operation.reject')}
          </Button>
          {moreMenuItems.length > 0 && (
            <Dropdown
              menu={{
                items: moreMenuItems,
                onClick: ({ key }) => openMoreOperation(key as 'transfer' | 'countersign' | 'sendback'),
              }}
              trigger={['click']}
            >
              <Button className={styles['btn']}>{t('common.detail.operation.more')}</Button>
            </Dropdown>
          )}
        </Space>
      )}
      <Modal
        title={t('common.detail.operation.remind')}
        open={remindModalOpen}
        centered
        maskClosable={false}
        onCancel={() => setRemindModalOpen(false)}
        onOk={() => void submitRemind()}
        confirmLoading={submitting}
        okText={t('common.detail.operation.sure')}
        cancelText={t('common.detail.operation.cancel')}
        okButtonProps={{ disabled: selectedRemindAuditorIds.length === 0 }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
      >
        <div className={styles['remind-label']}>{t('common.detail.remind.user')}</div>
        {(
          detail as AuditRecord & {
            audit_type?: string;
          }
        )?.audit_type === 'tjsh' ? (
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            value={selectedRemindAuditorIds}
            options={remindCandidates.map(item => ({
              label: (
                <span className={styles['remind-user-option']}>
                  <UserAvatarName userName={item.name} userId={item.userid} avatarSize={22} userNameFontSize={13} />
                </span>
              ),
              value: item.userid,
            }))}
            onChange={vals => setSelectedRemindAuditorIds(vals)}
            placeholder={t('common.detail.remind.selectPlaceholder')}
          />
        ) : (
          <div className={styles['remind-tags-wrap']}>
            {remindCandidates.map(item => (
              <UserAvatarName
                key={item.userid}
                asTag
                deletable={false}
                tagClassName={styles['transfer-user-tag']}
                userName={item.name}
                userId={item.userid}
                avatarSize={22}
                userNameFontSize={13}
              />
            ))}
          </div>
        )}
        {selectedRemindAuditorIds.length === 0 && (
          <div className={styles['remind-error-tip']}>{t('common.detail.remind.selectEmpty')}</div>
        )}
        <div className={styles['remind-label']}>{t('common.detail.remind.comment')}</div>
        <Input.TextArea
          className={styles['audit-remark-textarea']}
          value={remindRemark}
          onChange={e => setRemindRemark(e.target.value)}
          rows={5}
          maxLength={300}
          showCount
          placeholder={t('common.detail.operation.remindPlaceholder')}
          style={{ resize: 'none' }}
        />
      </Modal>
      <Modal
        title={auditModalTitle}
        open={auditModalOpen}
        centered
        maskClosable={false}
        onCancel={() => setAuditModalOpen(false)}
        onOk={submitAudit}
        confirmLoading={submitting}
        okButtonProps={{
          disabled: isAuditCommentRequired && !auditRemark.trim(),
        }}
        okText={t('common.detail.auditMsg.confirm')}
        cancelText={t('common.detail.auditMsg.cancel')}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
      >
        <div className={`${styles['audit-confirm-text']} ${isAuditCommentRequired ? styles.required : ''}`}>
          {auditConfirmText}
        </div>
        <Input.TextArea
          className={styles['audit-remark-textarea']}
          value={auditRemark}
          onChange={e => setAuditRemark(e.target.value)}
          rows={5}
          maxLength={500}
          showCount
          placeholder={t(
            isAuditCommentRequired
              ? 'common.detail.operation.requiredPlaceholder'
              : 'common.detail.operation.placeholder'
          )}
          style={{ resize: 'none' }}
        />
      </Modal>
      <Modal
        title={opTitleMap[opType]}
        open={opModalOpen}
        centered
        maskClosable={false}
        onCancel={() => {
          setCountersignLimitError('');
          setOpModalOpen(false);
        }}
        onOk={submitMoreOperation}
        confirmLoading={submitting}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
        okButtonProps={{
          disabled:
            (opType === 'transfer' && transferAuditors.length === 0) ||
            (opType === 'countersign' && countersignAuditors.length === 0),
        }}
      >
        {opType === 'transfer' ? (
          <div className={styles['transfer-selector-block']}>
            {transferAuditors.length > 0 ? (
              <UserAvatarName
                asTag
                deletable
                tagClassName={styles['transfer-user-tag']}
                userName={transferUserName}
                userId={transferAuditors[0]?.userid || ''}
                avatarSize={22}
                userNameFontSize={13}
                onClose={e => {
                  e.preventDefault();
                  setTransferAuditors([]);
                }}
              />
            ) : null}
            {transferAuditors.length === 0 ? (
              <Button icon={<PlusOutlined />} onClick={() => void chooseTransferAuditor()}>
                {t('common.detail.operation.add')}
              </Button>
            ) : null}
          </div>
        ) : opType === 'countersign' ? (
          <div className={styles['transfer-selector-block']}>
            <div className={styles['countersign-tags-wrap']}>
              {countersignAuditors.map(user => (
                <UserAvatarName
                  key={user.userid}
                  asTag
                  deletable
                  tagClassName={styles['transfer-user-tag']}
                  userName={user.name}
                  userId={user.userid}
                  avatarSize={22}
                  userNameFontSize={13}
                  onClose={e => {
                    e.preventDefault();
                    setCountersignLimitError('');
                    setCountersignAuditors(prev => prev.filter(item => item.userid !== user.userid));
                  }}
                />
              ))}
            </div>
            <Button icon={<PlusOutlined />} onClick={() => void chooseCountersignAuditor()}>
              {t('common.detail.operation.add')}
            </Button>
          </div>
        ) : (
          <Select
            showSearch
            filterOption={false}
            style={{ width: '100%', marginBottom: 12 }}
            value={selectedUserId}
            options={userOptions}
            onSearch={handleSearchUsers}
            onChange={setSelectedUserId}
            placeholder={t('common.column.applyUserName')}
          />
        )}
        <Input.TextArea
          className={styles['audit-remark-textarea']}
          value={opRemark}
          onChange={e => {
            setOpRemark(e.target.value);
            if (opType === 'countersign') setCountersignLimitError('');
          }}
          rows={5}
          maxLength={300}
          showCount
          placeholder={opPlaceholderMap[opType]}
          style={{ resize: 'none' }}
        />
        {opType === 'countersign' && countersignLimitError ? (
          <div className={styles['countersign-limit-error']}>{countersignLimitError}</div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AuditDetail;
