import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Avatar, Spin, Divider, Tooltip } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SuccessIcon from '@/assets/success.svg';
import ReviewIcon from '@/assets/review.svg';
import AuditUserIcon from '@/assets/audit-user.svg';
import CountersignTwIcon from '@/assets/countersign_tw.svg';
import CountersignEnIcon from '@/assets/countersign_en.svg';
import CountersignZhIcon from '@/assets/countersign_zh.svg';
import { useAppStore } from '@/store';
import { countersignLogs } from '@/api/doc-audit-rest';
import { getBatchUserAvatars } from '@/api/user-management';
import { fetchLog } from '@/api/workflow-rest';
import { t } from '@/i18n';
import type {
  AuditorLog,
  CountersignLogEntry,
  ExtAuditRecord,
  FlowLogDetailProps,
  FlowLogNode,
  TransferLog,
} from './types';
import styles from './index.module.less';

const hiddenAuditIdea = new Set(['revocation', 'proc_def_delete', 'flow_del_file_cancel']);

function flattenAuditorLogs(auditorLogs: AuditorLog[][] = []): AuditorLog[] {
  return auditorLogs.flat();
}

function isRevocationOrProc70Reject(auditor: AuditorLog): boolean {
  return auditor.audit_status === 'reject' && (auditor.audit_idea === 'revocation' || auditor.proc_status === '70');
}

/** 与 Vue flowLogDetail showAct */
function shouldShowNode(node: FlowLogNode): boolean {
  if (
    node.custom_text ||
    node.custom_title ||
    node.act_type === 'revokeEvent' ||
    node.act_type === 'revokeAdminEvent' ||
    node.act_type === 'avoidEvent'
  ) {
    return true;
  }
  if (
    node.act_type === 'startEvent' ||
    node.act_type === 'transferEvent' ||
    node.act_type === 'autoPass' ||
    node.act_type === 'autoReject' ||
    node.act_status === '1'
  ) {
    return true;
  }
  const logs = flattenAuditorLogs(node.auditor_logs);
  return (
    logs.filter(
      item =>
        item.audit_status !== null &&
        item.audit_idea !== 'revocation' &&
        (item.proc_status !== '70' || item.audit_status === 'pass') &&
        item.audit_idea !== 'proc_def_delete' &&
        item.audit_idea !== 'flow_del_file_cancel'
    ).length > 0
  );
}

/** 与 Vue flowLogDetail isSuccess */
function hasSuccessMark(node: FlowLogNode): boolean {
  const logs = flattenAuditorLogs(node.auditor_logs);
  if (logs.some(item => isRevocationOrProc70Reject(item))) {
    return false;
  }
  return true;
}

/** 与 Vue flowLogDetail getActStatus */
function getActStatus(node: FlowLogNode): '' | 'sendback' | 'reject' | 'pass' {
  if (node.act_status !== '2') return '';
  const logs = flattenAuditorLogs(node.auditor_logs);
  if (logs.some(item => isRevocationOrProc70Reject(item))) {
    return '';
  }
  if (logs.some(item => item.audit_status === 'sendback')) {
    return 'sendback';
  }
  const rejected = logs.filter(
    item =>
      item.audit_status === 'reject' &&
      item.audit_idea !== 'revocation' &&
      item.proc_status !== '70' &&
      item.audit_idea !== 'proc_def_delete' &&
      item.audit_idea !== 'flow_del_file_cancel'
  );
  return rejected.length > 0 ? 'reject' : 'pass';
}

function getAuditorIdeaRaw(auditor: AuditorLog): string | null {
  const legacyIdea = auditor.audit__idea;
  if (legacyIdea !== undefined) return legacyIdea ?? null;
  return auditor.audit_idea ?? null;
}

function getAuditorIdeaText(auditor: AuditorLog): string {
  const idea = getAuditorIdeaRaw(auditor) || '';
  return idea.replace(/<br(\/)?>/g, '\n').replace(/&nbsp;/g, ' ');
}

function shouldShowAuditorIdea(auditor: AuditorLog): boolean {
  const idea = getAuditorIdeaRaw(auditor);
  return idea !== null && idea !== '' && idea !== 'default_comment';
}

