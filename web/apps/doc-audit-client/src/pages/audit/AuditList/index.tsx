import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { Table, Cascader, Button, Avatar, Select, Modal, message, Input, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  fetchApplyPage,
  fetchDonePage,
  fetchTodoPage,
  cancel,
  fetchInfo,
  fetchAuthority,
  audit,
} from '@/api/doc-audit-rest';
import { getBatchUserAvatars } from '@/api/user-management';
import { useDictStore, useAppStore } from '@/store';
import { FileIcon, MultiChoice } from '@/components';
import { toDateString } from '@/utils/date';
import { getBizTypeColumnText } from '@/utils/biz-type';
import AuditDetail from '../AuditDetail';
import type { AuditRecord, QueryParams } from '@/types';
import { AuditListMode } from '../types';
import { collectAuditTypesFromBizTypes, transformTypeParam } from '../utils';
import type { AuditListProps, ListRecord, StatusFilter } from './types';
import styles from './index.module.less';
import { t } from '@/i18n';

const builtInAbstractIcons = new Set(['file', 'folder', 'multiple', 'autosheet', 'article', 'group']);
const PAGE_SIZE_STORAGE_PREFIX = 'doc-audit-client.audit-list.page-size.';

function getPageSizeStorageKey(mode: AuditListMode, systemType?: string) {
  return `${PAGE_SIZE_STORAGE_PREFIX}${systemType || 'default'}.${mode}`;
}

function getStoredPageSize(mode: AuditListMode, systemType?: string): number {
  if (typeof window === 'undefined') return 50;
  const raw = window.localStorage.getItem(getPageSizeStorageKey(mode, systemType));
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return parsed;
}

function getApplyAuditorList(record: ListRecord) {
  const auditors = record.auditors;
  if (!auditors || auditors === ('' as never)) return null;
  if (!Array.isArray(auditors)) return null;
  if (auditors.length === 0) return [];
  if (record.audit_status === 'undone') return [];
  if (record.audit_status === 'pass' || record.audit_status === 'reject') {
    return auditors.filter(item => item.status === 'pass' || item.status === 'reject');
  }
  return auditors;
}

function getApplyAuditorText(record: ListRecord, showShort: boolean, lang: string) {
  const list = getApplyAuditorList(record);
  if (list === null) return '';
  if (list.length === 0) return '--';
  const separator = lang === 'en-us' ? ',' : '、';
  if (list.length > 1 && showShort) {
    const firstName = list[0]?.name || '';
    if (firstName.length > 15) return `${firstName.slice(0, 15)}...`;
    return `${firstName}...`;
  }
  return list
    .map(item => item.name || '')
    .filter(Boolean)
    .join(separator);
}

function getApplyFirstAuditorId(record: ListRecord) {
  const list = getApplyAuditorList(record);
  if (!list || list.length === 0) return '';
  return list[0]?.id || '';
}

