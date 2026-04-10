import { create } from 'zustand';
import type { DictItem, DictList } from '@/types';
import { initialDictList } from './constants';

interface DictState {
  dictList: DictList;
  setBizTypes: (bizTypes: DictItem[]) => void;
}

export const useDictStore = create<DictState>(set => ({
  dictList: initialDictList,
  setBizTypes: bizTypes =>
    set(state => ({
      dictList: {
        ...state.dictList,
        bizTypes,
      },
    })),
}));