function shouldShowAuditorTime(auditor: AuditorLog): boolean {
  const idea = getAuditorIdeaRaw(auditor);
  return idea !== null && idea !== '';
}

function getAuditorIdeaDateTime(auditor: AuditorLog): string {
  if (!auditor.end_time) return '';
  const now = dayjs();
  const audited = dayjs(auditor.end_time);
  if (!audited.isValid()) return '';
  if (audited.format('YYYY/MM/DD') === now.format('YYYY/MM/DD')) {
    return `${t('common.detail.today')} ${audited.format('HH:mm')}`;
  }
  if (audited.format('YYYY/MM/DD') === now.subtract(1, 'day').format('YYYY/MM/DD')) {
    return `${t('common.detail.yesterday')} ${audited.format('HH:mm')}`;
  }
  if (audited.format('YYYY') === now.format('YYYY')) {
    return audited.format('MM/DD HH:mm');
  }
  return audited.format('YYYY/MM/DD HH:mm');
}

const FlowLogDetail: React.FC<FlowLogDetailProps> = ({
  temp,
  auditPage = false,
  donePage = false,
  refreshToken = 0,
}) => {
  const { lang } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<FlowLogNode[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadLogs();
  }, [temp.id, temp.proc_inst_id, temp.audit_status, donePage, refreshToken]);

  const loadLogs = async () => {
    if (temp.audit_status === 'avoid' || temp.audit_status === 'failed' || !temp.proc_inst_id) {
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      const [rawLogs, csLogs] = await Promise.all([
        fetchLog(temp.proc_inst_id),
        countersignLogs(temp.proc_inst_id).catch(() => []),
      ]);

      const merged = normalizeLogs(rawLogs as FlowLogNode[], temp, donePage, Array.isArray(csLogs) ? csLogs : []);
      setLogs(merged);

      const avatarIds = collectAvatarUserIds(merged);
      if (temp.apply_user_id) avatarIds.add(temp.apply_user_id);
      if (avatarIds.size > 0) {
        void getBatchUserAvatars([...avatarIds]).then((avatarMap: Record<string, string>) => {
          setUserAvatars(avatarMap || {});
        });
      } else {
        setUserAvatars({});
      }
    } catch (error) {
      console.error('Failed to fetch flow logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const failedMessage = useMemo(() => {
    if (temp.audit_status !== 'failed') return '';
    if (temp.audit_msg === 'S0004') {
      return t(`common.detail.failedMsg.${temp.biz_type}.noMatchingLevelAuditor`);
    }
    return t(`common.detail.failedMsg.${temp.biz_type}.noAuditor`);
  }, [temp.audit_status, temp.audit_msg, temp.biz_type]);

  const displayLogs = useMemo(() => {
    if (temp.audit_status === 'pending') {
      if (logs.length > 0) return logs;
      return [
        {
          act_type: 'startEvent',
          act_status: '2',
          act_def_name: 'start',
          auditor_logs: [],
        },
        {
          act_type: 'userTask',
          act_status: '1',
          act_model:
            temp.audit_type === 'zjsh' || temp.audit_type === 'hqsh' || temp.audit_type === 'tjsh'
              ? temp.audit_type
              : 'zjsh',
          act_def_name: '审核',
          auditor_logs: [
            (temp.auditors || []).map(a => ({
              auditor: a.id,
              auditor_name: a.name,
              audit_status: null,
              countersign: (a as { countersign?: string }).countersign || 'n',
            })),
          ],
        },
      ] as FlowLogNode[];
    }

    if (temp.audit_status === 'reject' && !temp.proc_inst_id) {
      if (logs.length > 0) return logs;
      return [
        {
          act_type: 'startEvent',
          act_status: '2',
          act_def_name: 'start',
          auditor_logs: [],
        },
        {
          act_type: 'autoReject',
          act_status: '2',
          act_def_name: '审核',
          auditor_logs: [],
        },
      ] as FlowLogNode[];
    }

    if (temp.audit_status === 'avoid') {
      if (logs.length > 0) return logs;
      return [
        {
          act_type: 'startEvent',
          act_status: '2',
          act_def_name: 'start',
          auditor_logs: [],
        },
        {
          act_type: 'avoidEvent',
          act_status: '2',
          act_def_name: '审核',
          auditor_logs: [],
        },
      ] as FlowLogNode[];
    }

    if (temp.audit_status === 'pass' && !temp.proc_inst_id) {
      if (logs.length > 0) return logs;
      return [
        {
          act_type: 'startEvent',
          act_status: '2',
          act_def_name: 'start',
          auditor_logs: [],
        },
        {
          act_type: 'autoPass',
          act_status: '2',
          act_def_name: '审核',
          auditor_logs: [],
        },
      ] as FlowLogNode[];
    }

    if (temp.audit_status === 'undone') {
      let undoneNode: FlowLogNode;
      if (temp.audit_msg === 'A0701') {
        undoneNode = {
          act_type: 'revokeAdminEvent',
          act_status: '2',
          custom_title: t('common.detail.revoke'),
          custom_text: t('common.detail.undoneForProcDefDelete'),
          custom_status_cls: 'red',
          auditor_logs: [],
        };
        return logs.length > 0 ? [...logs, undoneNode] : [undoneNode];
      }
      if (temp.audit_msg === 'A0702') {
        undoneNode = {
          // 对齐 Vue：删除审核流程场景使用申请人头像
          act_type: 'startEvent',
          act_status: '2',
          custom_title: t('common.detail.revoke'),
          custom_text: `${temp.apply_user_name || ''}${t('common.detail.delAuditFlow')}`,
          custom_status_cls: 'red',
          auditor_logs: [],
        };
        return logs.length > 0 ? [...logs, undoneNode] : [undoneNode];
      }
      if (temp.audit_msg === 'revocation') {
        undoneNode = {
          act_type: 'startEvent',
          act_status: '2',
          act_def_name: 'start',
          auditor_logs: [],
          custom_text: t('common.detail.undone').replace('{}', ''),
          custom_status_cls: 'green',
        };
        return logs.length > 0 ? [...logs, undoneNode] : [undoneNode];
      }
      undoneNode = {
        act_type: 'revokeAdminEvent',
        act_status: '2',
        custom_title: t('common.detail.revoke'),
        custom_text: temp.audit_msg || '',
        custom_status_cls: 'green',
        auditor_logs: [],
      };
      return logs.length > 0 ? [...logs, undoneNode] : [undoneNode];
    }

    return logs;
  }, [logs, temp.audit_status, temp.audit_type, temp.auditors, temp.audit_msg, temp.apply_user_name]);

  const visibleLogs = useMemo(
    () => displayLogs.map((node, index) => ({ node, index })).filter(({ node }) => shouldShowNode(node)),
    [displayLogs]
  );

  const getNodeStatusText = (node: FlowLogNode, index: number) => {
    if (node.custom_text) {
      return { cls: node.custom_status_cls || 'green', text: node.custom_text };
    }
    if (node.act_type === 'startEvent')
      return {
        cls: 'green',
        text: node.custom_text || t('common.detail.created'),
      };
    if (node.act_type === 'transferEvent') {
      return {
        cls: 'green',
        text: t('common.detail.transfer.to', {
          name: node.transfer_auditor_name || '',
        }),
      };
    }
    if (node.act_type === 'autoPass') return { cls: 'green', text: t('common.detail.approvedAutomatically') };
    if (node.act_type === 'autoReject') return { cls: 'red', text: t('common.detail.rejectedAutomatically') };
    if (node.act_type === 'avoidEvent') return { cls: 'green', text: t('common.detail.status.avoid') };
    if (node.act_type === 'revokeEvent' || node.act_type === 'revokeAdminEvent')
      return {
        cls: node.custom_status_cls || 'green',
        text: node.custom_text || '',
      };
    if (node.act_status === '1' && (index === 0 || (index > 0 && String(displayLogs[index - 1]?.act_status) === '2'))) {
      return {
        cls: 'orange',
        text: donePage ? t('common.detail.status.pending2') : t('common.detail.status.pending'),
      };
    }

    const actStatus = getActStatus(node);
    if (actStatus === 'sendback') {
      return {
        cls: 'sendback',
        text: t('common.detail.sendback.backTo', {
          name: temp.apply_user_name,
        }),
      };
    }
    if (actStatus === 'reject') {
      return { cls: 'red', text: t('common.detail.status.reject') };
    }
    if (actStatus === 'pass') {
      return { cls: 'green', text: t('common.detail.status.pass') };
    }
    return { cls: '', text: '' };
  };

  const getNodeTitle = (node: FlowLogNode) => {
    if (node.custom_title) return node.custom_title;
    if (node.act_type === 'startEvent') return temp.apply_user_name;
    if (node.act_type === 'transferEvent') return node.transfer_by_name || '';
    if (node.act_type === 'revokeEvent') return t('common.detail.revoke');
    if (node.act_type === 'revokeAdminEvent') return t('common.detail.revoke');
    const baseName =
      node.act_def_name === '审核' || node.act_def_name === '簽核' || node.act_def_name === 'Approval'
        ? t('common.detail.audit')
        : node.act_def_name || t('common.detail.audit');

    // 对齐旧版：非 startEvent/autoPass/autoReject 时才追加审核模式后缀
    if (node.act_type === 'startEvent' || node.act_type === 'autoPass' || node.act_type === 'autoReject') {
      return baseName;
    }

    let modeText = '';
    if (node.act_model === 'tjsh') modeText = t('common.detail.auditTypes.tjsh');
    else if (node.act_model === 'hqsh') modeText = t('common.detail.auditTypes.hqsh');
    else if (node.act_model === 'zjsh') modeText = t('common.detail.auditTypes.zjsh');

    return `${baseName}${modeText}`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin />
      </div>
    );
  }

  if (temp.audit_status === 'failed') {
    return (
      <div className={styles.failed}>
        <span className={styles['failed-icon']}>!</span>
        <span>{failedMessage}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t('common.detail.flow')}:</div>
      <div className={styles.timeline}>
        {visibleLogs.map(({ node, index }, idx) => {
          const status = getNodeStatusText(node, index);
          const avatarId = node.act_type === 'transferEvent' ? node.transfer_by : temp.apply_user_id;
          const avatarName = node.act_type === 'transferEvent' ? node.transfer_by_name : temp.apply_user_name;

          const actStatus = getActStatus(node);
          const isDashedLine = node.act_status === '1' || actStatus === 'reject' || actStatus === 'sendback';
          const nodeTitle = getNodeTitle(node);

          return (
            <div className={styles.node} key={`${node.act_type}-${idx}`}>
              <div className={styles['avatar-col']}>
                <div className={styles['avatar-wrap']}>
                  {['startEvent', 'transferEvent'].includes(node.act_type) ? (
                    <Avatar
                      size={32}
                      src={avatarId ? userAvatars[avatarId] || undefined : undefined}
                      style={{ backgroundColor: '#4A5C9B' }}
                    >
                      {(avatarName || '').charAt(0)}
                    </Avatar>
                  ) : (
                    <div className={styles['audit-icon-wrap']}>
                      <AuditUserIcon className={styles['audit-icon']} />
                      {node.act_status === '1' && <ReviewIcon className={styles['review-dot']} />}
                    </div>
                  )}
                  {node.act_status === '2' &&
                    hasSuccessMark(node) &&
                    node.act_type !== 'transferEvent' &&
                    (actStatus === 'reject' || actStatus === 'sendback' ? (
                      <span className={styles['node-fail-badge']}>×</span>
                    ) : (
                      <SuccessIcon className={styles['done-badge']} />
                    ))}
                </div>
                <Divider
                  type="vertical"
                  style={{
                    margin: '10px 0',
                    borderLeftWidth: 2,
                    borderColor: 'rgb(211, 212, 219)',
                    height: '100%',
                    ...(isDashedLine
                      ? {
                          borderLeftStyle: 'dashed',
                        }
                      : {}),
                  }}
                />
              </div>
              <div
                className={styles['node-body']}
                style={{
                  paddingBottom: idx === visibleLogs.length - 1 ? '50px' : '20px',
                }}
              >
                <div className={styles['node-title']} title={nodeTitle}>
                  {nodeTitle}
                </div>
                <div className={`${styles['node-status']} ${styles[status.cls]}`} title={status.text}>
                  {status.text}
                </div>

                {node.act_type === 'transferEvent' && node.reason && <div className={styles.reason}>{node.reason}</div>}

                {node.act_type !== 'startEvent' && node.act_type !== 'transferEvent' && (
                  <div className={styles['auditor-rows']}>
                    {node.auditor_logs.map((group, gIdx) => {
                      const visibleAuditors = getVisibleAuditors(node, group, donePage);
                      if (visibleAuditors.length === 0) return null;
                      return (
                        <div className={styles['auditor-group-wrap']} key={gIdx}>
                          <div className={styles['auditor-group']}>
                            {visibleAuditors.map((auditor, aIdx) => (
                              <div key={auditor.auditor} style={{ width: '100%' }}>
                                <div className={styles['auditor-item-wrap']}>
                                  <div className={styles['auditor-item-row']}>
                                    <div className={styles['auditor-item']}>
                                      <div className={styles['auditor-avatar-wrap']}>
                                        <Avatar
                                          size={31}
                                          src={userAvatars[auditor.auditor] || undefined}
                                          className={styles['auditor-avatar']}
                                          style={{
                                            backgroundColor: '#4A5C9B',
                                          }}
                                        >
                                          {auditor.auditor_name?.charAt(0)}
                                        </Avatar>
                                      </div>
                                      <span className={styles['auditor-name']} title={auditor.auditor_name}>
                                        {auditor.auditor_name}
                                      </span>
                                      {showCountersignBadge(auditor, node.countersign_logs) && (
                                        <Tooltip
                                          overlayClassName={styles['countersign-tooltip']}
                                          title={getCountersignTooltipTitle(auditor, node.countersign_logs)}
                                        >
                                          <span
                                            className={styles['countersign-badge']}
                                            style={lang === 'en-us' ? { left: 0, top: 19 } : { left: 8, top: 19 }}
                                          >
                                            {lang === 'zh-tw' ? (
                                              <CountersignTwIcon className={styles['countersign-icon']} />
                                            ) : lang === 'en-us' ? (
                                              <CountersignEnIcon className={styles['countersign-en-icon']} />
                                            ) : (
                                              <CountersignZhIcon className={styles['countersign-icon']} />
                                            )}
                                          </span>
                                        </Tooltip>
                                      )}
                                      {auditor.audit_status && (
                                        <span
                                          className={`${styles['auditor-status-icon']} ${
                                            auditor.audit_status === 'pass'
                                              ? styles['status-pass']
                                              : styles['status-reject']
                                          }`}
                                        >
                                          {auditor.audit_status === 'pass' ? '✓' : '×'}
                                        </span>
                                      )}
                                    </div>
                                    {shouldShowAuditorTime(auditor) && (
                                      <span className={styles['auditor-time']}>{getAuditorIdeaDateTime(auditor)}</span>
                                    )}
                                  </div>
                                  {shouldShowAuditorIdea(auditor) && (
                                    <div className={styles['audit-idea']}>
                                      <span>{getAuditorIdeaText(auditor)}</span>
                                    </div>
                                  )}
                                </div>
                                {node.act_model === 'zjsh' && aIdx < visibleAuditors.length - 1 && (
                                  <div className={styles['auditor-arrow']}>
                                    <DownOutlined />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {node.auditor_logs.length > 1 && gIdx !== node.auditor_logs.length - 1 && (
                            <div className={styles['group-arrow']}>
                              <DownOutlined />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {visibleLogs.length > 0 && temp.audit_msg !== 'A0701' && temp.audit_msg !== 'A0702' && (
          <div className={styles['end-text']}>
            {temp.audit_status === 'pending' ? t('common.detail.status.flow') : t('common.detail.status.end')}
          </div>
        )}
      </div>
    </div>
  );
};

/** 与 Vue flowLogDetail showCountersign */
function showCountersignBadge(auditor: AuditorLog, countersignLogs: CountersignLogEntry[] | undefined): boolean {
  const auditorId = String(auditor.auditor || '');
  const matched = (countersignLogs || []).filter(e => String(e.countersign_auditor || '') === auditorId);
  // 加签完成后，部分日志不会稳定返回 auditor.countersign='y'，以 countersign_logs 命中为准
  return matched.length > 0;
}

/** 与 Vue flowLogDetail getCountersignReasonTootip */
function getCountersignTooltipTitle(
  auditor: AuditorLog,
  countersignLogs: CountersignLogEntry[] | undefined
): ReactNode {
  const auditorId = String(auditor.auditor || '');
  const arr = (countersignLogs || []).filter(e => String(e.countersign_auditor || '') === auditorId);
  const byName = arr[0]?.countersign_by_name ?? '';
  const reason = arr[0]?.reason ?? '';
  return (
    <div>
      <p>
        {t('common.detail.countersign.by')}
        {byName}
        {t('common.detail.countersign.countersign')}
      </p>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: '12px' }}>{reason}</p>
    </div>
  );
}

/** 流程接口未带 countersign_logs 时，用 countersignLogs 按 act_def_key 补齐 */
function attachCountersignLogsFromFetch(nodes: FlowLogNode[], csLogsFlat: unknown[]): FlowLogNode[] {
  if (!csLogsFlat.length) return nodes;
  return nodes.map(node => {
    if (node.countersign_logs?.length) return node;
    const actKey = node.act_def_key;
    if (!actKey) return node;
    const matched = csLogsFlat.filter(
      e => String((e as Record<string, unknown>).taskDefKey ?? '') === String(actKey)
    ) as CountersignLogEntry[];
    return matched.length ? { ...node, countersign_logs: matched } : node;
  });
}

function collectAvatarUserIds(logs: FlowLogNode[]) {
  const ids = new Set<string>();
  for (const node of logs) {
    if (node.transfer_by) ids.add(node.transfer_by);
    for (const group of node.auditor_logs || []) {
      for (const auditor of group || []) {
        if (auditor.auditor) ids.add(auditor.auditor);
      }
    }
  }
  return ids;
}

function normalizeLogs(logs: FlowLogNode[], temp: ExtAuditRecord, donePage: boolean, csLogsFlat: unknown[] = []) {
  const data = [...(logs || [])];
  const transferInsertions: Array<[number, FlowLogNode]> = [];

  data.forEach((node, idx) => {
    if (
      node.act_status === '1' &&
      node.act_model === 'zjsh' &&
      data.length > 1 &&
      Array.isArray(temp.auditors) &&
      node.auditor_logs?.length
    ) {
      const lastGroup = node.auditor_logs[node.auditor_logs.length - 1] || [];
      const exist = new Set(lastGroup.map(i => i.auditor));
      temp.auditors.forEach(a => {
        if (!exist.has(a.id)) {
          lastGroup.push({
            auditor: a.id,
            auditor_name: a.name,
            audit_status: null,
            countersign: (a as { countersign?: string }).countersign || 'n',
          });
        }
      });
    }

    if (node.transfer_logs?.length) {
      const reversed = [...node.transfer_logs].reverse();
      reversed.forEach(log => {
        transferInsertions.push([
          idx,
          {
            act_type: 'transferEvent',
            act_status: '2',
            act_model: 'tjsh',
            act_def_name: '转审',
            transfer_by: log.transfer_by,
            transfer_by_name: log.transfer_by_name,
            transfer_auditor_name: log.transfer_auditor_name,
            reason: log.reason,
            auditor_logs: [],
          },
        ]);
      });
    }

    if (donePage && node.act_model === 'tjsh' && node.act_status !== '1') {
      node.auditor_logs = (node.auditor_logs || []).map(group => {
        const arr = [...group];
        const idxHandled = arr.findIndex(x => !!x.audit_status);
        if (idxHandled > 0) {
          const [item] = arr.splice(idxHandled, 1);
          arr.unshift(item);
        }
        return arr;
      });
    }
  });

  let offset = 0;
  transferInsertions.forEach(([at, item]) => {
    data.splice(at + offset, 0, item);
    offset += 1;
  });
  return attachCountersignLogsFromFetch(data, csLogsFlat);
}

function getVisibleAuditors(node: FlowLogNode, group: AuditorLog[], donePage: boolean) {
  return group.filter(
    a =>
      node.act_status === '1' ||
      (a.audit_status !== null &&
        !hiddenAuditIdea.has(a.audit_idea || '') &&
        (a.proc_status !== '70' || a.audit_status === 'pass')) ||
      (donePage && node.act_model === 'tjsh')
  );
}

export default FlowLogDetail;
