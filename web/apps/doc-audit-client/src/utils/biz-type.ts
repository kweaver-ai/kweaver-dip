import type { AuditRecord } from '@/types';
import { t } from '@/i18n';

/** 与列表「申请类型」列 {@link AuditList} getBizTypeText 完全一致 */
export function getBizTypeColumnText(record: AuditRecord, lang: string): string {
  const pluginLabel = record.workflow?.front_plugin_info?.label;
  const pluginBizTypeText =
    pluginLabel?.[lang] ??
    pluginLabel?.[lang.replace('_', '-')] ??
    pluginLabel?.['zh-cn'] ??
    pluginLabel?.['zh-tw'] ??
    pluginLabel?.['en-us'];
  if (pluginBizTypeText) return pluginBizTypeText + t('common.column.apply');
  return t(`common.dataBizTypes.${record.biz_type}`) || record.biz_type;
}
