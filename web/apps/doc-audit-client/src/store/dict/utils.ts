import type { DictList, DictItem } from '@/types';

export function getBizTypeLabel(value: string, dictList: DictList): string {
  for (const item of dictList.bizTypes) {
    if (item.value === value) return item.label;
    if (item.children) {
      const child = item.children.find((c: DictItem) => c.value === value);
      if (child) return child.label;
    }
  }
  return value;
}
