import { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Tabs, Badge as AntBadge } from 'antd';
import { t } from '@/i18n';
import { setSearchParam, getSearchParam } from '@/utils/url-search-params';
import { processCategory } from '@/api/workflow-rest';
import { fetchTodoPage } from '@/api/doc-audit-rest';
import { useDictStore, useAppStore } from '@/store';
import { AuditListMode, type AuditTabKey } from './types';
import type { DictItem } from '@/types';
import { collectAuditTypesFromBizTypes, transformTypeParam } from './utils';
import AuditList from './AuditList';
import styles from './index.module.less';

const AuditIndex: React.FC = () => {
  const dictList = useDictStore(s => s.dictList);
  const { context, lang } = useAppStore();
  const [activeTab, setActiveTab] = useState<AuditTabKey>('todo');
  const [todoCount, setTodoCount] = useState(0);
  const [processCategoryInited, setProcessCategoryInited] = useState(false);

  useEffect(() => {
    const target = getSearchParam('target') as AuditTabKey;
    if (target && ['todo', 'done', 'apply'].includes(target)) {
      setActiveTab(target);
    }
    loadTodoCount();
    initProcessCategory();
  }, []);

  const loadTodoCount = async () => {
    try {
      const res = await fetchTodoPage({
        offset: 0,
        limit: 1,
        type: transformTypeParam(context?.applicationType || '', collectAuditTypesFromBizTypes(dictList.bizTypes)),
      });
      setTodoCount(res.total_count || 0);
    } catch (error) {
      console.error('Failed to fetch todo count:', error);
    }
  };

  const initProcessCategory = useCallback(async () => {
    const tenantId = context?.tenantId || '';

    const baseBizTypes = dictList.bizTypes
      .filter(bizTypeItem => {
        if (tenantId === 'af_workflow') {
          return bizTypeItem.value === '';
        }
        if (bizTypeItem.value === '') return true;
        return false;
      })
      .map(item => {
        if (item.value !== 'share') return { ...item };
        let nextChildren = item.children ? [...item.children] : [];
        nextChildren = nextChildren.filter(i => !['realname', 'anonymous'].includes(i.value));
        return { ...item, children: nextChildren };
      });

    try {
      const processCategoryList = (await processCategory(context?.tenantId)) as Array<{
        audit_type?: string;
        entry?: string;
        name?: string;
        resubmit?: unknown;
        label?: Record<string, string>;
      }>;
      const nextBizTypes = [...baseBizTypes];
      processCategoryList.forEach(item => {
        if (
          !item ||
          typeof item.audit_type !== 'string' ||
          ['perm', 'owner', 'inherit', 'anonymous'].includes(item.audit_type)
        ) {
          return;
        }
        const alreadyExists = nextBizTypes.some(bizType => bizType.value === item.audit_type);
        if (alreadyExists) return;
        const labelFromI18n =
          item.label?.[lang] ?? item.label?.[lang.replace('_', '-')] ?? item.label?.['zh-cn'] ?? item.audit_type;
        nextBizTypes.push({
          label: `${labelFromI18n}${t('common.column.apply')}`,
          value: item.audit_type,
          entry: item.entry,
          name: item.name,
          resubmit: item.resubmit,
        } as DictItem);
      });
      useDictStore.setState(state => ({
        dictList: {
          ...state.dictList,
          bizTypes: nextBizTypes,
        },
      }));
    } catch (error) {
      console.error('Failed to init process category:', error);
    }
    setProcessCategoryInited(true);
  }, []);

  const handleTabChange = (key: string) => {
    const tabKey = key as AuditTabKey;
    setActiveTab(tabKey);
    setSearchParam('target', tabKey);
  };

  const items = [
    {
      key: 'todo',
      label: (
        <span>
          {t('common.tabs.tasks')}
          <AntBadge dot={todoCount > 0} offset={[4, 0]} />
        </span>
      ),
      children: activeTab === 'todo' && <AuditList mode={AuditListMode.Todo} onRefresh={loadTodoCount} />,
    },
    {
      key: 'done',
      label: t('common.tabs.historys'),
      children: activeTab === 'done' && <AuditList mode={AuditListMode.Done} />,
    },
    {
      key: 'apply',
      label: t('common.tabs.applys'),
      children: activeTab === 'apply' && <AuditList mode={AuditListMode.Apply} />,
    },
  ];

  return (
    processCategoryInited && (
      <div
        className={classNames(
          styles['audit-container'],
          context?.systemType === 'adp' ? styles['audit-container-absolute'] : ''
        )}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} className={styles['audit-tabs']} />
      </div>
    )
  );
};

export default AuditIndex;
