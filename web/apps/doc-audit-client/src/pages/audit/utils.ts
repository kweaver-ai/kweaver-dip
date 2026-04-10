import type { DictItem } from '@/types';

export function collectAuditTypesFromBizTypes(bizTypes: DictItem[]): string[] {
  const types: string[] = [];
  bizTypes.forEach(item => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      item.children.forEach(child => {
        if (child.value) types.push(child.value);
      });
      return;
    }
    if (item.value) types.push(item.value);
  });
  return [...new Set(types)];
}

export function transformTypeParam(type: string, auditTypes: string[]): string {
  if (!type && auditTypes.length > 0) {
    if (auditTypes.includes('realname')) {
      return ['perm', 'owner', 'inherit', ...auditTypes].join(',');
    }
    return auditTypes.join(',');
  }
  if (type === 'realname') {
    return ['realname', 'perm', 'owner', 'inherit'].join(',');
  }
  return type;
}