const AuditList: React.FC<AuditListProps> = ({ mode, onRefresh }) => {
  const dictList = useDictStore(s => s.dictList);
  const { context, lang } = useAppStore();
  const isTodo = mode === AuditListMode.Todo;
  const isDone = mode === AuditListMode.Done;
  const isApply = mode === AuditListMode.Apply;

  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<ListRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<ListRecord[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [tableHeight, setTableHeight] = useState(300);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const [pagination, setPagination] = useState(() => ({
    current: 1,
    pageSize: getStoredPageSize(mode, context?.systemType),
    total: 0,
  }));
  const [applyType, setApplyType] = useState<string[]>(context?.applicationType ? [context.applicationType] : ['']);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [searchValue, setSearchValue] = useState<Array<{ type: string; val: string }>>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchAuditType, setBatchAuditType] = useState<'pass' | 'reject'>('pass');
  const [batchAuditRemark, setBatchAuditRemark] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchProgressModalOpen, setBatchProgressModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchCommentRequired, setBatchCommentRequired] = useState(false);

  const currentId = useMemo(() => (selectedRows.length === 1 ? selectedRows[0]?.id || '' : ''), [selectedRows]);

  const searchTypes = isApply
    ? [{ label: t('common.column.abstract'), value: 'abstracts' }]
    : [
        { label: t('common.column.abstract'), value: 'abstracts' },
        { label: t('common.column.applyUserName'), value: 'apply_user_names' },
      ];

  const doneStatusOptions: Array<{ label: string; value: StatusFilter }> = [
    { label: t('common.auditStatuss.all'), value: '' },
    { label: t('common.auditStatuss.reject'), value: 'reject' },
    { label: t('common.auditStatuss.pass'), value: 'pass' },
    { label: t('common.auditStatuss.undone'), value: 'undone' },
    { label: t('common.auditStatuss.transfer'), value: 'transfer' },
    // { label: t('common.auditStatuss.sendback'), value: 'sendback' },
  ];

  const applyStatusOptions: Array<{ label: string; value: StatusFilter }> = [
    { label: t('common.auditStatuss.all'), value: '' },
    { label: t('common.auditStatuss.pending'), value: 'pending' },
    { label: t('common.auditStatuss.reject'), value: 'reject' },
    { label: t('common.auditStatuss.pass'), value: 'pass' },
    { label: t('common.auditStatuss.undone'), value: 'undone' },
    // { label: t('common.auditStatuss.sendback'), value: 'sendback' },
  ];

  const bizTypeOptions = useMemo(
    () =>
      dictList.bizTypes.map(item => ({
        value: item.value,
        label: item.value === '' ? t('common.bizTypes.all') : t(`common.bizTypes.${item.value}`) || item.label,
        children: item.children?.map(child => ({
          value: child.value,
          label: t(`common.bizTypes.${child.value}`) || child.label,
        })),
      })),
    [dictList.bizTypes]
  );

  const loadUserAvatars = async (userIds: string[]) => {
    try {
      const res = await getBatchUserAvatars(userIds);
      setUserAvatars(res || {});
    } catch {
      setUserAvatars({});
    }
  };

  const fetchData = useCallback(
    async (options?: { keepCurrentId?: string }) => {
      setLoading(true);
      try {
        const requestLimit = pagination.pageSize;
        const selectedType = applyType[applyType.length - 1] || '';
        const rawType = context?.applicationType || selectedType;
        const searchParams: QueryParams = {
          offset: (pagination.current - 1) * requestLimit,
          limit: requestLimit,
          type: transformTypeParam(rawType, collectAuditTypesFromBizTypes(dictList.bizTypes)),
          status: isDone || isApply ? statusFilter || '' : undefined,
        };

        searchValue.forEach(item => {
          if (item.type === 'abstracts') {
            searchParams.abstracts = searchParams.abstracts || [];
            searchParams.abstracts.push(item.val);
          } else if (item.type === 'apply_user_names') {
            searchParams.apply_user_names = searchParams.apply_user_names || [];
            searchParams.apply_user_names.push(item.val);
          }
        });

        const res = isTodo
          ? await fetchTodoPage(searchParams)
          : isDone
            ? await fetchDonePage(searchParams)
            : await fetchApplyPage(searchParams);

        const entries: ListRecord[] = res.entries || [];

        // 待办页：操作成功后若当前页已空，自动回退到上一页并重新请求
        if (isTodo && pagination.current > 1 && entries.length === 0) {
          setPagination(prev => ({
            ...prev,
            total: res.total_count,
            current: Math.max(1, prev.current - 1),
          }));
          return;
        }

        setDataList(entries);
        setPagination(prev => ({ ...prev, total: res.total_count }));

        const userIds = [
          ...new Set(
            entries
              .flatMap(item =>
                [item.apply_user_id, item.last_auditor_id, getApplyFirstAuditorId(item)].filter((id): id is string =>
                  Boolean(id)
                )
              )
              .filter((id): id is string => Boolean(id))
          ),
        ];
        if (userIds.length > 0) {
          void loadUserAvatars(userIds);
        } else {
          setUserAvatars({});
        }

        // 对齐 Vue applyList：reload 时优先保留当前选中项，且使用最新 entries 中的数据对象。
        const keepCurrentId = options?.keepCurrentId;
        if (entries.length > 0) {
          if (isTodo) {
            const applyIdFromUrl = new URLSearchParams(window.location.search).get('applyId');
            if (applyIdFromUrl) {
              const found = entries.find(item => item.id === applyIdFromUrl);
              if (found) {
                setSelectedRows([found]);
              } else {
                setSelectedRows([entries[0]]);
              }
            } else {
              const found = keepCurrentId ? entries.find(item => item.id === keepCurrentId) : undefined;
              const nextRow = found || entries[0];
              setSelectedRows([nextRow]);
            }
          } else {
            const found = keepCurrentId ? entries.find(item => item.id === keepCurrentId) : undefined;
            const nextRow = found || entries[0];
            setSelectedRows([nextRow]);
          }
        } else {
          setSelectedRows([]);
        }
      } catch (error) {
        console.error('Failed to fetch audit list:', error);
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.current,
      pagination.pageSize,
      applyType,
      statusFilter,
      searchValue,
      isTodo,
      isDone,
      isApply,
      context?.applicationType,
      dictList.bizTypes,
    ]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getPageSizeStorageKey(mode, context?.systemType), String(pagination.pageSize));
  }, [mode, context?.systemType, pagination.pageSize]);

  useEffect(() => {
    const updateTableHeight = () => {
      const rootHeight = rootRef.current?.clientHeight || 0;
      const headerHeight = headerRef.current?.offsetHeight || 0;
      const nextHeight = Math.max(rootHeight - headerHeight - 120, 120);
      setTableHeight(nextHeight);
    };
    updateTableHeight();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateTableHeight);
    if (rootRef.current) observer.observe(rootRef.current);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [isTodo]);

  const getBizTypeText = (record: AuditRecord) => getBizTypeColumnText(record, lang);

  const getAbstractText = (record: AuditRecord) => record.workflow?.abstract_info?.text || record.doc_name || '';

  // 仅用于已处理列表，严格对齐 Vue doneList 的状态展示逻辑
  const renderDoneStatus = (status: string) => {
    if (status === 'pending') {
      return <span className={styles['status-green']}>{t('common.auditStatuss.pending-done')}</span>;
    }
    if (status === 'avoid') {
      return <span className={styles['status-green']}>{t('common.auditStatuss.avoid')}</span>;
    }
    if (status === 'pass') {
      return <span className={styles['status-green']}>{t('common.auditStatuss.pass')}</span>;
    }
    if (status === 'transfer') {
      return <span className={styles['status-green']}>{t('common.auditStatuss.transfer')}</span>;
    }
    if (status === 'reject') {
      return <span className={styles['status-red']}>{t('common.auditStatuss.reject')}</span>;
    }
    if (status === 'failed') {
      return <span className={styles['status-red']}>{t('common.auditStatuss.failed')}</span>;
    }
    if (status === 'sendback') {
      return <span className={styles['status-red']}>{t('common.auditStatuss.sendback')}</span>;
    }
    if (status === 'undone' || status === 'flow_undone') {
      return <span className={styles['status-gray']}>{t('common.auditStatuss.undone')}</span>;
    }
    return <span>{t(`common.auditStatuss.${status}`) || status}</span>;
  };

  const handleCancel = (record: AuditRecord) => {
    const confirmText =
      lang === 'en-us'
        ? t('common.detail.revokeMsg.info.sureRevoke1') + t('common.detail.revokeMsg.info.sureRevoke2')
        : t('common.detail.revokeMsg.info.sureRevoke1') +
          getBizTypeColumnText(record, lang) +
          t('common.detail.revokeMsg.info.sureRevoke2');
    Modal.confirm({
      title: t('common.detail.auditMsg.title'),
      content: confirmText,
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
        try {
          await cancel(record.id);
          message.success(t('common.detail.revokeMsg.confirmMSg'));
          void fetchData();
        } catch {
          message.error(t('message.UndoFailed'));
        }
      },
    });
  };

  // 计算单个审核意见是否必填
  const computeCommentRequired = useCallback((type: 'pass' | 'reject', record: ListRecord) => {
    const config = record.strategy_configs?.audit_idea_config;
    if (!config) return false;
    if (type === 'pass') {
      return config.audit_idea_switch === true && config.status === '2';
    }

    return (
      (config.audit_idea_switch === true && config.status === '2') ||
      (config.audit_idea_switch === true && config.status === '1')
    );
  }, []);

  const computeBatchCommentRequired = useCallback((type: 'pass' | 'reject', rows: ListRecord[]) => {
    return rows.some(detail => {
      return computeCommentRequired(type, detail);
    });
  }, []);

  const openBatchAuditModal = (type: 'pass' | 'reject') => {
    if (!isTodo || selectedRows.length <= 1) return;
    setBatchAuditType(type);
    setBatchAuditRemark('');
    setBatchProgress(0);
    setBatchCommentRequired(computeBatchCommentRequired(type, selectedRows));
    setBatchModalOpen(true);
  };

  const submitBatchAudit = async () => {
    if (selectedRows.length <= 1) {
      setBatchModalOpen(false);
      return;
    }
    const requiredByRule = computeBatchCommentRequired(batchAuditType, selectedRows);
    setBatchCommentRequired(requiredByRule);
    if (requiredByRule && !batchAuditRemark.trim()) {
      message.warning(t('message.emptyIdea'));
      return;
    }

    setBatchModalOpen(false);
    setBatchProgress(0);
    setBatchProgressModalOpen(true);
    setBatchSubmitting(true);
    let successCount = 0;
    let failedCount = 0;
    const rows = [...selectedRows];

    try {
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        try {
          const detail = (await fetchInfo(row.id)) as AuditRecord & {
            task_id?: string | null;
          };
          if (!detail.task_id) {
            failedCount += 1;
            continue;
          }
          const authority = (await fetchAuthority({
            proc_inst_id: row.proc_inst_id,
            type: 'task',
          })) as { result?: boolean };
          if (!authority?.result) {
            failedCount += 1;
            continue;
          }
          await audit({
            id: row.id,
            task_id: detail.task_id || undefined,
            audit_idea: batchAuditType === 'pass',
            audit_msg: batchAuditRemark || '',
            attachments: [],
          });
          successCount += 1;
        } catch {
          failedCount += 1;
        } finally {
          setBatchProgress(Number((((i + 1) * 100) / rows.length).toFixed(2)));
        }
      }
    } finally {
      setBatchSubmitting(false);
      setBatchProgressModalOpen(false);
    }

    // 对齐 doc-audit-client batchAudit.vue：循环结束后若 errorNum < 总数则只 toast 成功「批量审核成功」；
    // 部分失败时循环里可能已逐条 confirmModal，末尾不再叠加失败汇总。
    // React 版无逐条弹窗，故：有成功则 success；仅当全部失败时再用 warning 汇总。
    if (successCount > 0) {
      message.success(t('message.batchHandle'));
    } else if (failedCount > 0) {
      message.warning(`${t('message.submitErr')} (${failedCount}/${rows.length})`);
    }
    void fetchData({ keepCurrentId: currentId });
    onRefresh?.();
  };

  const columns: ColumnsType<ListRecord> = useMemo(() => {
    const abstractCol = {
      title: t('common.column.abstract'),
      dataIndex: 'abstract',
      key: 'abstract',
      ellipsis: true,
      render: (_: unknown, record: ListRecord) => {
        const text = getAbstractText(record);
        const abstractIcon = record.workflow?.abstract_info?.icon;
        const hasWorkflow = record.workflow != null;
        const showWorkflowIcon = typeof abstractIcon !== 'undefined';
        return (
          <div className={styles['abstract-cell']}>
            {hasWorkflow ? (
              showWorkflowIcon ? (
                builtInAbstractIcons.has(abstractIcon as string) ? (
                  <FileIcon
                    fileName={record.doc_name}
                    docType={abstractIcon === 'folder' ? 'folder' : 'file'}
                    size={24}
                  />
                ) : (
                  <img className={styles['custom-abstract-icon']} src={abstractIcon} alt="" />
                )
              ) : null
            ) : null}
            <span className={styles['abstract-text']} title={text}>
              {text}
            </span>
          </div>
        );
      },
    };

    if (isDone) {
      return [
        {
          title: t('common.column.bizType'),
          dataIndex: 'biz_type',
          key: 'biz_type',
          ellipsis: true,
          render: (_: unknown, r: ListRecord) => getBizTypeText(r),
        },
        abstractCol,
        {
          title: t('common.column.applyUserName'),
          dataIndex: 'apply_user_name',
          key: 'apply_user_name',
          ellipsis: true,
          render: (text: string, r: ListRecord) => (
            <div className={styles['user-cell']}>
              {userAvatars[r.apply_user_id] ? (
                <Avatar size={24} src={userAvatars[r.apply_user_id]} />
              ) : (
                <Avatar size={24} style={{ backgroundColor: '#4A5C9B' }}>
                  {text?.charAt(0)}
                </Avatar>
              )}
              <span className={styles['user-name']} title={text}>
                {text}
              </span>
            </div>
          ),
        },
        {
          title: t('common.column.processTime'),
          dataIndex: 'end_time',
          key: 'end_time',
          ellipsis: true,
          render: (text: string) => toDateString(text),
        },
        {
          title: t('common.column.auditor'),
          dataIndex: 'last_auditor',
          key: 'last_auditor',
          ellipsis: true,
          render: (text: string, r: ListRecord) =>
            text ? (
              <div className={styles['user-cell']}>
                {r.last_auditor_id && userAvatars[r.last_auditor_id] ? (
                  <Avatar size={24} src={userAvatars[r.last_auditor_id]} />
                ) : (
                  <Avatar size={24} style={{ backgroundColor: '#4A5C9B' }}>
                    {text?.charAt(0)}
                  </Avatar>
                )}
                <span className={styles['user-name']}>{text}</span>
              </div>
            ) : (
              '---'
            ),
        },
        {
          title: t('common.column.status'),
          dataIndex: 'audit_status',
          key: 'audit_status',
          ellipsis: true,
          render: (s: string) => (
            <span title={s === 'pending' ? t('common.auditStatuss.pending-done') : t(`common.auditStatuss.${s}`) || s}>
              {renderDoneStatus(s)}
            </span>
          ),
        },
      ];
    }

    if (isApply) {
      return [
        {
          title: t('common.column.bizType'),
          dataIndex: 'biz_type',
          key: 'biz_type',
          ellipsis: true,
          render: (_: unknown, r: ListRecord) => getBizTypeText(r),
        },
        {
          ...abstractCol,
        },
        {
          title: t('common.column.auditor'),
          dataIndex: 'last_auditor',
          key: 'last_auditor',
          ellipsis: true,
          render: (_: string, r: ListRecord) => {
            if (r.result === 'avoid' || r.audit_status === 'avoid') {
              return <span className={styles['status-green']}>{t('common.auditor.free')}</span>;
            }
            const shortText = getApplyAuditorText(r, true, lang);
            if (shortText === '') return null;
            if (shortText === '--') return <span>--</span>;
            const fullText = getApplyAuditorText(r, false, lang);
            const firstAuditorId = getApplyFirstAuditorId(r);
            return (
              <div className={styles['user-cell']}>
                {firstAuditorId && userAvatars[firstAuditorId] ? (
                  <Avatar size={24} src={userAvatars[firstAuditorId]} />
                ) : (
                  <Avatar size={24} style={{ backgroundColor: '#4A5C9B' }}>
                    {shortText?.charAt(0)}
                  </Avatar>
                )}
                <span className={styles['user-name']} title={fullText}>
                  {shortText}
                </span>
              </div>
            );
          },
        },
        {
          title: t('common.column.auditStatus'),
          dataIndex: 'audit_status',
          key: 'audit_status',
          ellipsis: true,
          render: (status: string) => (
            <span title={t(`common.auditStatuss.${status}`) || status}>
              {status === 'pending' ? (
                <span style={{ color: '#eb7830' }}>{t('common.auditStatuss.pending')}</span>
              ) : status === 'pass' || status === 'avoid' ? (
                <span style={{ color: '#4bbe47' }}>{t(`common.auditStatuss.${status}`)}</span>
              ) : status === 'undone' || status === 'flow_undone' ? (
                <span style={{ color: '#fe666a' }}>{t('common.auditStatuss.undone')}</span>
              ) : (
                <span style={{ color: '#f66b76' }}>{t(`common.auditStatuss.${status}`) || status}</span>
              )}
            </span>
          ),
        },
      ];
    }

    const baseCols: ColumnsType<ListRecord> = [
      {
        title: t('common.column.bizType'),
        dataIndex: 'biz_type',
        key: 'biz_type',
        ellipsis: true,
        render: (_, record) => getBizTypeText(record),
      },
      abstractCol,
    ];

    if (isTodo) {
      baseCols.push(
        {
          title: t('common.column.applyUserName'),
          dataIndex: 'apply_user_name',
          key: 'apply_user_name',
          ellipsis: true,
          render: (text, record) => (
            <div className={styles['user-cell']}>
              {userAvatars[record.apply_user_id] ? (
                <Avatar size={28} src={userAvatars[record.apply_user_id]} />
              ) : (
                <Avatar size={28} style={{ backgroundColor: '#4A5C9B' }}>
                  {text?.charAt(0)}
                </Avatar>
              )}
              <span className={styles['user-name']} title={text}>
                {text}
              </span>
            </div>
          ),
        },
        {
          title: t('common.column.applyTime'),
          dataIndex: 'apply_time',
          key: 'apply_time',
          ellipsis: true,
          render: (text: string) => toDateString(text),
        }
      );
    } else {
      baseCols.push(
        {
          title: t('common.column.auditStatus'),
          dataIndex: 'audit_status',
          key: 'audit_status',
          render: status => <span>{t(`common.auditStatuss.${status}`) || status}</span>,
        },
        {
          title: t('common.column.applyTime'),
          dataIndex: 'apply_time',
          key: 'apply_time',
          ellipsis: true,
          render: (text: string) => toDateString(text),
        },
        {
          title: t('common.operation.name'),
          key: 'operation',
          render: (_, record) =>
            record.audit_status === 'pending' ? (
              <Button type="link" size="small" onClick={() => handleCancel(record)}>
                {t('common.detail.operation.revoke')}
              </Button>
            ) : null,
        }
      );
    }
    return baseCols;
  }, [isApply, isDone, isTodo, searchValue, userAvatars]);

  const selectedRowKeys = useMemo(() => selectedRows.map(r => r.id), [selectedRows]);

  const hasActiveFilter = useMemo(() => {
    // applicationType 来自宿主上下文时，不视为用户主动筛选
    const hasTypeFilter = !context?.applicationType && (applyType[applyType.length - 1] || '') !== '';
    const hasStatus = (isDone || isApply) && statusFilter !== '';
    const hasSearch = searchValue.some(s => (s.val || '').trim() !== '');
    return hasTypeFilter || hasStatus || hasSearch;
  }, [context?.applicationType, applyType, isDone, isApply, statusFilter, searchValue]);

  const emptyMainText = hasActiveFilter
    ? t('common.empty.none')
    : isApply
      ? t('common.empty.apply')
      : isDone
        ? t('common.empty.done')
        : t('common.empty.todo');

  return (
    <div className={styles.container} ref={rootRef}>
      <div className={styles.header} ref={headerRef}>
        <div className={styles['header-left']}>
          {!context?.applicationType && (
            <Cascader
              options={bizTypeOptions}
              value={applyType}
              onChange={value => {
                setApplyType(value as string[]);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              expandTrigger="hover"
              displayRender={(labels, selectedOptions) =>
                selectedOptions?.[selectedOptions.length - 1]?.value
                  ? labels[labels.length - 1]
                  : t('common.bizTypes.name')
              }
              style={{ width: 150 }}
              allowClear={false}
            />
          )}
          {(isDone || isApply) && (
            <div className={styles['status-filter-wrap']}>
              <Select<StatusFilter>
                value={statusFilter}
                style={{ width: 152 }}
                onChange={value => {
                  setStatusFilter(value);
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className={styles['status-filter']}
                options={isApply ? applyStatusOptions : doneStatusOptions}
                labelRender={({ label, value }) => (
                  <span className={styles['status-filter-label']}>
                    {value === '' ? t('common.column.auditStatus') : label}
                  </span>
                )}
              />
            </div>
          )}
        </div>
        <div className={styles['header-right']}>
          {isTodo && selectedRows.length > 1 && (
            <div className={styles['todo-batch-actions']}>
              <span className={styles['todo-batch-count']}>{t('common.selectNum', { num: selectedRows.length })}</span>
              <Button type="primary" loading={batchSubmitting} onClick={() => void openBatchAuditModal('pass')}>
                {t('common.detail.operation.pass')}
              </Button>
              <Button loading={batchSubmitting} onClick={() => void openBatchAuditModal('reject')}>
                {t('common.detail.operation.reject')}
              </Button>
            </div>
          )}
          <MultiChoice
            value={searchValue}
            onChange={value => {
              setSearchValue(value);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            types={searchTypes}
            placeholder={isApply ? t('common.search') : t('common.searches')}
          />
        </div>
      </div>

      <div className={styles['todo-content']} style={context?.systemType !== 'adp' ? { overflowX: 'auto' } : {}}>
        <div
          className={classNames(styles['table-wrapper'], dataList.length === 0 ? styles['table-empty-wrapper'] : '')}
          style={{
            ...(context?.systemType !== 'adp' ? { minWidth: 610 } : {}),
          }}
        >
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={dataList}
            locale={{
              emptyText: (
                <div className={styles['table-empty']} style={{ height: tableHeight }}>
                  {!loading && (
                    <>
                      <div
                        className={classNames(
                          styles['empty-image'],
                          hasActiveFilter ? styles['empty-image-active'] : ''
                        )}
                      />
                      <div className={styles['empty-text']}>{emptyMainText}</div>
                    </>
                  )}
                </div>
              ),
            }}
            tableLayout="fixed"
            scroll={{
              y: tableHeight,
            }}
            rowSelection={
              isTodo
                ? {
                    selectedRowKeys,
                    onChange: (_, rows) => {
                      setSelectedRows(rows);
                    },
                  }
                : undefined
            }
            onRow={record => ({
              onClick: () => {
                setSelectedRows([record]);
              },
              className: record.id === currentId ? styles['row-active'] : '',
            })}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100', '200'],
              onChange: (page, pageSize) =>
                setPagination(prev => ({
                  ...prev,
                  current: pageSize !== prev.pageSize ? 1 : page,
                  pageSize,
                })),
            }}
          />
        </div>
        {isTodo && currentId && (
          <div className={styles['detail-wrapper']}>
            <AuditDetail
              id={currentId}
              auditStatus={selectedRows[0]?.audit_status || ''}
              onAuditResult={() => {
                void fetchData({ keepCurrentId: currentId });
                onRefresh?.();
              }}
            />
          </div>
        )}
        {isTodo && selectedRows.length > 1 && (
          <div className={styles['multi-detail-placeholder']}>
            <div className={styles['multi-detail-head']}>{t('common.selectApply', { num: selectedRows.length })}</div>
            <div className={styles['multi-detail-body']}>
              <div className={styles['multi-detail-empty']}>{t('common.noDetail')}</div>
            </div>
          </div>
        )}
        {selectedRowKeys.length === 0 && dataList.length > 0 && (
          <div className={styles['multi-detail-placeholder']}>
            <div className={styles['multi-detail-body']}>
              <div className={styles['multi-detail-empty']}>{t('common.selectOneApply')}</div>
            </div>
          </div>
        )}
        {isDone && currentId && (
          <div className={styles['detail-wrapper']}>
            <AuditDetail
              id={currentId}
              donePage
              doneStatus={selectedRows[0]?.audit_status || ''}
              auditStatus={selectedRows[0]?.audit_status || ''}
            />
          </div>
        )}
        {isApply && currentId && (
          <div className={styles['detail-wrapper']}>
            <AuditDetail
              id={currentId}
              applyPage
              auditStatus={selectedRows[0]?.audit_status || ''}
              onAuditResult={() => {
                void fetchData({ keepCurrentId: currentId });
                onRefresh?.();
              }}
            />
          </div>
        )}
      </div>
      <Modal
        title={batchAuditType === 'pass' ? t('common.detail.operation.pass') : t('common.detail.operation.reject')}
        open={batchModalOpen}
        centered
        maskClosable={false}
        destroyOnClose
        onCancel={() => {
          if (batchSubmitting) return;
          setBatchModalOpen(false);
        }}
        onOk={() => void submitBatchAudit()}
        okText={t('common.detail.auditMsg.confirm')}
        cancelText={t('common.detail.auditMsg.cancel')}
        okButtonProps={{
          disabled: batchCommentRequired && !batchAuditRemark.trim(),
        }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
      >
        <div className={classNames(styles['batch-confirm-text'], batchCommentRequired ? styles.required : '')}>
          {batchAuditType === 'pass' ? t('common.detail.auditMsg.agree.yes') : t('common.detail.auditMsg.reject.no')}
        </div>
        <Input.TextArea
          className={styles['batch-remark-textarea']}
          value={batchAuditRemark}
          onChange={e => setBatchAuditRemark(e.target.value)}
          rows={4}
          maxLength={500}
          showCount
          placeholder={t(
            batchCommentRequired ? 'common.detail.operation.requiredPlaceholder' : 'common.detail.operation.placeholder'
          )}
          style={{ resize: 'none' }}
        />
      </Modal>
      <Modal
        title={t('common.handleAudit', { num: batchProgress })}
        open={batchProgressModalOpen}
        centered
        maskClosable={false}
        closable={false}
        footer={null}
        destroyOnClose
        className={styles['batch-progress-modal']}
      >
        <Progress percent={batchProgress} showInfo={false} strokeColor="#8BA7DD" />
      </Modal>
    </div>
  );
};

export default AuditList;
